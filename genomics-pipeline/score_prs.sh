#!/usr/bin/env bash
# Score PRS with PLINK2 (prefer LD-clumped PGS Catalog weights)
set -euo pipefail
PFILE="${1:?sample pfile prefix}"
WEIGHTS="${2:?score file}"
OUT="${3:-prs_output}"

plink2 --pfile "$PFILE" --score "$WEIGHTS" 1 2 3 header --out "$OUT"

echo "PRS scores: ${OUT}.sscore"
