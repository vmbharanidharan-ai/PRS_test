#!/usr/bin/env python3
"""Generate calibration plots for research reports (CLI only — no UI change)."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np

from calibration import compute_calibration


def plot_calibration(y_true, y_pred, out: Path, title: str = "Calibration") -> None:
    import matplotlib.pyplot as plt

    prob_true, prob_pred = compute_calibration(
        np.asarray(y_true), np.asarray(y_pred)
    )
    plt.figure(figsize=(5, 5))
    plt.plot([0, 1], [0, 1], "k--", label="Perfect")
    plt.plot(prob_pred, prob_true, "o-", label="Model")
    plt.xlabel("Predicted risk")
    plt.ylabel("Observed frequency")
    plt.title(title)
    plt.legend()
    plt.tight_layout()
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"Wrote {out}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--y-true", type=Path, required=True)
    parser.add_argument("--y-pred", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=Path("calibration.png"))
    args = parser.parse_args()
    y_true = np.loadtxt(args.y_true)
    y_pred = np.loadtxt(args.y_pred)
    plot_calibration(y_true, y_pred, args.out)


if __name__ == "__main__":
    main()
