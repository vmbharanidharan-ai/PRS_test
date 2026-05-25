import { buildClinicianPdfBlocks } from "./clinician-summary";
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
    doc.setFontSize(opts?.size ?? 9);
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

  writeLine("GeneScope Research Summary", {
    size: 14,
    bold: true,
  });
  writeGap(2);
  writeLine(
    "Educational polygenic modeling only. Not a laboratory report or diagnosis.",
    { size: 8 },
  );
  writeGap(4);

  for (const block of buildClinicianPdfBlocks(result)) {
    if (block.title) {
      writeGap(3);
      writeLine(block.title, { size: 11, bold: true });
      writeGap(1);
    }
    for (const line of block.lines) {
      if (line === "") {
        writeGap(2);
      } else {
        writeLine(line, { size: 8, bold: block.bold && line === block.lines[0] });
      }
    }
    writeGap(2);
  }

  const date = new Date(result.analyzedAt).toISOString().slice(0, 10);
  doc.save(`genescope-research-summary-${date}.pdf`);
}
