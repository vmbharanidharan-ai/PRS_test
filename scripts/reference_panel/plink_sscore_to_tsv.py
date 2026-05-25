#!/usr/bin/env python3
"""Convert PLINK --score .profile to TSV rows for build_reference_json.py."""

import sys
from pathlib import Path

def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: plink_sscore_to_tsv.py <file.profile> <POP>")
        sys.exit(1)
    path, pop = Path(sys.argv[1]), sys.argv[2].upper()
    lines = path.read_text().splitlines()
    if not lines:
        return
    header = lines[0].split()
    try:
        iid_i = header.index("IID")
        score_i = header.index("SCORESUM") if "SCORESUM" in header else header.index("SCORE")
    except ValueError:
        iid_i, score_i = 0, -1
    for line in lines[1:]:
        parts = line.split()
        if len(parts) <= max(iid_i, score_i):
            continue
        print(f"{parts[iid_i]}\t{pop}\t{parts[score_i]}")

if __name__ == "__main__":
    main()
