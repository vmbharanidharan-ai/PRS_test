"use client";

import { useRef, useState } from "react";
import type { AnalysisOptions } from "@/hooks/useAnalysis";
import {
  draftToFamilyHistory,
  type FamilyHistoryDraft,
} from "@/components/FamilyHistorySection";
import { FamilyHistoryWizard } from "./FamilyHistoryWizard";

export type DnaVendor = "23andme" | "ancestry" | null;

interface OnboardingFlowProps {
  loading: boolean;
  error: string | null;
  onDemo: (opts: AnalysisOptions) => void;
  onUpload: (file: File, opts: AnalysisOptions) => void;
}

type Step =
  | "welcome"
  | "path"
  | "export-guide"
  | "upload"
  | "family"
  | "analyzing";

export function OnboardingFlow({
  loading,
  error,
  onDemo,
  onUpload,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [vendor, setVendor] = useState<DnaVendor>(null);
  const [sex, setSex] = useState<"" | "female" | "male">("");
  const [age, setAge] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fhStep, setFhStep] = useState(0);
  const [fhDraft, setFhDraft] = useState<FamilyHistoryDraft>({ enabled: true });
  const [skipFamily, setSkipFamily] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = (): AnalysisOptions => ({
    sex: sex || undefined,
    age: age ? parseInt(age, 10) : undefined,
    familyHistory: skipFamily ? undefined : draftToFamilyHistory(fhDraft),
  });

  const submitUpload = () => {
    if (!file) return;
    setStep("analyzing");
    onUpload(file, options());
  };

  if (step === "welcome") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          Start here
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Your personal cancer risk insights
        </h2>
        <p className="mt-3 text-slate-600">
          Understand what your consumer DNA data may suggest about common-variant
          cancer risk — in plain language, with published science.{" "}
          <strong>Educational genetic information, not medical guidance.</strong>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>• Analysis stays on your device — raw DNA is not uploaded</li>
          <li>• Try a demo instantly, or use your 23andMe / Ancestry file</li>
          <li>• Discuss any concerns with a licensed clinician</li>
        </ul>
        <button
          type="button"
          onClick={() => setStep("path")}
          className="mt-8 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Get started
        </button>
      </div>
    );
  }

  if (step === "path") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Do you have 23andMe or AncestryDNA?
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setVendor("23andme");
              setStep("export-guide");
            }}
            className="rounded-xl border-2 border-slate-200 p-4 text-left hover:border-brand-400"
          >
            <span className="font-semibold">Yes — 23andMe</span>
            <p className="mt-1 text-xs text-slate-500">I can download raw data</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setVendor("ancestry");
              setStep("export-guide");
            }}
            className="rounded-xl border-2 border-slate-200 p-4 text-left hover:border-brand-400"
          >
            <span className="font-semibold">Yes — AncestryDNA</span>
            <p className="mt-1 text-xs text-slate-500">I can download raw DNA</p>
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setStep("analyzing");
            onDemo(options());
          }}
          disabled={loading}
          className="mt-4 w-full rounded-xl border-2 border-brand-500 bg-brand-50 py-4 font-semibold text-brand-800 hover:bg-brand-100"
        >
          {loading ? "Building demo insights…" : "Try sample data — instant demo"}
        </button>
        <p className="mt-2 text-center text-xs text-slate-500">
          No file needed · synthetic genome · ~3 seconds
        </p>
        {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
      </div>
    );
  }

  if (step === "export-guide") {
    const guide =
      vendor === "ancestry"
        ? [
            "Log in at ancestry.com → DNA → Settings",
            "Download Raw DNA (not the traits report)",
            "Save the .zip or .txt file",
          ]
        : [
            "Log in at 23andme.com → DNA → Browse raw data",
            "Download raw data (not health reports PDF)",
            "Save the .zip or .txt file",
          ];

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">How to export your file</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
          {guide.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ol>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Sex (optional)
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={sex}
              onChange={(e) => setSex(e.target.value as typeof sex)}
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className="text-sm">
            Age (optional)
            <input
              type="number"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="45"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => setStep("upload")}
          className="mt-6 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white"
        >
          I have my file — continue to upload
        </button>
        <button
          type="button"
          onClick={() => setStep("path")}
          className="mt-2 w-full text-sm text-slate-500 hover:text-brand-600"
        >
          ← Back
        </button>
      </div>
    );
  }

  if (step === "upload") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Upload your raw file</h2>
        <div
          className="mt-4 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 py-12"
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
            {file ? file.name : "Drag & drop or click to browse"}
          </p>
          {file && (
            <p className="mt-1 text-xs text-slate-500">
              {(file.size / 1e6).toFixed(1)} MB
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={!file}
          onClick={() => setStep("family")}
          className="mt-4 w-full rounded-xl bg-brand-600 py-3 font-semibold text-white disabled:opacity-50"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={() => setStep("export-guide")}
          className="mt-2 w-full text-sm text-slate-500"
        >
          ← Back
        </button>
      </div>
    );
  }

  if (step === "family") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Family history</h2>
        <p className="mt-1 text-sm text-slate-600">
          Step {fhStep + 1} of 3 — improves your insights (optional)
        </p>
        <div className="mt-6">
          <FamilyHistoryWizard
            draft={fhDraft}
            onChange={setFhDraft}
            step={fhStep}
          />
        </div>
        <div className="mt-6 flex gap-2">
          {fhStep > 0 && (
            <button
              type="button"
              onClick={() => setFhStep((s) => s - 1)}
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
              onClick={submitUpload}
              className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white"
            >
              Analyze my file
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setSkipFamily(true);
            setStep("analyzing");
            if (file) onUpload(file, { ...options(), familyHistory: undefined });
          }}
          className="mt-3 w-full text-sm text-slate-500 hover:text-brand-600"
        >
          Skip family history
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-12 text-center">
      {loading ? (
        <>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="mt-4 font-medium text-brand-900">Building your insights…</p>
          <p className="mt-1 text-sm text-slate-600">This usually takes under a minute</p>
        </>
      ) : (
        <>
          <p className="font-medium text-slate-900">Something went wrong</p>
          {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
          <button
            type="button"
            onClick={() => setStep("path")}
            className="mt-6 rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}
