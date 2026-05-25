#!/usr/bin/env python3
"""
Level 4 — Synthetic cohort pseudo-calibration (Path A: research-grade honesty).

We cannot access UK Biobank longitudinal genotypes. This layer:

  Option A (literature anchor): β_prs = ln(HR per SD) from UKB translational papers.
  Option B (synthetic cohort): sample Z ~ reference PRS distribution (1000G-scaled),
      assign pseudo-outcomes via published hazard models, fit logistic intercept/slope.

Output: public/models/{cancer}_synthetic_calibration.json

NOT clinically valid — internally consistent, demo- and methodology-paper-grade.
"""

from __future__ import annotations

import json
import math
import random
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
REF_ROOT = ROOT / "src" / "data" / "prs-reference"
MODELS_OUT = ROOT / "public" / "models"

PGS_BY_CANCER = {
    "breast": "PGS005104",
    "colorectal": "PGS004240",
    "prostate": "PGS000662",
    "ovarian": "PGS000048",
}

CANCER_META = {
    "breast": {"hr_per_sd": 1.8, "baseline_risk": 0.13, "label": "Breast cancer"},
    "colorectal": {"hr_per_sd": 1.45, "baseline_risk": 0.041, "label": "Colorectal cancer"},
    "prostate": {"hr_per_sd": 1.5, "baseline_risk": 0.125, "label": "Prostate cancer"},
    "ovarian": {"hr_per_sd": 1.35, "baseline_risk": 0.012, "label": "Ovarian cancer"},
}

POPS = ["EUR", "AFR", "EAS"]
N_SIM = 20_000
SEED = 42


def ln_hr(hr: float) -> float:
    return math.log(max(hr, 1.01))


def sigmoid(x: float) -> float:
    if x > 20:
        return 1.0
    if x < -20:
        return 0.0
    return 1.0 / (1.0 + math.exp(-x))


def load_reference_stats(cancer: str, pgs_id: str, pop: str) -> tuple[float, float, str]:
    path = REF_ROOT / cancer / pgs_id / f"{pop}.json"
    if path.exists():
        d = json.loads(path.read_text())
        return float(d["mean"]), float(d["sd"]), d.get("calibrationMethod", "unknown")
    return 0.0, 1.0, "default_unit_normal"


def sample_z_from_reference(
    rng: random.Random, mean: float, sd: float, method: str
) -> float:
    """Sample one PRS draw and return Z (standardized)."""
    raw = rng.gauss(mean, max(sd, 1e-6))
    return (raw - mean) / max(sd, 1e-6)


def find_intercept_for_prevalence(
    beta: float,
    target_prev: float,
    rng: random.Random,
    n_grid: int = 80,
) -> float:
    """Grid-search intercept so mean predicted risk ≈ target prevalence."""
    best_alpha = 0.0
    best_err = 1.0
    for i in range(n_grid):
        alpha = -4.0 + (8.0 * i / max(n_grid - 1, 1))
        preds = []
        for _ in range(2000):
            z = rng.gauss(0, 1)
            preds.append(sigmoid(alpha + beta * z))
        prev = sum(preds) / len(preds)
        err = abs(prev - target_prev)
        if err < best_err:
            best_err = err
            best_alpha = alpha
    return best_alpha


def fit_logistic(z: list[float], y: list[int]) -> tuple[float, float]:
    """Newton-style logistic regression (intercept, slope) without sklearn."""
    a, b = 0.0, ln_hr(1.5)
    for _ in range(40):
        g0 = g1 = 0.0
        h00 = h01 = h11 = 0.0
        for zi, yi in zip(z, y):
            p = sigmoid(a + b * zi)
            w = p * (1 - p)
            g0 += yi - p
            g1 += (yi - p) * zi
            h00 += w
            h01 += w * zi
            h11 += w * zi * zi
        det = h00 * h11 - h01 * h01
        if abs(det) < 1e-9:
            break
        da = (g0 * h11 - g1 * h01) / det
        db = (h00 * g1 - h01 * g0) / det
        a += da
        b += db
        if abs(da) + abs(db) < 1e-6:
            break
    return a, b


@dataclass
class PopulationCalibration:
    population: str
    reference_mean: float
    reference_sd: float
    reference_method: str
    literature_beta_prs: float
    literature_hr_per_sd: float
    synthetic_intercept_log_odds: float
    synthetic_slope_log_odds: float
    synthetic_prevalence_target: float
    synthetic_n_simulated: int
    slope_ratio_fitted_vs_literature: float


@dataclass
class SyntheticCalibrationModel:
    cancer: str
    pgs_id: str
    version: str
    path: str
    method: str
    calibration: str
    clinically_valid: bool
    disclaimer: str
    literature_anchor: dict[str, Any]
    populations: dict[str, dict[str, Any]]
    default_population: str
    default_intercept_log_rr: float
    default_slope_log_rr: float
    data_layers: dict[str, str]
    references: list[str]
    notes: list[str]


