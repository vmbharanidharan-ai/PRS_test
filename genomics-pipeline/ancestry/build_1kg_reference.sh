#!/usr/bin/env bash
# Download and QC 1000 Genomes Phase 3 for ancestry + PRS reference (manual URLs — FTP layout changes).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DATA="${ROOT}/genomics-pipeline/data/1000g"
mkdir -p "$DATA"

echo "=== GeneScope 1KG reference build ==="
echo "Data dir: $DATA"
echo ""
echo "1. Download Phase 3 PLINK or VCF from:"
echo "   https://www.internationalgenome.org/category/phase-3/"
echo "   https://ftp.1000genomes.ebi.ac.uk/vol1/ftp/release/20130502/"
echo ""
echo "2. Convert VCF to PLINK2 pgen (example):"
echo "   plink2 --vcf ALL.chr*.vcf.gz --make-pgen --out ${DATA}/1kg_raw"
echo ""
echo "3. QC:"
echo "   plink2 --pfile ${DATA}/1kg_raw --maf 0.01 --geno 0.02 --mind 0.02 --make-pgen --out ${DATA}/1kg_qc"
echo ""
echo "4. Super-population splits (sample list from integrated_call_samples panel):"
for POP in EUR AFR EAS SAS AMR; do
  echo "   plink2 --pfile ${DATA}/1kg_qc --keep ${DATA}/samples_${POP}.txt --make-pgen --out ${DATA}/1kg_${POP}"
done
echo ""
echo "5. Run PCA + PRS reference:"
echo "   python3 genomics-pipeline/ancestry/pca_1000g.py --pfile ${DATA}/1kg_qc --out ${DATA}/pcs_1kg"
echo "   bash genomics-pipeline/reference_panel/run_plink_1kg.sh  # per cancer"
echo ""
echo "Educational use only — not clinically validated."
