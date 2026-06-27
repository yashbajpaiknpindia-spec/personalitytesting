import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import type { Metadata } from 'next'
import HomeClient from './HomeClient'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'Brand Syndicate, Build Websites, Brand Assets & Business Content',
  description:
    'AI meets human creativity. Get a website, logo, graphics, and brand strategy for your business, generated instantly, then refined by our creative team for a premium launch.',
  keywords: [
    'AI brand generator India', 'free logo maker online', 'website generator AI',
    'business branding AI', 'brand kit generator', 'social media graphics AI',
    'personal branding tool India', 'AI logo design', 'content plan generator', 'brand identity AI',
  ],
  alternates: { canonical: APP_URL },
  openGraph: {
    title: 'Brand Syndicate, AI Brand Generator',
    description: 'Website, logo, graphics, and content plan. AI previewed, human perfected.',
    url: APP_URL, type: 'website',
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630, alt: 'Brand Syndicate AI Brand Generator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brand Syndicate, AI Brand Generator',
    description: 'Website, logo, graphics, and content plan. AI previewed, human perfected.',
    images: [`${APP_URL}/og-default.png`],
  },
}


export default async function Home() {
  // Show main hero page to all users, pass session so HomeClient can personalise CTAs
  let session = null
  try { session = await auth() } catch {}
  return <HomeClient isLoggedIn={!!session?.user} userName={session?.user?.name || session?.user?.email || ''} />
}
