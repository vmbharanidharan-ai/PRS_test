#!/usr/bin/env python3
"""
Level 1 provenance — link bundled PGS Catalog scores to OpenGWAS / GWAS Catalog context.

OpenGWAS (https://gwas.mrcieu.ac.uk/) hosts harmonized GWAS summary statistics used to
derive many PGS Catalog weights. GeneScope bundles PGS scoring files; this manifest
documents upstream GWAS provenance for methodology transparency (no API key required).
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "src" / "data" / "opengwas-provenance.json"

SCORES = {
    "breast": {
        "pgsId": "PGS005104",
        "trait": "Breast cancer",
        "gwasCatalog": "https://www.ebi.ac.uk/gwas/",
        "opengwas": "https://gwas.mrcieu.ac.uk/",
        "notes": "Jia et al. Nat Genet 2024 breast cancer GWAS; PGS Catalog LD-clumped score.",
    },
    "colorectal": {
        "pgsId": "PGS004240",
        "trait": "Colorectal cancer",
        "gwasCatalog": "https://www.ebi.ac.uk/gwas/",
        "opengwas": "https://gwas.mrcieu.ac.uk/",
        "notes": "Fan et al. Int J Cancer 2023; PGS Catalog.",
    },
    "prostate": {
        "pgsId": "PGS000662",
        "trait": "Prostate cancer",
        "gwasCatalog": "https://www.ebi.ac.uk/gwas/",
        "opengwas": "https://gwas.mrcieu.ac.uk/",
        "notes": "Conti et al. Nat Genet 2021; PGS Catalog.",
    },
    "ovarian": {
        "pgsId": "PGS000048",
        "trait": "Ovarian cancer",
        "gwasCatalog": "https://www.ebi.ac.uk/gwas/",
        "opengwas": "https://gwas.mrcieu.ac.uk/",
        "notes": "PGS Catalog curated ovarian score.",
    },
}


def main() -> None:
    doc = {
        "level": 1,
        "title": "PRS construction provenance",
        "sources": [
            {
                "name": "PGS Catalog",
                "url": "https://www.pgscatalog.org/",
                "role": "Bundled LD-clumped SNP weights (β) for runtime scoring",
            },
            {
                "name": "OpenGWAS",
                "url": "https://gwas.mrcieu.ac.uk/",
                "role": "Harmonized GWAS summary statistics underlying many PGS builds",
            },
            {
                "name": "GWAS Catalog",
                "url": "https://www.ebi.ac.uk/gwas/",
                "role": "Study metadata and trait associations",
            },
        ],
        "scores": SCORES,
        "disclaimer": "GeneScope does not redistribute full OpenGWAS summary stats; only PGS Catalog weights are bundled.",
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, indent=2))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
