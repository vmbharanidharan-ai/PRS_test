# Joint log-risk model

## Problem (fixed)

**Invalid (removed):**

```
RR_total = RR_PRS × RR_FH × RR_clinical
```

Independent-effect multiplication on the risk scale is not a joint model and will be rejected in review.

## Correct structure

Single linear predictor on **log-relative-risk**:

```
log(RR) = β_PRS · Z_PRS + β_FH · FH + β_age · (age − 50) + Σ β_pop · w_pop + clinical_log_prior
RR = exp(log(RR))
P(disease) = 1 − (1 − R_base)^RR
```

- **FH** enters as **additive log terms** (e.g. ln(2) for first-degree breast FH), not as a second multiplier.
- **Profile mode:** external clinical models (Gail / Tyrer-Cuzick / PREMM5) contribute one **`clinical_log_prior = ln(RR_clinical)`** term when PRS is absent — still additive on log scale.
- **Ancestry:** weighted log offsets from inferred proportions (PCA preferred over self-report).

## Uncertainty

- PRS: bootstrap perturbation of Z by coverage-dependent SE
- Ancestry: entropy of proportion vector → confidence penalty
- Output: `lifetimeRiskPercent`, `ciLow`, `ciHigh`, `confidenceScore`, `prsCoverage`

## Implementation

| Layer | File |
|-------|------|
| TypeScript (browser) | `src/lib/joint-risk-model.ts`, `uncertainty.ts`, `absolute-risk.ts` |
| Python (batch/backend) | `genomics-pipeline/models/joint_risk_model.py` |

## Training production coefficients

Use cohort labels (e.g. UK Biobank incident cancer) with:

```python
from sklearn.linear_model import LogisticRegression
# features: Z_PRS, FH indicators, age, PCs 1-10
```

or `lifelines.CoxPHFitter` for time-to-event.

Do not ship hand-tuned β forever — calibrate on real phenotypes.
