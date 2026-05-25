"""
PGS Catalog Calculator (pgsc_calc) integration via Docker.
Use for account-mode server-side scoring with catalog-normalized weights.

@see https://github.com/PGScatalog/pgsc_calc
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path
from typing import Any

PGSC_CALC_IMAGE = os.getenv(
    "PGSC_CALC_IMAGE",
    "ghcr.io/pgscatalog/pgsc_calc:2.0.0",
)
WORK_DIR = Path(os.getenv("PGSC_WORK_DIR", "/tmp/pgsc_calc"))


def run_pgsc_calc(
    genotype_path: Path,
    pgs_id: str,
    ancestry: str = "EUR",
) -> dict[str, Any]:
    """
    Run pgsc_calc in Docker. Requires Docker socket and mounted genotype file.
    Returns parsed summary JSON path or raises on failure.
    """
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    out_dir = WORK_DIR / pgs_id
    out_dir.mkdir(exist_ok=True)

    cmd = [
        "docker",
        "run",
        "--rm",
        "-v",
        f"{genotype_path.parent}:/input:ro",
        "-v",
        f"{out_dir}:/output",
        PGSC_CALC_IMAGE,
        "pgsc_calc",
        "score",
        "--pgs_id",
        pgs_id,
        "--target",
        f"/input/{genotype_path.name}",
        "--ancestry",
        ancestry,
        "-o",
        "/output",
    ]

    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if proc.returncode != 0:
        raise RuntimeError(
            f"pgsc_calc failed: {proc.stderr or proc.stdout or proc.returncode}"
        )

    return {
        "pgs_id": pgs_id,
        "output_dir": str(out_dir),
        "stdout": proc.stdout[-2000:] if proc.stdout else "",
    }
