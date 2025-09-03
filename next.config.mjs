/** @type {import('next').NextConfig} */

const isMobile = process.env.NEXT_PUBLIC_IS_MOBILE === 'true';
const nextConfig = {
      ...(isMobile ? {output: 'export'} : {}),
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
