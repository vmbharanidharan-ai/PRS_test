#!/usr/bin/env python3
"""
Project user genotypes onto 1000G PCA space → ancestry proportion weights.

softmax(-distance to super-population centroids in PC1–PC10)
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]


def softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - np.max(x))
    return e / e.sum()


def ancestry_weights_from_pcs(
    user_pcs: np.ndarray,
    centroids: dict[str, list[float]],
) -> dict[str, float]:
    pops = list(centroids.keys())
    dists = np.array(
        [
            np.linalg.norm(user_pcs[: len(c)] - np.array(c))
            for c in [centroids[p] for p in pops]
        ]
    )
    # closer centroid → higher weight
    w = softmax(-dists)
    return {p: float(w[i]) for i, p in enumerate(pops)}


def project_user(
    user_genotype_vector: np.ndarray,
    pca_model_path: Path,
) -> np.ndarray:
    import joblib

    pca = joblib.load(pca_model_path)
    g = np.asarray(user_genotype_vector, dtype=np.float64).reshape(1, -1)
    g = (g - g.mean()) / (g.std() + 1e-8)
    return pca.transform(g)[0]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--centroids", type=Path, required=True)
    parser.add_argument("--pca-model", type=Path)
    parser.add_argument("--user-matrix", type=Path, help="1 x n_snps npy")
    parser.add_argument("--out", type=Path, default=ROOT / "public/reference/ancestry_projection.json")
    args = parser.parse_args()

    centroids = json.loads(args.centroids.read_text())

    if args.user_matrix and args.user_matrix.exists() and args.pca_model:
        z = np.load(args.user_matrix)
        user_pcs = project_user(z, args.pca_model)
        weights = ancestry_weights_from_pcs(user_pcs, centroids)
        entropy = -sum(
            w * np.log(w + 1e-12) for w in weights.values() if w > 0
        ) / np.log(len(weights))
        out = {
            "proportions": weights,
            "pcs": user_pcs.tolist(),
            "ancestry_confidence": float(1 - entropy),
            "method": "pca_1kg",
        }
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(json.dumps(out, indent=2))
        print(json.dumps(out, indent=2))
    else:
        print("Provide --user-matrix and --pca-model after 1KG PCA build.")


if __name__ == "__main__":
    main()
