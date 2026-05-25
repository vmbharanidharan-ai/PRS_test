"use client";

interface HomeEntryProps {
  onDemo: () => void;
  onUpload: () => void;
  onProfile: () => void;
  loading: boolean;
}

export function HomeEntry({
  onDemo,
  onUpload,
  onProfile,
  loading,
}: HomeEntryProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Understand your genetic health risks
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-slate-600">
          Educational inherited cancer risk insights — not a diagnosis. Everyone
          gets a report; DNA data adds precision.
        </p>
      </div>

      <div className="grid gap-4">
        <button
          type="button"
          disabled={loading}
          onClick={onDemo}
          className="group rounded-2xl border-2 border-brand-500 bg-gradient-to-r from-brand-50 to-white p-6 text-left shadow-sm transition hover:shadow-md disabled:opacity-60"
        >
          <span className="text-2xl">🔬</span>
          <p className="mt-2 text-lg font-semibold text-brand-900">
            Instant demo
          </p>
          <p className="mt-1 text-sm text-slate-600">
            See what your results could look like — no DNA, ~3 seconds
          </p>
        </button>

        <button
          type="button"
          onClick={onUpload}
          className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-brand-300"
        >
          <span className="text-2xl">🧬</span>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            Upload DNA file
          </p>
          <p className="mt-1 text-sm text-slate-600">
            23andMe, AncestryDNA, or raw genotype · highest precision
          </p>
        </button>

        <button
          type="button"
          onClick={onProfile}
          className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-brand-300"
        >
          <span className="text-2xl">👤</span>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            Build my profile
          </p>
          <p className="mt-1 text-sm text-slate-600">
            No DNA needed — age, sex, ancestry & family history estimate
          </p>
        </button>
      </div>
    </div>
  );
}
