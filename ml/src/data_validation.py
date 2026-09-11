"""Validation utilities for medication-event records."""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pandas as pd

VALID_DOSE_STATUSES = {"TAKEN", "PENDING", "MISSED"}
VALID_TIME_PERIODS = {"MORNING", "AFTERNOON", "EVENING", "NIGHT"}
VALID_DAY_OF_WEEK = {
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
}
VALID_FREQUENCIES = {"ONCE_DAILY", "TWICE_DAILY", "THRICE_DAILY", "AS_NEEDED"}


def _normalise_text(value: Any) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip().upper()


def _is_valid_time(value: Any) -> bool:
    if pd.isna(value):
        return True

    text = str(value).strip()
    if not text:
        return True

    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            datetime.strptime(text, fmt)
            return True
        except ValueError:
            continue
    return False


def detect_duplicates(df: pd.DataFrame, subset=None) -> tuple[int, list[int]]:
    """Return duplicate count and row indexes for duplicate medication records."""
    if subset is None:
        subset = ["patient_id", "medicine_id", "scheduled_date", "scheduled_time"]

    duplicated_mask = df.duplicated(subset=subset, keep=False)
    duplicate_rows = df.index[duplicated_mask].tolist()
    return int(duplicated_mask.sum() / 2), duplicate_rows


