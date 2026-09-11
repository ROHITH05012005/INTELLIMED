# Data Quality Report

## Overview

This report summarizes the validation checks applied to the synthetic medication-event dataset before the feature-preparation stage. The goal is to keep the raw data immutable while creating a transparent quality log for downstream analytics and ML handoff.

## Validation rules applied

The pipeline validates the following:

- required identifiers are present (`patient_id`, `medicine_id`)
- `dose_status` values are restricted to `TAKEN`, `PENDING`, and `MISSED`
- time-based fields parse as valid timestamps when present
- `delay_minutes` is not negative
- duplicate rows are flagged and reported
- missing values are counted without deleting the records
- `dose_quantity` negative values are counted as invalid operational entries

## Quality findings

The current synthetic sample dataset is intended for reproducible validation and should be treated as development data only.

- duplicate detection: rows with identical schedule/event signatures are reported rather than silently removed
- invalid status values: any non-standard dose outcome is flagged and retained in the report
- negative quantity values: counted in the data-quality summary and preserved for auditability
- missing values: tracked per column so future preprocessing can decide whether to impute or drop feature columns in later ML work

## Reproducibility

The validation summary is generated from the project pipeline in a deterministic order:

1. load the raw CSV from `ml/data/raw/sample_synthetic_medication_data.csv`
2. run validation checks and collect quality issues
3. generate processed features in `ml/data/processed/processed_medication_data.csv`
4. create the ML-ready export in `ml/data/processed/ml_ready_medication_data.csv`

## Auditability requirement

Invalid rows remain in the processed dataset with an `is_valid_record` flag and a `validation_issues` note. This keeps the pipeline transparent, reproducible, and safe for future ML feature work without injecting silent data loss.
