export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-slate">
      <h1>Terms of Use</h1>
      <p className="text-sm text-slate-500">Template — have counsel review before launch.</p>
      <p>
        PRS Screen is an educational informational tool. By using it, you agree that:
      </p>
      <ul>
        <li>Results are not medical advice, diagnosis, or treatment.</li>
        <li>You will discuss results with a qualified healthcare professional.</li>
        <li>
          Polygenic scores do not detect pathogenic variants (e.g., BRCA1/2) or
          guarantee health outcomes.
        </li>
        <li>
          The service is not FDA-cleared and is not offered as a medical device.
        </li>
      </ul>
      <p>
        <a href="/" className="text-brand-600 hover:underline">
          ← Back to app
        </a>
      </p>
    </main>
  );
}
