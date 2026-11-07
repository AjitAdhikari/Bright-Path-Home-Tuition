import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["nodemailer"],
  experimental: {
    // Tutor applications upload documents through the submit Server Action.
    // The default body cap is 1 MB; raise it to comfortably fit several files
    // at the per-file limit (5 MB each — see MAX_DOC_BYTES).
    serverActions: { bodySizeLimit: "25mb" },
  },
  images: {
    remotePatterns: [
      // Supabase Storage public bucket (avatars). Replace <project-ref> at deploy.
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Baseline security headers applied to every response. A nonce-based CSP is
  // intentionally left out here — it needs per-request wiring with Next's inline
  // hydration scripts and is better added as its own tested change.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
