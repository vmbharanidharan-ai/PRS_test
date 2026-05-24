import type { NextConfig } from "next";

const isCapacitorBuild = process.env.CAPACITOR === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isCapacitorBuild
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
