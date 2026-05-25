import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GeneScope — Genetic Health Risk Insights",
  description:
    "Understand inherited cancer risk with instant demo, profile-based estimates, or DNA-powered polygenic scores. Educational genetic information, not medical advice.",
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
