import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'

interface SlideContent {
  type?: 'hook' | 'content' | 'cta'
  layoutType?: string
  heading?: string
  subheading?: string
  body?: string
  imageQuery?: string
  bullets?: string[]
  stats?: Array<{ value: string; label: string }>
  quote?: string
  attribution?: string
  cards?: Array<{ title: string; body: string }>
}

async function getPresentation(slug: string) {
  return db.presentation.findUnique({
    where: { slug },
    include: {
      slides: { orderBy: { order: 'asc' } },
      user: { select: { name: true, jobTitle: true, image: true } },
    },
  })
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPresentation(params.slug)
  if (!p) return { title: 'Presentation Not Found' }
  const description = p.user?.name ? `${p.title} — a presentation by ${p.user.name}` : p.title
  return { title: p.title, description, openGraph: { title: p.title, description, type: 'article' } }
}

export default async function PublicPresentationPage({ params }: { params: { slug: string } }) {
  const p = await getPresentation(params.slug)
  if (!p) notFound()
if (!p) return null
  const sorted = [...p.slides].sort((a, b) => a.order - b.order)
  const accent = p.accentColor ?? '#C9A84C'

  return (
    <div style={{ minHeight: '100vh', background: '#09090A', fontFamily: "'DM Sans', sans-serif", color: '#F8F4EE' }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>

        {p.user?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            {p.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.user.image} alt={p.user.name} width={36} height={36}
                style={{ borderRadius: '50%', border: `1px solid ${accent}40` }} />
            )}
            <div>
              <div style={{ fontSize: 13, color: accent, letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>{p.user.name}</div>
              {p.user.jobTitle && <div style={{ fontSize: 11, color: '#A09890', marginTop: 2 }}>{p.user.jobTitle}</div>}
            </div>
          </div>
        )}

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,4vw,42px)', fontWeight: 400, color: '#F8F4EE', marginBottom: 48, lineHeight: 1.25 }}>
          {p.title}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {sorted.map((slide, idx) => {
            const c = slide.content as SlideContent
            return (
              <div key={slide.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderLeft: `4px solid ${accent}`, borderRadius: 6, padding: '28px 28px 24px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.2em', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 14, textTransform: 'uppercase' }}>
                  {String(idx + 1).padStart(2, '0')} — {(c.layoutType ?? c.type ?? 'content').toUpperCase()}
                </div>
                {c.heading && (
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 400, color: '#F8F4EE', lineHeight: 1.35, margin: 0, marginBottom: 14 }}>
                    {c.heading}
                  </h2>
                )}
                {(c.body || c.subheading) && (
                  <p style={{ fontSize: 15, color: '#A09890', lineHeight: 1.7, margin: 0, marginBottom: 12 }}>{c.body ?? c.subheading}</p>
                )}
                {c.bullets && c.bullets.length > 0 && (
                  <div style={{ margin: '12px 0' }}>
                    {c.bullets.map((b: string, i: number) => (
                      <div key={i} style={{ fontSize: 14, color: '#A09890', lineHeight: 1.7, paddingLeft: 14, marginBottom: 4 }}>› {b}</div>
                    ))}
                  </div>
                )}
                {c.stats && c.stats.length > 0 && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '12px 0' }}>
                    {c.stats.map((stat: { value: string; label: string }, i: number) => (
                      <div key={i} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '12px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, color: accent, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: '#A09890', marginTop: 4, letterSpacing: '0.08em' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                {c.quote && (
                  <div style={{ margin: '12px 0', padding: '12px 16px', borderLeft: `4px solid ${accent}`, fontStyle: 'italic', fontSize: 16, color: '#F8F4EE', lineHeight: 1.6 }}>
                    &ldquo;{c.quote}&rdquo;
                    {c.attribution && <div style={{ fontSize: 12, color: accent, fontStyle: 'normal', marginTop: 6 }}>— {c.attribution}</div>}
                  </div>
                )}
                {c.cards && c.cards.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
                    {c.cards.map((card: { title: string; body: string }, i: number) => (
                      <div key={i} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, color: '#F8F4EE', marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>{card.title}</div>
                        <div style={{ fontSize: 12, color: '#A09890', lineHeight: 1.6 }}>{card.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 60, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.16em', color: '#2a2a2a', fontFamily: "'DM Mono', monospace" }}>
            {sorted.length} {sorted.length === 1 ? 'SLIDE' : 'SLIDES'} · BRAND SYNDICATE
          </span>
          {p.user?.name && (
            <span style={{ fontSize: 10, color: accent, letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>
              {p.user.name.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
