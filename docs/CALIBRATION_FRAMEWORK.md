# GeneScope calibration framework (Path A — updated)

## Principle

**Reduce unvalidated inference layers.** Separate measured (PRS) from modeled (epidemiological) outputs. Credibility beats complexity.

## The real constraint

Not blocked by math — blocked by **labeled longitudinal genotype cohorts** (UKB, FinnGen). Production uses **literature β only**; synthetic cohort fitting is **demo/offline only**.

## Three-layer production stack

| Layer | Source | Output |
|-------|--------|--------|
| **1 — Genetics** | PGS Catalog (+ OpenGWAS provenance) | PRS_raw = Σ(d×β) |
| **2 — Normalization** | 1000 Genomes (strict ancestry) | Z, percentile (or uncalibrated warning) |
| **3 — Interpretation** | Literature HR per SD | log(RR)_PRS = ln(HR/SD)×Z, RR = exp(log RR) |

**SEER baseline:** informational population context % only — **not** used in P = 1−(1−R_base)^RR (disabled).

## Disabled in production (`validity-config.ts`)

| Feature | Status |
|---------|--------|
| Personalized absolute risk | `ABSOLUTE_RISK: "disabled"` |
| Synthetic cohort calibration | `SYNTHETIC_CALIBRATION: false` |
| Ancestry mixture fallback | `ANCESTRY_MIXTURE_FALLBACK: false` |
| Hardy–Weinberg percentile fallback | `LEGACY_HWE_FALLBACK: false` |
| Clinical tool equivalence claims | `CLINICAL_EQUIVALENCE: false` |

## Reference panels (Level 2)

- User must specify ancestry matching EUR / AFR / EAS (confidence ≥ 0.7).
- Otherwise: `uncalibrated_reference_warning` — no Z, no percentile, no RR from PRS.
- 1000G is for **Z normalization only**, not clinical interpretation.

## Uncertainty

Deterministic propagation: SE = f(match_rate, ancestry_confidence) on log(RR) → RR interval. **No bootstrap Z resampling.**

## Code layout

```
src/lib/risk-engine/
  core/           → production (literature-relative-risk, strict-reference, build-interpretation)
  demo/           → synthetic simulation (disabled flag)
validity-config.ts
```

## Offline demo (not in app outputs)

```bash
python3 genomics-pipeline/calibration/synthetic_cohort_calibration.py  # methodology / QA only
```

## Upgrade path

| Data | Action |
|------|--------|
| Full 1KG PLINK | Gold-standard Level 2 |
| UKB / FinnGen | Optional cohort-fitted β (replace literature-only) |
