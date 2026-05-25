import type { SnpContribution } from "@/lib/types";

export function SnpContributors({
  contributors,
}: {
  contributors: SnpContribution[];
}) {
  if (contributors.length === 0) return null;

  const max = Math.max(...contributors.map((c) => Math.abs(c.contribution)), 0.001);

  return (
    <details className="mt-6">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800">
        What changed this result? (top variants)
      </summary>
      <p className="mt-2 text-xs text-slate-500">
        Largest contributors to your polygenic score — educational transparency,
        not a clinical variant report.
      </p>
      <ul className="mt-3 space-y-2">
        {contributors.map((c) => {
          const pct = (Math.abs(c.contribution) / max) * 100;
          const direction = c.contribution >= 0 ? "toward higher" : "toward lower";
          return (
            <li key={c.rsid} className="text-xs">
              <div className="flex justify-between gap-2">
                <span className="font-mono text-slate-700">{c.rsid}</span>
                <span className="text-slate-500">
                  {c.userGenotype} · {direction}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${c.contribution >= 0 ? "bg-rose-400" : "bg-emerald-400"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
