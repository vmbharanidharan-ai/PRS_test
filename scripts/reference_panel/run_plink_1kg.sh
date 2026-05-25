#!/usr/bin/env bash
# Gold-standard empirical PRS reference from 1000 Genomes Phase 3.
#
# Prerequisites:
#   - plink 1.9+ or plink2
#   - QC'd PLINK bed per super-population (EUR, AFR, EAS, SAS, AMR)
#   - PGS Catalog scoring file (munged, aligned build)
#
# Environment:
#   ONEKG_DIR=/path/to/1kg/plink   # contains EUR.bed, AFR.bed, ...
#   PGS_SCORE=/path/to/pgs_score.txt
#
# Example (EUR breast PGS005104):
#   plink --bfile "$ONEKG_DIR/EUR" \
#     --score "$PGS_SCORE" 1 2 3 header sum \
#     --out reference_panel/output/EUR_PGS005104
#
# Then:
#   python3 scripts/reference_panel/plink_sscore_to_tsv.py reference_panel/output/EUR_PGS005104.sscore EUR > /tmp/eur.tsv
#   python3 scripts/reference_panel/build_reference_json.py breast PGS005104 /tmp/eur.tsv

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ONEKG_DIR="${ONEKG_DIR:-}"
PGS_SCORE="${PGS_SCORE:-}"
CANCER="${1:-breast}"
PGS_ID="${2:-PGS005104}"

if [[ -z "$ONEKG_DIR" || -z "$PGS_SCORE" ]]; then
  echo "Set ONEKG_DIR and PGS_SCORE. See scripts/reference_panel/README.md"
  exit 1
fi

OUT="$ROOT/reference_panel/output"
mkdir -p "$OUT"

for POP in EUR AFR EAS SAS AMR; do
  BFILE="$ONEKG_DIR/$POP"
  if [[ ! -f "${BFILE}.bed" ]]; then
    echo "Skip $POP — missing ${BFILE}.bed"
    continue
  fi
  PREFIX="$OUT/${POP}_${PGS_ID}"
  plink --bfile "$BFILE" --score "$PGS_SCORE" 1 2 3 header sum --out "$PREFIX"
  python3 "$ROOT/scripts/reference_panel/plink_sscore_to_tsv.py" "${PREFIX}.profile" "$POP" >> "$OUT/${PGS_ID}_all.tsv"
done

python3 "$ROOT/scripts/reference_panel/build_reference_json.py" "$CANCER" "$PGS_ID" "$OUT/${PGS_ID}_all.tsv"
echo "Done. JSON under src/data/prs-reference/"
