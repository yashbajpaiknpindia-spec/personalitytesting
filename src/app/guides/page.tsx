import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { HoverCard } from '@/components/public/HoverCard'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'Brand Building Guides 2026 — Websites, Logos, Graphics & Strategy',
  description:
    'Step-by-step guides from Brand Syndicate on building your brand identity, creating a website that converts, designing logos, and launching a content strategy that works. Updated for 2026.',
  keywords: [
    'personal branding guide 2026',
    'resume writing guide',
    'portfolio copy guide',
    'presentation tips guide',
    'LinkedIn about section guide',
    'career branding tips',
    'ATS resume guide',
    'pitch deck guide',
  ],
  alternates: { canonical: `${APP_URL}/guides` },
  openGraph: {
    title: 'Personal Branding Guides 2026, Brand Syndicate',
    description: 'Step-by-step guides on resumes, portfolios, presentations, and personal brand building. Updated for 2026.',
    url: `${APP_URL}/guides`,
    type: 'website',
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630, alt: 'Brand Syndicate Guides' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Personal Branding Guides 2026',
    description: 'Step-by-step guides on resumes, portfolios, presentations, and personal brand building.',
    images: [`${APP_URL}/og-default.png`],
  },
}

const guidesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  url: `${APP_URL}/guides`,
  name: 'Personal Branding Guides, Brand Syndicate',
  description: 'Comprehensive step-by-step guides on personal branding, resumes, portfolios, and presentations.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${APP_URL}/guides` },
    ],
  },
}

const guides = [
  {
    slug: 'personal-brand-complete-guide',
    number: '01',
    title: 'The Complete Personal Branding Guide for 2026',
    excerpt: 'A step-by-step system for building a personal brand that opens doors, covering positioning, storytelling, and channel strategy.',
    topics: ['Positioning', 'Storytelling', 'LinkedIn', 'Portfolio'],
    readTime: '15 min',
  },
  {
    slug: 'portfolio-copy-that-converts',
    number: '02',
    title: 'Portfolio Copy That Converts',
    excerpt: 'Talking about your own work feels awkward. This guide gives you frameworks to present your projects with confidence and specificity.',
    topics: ['Writing', 'Case Studies', 'Portfolio', 'Conversion'],
    readTime: '10 min',
  },
  {
    slug: 'linkedin-about-section-formula',
    number: '03',
    title: 'The LinkedIn About Section Formula',
    excerpt: 'The hook-story-CTA formula that turns your LinkedIn summary from a wall of text into a profile people actually read and respond to.',
    topics: ['LinkedIn', 'Copywriting', 'Personal Brand'],
    readTime: '7 min',
  },
  {
    slug: 'how-to-write-resume-bullets-that-get-interviews',
    number: '04',
    title: 'Resume Bullets That Get Interviews',
    excerpt: 'The achievement-first formula that makes recruiters stop scrolling, with real before-and-after examples across industries.',
    topics: ['Resume', 'Copywriting', 'Job Search'],
    readTime: '7 min',
  },
  {
    slug: 'pitch-deck-structure-guide',
    number: '05',
    title: 'Pitch Deck Structure: The Anatomy of a Winning Deck',
    excerpt: 'We reverse-engineered 40 successful pitch decks to find the exact slide order, story arc, and visual hierarchy that closes deals.',
    topics: ['Presentations', 'Storytelling', 'Fundraising'],
    readTime: '11 min',
  },
  {
    slug: 'career-change-resume-tips',
    number: '06',
    title: 'Career Change Resume: Reframe Your Experience',
    excerpt: 'Switching fields does not mean starting from zero. These reframing techniques translate your transferable skills into the language of your target industry.',
    topics: ['Resume', 'Career Change', 'Strategy'],
    readTime: '9 min',
  },
]

export default function GuidesPage() {
  return (
    <div className="public-page" style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      <PublicNav active="/guides" />

      {/* Hero */}

      <PublicFooter />
    </div>
  )
}
