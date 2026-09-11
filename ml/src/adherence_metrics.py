"""Medication adherence and delay calculations for INTELLIMED."""

from __future__ import annotations

import pandas as pd


def calculate_delay(df: pd.DataFrame) -> dict[str, float | int]:
    """Compute summary statistics for delay_minutes values."""
    if "delay_minutes" not in df.columns:
        return {
            "average_delay_minutes": 0.0,
            "median_delay_minutes": 0.0,
            "max_delay_minutes": 0,
            "min_delay_minutes": 0,
            "delay_distribution": {},
        }

    delay_series = pd.to_numeric(df["delay_minutes"], errors="coerce").dropna()
    if delay_series.empty:
        return {
            "average_delay_minutes": 0.0,
            "median_delay_minutes": 0.0,
            "max_delay_minutes": 0,
            "min_delay_minutes": 0,
            "delay_distribution": {},
        }

    return {
        "average_delay_minutes": round(float(delay_series.mean()), 2),
        "median_delay_minutes": round(float(delay_series.median()), 2),
        "max_delay_minutes": int(delay_series.max()),
        "min_delay_minutes": int(delay_series.min()),
        "delay_distribution": delay_series.describe().to_dict(),
    }


def calculate_adherence(df: pd.DataFrame) -> dict[str, float | int]:
    """Calculate total scheduled, taken, missed, pending, and adherence rate."""
    total_scheduled = int(len(df))
    total_taken = int((df["dose_status"].fillna("").astype(str).str.upper() == "TAKEN").sum())
    total_missed = int((df["dose_status"].fillna("").astype(str).str.upper() == "MISSED").sum())
    total_pending = int((df["dose_status"].fillna("").astype(str).str.upper() == "PENDING").sum())

    adherence_percentage = 0.0
    if total_scheduled:
        adherence_percentage = round((total_taken / total_scheduled) * 100, 2)

    return {
        "total_scheduled_doses": total_scheduled,
        "total_taken_doses": total_taken,
        "total_missed_doses": total_missed,
        "total_pending_doses": total_pending,
        "overall_adherence_percentage": adherence_percentage,
    }
