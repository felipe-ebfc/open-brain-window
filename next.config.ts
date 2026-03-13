import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Vercel optimization
  output: 'standalone',
  // Allow external images from Supabase if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
