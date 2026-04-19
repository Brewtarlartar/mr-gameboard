/** @type {import('next').NextConfig} */
const nextConfig = {
  // Capacitor builds need a static export. `npm run cap:sync` sets CAPACITOR_BUILD=1.
  // API routes (BGG proxy, discover) are web-only — migrate to client fetches before enabling.
  ...(process.env.CAPACITOR_BUILD === '1' ? { output: 'export' } : {}),
  images: {
    // Use unoptimized images - allows any source without proxy issues
    unoptimized: true,
    remotePatterns: [
      // BGG images (legacy support)
      {
        protocol: 'https',
        hostname: 'cf.geekdo-static.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cf.geekdo-images.com',
        pathname: '/**',
      },
      // Wikimedia Commons (Wikidata images - CC0/Public Domain)
      {
        protocol: 'http',
        hostname: 'commons.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
      // Unsplash
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Amazon Product Images (via ASIN - official box art)
      {
        protocol: 'https',
        hostname: 'images-na.ssl-images-amazon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.amazon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
