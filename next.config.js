/** @type {import('next').NextConfig} */
const nextConfig = {
  // Capacitor builds need a static export. `npm run cap:build` (scripts/cap-build.js)
  // sets CAPACITOR_BUILD=1 and temporarily excludes the server-only routes
  // (app/api/*, app/auth/callback) — the native shell calls the hosted Vercel API.
  // trailingSlash makes every route export folder/index.html so deep links and
  // hard reloads resolve to a real file inside the shell.
  ...(process.env.CAPACITOR_BUILD === '1' ? { output: 'export', trailingSlash: true } : {}),
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
