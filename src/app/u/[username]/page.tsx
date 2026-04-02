import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

interface BrandOutput {
  headline: string; tagline: string; bio: string; skills: string[]
  cta: string; cardTitle: string; cardName: string
  portfolioSections: Array<{ title: string; body: string; highlight: string }>
}

export default async function PublicPortfolioPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const user = await db.user.findUnique({ where: { username } })
  if (!user) notFound()

  const generation = await db.generation.findFirst({
    where: { userId: user.id, status: 'COMPLETE' },
    orderBy: { createdAt: 'desc' },
  })

  const accent = user.accentColor || '#C9A84C'
  const out = generation?.outputData as unknown as BrandOutput | null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#09090A;color:#E8E2D8;font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#3A3530;border-radius:2px}
      `}</style>

      <div style={{ background: '#09090A', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: '#E8E2D8' }}>
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(9,9,10,0.95)', backdropFilter: 'blur(20px)', zIndex: 100 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, letterSpacing: '0.2em', color: '#F0EAE0', textTransform: 'uppercase' }}>
            {user.name} <span style={{ color: accent }}>·</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Work', 'About', 'Contact'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C564E', textDecoration: 'none', transition: 'color 0.2s' }}>{l}</a>
            ))}
          </div>
        </nav>

        {/* Hero */}
        <section style={{ padding: '80px 40px 60px', maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>
            <div style={{ width: 20, height: 1, background: accent }} />
            {out?.cardTitle || user.jobTitle || 'Professional'}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 56px)', color: '#F0EAE0', lineHeight: 1.1, marginBottom: 20, fontWeight: 400 }}>
            {out?.headline || user.name}
          </h1>
          <p style={{ fontSize: 14, color: '#5C564E', lineHeight: 1.8, maxWidth: 520, fontWeight: 300, marginBottom: 32 }}>
            {out?.bio || user.bio || 'Welcome to my portfolio.'}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button style={{ background: accent, color: '#000', border: 'none', padding: '10px 24px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500 }}>
              {out?.cta || 'Get in Touch'}
            </button>
            {user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" style={{ background: 'transparent', color: '#5C564E', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 24px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>
                Website →
              </a>
            )}
          </div>
        </section>

        {/* Skills */}
        {out?.skills && out.skills.length > 0 && (
          <section style={{ padding: '0 40px 60px', maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {out.skills.map((s: string) => (
                <span key={s} style={{ padding: '5px 14px', border: '1px solid rgba(255,255,255,0.08)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5C564E', fontFamily: "'DM Mono', monospace" }}>{s}</span>
              ))}
            </div>
          </section>
        )}

        {/* Work sections */}
        {out?.portfolioSections && out.portfolioSections.length > 0 && (
          <section id="work" style={{ padding: '60px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
              <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 28 }}>Selected Work</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {out.portfolioSections.map((s: { title: string; body: string; highlight: string }, i: number) => (
                  <div key={i} style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.06)', padding: 24 }}>
                    <div style={{ width: '100%', height: 80, background: '#1A1A1A', marginBottom: 16 }} />
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#E8E2D8', marginBottom: 8 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: '#5C564E', lineHeight: 1.7, marginBottom: 10 }}>{s.body}</div>
                    <div style={{ fontSize: 10, color: accent, letterSpacing: '0.06em', fontFamily: "'DM Mono', monospace" }}>{s.highlight}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* About */}
        <section id="about" style={{ padding: '60px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>
            <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>About</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#F0EAE0', marginBottom: 12 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: '#5C564E', lineHeight: 1.8 }}>{out?.bio || user.bio}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {user.location && <div style={{ fontSize: 11, color: '#5C564E', fontFamily: "'DM Mono', monospace" }}>📍 {user.location}</div>}
                {user.company && <div style={{ fontSize: 11, color: '#5C564E', fontFamily: "'DM Mono', monospace" }}>🏢 {user.company}</div>}
                {user.linkedin && <a href={user.linkedin} style={{ fontSize: 11, color: accent, fontFamily: "'DM Mono', monospace", textDecoration: 'none' }}>LinkedIn →</a>}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" style={{ padding: '32px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 11, color: '#3A3530' }}>{out?.tagline}</div>
          <a href="https://brandsyndicate.co" style={{ fontSize: 10, color: '#3A3530', textDecoration: 'none', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>Made with Brand Syndicate</a>
        </footer>
      </div>
    </>
  )
}
