#!/usr/bin/env python3
"""
Cox proportional hazards — literature-calibrated joint risk (log hazard scale).

Default export: literature_cox_models.py (PGS + SEER + published HRs).
Optional upgrade: fit_ukbb_models.py when UK Biobank / FinnGen data available.

log h(t|x) = log h0(t) + β_prs·PRS + β_age·age + β_fh·FH + Σ β_k·PC_k
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
MODELS_OUT = ROOT / "public" / "models"


@dataclass
class CoxCoefficients:
    cancer: str
    version: str
    source: str
    coefficients: dict[str, float]
    baseline_hazard_scale: float
    baseline_lifetime_risk: float
    notes: list[str]

    def log_relative_risk(self, features: dict[str, float]) -> float:
        log_rr = 0.0
        for name, beta in self.coefficients.items():
            log_rr += beta * features.get(name, 0.0)
        return log_rr

    def absolute_risk(self, features: dict[str, float]) -> float:
        log_rr = self.log_relative_risk(features)
        rr = math.exp(max(-5, min(5, log_rr)))
        r0 = self.baseline_lifetime_risk
        return 1 - (1 - r0) ** rr


def export_json(model: CoxCoefficients, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(asdict(model), indent=2))


def placeholder_coefficients(cancer: str) -> CoxCoefficients:
    """Literature-informed placeholders until fit_ukbb_models.py runs on real UKB."""
    base_risk = {
        "breast": 0.13,
        "colorectal": 0.04,
        "prostate": 0.125,
        "ovarian": 0.012,
    }
    return CoxCoefficients(
        cancer=cancer,
        version="placeholder_v1",
        source="Replace with fit_ukbb_models.py output — NOT UK Biobank fitted",
        coefficients={
            "prs": 0.25,
            "age": 0.012,
            "fh_breast_first_degree": 0.69,
            "fh_colorectal_first_degree": 0.74,
            "fh_prostate_first_degree": 0.69,
            "pc1": 0.0,
            "pc2": 0.0,
        },
        baseline_hazard_scale=1.0,
        baseline_lifetime_risk=base_risk.get(cancer, 0.05),
        notes=[
            "Placeholder Cox-style betas on log-RR scale.",
            "Run fit_ukbb_models.py with UK Biobank phenotype file.",
        ],
    )


def main() -> None:
    """Delegate to literature-calibrated models (default for GeneScope)."""
    from literature_cox_models import main as literature_main

    literature_main()


if __name__ == "__main__":
    main()
