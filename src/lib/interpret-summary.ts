import type { AnalysisResult, RiskStory } from "./types";

/**
 * Redacted summary sent to the LLM — computed scores only, no raw DNA,
 * no screening recommendations (those stay in the static report).
 */
export interface InterpretPayload {
  analyzedAt: string;
  variantsInFile: number;
  vendor: string;
  familyHistorySummary?: string[];
  cancers: {
    label: string;
    riskTier: string;
    riskStory: RiskStory;
    ancestryConfidence: { level: string; applicabilityPercent: number };
    topContributorCount: number;
    limitations: string[];
  }[];
}

export function buildInterpretPayload(result: AnalysisResult): InterpretPayload {
  return {
    analyzedAt: result.analyzedAt,
    variantsInFile: result.variantsInFile,
    vendor: result.vendor,
    familyHistorySummary: result.familyHistorySummary,
    cancers: result.reports.map((r) => ({
      label: r.label,
      riskTier: r.prs.riskTier,
      riskStory: r.riskStory,
      ancestryConfidence: {
        level: r.ancestryConfidence.level,
        applicabilityPercent: r.ancestryConfidence.applicabilityPercent,
      },
      topContributorCount: r.prs.topContributors.length,
      limitations: r.limitations,
    })),
  };
}

export function payloadToUserMessage(payload: InterpretPayload): string {
  return JSON.stringify(payload, null, 2);
}
