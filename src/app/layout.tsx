import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from './providers'
import CookieConsent from '@/components/CookieConsent'
import AdSenseScript from '@/components/AdSenseScript'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
const APP_NAME = 'Brand Syndicate'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#09090A' },
    { media: '(prefers-color-scheme: light)', color: '#09090A' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: APP_NAME,
  title: {
    default: 'Brand Syndicate — AI Personal Branding Studio',
    template: '%s | Brand Syndicate',
  },
  description:
    'Generate a complete personal brand kit with AI — portfolio copy, resume bullets, business cards, and pitch deck slides in under 60 seconds. Trusted by professionals worldwide.',
  keywords: [
    'AI personal branding',
    'AI resume builder',
    'AI portfolio generator',
    'personal brand kit',
    'AI business card',
    'pitch deck generator',
    'brand syndicate',
    'professional branding',
    'resume builder 2026',
    'AI career tools',
  ],
  authors: [{ name: APP_NAME, url: APP_URL }],
  creator: APP_NAME,
  publisher: APP_NAME,
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [
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
    title: 'Brand Syndicate — AI Personal Branding Studio',
    description:
      'Generate a complete personal brand kit with AI — portfolio, resume, business card, and pitch deck in under 60 seconds.',
    images: [
      {
        url: `${APP_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: 'Brand Syndicate — AI Personal Branding Studio',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@brandsyndicate',
    creator: '@brandsyndicate',
    title: 'Brand Syndicate — AI Personal Branding Studio',
    description:
      'Generate portfolio copy, resume bullets, business cards, and pitch decks with AI in under 60 seconds.',
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
      description: 'AI-Powered Personal Branding Studio — Generate portfolios, resumes, business cards, and pitch decks with AI.',
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
        'https://twitter.com/brandsyndicate',
        'https://linkedin.com/company/brandsyndicate',
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
        description: 'Free to start — generate your first brand kit at no cost.',
      },
      featureList: [
        'AI Portfolio Generator',
        'AI Resume Builder',
        'AI Business Card Creator',
        'AI Pitch Deck Generator',
        'LinkedIn Bio Writer',
        'ATS Resume Optimizer',
        'Personal Brand Templates',
      ],
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Syne:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="msapplication-TileColor" content="#09090A" />
        <meta name="msapplication-TileImage" content="/mstile-150x150.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('bs-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <CookieConsent />
        <AdSenseScript />
      </body>
    </html>
  )
}
