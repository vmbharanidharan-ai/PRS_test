# GeneScope risk models

Educational implementations grounded in published epidemiology. Not FDA-cleared.

## DNA mode — joint absolute risk (Chatterjee et al., 2016; Lewis et al., 2021)

1. **PRS raw score:** Σ (dosage × β) over PGS Catalog variants  
2. **Z-score:** (raw − μ) / σ (μ, σ from HWE + Ensembl MAF when building weights)  
3. **RR_PRS:** exp(Z × ln(HR_per_SD))  
4. **RR_clinical:** multiplicative factors from family history  
5. **Absolute lifetime risk:** P = 1 − (1 − R_base)^RR_total where RR_total = RR_PRS × RR_clinical  

Cancer-specific HR/SD defaults in `src/lib/epidemiology-baselines.ts`.

## Profile mode — clinical consensus

| Cancer | Model |
|--------|--------|
| Breast | Tyrer-Cuzick (IBIS) lite when strong FH; else Gail (BCRAT) lite |
| Colorectal | PREMM5-inspired Lynch probability + CRC FH |
| Prostate / ovarian | Chatterjee clinical RR only (no PRS Z) |

## Executive index

`max(percentile)` across reported cancers — not arithmetic mean.

## Pathogenic gating

Targeted BRCA founder + MMR proxy loci in `src/lib/pathogenic-screen.ts`. Positive → block PRS reports, mandatory alert.

## Server scoring (optional)

`POST /scoring/pgscalc` runs [PGS Catalog Calculator](https://github.com/PGScatalog/pgsc_calc) via Docker in account mode.

## Building weights

`scripts/build_bundled_weights.py` calls Ensembl REST (`scripts/fetch_variant_maf.py`) for missing MAFs — **no p=0.3 fallback**.
