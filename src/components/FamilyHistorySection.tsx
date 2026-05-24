"use client";

import { useState } from "react";
import type { FamilyHistoryInput } from "@/lib/types";

export type FamilyHistoryDraft = Partial<
  Omit<FamilyHistoryInput, "provided">
> & { enabled: boolean };

const EMPTY_DRAFT: FamilyHistoryDraft = { enabled: false };

interface FamilyHistorySectionProps {
  value: FamilyHistoryDraft;
  onChange: (draft: FamilyHistoryDraft) => void;
}

export function FamilyHistorySection({
  value,
  onChange,
}: FamilyHistorySectionProps) {
  const [expanded, setExpanded] = useState(value.enabled);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (!next) {
      onChange(EMPTY_DRAFT);
    } else {
      onChange({ ...value, enabled: true });
    }
  };

  const set = (patch: Partial<FamilyHistoryDraft>) => {
    onChange({ ...value, enabled: true, ...patch });
  };

  const hasAnySelection =
    value.enabled &&
    (value.breastFirstDegree ||
      value.breastSecondDegree ||
      value.ovarianFirstDegree ||
      value.colorectalFirstDegree ||
      value.prostateFirstDegree ||
      value.lynchSyndromeConcern ||
      value.ashkenaziJewish ||
      value.youngestAffectedAge != null);

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80">
      <button
        type="button"
        onClick={toggleExpanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <div>
          <p className="font-medium text-slate-900">
            Family history{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Skip this unless you want extra screening notes combined with your
            PRS. Not required for analysis.
          </p>
        </div>
        <span className="shrink-0 text-sm text-brand-600">
          {expanded ? "Hide" : "Add details"}
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-slate-200 px-4 pb-4 pt-2">
          <p className="text-xs text-slate-500">
            Check all that apply. Leave blank anything you are unsure about.
          </p>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">
              Breast & ovarian
            </legend>
            {[
              ["breastFirstDegree", "First-degree relative with breast cancer"],
              [
                "breastSecondDegree",
                "Second-degree relative with breast cancer (no first-degree)",
              ],
              ["ovarianFirstDegree", "First-degree relative with ovarian cancer"],
              ["ashkenaziJewish", "Ashkenazi Jewish ancestry"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={Boolean(value[key as keyof FamilyHistoryDraft])}
                  onChange={(e) =>
                    set({ [key]: e.target.checked } as Partial<FamilyHistoryDraft>)
                  }
                />
                <span className="text-slate-700">{label}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">
              Colorectal
            </legend>
            {[
              [
                "colorectalFirstDegree",
                "First-degree relative with colorectal cancer",
              ],
              [
                "lynchSyndromeConcern",
                "Family pattern suggestive of Lynch syndrome (colon/uterine cancers)",
              ],
            ].map(([key, label]) => (
              <label key={key} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={Boolean(value[key as keyof FamilyHistoryDraft])}
                  onChange={(e) =>
                    set({ [key]: e.target.checked } as Partial<FamilyHistoryDraft>)
                  }
                />
                <span className="text-slate-700">{label}</span>
              </label>
            ))}
            <label className="block text-sm">
              <span className="text-slate-700">
                Youngest affected relative&apos;s age at diagnosis (optional)
              </span>
              <input
                type="number"
                min={1}
                max={100}
                placeholder="e.g. 45"
                className="mt-1 w-full max-w-[8rem] rounded-lg border border-slate-300 px-3 py-2"
                value={value.youngestAffectedAge ?? ""}
                onChange={(e) =>
                  set({
                    youngestAffectedAge: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  })
                }
              />
            </label>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800">
              Prostate
            </legend>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(value.prostateFirstDegree)}
                onChange={(e) => set({ prostateFirstDegree: e.target.checked })}
              />
              <span className="text-slate-700">
                First-degree relative with prostate cancer
              </span>
            </label>
          </fieldset>

          {value.enabled && !hasAnySelection && (
            <p className="text-xs text-amber-700">
              No items selected — report will use PRS and demographics only.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Convert UI draft to pipeline input; returns undefined if user skipped or selected nothing. */
export function draftToFamilyHistory(
  draft: FamilyHistoryDraft,
): FamilyHistoryInput | undefined {
  if (!draft.enabled) return undefined;

  const hasAny =
    draft.breastFirstDegree ||
    draft.breastSecondDegree ||
    draft.ovarianFirstDegree ||
    draft.colorectalFirstDegree ||
    draft.prostateFirstDegree ||
    draft.lynchSyndromeConcern ||
    draft.ashkenaziJewish ||
    draft.youngestAffectedAge != null;

  if (!hasAny) return undefined;

  return {
    provided: true,
    breastFirstDegree: draft.breastFirstDegree,
    breastSecondDegree: draft.breastSecondDegree,
    ovarianFirstDegree: draft.ovarianFirstDegree,
    colorectalFirstDegree: draft.colorectalFirstDegree,
    prostateFirstDegree: draft.prostateFirstDegree,
    lynchSyndromeConcern: draft.lynchSyndromeConcern,
    ashkenaziJewish: draft.ashkenaziJewish,
    youngestAffectedAge: draft.youngestAffectedAge,
  };
}
