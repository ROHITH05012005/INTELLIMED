# INTELLIMED Medication Event Dataset

This document defines the master medication-event dataset used by the INTELLIMED system. The schema captures scheduled medication events, reminder events, actual patient interaction, and downstream adherence metrics. The file is intended to support data quality checks, EDA, and future ML feature engineering.

## 1. Dataset purpose

The main dataset records each medicine dose that was scheduled for a patient and whether the dose was taken, missed, or still pending. It is intended to track adherence over time, support early reminder logic, and produce future ML features for intervention analysis.

## 2. Standard dose status values

The data must use a controlled vocabulary for dose outcome:

- `TAKEN` — the dose was acknowledged or completed within the configured reminder and grace-period rules
- `PENDING` — the scheduled dose has not yet reached a decision point or has not yet become overdue
- `MISSED` — the dose has crossed the configured reminder/grace period and is treated as not taken

Important note:

The project-specific reminder/grace-period configuration determines when a dose becomes `MISSED`. This is not a medical classification; it is a project-defined operational state used for adherence tracking.

## 3. Master schema

| Column name | Data type | Meaning | Allowed values | Required | Source | Future ML use |
| --- | --- | --- | --- | --- | --- | --- |
| `patient_id` | string | Unique patient identifier used in the device, backend, and analytics layer | Any non-empty patient ID string | Yes | Device registration / backend user profile | Yes |
| `medicine_id` | string | Unique medicine identifier for each medicine prescription or event | Any non-empty medicine ID string | Yes | Backend medication registry | Yes |
| `medicine_name` | string | Human-readable medicine name | Free text, but normalized when possible | Yes | Backend prescription data | Yes |
| `compartment_id` | string | Physical compartment slot in the smart medicine box | Device-specific compartment IDs such as `C1`, `C2` | Yes | IoT device event logs | Yes |
| `scheduled_date` | date | Date on which the dose was scheduled | ISO date format `YYYY-MM-DD` | Yes | Schedule generation logic | Yes |
| `scheduled_time` | time | Planned time for the medicine dose | `HH:MM:SS` or `HH:MM` | Yes | Medication schedule config | Yes |
| `reminder_time` | time | Time at which the reminder or alert was sent to the user | `HH:MM:SS` or `HH:MM` | Recommended | Backend reminder service | Yes |
| `acknowledged_time` | time or null | Actual time when the patient acknowledged or completed the dose | `HH:MM:SS` or null | No | Device or app event | Yes |
| `delay_minutes` | integer | Difference between actual completion time and scheduled time, in minutes; positive values indicate delay | Non-negative integer | No | Device/backend event timestamps | Yes |
| `dose_status` | string | Outcome for the scheduled dose | `TAKEN`, `PENDING`, `MISSED` | Yes | Rule engine / analytics | Yes |
| `day_of_week` | string | Day of the week for the scheduled dose | `MONDAY`..`SUNDAY` | Yes | Derived from `scheduled_date` | Yes |
| `time_period` | string | Time bucket for medication schedule | `MORNING`, `AFTERNOON`, `EVENING`, `NIGHT` | Yes | Derived from `scheduled_time` | Yes |
| `frequency` | string | Frequency of the medicine schedule | `ONCE_DAILY`, `TWICE_DAILY`, `THRICE_DAILY`, `AS_NEEDED`, or custom schedule label | Yes | Prescriber schedule config | Yes |
| `dose_quantity` | float | Quantity or count associated with the dose | Non-negative numeric value | Recommended | Prescription logic / device config | Yes |
| `previous_missed_doses` | integer | Number of missed doses prior to this event | Non-negative integer | Recommended | Aggregated adherence history | Yes |
| `previous_taken_doses` | integer | Number of taken doses prior to this event | Non-negative integer | Recommended | Aggregated adherence history | Yes |
| `adherence_percentage` | float | Rolling or session-level adherence percent for the patient or medicine | Numeric value between `0` and `100` | Recommended | Derived analytics | Yes |
| `sensor_event` | string | Sensor-level event associated with the dose | `DOOR_OPEN`, `DOOR_CLOSE`, `BUTTON_PRESS`, `SENSOR_TIMEOUT`, `UNKNOWN` | Recommended | ESP32 + backend event stream | Yes |

## 4. Data pipeline

```text
IoT Device
   ↓
ESP32 Events
   ↓
Backend/API
   ↓
Database
   ↓
Raw Dataset
   ↓
Data Cleaning
   ↓
Processed Dataset
   ↓
EDA
   ↓
Adherence Metrics
   ↓
Future ML Model
```

### Stage explanations

- IoT Device: Smart medicine box and patient reminder hardware sends dose and sensor events.
- ESP32 Events: The microcontroller captures door status, button interactions, reminders, and time-based triggers.
- Backend/API: Receives event payloads from the device and records them in a backend service.
- Database: Stores raw operational events and metadata including patients, medicines, schedules, and timestamps.
- Raw Dataset: Export or query layer that contains unprocessed event data before validation.
- Data Cleaning: Removes or flags invalid or impossible records while keeping auditability and not silently deleting suspicious data.
- Processed Dataset: Cleaned and standardized dataset ready for analysis and modeling.
- EDA: Descriptive analysis to identify patterns, quality issues, and adherence distributions.
- Adherence Metrics: Summaries such as total scheduled, taken, missed, and pending doses with adherence percentages.
- Future ML Model: Later models can use engineered features derived from adherence and event history.

## 5. Data quality expectations

The dataset must satisfy the following rules:

- patient IDs must be present
- medicine IDs must be present
- dose status values must come from the controlled set
- timestamps must be valid and comparable
- delays must not be negative
- duplicate events should be flagged, not silently removed
- impossible timestamps should be investigated instead of auto-corrected
- schedule and actual usage times should be checked for contradiction

## 6. Recommended future ML feature candidates

These fields may become ML features when the dataset is stable and cleaned:

- `delay_minutes`
- `previous_missed_doses`
- `previous_taken_doses`
- `adherence_percentage`
- `time_period`
- `day_of_week`
- `frequency`
- `dose_quantity`
- `sensor_event`

These features should be derived only from information available before the outcome is known, unless specifically designed for retrospective analysis.

## 7. Leakage risks to avoid

The future ML team should avoid using fields that would leak the target outcome after the event is already decided. Examples include:

- `acknowledged_time` used to predict whether the same dose was taken when the value is only known after the event
- `dose_status` used as a feature when predicting the same `dose_status` for the same record
- target-derived variables in the same row when the objective is to predict the next action

A safe rule is: features must reflect information available before the event outcome is finalized.

## 8. Notes

- This data is a project dataset for analytics and future ML research.
- This schema is intentionally operational and not a clinical diagnosis framework.
- Real patient data must never be uploaded to the public repository.
