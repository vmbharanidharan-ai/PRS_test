#!/usr/bin/env python3
"""Predicted vs observed calibration curves (research QA)."""

from __future__ import annotations

import numpy as np


def compute_calibration(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    n_bins: int = 10,
) -> tuple[np.ndarray, np.ndarray]:
    try:
        from sklearn.calibration import calibration_curve

        prob_true, prob_pred = calibration_curve(
            y_true, y_pred, n_bins=n_bins, strategy="quantile"
        )
        return prob_true, prob_pred
    except ImportError:
        # histogram fallback
        bins = np.linspace(0, 1, n_bins + 1)
        idx = np.digitize(y_pred, bins) - 1
        prob_pred, prob_true = [], []
        for b in range(n_bins):
            mask = idx == b
            if mask.sum() == 0:
                continue
            prob_pred.append(y_pred[mask].mean())
            prob_true.append(y_true[mask].mean())
        return np.array(prob_true), np.array(prob_pred)


def calibration_by_ancestry(df, ancestry_col: str, y_col: str, pred_col: str):
    results = {}
    for anc in df[ancestry_col].unique():
        sub = df[df[ancestry_col] == anc]
        results[anc] = compute_calibration(
            sub[y_col].values, sub[pred_col].values
        )
    return results
