#!/usr/bin/env python3
"""C-index, Brier score, and summary metrics for PRS risk engine validation."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np


def concordance_index(time: np.ndarray, risk_score: np.ndarray, event: np.ndarray) -> float:
    from lifelines.utils import concordance_index

    return float(concordance_index(time, -risk_score, event))


def brier_score(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    from sklearn.metrics import brier_score_loss

    return float(brier_score_loss(y_true, y_pred))


def evaluate_cohort(df, time_col: str, event_col: str, pred_col: str) -> dict:
    t = df[time_col].values
    e = df[event_col].values
    p = df[pred_col].values
    return {
        "c_index": concordance_index(t, p, e),
        "brier": brier_score(e.astype(int), np.clip(p, 0, 1)),
        "n": int(len(df)),
    }


def main() -> None:
    import argparse
    import pandas as pd

    parser = argparse.ArgumentParser()
    parser.add_argument("--cohort", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=Path("evaluation_report.json"))
    args = parser.parse_args()
    df = pd.read_csv(args.cohort)
    report = evaluate_cohort(df, "time", "event", "predicted_risk")
    args.out.write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
