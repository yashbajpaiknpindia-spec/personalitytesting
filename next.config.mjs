import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const serverExternalPackages = [
  'puppeteer-core',
  '@sparticuz/chromium',
  'pptxgenjs',
  'bcryptjs',
  'pdf-parse',
  'sharp',
]

const outputTraceExcludes = {
  '*': [
    'public/samples/**',
    'public/generated/**',
    'public/portfolio/**',
    'public/template-mobile-gallery.html',
    'client/**',
    'server/**',
    'shared/**',
    '*.zip',
    '*_REPORT.md',
    '*_AUDIT.md',
    '*_AUDIT.json',
    'node_modules/@sparticuz/chromium/**',
    'node_modules/puppeteer-core/**',
    'node_modules/@esbuild/**',
    'node_modules/sharp/vendor/**',
    'node_modules/pptxgenjs/dist/**',
    'node_modules/prisma/libquery_engine-*',
    'node_modules/@prisma/engines/**',
  ],
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  serverExternalPackages,
  outputFileTracingExcludes: outputTraceExcludes,

  // Skip ESLint AND TypeScript type-checking during production builds.
  // TSC still runs in CI/local. On Render this saves 30–60s of build time.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Turbopack alias config (mirrors webpack config below)
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  async rewrites() {
    return [
      { source: '/samples/:slug', destination: '/samples/:slug.html' },
      {
        source: '/:slug((?!_next|api|samples|public).*)',
        has: [{ type: 'host', value: 'samples.brandsyndicate.in' }],
        destination: '/samples/:slug.html',
      },
      {
        source: '/',
        has: [{ type: 'host', value: 'samples.brandsyndicate.in' }],
        destination: '/samples/lumiere-cosmetics.html',
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/api/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, private, no-cache, must-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        source: '/api/razorpay/webhook',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
      {
        source: '/samples/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://brandsyndicate.in https://*.brandsyndicate.in" },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:path*.(ico|png|jpg|jpeg|svg|webp|gif|woff|woff2)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },

  // Webpack config kept for local dev / non-turbopack CI.
  // Turbopack uses resolveAlias (configured via CLI --turbopack flag).
  webpack(config, { nextRuntime }) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src')
    if (nextRuntime === 'edge') {
      config.resolve.alias = {
        ...config.resolve.alias,
        'jose/dist/webapi/lib/deflate': false,
      }
    }
    return config
  },
}

export default nextConfig
