import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // When building in "sandbox" mode, write to a separate folder
  distDir: process.env.NEXT_BUILD_SANDBOX === '1' ? '.next-buildcheck' : '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
