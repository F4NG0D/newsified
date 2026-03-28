import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Allow all external image URLs without a whitelist.
    // All <Image> components use unoptimized={true} so Next.js
    // proxying is bypassed — no remotePatterns needed.
    unoptimized: true,
  },
  reactStrictMode: true,
}

export default nextConfig
