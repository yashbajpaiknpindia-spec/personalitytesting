import { db } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import Link from 'next/link'

const CATEGORY_COLORS: Record<string, string> = {
  portfolio: '#C9A84C',
  resume: '#7B68EE',
  card: '#4CA8C9',
  presentation: '#C0392B',
}

export default async function TemplatesPage() {
  const session = await auth()
  const templates = await db.template.findMany({ orderBy: { sortOrder: 'asc' } })
  const isPro = session?.user.plan !== 'FREE'

  return (
    <div className="page-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
        <div style={{ width: 20, height: 1, background: 'var(--gold)' }} /> Template Gallery
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: 'var(--cream)', marginBottom: 8 }}>{templates.length} <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Templates</em></h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 36 }}>Choose your aesthetic. Every template is optimized for AI generation.</p>

      {(['portfolio', 'resume', 'card', 'presentation'] as const).map(category => {
        const catTemplates = templates.filter((t: { category: string }) => t.category === category)
        const color = CATEGORY_COLORS[category]
        return (
          <div key={category} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 3, height: 20, background: color, borderRadius: 1 }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)' }}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </div>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginLeft: 4 }}>{catTemplates.length} templates</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {catTemplates.map((t: { id: string; name: string; description: string | null; accentColor: string; tier: string; slug: string }) => {
                const locked = t.tier === 'pro' && !isPro
                return (
                  <Link key={t.id} href={locked ? '/billing' : `/generate?template=${t.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, cursor: 'pointer', transition: 'border-color 0.15s', position: 'relative' }}>
                      {locked && (
                        <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--gold)', color: '#000', fontSize: 8, padding: '2px 6px', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace" }}>PRO</div>
                      )}
                      {/* Template preview */}
                      <div style={{ height: 70, background: 'var(--surface2)', borderRadius: 2, marginBottom: 12, padding: '10px', display: 'flex', flexDirection: 'column', gap: 5, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ height: 2, background: t.accentColor, width: '100%', borderRadius: 1 }} />
                        <div style={{ height: 2, background: 'rgba(255,255,255,0.15)', width: '75%', borderRadius: 1 }} />
                        <div style={{ height: 2, background: 'rgba(255,255,255,0.1)', width: '55%', borderRadius: 1 }} />
                        <div style={{ height: 2, background: 'rgba(255,255,255,0.08)', width: '40%', borderRadius: 1 }} />
                        {locked && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔒</div>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--cream)', marginBottom: 4, fontFamily: "'Playfair Display', serif" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{t.description ?? ''}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                        <span style={{ fontSize: 9, color: color, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>{category}</span>
                        <span style={{ fontSize: 9, color: 'var(--muted2)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>{t.tier}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
