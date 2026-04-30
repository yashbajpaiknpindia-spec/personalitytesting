import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Next.js 14.x uses this key (top-level serverExternalPackages is Next 15+ only)
    // Without this, pptxgenjs / bcryptjs may be bundled for the Edge runtime
    // and crash auth + export routes.
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium',
      'pptxgenjs',
      'bcryptjs',
      'pdf-parse',
    ],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/razorpay/webhook',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ]
  },
  // Explicitly tell webpack where @/ resolves — prevents the client/ Vite
  // directory from confusing Next.js module resolution on Linux (Render).
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src')
    return config
  },
}

export default nextConfig
