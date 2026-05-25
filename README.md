# PRS Screen

Patient-facing **polygenic risk re-interpretation** for cancer screening decisions. Upload a raw **23andMe** or **AncestryDNA** genotype file; the app computes updated **polygenic risk scores (PRS)** for breast, colorectal, prostate, and ovarian cancer using **PGS Catalog** weights, compares to a reference distribution, and produces a **plain-language report** with **NCCN / USPSTF–informed** screening notes.

> **Regulatory framing:** Educational/informational only — not a medical device, not a diagnosis. Users must discuss results with a clinician. See [Terms](/terms) and [Privacy](/privacy) templates (require legal review before launch).

## Architecture

```
Raw genotype file (.txt / .zip)
        ↓
  Browser-only pipeline (no DNA uploaded)
        ├── genotype-parser.ts   ← 23andMe / Ancestry format
        ├── prs-calculator.ts    ← weighted sum + z-score / percentile
        └── report-generator.ts  ← guidelines + plain language
        ↓
  Interactive report UI + optional family history + PDF export
```

**Features:** on-device analysis · optional family-history questionnaire · PDF download · Capacitor iOS/Android — see [docs/MOBILE.md](docs/MOBILE.md).

| Cancer       | PGS Catalog ID | Variants | Source (via PGS Catalog)        |
|-------------|----------------|----------|----------------------------------|
| Breast      | PGS005104      | 89       | Jia et al., Nat Genet 2024       |
| Colorectal  | PGS004240      | 89       | Fan et al., Int J Cancer 2023    |
| Prostate    | PGS000662      | 269      | Conti et al., Nat Genet 2021     |
| Ovarian     | PGS000048      | 17       | PGS Catalog / GWAS literature    |

Population mean/SD are approximated from effect-allele frequencies in each scoring file (Hardy–Weinberg). For production, calibrate against a reference panel (e.g. 1000 Genomes or UK Biobank summary statistics).

## Quick start (you do this locally)

### 1. Install Node.js 20+

```bash
# macOS (Homebrew)
brew install node
node -v   # should be v20+
```

### 2. Install dependencies & run

