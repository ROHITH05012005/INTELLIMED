"""Utilities for loading the medication-event dataset used by INTELLIMED."""

from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def get_project_root() -> Path:
    """Return the repository root as a stable relative path anchor."""
    return PROJECT_ROOT


def load_medication_data(path: str | Path | None = None) -> pd.DataFrame:
    """Load the raw synthetic medication dataset.

    Parameters
    ----------
    path : str or Path, optional
        Explicit CSV path to load. If omitted, the project raw dataset is used.

    Returns
    -------
    pandas.DataFrame
        The loaded medication dataset.
    """
    if path is None:
        path = PROJECT_ROOT / "ml" / "data" / "raw" / "sample_synthetic_medication_data.csv"

    data_path = Path(path)
    if not data_path.exists():
        raise FileNotFoundError(f"Medication dataset not found: {data_path}")

    return pd.read_csv(data_path, comment="#")
