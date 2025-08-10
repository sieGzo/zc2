/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/miejsca', destination: '/places' },
      { source: '/szlaki', destination: '/trails' },
      { source: '/artykuly', destination: '/articles' },
      { source: '/miejsca/by-id/:id', destination: '/places/by-id/:id' },
      { source: '/miejsca/by-xid/:xid', destination: '/places/by-xid/:xid' },
      { source: '/szlaki/by-id/:id', destination: '/trails/by-id/:id' },
    ];
  },
};
module.exports = nextConfig;
