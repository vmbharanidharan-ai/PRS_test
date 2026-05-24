#!/usr/bin/env python3
"""
Download PGS Catalog scoring files for cancer PRS used by PRS Screen.
Run: python3 scripts/fetch_pgs_weights.py
"""

from __future__ import annotations

import gzip
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "pgs" / "raw"

# Curated PGS IDs — validated against PGS Catalog metadata (May 2024+)
PGS_IDS = {
    "breast": "PGS005104",      # 89 variants, Jia et al. Nat Genet 2024
    "colorectal": "PGS004240",  # 89 variants, Fan et al. Int J Cancer 2023
    "prostate": "PGS000662",    # 269 variants, Conti et al. Nat Genet 2021
    "ovarian": "PGS000048",     # 17 variants, ovarian cancer GRCh37
}

FTP_TEMPLATE = (
    "https://ftp.ebi.ac.uk/pub/databases/spot/pgs/scores/{pgs_id}/ScoringFiles/{pgs_id}.txt.gz"
)


def download_pgs(pgs_id: str, dest: Path) -> None:
    url = FTP_TEMPLATE.format(pgs_id=pgs_id)
    print(f"Downloading {pgs_id} ...")
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=120) as response:
        data = response.read()
    dest.write_bytes(data)
    with gzip.open(dest, "rt") as f:
        lines = sum(1 for line in f if line.startswith("rs"))
    print(f"  -> {dest.name} ({lines} variants)")


def main() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    for cancer, pgs_id in PGS_IDS.items():
        dest = RAW_DIR / f"{pgs_id}.txt.gz"
        download_pgs(pgs_id, dest)
    print("\nDone. Run: python3 scripts/build_bundled_weights.py")


if __name__ == "__main__":
    main()
