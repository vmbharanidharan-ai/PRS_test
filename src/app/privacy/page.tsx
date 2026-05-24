export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-slate">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-slate-500">Template — have counsel review before launch.</p>
      <p>
        PRS Screen processes your genotype file locally in your web browser. We do
        not receive, store, or transmit your raw DNA data to our servers when you
        use the default web application.
      </p>
      <h2>What we do not collect</h2>
      <ul>
        <li>Raw genotype files</li>
        <li>Individual SNP calls</li>
        <li>Computed PRS results (unless you opt into analytics — not enabled in MVP)</li>
      </ul>
      <h2>What you should do</h2>
      <p>
        If you deploy a hosted version, use HTTPS, publish this policy, and document
        any analytics or error logging you add. Mobile app builds should state whether
        analysis stays on-device.
      </p>
      <p>
        <a href="/" className="text-brand-600 hover:underline">
          ← Back to app
        </a>
      </p>
    </main>
  );
}
