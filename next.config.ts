import type { NextConfig } from 'next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks', '@tabler/icons-react'],
  },
};

export default nextConfig;
