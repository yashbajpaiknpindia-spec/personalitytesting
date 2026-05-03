import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'Contact Brand Syndicate — Get in Touch',
  description:
    'Have a question, partnership idea, or need support? Contact the Brand Syndicate team. We respond to all inquiries within 1–2 business days.',
  keywords: ['contact brand syndicate', 'brand syndicate support', 'get in touch', 'brand syndicate email'],
  alternates: { canonical: `${APP_URL}/contact` },
  openGraph: {
    title: 'Contact Brand Syndicate',
    description: 'Have a question or need support? Get in touch with the Brand Syndicate team.',
    url: `${APP_URL}/contact`,
    type: 'website',
  },
  robots: { index: true, follow: true },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