def build_population_calibration(
    cancer: str,
    pop: str,
    pgs_id: str,
    hr_per_sd: float,
    baseline_risk: float,
    rng: random.Random,
) -> PopulationCalibration:
    mean, sd, ref_method = load_reference_stats(cancer, pgs_id, pop)
    beta_lit = ln_hr(hr_per_sd)

    alpha = find_intercept_for_prevalence(beta_lit, baseline_risk, rng)
    z_vals: list[float] = []
    y_vals: list[int] = []
    for _ in range(N_SIM):
        z = sample_z_from_reference(rng, mean, sd, ref_method)
        z_vals.append(z)
        p = sigmoid(alpha + beta_lit * z)
        y_vals.append(1 if rng.random() < p else 0)

    intercept_fit, slope_fit = fit_logistic(z_vals, y_vals)
    ratio = slope_fit / beta_lit if beta_lit else 1.0

    return PopulationCalibration(
        population=pop,
        reference_mean=round(mean, 6),
        reference_sd=round(sd, 6),
        reference_method=ref_method,
        literature_beta_prs=round(beta_lit, 6),
        literature_hr_per_sd=hr_per_sd,
        synthetic_intercept_log_odds=round(intercept_fit, 6),
        synthetic_slope_log_odds=round(slope_fit, 6),
        synthetic_prevalence_target=baseline_risk,
        synthetic_n_simulated=N_SIM,
        slope_ratio_fitted_vs_literature=round(ratio, 4),
    )


def build_model(cancer: str) -> SyntheticCalibrationModel:
    meta = CANCER_META[cancer]
    pgs_id = PGS_BY_CANCER[cancer]
    rng = random.Random(f"{SEED}:{cancer}")

    pops: dict[str, dict[str, Any]] = {}
    for pop in POPS:
        pc = build_population_calibration(
            cancer, pop, pgs_id, meta["hr_per_sd"], meta["baseline_risk"], rng
        )
        pops[pop] = asdict(pc)

    eur = pops["EUR"]
    return SyntheticCalibrationModel(
        cancer=cancer,
        pgs_id=pgs_id,
        version="synthetic_cohort_v1",
        path="research_grade_honesty",
        method="synthetic_cohort_calibration",
        calibration="synthetic_pseudo_calibration",
        clinically_valid=False,
        disclaimer=(
            "Synthetic cohort calibration: NOT fitted on real UK Biobank or FinnGen "
            "longitudinal outcomes. Internally consistent for educational demos and "
            "methodology papers only. No clinical implication."
        ),
        literature_anchor={
            "hr_per_sd": meta["hr_per_sd"],
            "beta_prs_ln_hr": eur["literature_beta_prs"],
            "source": "UK Biobank translational PRS literature (Lewis 2021; cancer GWAS)",
            "option": "A_literature_anchor",
        },
        populations=pops,
        default_population="EUR",
        default_intercept_log_rr=eur["synthetic_intercept_log_odds"],
        default_slope_log_rr=eur["synthetic_slope_log_odds"],
        data_layers={
            "level_1_prs": "PGS Catalog + OpenGWAS (GWAS provenance)",
            "level_2_reference": "1000 Genomes Phase 3 (empirical PRS distribution)",
            "level_3_baseline": "SEER-scale lifetime incidence",
            "level_4_calibration": "Synthetic cohort (this file)",
        },
        references=[
            "Chatterjee et al. Nat Rev Genet 2016",
            "Lewis et al. Hum Genet Genomics Adv 2021",
            "1000 Genomes Phase 3 reference panels",
            "SEER Cancer Stat Facts",
        ],
        notes=[
            "Option B: PRS Z sampled from reference mean/sd; pseudo phenotypes from published hazard; logistic fit.",
            "Option A: literature HR/SD anchors simulation generative model.",
            "Blocked resource: labeled longitudinal genotype cohorts (UKB/FinnGen) — not replaced, explicitly synthetic.",
            "Upgrade: fit_ukbb_models.py when controlled-access phenotypes available.",
        ],
    )


def main() -> None:
    MODELS_OUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "architecture": "four_level_public_stack",
        "path": "research_grade_honesty",
        "levels": [
            {
                "level": 1,
                "name": "PRS construction",
                "sources": ["PGS Catalog", "OpenGWAS", "GWAS Catalog"],
            },
            {
                "level": 2,
                "name": "Ancestry-aware reference",
                "sources": ["1000 Genomes Phase 3"],
            },
            {
                "level": 3,
                "name": "Baseline incidence",
                "sources": ["SEER"],
            },
            {
                "level": 4,
                "name": "Pseudo calibration",
                "sources": ["Literature HR/SD + synthetic cohort fit"],
                "method": "synthetic_cohort_calibration",
            },
        ],
    }
    (MODELS_OUT / "calibration_architecture.json").write_text(
        json.dumps(manifest, indent=2)
    )
    print(f"Wrote {MODELS_OUT / 'calibration_architecture.json'}")

    for cancer in CANCER_META:
        model = build_model(cancer)
        out = MODELS_OUT / f"{cancer}_synthetic_calibration.json"
        out.write_text(json.dumps(asdict(model), indent=2))
        print(f"Wrote {out}")


if __name__ == "__main__":
    main()
