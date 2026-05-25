# GeneScope data sources (UKB-equivalent stack)

UK Biobank is used only as a **conceptual calibration standard**. This app does **not** assume access to UKB individual-level data.

We compose signal from **three public layers**:

## Layer 1 — PRS genetics (SNP weights)

| Source | Role |
|--------|------|
| [PGS Catalog](https://www.pgscatalog.org/) | LD-clumped scoring files bundled in `src/data/prs/` |
| [GWAS Catalog](https://www.ebi.ac.uk/gwas/) | Provenance for trait associations |
| PRS-CS / LDpred2 (optional) | `genomics-pipeline/prs/` — LD-aware reweighting |

**Cannot do from GWAS alone:** individual genotypes, cohort-specific Cox fitting.

## Layer 2 — Baseline population risk \(R_{\text{base}}\)

| Source | Role |
|--------|------|
| [SEER](https://seer.cancer.gov/) | U.S. lifetime / age-sex incidence priors |
| [GLOBOCAN](https://gco.iarc.who.int/) | Global context (future) |

**NHANES + SEER:** good for demographic baseline hazard; **not** PRS training (limited GWAS in NHANES).

## Layer 3 — Cox coefficients (log-risk \(\beta\))

| Source | Role |
|--------|------|
| Published **HR per 1 SD PRS** | \(\beta_{\text{prs}} = \ln(\text{HR/SD})\) — Lewis et al. 2021; cancer GWAS |
| Published **family history HRs** | additive on log scale (not multiplicative stacking) |
| Chatterjee et al. 2016 | Absolute risk mapping \(P = 1 - (1-R_{\text{base}})^{RR}\) |

Exported to `public/models/{cancer}_cox.json` via:

```bash
python3 genomics-pipeline/models/literature_cox_models.py
```

**Not UK Biobank-fitted** unless you run `fit_ukbb_models.py` on approved data.

## Ancestry structure

| Source | Role |
|--------|------|
| [1000 Genomes Phase 3](https://www.internationalgenome.org/) | PCA reference, empirical PRS distributions |
| Self-report | Fallback proportions until PCA projection runs |

**FinnGen:** best **validation** cohort (application required; Finnish ancestry bias) — compare published HR/SD and calibration, not shipped in repo.

## What cannot be openly replaced

- Joint **genotype + phenotype + survival + PCs** at UKB scale in one open download  
- True **Cox fitting** on genome-wide PRS without controlled-access cohort  

## Upgrade paths (optional)

1. **FinnGen** — validate coefficients and calibration  
2. **UK Biobank** — `fit_ukbb_models.py` replaces literature JSON  
3. **EPIC / BCAC** — sub-studies for sensitivity analyses (not wired by default)

## Regulatory framing

Educational / research-grade. Not clinically validated. Not a substitute for NCI BCRAT, PREMM5, or germline testing.
