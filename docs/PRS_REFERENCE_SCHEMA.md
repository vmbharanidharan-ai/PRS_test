# PRS reference database schema

GeneScope stores **distributions**, not HWE-derived formulas.

## Runtime JSON (`src/data/prs-reference/`)

```
prs-reference/
  breast/PGS005104/EUR.json
  breast/PGS005104/AFR.json
  ...
```

| Field | Type | Description |
|-------|------|-------------|
| `pgsId` | string | PGS Catalog ID |
| `cancerType` | string | breast, colorectal, … |
| `population` | EUR \| AFR \| EAS \| SAS \| AMR \| MULTI | 1000G super-pop |
| `calibrationMethod` | enum | `1kg_empirical_plink`, `1kg_empirical_vcf`, `af_monte_carlo_bootstrap`, `legacy_hwe` |
| `nIndividuals` | int | Reference cohort size |
| `mean`, `sd`, `min`, `max` | float | Empirical PRS stats |
| `quantiles` | object | Keys `"0"`…`"100"` → PRS at that percentile |
| `ldClumpedScore` | bool | Score is LD-clumped per PGS Catalog |
| `source`, `build`, `qcVersion` | string | Provenance |

## Relational schema (optional Postgres extension)

```sql
-- studies / PGS definitions
CREATE TABLE prs_studies (
  study_id SERIAL PRIMARY KEY,
  pgs_id TEXT NOT NULL UNIQUE,
  trait TEXT,
  genome_build TEXT,
  n_snps INT,
  ld_clumped BOOLEAN DEFAULT TRUE
);

-- reference populations
CREATE TABLE reference_populations (
  population_id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,  -- EUR, AFR, ...
  source TEXT,
  n_individuals INT,
  qc_version TEXT
);

-- empirical distributions (core)
CREATE TABLE prs_distributions (
  id SERIAL PRIMARY KEY,
  pgs_id TEXT REFERENCES prs_studies(pgs_id),
  population_id INT REFERENCES reference_populations(population_id),
  mean_prs DOUBLE PRECISION,
  std_prs DOUBLE PRECISION,
  quantiles JSONB NOT NULL,
  min_prs DOUBLE PRECISION,
  max_prs DOUBLE PRECISION,
  calibration_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (pgs_id, population_id)
);

-- optional: per-sample PRS for audit
CREATE TABLE individual_prs_values (
  id BIGSERIAL PRIMARY KEY,
  population_id INT,
  sample_id TEXT,
  pgs_id TEXT,
  prs_value DOUBLE PRECISION
);
```

## App mapping

| User ancestry | Reference panel |
|---------------|-----------------|
| european | EUR |
| african | AFR |
| asian | EAS |
| hispanic | AMR |
| unknown / mixed | MULTI mixture |

If `ancestryConfidence < 0.7`, use weighted mixture (EUR 50%, AFR 20%, EAS 15%, …).
