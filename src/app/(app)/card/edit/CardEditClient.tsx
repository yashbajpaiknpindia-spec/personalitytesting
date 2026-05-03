'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface CardData {
  cardName: string
  cardTitle: string
  bio: string
  skills: string[]
  headline: string
  tagline: string
  email?: string
  phone?: string
  website?: string
  linkedin?: string
  twitter?: string
  github?: string
}

const CARD_THEMES = [
  { slug: 'noir-card',      name: 'Noir',      color: '#C9A84C', bg: '#0A0A0A' },
  { slug: 'the-credential', name: 'Credential', color: '#F0EAE0', bg: '#111' },
  { slug: 'obsidian',       name: 'Obsidian',  color: '#C9A84C', bg: '#0D0D0D' },
  { slug: 'minimal-touch',  name: 'Minimal',   color: '#C9A84C', bg: '#F5F5F5' },
  { slug: 'the-signet',     name: 'Signet',    color: '#B8960C', bg: '#111' },
  { slug: 'matte-black',    name: 'Matte',     color: '#C9A84C', bg: '#050505' },
  { slug: 'cipher',         name: 'Cipher',    color: '#4CA8C9', bg: '#091520' },
  { slug: 'luxe-mono',      name: 'Luxe Mono', color: '#F0EAE0', bg: '#0f0f0f' },
  { slug: 'the-partner',    name: 'Partner',   color: '#C9A84C', bg: '#0f1923' },
  { slug: 'carbon',         name: 'Carbon',    color: '#9CA3AF', bg: '#111' },
  { slug: 'embossed',       name: 'Embossed',  color: '#C9A84C', bg: '#1a1410' },
  { slug: 'foundry',        name: 'Foundry',   color: '#B85C2A', bg: '#0f0e0d' },
]

function CardFront({ card, theme }: { card: CardData; theme: typeof CARD_THEMES[0] }) {
  const ac = theme.color
  const isLight = theme.slug === 'minimal-touch'
  const textPrimary = isLight ? '#111' : '#F0EAE0'
  const textMuted = isLight ? '#555' : '#A09890'

  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.bg,
      border: `1px solid ${ac}35`,
      borderRadius: 16,
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      padding: '24px 24px 20px',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${ac}14 0%, transparent 70%)` }} />
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, ${ac}70, transparent)` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${ac}, ${ac}60, transparent)` }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18, position: 'relative' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${ac}18`, border: `1.5px solid ${ac}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, color: ac }}>
          {card.cardName ? card.cardName.charAt(0).toUpperCase() : '?'}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary, marginBottom: 3, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {card.cardName || <span style={{ opacity: 0.3 }}>Your Name</span>}
          </div>
          <div style={{ fontSize: 11, color: ac, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {card.cardTitle || <span style={{ opacity: 0.4 }}>Title</span>}
          </div>
          {card.headline && (
            <div style={{ fontSize: 11, color: textMuted, marginTop: 4, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.headline}</div>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: `linear-gradient(90deg, ${ac}30, transparent)`, marginBottom: 14, position: 'relative' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, position: 'relative' }}>
        {card.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: `${ac}70`, width: 16, textAlign: 'center', flexShrink: 0 }}>✉</span>
            <span style={{ fontSize: 11, color: textMuted, fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{card.email}</span>
          </div>
        )}
        {card.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: `${ac}70`, width: 16, textAlign: 'center', flexShrink: 0 }}>✆</span>
            <span style={{ fontSize: 11, color: textMuted, fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{card.phone}</span>
          </div>
        )}
        {card.website && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 11, color: `${ac}70`, width: 16, textAlign: 'center', flexShrink: 0 }}>⌂</span>
            <span style={{ fontSize: 11, color: textMuted, fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{card.website}</span>
          </div>
        )}
      </div>

      {card.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14, position: 'relative' }}>
          {card.skills.slice(0, 4).map((s, i) => (
            <span key={i} style={{ padding: '3px 9px', borderRadius: 20, background: `${ac}14`, border: `1px solid ${ac}30`, fontSize: 10, color: ac, fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>{s}</span>
          ))}
          {card.skills.length > 4 && <span style={{ padding: '3px 9px', borderRadius: 20, background: `${ac}08`, border: `1px solid ${ac}20`, fontSize: 10, color: `${ac}70`, fontFamily: "'DM Mono', monospace" }}>+{card.skills.length - 4}</span>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', position: 'relative' }}>
        {card.linkedin && <span style={{ fontSize: 10, color: ac, fontFamily: "'DM Mono', monospace", background: `${ac}10`, border: `1px solid ${ac}25`, padding: '3px 8px', borderRadius: 6 }}>in</span>}
        {card.twitter && <span style={{ fontSize: 10, color: ac, fontFamily: "'DM Mono', monospace", background: `${ac}10`, border: `1px solid ${ac}25`, padding: '3px 8px', borderRadius: 6 }}>𝕏</span>}
        {card.github && <span style={{ fontSize: 10, color: ac, fontFamily: "'DM Mono', monospace", background: `${ac}10`, border: `1px solid ${ac}25`, padding: '3px 8px', borderRadius: 6 }}>{'</>'}</span>}
      </div>

      {card.tagline && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${ac}15`, fontSize: 10, color: `${ac}60`, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', position: 'relative' }}>{card.tagline}</div>
      )}

      <div style={{ position: 'absolute', bottom: 12, right: 16, fontSize: 8, color: `${ac}35`, fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase' }}>{theme.name}</div>
    </div>
  )
}

