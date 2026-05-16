/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Enable serverless functions
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig