"use client";

import { useState } from "react";
import { createAccount } from "@/lib/api-client";
import { setAuth, setDataMode } from "@/lib/data-mode";

interface DataModeSelectorProps {
  onContinue: (mode: "local" | "account") => void;
}

export function DataModeSelector({ onContinue }: DataModeSelectorProps) {
  const [view, setView] = useState<"choose" | "signup">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storageConsent, setStorageConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signup = async () => {
    if (!storageConsent) {
      setError("Private account requires personal storage consent.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await createAccount({
        email,
        password,
        consentPersonalStorage: true,
        consentResearch: researchConsent,
      });
      setAuth(res.access_token, res.user_id);
      onContinue("account");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  if (view === "choose") {
    return (
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">How should we handle your data?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Choose before continuing. You can use GeneScope without an account.
        </p>

        <div className="mt-6 space-y-4">
          <button
            type="button"
            onClick={() => {
              setDataMode("local");
              onContinue("local");
            }}
            className="w-full rounded-xl border-2 border-slate-200 p-4 text-left hover:border-brand-400"
          >
            <p className="font-semibold">(1) Local-only mode</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
              <li>No long-term server storage</li>
              <li>DNA processed in your browser</li>
              <li>Data gone when you close the session</li>
            </ul>
          </button>

          <button
            type="button"
            onClick={() => setView("signup")}
            className="w-full rounded-xl border-2 border-brand-500 bg-brand-50 p-4 text-left"
          >
            <p className="font-semibold text-brand-900">(2) Private account (recommended)</p>
            <p className="mt-1 text-xs text-slate-600">
              Stores health history + risk trends · fully deletable
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <h2 className="text-xl font-bold">Create private account</h2>
      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Password (8+ chars)
          <input
            type="password"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm">
          <input
            type="checkbox"
            checked={storageConsent}
            onChange={(e) => setStorageConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            <strong>(2) Personal storage:</strong> Store phenotype, PRS summaries, and
            risk history so I can track trends over time. I can delete everything anytime.
          </span>
        </label>

        <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
          <input
            type="checkbox"
            checked={researchConsent}
            onChange={(e) => setResearchConsent(e.target.checked)}
            className="mt-1"
          />
          <span>
            <strong>(3) Research participation (separate):</strong> Contribute anonymized
            aggregates only. Never identifies me. Optional.
          </span>
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => setView("choose")} className="rounded-lg border px-4 py-2 text-sm">
          Back
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={signup}
          className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create account & continue"}
        </button>
      </div>
    </div>
  );
}
