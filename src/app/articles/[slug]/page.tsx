import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getArticle, getAllSlugs, type Section } from '@/lib/articles'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { HoverCard } from '@/components/public/HoverCard'
import AdUnit from '@/components/AdUnit'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticle(params.slug)
  if (!article) return { title: 'Article Not Found — Brand Syndicate' }

  const canonicalUrl = `${APP_URL}/articles/${params.slug}`
  return {
    title: `${article.title} | Brand Syndicate`,
    description: article.excerpt,
    keywords: article.keywords ?? [],
    authors: [{ name: 'Brand Syndicate', url: APP_URL }],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: canonicalUrl,
      type: 'article',
      siteName: 'Brand Syndicate',
      publishedTime: article.date,
      authors: ['Brand Syndicate'],
      images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [`${APP_URL}/og-default.png`],
    },
    robots: { index: true, follow: true },
  }
}

function renderSection(section: Section, idx: number) {
  const baseStyle: React.CSSProperties = { fontSize: 15, lineHeight: 1.9, color: 'var(--muted)', marginBottom: 20 }

  switch (section.type) {
    case 'h2':
      return (
        <h2 key={idx} style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(22px, 3vw, 28px)',
          fontWeight: 400,
          color: 'var(--cream)',
          marginTop: 48,
          marginBottom: 16,
          lineHeight: 1.3,
        }}>{section.text}</h2>
      )
    case 'h3':
      return (
        <h3 key={idx} style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--cream)',
          marginTop: 28,
          marginBottom: 12,
          letterSpacing: '0.01em',
        }}>{section.text}</h3>
      )
    case 'p':
      return <p key={idx} style={baseStyle}>{section.text}</p>
    case 'ul':
      return (
        <ul key={idx} style={{ ...baseStyle, paddingLeft: 20, listStyleType: 'none' }}>
          {section.items?.map((item, i) => (
            <li key={i} style={{ position: 'relative', paddingLeft: 20, marginBottom: 12 }}>
              <span style={{ position: 'absolute', left: 0, color: 'var(--gold)', fontFamily: "'DM Mono', monospace" }}>—</span>
              {item}
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={idx} style={{ ...baseStyle, paddingLeft: 20, listStyleType: 'none', counterReset: 'list-counter' }}>
          {section.items?.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
              <span style={{ color: 'var(--gold)', fontFamily: "'DM Mono', monospace", fontSize: 12, flexShrink: 0, paddingTop: 3 }}>0{i + 1}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )
    case 'callout':
      return (
        <div key={idx} style={{
          background: 'var(--gold-dim)',
          border: '1px solid var(--gold-light)',
          borderLeft: '3px solid var(--gold)',
          padding: '16px 20px',
          marginTop: 32,
          marginBottom: 32,
          fontSize: 14,
          color: 'var(--cream)',
          lineHeight: 1.7,
        }}>{section.text}</div>
      )
    case 'divider':
      return <div key={idx} style={{ height: 1, background: 'var(--border)', margin: '40px 0' }} />
    default:
      return null
  }
}

export default function ArticlePage({ params }: Props) {
  const article = getArticle(params.slug)
  if (!article) notFound()

  const { category, categoryColor, title, excerpt, date, readTime, content, related } = article

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif", color: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      <PublicNav active="/resources" />

      {/* Accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${categoryColor}, transparent)` }} />

      {/* Article header */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 48px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
          <Link href="/resources" style={{ fontSize: 11, color: 'var(--muted2)', textDecoration: 'none', letterSpacing: '0.08em' }}>← Resources</Link>
          <span style={{ color: 'var(--border2)' }}>|</span>
          <span style={{
            fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: categoryColor, fontFamily: "'DM Mono', monospace",
            border: `1px solid ${categoryColor}40`, padding: '3px 8px',
          }}>{category}</span>
          <span style={{ fontSize: 11, color: 'var(--muted2)' }}>{readTime} read</span>
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(28px, 4.5vw, 46px)',
          fontWeight: 400,
          color: 'var(--cream)',
          lineHeight: 1.2,
          marginBottom: 20,
        }}>{title}</h1>

        <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 24 }}>{excerpt}</p>

        <div style={{ fontSize: 12, color: 'var(--muted2)', paddingBottom: 32, borderBottom: '1px solid var(--border)' }}>
          Published {date} · Brand Syndicate Editorial
        </div>
      </div>

      {/* Article body */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px', flex: 1 }}>
        {content.map((section, idx) => (
          <>
            {renderSection(section, idx)}
            {/* Mid-article ad — shown after the 3rd content section */}
            {idx === 2 && (
              <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT || '0000000000'} format="auto" style={{ margin: '2rem 0' }} />
            )}
          </>
        ))}
      </div>

      {/* Ad before CTA */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT || '0000000000'} format="horizontal" />
      </div>

      {/* Inline CTA */}
      <div style={{ maxWidth: 760, margin: '48px auto', padding: '0 32px', width: '100%' }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          padding: '32px 28px',
          display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 8 }}>Apply this to your own brand.</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Generate your resume bullets, portfolio copy, and presentation deck in seconds — no account required.</div>
          </div>
          <Link href="/generate" style={{
            display: 'inline-block', padding: '12px 28px',
            background: 'var(--gold)', color: '#000',
            textDecoration: 'none', fontWeight: 600, fontSize: 12,
            letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
          }}>Try Free →</Link>
        </div>
      </div>

      {/* Related articles */}
      {related.length > 0 && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px 80px', width: '100%' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>Related Articles</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1, border: '1px solid var(--border)', background: 'var(--border)' }}>
            {related.map(r => (
              <Link key={r.slug} href={`/articles/${r.slug}`} style={{ textDecoration: 'none' }}>
                <HoverCard
                  baseStyle={{ background: 'var(--surface)', padding: '24px 20px', height: '100%', cursor: 'pointer' }}
                  hoverStyle={{ background: 'var(--surface2)' }}
                >
                  <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>{r.category}</div>
                  <div style={{ fontSize: 14, color: 'var(--cream)', lineHeight: 1.4, marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 12 }}>{r.readTime} read</div>
                  <div style={{ fontSize: 11, color: 'var(--gold)' }}>Read →</div>
                </HoverCard>
              </Link>
            ))}
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  )
}
