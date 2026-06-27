import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from './providers'
import CookieConsent from '@/components/CookieConsent'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
const APP_NAME = 'Brand Syndicate'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#060608' },
    { media: '(prefers-color-scheme: light)', color: '#F8F5EF' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: APP_NAME,
  title: {
    default: 'Brand Syndicate, Premium AI Brand Generator',
    template: '%s | Brand Syndicate',
  },
  description:
    'Launch a sharper brand with AI-assisted websites, cinematic graphics, logos, reels, marketing strategy, and social media calendars for growing businesses.',
  keywords: [
    'AI website agency India',
    'brand launch package',
    'AI graphics generator',
    'premium logo design',
    'social media calendar',
    'reels package',
    'startup branding India',
    'website and graphics package',
    'Brand Syndicate',
    'AI marketing agency',
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: APP_NAME,
    title: 'Brand Syndicate, Premium AI Brand Generator',
    description:
      'AI-assisted websites, premium graphics, logos, reels, and launch strategy for businesses that need a polished brand fast.',
    images: [
      {
        url: `${APP_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: 'Brand Syndicate, Premium AI Brand Generator',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@brandsyndicateindia',
    creator: '@brandsyndicateindia',
    title: 'Brand Syndicate, Premium AI Brand Generator',
    description:
      'Launch websites, graphics, logos, reels, and marketing calendars with Brand Syndicate.',
    images: [`${APP_URL}/og-default.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: APP_NAME,
      description: 'Premium AI Brand Generator for websites, graphics, logos, reels, and business strategy.',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${APP_URL}/resources?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#organization`,
      name: APP_NAME,
      url: APP_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_URL}/android-chrome-512x512.png`,
        width: 512,
        height: 512,
      },
      sameAs: [
        'https://www.instagram.com/brandsyndicateindia',
        'https://www.facebook.com/share/1BeC1oRjnQ/',
        'https://wa.me/917897671348',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${APP_URL}/contact`,
        availableLanguage: 'English',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${APP_URL}/#app`,
      name: APP_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: APP_URL,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free to start, create your first launch brief and preview your brand direction.',
      },
      featureList: [
        'AI Website Brief Generator',
        'Premium Graphics Generator',
        'Logo Direction Builder',
        'Reels Concept Planner',
        'Marketing Strategy Generator',
        '30-Day Social Calendar Planner',
        'Brand Launch Templates',
      ],
    },
  ],
}

// Trimmed to only the families/weights/styles actually used site-wide.
// Cormorant Garamond + Libre Baskerville removed (only used on /templates,
// now loaded on-demand from TemplatesClient). Playfair Display, Manrope, and
// DM Mono reduced to the weights/styles actually referenced in globals.css.
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;1,800&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500;700&family=Manrope:wght@500&display=optional'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preconnect to the image CDN actually used on the homepage */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try{var t=localStorage.getItem('bs-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.setAttribute('data-theme','light');}}catch(e){document.documentElement.setAttribute('data-theme','light');}
  var l=document.createElement('link');l.rel='stylesheet';l.media='print';l.href='${FONT_URL}';l.onload=function(){l.media='all'};document.head.appendChild(l);
})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="msapplication-TileColor" content="#060608" />
        <meta name="color-scheme" content="light dark" />
        <meta name="msapplication-TileImage" content="/mstile-150x150.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  )
}
