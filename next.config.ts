import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["nodemailer"],
  images: {
    remotePatterns: [
      // Supabase Storage public bucket (avatars). Replace <project-ref> at deploy.
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
