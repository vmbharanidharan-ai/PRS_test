import type { AnalysisResult } from "./types";

const SHARE_PREFIX = "prs-v1:";

export async function encodeSharePayload(
  result: AnalysisResult,
): Promise<string> {
  const json = JSON.stringify({ ...result, dataNotStored: true });
  const blob = new Blob([json]);
  if (typeof CompressionStream !== "undefined") {
    const stream = blob.stream().pipeThrough(new CompressionStream("gzip"));
    const buffer = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return SHARE_PREFIX + btoa(binary);
  }
  return SHARE_PREFIX + btoa(unescape(encodeURIComponent(json)));
}

export async function decodeSharePayload(
  encoded: string,
): Promise<AnalysisResult | null> {
  if (!encoded.startsWith(SHARE_PREFIX)) return null;
  const raw = encoded.slice(SHARE_PREFIX.length);
  try {
    const binary = atob(raw);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));

    if (typeof DecompressionStream !== "undefined") {
      const stream = new Blob([bytes])
        .stream()
        .pipeThrough(new DecompressionStream("gzip"));
      const json = await new Response(stream).text();
      return JSON.parse(json) as AnalysisResult;
    }

    const json = decodeURIComponent(escape(binary));
    return JSON.parse(json) as AnalysisResult;
  } catch {
    return null;
  }
}

export function buildShareUrl(encoded: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}#share=${encoded}`;
}

export function readShareFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  return params.get("share");
}
