#!/usr/bin/env python3
"""
Convert downloaded PGS Catalog scoring files into bundled JSON for the web app.
Computes population mean/SD from reported effect allele frequencies (HWE approximation).

Run after fetch_pgs_weights.py:
  python3 scripts/build_bundled_weights.py
"""

from __future__ import annotations

import gzip
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "pgs" / "raw"
OUT_DIR = ROOT / "src" / "data" / "prs"

CANCER_MAP = {
    "PGS005104": "breast",
    "PGS004240": "colorectal",
    "PGS000662": "prostate",
    "PGS000048": "ovarian",
}

DISPLAY_NAMES = {
    "breast": "PRSAFR (Breast cancer)",
    "colorectal": "CRC PRS (Colorectal cancer)",
    "prostate": "GRS.PCa.269 (Prostate cancer)",
    "ovarian": "Ovarian cancer PRS",
}


def parse_metadata(lines: list[str]) -> dict[str, str]:
    meta: dict[str, str] = {}
    for line in lines:
        if not line.startswith("#"):
            break
        m = re.match(r"#([\w_]+)=(.+)", line.strip())
        if m:
            meta[m.group(1)] = m.group(2).strip()
    return meta


def parse_scoring_file(path: Path) -> tuple[dict, list[dict]]:
    with gzip.open(path, "rt") as f:
        content = f.readlines()

    header_end = 0
    for i, line in enumerate(content):
        if line.startswith("rsID") or line.startswith("rsid"):
            header_end = i
            break

    meta = parse_metadata(content[:header_end])
    header = content[header_end].strip().split("\t")
    col = {name.lower(): idx for idx, name in enumerate(header)}

    def col_idx(*names: str) -> int | None:
        for n in names:
            if n in col:
                return col[n]
        return None

    rsid_i = col_idx("rsid")
    eff_i = col_idx("effect_allele")
    oth_i = col_idx("other_allele")
    wt_i = col_idx("effect_weight")
    chr_i = col_idx("chr_name", "chr")
    pos_i = col_idx("chr_position", "pos")
    af_i = col_idx(
        "allelefrequency_effect",
        "allelefrequency_effect_european",
        "effect_allele_frequency",
    )

    variants = []
    for line in content[header_end + 1 :]:
        if not line.strip() or line.startswith("#"):
            continue
        parts = line.strip().split("\t")
        if rsid_i is None or len(parts) <= max(rsid_i, eff_i or 0, wt_i or 0):
            continue
        rsid = parts[rsid_i].lower()
        if not rsid.startswith("rs"):
            continue
        try:
            weight = float(parts[wt_i]) if wt_i is not None else 0.0
        except (ValueError, TypeError):
            continue
        effect = parts[eff_i] if eff_i is not None else ""
        other = parts[oth_i] if oth_i is not None else ""
        # Multi-nucleotide alleles: use first base for matching (limitation noted in README)
        if len(effect) > 2:
            effect = effect[0]
        if len(other) > 2:
            other = other[0] if other else "N"

        freq = None
        if af_i is not None and af_i < len(parts):
            try:
                freq = float(parts[af_i])
            except ValueError:
                freq = None

        variants.append(
            {
                "rsid": rsid,
                "effectAllele": effect,
                "otherAllele": other,
                "weight": weight,
                "chr": parts[chr_i] if chr_i is not None and chr_i < len(parts) else None,
                "pos": int(parts[pos_i]) if pos_i is not None and pos_i < len(parts) and parts[pos_i].isdigit() else None,
                "_freq": freq,
            }
        )

    return meta, variants


def population_stats(variants: list[dict]) -> tuple[float, float]:
    """HWE-based mean and SD of PRS across reference population."""
    mean = 0.0
    var = 0.0
    for v in variants:
        p = v.get("_freq")
        if p is None or p <= 0 or p >= 1:
            p = 0.3  # conservative default when frequency missing
        beta = v["weight"]
        mean += 2 * p * beta
        var += 2 * p * (1 - p) * (beta ** 2)
    sd = math.sqrt(var) if var > 0 else 1.0
    return mean, sd


def build_definition(meta: dict, variants: list[dict], cancer: str) -> dict:
    mean, sd = population_stats(variants)
    clean_variants = [
        {k: v for k, v in var.items() if not k.startswith("_")}
        for var in variants
    ]
    pgs_id = meta.get("pgs_id", "")
    return {
        "pgsId": pgs_id,
        "cancerType": cancer,
        "name": DISPLAY_NAMES.get(cancer, meta.get("pgs_name", cancer)),
        "trait": meta.get("trait_reported", cancer),
        "genomeBuild": meta.get("genome_build", "GRCh37"),
        "weightType": meta.get("weight_type", "beta"),
        "citation": meta.get("citation", "PGS Catalog"),
        "variants": clean_variants,
        "population": {
            "mean": round(mean, 6),
            "sd": round(sd, 6),
            "ancestry": "European (approximated from effect allele frequencies in scoring file)",
            "source": f"PGS Catalog {pgs_id}; HWE approximation from reported allele frequencies",
        },
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for gz in sorted(RAW_DIR.glob("PGS*.txt.gz")):
        pgs_id = gz.name.replace(".txt.gz", "")
        cancer = CANCER_MAP.get(pgs_id)
        if not cancer:
            print(f"Skipping unmapped {pgs_id}")
            continue
        meta, variants = parse_scoring_file(gz)
        definition = build_definition(meta, variants, cancer)
        out_path = OUT_DIR / f"{cancer}.json"
        with open(out_path, "w") as f:
            json.dump(definition, f, indent=2)
        print(f"Wrote {out_path.name}: {len(variants)} variants, mean={definition['population']['mean']:.4f}, sd={definition['population']['sd']:.4f}")

    print("\nBundled weights ready for src/lib/prs-registry.ts")


if __name__ == "__main__":
    main()
