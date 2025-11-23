/**
 * Next.js config: rewrite `/api/*` requests to the backend during development
 * so the browser sees same-origin requests and cookies work without cross-site issues.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/:path*', // Proxy to backend
      },
    ];
  },
};

module.exports = nextConfig;
