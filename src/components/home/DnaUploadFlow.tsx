"use client";

import { useRef, useState } from "react";
import {
  draftToFamilyHistory,
  type FamilyHistoryDraft,
} from "@/components/FamilyHistorySection";
import { FamilyHistoryWizard } from "@/components/onboarding/FamilyHistoryWizard";
import type { AnalysisOptions } from "@/hooks/useAnalysis";
import type { AncestryGroup } from "@/lib/types";

interface DnaUploadFlowProps {
  onUpload: (file: File, opts: AnalysisOptions) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export function DnaUploadFlow({
  onUpload,
  onBack,
  loading,
  error,
}: DnaUploadFlowProps) {
  const [phase, setPhase] = useState<"guide" | "upload" | "family">("guide");
  const [vendor, setVendor] = useState<"23andme" | "ancestry">("23andme");
  const [file, setFile] = useState<File | null>(null);
  const [sex, setSex] = useState<"" | "female" | "male">("");
  const [age, setAge] = useState("");
  const [ancestry, setAncestry] = useState<AncestryGroup>("european");
  const [fhStep, setFhStep] = useState(0);
  const [fhDraft, setFhDraft] = useState<FamilyHistoryDraft>({ enabled: true });
  const inputRef = useRef<HTMLInputElement>(null);

  const opts = (): AnalysisOptions => ({
    sex: sex || undefined,
    age: age ? parseInt(age, 10) : undefined,
    ancestry,
    ancestryConfidence:
      ancestry === "unknown" || ancestry === "other" ? 0.5 : 0.9,
    familyHistory: draftToFamilyHistory(fhDraft),
  });

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-12 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="mt-4 font-medium">Analyzing your DNA locally…</p>
        {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
      </div>
    );
  }

  if (phase === "guide") {
    const steps =
      vendor === "23andme"
        ? ["23andme.com → DNA → Browse raw data → Download", "Save .zip or .txt"]
        : ["ancestry.com → DNA → Download Raw DNA", "Save .zip or .txt"];

    return (
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold">Upload your DNA file</h2>
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
          After analysis, you must confirm required safety statements before any
          report unlocks. The output is a structured research summary — not a
          personal risk diagnosis.
        </p>
        <div className="mt-4 flex gap-2">
          {(["23andme", "ancestry"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVendor(v)}
              className={`rounded-lg px-3 py-1.5 text-sm ${vendor === v ? "bg-brand-600 text-white" : "border"}`}
            >
              {v === "23andme" ? "23andMe" : "Ancestry"}
            </button>
          ))}
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <a
          href="/test-data/synthetic-23andme-raw.zip"
          download
          className="mt-4 inline-block text-sm text-brand-600 hover:underline"
        >
          Or use synthetic test file
        </a>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onBack} className="rounded-lg border px-4 py-2 text-sm">
            Back
          </button>
          <button
            type="button"
            onClick={() => setPhase("upload")}
            className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white"
          >
            Continue to upload
          </button>
        </div>
      </div>
    );
  }

  if (phase === "upload") {
    return (
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold">Drop your raw file</h2>
        <div
          className="mt-4 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-brand-200 py-12"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) setFile(f);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.zip"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="font-medium text-brand-800">
            {file ? file.name : "Drag & drop or browse"}
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Sex (optional)
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={sex}
              onChange={(e) => setSex(e.target.value as typeof sex)}
            >
              <option value="">—</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className="text-sm">
            Age (optional)
            <input
              type="number"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </label>
        </div>
        <label className="mt-4 block text-sm">
          Genetic ancestry (improves PRS percentile calibration)
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={ancestry}
            onChange={(e) => setAncestry(e.target.value as AncestryGroup)}
          >
            <option value="unknown">Prefer not to say / mixed</option>
            <option value="european">European</option>
            <option value="african">African</option>
            <option value="asian">East Asian</option>
            <option value="hispanic">Hispanic / Latino</option>
            <option value="other">Other</option>
          </select>
        </label>
        {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setPhase("guide")}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Back
          </button>
          <button
            type="button"
            disabled={!file}
            onClick={() => setPhase("family")}
            className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <h2 className="text-xl font-bold">Family history (optional)</h2>
      <FamilyHistoryWizard draft={fhDraft} onChange={setFhDraft} step={fhStep} />
      <div className="mt-6 flex gap-2">
        {fhStep > 0 ? (
          <button
            type="button"
            onClick={() => setFhStep((s) => s - 1)}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Back
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPhase("upload")}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Back
          </button>
        )}
        {fhStep < 2 ? (
          <button
            type="button"
            onClick={() => setFhStep((s) => s + 1)}
            className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={!file}
            onClick={() => file && onUpload(file, opts())}
            className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white"
          >
            Analyze my DNA (acknowledgement required next)
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => file && onUpload(file, { ...opts(), familyHistory: undefined })}
        className="mt-3 w-full text-sm text-slate-500"
      >
        Skip family history
      </button>
    </div>
  );
}
