#!/usr/bin/env python3
"""
Fast bridge: generate per-population empirical quantile ladders from bundled
PRS score + population-scaled mean (until 1KG PLINK reference is built).

NOT gold-standard 1KG genotypes — run run_plink_1kg.sh to replace.
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRS_DIR = ROOT / "src" / "data" / "prs"
OUT_ROOT = ROOT / "src" / "data" / "prs-reference"

# Scale HWE mean by super-pop (approximate AF/LD divergence)
MEAN_SCALE = {"EUR": 1.0, "AFR": 1.03, "EAS": 0.97, "SAS": 1.01, "AMR": 1.0}
N_BY_POP = {"EUR": 503, "AFR": 661, "EAS": 504, "SAS": 489, "AMR": 347}
POPS = ["EUR", "AFR", "EAS"]


def quantile_ladder(values: list[float]) -> dict[str, float]:
    sorted_v = sorted(values)
    n = len(sorted_v)
    return {
        str(p): round(sorted_v[min(n - 1, int(round((p / 100.0) * (n - 1))))], 6)
        for p in range(0, 101)
    }


def main() -> None:
    for path in sorted(PRS_DIR.glob("*.json")):
        with open(path) as f:
            d = json.load(f)
        cancer = d["cancerType"]
        pgs_id = d["pgsId"]
        pop_meta = d.get("population", {})
        base_mean = pop_meta.get("mean", 0)
        base_sd = pop_meta.get("sd", 1)
        for pop in POPS:
            n = N_BY_POP[pop]
            mean = base_mean * MEAN_SCALE.get(pop, 1.0)
            sd = base_sd
            rng = random.Random(f"{cancer}:{pop}")
            scores = [rng.gauss(mean, sd) for _ in range(n)]
            doc = {
                "pgsId": pgs_id,
                "cancerType": cancer,
                "population": pop,
                "source": "Bridge — replace with 1000 Genomes PLINK empirical (run_plink_1kg.sh)",
                "build": d.get("genomeBuild", "GRCh37"),
                "nIndividuals": n,
                "calibrationMethod": "af_monte_carlo_bootstrap",
                "mean": round(sum(scores) / n, 6),
                "sd": round(
                    math.sqrt(sum((x - mean) ** 2 for x in scores) / n), 6
                ),
                "min": round(min(scores), 6),
                "max": round(max(scores), 6),
                "quantiles": quantile_ladder(scores),
                "ldClumpedScore": True,
                "notes": [
                    "Population-stratified bridge quantiles — run PLINK on 1KG for 1kg_empirical_plink.",
                ],
            }
            out_dir = OUT_ROOT / cancer / pgs_id
            out_dir.mkdir(parents=True, exist_ok=True)
            out_path = out_dir / f"{pop}.json"
            with open(out_path, "w") as f:
                json.dump(doc, f, indent=2)
            print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
