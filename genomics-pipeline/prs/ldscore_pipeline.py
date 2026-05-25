#!/usr/bin/env python3
"""
LD score pipeline wrapper (LDSC-compatible munging).

Use before PRS-CS / LDpred2:
  - munge_sumstats.py on GWAS summary statistics
  - ldsc.py --h2 / --rg for QC

See: https://github.com/bulik/ldsc
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
UKBB = ROOT / "genomics-pipeline" / "data" / "ukbb_summary_stats"


def run_munge(sumstats: Path, out_prefix: Path) -> None:
    script = ROOT / "tools" / "ldsc" / "munge_sumstats.py"
    if not script.exists():
        raise FileNotFoundError(
            "Install LDSC under tools/ldsc or set MUNGE_SUMSTATS path.\n"
            f"Expected: {script}"
        )
    subprocess.run(
        [
            "python3",
            str(script),
            "--sumstats",
            str(sumstats),
            "--out",
            str(out_prefix),
            "--merge-alleles",
            "data/1000g/EUR",
            "--n-min",
            "1000",
        ],
        check=True,
        cwd=ROOT,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sumstats", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=UKBB / "munged")
    args = parser.parse_args()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    run_munge(args.sumstats, args.out)
    print(f"Munged sumstats → {args.out}")


if __name__ == "__main__":
    main()
