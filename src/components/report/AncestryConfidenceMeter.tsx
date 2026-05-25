import type { AncestryConfidence } from "@/lib/types";
import clsx from "clsx";

export function AncestryConfidenceMeter({
  confidence,
}: {
  confidence: AncestryConfidence;
}) {
  const barColor =
    confidence.level === "high"
      ? "bg-emerald-500"
      : confidence.level === "moderate"
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">Model confidence</h4>
        <span className="text-xs font-medium text-slate-600">
          {confidence.label}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Variant match in your file</span>
            <span>{confidence.matchPercent}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={clsx("h-full rounded-full", barColor)}
              style={{ width: `${confidence.matchPercent}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Data applicability (reference model)</span>
            <span>{confidence.applicabilityPercent}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${confidence.applicabilityPercent}%` }}
            />
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-600">{confidence.populationNote}</p>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-800">
        {confidence.warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </div>
  );
}
