#!/usr/bin/env python3
"""Build src/data/cohort_reference_manifest.json from 1KG PLINK PRS outputs."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REF_ROOT = ROOT / "src" / "data" / "prs-reference"
OUT = ROOT / "src" / "data" / "cohort_reference_manifest.json"

CANCERS = ("breast", "colorectal", "prostate", "ovarian")
POPS = ("EUR", "AFR", "EAS", "SAS", "AMR")


def main() -> None:
    cancers: dict = {}
    for cancer_dir in REF_ROOT.iterdir():
        if not cancer_dir.is_dir():
            continue
        cancer = cancer_dir.name
        cancers[cancer] = {}
        for pgs_dir in cancer_dir.iterdir():
            if not pgs_dir.is_dir():
                continue
            for pop_file in pgs_dir.glob("*.json"):
                pop = pop_file.stem
                rel = f"prs-reference/{cancer}/{pgs_dir.name}/{pop}.json"
                cancers[cancer][pop] = {
                    "path": rel,
                    "nIndividuals": json.loads(pop_file.read_text()).get(
                        "nIndividuals", 0
                    ),
                }
    manifest = {
        "version": "1kg_bridge_v1" if cancers else "pending",
        "source": "1000 Genomes Phase 3 PLINK (update after run_plink_1kg.sh)",
        "cancers": cancers,
    }
    OUT.write_text(json.dumps(manifest, indent=2))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
