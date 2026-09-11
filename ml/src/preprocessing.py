"""Preprocessing and feature-preparation helpers for the medication dataset."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from .adherence_metrics import calculate_adherence
from .data_loader import get_project_root, load_medication_data
from .data_validation import validate_medication_data

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


def normalize_dose_status(value):
    """Normalize dose status values to the project standard."""
    if pd.isna(value):
        return value
    return str(value).strip().upper()


def normalize_time_period(value):
    """Normalize time period values to the controlled vocabulary."""
    if pd.isna(value):
        return value
    value = str(value).strip().upper()
    if value in VALID_TIME_PERIODS:
        return value
    return value


def normalize_day_of_week(value):
    """Normalize weekday values to the controlled vocabulary."""
    if pd.isna(value):
        return value
    value = str(value).strip().upper()
    if value in VALID_DAY_OF_WEEK:
        return value
    return value


def add_temporal_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add temporal features needed for future feature preparation and analysis."""
    out = df.copy()
    if "scheduled_time" in out.columns:
        scheduled_time = pd.to_datetime(out["scheduled_time"], format="%H:%M:%S", errors="coerce")
        if scheduled_time.isna().all():
            scheduled_time = pd.to_datetime(out["scheduled_time"], format="%H:%M", errors="coerce")
        out["scheduled_hour"] = scheduled_time.dt.hour
        out["scheduled_minute"] = scheduled_time.dt.minute
        out["scheduled_hour_sin"] = np.sin(2 * np.pi * out["scheduled_hour"] / 24)
        out["scheduled_hour_cos"] = np.cos(2 * np.pi * out["scheduled_hour"] / 24)

    if "day_of_week" in out.columns:
        day_order = [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
        ]
        day_lookup = {day: idx for idx, day in enumerate(day_order)}
        out["day_of_week_numeric"] = out["day_of_week"].fillna("").astype(str).str.upper().map(day_lookup).fillna(-1).astype(int)
        out["is_weekend"] = out["day_of_week"].fillna("").astype(str).str.upper().isin({"SATURDAY", "SUNDAY"}).astype(int)

    if "time_period" in out.columns:
        encoding = {"MORNING": 0, "AFTERNOON": 1, "EVENING": 2, "NIGHT": 3}
        out["time_period_encoded"] = out["time_period"].fillna("").astype(str).str.upper().map(encoding).fillna(-1).astype(int)

    return out


def add_historical_features(df: pd.DataFrame, patient_id_col: str = "patient_id") -> pd.DataFrame:
    """Add historical features using patient-level prior records only.

    This avoids leaking future information into current or previous records.
    """
    sort_cols = [patient_id_col, "scheduled_date"]
    if "scheduled_time" in df.columns:
        sort_cols.append("scheduled_time")

    out = df.copy().sort_values(sort_cols).reset_index(drop=True)
    out["previous_1_dose_status"] = pd.Series([None] * len(out), dtype="object")
    out["previous_3_dose_missed_count"] = np.nan
    out["previous_7_dose_missed_count"] = np.nan
    out["previous_7_dose_adherence"] = np.nan
    out["previous_30_dose_adherence"] = np.nan

    for patient_id, group in out.groupby(patient_id_col, sort=False):
        group = group.copy()
        group["previous_1_dose_status"] = group["dose_status"].shift(1)

        for window in [3, 7, 30]:
            status_values = group["dose_status"].fillna("").astype(str).str.upper()
            missed_mask = status_values.eq("MISSED").astype(int)
            previous_counts = missed_mask.shift(1).rolling(window=window, min_periods=1).sum()
            group[f"previous_{window}_dose_missed_count"] = previous_counts

            taken_mask = status_values.eq("TAKEN").astype(int)
            prior_count = status_values.shift(1).rolling(window=window, min_periods=1).count()
            previous_adherence = (taken_mask.shift(1).rolling(window=window, min_periods=1).sum() / prior_count) * 100
            group[f"previous_{window}_dose_adherence"] = previous_adherence

        out.loc[group.index, "previous_1_dose_status"] = group["previous_1_dose_status"].values
        out.loc[group.index, "previous_3_dose_missed_count"] = group["previous_3_dose_missed_count"].values
        out.loc[group.index, "previous_7_dose_missed_count"] = group["previous_7_dose_missed_count"].values
        out.loc[group.index, "previous_7_dose_adherence"] = group["previous_7_dose_adherence"].values
        out.loc[group.index, "previous_30_dose_adherence"] = group["previous_30_dose_adherence"].values

    return out


def create_processed_dataset(raw_path: str | Path | None = None, output_path: str | Path | None = None) -> tuple[pd.DataFrame, dict]:
    """Create a processed medication dataset from the raw synthetic dataset.

    The raw dataset is never overwritten. Instead, a processed copy is generated
    that preserves all records and adds a validation flag with issue details.
    """
    df = load_medication_data(raw_path)
    report = validate_medication_data(df)
    processed = df.copy()

    processed["dose_status"] = processed["dose_status"].fillna("").astype(str).str.upper()
    processed["time_period"] = processed["time_period"].fillna("").astype(str).str.upper()
    processed["day_of_week"] = processed["day_of_week"].fillna("").astype(str).str.upper()
    processed["frequency"] = processed["frequency"].fillna("").astype(str).str.upper()
    processed["is_valid_record"] = True
    processed["validation_issues"] = ""
    if report["invalid_records"]:
        invalid_rows = set(report["invalid_rows"])
        processed.loc[list(invalid_rows), "is_valid_record"] = False
        processed.loc[list(invalid_rows), "validation_issues"] = "; ".join(report["quality_issues"])

    processed = add_temporal_features(processed)
    processed = add_historical_features(processed)

    if output_path is None:
        output_path = get_project_root() / "ml" / "data" / "processed" / "processed_medication_data.csv"

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    processed.to_csv(output_path, index=False)

    return processed, report


def create_ml_ready_dataset(raw_path: str | Path | None = None, output_path: str | Path | None = None) -> pd.DataFrame:
    """Create a future-ML feature-preparation export without training a model."""
    processed, _ = create_processed_dataset(raw_path=raw_path)

    feature_columns = [
        "patient_id",
        "medicine_id",
        "medicine_name",
        "compartment_id",
        "scheduled_date",
        "scheduled_time",
        "reminder_time",
        "acknowledged_time",
        "delay_minutes",
        "dose_status",
        "day_of_week",
        "time_period",
        "frequency",
        "dose_quantity",
        "previous_missed_doses",
        "previous_taken_doses",
        "adherence_percentage",
        "sensor_event",
        "scheduled_hour",
        "scheduled_minute",
        "scheduled_hour_sin",
        "scheduled_hour_cos",
        "day_of_week_numeric",
        "is_weekend",
        "time_period_encoded",
        "previous_1_dose_status",
        "previous_3_dose_missed_count",
        "previous_7_dose_missed_count",
        "previous_7_dose_adherence",
        "previous_30_dose_adherence",
        "is_valid_record",
        "validation_issues",
    ]
    ml_ready = processed.reindex(columns=feature_columns)

    if output_path is None:
        output_path = get_project_root() / "ml" / "data" / "processed" / "ml_ready_medication_data.csv"

    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8", newline="") as handle:
        handle.write("# SYNTHETIC DEVELOPMENT DATA — NOT REAL PATIENT DATA\n")
    ml_ready.to_csv(output_path, mode="a", index=False)
    return ml_ready
