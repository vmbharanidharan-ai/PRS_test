"use client";

import { useCallback, useState } from "react";
import { parseGenotypeFile } from "@/lib/genotype-parser";
import { runAnalysis, runProfileAnalysis } from "@/lib/report-generator";
import type {
  AnalysisResult,
  FamilyHistoryInput,
  UserProfile,
} from "@/lib/types";

export interface AnalysisOptions {
  sex?: "female" | "male";
  age?: number;
  ancestry?: UserProfile["ancestry"];
  ancestryConfidence?: number;
  familyHistory?: FamilyHistoryInput;
}

const DEMO_ZIP_URL = "/test-data/synthetic-23andme-raw.zip";

export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runParsed = useCallback(
    (
      parsed: ReturnType<typeof parseGenotypeFile>,
      options: AnalysisOptions,
      mode: "dna" | "demo",
    ) => {
      if (parsed.errors.length > 0 && parsed.variantCount < 1000) {
        throw new Error(parsed.errors[0]);
      }
      if (mode === "dna" && parsed.variantCount < 100000) {
        throw new Error(
          `Only ${parsed.variantCount.toLocaleString()} variants found. Raw 23andMe/Ancestry files typically contain 600,000+.`,
        );
      }

      return runAnalysis(parsed.genotypes, {
        vendor: mode === "demo" ? "23andme" : parsed.vendor,
        variantCount: parsed.variantCount,
        sex: options.sex,
        age: options.age,
        ancestry: options.ancestry,
        ancestryConfidence: options.ancestryConfidence,
        familyHistory: options.familyHistory,
        mode,
      });
    },
    [],
  );

  const analyzeFile = useCallback(
    async (file: File, options: AnalysisOptions = {}) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const text = await readGenotypeFileContent(file);
        const parsed = parseGenotypeFile(text);
        setResult(runParsed(parsed, options, "dna"));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed");
      } finally {
        setLoading(false);
      }
    },
    [runParsed],
  );

  const runDemo = useCallback(
    async (options: AnalysisOptions = {}) => {
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const [, res] = await Promise.all([
          new Promise((r) => setTimeout(r, 1200)),
          fetch(DEMO_ZIP_URL),
        ]);
        if (!res.ok) {
          throw new Error(
            "Could not load sample genome. Run: npm run generate-test-data (needs public/test-data/synthetic-23andme-raw.zip).",
          );
        }
        const blob = await res.blob();
        const file = new File([blob], "synthetic-23andme-raw.zip", {
          type: "application/zip",
        });
        const text = await readGenotypeFileContent(file);
        const parsed = parseGenotypeFile(text);
        setResult(
          runParsed(
            parsed,
            {
              sex: "female",
              age: 45,
              ancestry: "european",
              ancestryConfidence: 0.9,
              ...options,
            },
            "demo",
          ),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Demo failed");
      } finally {
        setLoading(false);
      }
    },
    [runParsed],
  );

  const runProfile = useCallback(async (profile: UserProfile) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setResult(runProfileAnalysis(profile));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile estimate failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSharedResult = useCallback((shared: AnalysisResult) => {
    setError(null);
    setResult({ ...shared, mode: "shared" });
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    loading,
    error,
    analyzeFile,
    runDemo,
    runProfile,
    loadSharedResult,
    reset,
  };
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
      throw new Error("ZIP must contain a raw genotype .txt file.");
    }
    return txtEntry.async("string");
  }
  return file.text();
}
