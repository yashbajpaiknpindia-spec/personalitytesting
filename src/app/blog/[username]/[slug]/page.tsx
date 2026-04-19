import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import Link from 'next/link'

async function getPost(username: string, slug: string) {
  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, jobTitle: true, image: true, accentColor: true, username: true },
  })
  if (!user) return null

  const post = await db.blogPost.findUnique({
    where: { userId_slug: { userId: user.id, slug } },
  })
  if (!post || !post.published) return null

  return { user, post }
}

export async function generateMetadata({
  params,
}: {
  params: { username: string; slug: string }
}): Promise<Metadata> {
  const data = await getPost(params.username, params.slug)
  if (!data) return { title: 'Post Not Found' }

  const { user, post } = data
  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt || `An article by ${user.name}`
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandsyndicate.co'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [user.name ?? params.username],
      url: `${baseUrl}/blog/${params.username}/${params.slug}`,
      ...(post.coverImageUrl ? { images: [{ url: post.coverImageUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
    },
    robots: { index: true, follow: true },
    alternates: { canonical: `${baseUrl}/blog/${params.username}/${params.slug}` },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { username: string; slug: string }
}) {
  const data = await getPost(params.username, params.slug)
  if (!data) notFound()

  const { user, post } = data
  const accent = user.accentColor ?? '#C9A84C'

  // Track view — fire-and-forget
  void db.blogPost.update({
    where: { userId_slug: { userId: user.id, slug: params.slug } },
    data: { viewCount: { increment: 1 } },
  })

  // Structured data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brandsyndicate.co'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Person', name: user.name, url: `${baseUrl}/u/${user.username}` },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    url: `${baseUrl}/blog/${params.username}/${params.slug}`,
    ...(post.coverImageUrl ? { image: post.coverImageUrl } : {}),
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090A', fontFamily: "'DM Sans', sans-serif", color: '#F8F4EE' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono&display=swap');
        .post-body { line-height: 1.85; font-size: 16px; color: #C0B9AE; }
        .post-body h1,.post-body h2,.post-body h3 { font-family:'Playfair Display',serif; font-weight:400; color:#F8F4EE; margin:2em 0 0.6em; }
        .post-body h1 { font-size:clamp(22px,3vw,32px); }
        .post-body h2 { font-size:clamp(18px,2.5vw,26px); }
        .post-body h3 { font-size:clamp(15px,2vw,20px); }
        .post-body p { margin:0 0 1.4em; }
        .post-body a { color:${accent}; text-decoration:underline; text-underline-offset:3px; }
        .post-body ul,.post-body ol { padding-left:1.4em; margin:0 0 1.4em; }
        .post-body li { margin-bottom:0.4em; }
        .post-body blockquote { border-left:3px solid ${accent}; padding:12px 20px; margin:1.6em 0; background:rgba(255,255,255,0.02); color:#A09890; font-style:italic; }
        .post-body code { background:#1a1a1a; color:${accent}; padding:2px 6px; border-radius:2px; font-family:'DM Mono',monospace; font-size:0.88em; }
        .post-body pre { background:#111; border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:16px 20px; overflow-x:auto; margin:1.4em 0; }
        .post-body pre code { background:transparent; padding:0; color:#C0B9AE; }
        .post-body img { max-width:100%; border-radius:4px; margin:1.4em 0; }
        .post-body hr { border:none; border-top:1px solid rgba(255,255,255,0.07); margin:2.4em 0; }
        .post-body strong { color:#F8F4EE; font-weight:500; }
      ` }} />

      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '52px 24px 100px' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href={`/blog/${params.username}`} style={{
            fontSize: 10, letterSpacing: '0.14em', color: accent,
            textDecoration: 'none', fontFamily: "'DM Mono', monospace",
            textTransform: 'uppercase',
          }}>
            ← {user.name ?? params.username}
          </Link>
          <span style={{ fontSize: 10, color: '#2a2a2a' }}>/</span>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', color: '#3a3a3a', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>
            Blog
          </span>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {post.tags.map((tag: string) => (
              <span key={tag} style={{
                fontSize: 9, letterSpacing: '0.14em', color: accent,
                background: `${accent}15`, padding: '2px 8px', borderRadius: 2,
                textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(26px,4vw,44px)',
          fontWeight: 400, color: '#F8F4EE',
          lineHeight: 1.2, margin: 0, marginBottom: 20,
        }}>
          {post.title}
        </h1>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
          {user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? ''} width={32} height={32}
              style={{ borderRadius: '50%', border: `1px solid ${accent}40` }} />
          )}
          <div>
            <div style={{ fontSize: 12, color: '#F8F4EE' }}>{user.name}</div>
            <div style={{ fontSize: 10, color: '#3a3a3a', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", marginTop: 2 }}>
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              {post.readingMinutes ? ` · ${post.readingMinutes} MIN READ` : ''}
            </div>
          </div>
        </div>

        {/* Cover image */}
        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImageUrl} alt={post.title}
            style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 6, marginBottom: 48 }} />
        )}

        {/* Body — rendered as HTML (author controls content) */}
        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer */}
        <div style={{ marginTop: 72, paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Link href={`/blog/${params.username}`} style={{
            fontSize: 11, color: accent, letterSpacing: '0.1em',
            textDecoration: 'none', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase',
          }}>
            ← More Articles
          </Link>
          <span style={{ fontSize: 10, color: '#2a2a2a', letterSpacing: '0.14em', fontFamily: "'DM Mono', monospace" }}>
            BRAND SYNDICATE
          </span>
        </div>
      </div>
    </div>
  )
}
