import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'Blog — Brand Syndicate · Branding, Strategy & Business Growth',
  description: 'Expert articles on AI branding, business strategy, logo design, website building, and marketing for Indian startups and businesses.',
  keywords: ['brand syndicate blog', 'branding tips India', 'business strategy blog', 'AI branding articles'],
  alternates: { canonical: `${APP_URL}/blog` },
  openGraph: {
    title: 'Blog — Brand Syndicate',
    description: 'Expert articles on branding, strategy, and business growth.',
    url: `${APP_URL}/blog`,
    type: 'website',
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630 }],
  },
}

async function getRecentPosts() {
  return db.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    take: 30,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      tags: true,
      coverImageUrl: true,
      readingMinutes: true,
      viewCount: true,
      user: {
        select: { name: true, username: true, image: true, jobTitle: true },
      },
    },
  })
}

function formatDate(d: Date | string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function BlogPage() {
  const posts = await getRecentPosts()

  return (
    <>
      <PublicNav />
      <main style={{ minHeight: '100vh', background: 'var(--bg, #0A0A0E)', paddingTop: 80, fontFamily: "'DM Sans', sans-serif" }}>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '72px 24px 56px', maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold, #C9A84C)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Blog</div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(34px, 6vw, 52px)', fontWeight: 400, color: 'var(--text, #F4EFE5)', margin: '0 0 18px', lineHeight: 1.15 }}>
            Insights on branding,<br /><em>strategy & growth.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--muted, #A39B8F)', lineHeight: 1.7, margin: 0 }}>
            Articles from the Brand Syndicate team and our community of founders, creators, and brand builders.
          </p>
        </section>

        {/* Posts grid */}
        <section style={{ padding: '0 24px 96px', maxWidth: 1120, margin: '0 auto' }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--muted, #A39B8F)' }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, color: 'var(--text, #F4EFE5)', marginBottom: 12 }}>No posts yet</div>
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>Check back soon, our team is writing.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
              {posts.map(post => (
                <Link
                  key={`${post.user?.username}/${post.slug}`}
                  href={`/blog/${post.user?.username}/${post.slug}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <article style={{ background: 'var(--surface, #0F0F16)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: 12, overflow: 'hidden', height: '100%', transition: 'border-color 0.2s, transform 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border, rgba(255,255,255,0.08))'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>

                    {post.coverImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.coverImageUrl} alt={post.title} loading="lazy" style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                    )}

                    <div style={{ padding: '20px 22px 24px' }}>
                      {/* Tags */}
                      {Array.isArray(post.tags) && post.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                          {(post.tags as string[]).slice(0, 2).map(tag => (
                            <span key={tag} style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold, #C9A84C)', fontFamily: "'DM Mono', monospace", border: '1px solid rgba(201,168,76,0.25)', padding: '2px 8px', borderRadius: 3 }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 400, color: 'var(--text, #F4EFE5)', margin: '0 0 10px', lineHeight: 1.35 }}>
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p style={{ fontSize: 14, color: 'var(--muted, #A39B8F)', lineHeight: 1.65, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {post.user?.name && (
                          <span style={{ fontSize: 12, color: 'var(--muted, #A39B8F)' }}>{post.user.name}</span>
                        )}
                        {post.publishedAt && (
                          <>
                            <span style={{ color: 'var(--border, rgba(255,255,255,0.12))', fontSize: 12 }}>·</span>
                            <span style={{ fontSize: 12, color: 'var(--muted, #A39B8F)', fontFamily: "'DM Mono', monospace" }}>{formatDate(post.publishedAt)}</span>
                          </>
                        )}
                        {post.readingMinutes && (
                          <>
                            <span style={{ color: 'var(--border, rgba(255,255,255,0.12))', fontSize: 12 }}>·</span>
                            <span style={{ fontSize: 12, color: 'var(--muted, #A39B8F)' }}>{post.readingMinutes} min read</span>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
