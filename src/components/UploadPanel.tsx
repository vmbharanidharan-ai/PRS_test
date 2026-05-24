"use client";

import { useRef, useState } from "react";
import type { AnalysisOptions } from "@/hooks/useAnalysis";
import {
  FamilyHistorySection,
  draftToFamilyHistory,
  type FamilyHistoryDraft,
} from "./FamilyHistorySection";

interface UploadPanelProps {
  onAnalyze: (file: File, options: AnalysisOptions) => void;
  loading: boolean;
}

export function UploadPanel({ onAnalyze, loading }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sex, setSex] = useState<"female" | "male" | "">("");
  const [age, setAge] = useState("");
  const [familyDraft, setFamilyDraft] = useState<FamilyHistoryDraft>({
    enabled: false,
  });

  const submit = () => {
    if (!file) return;
    onAnalyze(file, {
      sex: sex || undefined,
      age: age ? parseInt(age, 10) : undefined,
      familyHistory: draftToFamilyHistory(familyDraft),
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Upload raw genotype file
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Export your <strong>raw data</strong> from 23andMe (Settings → DNA →
        Browse raw data → Download) or AncestryDNA (Settings → DNA → Download
        raw DNA). Accepts <code className="text-xs">.txt</code> or{" "}
        <code className="text-xs">.zip</code> (we read the text inside).
      </p>

      <div
        className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-6 py-12 transition hover:border-brand-400"
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
          accept=".txt,.zip,.csv,.gz"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="font-medium text-brand-800">
          {file ? file.name : "Drop file here or click to browse"}
        </p>
        {file && (
          <p className="mt-1 text-xs text-slate-500">
            {(file.size / 1_000_000).toFixed(1)} MB
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Sex (optional)</span>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={sex}
            onChange={(e) => setSex(e.target.value as "" | "female" | "male")}
          >
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            Tailors breast / prostate / ovarian screening text
          </span>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Age (optional)</span>
          <input
            type="number"
            min={18}
            max={100}
            placeholder="e.g. 45"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </label>
      </div>

      <FamilyHistorySection value={familyDraft} onChange={setFamilyDraft} />

      <button
        type="button"
        disabled={!file || loading}
        onClick={submit}
        className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Analyzing… (30–60 sec)" : "Compute polygenic risk scores"}
      </button>
    </div>
  );
}