def detect_invalid_records(df: pd.DataFrame) -> dict[str, Any]:
    """Return a structured invalid-record report without deleting rows."""
    report = {
        "total_records": int(len(df)),
        "missing_values": {},
        "invalid_statuses": 0,
        "invalid_time_periods": 0,
        "invalid_day_of_week": 0,
        "invalid_frequency": 0,
        "negative_delay_minutes": 0,
        "negative_dose_quantity": 0,
        "timestamp_errors": 0,
        "acknowledged_before_schedule": 0,
        "duplicate_rows": 0,
        "invalid_rows": [],
        "quality_issues": [],
    }

    required_cols = [
        "patient_id",
        "medicine_id",
        "scheduled_date",
        "scheduled_time",
        "dose_status",
        "day_of_week",
        "time_period",
        "frequency",
    ]
    missing_columns = [col for col in required_cols if col not in df.columns]
    if missing_columns:
        for col in missing_columns:
            report["quality_issues"].append(f"Missing required column: {col}")
        report["invalid_rows"] = list(range(len(df)))
        report["invalid_records"] = len(df)
        return report

    for col in ["patient_id", "medicine_id", "scheduled_date", "scheduled_time"]:
        missing_count = int(df[col].isna().sum() + (df[col].astype(str).str.strip() == "").sum())
        if missing_count:
            report["missing_values"][col] = missing_count

    if "dose_quantity" in df.columns:
        quantity_missing = int(df["dose_quantity"].isna().sum() + (df["dose_quantity"].astype(str).str.strip() == "").sum())
        if quantity_missing:
            report["missing_values"]["dose_quantity"] = quantity_missing

    invalid_status_mask = ~df["dose_status"].fillna("").astype(str).str.strip().str.upper().isin(VALID_DOSE_STATUSES)
    report["invalid_statuses"] = int(invalid_status_mask.sum())
    if report["invalid_statuses"]:
        report["quality_issues"].append(f"Invalid dose_status values: {report['invalid_statuses']}")
        report["invalid_rows"].extend(df.index[invalid_status_mask].tolist())

    invalid_time_periods = ~df["time_period"].fillna("").astype(str).str.strip().str.upper().isin(VALID_TIME_PERIODS)
    report["invalid_time_periods"] = int(invalid_time_periods.sum())
    if report["invalid_time_periods"]:
        report["quality_issues"].append(f"Invalid time_period values: {report['invalid_time_periods']}")
        report["invalid_rows"].extend(df.index[invalid_time_periods].tolist())

    invalid_day_mask = ~df["day_of_week"].fillna("").astype(str).str.strip().str.upper().isin(VALID_DAY_OF_WEEK)
    report["invalid_day_of_week"] = int(invalid_day_mask.sum())
    if report["invalid_day_of_week"]:
        report["quality_issues"].append(f"Invalid day_of_week values: {report['invalid_day_of_week']}")
        report["invalid_rows"].extend(df.index[invalid_day_mask].tolist())

    invalid_frequency_mask = ~df["frequency"].fillna("").astype(str).str.strip().str.upper().isin(VALID_FREQUENCIES)
    report["invalid_frequency"] = int(invalid_frequency_mask.sum())
    if report["invalid_frequency"]:
        report["quality_issues"].append(f"Invalid frequency values: {report['invalid_frequency']}")
        report["invalid_rows"].extend(df.index[invalid_frequency_mask].tolist())

    if "dose_quantity" in df.columns:
        dose_quantity = pd.to_numeric(df["dose_quantity"], errors="coerce")
        negative_quantity_mask = dose_quantity < 0
        report["negative_dose_quantity"] = int(negative_quantity_mask.sum())
        if report["negative_dose_quantity"]:
            report["quality_issues"].append(f"Negative dose_quantity values: {report['negative_dose_quantity']}")
            report["invalid_rows"].extend(df.index[negative_quantity_mask].tolist())
            report["missing_values"]["dose_quantity"] = report.get("missing_values", {}).get("dose_quantity", 0) + int(report["negative_dose_quantity"])

    if "dose_quantity" in df.columns:
        dose_quantity_missing = int(df["dose_quantity"].isna().sum() + (df["dose_quantity"].astype(str).str.strip() == "").sum())
        if dose_quantity_missing:
            report["missing_values"]["dose_quantity"] = report.get("missing_values", {}).get("dose_quantity", 0) + dose_quantity_missing

    delay_minutes = pd.to_numeric(df["delay_minutes"], errors="coerce")
    negative_delay_mask = delay_minutes < 0
    report["negative_delay_minutes"] = int(negative_delay_mask.sum())
    if report["negative_delay_minutes"]:
        report["quality_issues"].append(f"Negative delay_minutes values: {report['negative_delay_minutes']}")
        report["invalid_rows"].extend(df.index[negative_delay_mask].tolist())

    combined_timestamp = df["scheduled_date"].astype(str) + " " + df["scheduled_time"].astype(str)
    parsed_timestamp = pd.to_datetime(combined_timestamp, errors="coerce")
    timestamp_errors = parsed_timestamp.isna()
    report["timestamp_errors"] = int(timestamp_errors.sum())
    if report["timestamp_errors"]:
        report["quality_issues"].append(f"Impossible timestamps: {report['timestamp_errors']}")
        report["invalid_rows"].extend(df.index[timestamp_errors].tolist())

    if {"scheduled_time", "acknowledged_time"}.issubset(df.columns):
        ack = pd.to_datetime(df["acknowledged_time"], format="%H:%M:%S", errors="coerce")
        sched = pd.to_datetime(df["scheduled_time"], format="%H:%M:%S", errors="coerce")
        ack_before_schedule = (ack.notna() & sched.notna() & (ack < sched))
        report["acknowledged_before_schedule"] = int(ack_before_schedule.sum())
        if report["acknowledged_before_schedule"]:
            report["quality_issues"].append(f"Acknowledged time earlier than scheduled time: {report['acknowledged_before_schedule']}")
            report["invalid_rows"].extend(df.index[ack_before_schedule].tolist())

    duplicate_count, duplicate_rows = detect_duplicates(df)
    report["duplicates"] = duplicate_count
    report["duplicate_rows"] = duplicate_count
    if duplicate_count:
        report["quality_issues"].append(f"Duplicate medication events: {duplicate_count}")
        report["invalid_rows"].extend(duplicate_rows)

    unique_invalid_rows = sorted(set(report["invalid_rows"]))
    report["invalid_rows"] = unique_invalid_rows
    report["invalid_records"] = len(unique_invalid_rows)
    report["valid_records"] = report["total_records"] - report["invalid_records"]
    report["duplicate_rows"] = duplicate_count
    report["missing_values"] = {k: v for k, v in report["missing_values"].items() if v > 0}
    return report


def validate_medication_data(df: pd.DataFrame) -> dict[str, Any]:
    """Validate a medication dataset and return a structured report.

    The function does not modify the original dataframe or silently delete bad rows.
    It returns counts and row indexes that should be investigated by downstream
    analytics or data-quality workflows.
    """
    report = detect_invalid_records(df)
    report["invalid_statuses"] = report.get("invalid_statuses", 0)
    return report
