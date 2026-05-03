import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { HoverCard } from '@/components/public/HoverCard'
import AdUnit from '@/components/AdUnit'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'Free Career Resources & Articles — Resume, Portfolio & Branding Tips',
  description:
    'Free career resources from Brand Syndicate: expert articles on writing ATS-optimized resumes, building a personal brand portfolio, crafting pitch decks, and nailing your LinkedIn profile. Updated for 2026.',
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
    title: 'Free Career Resources — Resume, Portfolio & Personal Branding',
    description: 'Expert articles on resumes, personal branding, portfolios, and presentations. Free from Brand Syndicate.',
    url: `${APP_URL}/resources`,
    type: 'website',
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630, alt: 'Brand Syndicate Resources' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Career Resources — Brand Syndicate',
    description: 'Expert articles on resumes, personal branding, portfolios, and presentations.',
    images: [`${APP_URL}/og-default.png`],
  },
}

const resourcesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  url: `${APP_URL}/resources`,
  name: 'Free Career Resources — Brand Syndicate',
  description: 'Expert articles and guides on resumes, personal branding, portfolios, and presentations.',
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
    excerpt: 'The debate is over. We analyzed 2,000 resumes to find out which opening section performs better — and when to use each.',
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
    excerpt: 'Raw data does not move people — stories do. Learn the framework for wrapping statistics in narrative so audiences actually remember them.',
    readTime: '8 min',
    date: 'Mar 26, 2026',
  },
  {
    slug: 'personal-brand-complete-guide',
    category: 'Guide',
    title: 'The Complete Personal Branding Guide for 2026',
    excerpt: 'A step-by-step system for building a personal brand that opens doors — covering positioning, storytelling, and channel strategy.',
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif", color: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      <PublicNav active="/resources" />

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '72px 32px 48px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 18 }}>
          Free Resources
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 400, color: 'var(--cream)', lineHeight: 1.15, marginBottom: 20, maxWidth: 640 }}>
          Everything you need to build a standout professional brand.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, maxWidth: 560 }}>
          Guides, frameworks, and deep-dives on resumes, presentations, and personal branding — written by professionals, for professionals.
        </p>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 10, marginTop: 40, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <div key={c} style={{
              padding: '6px 16px',
              border: `1px solid ${c === 'All' ? 'var(--gold)' : 'var(--border2)'}`,
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: c === 'All' ? 'var(--gold)' : 'var(--muted)',
              cursor: 'pointer',
            }}>{c}</div>
          ))}
        </div>
      </div>

      {/* Articles grid */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px 100px', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, border: '1px solid var(--border)', background: 'var(--border)' }}>
          {articles.map((article) => (
            <Link key={article.slug} href={`/articles/${article.slug}`} style={{ textDecoration: 'none' }}>
              <HoverCard
                baseStyle={{ background: 'var(--surface)', padding: '32px 28px', height: '100%', transition: 'background 0.2s', cursor: 'pointer' }}
                hoverStyle={{ background: 'var(--surface2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{
                    fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: categoryColors[article.category] ?? 'var(--gold)',
                    fontFamily: "'DM Mono', monospace",
                    border: `1px solid ${categoryColors[article.category] ?? 'var(--gold)'}30`,
                    padding: '3px 8px',
                  }}>{article.category}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted2)' }}>{article.readTime} read</span>
                </div>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 19,
                  fontWeight: 400,
                  color: 'var(--cream)',
                  lineHeight: 1.35,
                  marginBottom: 14,
                }}>{article.title}</h2>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 20 }}>{article.excerpt}</p>
                <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{article.date}</div>
                <div style={{ marginTop: 20, fontSize: 11, color: 'var(--gold)', letterSpacing: '0.08em' }}>Read Article →</div>
              </HoverCard>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA banner */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '60px 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Ready to Put This Into Practice?</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: 'var(--cream)', marginBottom: 16 }}>
            Generate your brand kit in seconds.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>No account required. No templates to fill in. Just describe yourself and watch it build.</p>
          <Link href="/generate" style={{
            display: 'inline-block', padding: '14px 40px',
            background: 'var(--gold)', color: '#000',
            textDecoration: 'none', fontWeight: 600, fontSize: 12,
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>Try for Free →</Link>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_RESOURCES_SLOT || '0000000000'} format="auto" />
      </div>

      <PublicFooter />
    </div>
  )
}
