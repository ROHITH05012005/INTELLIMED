import pandas as pd

from ml.src.data_validation import validate_medication_data


def test_validate_medication_data_flags_invalid_status_and_missing_ids():
    df = pd.DataFrame(
        [
            {
                "patient_id": "P1",
                "medicine_id": "M1",
                "medicine_name": "Test medicine",
                "compartment_id": "C1",
                "scheduled_date": "2026-09-02",
                "scheduled_time": "08:00:00",
                "reminder_time": "07:50:00",
                "acknowledged_time": "08:10:00",
                "delay_minutes": 10,
                "dose_status": "TAKEN",
                "day_of_week": "MONDAY",
                "time_period": "MORNING",
                "frequency": "ONCE_DAILY",
                "dose_quantity": 1.0,
                "previous_missed_doses": 0,
                "previous_taken_doses": 1,
                "adherence_percentage": 100.0,
                "sensor_event": "BUTTON_PRESS",
            },
            {
                "patient_id": "",
                "medicine_id": "M2",
                "medicine_name": "Bad status med",
                "compartment_id": "C2",
                "scheduled_date": "2026-09-02",
                "scheduled_time": "20:00:00",
                "reminder_time": "19:45:00",
                "acknowledged_time": "20:10:00",
                "delay_minutes": 10,
                "dose_status": "UNKNOWN",
                "day_of_week": "TUESDAY",
                "time_period": "NIGHT",
                "frequency": "ONCE_DAILY",
                "dose_quantity": -1,
                "previous_missed_doses": 1,
                "previous_taken_doses": 0,
                "adherence_percentage": 50.0,
                "sensor_event": "SENSOR_TIMEOUT",
            },
        ]
    )

    report = validate_medication_data(df)
    assert report["total_records"] == 2
    assert report["invalid_records"] >= 1
    assert report["invalid_statuses"] >= 1
    assert report["missing_values"]["patient_id"] >= 1
    assert report["missing_values"]["dose_quantity"] >= 1
