import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/admin',
  trailingSlash: false,
  images: {
    path: '/admin/_next/image',
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
