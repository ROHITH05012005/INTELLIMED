# INTELLIMED Data Analysis Report

## 1. Dataset description

This report documents the data foundation for the INTELLIMED medication reminder system. It covers the master medication-event schema, dataset validation, exploratory analysis, adherence metrics, and the recommended feature set for future ML work.

The dataset is designed to track scheduled medication doses, patient actions, reminder timing, dose state, and time-based adherence behavior. The operational goal is to monitor whether doses were taken, pending, or missed according to the project reminder and grace-period logic.

## 2. Data dictionary

The central dataset includes the following fields:

- `patient_id`: unique patient identifier
- `medicine_id`: unique medicine identifier
- `medicine_name`: medicine label
- `compartment_id`: hardware compartment slot
- `scheduled_date`: planned date for the dose
- `scheduled_time`: planned dose time
- `reminder_time`: reminder alert time
- `acknowledged_time`: actual completed/acknowledged time, if present
- `delay_minutes`: time difference from schedule in minutes
- `dose_status`: `TAKEN`, `PENDING`, or `MISSED`
- `day_of_week`: derived weekday label
- `time_period`: derived time bucket
- `frequency`: schedule frequency
- `dose_quantity`: dose amount or quantity
- `previous_missed_doses`: count before the current event
- `previous_taken_doses`: count before the current event
- `adherence_percentage`: patient or medicine adherence percent
- `sensor_event`: device event data

## 3. Data quality findings

The dataset should be checked for:

- missing `patient_id`
- missing `medicine_id`
- invalid `dose_status` values
- invalid time formats or unparsable timestamps
- negative `delay_minutes`
- duplicate dose events
- impossible timestamps such as future entries when not expected
- inconsistent schedule/actual time relationships

Each issue should be reported with a clear explanation and a decision log. Suspicious rows should not be silently deleted without documentation.

## 4. EDA findings

The EDA stage should summarize:

- number of rows
- number of patients and medicines
- date range
- missing values
- duplicate records
- distribution by dose status
- adherence trends by day and time period
- delay distribution by patient and medicine

EDA is not used to generate medical conclusions; it is a technical assessment of operational patterns and data quality.

## 5. Adherence metrics

The project-level adherence metric is defined as:

$$
\text{Adherence \%} = \frac{\text{Taken doses}}{\text{Total scheduled doses}} \times 100
$$

This metric is a project operational statistic and is not intended as a medical guideline.

Key metrics should include:

- total scheduled doses
- total taken doses
- total missed doses
- total pending doses
- overall adherence percentage
- average and median delay
- delay range and distribution

## 6. Important patterns

Observed patterns should be reviewed for:

- high adherence during morning schedules
- increased missed doses during late-night or missed reminder windows
- patient-specific adherence clusters
- medicine-specific adherence variation by schedule frequency
- delays that correlate with missed reminders or sensor issues

## 7. Recommended features for ML

For later ML development, the following fields are strong candidates:

- `delay_minutes`
- `previous_missed_doses`
- `previous_taken_doses`
- `adherence_percentage`
- `time_period`
- `day_of_week`
- `frequency`
- `dose_quantity`
- `sensor_event`

These features should only be included when they reflect information available before the dose outcome is finalized.

## 8. Potential data leakage

The following risks must be avoided:

- using `acknowledged_time` to predict the same dose outcome after the event has already occurred
- using `dose_status` as a feature for predicting the same status on the same row
- including target-derived variables in a training row for the same event
- using future event data that would not be available at prediction time

The general rule is: if the feature is only known after the outcome, it is not valid for prediction.

## 9. Limitations

This dataset is intended for operational analytics and future ML preparation. It has the following limitations:

- synthetic data is used for pipeline validation, not production claims
- real-world device issues such as missed sensor events or delayed network delivery are not yet fully modeled
- the dataset reflects project logic, not medical outcomes
- the analysis is designed to support modeling preparation, not direct patient care decisions

## 10. Next steps for Member 3

The next stage is the ML handoff as follows:

```text
Feature Engineering
        ↓
Train/Test Split
        ↓
Baseline ML Model
        ↓
Model Evaluation
```

Member 4 provides the data foundation:

```text
Member 4
Data collection schema
        ↓
Data cleaning
        ↓
EDA
        ↓
Feature recommendations
        ↓
Member 3
ML model development
```

This report should be used as the foundation for the next stage of ML development and should remain separate from final model training work.
