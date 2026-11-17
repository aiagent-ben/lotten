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
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Turbopack config - empty to disable error
  turbopack: {},
  experimental: {
    agentUpgrade: 'security',
  },
  // Disable static generation for error pages (Next.js 15 + React 19 bug workaround)
  // Using generateStaticParams returning empty array on error pages
};

export default nextConfig;