import type { RiskTier } from "@/lib/types";
import clsx from "clsx";

const STYLES: Record<RiskTier, string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  average: "bg-slate-100 text-slate-700 border-slate-200",
  moderate: "bg-amber-100 text-amber-900 border-amber-200",
  high: "bg-rose-100 text-rose-900 border-rose-200",
};

const LABELS: Record<RiskTier, string> = {
  low: "Below average",
  average: "Average",
  moderate: "Moderately elevated",
  high: "Elevated",
};

export function RiskBadge({ tier }: { tier: RiskTier }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-3 py-1 text-sm font-medium",
        STYLES[tier],
      )}
    >
      {LABELS[tier]}
    </span>
  );
}
