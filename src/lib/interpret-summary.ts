import type { AnalysisResult, RiskStory } from "./types";

/**
 * Redacted summary sent to the LLM — computed scores only, no raw DNA,
 * no screening recommendations (those stay in the static report).
 */
export interface InterpretPayload {
  analyzedAt: string;
  variantsInFile: number;
  vendor: string;
  mode: string;
  precisionLevel: string;
  overallRisk: AnalysisResult["overallRisk"];
  familyHistorySummary?: string[];
  cancers: {
    label: string;
    precision: string;
    riskStory: RiskStory;
    population: AnalysisResult["reports"][0]["population"];
    prsTier?: string;
    limitations: string[];
  }[];
}

export function buildInterpretPayload(result: AnalysisResult): InterpretPayload {
  return {
    analyzedAt: result.analyzedAt,
    variantsInFile: result.variantsInFile,
    vendor: result.vendor,
    familyHistorySummary: result.familyHistorySummary,
    mode: result.mode,
    precisionLevel: result.precisionLevel,
    overallRisk: result.overallRisk,
    cancers: result.reports.map((r) => ({
      label: r.label,
      precision: r.precision,
      riskStory: r.riskStory,
      population: r.population,
      prsTier: r.prs?.riskTier,
      limitations: r.limitations,
    })),
  };
}

export function payloadToUserMessage(payload: InterpretPayload): string {
  return JSON.stringify(payload, null, 2);
}
