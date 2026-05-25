#!/usr/bin/env python3
"""
LDpred2 runner stub — publication-grade LD modeling via bigsnpr.

https://privefl.github.io/bigsnpr/articles/LDpred2.html

Requires R/bigsnpr or exported weights into TSV for TS dot product.
"""

from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cancer", required=True)
    parser.add_argument("--gwas", type=Path, required=True)
    parser.add_argument("--ld-matrices", type=Path, required=True)
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "genomics-pipeline/data/ldpred2",
    )
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    print(
        "LDpred2 requires R bigsnpr pipeline.\n"
        "Export chromosome-level weights to:\n"
        f"  {args.out / args.cancer / 'weights.tsv'}\n"
        "Then set SCORING_BACKEND=ldpred2 in app env."
    )


if __name__ == "__main__":
    main()
