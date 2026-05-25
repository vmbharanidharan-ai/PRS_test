#!/usr/bin/env python3
"""
PRS-CS batch runner — LD-aware posterior weights.

https://github.com/getian107/PRScs

Outputs weights consumed by GeneScope scoring backend:
  genomics-pipeline/data/prs_cs/{cancer}/weights.txt
"""

from __future__ import annotations

import argparse
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PRSCS = ROOT / "tools" / "PRScs" / "PRScs.py"


def run_prs_cs(
    sumstats: Path,
    ldref: Path,
    bim_prefix: Path,
    out_dir: Path,
    ancestry: str = "EUR",
) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    if not PRSCS.exists():
        raise FileNotFoundError(
            f"Clone PRS-CS to {PRSCS.parent}\n"
            "git clone https://github.com/getian107/PRScs.git tools/PRScs"
        )
    subprocess.run(
        [
            "python3",
            str(PRSCS),
            "--ref_dir",
            str(ldref),
            "--bim_prefix",
            str(bim_prefix),
            "--sst_file",
            str(sumstats),
            "--n_gwas",
            "100000",
            "--out_dir",
            str(out_dir),
            "--chrom",
            "22",
        ],
        check=True,
    )
    return out_dir / f"{bim_prefix.name}_pst_eff_a1_b38.txt"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cancer", required=True)
    parser.add_argument("--sumstats", type=Path, required=True)
    parser.add_argument("--ldref", type=Path, required=True)
    parser.add_argument("--bim", type=Path, required=True)
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "genomics-pipeline/data/prs_cs",
    )
    args = parser.parse_args()
    out = args.out / args.cancer
    path = run_prs_cs(args.sumstats, args.ldref, args.bim, out)
    print(f"PRS-CS weights: {path}")


if __name__ == "__main__":
    main()
