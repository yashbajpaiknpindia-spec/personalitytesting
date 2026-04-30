'use client'
import { useState, useEffect, useCallback } from 'react'

interface SlideContent {
  type?: string
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

interface Slide { id: string; content: SlideContent }

interface Props {
  title: string
  accent: string
  slides: Slide[]
  user: { name?: string | null; jobTitle?: string | null; image?: string | null } | null
}

// Fetches an image from /api/image for a query
function SlideImg({ query, accent }: { query: string; accent: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    fetch(`/api/image?query=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => { if (d?.url) setSrc(d.url) })
      .catch(() => {})
  }, [query])

  if (!src) return (
    <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, #0f0f0f, #1a1a1a)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 10, color: `${accent}40`, fontFamily: "'DM Mono', monospace" }}>loading image…</span>
    </div>
  )
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={query} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
}

// Renders a single fullscreen 16:9 slide
function FullSlide({ slide, accent, index, total }: { slide: Slide; accent: string; index: number; total: number }) {
  const c = slide.content
  const layout = c.layoutType ?? c.type ?? 'content'

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#09090A',
      fontFamily: "'DM Sans', sans-serif",
      color: '#F8F4EE',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}60, transparent)`, zIndex: 2 }} />

      {/* Image background for image-heavy layouts */}
      {c.imageQuery && (layout === 'hook' || layout === 'split-right' || layout === 'split-left') && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.18 }}>
          <SlideImg query={c.imageQuery} accent={accent} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 72px', position: 'relative', zIndex: 1 }}>

