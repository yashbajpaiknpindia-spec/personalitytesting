import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'Generate Your Brand — Brand Syndicate AI Studio',
  description:
    'Generate a complete business brand identity in 60 seconds. AI creates your website, logo, graphics, business strategy, and 30-day content calendar simultaneously from your business description.',
  keywords: [
    'AI brand generator',
    'generate business website AI',
    'AI logo generator India',
    'brand identity generator',
    'business strategy AI',
    'content calendar generator',
    'AI brand studio',
    'brand kit generator online',
    'generate logo online India',
    'AI business branding tool',
  ],
  alternates: { canonical: `${APP_URL}/generate` },
  openGraph: {
    title: 'Generate Your Brand — Brand Syndicate',
    description:
      'Website, logo, graphics, business strategy, and content calendar. All generated simultaneously in 60 seconds from your business description.',
    url: `${APP_URL}/generate`,
    type: 'website',
    siteName: 'Brand Syndicate',
    images: [
      {
        url: `${APP_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: 'Brand Syndicate AI Brand Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Generate Your Brand in 60 Seconds — Brand Syndicate',
    description:
      'AI generates your website, logo, graphics, and strategy simultaneously. Try it free.',
    images: [`${APP_URL}/og-default.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
