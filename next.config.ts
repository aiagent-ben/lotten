import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  // Image optimization with remote patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-ce9098702cc5447ab9a26a9e41c7bf1a.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'mm.hinlim.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Turbopack config - empty to disable error
  turbopack: {},
};

export default nextConfig;