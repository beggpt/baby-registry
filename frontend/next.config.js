/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.babycenter.hr' },
      { protocol: 'https', hostname: '*.babycenter.hr' },
      { protocol: 'https', hostname: 'cdn.babycenter.si' },
      { protocol: 'https', hostname: '*.babycenter.si' },
    ],
  },
}
module.exports = nextConfig
