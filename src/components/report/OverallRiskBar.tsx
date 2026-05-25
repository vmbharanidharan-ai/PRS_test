import type { OverallRiskSummary, PrecisionLevel } from "@/lib/types";
import clsx from "clsx";

const BAR_COLORS: Record<string, string> = {
  low: "from-emerald-400 to-emerald-500",
  average: "from-slate-300 to-slate-400",
  moderate: "from-amber-400 to-amber-500",
  high: "from-rose-400 to-rose-500",
};

export function OverallRiskBar({
  overall,
  precisionLevel,
}: {
  overall: OverallRiskSummary;
  precisionLevel: PrecisionLevel;
}) {
  const precisionLabel =
    precisionLevel === "genetic"
      ? "DNA-based precision"
      : precisionLevel === "demo"
        ? "Demo sample"
        : "Population estimate (no DNA)";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Section 1 · Overview
      </p>
      <h2 className="mt-2 text-xl font-bold text-slate-900">
        Overall inherited cancer risk pattern
      </h2>
      <p className="mt-1 text-sm text-slate-500">{precisionLabel}</p>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Lower</span>
          <span className="font-semibold text-slate-900">{overall.label}</span>
          <span className="text-slate-600">Higher</span>
        </div>
        <div className="relative mt-2 h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className={clsx(
              "absolute left-0 top-0 h-full rounded-full bg-gradient-to-r transition-all",
              BAR_COLORS[overall.tier],
            )}
            style={{ width: `${overall.barPercent}%` }}
          />
          <div
            className="absolute top-0 h-full w-1 bg-slate-800"
            style={{ left: `calc(${overall.barPercent}% - 2px)` }}
          />
        </div>
      </div>

      {overall.executiveIndexPercentile > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Executive index: {overall.executiveIndexPercentile}th percentile
          {overall.drivingCancer
            ? ` (driven by ${overall.drivingCancer})`
            : ""}
        </p>
      )}
      <p className="mt-4 text-sm leading-relaxed text-slate-700">
        {overall.summary}
      </p>
    </section>
  );
}
