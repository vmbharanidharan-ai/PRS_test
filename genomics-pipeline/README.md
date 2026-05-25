# GeneScope genomics pipeline

Research-grade path: **do not rebuild PRS from scratch in TypeScript** — use standard tools, then joint log-risk in app/backend.

## Tool stack (use these, do not reimplement)

| Step | Tool | Purpose |
|------|------|---------|
| QC | [PLINK 2](https://www.cog-genomics.org/plink/2.0/) | `--make-pgen`, MAF/HWE/missingness |
| PRS | PLINK2 `--score` or [PRS-CS](https://github.com/getian107/PRScs) | LD-aware weights |
| Advanced | [LDpred2](https://privefl.github.io/bigsnpr/articles/LDpred2.html) | Publication-grade shrinkage |
| Reference | [1000 Genomes Phase 3](https://www.internationalgenome.org/) | LD, AF, PCA, empirical PRS cohort |
| Ancestry | PLINK2 `--pca` + projection | Replace self-report |
| Clinical | [BCRAT](https://bcrisktool.cancer.gov/), [PREMM5](https://premm.dfci.harvard.edu/) | Do not hack production logic — wrap or link |

## Pipeline flow

```
VCF / 23andMe
    → qc_plink.sh
    → score_prs.sh (PLINK2 or PRS-CS)
    → ancestry_pca.sh (project onto 1KG PCs)
    → cohort parquet / JSON reference (replace src/data/prs-reference)
    → joint_risk_model (Python or TS risk_engine)
    → uncertainty bootstrap
    → report
```

## Scripts

- `qc_plink.sh` — sample QC
- `score_prs.sh` — PLINK2 scoring
- `ancestry_pca.sh` — PCA reference + user projection
- `../scripts/reference_panel/run_plink_1kg.sh` — empirical reference distributions

## Python models (`genomics-pipeline/models/`)

- `prs_model.py` — load PLINK score output
- `joint_risk_model.py` — log(RR) linear predictor (mirror of TS)
- `uncertainty.py` — bootstrap CI

## Output artifacts

- `data/1000G_reference/` — PLINK pfile per super-pop (not in git)
- `data/prs_cohort/` — per-sample PRS TSV from 1KG
- `src/data/prs-reference/` — quantile JSON consumed by web app
