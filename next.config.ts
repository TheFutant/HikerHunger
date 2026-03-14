import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
