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
};

export default nextConfig;
