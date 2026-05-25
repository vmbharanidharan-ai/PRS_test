export function DisclaimerBanner() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <strong>Educational genetic information — not medical guidance.</strong>{" "}
      PRS Screen does not diagnose disease, prescribe screening, or replace care
      from a licensed clinician or genetic counselor. Insights describe
      statistical patterns from common DNA variants, not clinical test results.
      Your raw genotype file is processed on your device and is not uploaded to
      our servers.
    </div>
  );
}
