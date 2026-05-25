"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";
import { buildShareUrl, encodeSharePayload } from "@/lib/share-report";

export function ShareReportButton({ result }: { result: AnalysisResult }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const share = async () => {
    try {
      const encoded = await encodeSharePayload(result);
      const url = buildShareUrl(encoded);
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={share}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Copy share link
      </button>
      <p className="mt-1 text-xs text-slate-500">
        Link contains summary statistics only — never raw DNA.
      </p>
      {status === "copied" && (
        <p className="mt-1 text-xs text-emerald-700">Link copied to clipboard</p>
      )}
      {status === "error" && (
        <p className="mt-1 text-xs text-rose-700">Could not copy link</p>
      )}
    </div>
  );
}
