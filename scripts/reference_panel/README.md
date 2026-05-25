# PRS reference panel pipeline (1000 Genomes)

## Goal

Replace theoretical HWE μ/σ with **empirical PRS distributions** from real individuals:

```
genotype → PRS_raw → ancestry reference panel → empirical percentile
```

## Data source (open)

**1000 Genomes Phase 3** (~2,504 samples):

| Super-pop | Code | ~N |
|-----------|------|-----|
| European | EUR | 503 |
| African | AFR | 661 |
| East Asian | EAS | 504 |
| South Asian | SAS | 489 |
| Admixed American | AMR | 347 |

Download: https://www.internationalgenome.org/category/phase-3/

Convert VCF → PLINK, QC (MAF 0.01, geno 0.02, HWE 1e-6), split by super-population.

## PLINK scoring (per population)

```bash
plink --bfile EUR_ref \
  --score pgs_harmonized.txt 1 2 3 header sum \
  --out EUR_PGS005104
```

Use **LD-clumped PGS Catalog scores** only (already in bundled weights).

## Build JSON for GeneScope

```bash
export ONEKG_DIR=/path/to/1kg/plink
export PGS_SCORE=/path/to/PGS005104_harmonized.txt
bash scripts/reference_panel/run_plink_1kg.sh breast PGS005104
```

Or from TSV:

```bash
python3 scripts/reference_panel/build_reference_json.py breast PGS005104 prs_by_pop.tsv
```

Output: `src/data/prs-reference/{cancer}/{pgs_id}/{EUR,AFR,...}.json`

## Bridge (until 1KG is run)

```bash
python3 scripts/reference_panel/build_population_bridge.py
```

Regenerates bundled EUR/AFR/EAS bridge files. Replace with `1kg_empirical_plink` when PLINK completes.

## Schema

See [docs/PRS_REFERENCE_SCHEMA.md](../../docs/PRS_REFERENCE_SCHEMA.md).
