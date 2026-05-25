# GeneScope calibration framework (Path A)

## The real constraint

The upgrade is **not blocked by math**. It is blocked by **labeled longitudinal genotype cohorts** (UK Biobank, FinnGen, etc.) in one open download.

GeneScope chooses **Path A — research-grade honesty**:

- Explicitly **synthetic** pseudo-calibration
- **No** clinical validity claim
- Publishable as a **modeling methodology** (four-level public stack)

---

## Four levels

| Level | Source | Role |
|-------|--------|------|
| **1 — PRS construction** | PGS Catalog, OpenGWAS (provenance), GWAS Catalog | SNP weights β; raw PRS = Σ(d×β) |
| **2 — Reference distribution** | 1000 Genomes Phase 3 | Empirical percentile & Z vs EUR/AFR/EAS |
| **3 — Baseline incidence** | SEER | R_base (lifetime risk prior) |
| **4 — Pseudo calibration** | Literature HR/SD + synthetic cohort fit | Maps Z → log(RR) with fitted intercept/slope |

---

## Level 4 — Two options (both implemented)

### Option A — Literature anchor (best academic)

Use published **HR per 1 SD PRS** from UK Biobank translational papers:

\[
\beta_{\text{lit}} = \ln(\text{HR}/\text{SD})
\]

Sources: Lewis et al. 2021; Chatterjee 2016; cancer-specific GWAS.

### Option B — Synthetic cohort (engineering)

1. Sample PRS from **1000G-scaled** reference (mean, sd per population).
2. Standardize to Z.
3. Assign pseudo-outcomes: Bernoulli(sigmoid(α + β_lit·Z)) with α chosen so prevalence ≈ SEER baseline.
4. Fit logistic regression → **synthetic_intercept**, **synthetic_slope**.
5. Compare `slope_ratio = fitted / literature` (internal QA).

This is **internally consistent**, excellent for demos, **not** clinically valid.

---

## Artifacts

| File | Description |
|------|-------------|
| `public/models/calibration_architecture.json` | Four-level manifest |
| `public/models/{cancer}_synthetic_calibration.json` | Per-cancer, per-population fits |
| `src/data/opengwas-provenance.json` | Level 1 OpenGWAS / GWAS links |

## Build

```bash
npm run build-opengwas-provenance
npm run build-synthetic-calibration
```

Runtime: `src/lib/synthetic-calibration.ts` applies Level 4 in `risk-engine.ts`.

## Upgrade when data exist

| Resource | Action |
|----------|--------|
| FinnGen | Validate slope_ratio & calibration curves |
| UK Biobank | `fit_ukbb_models.py` replaces synthetic JSON |
| Full 1KG PLINK | `run_plink_1kg.sh` replaces bridge reference (Level 2) |

---

## Regulatory framing

> Synthetic cohort calibration is for **educational and methodological** use. It does not imply that GeneScope predicts individual cancer risk for clinical decisions.
