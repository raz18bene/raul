/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Suppress build warnings for missing env vars
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
