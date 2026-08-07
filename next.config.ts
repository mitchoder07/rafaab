// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `output: "standalone"` crashes Vercel's onBuildComplete on Next 16.3
  // (next.js#96646). Vercel doesn't need standalone anyway — it uses its
  // own adapter. Keep standalone for Docker / self-hosted builds only.
  output: process.env.VERCEL ? undefined : "standalone",
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
};

export default nextConfig;