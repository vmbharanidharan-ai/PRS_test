#!/usr/bin/env python3
"""
Bootstrap empirical quantile ladders using population-specific allele frequencies.

This is a BRIDGE until you run the full 1KG PLINK pipeline (run_plink_1kg.sh).
Uses Ensembl REST for EUR/AFR/EAS AF per variant — NOT a substitute for real
individual-level 1KG PRS, but produces empirical percentile arrays (not Gaussian CDF).

Gold standard: plink --score on 1000 Genomes QC bed files per super-population.
"""

from __future__ import annotations

import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRS_DIR = ROOT / "src" / "data" / "prs"
OUT_ROOT = ROOT / "src" / "data" / "prs-reference"
sys.path.insert(0, str(ROOT / "scripts"))
from fetch_variant_maf import fetch_maf_ensembl  # noqa: E402

# 1000 Genomes Phase 3 super-pop sample sizes (for Monte Carlo n)
N_BY_POP = {"EUR": 503, "AFR": 661, "EAS": 504, "SAS": 489, "AMR": 347}

ENSEMBL_POP = {"EUR": "EUR", "AFR": "AFR", "EAS": "EAS", "SAS": "SAS", "AMR": "AMR"}

PGS_MAP = {
    "breast": "PGS005104",
    "colorectal": "PGS004240",
    "prostate": "PGS000662",
    "ovarian": "PGS000048",
}


def dosage_from_af(af: float, rng: random.Random) -> int:
    """HWE draw — bridge only; LD not modeled."""
    r = rng.random()
    if r < (1 - af) ** 2:
        return 0
    if r < (1 - af) ** 2 + 2 * af * (1 - af):
        return 1
    return 2


def simulate_prs(values: list, n: int, pop: str, seed: int) -> list[float]:
    rng = random.Random(seed)
    scores: list[float] = []
    for _ in range(n):
        total = 0.0
        for v in values:
            rsid = v["rsid"]
            af = fetch_maf_ensembl(rsid, ENSEMBL_POP.get(pop, "EUR"))
            if af is None or af <= 0 or af >= 1:
                af = 0.3
            d = dosage_from_af(af, rng)
            total += d * v["weight"]
        scores.append(total)
    return scores


def quantile_ladder(values: list[float]) -> dict[str, float]:
    import math

    sorted_v = sorted(values)
    n = len(sorted_v)
    out = {}
    for p in range(0, 101):
        idx = min(n - 1, int(round((p / 100.0) * (n - 1))))
        out[str(p)] = round(sorted_v[idx], 6)
    return out


def main() -> None:
    pops = sys.argv[1:] if len(sys.argv) > 1 else ["EUR", "AFR", "EAS"]
    for cancer, pgs_id in PGS_MAP.items():
        path = PRS_DIR / f"{cancer}.json"
        if not path.exists():
            continue
        with open(path) as f:
            definition = json.load(f)
        variants = definition["variants"]
        for pop in pops:
            n = N_BY_POP.get(pop, 500)
            print(f"Simulating {cancer}/{pop} n={n} (Ensembl AF bridge)...")
            scores = simulate_prs(variants, n, pop, seed=hash((cancer, pop)) % 2**31)
            mean = sum(scores) / len(scores)
            var = sum((x - mean) ** 2 for x in scores) / len(scores)
            sd = math.sqrt(var) if var > 0 else 1.0
            doc = {
                "pgsId": pgs_id,
                "cancerType": cancer,
                "population": pop,
                "source": "1000 Genomes Phase 3 (Monte Carlo AF bridge — run PLINK for empirical)",
                "build": definition.get("genomeBuild", "GRCh37"),
                "nIndividuals": n,
                "calibrationMethod": "af_monte_carlo_bootstrap",
                "mean": round(mean, 6),
                "sd": round(sd, 6),
                "min": round(min(scores), 6),
                "max": round(max(scores), 6),
                "quantiles": quantile_ladder(scores),
                "ldClumpedScore": True,
                "notes": [
                    "Bootstrap quantiles from population AF + HWE draws per SNP.",
                    "Upgrade: scripts/reference_panel/run_plink_1kg.sh → 1kg_empirical_plink",
                ],
            }
            out_dir = OUT_ROOT / cancer / pgs_id
            out_dir.mkdir(parents=True, exist_ok=True)
            out_path = out_dir / f"{pop}.json"
            with open(out_path, "w") as f:
                json.dump(doc, f, indent=2)
            print(f"  → {out_path}")


if __name__ == "__main__":
    import math

    main()
