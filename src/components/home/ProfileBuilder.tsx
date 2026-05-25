"use client";

import { useState } from "react";
import {
  draftToFamilyHistory,
  type FamilyHistoryDraft,
} from "@/components/FamilyHistorySection";
import { FamilyHistoryWizard } from "@/components/onboarding/FamilyHistoryWizard";
import type { AncestryGroup, UserProfile } from "@/lib/types";

interface ProfileBuilderProps {
  onSubmit: (profile: UserProfile) => void;
  onBack: () => void;
  loading: boolean;
}

export function ProfileBuilder({
  onSubmit,
  onBack,
  loading,
}: ProfileBuilderProps) {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"" | "female" | "male">("");
  const [ancestry, setAncestry] = useState<AncestryGroup>("unknown");
  const [fhDraft, setFhDraft] = useState<FamilyHistoryDraft>({ enabled: true });
  const [fhStep, setFhStep] = useState(0);

  const submit = () => {
    const profile: UserProfile = {
      age: age ? parseInt(age, 10) : undefined,
      sex: sex || undefined,
      ancestry: ancestry === "unknown" ? undefined : ancestry,
      familyHistory: draftToFamilyHistory(fhDraft),
    };
    onSubmit(profile);
  };

  if (step === 0) {
    return (
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold">Build your profile</h2>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;ll estimate risk ranges using population epidemiology — not your
          DNA. Upload a genotype file later for precision.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Age
            <input
              type="number"
              min={18}
              max={100}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Sex at birth (optional)
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
        </div>
        <label className="mt-4 block text-sm">
          Ancestry (optional, broad group)
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={ancestry}
            onChange={(e) => setAncestry(e.target.value as AncestryGroup)}
          >
            <option value="unknown">Prefer not to say</option>
            <option value="european">European</option>
            <option value="african">African</option>
            <option value="asian">Asian</option>
            <option value="hispanic">Hispanic / Latino</option>
            <option value="other">Other / mixed</option>
          </select>
        </label>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onBack} className="rounded-lg border px-4 py-2 text-sm">
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white"
          >
            Next: family history
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <h2 className="text-xl font-bold">Family history</h2>
      <p className="mt-1 text-sm text-slate-600">Step {fhStep + 1} of 3</p>
      <div className="mt-4">
        <FamilyHistoryWizard draft={fhDraft} onChange={setFhDraft} step={fhStep} />
      </div>
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
          <button type="button" onClick={() => setStep(0)} className="rounded-lg border px-4 py-2 text-sm">
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
            disabled={loading}
            onClick={submit}
            className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Building report…" : "See my risk insights"}
          </button>
        )}
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setFhDraft({ enabled: false });
          submit();
        }}
        className="mt-3 w-full text-sm text-slate-500 hover:text-brand-600"
      >
        Skip family history
      </button>
    </div>
  );
}
