"""Bootstrap uncertainty on log-risk — mirror src/lib/uncertainty.ts"""

from __future__ import annotations

import random
from joint_risk_model import absolute_risk, log_rr


def bootstrap_ci(
    r_base: float,
    z_prs: float,
    beta_prs: float,
    fh_log: float,
    match_rate: float,
    n: int = 80,
    seed: int = 42,
) -> dict:
    rng = random.Random(seed)
    z_se = 0.08 if match_rate >= 0.95 else 0.15 + (1 - match_rate) * 0.5
    risks = []
    for _ in range(n):
        z_b = z_prs + (rng.random() - 0.5) * 2 * z_se
        lr = log_rr(z_prs=z_b, beta_prs=beta_prs, fh_log=fh_log)
        risks.append(absolute_risk(r_base, lr.log_rr) * 100)
    risks.sort()
    return {
        "lifetime_risk_percent": risks[len(risks) // 2],
        "ci_low": risks[int(n * 0.025)],
        "ci_high": risks[int(n * 0.975)],
        "prs_coverage": match_rate,
    }
