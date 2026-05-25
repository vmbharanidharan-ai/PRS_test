#!/usr/bin/env python3
"""
Fetch population allele frequencies from Ensembl REST when missing from PGS files.
Replaces the p=0.3 fallback that biases variance estimates.

Usage (from build_bundled_weights.py or standalone):
  python3 scripts/fetch_variant_maf.py rs123 rs456
"""

from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from typing import Optional

ENSEMBL = "https://rest.ensembl.org"
CACHE: dict[str, Optional[float]] = {}


def fetch_maf_ensembl(rsid: str, population: str = "EUR") -> Optional[float]:
    rsid = rsid.lower()
    if rsid in CACHE:
        return CACHE[rsid]

    url = f"{ENSEMBL}/variation/human/{rsid}?pops=1"
    req = urllib.request.Request(
        url,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        CACHE[rsid] = None
        return None

    maf: Optional[float] = None
    for pop in data.get("populations", []):
        if pop.get("population") == population:
            try:
                maf = float(pop.get("frequency", 0))
            except (TypeError, ValueError):
                pass
            break

    if maf is None:
        for ma in data.get("mappings", []):
            for allele in ma.get("alleles", []):
                freq = allele.get("frequency")
                if freq is not None:
                    try:
                        maf = float(freq)
                        break
                    except (TypeError, ValueError):
                        pass

    CACHE[rsid] = maf
    time.sleep(0.15)
    return maf


def main() -> None:
    for rsid in sys.argv[1:]:
        maf = fetch_maf_ensembl(rsid)
        print(f"{rsid}\t{maf if maf is not None else 'NA'}")


if __name__ == "__main__":
    main()
