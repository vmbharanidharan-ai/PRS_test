# Calibration pipeline (Level 4)

## Path A — research-grade honesty

GeneScope cannot access UK Biobank longitudinal genotypes. Level 4 uses **synthetic cohort pseudo-calibration**:

1. **Option A:** anchor β = ln(HR per SD) from published UKB translational papers.
2. **Option B:** simulate PRS Z from 1000G reference mean/sd, assign pseudo outcomes, fit logistic slope/intercept.

Outputs are **internally consistent** and suitable for demos / methodology papers — **not** clinically valid.

## Commands

```bash
python3 genomics-pipeline/calibration/opengwas_provenance.py
python3 genomics-pipeline/calibration/synthetic_cohort_calibration.py
# or
npm run build-calibration-stack
```

## Artifacts

| File | Level |
|------|-------|
| `src/data/opengwas-provenance.json` | 1 |
| `src/data/prs-reference/**` | 2 |
| SEER baselines in app | 3 |
| `public/models/*_synthetic_calibration.json` | 4 |

## Upgrade

Replace synthetic JSON with `fit_ukbb_models.py` when approved UKB/FinnGen phenotypes are available.
