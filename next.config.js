// Content-Security-Policy. Production only: `next dev` needs eval for Fast
// Refresh. Scripts are locked down per page by a second, meta policy in
// pages/_document.tsx that allows the one inline Turbopack bootstrap by hash;
// browsers enforce both policies, so the 'unsafe-inline' below never takes
// effect on its own. JSON-LD and __NEXT_DATA__ are data, and gtag is
// configured from the bundle.
// Image hosts: Spotify album art on the homepage, Open Library covers (which
// redirect to archive.org) in the Study, and the GA pixel.
// Vercel injects its comments toolbar into preview deployments only; allow
// its hosts there (https://vercel.com/docs/vercel-toolbar) and nowhere else.
const preview = process.env.VERCEL_ENV === 'preview'
const toolbar = (...hosts) => (preview ? ' ' + hosts.join(' ') : '')

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com" + toolbar('https://vercel.live'),
  "style-src 'self' 'unsafe-inline'" + toolbar('https://vercel.live'),
  "img-src 'self' data: blob: https://*.scdn.co https://*.spotifycdn.com https://covers.openlibrary.org https://archive.org https://*.archive.org https://www.googletagmanager.com https://*.google-analytics.com" +
    toolbar('https://vercel.live', 'https://vercel.com'),
  "font-src 'self'" + toolbar('https://vercel.live', 'https://assets.vercel.com'),
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com" +
    toolbar('https://vercel.live', 'wss://ws-us3.pusher.com'),
  "worker-src 'self' blob:",
  ...(preview ? ['frame-src https://vercel.live'] : []),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests',
].join('; ')

const isProd = process.env.NODE_ENV === 'production'

// "The Name Moshe" is a standalone static page (public/name/index.html, with
// its fonts in public/name/fonts/) served at the root of its own subdomain.
const NAME_HOST = 'name.moshemalka.com'
const onNameHost = [{ type: 'host', value: NAME_HOST }]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  // Inlined into the bundle so pages/_app.tsx can tell a Vercel build from a
  // local or CI one (Vercel sets VERCEL=1 at build time).
  env: { ON_VERCEL: process.env.VERCEL ? '1' : '' },
  async redirects() {
    return [
      // The page's home is its subdomain; /name on the main site points there.
      {
        source: '/name',
        missing: onNameHost,
        destination: `https://${NAME_HOST}/`,
        permanent: false,
      },
      // On the subdomain, any other page path (no dot: not a file) goes to the
      // root, so the main site's pages and API routes aren't served there.
      // Files (/name/fonts/*, favicons) and Next internals pass through.
      {
        source: '/:path((?!_next/|_vercel/)[^.]+)',
        has: onNameHost,
        destination: '/',
        permanent: false,
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [{ source: '/', has: onNameHost, destination: '/name/index.html' }],
    }
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ...(isProd ? [{ key: 'Content-Security-Policy', value: CSP }] : []),
        ],
      },
      // The JSON endpoints feed the live stats; keep them out of the index
      // without blocking crawlers that render the homepage.
      {
        source: '/api/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ]
  },
}

module.exports = nextConfig