```bash
cd ~/Projects/app-test
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Refresh GWAS weights (optional, quarterly)

When new PGS scores are published:

```bash
npm run prepare-data
# or separately:
python3 scripts/fetch_pgs_weights.py
python3 scripts/build_bundled_weights.py
```

Commit updated `src/data/prs/*.json` after validating scores in [PGS Catalog](https://www.pgscatalog.org/).

### 4. Test without real DNA

**Synthetic full genome (recommended):**

```bash
# Already in repo after clone:
#   fixtures/synthetic-23andme-raw.zip   (~620k SNPs, ~6.5 MB)
# Or regenerate:
npm run generate-test-data
```

Upload `fixtures/synthetic-23andme-raw.zip` in the app, or download from the UI link (“Download synthetic test genome”). See [fixtures/README.md](fixtures/README.md).

This is **fake data** (not a real person), but matches 23andMe format and includes all SNPs needed for PRS scoring.

---

## What you must do manually (checklist)

### Engineering

| Task | Why |
|------|-----|
| **Install Node 20+** and run `npm install` | Environment did not include npm in CI/agent |
| **Run `npm run dev`** and test with your own raw file | End-to-end validation |
| **Deploy** (Vercel, Netlify, or static export) | See [Deploy](#deploy) |
| **Set up error monitoring** (Sentry, etc.) | Optional; do not log genotype content |
| **Run Capacitor setup** (`npm run cap:sync`, Xcode/Android Studio) | See [docs/MOBILE.md](docs/MOBILE.md) |

### Scientific / clinical

| Task | Why |
|------|-----|
| **Review PGS IDs** in `scripts/fetch_pgs_weights.py` | Swap to newer scores when literature moves |
| **Calibrate percentiles** on a reference cohort | HWE approximation is a MVP; clinical use needs empirical mean/SD |
| **Oncologist / genetic counselor review** of guideline mapping in `src/lib/guidelines.ts` | Reduce liability; align wording with NCCN/USPSTF |
| **Ancestry-specific scores** | Current weights are European-centric; add trans-ancestry PRS or disclaimers |
| **Family history intake** | PRS is not a substitute for BRCA/Lynch testing — add a short questionnaire |

### Legal / regulatory (critical before charging users)

| Task | Why |
|------|-----|
| **Retain healthcare attorney** | “Educational” framing still has FDA/state risk |
| **Finalize Terms, Privacy, and disclaimer** | Templates in `src/app/terms`, `src/app/privacy`, `DisclaimerBanner` |
| **No “diagnosis” or “risk prediction” marketing** | Use “informational,” “for discussion with physician” |
| **State laboratory / CLIA** | Not applicable if you never receive samples; **confirm** for your model |
| **HIPAA** | Browser-only processing avoids PHI storage; changes if you add accounts/cloud |
| **FDA General Wellness / LDT** | Get written legal opinion on classification |

### Business / App Store

| Task | Why |
|------|-----|
| **Apple Developer + Google Play accounts** | ~$99/yr + $25 one-time |
| **Privacy nutrition labels** | Declare “genetic data processed on device” if true |
| **Subscription billing** (Stripe / RevenueCat) | If using one-time report or subscription model |
| **Clinical advisory board** | Credibility for DTC marketing |

---

## Deploy

**Vercel (recommended):**

```bash
npm install -g vercel   # or npx vercel
vercel
```

Ensure environment has no server-side DNA logging. Default build is static client-side analysis.

**Docker (optional):** add a `Dockerfile` with `node:20-alpine`, `npm run build`, `npm start`.

---

## Mobile app (Capacitor)

Native iOS/Android is configured in this repo:

```bash
npm install
npm run build:mobile
npx cap add ios && npx cap add android   # first time only
npm run cap:sync
npm run cap:ios    # or cap:android
```

Full steps: **[docs/MOBILE.md](docs/MOBILE.md)**.

## PDF export

After analysis, use **Download PDF** on the report screen. Generated client-side via `jspdf` (no server).

## Family history (optional)

Users can expand **Family history (optional)** on the upload form. If skipped, the report uses PRS + sex/age only. If completed, extra NCCN-oriented notes are appended per cancer type (does not replace genetic testing for BRCA/Lynch).

---

## Project layout

```
scripts/
  fetch_pgs_weights.py      # Download from PGS Catalog FTP
  build_bundled_weights.py    # → src/data/prs/*.json
src/lib/
  genotype-parser.ts          # 23andMe / Ancestry parsing
  prs-calculator.ts           # Dosage × weight, z-score, percentile
  report-generator.ts         # Full analysis + reports
  guidelines.ts               # NCCN / USPSTF screening text
  prs-registry.ts             # Loads bundled JSON weights
src/data/prs/                 # Bundled PGS weights (committed)
src/components/               # Upload + report UI
```

---

## Updating scores

1. Find new PGS IDs on [pgscatalog.org](https://www.pgscatalog.org).
2. Edit `PGS_IDS` in `scripts/fetch_pgs_weights.py` and `CANCER_MAP` in `build_bundled_weights.py`.
3. Run `npm run prepare-data`.
4. Test match rates on real 23andMe files (target **>80%** variant match per cancer).

---

## Limitations (disclose to users)

- PRS captures **common variants only** — not BRCA1/2, Lynch, or other monogenic risk.
- Percentiles use **approximate** population parameters, not your personal cohort.
- **Non-European ancestry** may have reduced accuracy.
- Screening text is **general** — not a substitute for personalized medical care.

---

## License

Code: MIT (add `LICENSE` file before public release).  
PGS weights: follow [PGS Catalog terms](https://www.pgscatalog.org/downloads/) per score.
