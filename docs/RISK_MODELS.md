# GeneScope risk models

Educational implementations grounded in published epidemiology. Not FDA-cleared.

## DNA mode — empirical PRS calibration (preferred)

```
genotype → PRS_raw → ancestry reference panel → empirical percentile → RR_PRS → absolute risk
```

### Step 1 — Raw PRS

Σ (dosage × β) over harmonized PGS Catalog variants (LD-clumped scores).

### Step 2 — Reference panel (replaces HWE μ/σ)

Bundled under `src/data/prs-reference/{cancer}/{pgs_id}/{EUR|AFR|EAS|...}.json`:

- Built from **1000 Genomes Phase 3** individuals via PLINK `--score` (gold standard)
- Bridge files: run `python3 scripts/reference_panel/build_population_bridge.py` until PLINK completes

**Percentile** = empirical rank of user PRS in reference `quantiles` ladder (no Gaussian CDF).

**Z-score** (for RR only): `(PRS − μ_ref) / σ_ref` where μ_ref, σ_ref are **empirical** from the reference cohort.

### Step 3 — Ancestry matching

| User ancestry | 1000G panel |
|---------------|-------------|
| european | EUR |
| african | AFR |
| asian | EAS |
| hispanic | AMR |
| unknown / low confidence | MULTI mixture |

If `ancestryConfidence < 0.7`, weighted mixture across panels.

### Step 4 — Joint log-risk + absolute risk

**Single log-linear model (not multiplicative stacking):**

log(RR) = β_PRS·Z + β_FH·FH + β_age·age + β_ancestry·X  
RR = exp(log(RR))  
P = 1 − (1 − R_base)^RR

See [JOINT_RISK_MODEL.md](./JOINT_RISK_MODEL.md). Bootstrap 95% CI on lifetime risk %.

## Profile mode — clinical consensus

| Cancer | Model |
|--------|--------|
| Breast | Tyrer-Cuzick lite / Gail lite |
| Colorectal | PREMM5-inspired |
| Other | Clinical RR × SEER baseline |

## Executive index

max(percentile) across cancers.

## Pathogenic gating

BRCA founders + Lynch proxies before PRS.

## Building reference panels

See [scripts/reference_panel/README.md](../scripts/reference_panel/README.md) and [PRS_REFERENCE_SCHEMA.md](./PRS_REFERENCE_SCHEMA.md).

```bash
python3 scripts/reference_panel/build_population_bridge.py   # bridge
bash scripts/reference_panel/run_plink_1kg.sh breast PGS005104  # gold standard
```

## Legacy fallback

If no reference JSON is loaded, the app falls back to HWE metadata in `src/data/prs/*.json` with `calibrationMethod: legacy_hwe` and a warning.
