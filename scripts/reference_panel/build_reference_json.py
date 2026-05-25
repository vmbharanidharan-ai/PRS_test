#!/usr/bin/env python3
"""
Build empirical PRS reference JSON from a vector of per-individual PRS values.

Input: TSV with columns sample_id, population, prs_value
   OR PLINK2 .sscore file (IID, SCORESUM)

Output: src/data/prs-reference/{cancer}/{pgs_id}/{POP}.json

This is the canonical storage format for ancestry-stratified empirical calibration.
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[2]
OUT_ROOT = ROOT / "src" / "data" / "prs-reference"

POPULATIONS = ("EUR", "AFR", "EAS", "SAS", "AMR")


def quantile_ladder(values: list[float], step: int = 1) -> dict[str, float]:
    if not values:
        return {str(i): 0.0 for i in range(0, 101, step)}
    sorted_v = sorted(values)
    n = len(sorted_v)
    out: dict[str, float] = {}
    for p in range(0, 101, step):
        idx = min(n - 1, int(round((p / 100.0) * (n - 1))))
        out[str(p)] = round(sorted_v[idx], 6)
    return out


def stats(values: list[float]) -> tuple[float, float, float, float]:
    if not values:
        return 0.0, 1.0, 0.0, 0.0
    mean = sum(values) / len(values)
    var = sum((x - mean) ** 2 for x in values) / len(values)
    sd = math.sqrt(var) if var > 0 else 1.0
    return mean, sd, min(values), max(values)


def write_distribution(
    cancer: str,
    pgs_id: str,
    population: str,
    values: list[float],
    method: str,
    source: str,
    build: str = "GRCh37",
) -> Path:
    mean, sd, vmin, vmax = stats(values)
    doc = {
        "pgsId": pgs_id,
        "cancerType": cancer,
        "population": population,
        "source": source,
        "build": build,
        "nIndividuals": len(values),
        "calibrationMethod": method,
        "mean": round(mean, 6),
        "sd": round(sd, 6),
        "min": round(vmin, 6),
        "max": round(vmax, 6),
        "quantiles": quantile_ladder(values),
        "ldClumpedScore": True,
        "qcVersion": "reference_panel_v1",
        "notes": [
            "Percentile = empirical rank within this population cohort.",
            "Replace by running scripts/reference_panel/run_plink_1kg.sh for gold-standard 1KG empirical PRS.",
        ],
    }
    out_dir = OUT_ROOT / cancer / pgs_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{population}.json"
    with open(out_path, "w") as f:
        json.dump(doc, f, indent=2)
    print(f"Wrote {out_path} (n={len(values)}, mean={mean:.4f}, sd={sd:.4f})")
    return out_path


def load_tsv(path: Path) -> dict[str, list[float]]:
    by_pop: dict[str, list[float]] = {p: [] for p in POPULATIONS}
    with open(path) as f:
        header = f.readline().strip().split("\t")
        pop_i = header.index("population") if "population" in header else 1
        prs_i = header.index("prs_value") if "prs_value" in header else 2
        for line in f:
            parts = line.strip().split("\t")
            if len(parts) <= prs_i:
                continue
            pop = parts[pop_i].upper()
            if pop not in by_pop:
                continue
            try:
                by_pop[pop].append(float(parts[prs_i]))
            except ValueError:
                continue
    return by_pop


def main() -> None:
    if len(sys.argv) < 4:
        print(
            "Usage: build_reference_json.py <cancer> <pgs_id> <prs_by_pop.tsv>\n"
            "   TSV columns: sample_id, population, prs_value"
        )
        sys.exit(1)
    cancer, pgs_id, tsv_path = sys.argv[1], sys.argv[2], Path(sys.argv[3])
    by_pop = load_tsv(tsv_path)
    for pop, values in by_pop.items():
        if not values:
            continue
        write_distribution(
            cancer,
            pgs_id,
            pop,
            values,
            "1kg_empirical_plink",
            "1000 Genomes Phase 3 (PLINK --score)",
        )


if __name__ == "__main__":
    main()