function CardBack({ card, theme }: { card: CardData; theme: typeof CARD_THEMES[0] }) {
  const ac = theme.color
  const isLight = theme.slug === 'minimal-touch'
  const textMuted = isLight ? '#555' : '#A09890'

  return (
    <div style={{
      width: '100%', height: '100%',
      background: theme.bg,
      border: `1px solid ${ac}35`,
      borderRadius: 16,
      fontFamily: "'DM Sans', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${ac}10 0%, transparent 70%)` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${ac}60, transparent)` }} />

      <div style={{
        width: 72, height: 72, borderRadius: 18,
        background: `${ac}14`, border: `1.5px solid ${ac}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, color: ac, fontWeight: 600,
        marginBottom: 16, position: 'relative',
        boxShadow: `0 0 32px ${ac}20`,
      }}>
        {card.cardName ? card.cardName.charAt(0).toUpperCase() : '?'}
      </div>

      {card.bio ? (
        <div style={{ fontSize: 12, color: textMuted, textAlign: 'center', lineHeight: 1.7, maxWidth: 260, position: 'relative', fontStyle: 'italic' }}>{card.bio}</div>
      ) : (
        <div style={{ fontSize: 12, color: `${ac}30`, textAlign: 'center', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>— no bio yet —</div>
      )}

      <div style={{ width: 40, height: 1, background: `${ac}40`, margin: '16px auto' }} />

      <div style={{ fontSize: 10, color: `${ac}70`, fontFamily: "'DM Mono', monospace", letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'center' }}>
        {card.tagline || card.cardName || 'Brand Syndicate'}
      </div>

      <div style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 8, color: `${ac}25`, fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase' }}>BACK</div>
    </div>
  )
}

function FlippableCard({ card, theme, accent }: { card: CardData; theme: typeof CARD_THEMES[0]; accent: string }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <style>{`
        .card-flip-scene { perspective: 1000px; width: 100%; }
        .card-flip-inner {
          position: relative;
          width: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
          transform-style: preserve-3d;
        }
        .card-flip-inner.is-flipped { transform: rotateY(180deg); }
        .card-face {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .card-face-back {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          transform: rotateY(180deg);
        }
        .flip-btn:hover { background: ${accent}18 !important; }
      `}</style>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace" }}>
          Live Preview · <span style={{ color: `${accent}80` }}>{flipped ? 'Back' : 'Front'}</span>
        </div>
        <button
          className="flip-btn"
          onClick={() => setFlipped(f => !f)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: `1px solid ${accent}40`,
            color: accent, padding: '5px 14px', fontSize: 10,
            cursor: 'pointer', borderRadius: 4,
            fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em',
            textTransform: 'uppercase', transition: 'background 0.15s',
          }}
        >
          ↺ Flip
        </button>
      </div>

      {/* 3D card */}
      <div className="card-flip-scene">
        <div className={`card-flip-inner${flipped ? ' is-flipped' : ''}`} style={{ height: 320 }}>
          <div className="card-face" style={{ position: 'absolute', inset: 0 }}>
            <CardFront card={card} theme={theme} />
          </div>
          <div className="card-face card-face-back">
            <CardBack card={card} theme={theme} />
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: `${accent}40`, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>
        click ↺ flip to see card back
      </div>
    </div>
  )
}

// ─── Card Export Buttons ─────────────────────────────────────────────────────
function CardExportButtons({ genId, accent }: { genId: string | null; accent: string }) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function showErr(msg: string) { setErr(msg); setTimeout(() => setErr(null), 4000) }

  async function doPostExport(endpoint: string, key: string, filename: string) {
    if (!genId) { showErr('Save your card first — no generation found'); return }
    setLoadingKey(key)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: genId }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Export failed (${res.status})`)
      }
      const ct = res.headers.get('Content-Type') || ''
      if (ct.includes('json')) {
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        if (data.url) { window.open(data.url, '_blank'); return }
        throw new Error('No download URL')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch (e) {
      showErr(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setLoadingKey(null)
    }
  }

  async function doQR() {
    setLoadingKey('qr')
    try {
      const res = await fetch('/api/card/qr')
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'QR failed') }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'card-qr.png'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch (e) {
      showErr(e instanceof Error ? e.message : 'QR export failed')
    } finally {
      setLoadingKey(null)
    }
  }

  const btn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    background: 'transparent', border: `1px solid ${accent}50`, color: accent,
    padding: '9px 14px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
    cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace",
    width: '100%', transition: 'all 0.15s',
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={btn} onClick={() => doPostExport('/api/export/vcard', 'vcard', 'contact.vcf')} disabled={loadingKey === 'vcard'}>
          {loadingKey === 'vcard' ? '⏳ Exporting…' : '↓ Download vCard (.vcf)'}
        </button>
        <button style={btn} onClick={() => doPostExport('/api/export/pdf', 'pdf', 'business-card.pdf')} disabled={loadingKey === 'pdf'}>
          {loadingKey === 'pdf' ? '⏳ Exporting…' : '↓ Export as PDF'}
        </button>
        <button style={btn} onClick={() => doPostExport('/api/card/wallet-pass', 'wallet', 'card.pkpass')} disabled={loadingKey === 'wallet'}>
          {loadingKey === 'wallet' ? '⏳ Generating…' : '⊕ Add to Wallet'}
        </button>
        <button style={btn} onClick={doQR} disabled={loadingKey === 'qr'}>
          {loadingKey === 'qr' ? '⏳ Generating…' : '⬡ Download QR Code'}
        </button>
      </div>
      {err && <div style={{ marginTop: 8, background: '#1a0808', border: '1px solid #c0392b', color: '#e74c3c', padding: '6px 10px', fontSize: 10, borderRadius: 3 }}>{err}</div>}
    </div>
  )
}

function CardEditClientInner({ accentColor }: { accentColor: string }) {
  const searchParams = useSearchParams()
  const genId = searchParams.get('gen')
  const accent = accentColor || '#C9A84C'
  const [card, setCard] = useState<CardData>({
    cardName: '', cardTitle: '', bio: '', skills: [],
    headline: '', tagline: '', email: '', phone: '',
    website: '', linkedin: '', twitter: '', github: '',
  })
  const [selectedTheme, setSelectedTheme] = useState('noir-card')
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  const currentTheme = CARD_THEMES.find(t => t.slug === selectedTheme) ?? CARD_THEMES[0]

  useEffect(() => {
    const url = genId ? `/api/generate/load?id=${genId}` : '/api/generate/latest'
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.outputData) {
          const o = data.outputData
          setCard({
            cardName:  o.cardName  || '',
            cardTitle: o.cardTitle || '',
            bio:       o.bio       || '',
            skills:    o.skills    || [],
            headline:  o.headline  || '',
            tagline:   o.tagline   || '',
            email:     o.email     || '',
            phone:     o.phone     || '',
            website:   o.website   || '',
            linkedin:  o.linkedin  || '',
            twitter:   o.twitter   || '',
            github:    o.github    || '',
          })
          if (data.inputData?.templateSlug) setSelectedTheme(data.inputData.templateSlug)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [genId])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const endpoint = genId ? `/api/generate/update?id=${genId}` : '/api/generate/latest'
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardName:  card.cardName,
          cardTitle: card.cardTitle,
          bio:       card.bio,
          skills:    card.skills,
          headline:  card.headline,
          tagline:   card.tagline,
        }),
      })
      showToast('✓ Card saved')
    } catch {
      showToast('✕ Save failed')
    } finally {
      setSaving(false)
    }
  }

  function addSkill() {
    const s = skillInput.trim()
    if (!s) return
    setCard(c => ({ ...c, skills: [...c.skills, s] }))
    setSkillInput('')
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)',
    boxSizing: 'border-box',
  }
  const label: React.CSSProperties = {
    fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6, display: 'block',
  }
  const section: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: 24, marginBottom: 20,
  }
  const sHead: React.CSSProperties = {
    fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
    color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 16,
  }
  const exportBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 16px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
    fontFamily: "'DM Mono', monospace", textDecoration: 'none', cursor: 'pointer',
    borderRadius: 'var(--radius)', transition: 'all 0.15s', border: `1px solid ${accent}50`,
    color: accent, background: `${accent}08`,
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>Loading card data…</div>
  }

  return (
    <div className="page-pad" style={{ overflowX: 'hidden' }}>
      <style>{`
        @media(max-width:600px){.form-grid-2{grid-template-columns:1fr !important}}
        @media(max-width:600px){.export-btn-row{flex-direction:column !important}}
        @media(max-width:600px){.export-btn-row a,.export-btn-row button{width:100% !important;justify-content:center !important;box-sizing:border-box !important}}
      `}</style>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a1a1a', border: `1px solid ${accent}60`, borderRadius: 6, padding: '10px 18px', fontSize: 12, color: '#F0EAE0', zIndex: 9999, maxWidth: 'calc(100vw - 48px)' }}>{toast}</div>
      )}

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/generate" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>← Generate</Link>
        <span style={{ color: 'var(--muted2)', fontSize: 11 }}>/</span>
        <span style={{ fontSize: 11, color: accent, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Edit Business Card</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
        <div style={{ width: 20, height: 1, background: 'var(--gold)', flexShrink: 0 }} /> Business Card Editor
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,3vw,32px)', fontWeight: 400, color: 'var(--cream)', marginBottom: 4 }}>Edit Business Card</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>Customise your digital business card — preview updates live as you type.</p>

      {/* ── CARD PREVIEW AT TOP ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40, width: '100%', overflow: 'hidden' }}>
        <FlippableCard card={card} theme={currentTheme} accent={accent} />
      </div>

      {/* ── FORM ── */}
      <div style={{ minWidth: 0 }}>

        {/* Theme picker */}
        <div style={section}>
          <div style={sHead}>Card Theme</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            {CARD_THEMES.map(t => (
              <div key={t.slug} onClick={() => setSelectedTheme(t.slug)} style={{ flexShrink: 0, cursor: 'pointer', width: 64 }}>
                <div style={{
                  width: 64, height: 44, background: t.bg,
                  border: `1px solid ${selectedTheme === t.slug ? t.color : 'var(--border)'}`,
                  borderRadius: 6, padding: '7px 8px',
                  display: 'flex', flexDirection: 'column', gap: 4, transition: 'all 0.15s',
                  boxShadow: selectedTheme === t.slug ? `0 0 10px ${t.color}44` : 'none',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: t.color, opacity: 0.9 }} />
                  <div style={{ height: 2, borderRadius: 1, background: t.color, marginTop: 3 }} />
                  <div style={{ height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.15)', width: '70%' }} />
                  <div style={{ height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.08)', width: '45%' }} />
                </div>
                <div style={{ fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: selectedTheme === t.slug ? t.color : 'var(--muted)', marginTop: 5, textAlign: 'center', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Identity */}
        <div style={section}>
          <div style={sHead}>Identity</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }} className="form-grid-2">
            <div>
              <label style={label}>Display Name</label>
              <input value={card.cardName} onChange={e => setCard(c => ({ ...c, cardName: e.target.value }))} style={fieldStyle} placeholder="Your Name" />
            </div>
            <div>
              <label style={label}>Title / Role</label>
              <input value={card.cardTitle} onChange={e => setCard(c => ({ ...c, cardTitle: e.target.value }))} style={fieldStyle} placeholder="e.g. Product Designer" />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>Headline</label>
            <input value={card.headline} onChange={e => setCard(c => ({ ...c, headline: e.target.value }))} style={fieldStyle} placeholder="Compelling one-liner" />
          </div>
          <div>
            <label style={label}>Tagline</label>
            <input value={card.tagline} onChange={e => setCard(c => ({ ...c, tagline: e.target.value }))} style={fieldStyle} placeholder="Short tagline" />
          </div>
        </div>

        {/* Contact Links */}
        <div style={section}>
          <div style={sHead}>Contact &amp; Social Links</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="form-grid-2">
            {[
              { key: 'email',    label: 'Email',    ph: 'you@example.com' },
              { key: 'phone',    label: 'Phone',    ph: '+1 (555) 000-0000' },
              { key: 'website',  label: 'Website',  ph: 'https://yoursite.com' },
              { key: 'linkedin', label: 'LinkedIn', ph: 'linkedin.com/in/yourhandle' },
              { key: 'twitter',  label: 'Twitter',  ph: '@yourhandle' },
              { key: 'github',   label: 'GitHub',   ph: 'github.com/yourhandle' },
            ].map(f => (
              <div key={f.key}>
                <label style={label}>{f.label}</label>
                <input
                  value={(card as unknown as Record<string, string>)[f.key] || ''}
                  onChange={e => setCard(c => ({ ...c, [f.key]: e.target.value }))}
                  style={fieldStyle} placeholder={f.ph}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div style={section}>
          <div style={sHead}>About</div>
          <label style={label}>Bio <span style={{ color: 'var(--muted2)', fontSize: 9, letterSpacing: '0.06em' }}>(shown on card back)</span></label>
          <textarea value={card.bio} onChange={e => setCard(c => ({ ...c, bio: e.target.value }))} rows={4} style={{ ...fieldStyle, resize: 'vertical' }} placeholder="Short bio shown on card back when flipped" />
        </div>

        {/* Skills */}
        <div style={section}>
          <div style={sHead}>Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {card.skills.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: 20, fontSize: 11, color: accent }}>
                {s}
                <button onClick={() => setCard(c => ({ ...c, skills: c.skills.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0 }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} style={{ ...fieldStyle, flex: 1 }} placeholder="Add a skill and press Enter" />
            <button onClick={addSkill} style={{ background: accent, color: '#000', border: 'none', padding: '9px 16px', fontSize: 11, fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius)', flexShrink: 0 }}>Add</button>
          </div>
        </div>

        {/* Export strip */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Export Options</div>
          <CardExportButtons genId={genId} accent={accent} />
        </div>

        {/* Save + Back */}
        <div className="export-btn-row" style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: accent, color: '#000', border: 'none', padding: '12px 28px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', borderRadius: 'var(--radius)', opacity: saving ? 0.7 : 1, transition: 'all 0.15s', flexShrink: 0 }}
          >
            {saving ? 'Saving…' : 'Save Card'}
          </button>
          <Link href="/generate" style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 20px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", color: 'var(--muted)', textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', flexShrink: 0 }}>
            Back
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CardEditClient({ accentColor }: { accentColor: string }) {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#A09890', fontSize: 12 }}>Loading card editor…</div>}>
      <CardEditClientInner accentColor={accentColor} />
    </Suspense>
  )
}
