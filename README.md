# GeneScope

**Understand inherited cancer risk — in plain language.**

GeneScope helps you explore educational insights about breast, colorectal, prostate, and ovarian cancer risk. You can try a quick demo, upload a consumer DNA file, or answer a short profile questionnaire — no account required for local use.

> **Important:** GeneScope is for **learning and discussion with your doctor** — not a diagnosis, not medical advice, and not a substitute for genetic testing (e.g. BRCA or Lynch). Review [Terms](/terms) and [Privacy](/privacy) with a lawyer before any public launch.

---

## What you can do

| Option | What happens | Best for |
|--------|----------------|----------|
| **Instant demo** | See a full sample report in a few seconds | Exploring the app |
| **Upload DNA** | Your file is analyzed **in your browser** — raw DNA is not sent to our servers in local mode | Highest precision (23andMe or AncestryDNA raw export) |
| **Build my profile** | Estimates based on age, sex, ancestry, and family history — **not** your actual DNA | Trying the experience without a DNA file |

After any path, you get:

- An easy-to-read **overview** and per-cancer cards  
- **Screening notes** informed by NCCN / USPSTF / ACS guidelines (for discussion with a clinician)  
- Optional **family history** questions for extra context  
- **PDF download** and a **share link** (summary only — never raw genotypes)

---

## Try it locally (about 2 minutes)

**You need:** [Node.js 20+](https://nodejs.org/) (check with `node -v`)

```bash
cd ~/Projects/app-test
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

**No real DNA?** On the home screen, tap **Instant demo**, or upload the included test file:

`fixtures/synthetic-23andme-raw.zip` (~620k fake SNPs, not a real person)

---

## How your results are calculated

### When you upload DNA (or use the demo)

1. **Pathogenic screen first** — Targeted check for known high-risk BRCA founder and Lynch proxy positions on consumer chips. If positive, PRS is withheld and you see an urgent clinical alert.  
2. **Read your file** — Supports 23andMe and AncestryDNA raw `.txt` or `.zip` exports.  
3. **Score each cancer** — PGS Catalog weights, vectorized in-browser.  
4. **Empirical percentile** — Your PRS is ranked within an **ancestry-stratified reference panel** (1000 Genomes–style EUR/AFR/EAS), not a theoretical Gaussian from allele frequencies.  
5. **Calibrated absolute risk** — P = 1 − (1 − R_base)^(RR_PRS × RR_clinical) (Chatterjee et al., 2016; Lewis et al., 2021).  
6. **Executive index** — Overall summary uses your **highest** single-cancer percentile (not an average across cancers).  

Details: [docs/RISK_MODELS.md](docs/RISK_MODELS.md) · Reference pipeline: [scripts/reference_panel/README.md](scripts/reference_panel/README.md)

| Cancer | Research score (PGS Catalog) |
|--------|------------------------------|
| Breast | PGS005104 |
| Colorectal | PGS004240 |
| Prostate | PGS000662 |
| Ovarian | PGS000048 |

**What this does *not* include:** BRCA1/2, Lynch syndrome, or other rare high-risk mutations — only common variants from PRS models.

### When you use “Build my profile” (no DNA)

- **Breast:** simplified Gail (BCRAT) or Tyrer-Cuzick (IBIS) when family history is strong  
- **Colorectal:** PREMM5-inspired Lynch probability model  
- **Other cancers:** SEER baseline + clinical relative risk  

Still **not from your DNA** — upload a genotype file for polygenic calibration.

### Optional: save history (developers)

A **FastAPI + Postgres** backend supports accounts, consent, and private risk history. See [backend/README.md](backend/README.md) and [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md). Default web use stays **local-only** unless you enable account mode and set `NEXT_PUBLIC_API_URL`.

---

## Privacy at a glance

| Mode | Your DNA | Stored data |
|------|----------|-------------|
| **Local-only** (default) | Stays in your browser | Nothing on our servers |
| **Account** | Still processed client-side; optional sync of **summary** results | Phenotype + risk history (with consent) |
| **Research** | Separate opt-in | Anonymized aggregates only — no user ID |

---

## Optional features

### AI explainer

After a report, **Understand your results** can call OpenAI with **summary stats only** (percentiles, tiers — never raw DNA). Requires:

```bash
cp .env.example .env.local
# Add OPENAI_API_KEY=sk-...
npm run dev
```

Not available in the offline mobile build.

### Mobile app (iOS / Android)

```bash
npm run build:mobile
npx cap sync
npm run cap:ios    # or cap:android
```

Details: [docs/MOBILE.md](docs/MOBILE.md)

### Backend API (optional)

```bash
docker compose up -d postgres
cd backend && pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local` for the web app.

---

## For developers

### Project layout

```
src/
  app/              # Pages (home, terms, privacy)
  components/       # UI (home funnel, results, consent)
  lib/              # Parsing, PRS math, reports, guidelines
  data/prs/         # Bundled PGS weights (JSON)
scripts/            # Fetch/build weights, test data generator
backend/            # FastAPI API (optional)
fixtures/           # Synthetic 23andMe zip for testing
```

### Refresh PGS weights

When catalog scores are updated:

```bash
npm run prepare-data
```

Or step by step: `python3 scripts/fetch_pgs_weights.py` then `python3 scripts/build_bundled_weights.py`. Commit updated `src/data/prs/*.json` after checking [PGS Catalog](https://www.pgscatalog.org).

### Deploy (web)

```bash
npx vercel
```

Use static/client-side analysis; do not log genotype content. Optional monitoring (e.g. Sentry) should exclude DNA payloads.

---

## Before you ship to real users

**Clinical & science**

- Have a genetic counselor or oncologist review screening text in `src/lib/guidelines.ts`  
- Calibrate percentiles on a proper reference cohort (current model uses Hardy–Weinberg approximations)  
- Be explicit about reduced accuracy outside European-ancestry reference populations  

**Legal**

- Finalize Terms, Privacy, and disclaimers with healthcare counsel  
- Avoid “diagnosis” or “prediction” marketing — use “educational” and “discuss with your clinician”  
- Re-evaluate HIPAA/FDA/state rules if you add cloud storage or charge for reports  

**Product**

- App Store accounts and privacy labels if shipping mobile  
- Error monitoring without logging genetic data  

---

## Known limitations

- **Common variants only** — not BRCA, Lynch, or other pathogenic tests  
- **Percentiles are approximate** — not calibrated to your personal ancestry cohort  
- **European-centric PRS** — accuracy may differ for other ancestries  
- **Screening text is general** — not personalized medical care  

---

## License

Application code: MIT (add a `LICENSE` file before public release).  
PGS weights: follow [PGS Catalog download terms](https://www.pgscatalog.org/downloads/) for each score.
