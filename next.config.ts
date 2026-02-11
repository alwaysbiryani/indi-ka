import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode for better error detection
  reactStrictMode: true,

  // Generate build ID from git commit for verification
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `local-${Date.now()}`;
  },

  // Asset optimization
  compress: true,

  // Ensure clean builds (no stale artifacts)
  cleanDistDir: true,

  // Expose build time for verification
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
