# GeneScope genomics pipeline — research upgrade

## Directive (do not violate)

We are upgrading GeneScope from **heuristic PRS approximation** to a **cohort-calibrated research pipeline**.

| Constraint | Rule |
|------------|------|
| Frontend | **Unchanged** — no report structure or UI rewrites |
| Browser-first | **Preserved** — local genotype analysis remains default |
| API contracts | **Preserved** — `buildAbsoluteRiskBreakdown`, `populationFromPrs`, `computePrsForScore` signatures stable |
| Internal engine | **Replace** — reference panels, coefficients, PRS backend, evaluation |

**Do not** present outputs as clinically validated. Educational / research-grade only.

## Target flow

```
Genotype (browser or server)
    → PRS-CS / LDpred2 / PLINK score (prs/)
    → 1000G PCA ancestry (ancestry/)
    → UK Biobank–fitted Cox model (models/)
    → calibration + metrics (evaluation/)
    → existing report generator (unchanged UI)
```

## Directory layout

```
genomics-pipeline/
  ancestry/          build_1kg_reference.sh, pca_1000g.py, project_samples.py
  prs/               ldscore_pipeline.py, prs_cs_runner.py, ld_pred2_runner.py
  models/            cox_models.py, fit_ukbb_models.py
  evaluation/        calibration.py, metrics.py, plots.py
  data/              1000g/, ukbb_summary_stats/ (not committed — large)
```

## Artifact outputs (consumed by app)

| Artifact | Path | Replaces |
|----------|------|----------|
| Cox coefficients | `public/models/{cancer}_cox.json` | Hand-tuned β in `joint-risk-model.ts` |
| 1KG reference | `public/reference/1kg_prs_reference.json` | Bridge `src/data/prs-reference/*` |
| PCA model | `public/reference/pca_1kg.json` | Self-report ancestry heuristic |
| PRS-CS weights | `data/prs_cs/{cancer}/weights.txt` | PGS Catalog-only weights |

Runtime: `src/lib/risk-engine.ts` loads cohort artifacts when present; falls back to legacy engine otherwise.
