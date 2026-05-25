import type { ScreeningTimelineItem } from "@/lib/types";

export function ScreeningTimeline({ items }: { items: ScreeningTimelineItem[] }) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-slate-900">
        What guidelines often discuss at this risk level
      </h4>
      <p className="mt-1 text-xs text-slate-500">
        General U.S. guideline context only — not personalized medical advice.
      </p>
      <div className="relative mt-4 space-y-0 border-l-2 border-brand-200 pl-6">
        {items.map((item, i) => (
          <div key={i} className="relative pb-6 last:pb-0">
            <span className="absolute -left-[1.65rem] top-1 flex h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
            {item.age > 0 && (
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                Age {item.age}+
              </p>
            )}
            <p className="font-medium text-slate-900">{item.label}</p>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
            <p className="mt-1 text-xs text-slate-400">Source: {item.source}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
