import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4566',
        pathname: '/recipe-photos/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '4566',
        pathname: '/recipe-photos/**',
      },
    ],
  },
};

export default nextConfig;