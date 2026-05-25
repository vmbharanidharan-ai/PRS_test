#!/usr/bin/env python3
"""
Fit Cox PH models per cancer on UK Biobank–format longitudinal data.

Required columns:
  eid, time, event, prs, age, fh_*, PC1..PC10

Output: public/models/{cancer}_cox.json

Requires: pip install lifelines pandas
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UKBB = ROOT / "genomics-pipeline" / "data" / "ukbb_summary_stats"
MODELS_OUT = ROOT / "public" / "models"


def fit_cox(df, duration_col: str, event_col: str, covariates: list[str]):
    from lifelines import CoxPHFitter

    cph = CoxPHFitter()
    cph.fit(df[covariates + [duration_col, event_col]], duration_col=duration_col, event_col=event_col)
    return cph


def export_from_cph(cancer: str, cph, baseline_risk: float) -> dict:
    coef = {k: float(v) for k, v in cph.params_.items()}
    return {
        "cancer": cancer,
        "version": "ukbb_cox_v1",
        "source": "lifelines CoxPHFitter on UK Biobank application data",
        "coefficients": coef,
        "baseline_hazard_scale": 1.0,
        "baseline_lifetime_risk": baseline_risk,
        "notes": ["Fitted on UKB — educational export only."],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--phenotype", type=Path, help="Parquet/CSV with time, event, prs, covariates")
    parser.add_argument("--cancer", required=True)
    args = parser.parse_args()

    if not args.phenotype or not args.phenotype.exists():
        print(
            "UK Biobank phenotype file not found.\n"
            "Apply for UKB access; build phenotype table with incident cancer labels.\n"
            "Run: python3 genomics-pipeline/models/cox_models.py  # placeholders"
        )
        return

    import pandas as pd

    df = pd.read_csv(args.phenotype) if args.phenotype.suffix == ".csv" else pd.read_parquet(args.phenotype)
    covariates = [c for c in df.columns if c not in ("eid", "time", "event")]
    cph = fit_cox(df, "time", "event", covariates)
    baseline = {"breast": 0.13, "colorectal": 0.04, "prostate": 0.125, "ovarian": 0.012}
    doc = export_from_cph(args.cancer, cph, baseline.get(args.cancer, 0.05))
    out = MODELS_OUT / f"{args.cancer}_cox.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, indent=2))
    cph.summary.to_csv(UKBB / f"{args.cancer}_cox_summary.csv")
    print(f"Fitted → {out}")


if __name__ == "__main__":
    main()
