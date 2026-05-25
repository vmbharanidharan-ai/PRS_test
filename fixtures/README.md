# Test genotype data (synthetic)

These files are **not real human DNA**. They are procedurally generated to match the 23andMe raw export format so you can test PRS Screen without your own data.

| File | Description |
|------|-------------|
| `synthetic-23andme-raw.zip` | **Use this** — same format users upload (~620k SNPs) |
| `synthetic-23andme-raw.txt` | Uncompressed version (larger) |
| `synthetic-23andme-raw.txt.gz` | Gzip alternative |

## Quick test

1. Download `synthetic-23andme-raw.zip` from this folder on GitHub.
2. Open PRS Screen → upload the ZIP.
3. You should get PRS results for breast, colorectal, prostate, and ovarian cancer.

All SNPs required by our bundled PGS Catalog weights are included with valid genotypes.

## Regenerate locally

```bash
python3 scripts/generate_test_genotype.py
```

Requires only Python 3.9+ (stdlib). Reproduces identical output with seed `42`.

## Why not real 23andMe data?

Raw consumer genotype files are personal health information. Public repos should use synthetic or consented research datasets only.
