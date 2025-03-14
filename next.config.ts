import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  images: {
    // Vercel Blob Link
    domains: [process.env.BLOB_LINK!],
  },
};

export default nextConfig;
