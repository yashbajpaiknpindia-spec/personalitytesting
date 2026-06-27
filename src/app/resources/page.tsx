import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { HoverCard } from '@/components/public/HoverCard'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'Free Brand Resources & Articles — Websites, Logos, Graphics & Business Strategy',
  description:
    'Free brand resources from Brand Syndicate: expert articles on building websites, designing logos, creating branded graphics, and launching your business identity. AI meets human creativity.',
  keywords: [
    'free resume tips 2026',
    'personal brand resources',
    'ATS resume guide',
    'portfolio writing tips',
    'presentation opening lines',
    'pitch deck structure guide',
    'LinkedIn bio formula',
    'career resources',
    'branding articles',
  ],
  alternates: { canonical: `${APP_URL}/resources` },
  openGraph: {
    title: 'Free Brand Resources — Websites, Logos, Graphics & Business Strategy',
    description: 'Expert articles on brand building, logo design, website strategy, and content marketing. Free from Brand Syndicate.',
    url: `${APP_URL}/resources`,
    type: 'website',
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630, alt: 'Brand Syndicate Resources' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Career Resources, Brand Syndicate',
    description: 'Expert articles on resumes, personal branding, portfolios, and presentations.',
    images: [`${APP_URL}/og-default.png`],
  },
}

const resourcesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  url: `${APP_URL}/resources`,
  name: 'Free Career Resources, Brand Syndicate',
  description: 'Expert articles and guides on brand building, website design, logo direction, and content strategy.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Resources', item: `${APP_URL}/resources` },
    ],
  },
}

const articles = [
  {
    slug: 'how-to-write-resume-bullets-that-get-interviews',
    category: 'Resume',
    title: 'How to Write Resume Bullets That Actually Get Interviews',
    excerpt: 'Most resume bullets bury the lead. Learn the achievement-first formula that makes recruiters stop scrolling.',
    readTime: '7 min',
    date: 'Apr 18, 2026',
  },
  {
    slug: 'ats-optimization-guide-2026',
    category: 'Resume',
    title: 'ATS Optimization Guide: Get Past the Bots in 2026',
    excerpt: 'Over 90% of large companies use ATS software. Here is exactly how to format and keyword-optimize your resume to pass automated screening.',
    readTime: '9 min',
    date: 'Apr 14, 2026',
  },
  {
    slug: 'resume-summary-vs-objective',
    category: 'Resume',
    title: 'Resume Summary vs. Objective: Which One You Actually Need',
    excerpt: 'The debate is over. We analyzed 2,000 resumes to find out which opening section performs better, and when to use each.',
    readTime: '5 min',
    date: 'Apr 10, 2026',
  },
  {
    slug: 'presentation-opening-lines-that-hook',
    category: 'Presentation',
    title: '12 Presentation Opening Lines That Hook Any Audience',
    excerpt: 'You have 30 seconds before people decide whether to pay attention. These proven openers work across investor pitches, client decks, and keynotes.',
    readTime: '6 min',
    date: 'Apr 6, 2026',
  },
  {
    slug: 'pitch-deck-structure-guide',
    category: 'Presentation',
    title: 'The Pitch Deck Structure That Raised $50M (Dissected)',
    excerpt: 'We reverse-engineered 40 successful pitch decks to find the exact slide order, story arc, and visual hierarchy that closes deals.',
    readTime: '11 min',
    date: 'Apr 1, 2026',
  },
  {
    slug: 'data-storytelling-for-presentations',
    category: 'Presentation',
    title: 'Data Storytelling: Turn Numbers Into Narratives That Persuade',
    excerpt: 'Raw data does not move people, stories do. Learn the framework for wrapping statistics in narrative so audiences actually remember them.',
    readTime: '8 min',
    date: 'Mar 26, 2026',
  },
  {
    slug: 'personal-brand-complete-guide',
    category: 'Guide',
    title: 'The Complete Personal Branding Guide for 2026',
    excerpt: 'A step-by-step system for building a personal brand that opens doors, covering positioning, storytelling, and channel strategy.',
    readTime: '15 min',
    date: 'Mar 20, 2026',
  },
  {
    slug: 'portfolio-copy-that-converts',
    category: 'Guide',
    title: 'Portfolio Copy That Converts: Writing About Your Work Without Bragging',
    excerpt: 'Talking about your own work feels awkward. This guide gives you frameworks to present your projects with confidence and specificity.',
    readTime: '10 min',
    date: 'Mar 14, 2026',
  },
  {
    slug: 'linkedin-about-section-formula',
    category: 'Guide',
    title: 'The LinkedIn About Section Formula That Gets 10x More Views',
    excerpt: 'Most LinkedIn summaries are walls of text nobody reads. The hook-story-CTA formula changes that completely.',
    readTime: '7 min',
    date: 'Mar 8, 2026',
  },
  {
    slug: 'career-change-resume-tips',
    category: 'Resume',
    title: 'Career Change Resume: How to Reframe Your Experience for a New Industry',
    excerpt: 'Switching fields does not mean starting from zero. These reframing techniques help you translate transferable skills into the language of your target industry.',
    readTime: '9 min',
    date: 'Mar 2, 2026',
  },
]

const categoryColors: Record<string, string> = {
  Resume: '#C9A84C',
  Presentation: '#7B9EBC',
  Guide: '#7BAC89',
}

export default function ResourcesPage() {
  const categories = ['All', 'Resume', 'Presentation', 'Guide']

  return (
    <div className="public-page" style={{ minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      <PublicNav active="/resources" />

      {/* Hero */}

      <PublicFooter />
    </div>
  )
}
