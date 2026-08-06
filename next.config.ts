import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  allowedDevOrigins: ['192.168.1.138'],
  output: 'standalone',
};

export default nextConfig;
