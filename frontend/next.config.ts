import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
  // Suppress powered-by header
  poweredByHeader: false,
  // Allow images from backend
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "*.thesource-company.in" },
    ],
  },
};

export default nextConfig;
