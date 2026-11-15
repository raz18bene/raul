/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next',
  async redirects() {
    return [{ source: '/favicon.ico', destination: '/icon', permanent: true }]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
