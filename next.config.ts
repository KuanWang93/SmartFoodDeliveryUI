import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
    return [
      {
        source: '/api/auth/:path*',
        destination: `${apiBase}/:path*`,
      },
      {
        source: '/api/client/:path*',
        destination: `${apiBase}/client/:path*`,
      },
      {
        source: '/api/merchant/:path*',
        destination: `${apiBase}/merchant/:path*`,
      },
      {
        source: '/api/rider/:path*',
        destination: `${apiBase}/rider/:path*`,
      },
    ]
  },
}

export default nextConfig
