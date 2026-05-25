#!/usr/bin/env python3
"""
PCA on 1000 Genomes reference samples (LD-pruned SNP matrix).

Input: PLINK2 export or precomputed genotype matrix (n_samples x n_snps).
Output: pcs_1kg.npy, pca_model.pkl, super-population labels for centroids.

For production: use PLINK2 --pca on full 1KG pfile (faster at scale).
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT_DEFAULT = ROOT / "genomics-pipeline" / "data" / "1000g"


def load_genotype_matrix_from_plink(prefix: Path, max_snps: int = 50_000) -> np.ndarray:
    """Placeholder: load via plink2 --export A or read pre-exported .raw file."""
    raw = prefix.with_suffix(".raw")
    if not raw.exists():
        raise FileNotFoundError(
            f"Export matrix not found: {raw}\n"
            "Run: plink2 --pfile PREFIX --export A --export-cols ALT1,ALT2 --out PREFIX"
        )
    # Skip loading full file in stub — user runs with exported matrix
    raise NotImplementedError(
        "Provide --matrix path to .npy (samples x snps) or implement PLINK .raw reader"
    )


def fit_pca(X: np.ndarray, n_components: int = 10) -> tuple[np.ndarray, object]:
    from sklearn.decomposition import PCA

    X = np.asarray(X, dtype=np.float64)
    X = (X - X.mean(axis=0)) / (X.std(axis=0) + 1e-8)
    pca = PCA(n_components=n_components)
    pcs = pca.fit_transform(X)
    return pcs, pca


def build_superpop_centroids(
    pcs: np.ndarray, labels: np.ndarray
) -> dict[str, list[float]]:
    centroids: dict[str, list[float]] = {}
    for pop in np.unique(labels):
        mask = labels == pop
        centroids[str(pop)] = pcs[mask].mean(axis=0).tolist()
    return centroids


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--matrix", type=Path, help="npy samples x snps")
    parser.add_argument("--labels", type=Path, help="TSV sample_id super_pop")
    parser.add_argument("--out", type=Path, default=OUT_DEFAULT)
    parser.add_argument("--n-components", type=int, default=10)
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)

    if not args.matrix or not args.matrix.exists():
        print(
            "Stub: save genotype matrix as .npy then re-run.\n"
            "Example workflow documented in build_1kg_reference.sh"
        )
        # Write empty manifest for pipeline wiring
        manifest = {
            "status": "pending_1kg_matrix",
            "n_components": args.n_components,
            "source": "1000 Genomes Phase 3",
        }
        (args.out / "pca_manifest.json").write_text(json.dumps(manifest, indent=2))
        return

    X = np.load(args.matrix)
    pcs, pca = fit_pca(X, args.n_components)
    np.save(args.out / "pcs_1kg.npy", pcs)

    try:
        import joblib

        joblib.dump(pca, args.out / "pca_model.pkl")
    except ImportError:
        pass

    if args.labels and args.labels.exists():
        import pandas as pd

        lab = pd.read_csv(args.labels, sep="\t")
        sample_ids = lab.iloc[:, 0].values
        super_pops = lab.iloc[:, 1].values
        centroids = build_superpop_centroids(pcs, super_pops)
        (args.out / "superpop_centroids.json").write_text(
            json.dumps(centroids, indent=2)
        )

    print(f"Wrote PCA artifacts to {args.out}")


if __name__ == "__main__":
    main()
