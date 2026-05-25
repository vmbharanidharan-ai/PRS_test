/** Required acknowledgements before unlocking a user DNA report (not demo/profile). */

export interface DnaAckStatement {
  id: string;
  text: string;
}

export const DNA_REPORT_ACK_STATEMENTS: DnaAckStatement[] = [
  {
    id: "low_not_safe",
    text: "I understand that a low score does NOT mean I am safe from cancer.",
  },
  {
    id: "limited_genetics",
    text: "I understand this app cannot read 99% of hereditary cancer mutations and is missing my full family history.",
  },
  {
    id: "not_medical_advice",
    text: "I understand GeneScope is an educational research tool — not medical advice, not a diagnosis, and not a substitute for clinical genetic testing.",
  },
  {
    id: "consumer_not_clinical",
    text: "I understand consumer DNA files (23andMe/Ancestry) are not clinical-grade sequencing and may be incomplete or wrong.",
  },
];

const STORAGE_KEY = "genescope-dna-report-ack-v1";

export function hasDnaReportAcknowledgement(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(STORAGE_KEY) === "true";
}

export function recordDnaReportAcknowledgement(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, "true");
}

export function clearDnaReportAcknowledgement(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function allStatementsChecked(
  checked: Record<string, boolean>,
): boolean {
  return DNA_REPORT_ACK_STATEMENTS.every((s) => checked[s.id] === true);
}
