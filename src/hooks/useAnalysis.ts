"use client";

import { useCallback, useState } from "react";
import { parseGenotypeFile } from "@/lib/genotype-parser";
import { runAnalysis } from "@/lib/report-generator";
import type { AnalysisResult, FamilyHistoryInput } from "@/lib/types";

export interface AnalysisOptions {
  sex?: "female" | "male";
  age?: number;
  familyHistory?: FamilyHistoryInput;
}

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeFile = useCallback(
    async (file: File, options: AnalysisOptions = {}) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const text = await readGenotypeFileContent(file);
        const parsed = parseGenotypeFile(text);

        if (parsed.errors.length > 0 && parsed.variantCount < 1000) {
          throw new Error(parsed.errors[0]);
        }

        if (parsed.variantCount < 100000) {
          throw new Error(
            `Only ${parsed.variantCount.toLocaleString()} variants found. Raw 23andMe/Ancestry files typically contain 600,000+. You may have uploaded a summary report instead of raw data.`,
          );
        }

        const analysis = runAnalysis(parsed.genotypes, {
          vendor: parsed.vendor,
          variantCount: parsed.variantCount,
          sex: options.sex,
          age: options.age,
          familyHistory: options.familyHistory,
        });

        setResult(analysis);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyzeFile, reset };
}

async function readGenotypeFileContent(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".zip")) {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const txtEntry = Object.values(zip.files).find(
      (f) => !f.dir && /\.txt$/i.test(f.name) && !f.name.includes("README"),
    );
    if (!txtEntry) {
      throw new Error(
        "ZIP archive must contain a raw genotype .txt file (e.g. genome_*.txt).",
      );
    }
    return txtEntry.async("string");
  }
  return file.text();
}
