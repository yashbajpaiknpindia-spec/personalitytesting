import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'
import { HoverArticle } from '@/components/public/HoverCard'

async function getAuthorPosts(username: string) {
  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, jobTitle: true, image: true, accentColor: true },
  })
  if (!user) return null

  const posts = await db.blogPost.findMany({
    where: { userId: user.id, published: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      title: true, slug: true, excerpt: true, publishedAt: true,
      tags: true, coverImageUrl: true, readingMinutes: true, viewCount: true,
    },
  })

  return { user, posts }
}

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const data = await getAuthorPosts(params.username)
  if (!data) return { title: 'Blog Not Found' }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
  const canonicalUrl = `${baseUrl}/blog/${params.username}`
  const name = data.user.name ?? params.username
  return {
    title: `${name} — Blog | Brand Syndicate`,
    description: `Read articles and professional insights by ${name}${data.user.jobTitle ? ', ' + data.user.jobTitle : ''}. Published on Brand Syndicate.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${name} — Blog`,
      description: `Articles and professional insights by ${name}.`,
      url: canonicalUrl,
      type: 'profile',
      siteName: 'Brand Syndicate',
      ...(data.user.image ? { images: [{ url: data.user.image, width: 400, height: 400, alt: name }] } : {}),
    },
    twitter: {
      card: 'summary',
      title: `${name} — Blog`,
      description: `Articles and professional insights by ${name}.`,
    },
    robots: { index: true, follow: true },
  }
}

export default async function BlogIndexPage({ params }: { params: { username: string } }) {
  const data = await getAuthorPosts(params.username)
  if (!data) notFound()

  const { user, posts } = data
  const accent = user.accentColor ?? '#C9A84C'

  return (
    <div style={{ minHeight: '100vh', background: '#09090A', fontFamily: "'DM Sans', sans-serif", color: '#F8F4EE' }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 100px' }}>

        {/* Author header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 56 }}>
          {user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? ''} width={48} height={48}
              style={{ borderRadius: '50%', border: `2px solid ${accent}40` }} />
          )}
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#F8F4EE' }}>
              {user.name}
            </div>
            {user.jobTitle && (
              <div style={{ fontSize: 12, color: '#A09890', marginTop: 3 }}>{user.jobTitle}</div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 32, textTransform: 'uppercase' }}>
          {posts.length} {posts.length === 1 ? 'Article' : 'Articles'}
        </div>

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#3a3a3a', fontFamily: "'Playfair Display', serif", fontSize: 20 }}>
            No posts published yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {posts.map((post: { slug: string; title: string; excerpt: string | null; publishedAt: Date | null; tags: string[]; coverImageUrl: string | null; readingMinutes: number | null; viewCount: number }) => (
              <Link
                key={post.slug}
                href={`/blog/${params.username}/${post.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <HoverArticle
                  baseStyle={{
                    padding: '28px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start',
                    transition: 'opacity 0.15s',
                  }}
                  hoverStyle={{ opacity: 0.75 }}
                >
                  <div>
                    {post.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                        {post.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} style={{
                            fontSize: 9, letterSpacing: '0.14em', color: accent,
                            background: `${accent}15`, padding: '2px 8px',
                            borderRadius: 2, textTransform: 'uppercase',
                            fontFamily: "'DM Mono', monospace",
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 'clamp(17px, 2vw, 22px)',
                      fontWeight: 400, color: '#F8F4EE',
                      lineHeight: 1.35, margin: 0, marginBottom: post.excerpt ? 10 : 0,
                    }}>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{ fontSize: 13, color: '#A09890', lineHeight: 1.65, margin: 0 }}>
                        {post.excerpt}
                      </p>
                    )}
                    <div style={{ marginTop: 12, fontSize: 10, color: '#3a3a3a', letterSpacing: '0.12em', fontFamily: "'DM Mono', monospace" }}>
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      {post.readingMinutes ? ` · ${post.readingMinutes} min read` : ''}
                    </div>
                  </div>
                  {post.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.coverImageUrl} alt={post.title}
                      style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                  )}
                </HoverArticle>
              </Link>
            ))}
          </div>
        )}

        <div style={{ marginTop: 60, fontSize: 10, color: '#2a2a2a', letterSpacing: '0.16em', fontFamily: "'DM Mono', monospace" }}>
          BRAND SYNDICATE · BLOG
        </div>

        {/* Legal links */}
        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Contact', href: '/contact' },
          ].map(l => (
            <a key={l.href} href={l.href} style={{ fontSize: 10, color: '#3a3a3a', textDecoration: 'none', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
