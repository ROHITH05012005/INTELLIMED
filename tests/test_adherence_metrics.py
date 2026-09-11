import pandas as pd

from ml.src.adherence_metrics import calculate_adherence


def test_calculate_adherence_handles_taken_and_missed_values():
    df = pd.DataFrame(
        {
            "dose_status": ["TAKEN", "TAKEN", "MISSED", "PENDING"],
        }
    )

    metrics = calculate_adherence(df)
    assert metrics["total_scheduled_doses"] == 4
    assert metrics["total_taken_doses"] == 2
    assert metrics["total_missed_doses"] == 1
    assert metrics["total_pending_doses"] == 1
    assert metrics["overall_adherence_percentage"] == 50.0
