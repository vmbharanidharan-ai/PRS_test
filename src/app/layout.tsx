import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRS Screen — Cancer Polygenic Risk Re-interpretation",
  description:
    "Upload your 23andMe or AncestryDNA raw data for updated polygenic risk scores and screening guidance based on published GWAS weights and clinical guidelines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
