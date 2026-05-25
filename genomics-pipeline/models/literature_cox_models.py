#!/usr/bin/env python3
"""
Literature-calibrated Cox coefficients (no individual-level UK Biobank required).

UK Biobank is a conceptual calibration standard only. This implementation uses:
  - PGS Catalog / GWAS Catalog (PRS weights — separate layer)
  - SEER / GLOBOCAN (baseline incidence R_base)
  - Published hazard ratios (β on log-risk scale)

References:
  - Chatterjee N et al. Nat Rev Genet 2016 (PRS stratification framework)
  - Lewis ACF et al. Hum Genet Genomics Adv 2021 (HR per SD PRS in clinic)
  - Cancer-specific GWAS / PGS Catalog performance metrics

Optional upgrade: fit_ukbb_models.py or FinnGen when controlled-access data available.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass, asdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODELS_OUT = ROOT / "public" / "models"


def ln_hr(hr: float) -> float:
    return math.log(max(hr, 1.01))


@dataclass
class CoxCoefficients:
    cancer: str
    version: str
    source: str
    calibration: str
    coefficients: dict[str, float]
    baseline_hazard_scale: float
    baseline_lifetime_risk: float
    references: list[str]
    notes: list[str]
    data_layers: dict[str, str]


LITERATURE_MODELS: dict[str, CoxCoefficients] = {
    "breast": CoxCoefficients(
        cancer="breast",
        version="literature_v1",
        source="Published HR per SD PRS + SEER baseline + FH meta-analyses",
        calibration="literature_calibrated",
        coefficients={
            # prs feature = Z-score (1 SD); β = ln(HR/SD)
            "prs": ln_hr(1.8),
            "age": 0.012,
            "fh_breast_first_degree": ln_hr(2.0),
            "fh_breast_second_degree": ln_hr(1.4),
            "fh_ovarian_first_degree": ln_hr(1.35),
            "fh_ashkenazi_jewish": ln_hr(1.25),
            "young_onset_fh": ln_hr(1.15),
        },
        baseline_hazard_scale=1.0,
        baseline_lifetime_risk=0.13,
        references=[
            "Chatterjee et al. Nat Rev Genet 2016; doi:10.1038/nrg.2016.27",
            "Lewis et al. Hum Genet Genomics Adv 2021; doi:10.1016/j.xhgg.2021.100047",
            "Jia et al. Nat Genet 2024 (PGS005104); PGS Catalog",
            "SEER Cancer Stat Facts: Female Breast Cancer",
        ],
        notes=[
            "Not UK Biobank-fitted. β_prs = ln(HR per 1 SD) from translational PRS literature.",
            "R_base from SEER-scale U.S. lifetime risk (female).",
            "FinnGen/UKB Cox fit optional via fit_ukbb_models.py.",
        ],
        data_layers={
            "prs_weights": "PGS Catalog",
            "baseline_risk": "SEER",
            "cox_betas": "Published hazard ratios",
            "ancestry": "1000 Genomes (reference panels)",
        },
    ),
    "colorectal": CoxCoefficients(
        cancer="colorectal",
        version="literature_v1",
        source="Published HR per SD PRS + SEER + FH / Lynch priors",
        calibration="literature_calibrated",
        coefficients={
            "prs": ln_hr(1.45),
            "age": 0.012,
            "fh_colorectal_first_degree": ln_hr(2.1),
            "fh_lynch": ln_hr(2.5),
            "young_onset_fh": ln_hr(1.15),
        },
        baseline_hazard_scale=1.0,
        baseline_lifetime_risk=0.041,
        references=[
            "Chatterjee et al. 2016",
            "Fan et al. Int J Cancer 2023 (PGS004240)",
            "SEER Cancer Stat Facts: Colorectal Cancer",
            "PREMM5 / Lynch literature (FH terms only — not full PREMM5 fit)",
        ],
        notes=[
            "Literature-calibrated log-risk coefficients.",
            "PREMM5 germline probability requires certified tool for clinical use.",
        ],
        data_layers={
            "prs_weights": "PGS Catalog",
            "baseline_risk": "SEER",
            "cox_betas": "Published hazard ratios",
        },
    ),
    "prostate": CoxCoefficients(
        cancer="prostate",
        version="literature_v1",
        source="Published HR per SD PRS + SEER (male)",
        calibration="literature_calibrated",
        coefficients={
            "prs": ln_hr(1.5),
            "age": 0.015,
            "fh_prostate_first_degree": ln_hr(2.0),
            "young_onset_fh": ln_hr(1.15),
        },
        baseline_hazard_scale=1.0,
        baseline_lifetime_risk=0.125,
        references=[
            "Conti et al. Nat Genet 2021 (PGS000662)",
            "SEER Cancer Stat Facts: Prostate Cancer",
            "Lewis et al. 2021 (PRS clinical translation)",
        ],
        notes=["Male lifetime baseline from SEER order-of-magnitude."],
        data_layers={
            "prs_weights": "PGS Catalog",
            "baseline_risk": "SEER",
            "cox_betas": "Published hazard ratios",
        },
    ),
    "ovarian": CoxCoefficients(
        cancer="ovarian",
        version="literature_v1",
        source="Published HR per SD PRS + SEER (female)",
        calibration="literature_calibrated",
        coefficients={
            "prs": ln_hr(1.35),
            "age": 0.012,
            "fh_ovarian_first_degree": ln_hr(3.0),
            "fh_breast_first_degree": ln_hr(1.5),
            "fh_ashkenazi_jewish": ln_hr(1.3),
            "young_onset_fh": ln_hr(1.15),
        },
        baseline_hazard_scale=1.0,
        baseline_lifetime_risk=0.012,
        references=[
            "PGS Catalog PGS000048",
            "SEER Cancer Stat Facts: Ovarian Cancer",
        ],
        notes=["Low baseline incidence; PRS discrimination modest in literature."],
        data_layers={
            "prs_weights": "PGS Catalog",
            "baseline_risk": "SEER",
            "cox_betas": "Published hazard ratios",
        },
    ),
}


def main() -> None:
    for cancer, model in LITERATURE_MODELS.items():
        path = MODELS_OUT / f"{cancer}_cox.json"
        path.write_text(json.dumps(asdict(model), indent=2))
        print(f"Wrote literature-calibrated {path}")


if __name__ == "__main__":
    main()
