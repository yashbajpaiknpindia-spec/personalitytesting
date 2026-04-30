'use client'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

interface RelatedArticle {
  slug: string
  title: string
  category: string
  readTime: string
}

interface ArticleLayoutProps {
  category: string
  categoryColor?: string
  title: string
  excerpt: string
  date: string
  readTime: string
  children: React.ReactNode
  related?: RelatedArticle[]
}

const defaultCategoryColor = '#C9A84C'

export default function ArticleLayout({
  category,
  categoryColor = defaultCategoryColor,
  title,
  excerpt,
  date,
  readTime,
  children,
  related = [],
}: ArticleLayoutProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans', sans-serif", color: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      <PublicNav active="/resources" />

      {/* Accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${categoryColor}, transparent)` }} />

      {/* Article header */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 48px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 28 }}>
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
          fontSize: 'clamp(30px, 4.5vw, 48px)',
          fontWeight: 400,
          color: 'var(--cream)',
          lineHeight: 1.2,
          marginBottom: 20,
        }}>{title}</h1>

        <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 24, maxWidth: 580 }}>{excerpt}</p>

        <div style={{ fontSize: 12, color: 'var(--muted2)', paddingBottom: 32, borderBottom: '1px solid var(--border)' }}>
          Published {date} · Brand Syndicate Editorial
        </div>
      </div>

      {/* Article body */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px', flex: 1 }}>
        <div style={{
          fontSize: 15,
          lineHeight: 1.9,
          color: 'var(--muted)',
        }}>
          {children}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 760, margin: '48px auto 0', padding: '40px 32px', background: 'var(--surface)', border: '1px solid var(--border)', marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 20, color: 'var(--cream)', marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>Apply this to your own brand.</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>Generate your resume bullets, portfolio copy, and presentation deck with AI in seconds.</div>
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
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 80px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginBottom: 24 }}>Related Articles</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1, border: '1px solid var(--border)', background: 'var(--border)' }}>
            {related.map(r => (
              <Link key={r.slug} href={`/articles/${r.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--surface)', padding: '24px 20px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
                >
                  <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>{r.category}</div>
                  <div style={{ fontSize: 14, color: 'var(--cream)', lineHeight: 1.4, marginBottom: 12, fontFamily: "'Playfair Display', serif" }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--gold)' }}>Read →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  )
}