        {/* Slide type badge */}
        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 20, textTransform: 'uppercase', opacity: 0.7 }}>
          {String(index + 1).padStart(2, '0')} — {layout.toUpperCase()}
        </div>

        {/* Heading */}
        {c.heading && (
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(28px, 4vw, 56px)',
            fontWeight: 400, color: '#F8F4EE',
            lineHeight: 1.2, margin: 0, marginBottom: 20,
            maxWidth: '80%',
          }}>
            {c.heading}
          </h2>
        )}

        {/* Body/Subheading */}
        {(c.body || c.subheading) && (
          <p style={{ fontSize: 'clamp(14px, 1.6vw, 20px)', color: '#A09890', lineHeight: 1.7, margin: 0, marginBottom: 24, maxWidth: '65%' }}>
            {c.body ?? c.subheading}
          </p>
        )}

        {/* Bullets */}
        {c.bullets && c.bullets.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {c.bullets.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, marginTop: 7, flexShrink: 0 }} />
                <span style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', color: '#C8BFB5', lineHeight: 1.6 }}>{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {c.stats && c.stats.length > 0 && (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
            {c.stats.map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}25`,
                borderRadius: 12, padding: '20px 32px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 'clamp(28px, 4vw, 52px)', color: accent, fontFamily: "'DM Mono', monospace", fontWeight: 700, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: '#A09890', marginTop: 8, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quote */}
        {c.quote && (
          <div style={{
            borderLeft: `4px solid ${accent}`,
            paddingLeft: 28, marginBottom: 24,
            maxWidth: '70%',
          }}>
            <div style={{ fontStyle: 'italic', fontSize: 'clamp(16px, 2vw, 28px)', color: '#F8F4EE', lineHeight: 1.6, marginBottom: 12 }}>
              &ldquo;{c.quote}&rdquo;
            </div>
            {c.attribution && (
              <div style={{ fontSize: 13, color: accent, fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>— {c.attribution}</div>
            )}
          </div>
        )}

        {/* Cards grid */}
        {c.cards && c.cards.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(c.cards.length, 3)}, 1fr)`, gap: 16, maxWidth: '90%' }}>
            {c.cards.map((card, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}20`,
                borderRadius: 10, padding: '20px 22px',
                borderTop: `2px solid ${accent}40`,
              }}>
                <div style={{ fontSize: 'clamp(13px, 1.2vw, 16px)', color: '#F8F4EE', marginBottom: 8, fontFamily: "'Playfair Display', serif" }}>{card.title}</div>
                <div style={{ fontSize: 'clamp(11px, 1vw, 14px)', color: '#A09890', lineHeight: 1.6 }}>{card.body}</div>
              </div>
            ))}
          </div>
        )}

        {/* Image below content */}
        {c.imageQuery && layout !== 'hook' && layout !== 'split-right' && layout !== 'split-left' && (
          <div style={{ position: 'absolute', right: 48, bottom: 48, width: '28%', height: '35%', borderRadius: 12, overflow: 'hidden', border: `1px solid ${accent}20` }}>
            <SlideImg query={c.imageQuery} accent={accent} />
          </div>
        )}
      </div>

      {/* Slide counter bottom right */}
      <div style={{
        position: 'absolute', bottom: 20, right: 28,
        fontSize: 10, color: `${accent}50`, fontFamily: "'DM Mono', monospace", letterSpacing: '0.14em',
      }}>
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </div>
  )
}

export default function PublicPresentationClient({ title, accent, slides, user }: Props) {
  const [mode, setMode] = useState<'scroll' | 'present'>('scroll')
  const [activeIdx, setActiveIdx] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const goNext = useCallback(() => setActiveIdx(i => Math.min(i + 1, slides.length - 1)), [slides.length])
  const goPrev = useCallback(() => setActiveIdx(i => Math.max(i - 1, 0)), [])

  // Keyboard navigation in present mode
  useEffect(() => {
    if (mode !== 'present') return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
      if (e.key === 'Escape') { setMode('scroll'); setIsFullscreen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, goNext, goPrev])

  // Fullscreen API
  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } catch { setIsFullscreen(false) }
  }
  async function exitFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
    } catch {}
    setIsFullscreen(false)
  }

  useEffect(() => {
    function onFsChange() {
      if (!document.fullscreenElement) setIsFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  async function startPresentation(idx = 0) {
    setActiveIdx(idx)
    setMode('present')
    await enterFullscreen()
  }

  async function stopPresentation() {
    setMode('scroll')
    await exitFullscreen()
  }

  // ── PRESENT MODE ────────────────────────────────────────────────────────
  if (mode === 'present') {
    const slide = slides[activeIdx]
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#09090A', zIndex: 9999,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Slide area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {slide && <FullSlide slide={slide} accent={accent} index={activeIdx} total={slides.length} />}

          {/* Prev/Next click zones */}
          <div onClick={goPrev} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '12%', cursor: activeIdx > 0 ? 'w-resize' : 'default', zIndex: 10 }} />
          <div onClick={goNext} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '12%', cursor: activeIdx < slides.length - 1 ? 'e-resize' : 'default', zIndex: 10 }} />

          {/* Arrow buttons */}
          {activeIdx > 0 && (
            <button onClick={goPrev} style={{
              position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)', border: `1px solid ${accent}40`,
              color: accent, width: 44, height: 44, borderRadius: '50%',
              fontSize: 20, cursor: 'pointer', zIndex: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>‹</button>
          )}
          {activeIdx < slides.length - 1 && (
            <button onClick={goNext} style={{
              position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.6)', border: `1px solid ${accent}40`,
              color: accent, width: 44, height: 44, borderRadius: '50%',
              fontSize: 20, cursor: 'pointer', zIndex: 11,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>›</button>
          )}
        </div>

        {/* Presenter bar */}
        <div style={{
          background: '#0a0a0a', borderTop: `1px solid rgba(255,255,255,0.06)`,
          padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          {/* Thumbnail strip */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            {slides.map((_, i) => (
              <button key={i} onClick={() => setActiveIdx(i)} style={{
                flexShrink: 0, width: 48, height: 30,
                background: i === activeIdx ? `${accent}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${i === activeIdx ? accent : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 4, cursor: 'pointer', fontSize: 9,
                color: i === activeIdx ? accent : '#555',
                fontFamily: "'DM Mono', monospace",
              }}>
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: '#555', fontFamily: "'DM Mono', monospace", alignSelf: 'center' }}>
              ← → or click arrows
            </span>
            <button onClick={stopPresentation} style={{
              background: 'transparent', border: `1px solid ${accent}40`,
              color: accent, padding: '6px 14px', fontSize: 10,
              cursor: 'pointer', borderRadius: 6, letterSpacing: '0.08em',
              fontFamily: "'DM Mono', monospace",
            }}>✕ Exit</button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCROLL MODE (default) ────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#09090A', fontFamily: "'DM Sans', sans-serif", color: '#F8F4EE' }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Author */}
        {user?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
            {user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name} width={36} height={36}
                style={{ borderRadius: '50%', border: `1px solid ${accent}40` }} />
            )}
            <div>
              <div style={{ fontSize: 13, color: accent, letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>{user.name}</div>
              {user.jobTitle && <div style={{ fontSize: 11, color: '#A09890', marginTop: 2 }}>{user.jobTitle}</div>}
            </div>
          </div>
        )}

        {/* Title + Present button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 40, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,4vw,42px)', fontWeight: 400, color: '#F8F4EE', lineHeight: 1.25, margin: 0, flex: 1 }}>
            {title}
          </h1>
          <button
            onClick={() => startPresentation(0)}
            style={{
              background: accent, color: '#000', border: 'none',
              padding: '12px 24px', fontSize: 11, letterSpacing: '0.14em',
              textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
              fontWeight: 600, cursor: 'pointer', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              boxShadow: `0 0 24px ${accent}40`,
            }}
          >
            ⊞ Present Fullscreen
          </button>
        </div>

        {/* Slide count */}
        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#2a2a2a', fontFamily: "'DM Mono', monospace", marginBottom: 28 }}>
          {slides.length} {slides.length === 1 ? 'SLIDE' : 'SLIDES'} · CLICK ANY SLIDE TO START FROM THERE
        </div>

        {/* Slide cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {slides.map((slide, idx) => {
            const c = slide.content
            return (
              <div
                key={slide.id}
                onClick={() => startPresentation(idx)}
                style={{
                  background: '#111', border: '1px solid rgba(255,255,255,0.07)',
                  borderLeft: `4px solid ${accent}`, borderRadius: 8,
                  padding: '28px 28px 24px', cursor: 'pointer', transition: 'all 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = '#151515'
                  el.style.borderColor = `${accent}50`
                  el.style.boxShadow = `0 4px 20px rgba(0,0,0,0.4)`
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = '#111'
                  el.style.borderColor = 'rgba(255,255,255,0.07)'
                  el.style.boxShadow = 'none'
                }}
              >
                {/* Play hint */}
                <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 10, color: `${accent}40`, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em' }}>
                  ▶ PRESENT FROM HERE
                </div>

                <div style={{ fontSize: 10, letterSpacing: '0.2em', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 14, textTransform: 'uppercase' }}>
                  {String(idx + 1).padStart(2, '0')} — {((c.layoutType ?? c.type ?? 'content')).toUpperCase()}
                </div>
                {c.heading && (
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 400, color: '#F8F4EE', lineHeight: 1.35, margin: 0, marginBottom: 12 }}>
                    {c.heading}
                  </h2>
                )}
                {(c.body || c.subheading) && (
                  <p style={{ fontSize: 15, color: '#A09890', lineHeight: 1.7, margin: 0, marginBottom: 12 }}>{c.body ?? c.subheading}</p>
                )}
                {c.bullets && c.bullets.length > 0 && (
                  <div style={{ margin: '10px 0' }}>
                    {c.bullets.map((b, i) => (
                      <div key={i} style={{ fontSize: 14, color: '#A09890', lineHeight: 1.7, paddingLeft: 14, marginBottom: 3 }}>› {b}</div>
                    ))}
                  </div>
                )}
                {c.stats && c.stats.length > 0 && (
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '10px 0' }}>
                    {c.stats.map((stat, i) => (
                      <div key={i} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '10px 18px', textAlign: 'center' }}>
                        <div style={{ fontSize: 26, color: accent, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>{stat.value}</div>
                        <div style={{ fontSize: 10, color: '#A09890', marginTop: 3, letterSpacing: '0.08em' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                {c.quote && (
                  <div style={{ margin: '10px 0', padding: '10px 14px', borderLeft: `4px solid ${accent}`, fontStyle: 'italic', fontSize: 15, color: '#F8F4EE', lineHeight: 1.6 }}>
                    &ldquo;{c.quote}&rdquo;
                    {c.attribution && <div style={{ fontSize: 12, color: accent, fontStyle: 'normal', marginTop: 5 }}>— {c.attribution}</div>}
                  </div>
                )}
                {c.cards && c.cards.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginTop: 10 }}>
                    {c.cards.map((card, i) => (
                      <div key={i} style={{ background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '12px 14px' }}>
                        <div style={{ fontSize: 13, color: '#F8F4EE', marginBottom: 5, fontFamily: "'Playfair Display', serif" }}>{card.title}</div>
                        <div style={{ fontSize: 12, color: '#A09890', lineHeight: 1.6 }}>{card.body}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, letterSpacing: '0.16em', color: '#2a2a2a', fontFamily: "'DM Mono', monospace" }}>
            {slides.length} {slides.length === 1 ? 'SLIDE' : 'SLIDES'} · BRAND SYNDICATE
          </span>
          <button
            onClick={() => startPresentation(0)}
            style={{
              background: 'transparent', border: `1px solid ${accent}50`,
              color: accent, padding: '8px 20px', fontSize: 10, letterSpacing: '0.12em',
              textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
              cursor: 'pointer', borderRadius: 6,
            }}
          >
            ⊞ Present Fullscreen
          </button>
        </div>
      </div>
    </div>
  )
}
