import type { AnalysisResult } from "./types";

const MARGIN = 14;
const LINE_HEIGHT = 5;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2;

export async function downloadReportPdf(result: AnalysisResult): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const writeLine = (text: string, opts?: { size?: number; bold?: boolean }) => {
    doc.setFontSize(opts?.size ?? 10);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, MAX_WIDTH) as string[];
    for (const line of lines) {
      addPageIfNeeded(LINE_HEIGHT);
      doc.text(line, MARGIN, y);
      y += LINE_HEIGHT;
    }
  };

  const writeGap = (mm = 4) => {
    y += mm;
  };

  writeLine("PRS Screen — Polygenic Risk Report", { size: 16, bold: true });
  writeGap(2);
  writeLine(
    `Generated: ${new Date(result.analyzedAt).toLocaleString()} · ${result.variantsInFile.toLocaleString()} variants · ${result.vendor}`,
    { size: 9 },
  );
  writeGap(4);

  if (result.familyHistorySummary?.length) {
    writeLine("Family history (user-provided)", { size: 11, bold: true });
    for (const item of result.familyHistorySummary) {
      writeLine(`• ${item}`, { size: 9 });
    }
    writeGap(4);
  }

  for (const report of result.reports) {
    addPageIfNeeded(20);
    writeLine(report.label, { size: 13, bold: true });
    writeLine(report.riskStory.headline, { size: 11, bold: true });
    writeGap(2);
    writeLine(report.riskStory.lifetimeFraming, { size: 9 });
    writeLine(report.riskStory.populationComparison, { size: 9 });
    writeLine(report.riskStory.plainMeaning, { size: 9 });
    writeLine(`Score: ${report.prs.pgsId} — ${report.prs.citation}`, { size: 8 });
    writeGap(2);
    writeLine("Screening considerations", { size: 10, bold: true });
    for (const rec of report.screening) {
      writeLine(`[${rec.source}] ${rec.guideline}`, { size: 9, bold: true });
      writeLine(rec.recommendation, { size: 9 });
      writeLine(rec.rationale, { size: 8 });
      writeGap(2);
    }
    writeGap(6);
  }

  writeGap(4);
  writeLine("Disclaimer", { size: 10, bold: true });
  writeLine(result.globalDisclaimer, { size: 8 });

  const date = new Date(result.analyzedAt).toISOString().slice(0, 10);
  doc.save(`prs-screen-report-${date}.pdf`);
}
