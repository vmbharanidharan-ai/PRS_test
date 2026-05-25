#!/usr/bin/env bash
# Build 1KG PCA reference and project user sample
set -euo pipefail
REF_1KG="${ONEKG_PFILE:?1000G pfile prefix}"
USER="${1:?user pfile prefix}"
OUT="${2:-ancestry_proj}"

plink2 --pfile "$REF_1KG" --pca 20 --out 1000G_pca
plink2 --pfile "$USER" --load-pvar 1000G_pca.eigenvec.allele \
  --score 1000G_pca.eigenvec 2 3 header --out "$OUT"

echo "PCA projection: ${OUT}.sscore — feed to ancestry-inference (PC distances)"
