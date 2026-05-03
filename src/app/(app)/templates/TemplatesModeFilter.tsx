'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type ModeTab = 'all' | 'personal' | 'business'

interface Template {
  id: string
  name: string
  description: string | null
  accentColor: string
  tier: string
  slug: string
  category: string
}

const BUSINESS_ASSET_CARDS = [
  { name: 'Banner', size: '1200×375', desc: 'Web hero banner for campaigns', color: '#C9A84C' },
  { name: 'IG Square', size: '1080×1080', desc: 'Instagram square post', color: '#C9A84C' },
  { name: 'Story', size: '1080×1920', desc: 'Instagram / WhatsApp story', color: '#C9A84C' },
  { name: 'Flyer A5', size: '148×210mm', desc: 'Print-ready promotional flyer', color: '#C9A84C' },
  { name: 'Poster Portrait', size: '420×594mm', desc: 'A2 portrait poster', color: '#C9A84C' },
]

export default function TemplatesModeFilter({
  templates,
  isPro,
  defaultMode,
}: {
  templates: Template[]
  isPro: boolean
  defaultMode: ModeTab
}) {
  const pathname = usePathname()
  const [mode, setMode] = useState<ModeTab>(defaultMode)

  const accent = '#C9A84C'

  // Personal templates = portfolio + resume + presentation (no card)
  const personalTemplates = templates.filter(t => ['portfolio', 'resume', 'presentation'].includes(t.category))
  // All templates (no card in personal, card hidden in personal tab)
  const allTemplates = templates
  const businessTemplates: Template[] = [] // business uses brand assets placeholder cards

  const visibleTemplates = mode === 'personal' ? personalTemplates
    : mode === 'all' ? allTemplates
    : []

  // Group visible templates by category
  const categories = mode === 'personal'
    ? ['portfolio', 'resume', 'presentation']
    : mode === 'all'
    ? ['portfolio', 'resume', 'card', 'presentation']
    : []

  const CAT_META: Record<string, { color: string; desc: string }> = {
    portfolio:    { color: '#C9A84C', desc: 'Showcase your work & projects' },
    resume:       { color: '#8B7EC8', desc: 'ATS-optimised professional CVs' },
    card:         { color: '#5BA8C9', desc: 'Digital business cards' },
    presentation: { color: '#C84B4B', desc: 'Pitch decks & slide presentations' },
  }

  return (
    <div>
      {/* Mode tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 40 }}>
        {([
          { key: 'all', label: 'All' },
          { key: 'personal', label: 'Personal' },
          { key: 'business', label: 'Business' },
        ] as { key: ModeTab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            style={{
              padding: '10px 20px 9px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: mode === tab.key ? accent : 'var(--muted)',
              cursor: 'pointer', background: 'none', border: 'none',
              borderBottom: mode === tab.key ? `2px solid ${accent}` : '2px solid transparent',
              marginBottom: -1, fontFamily: "'DM Mono', monospace", transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Business mode: Brand Assets placeholder section */}
      {mode === 'business' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}12`, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="5" width="14" height="10" rx="1.5" stroke={accent} strokeWidth="1.2"/>
                <path d="M6 5V4a2 2 0 0 1 4 0v1" stroke={accent} strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 3 }}>Brand Assets</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                Layout cards for business image generation
                <span style={{ marginLeft: 6, color: accent }}>· {BUSINESS_ASSET_CARDS.length} formats</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 18, marginBottom: 60 }}>
            {BUSINESS_ASSET_CARDS.map(card => (
              <Link key={card.name} href="/generate/business" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
                    transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = accent
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${accent}15`
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                    ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                  }}
                >
                  {/* Placeholder thumbnail */}
                  <div style={{ height: 128, background: '#09090c', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 60% 40%, ${accent}14 0%, transparent 70%)` }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}55, transparent)` }} />
                    <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: accent, letterSpacing: '0.1em', marginBottom: 4 }}>{card.size}</div>
                      <div style={{ width: 32, height: 1, background: accent, margin: '0 auto', opacity: 0.5 }} />
                    </div>
                  </div>
                  <div style={{ padding: '13px 15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ fontSize: 13, color: 'var(--cream)', fontFamily: "'Playfair Display', serif", lineHeight: 1.3 }}>{card.name}</div>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, flexShrink: 0, boxShadow: `0 0 7px ${accent}80` }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 11 }}>{card.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, color: accent, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>business</span>
                      <span style={{ fontSize: 9, color: 'var(--muted2)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 2 }}>free</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ padding: '24px', background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: accent, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>Generate Business Assets</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
              Use Business Mode to generate banners, flyers, posters, and brand copy in one go.
            </p>
            <Link href="/generate/business" style={{ display: 'inline-block', padding: '8px 20px', background: accent, color: '#000', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 600, borderRadius: 2, textDecoration: 'none' }}>
              Go to Business Studio →
            </Link>
          </div>
        </div>
      )}

      {/* Personal / All: show template categories */}
      {mode !== 'business' && categories.map(cat => {
        const catTemplates = visibleTemplates.filter(t => t.category === cat)
        if (catTemplates.length === 0) return null
        const meta = CAT_META[cat]
        return (
          <div key={cat} style={{ marginBottom: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${meta.color}12`, border: `1px solid ${meta.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="4" width="16" height="12" rx="1.5" stroke={meta.color} strokeWidth="1.2"/>
                  <path d="M6 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke={meta.color} strokeWidth="1.2"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 3 }}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                  {meta.desc}
                  <span style={{ marginLeft: 6, color: meta.color }}>· {catTemplates.length} templates</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 18 }}>
              {catTemplates.map(t => {
                const locked = t.tier === 'pro' && !isPro
                return (
                  <Link key={t.id} href={locked ? '/billing' : `/generate/personal?template=${t.slug}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        background: 'var(--surface)', border: `1px solid ${locked ? 'rgba(201,168,76,0.18)' : 'var(--border)'}`,
                        borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
                        position: 'relative', transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
                      }}
                    >
                      {t.tier === 'pro' && (
                        <div style={{ position: 'absolute', top: 10, right: 10, background: locked ? 'rgba(0,0,0,0.7)' : 'var(--gold)', color: locked ? 'var(--gold)' : '#000', fontSize: 8, padding: '2px 7px', letterSpacing: '0.12em', fontFamily: "'DM Mono', monospace", zIndex: 2, borderRadius: 2, border: locked ? '1px solid rgba(201,168,76,0.38)' : 'none' }}>
                          PRO
                        </div>
                      )}
                      <div style={{ height: 128, background: '#09090c', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${t.accentColor},${t.accentColor}55,transparent)` }} />
                      </div>
                      <div style={{ padding: '13px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                          <div style={{ fontSize: 13, color: 'var(--cream)', fontFamily: "'Playfair Display', serif", lineHeight: 1.3 }}>{t.name}</div>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.accentColor, flexShrink: 0, boxShadow: `0 0 7px ${t.accentColor}80` }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 11, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                          {t.description ?? ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 9, color: meta.color, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>{cat}</span>
                          <span style={{ fontSize: 9, color: t.tier === 'pro' ? 'var(--gold)' : 'var(--muted2)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", border: `1px solid ${t.tier === 'pro' ? '#C9A84C40' : 'var(--border)'}`, padding: '1px 6px', borderRadius: 2 }}>
                            {t.tier}
                          </span>
                        </div>
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
