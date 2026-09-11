import pandas as pd

from ml.src.preprocessing import add_temporal_features, add_historical_features


def test_add_temporal_features_creates_time_features():
    df = pd.DataFrame(
        [{
            "scheduled_date": "2026-09-02",
            "scheduled_time": "08:30:00",
            "day_of_week": "WEDNESDAY",
            "time_period": "MORNING",
        }]
    )

    out = add_temporal_features(df)
    assert "scheduled_hour" in out.columns
    assert "scheduled_minute" in out.columns
    assert "scheduled_hour_sin" in out.columns
    assert "scheduled_hour_cos" in out.columns
    assert "day_of_week_numeric" in out.columns
    assert "is_weekend" in out.columns
    assert "time_period_encoded" in out.columns


def test_add_historical_features_uses_prior_records_only():
    df = pd.DataFrame(
        [
            {"patient_id": "P1", "dose_status": "TAKEN", "scheduled_date": "2026-09-01"},
            {"patient_id": "P1", "dose_status": "MISSED", "scheduled_date": "2026-09-02"},
            {"patient_id": "P1", "dose_status": "TAKEN", "scheduled_date": "2026-09-03"},
        ]
    )

    out = add_historical_features(df)
    assert "previous_1_dose_status" in out.columns
    assert out.iloc[1]["previous_1_dose_status"] == "TAKEN"
    assert out.iloc[2]["previous_3_dose_missed_count"] == 1
