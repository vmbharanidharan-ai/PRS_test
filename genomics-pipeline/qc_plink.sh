#!/usr/bin/env bash
# PLINK2 QC: convert VCF → pgen, standard filters
set -euo pipefail
INPUT="${1:?VCF path}"
OUT="${2:-sample_qc}"

plink2 --vcf "$INPUT" --snps-only just-acgt --make-pgen --out "$OUT"
plink2 --pfile "$OUT" --maf 0.01 --geno 0.02 --hwe 1e-6 --make-pgen --out "${OUT}_filtered"

echo "QC complete: ${OUT}_filtered"
