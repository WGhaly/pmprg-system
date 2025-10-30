/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: ['localhost'],
  },
  // PMPRG-specific configurations
  env: {
    PMPRG_VERSION: '1.0.0',
  },
}

module.exports = nextConfig