/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Miejsca -> Places
      { source: '/miejsca', destination: '/places' },
      { source: '/miejsca/:path*', destination: '/places/:path*' },

      // Szlaki -> Trails
      { source: '/szlaki', destination: '/trails' },
      { source: '/szlaki/:path*', destination: '/trails/:path*' },

      // Artykuły -> Articles
      { source: '/artykuly', destination: '/articles' },
      { source: '/artykuly/:path*', destination: '/articles/:path*' },
    ]
  },
}

module.exports = nextConfig
