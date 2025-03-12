import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/admin',
  assetPrefix: '/admin',
  output: "export",
  trailingSlash: true,
  images: {
    path: '/admin/_next/image',
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
