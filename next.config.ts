import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/admin',
  assetPrefix: '/admin',
  // output: "export",
  trailingSlash: true,
  images: {
    path: '/admin/_next/image',
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
  
};
// module.exports = {
//   async rewrites() {
//     return [
//       {
//         source: '/be/:path*',
//         destination: 'http://localhost:9999/:path*', 
//       },
//     ]
//   },
// }
export default nextConfig;
