import type { Metadata } from 'next'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { HoverCard } from '@/components/public/HoverCard'
import AdUnit from '@/components/AdUnit'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'Personal Branding Guides 2026 — Resumes, Portfolios & Presentations',
  description:
    'Step-by-step guides from Brand Syndicate on writing standout resumes, building a personal brand, crafting winning presentations, and creating portfolios that convert. Updated for 2026.',
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
    title: 'Personal Branding Guides 2026 — Brand Syndicate',
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
  name: 'Personal Branding Guides — Brand Syndicate',
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
    excerpt: 'A step-by-step system for building a personal brand that opens doors — covering positioning, storytelling, and channel strategy.',
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif", color: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      <PublicNav active="/guides" />

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '72px 32px 56px' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 18 }}>
          Step-by-Step Guides
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 400, color: 'var(--cream)', lineHeight: 1.15, marginBottom: 20, maxWidth: 600 }}>
          In-depth playbooks for every part of your professional brand.
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, maxWidth: 540 }}>
          Not listicles. Actual frameworks you can follow start-to-finish, with examples and templates built in.
        </p>
      </div>

      {/* Guides list */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px 100px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--border)', background: 'var(--border)' }}>
          {guides.map((guide) => (
            <Link key={guide.slug} href={`/articles/${guide.slug}`} style={{ textDecoration: 'none' }}>
              <HoverCard
                baseStyle={{ background: 'var(--surface)', padding: '36px 32px', display: 'flex', gap: 32, alignItems: 'flex-start', transition: 'background 0.2s', cursor: 'pointer' }}
                hoverStyle={{ background: 'var(--surface2)' }}
              >
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, color: 'var(--border2)', lineHeight: 1, flexShrink: 0, paddingTop: 4 }}>{guide.number}</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 400, color: 'var(--cream)', lineHeight: 1.3, marginBottom: 12 }}>{guide.title}</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 20, maxWidth: 600 }}>{guide.excerpt}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {guide.topics.map(t => (
                      <span key={t} style={{
                        fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--muted2)', border: '1px solid var(--border2)',
                        padding: '3px 8px', fontFamily: "'DM Mono', monospace",
                      }}>{t}</span>
                    ))}
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted2)' }}>{guide.readTime} read</span>
                  </div>
                </div>
                <div style={{ fontSize: 20, color: 'var(--gold)', flexShrink: 0, paddingTop: 4 }}>→</div>
              </HoverCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Also see resources */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '48px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted2)', marginBottom: 8 }}>Looking for shorter reads?</div>
            <div style={{ fontSize: 17, color: 'var(--cream)' }}>Browse all articles and quick tips in our <Link href="/resources" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Resources library →</Link></div>
          </div>
          <Link href="/generate" style={{
            display: 'inline-block', padding: '12px 28px',
            background: 'var(--gold)', color: '#000',
            textDecoration: 'none', fontWeight: 600, fontSize: 12,
            letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
          }}>Try the Generator →</Link>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_GUIDES_SLOT || '0000000000'} format="auto" />
      </div>

      <PublicFooter />
    </div>
  )
}
