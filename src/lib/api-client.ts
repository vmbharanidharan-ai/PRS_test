import type { AnalysisResult } from "./types";
import { getAuthToken } from "./data-mode";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { detail?: string }).detail ||
        `API error ${res.status}`,
    );
  }
  return data as T;
}

export interface CreateAccountParams {
  email: string;
  password: string;
  consentPersonalStorage: boolean;
  consentResearch: boolean;
}

export async function createAccount(params: CreateAccountParams) {
  return apiFetch<{ access_token: string; user_id: string }>("/user/create", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      consent_personal_storage: params.consentPersonalStorage,
      consent_research: params.consentResearch,
    }),
  });
}

export async function syncRiskToCloud(
  result: AnalysisResult,
  modelVersion = "genescreen-pgs-bundle-v1",
) {
  const assessments = result.reports.map((r) => ({
    disease: r.cancerType,
    risk_mean: r.prs?.percentile ?? r.population.centralPercentile,
    risk_sd:
      r.prs != null
        ? Math.max(1, (r.population.percentileHigh - r.population.percentileLow) / 2)
        : (r.population.percentileHigh - r.population.percentileLow) / 2,
    model_version: r.prs?.pgsId ?? modelVersion,
    precision_level: result.precisionLevel,
  }));

  return apiFetch<{ message: string }>("/risk/recalculate", {
    method: "POST",
    body: JSON.stringify({
      model_version: modelVersion,
      assessments,
    }),
  });
}

export async function deleteAccountData() {
  return apiFetch<{ message: string }>("/user/delete", { method: "DELETE" });
}
