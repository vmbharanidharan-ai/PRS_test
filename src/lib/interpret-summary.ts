import type { AnalysisResult } from "./types";

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
    percentile: number;
    zScore: number;
    riskTier: string;
    matchRatePercent: number;
    pgsId: string;
    scoreName: string;
    plainLanguageSummary: string;
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
      percentile: r.prs.percentile,
      zScore: r.prs.zScore,
      riskTier: r.prs.riskTier,
      matchRatePercent: Math.round(r.prs.matchRate * 100),
      pgsId: r.prs.pgsId,
      scoreName: r.prs.name,
      plainLanguageSummary: r.plainLanguageSummary,
      limitations: r.limitations,
    })),
  };
}

export function payloadToUserMessage(payload: InterpretPayload): string {
  return JSON.stringify(payload, null, 2);
}
