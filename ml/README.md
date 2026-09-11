# INTELLIMED ML and Data Analysis Module

This folder contains the data foundation for the INTELLIMED system before any final ML model development begins. The goal is to define a clear medication-event dataset, validate quality, perform exploratory analysis, and generate metrics that the future ML team can build on.

## Purpose

- Define the schema for medication and reminder events collected from the device, backend, and database
- Standardize dose states and event interpretation
- Validate the dataset for missing values, invalid timestamps, duplicates, and inconsistent records
- Conduct exploratory data analysis (EDA) and adherence metrics
- Provide a clean handoff to the ML model team

## Dataset structure

```text
ml/
├── data/
│   ├── raw/
│   │   └── sample_synthetic_medication_data.csv
│   ├── processed/
│   └── README.md
├── notebooks/
│   ├── 01_data_schema.ipynb
│   ├── 02_eda.ipynb
│   └── 03_adherence_analysis.ipynb
├── reports/
│   └── data_analysis_report.md
├── README.md
└── ...
```

## Notebook sequence

1. `01_data_schema.ipynb` — define the medication event schema and explain columns
2. `02_eda.ipynb` — load the synthetic dataset, inspect quality, summarize statistics, and generate visualizations
3. `03_adherence_analysis.ipynb` — validate the dataset, compute adherence metrics, and document quality checks and ML feature recommendations

## Synthetic data

This repository contains only synthetic, non-clinical test data for pipeline validation. It is clearly labeled as:

`SYNTHETIC — NOT REAL PATIENT DATA`

This data is not a medical source and must not be used for clinical claims or patient care decisions.

## Calculated metrics

The analysis folder is designed to produce:

- total scheduled doses
- total taken doses
- total missed doses
- total pending doses
- overall adherence percentage
- average, median, max, and minimum delay time
- adherence breakdown by time period and day of week
- patient-level and medicine-level adherence summaries

## How Member 3 should use this output

Member 3 should use the cleaned and analyzed dataset as the foundation for:

```text
Feature Engineering
        ↓
Train/Test Split
        ↓
Baseline ML Model
        ↓
Model Evaluation
```

The purpose of this work is to define data quality standards and produce usable features. The final model work is intentionally separate and should not be mixed into this data-analysis stage.

## Notes

- Do not commit real patient data, medical reports, or credentials.
- Do not upload generated model binaries or large private datasets.
- Keep all analysis reproducible using relative paths and documented assumptions.
