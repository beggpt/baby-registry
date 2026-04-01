/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.babycenter.hr' },
      { protocol: 'https', hostname: '*.babycenter.hr' },
      { protocol: 'https', hostname: 'images.babycenter.hr' },
    ],
  },
}

module.exports = nextConfig
