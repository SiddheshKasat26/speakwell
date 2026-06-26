import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // ← enables standalone build for Docker
};

export default nextConfig;