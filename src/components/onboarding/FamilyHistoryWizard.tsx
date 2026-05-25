"use client";

import type { FamilyHistoryDraft } from "@/components/FamilyHistorySection";
import { draftToFamilyHistory } from "@/components/FamilyHistorySection";

interface FamilyHistoryWizardProps {
  draft: FamilyHistoryDraft;
  onChange: (d: FamilyHistoryDraft) => void;
  step: number;
}

export function FamilyHistoryWizard({
  draft,
  onChange,
  step,
}: FamilyHistoryWizardProps) {
  const set = (patch: Partial<FamilyHistoryDraft>) =>
    onChange({ ...draft, enabled: true, ...patch });

  if (step === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Has any <strong>parent, sibling, or child</strong> been diagnosed with
          cancer?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              set({
                breastFirstDegree: false,
                colorectalFirstDegree: false,
                prostateFirstDegree: false,
                ovarianFirstDegree: false,
              })
            }
            className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-medium hover:bg-slate-50"
          >
            No / unsure
          </button>
          <button
            type="button"
            onClick={() => set({})}
            className="flex-1 rounded-xl border-2 border-brand-500 bg-brand-50 py-3 text-sm font-medium text-brand-800"
          >
            Yes
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-800">
          Which cancers in close relatives? (check all)
        </p>
        {[
          ["breastFirstDegree", "Breast cancer"],
          ["colorectalFirstDegree", "Colorectal cancer"],
          ["prostateFirstDegree", "Prostate cancer"],
          ["ovarianFirstDegree", "Ovarian cancer"],
          ["lynchSyndromeConcern", "Colon + uterine pattern (Lynch concern)"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(draft[key as keyof FamilyHistoryDraft])}
              onChange={(e) =>
                set({ [key]: e.target.checked } as Partial<FamilyHistoryDraft>)
              }
            />
            {label}
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="font-medium text-slate-800">
          Youngest relative&apos;s age at diagnosis (optional)
        </span>
        <select
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
          value={draft.youngestAffectedAge ?? ""}
          onChange={(e) =>
            set({
              youngestAffectedAge: e.target.value
                ? parseInt(e.target.value, 10)
                : undefined,
            })
          }
        >
          <option value="">Not sure</option>
          <option value="40">Under 40</option>
          <option value="45">40–49</option>
          <option value="55">50–59</option>
          <option value="65">60+</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(draft.ashkenaziJewish)}
          onChange={(e) => set({ ashkenaziJewish: e.target.checked })}
        />
        Ashkenazi Jewish ancestry (BRCA prevalence context)
      </label>
      {draftToFamilyHistory(draft) && (
        <p className="text-xs text-brand-700">
          Family context will be woven into your insights (educational only).
        </p>
      )}
    </div>
  );
}
