'use client'
/**
 * SlideEditor — real 16:9 presentation editor
 *
 * Layout: vertical filmstrip (left) + large active slide stage (right).
 * Each slide renders as a true 16:9 panel styled by layoutType.
 * Fields are contentEditable and debounce-save to the DB on blur.
 * Drag-to-reorder happens in the filmstrip thumbnails.
 */

import React, {
  useState, useEffect, useRef, useCallback,
} from 'react'
import type { Slide, SlideContent } from '@/hooks/usePresentation'
import { useSlideOperations } from '@/hooks/useSlideOperations'
import { useUpdatePresentation } from '@/hooks/useUpdatePresentation'

// ─── types ────────────────────────────────────────────────────────────────

interface SeedSlide {
  title?: string
  heading?: string
  body?: string
  imageQuery?: string
  layoutType?: string
  subheading?: string
  bullets?: string[]
  stats?: Array<{ value: string; label: string }>
  quote?: string
  attribution?: string
  cards?: Array<{ title: string; body: string }>
}

export interface SlideEditorProps {
  existingPresentationId?: string
  presentationHook?: string
  presentationSlides?: SeedSlide[]
  accentColor?: string
  generationId?: string
}

// ─── Presentation themes ───────────────────────────────────────────────────

const PRES_THEMES: Array<{ key: string; label: string; bg: string; accent: string; text: string; muted: string; surface: string; border: string }> = [
  { key: 'noir',      label: 'Noir',      bg: '#0A0A0B', accent: '#C9A84C', text: '#F8F4EE', muted: '#A09890', surface: '#111',    border: 'rgba(255,255,255,0.07)' },
  { key: 'corporate', label: 'Corporate', bg: '#0D1B2A', accent: '#4A9EFF', text: '#E8F4FD', muted: '#7AA8CC', surface: '#0F2236', border: 'rgba(74,158,255,0.12)' },
  { key: 'minimal',   label: 'Minimal',   bg: '#FAFAFA', accent: '#1A1A1A', text: '#1A1A1A', muted: '#777',    surface: '#F0F0F0', border: 'rgba(0,0,0,0.1)' },
  { key: 'bold',      label: 'Bold',      bg: '#1A0A2E', accent: '#FF6B35', text: '#FFFFFF',  muted: '#BB99CC', surface: '#230E3D', border: 'rgba(255,107,53,0.15)' },
  { key: 'warm',      label: 'Warm',      bg: '#2C1810', accent: '#E8A87C', text: '#F5E6D3',  muted: '#C8A890', surface: '#3A2018', border: 'rgba(232,168,124,0.15)' },
  { key: 'ocean',     label: 'Ocean',     bg: '#0A1628', accent: '#00C9A7', text: '#E0F7F4',  muted: '#78B8B0', surface: '#0F2035', border: 'rgba(0,201,167,0.12)' },
]

// ─── helpers ──────────────────────────────────────────────────────────────

function storageKey(genId?: string) { return `bs_pres_${genId ?? 'manual'}` }
function buildShareUrl(slug: string) { return `${window.location.origin}/presentation/${slug}` }

// ─── SlideImage ────────────────────────────────────────────────────────────

function SlideImage({ query, accent, style }: {
  query: string; accent: string; style?: React.CSSProperties
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setSrc(null)
    fetch(`/api/image?query=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d?.url) setSrc(d.url) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [query])

  if (loading || !src) {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg,#0f0f0f,#1a1a1a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}>
        <span style={{
          fontSize: 10, color: accent + '50',
          fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em',
          animation: loading ? 'se_pulse 1.4s ease-in-out infinite' : 'none',
        }}>
          {loading ? '● loading' : '📷 ' + query}
        </span>
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={query} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }} />
}

// ─── Editable field ────────────────────────────────────────────────────────
// A contentEditable span that saves on blur

function EditField({ value, onChange, style, placeholder }: {
  value?: string
  onChange: (v: string) => void
  style?: React.CSSProperties
  placeholder?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Keep DOM in sync when value changes externally (e.g. after save)
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.textContent = value ?? ''
    }
  }, [value])

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={e => onChange(e.currentTarget.textContent ?? '')}
      onClick={e => e.stopPropagation()}
      style={{
        outline: 'none',
        cursor: 'text',
        minHeight: '1em',
        borderBottom: '1px dashed transparent',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={e => {
        e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.25)'
      }}
      onBlurCapture={e => {
        e.currentTarget.style.borderBottomColor = 'transparent'
      }}
    >
      {value}
    </div>
  )
}


// ─── SlideDecorations ──────────────────────────────────────────────────────
// Decorative circles/glows matching the generation preview page

function SlideDecorations({ accent, variant = 'corner' }: {
  accent: string
  variant?: 'corner' | 'side' | 'center' | 'minimal'
}) {
  if (variant === 'minimal') return null
  return (
    <>
      {/* Top-right large circle bleed */}
      <div style={{
        position: 'absolute', top: '-22%', right: '-12%',
        width: '42%', height: '65%', borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}28 0%, ${accent}08 60%, transparent 80%)`,
        border: `1px solid ${accent}20`,
        pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Medium circle */}
      <div style={{
        position: 'absolute', top: '-8%', right: '2%',
        width: '22%', height: '35%', borderRadius: '50%',
        background: `${accent}14`,
        pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Small accent dot */}
      <div style={{
        position: 'absolute', top: '14%', right: '1%',
        width: '3%', height: '5%', borderRadius: '50%',
        background: `${accent}60`,
        pointerEvents: 'none', zIndex: 0,
      }} />
      {variant === 'corner' && (
        <>
          {/* Bottom-left large circle */}
          <div style={{
            position: 'absolute', bottom: '-20%', left: '-10%',
            width: '36%', height: '58%', borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}22 0%, ${accent}06 60%, transparent 80%)`,
            border: `1px solid ${accent}18`,
            pointerEvents: 'none', zIndex: 0,
          }} />
          {/* Bottom-left small dot */}
          <div style={{
            position: 'absolute', bottom: '5%', left: '5%',
            width: '3.5%', height: '5%', borderRadius: '50%',
            background: `${accent}55`,
            pointerEvents: 'none', zIndex: 0,
          }} />
          {/* Diagonal accent line */}
          <div style={{
            position: 'absolute', top: '62%', left: '52%',
            width: '15%', height: '2px',
            background: `${accent}45`,
            transform: 'rotate(-28deg)',
            pointerEvents: 'none', zIndex: 0,
          }} />
          {/* Grid dot cluster top-left */}
          {([0, 1, 2] as number[]).flatMap(gx => ([0, 1] as number[]).map(gy => (
            <div key={`${gx}-${gy}`} style={{
              position: 'absolute',
              top: `${4 + gy * 4}%`, left: `${3 + gx * 4}%`,
              width: '1.2%', height: '1.8%', borderRadius: '50%',
              background: `${accent}55`,
              pointerEvents: 'none', zIndex: 0,
            }} />
          )))}
        </>
      )}
      {variant === 'side' && (
        <>
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '1.2%',
            background: `${accent}30`, pointerEvents: 'none', zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: 0, right: 0, height: '0.4%',
            background: `${accent}25`, pointerEvents: 'none', zIndex: 0,
          }} />
        </>
      )}
      {variant === 'center' && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '60%', height: '90%', borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
          pointerEvents: 'none', zIndex: 0,
        }} />
      )}
    </>
  )
}

// ─── LiveSlide ─────────────────────────────────────────────────────────────
// Renders a real 16:9 slide with inline-editable fields

function LiveSlide({ slide, accent, theme, onContentChange }: {
  slide: Slide
  accent: string
  theme?: typeof PRES_THEMES[number]
  onContentChange: (id: string, field: keyof SlideContent, value: string) => void
}) {
  const c = slide.content
  const layout = c.layoutType ?? c.type ?? 'content'
  const ch = (field: keyof SlideContent) => (v: string) => onContentChange(slide.id, field, v)

  // Resolve theme colors with fallbacks
  const th = theme ?? PRES_THEMES[0]
  const bgColor = th.bg
  const textColor = th.text
  const mutedColor = th.muted
  const surfaceColor = th.surface
  const borderColor = th.border
  const accentColor = accent  // keep using passed accent for consistency

  // Label pill (non-interactive)
  const LabelPill = ({ pos }: { pos?: React.CSSProperties }) => (
    <div style={{
      position: 'absolute', top: 10, left: 10, zIndex: 3,
      display: 'flex', alignItems: 'center', gap: 5,
      pointerEvents: 'none', userSelect: 'none',
      ...pos,
    }}>
      <span style={{
        fontSize: 8, letterSpacing: '0.14em', color: accentColor,
        fontFamily: "'DM Mono',monospace", opacity: 0.7,
      }}>{layout.toUpperCase()}</span>
    </div>
  )

  // Outer 16:9 wrapper
  const Shell = ({ children, bg }: { children: React.ReactNode; bg?: string }) => (
    <div style={{
      position: 'relative', width: '100%', paddingTop: '56.25%',
      background: bg ?? bgColor, borderRadius: 4, overflow: 'hidden',
      border: `1px solid ${accentColor}20`,
    }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        {children}
      </div>
    </div>
  )

  // ── HOOK / TITLE-ONLY ────────────────────────────────────────────────
  if (layout === 'hook' || layout === 'title-only' || layout === 'cta') {
    return (
      <Shell>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <SlideDecorations accent={accentColor} variant="corner" />
        </div>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg,transparent,${accentColor},transparent)`,
        }} />
        <LabelPill />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '10% 12%', textAlign: 'center', zIndex: 1,
        }}>
          <EditField
            value={c.heading}
            onChange={ch('heading')}
            placeholder="Slide heading"
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(14px,3vw,28px)',
              color: textColor, lineHeight: 1.3,
              textAlign: 'center',
            }}
          />
          {(c.subheading !== undefined) && (
            <EditField
              value={c.subheading}
              onChange={ch('subheading')}
              placeholder="Subheading…"
              style={{
                marginTop: '4%', fontSize: 'clamp(9px,1.4vw,13px)',
                color: mutedColor, fontStyle: 'italic',
                textAlign: 'center',
              }}
            />
          )}
          <div style={{
            position: 'absolute', bottom: '8%',
            width: 24, height: 2, background: accentColor, borderRadius: 1,
          }} />
        </div>
      </Shell>
    )
  }

  // ── HERO ─────────────────────────────────────────────────────────────
  if (layout === 'hero') {
    return (
      <Shell>
        <LabelPill />
        {!c.imageQuery && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <SlideDecorations accent={accentColor} variant="corner" />
          </div>
        )}
        {c.imageQuery && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <SlideImage query={c.imageQuery} accent={accentColor} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.2) 60%,transparent 100%)',
            }} />
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '5% 7%',
        }}>
          <EditField
            value={c.heading}
            onChange={ch('heading')}
            placeholder="Slide title"
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(14px,3vw,26px)',
              color: textColor, lineHeight: 1.25,
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            }}
          />
          {c.subheading !== undefined && (
            <EditField
              value={c.subheading}
              onChange={ch('subheading')}
              placeholder="Subheading…"
              style={{
                marginTop: '2%', fontSize: 'clamp(9px,1.3vw,12px)',
                color: accentColor, letterSpacing: '0.06em',
                textShadow: '0 1px 6px rgba(0,0,0,0.8)',
              }}
            />
          )}
        </div>
      </Shell>
    )
  }

  // ── SPLIT-LEFT / SPLIT-RIGHT ─────────────────────────────────────────
  if (layout === 'split-left' || layout === 'split-right') {
    const imgOnRight = layout === 'split-left'
    return (
      <Shell>
        <LabelPill />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex',
          flexDirection: imgOnRight ? 'row' : 'row-reverse',
        }}>
          {/* Text column */}
          <div style={{
            flex: '0 0 55%', padding: '8% 5% 8% 6%',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            overflow: 'hidden', position: 'relative', zIndex: 1,
          }}>
            <SlideDecorations accent={accentColor} variant="corner" />
            <EditField
              value={c.heading}
              onChange={ch('heading')}
              placeholder="Heading"
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 'clamp(12px,2.2vw,20px)',
                color: textColor, lineHeight: 1.3, marginBottom: '4%',
              }}
            />
            {c.subheading !== undefined && (
              <EditField
                value={c.subheading}
                onChange={ch('subheading')}
                placeholder="Subheading…"
                style={{
                  fontSize: 'clamp(8px,1.1vw,11px)',
                  color: accentColor, marginBottom: '3%', fontStyle: 'italic',
                }}
              />
            )}
            {c.body !== undefined && (
              <EditField
                value={c.body}
                onChange={ch('body')}
                placeholder="Body text…"
                style={{
                  fontSize: 'clamp(8px,1.1vw,11px)',
                  color: mutedColor, lineHeight: 1.7,
                }}
              />
            )}
          </div>
          {/* Image column */}
          <div style={{ flex: '0 0 45%', position: 'relative', overflow: 'hidden' }}>
            {c.imageQuery
              ? <SlideImage query={c.imageQuery} accent={accentColor} />
              : <div style={{ width: '100%', height: '100%', background: surfaceColor }} />
            }
          </div>
        </div>
      </Shell>
    )
  }

  // ── STATS ────────────────────────────────────────────────────────────
  if (layout === 'stats') {
    return (
      <Shell>
        <div style={{ position: 'absolute', inset: 0 }}>
          <SlideDecorations accent={accentColor} variant="side" />
        </div>
        <LabelPill />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '8% 10%', zIndex: 1,
        }}>
          <EditField
            value={c.heading}
            onChange={ch('heading')}
            placeholder="Heading"
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(12px,2vw,18px)',
              color: textColor, marginBottom: '6%', textAlign: 'center',
            }}
          />
          {c.stats && c.stats.length > 0 && (
            <div style={{ display: 'flex', gap: '4%', width: '100%', justifyContent: 'center' }}>
              {c.stats.map((stat, j) => (
                <div key={j} style={{
                  flex: 1, background: surfaceColor,
                  border: `1px solid ${accentColor}40`, borderRadius: 4,
                  padding: '4% 2%', textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 'clamp(18px,3.5vw,36px)',
                    color: accentColor, fontFamily: "'DM Mono',monospace", lineHeight: 1,
                  }}>{stat.value}</div>
                  <div style={{
                    fontSize: 'clamp(7px,0.9vw,10px)',
                    color: mutedColor, letterSpacing: '0.08em',
                    marginTop: '6%', textTransform: 'uppercase',
                  }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Shell>
    )
  }

  // ── BULLETS ──────────────────────────────────────────────────────────
  if (layout === 'bullets') {
    return (
      <Shell>
        <div style={{ position: 'absolute', inset: 0 }}>
          <SlideDecorations accent={accentColor} variant={c.imageQuery ? 'minimal' : 'corner'} />
        </div>
        <LabelPill />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'row',
        }}>
          <div style={{
            flex: c.imageQuery ? '0 0 58%' : '1',
            padding: '8% 6%',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <EditField
              value={c.heading}
              onChange={ch('heading')}
              placeholder="Heading"
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 'clamp(12px,2vw,18px)',
                color: textColor, marginBottom: '5%',
              }}
            />
            {c.bullets && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3%' }}>
                {c.bullets.map((b, j) => (
                  <div key={j} style={{ display: 'flex', gap: '2%', alignItems: 'flex-start' }}>
                    <span style={{ color: accentColor, flexShrink: 0, fontSize: 'clamp(8px,1.2vw,12px)', marginTop: '0.1em' }}>›</span>
                    <span style={{ fontSize: 'clamp(8px,1.1vw,11px)', color: mutedColor, lineHeight: 1.6 }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {c.imageQuery && (
            <div style={{ flex: '0 0 42%', position: 'relative', overflow: 'hidden' }}>
              <SlideImage query={c.imageQuery} accent={accentColor} />
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(to right,${bgColor}80 0%,transparent 40%)`,
              }} />
            </div>
          )}
        </div>
      </Shell>
    )
  }

  // ── QUOTE ────────────────────────────────────────────────────────────
  if (layout === 'quote') {
    return (
      <Shell bg={`linear-gradient(135deg,${bgColor} 0%,${accentColor}0A 100%)`}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <SlideDecorations accent={accentColor} variant="center" />
        </div>
        <LabelPill />
        <div style={{
          position: 'absolute', top: '10%', left: '8%',
          fontSize: 'clamp(60px,12vw,120px)', color: accentColor, opacity: 0.07,
          fontFamily: "'Playfair Display',serif", lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none',
        }}>"</div>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '12% 14%', textAlign: 'center', zIndex: 1,
        }}>
          {c.heading && (
            <EditField
              value={c.heading}
              onChange={ch('heading')}
              placeholder="Section title"
              style={{
                fontSize: 'clamp(9px,1.2vw,12px)', color: accentColor,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                fontFamily: "'DM Mono',monospace", marginBottom: '4%',
                textAlign: 'center',
              }}
            />
          )}
          <EditField
            value={c.quote ?? c.body}
            onChange={ch('quote')}
            placeholder="Quote text…"
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(11px,1.8vw,17px)',
              color: textColor, lineHeight: 1.6, fontStyle: 'italic',
              textAlign: 'center',
            }}
          />
          {c.attribution !== undefined && (
            <EditField
              value={c.attribution}
              onChange={ch('attribution')}
              placeholder="— Attribution"
              style={{
                marginTop: '5%', fontSize: 'clamp(8px,1vw,10px)',
                color: accentColor, letterSpacing: '0.1em', textAlign: 'center',
              }}
            />
          )}
        </div>
      </Shell>
    )
  }

  // ── GRID ─────────────────────────────────────────────────────────────
  if (layout === 'grid') {
    return (
      <Shell>
        <div style={{ position: 'absolute', inset: 0 }}>
          <SlideDecorations accent={accentColor} variant="side" />
        </div>
        <LabelPill />
        <div style={{
          position: 'absolute', inset: 0,
          padding: '8% 6%', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <EditField
            value={c.heading}
            onChange={ch('heading')}
            placeholder="Heading"
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(12px,2vw,18px)',
              color: textColor, marginBottom: '4%',
            }}
          />
          {c.cards && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(c.cards.length, 3)},1fr)`,
              gap: '3%', flex: 1, minHeight: 0,
            }}>
              {c.cards.map((card, j) => (
                <div key={j} style={{
                  background: surfaceColor, border: `1px solid ${accentColor}25`,
                  borderRadius: 3, padding: '5% 6%',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                  <div style={{
                    fontSize: 'clamp(9px,1.3vw,12px)',
                    color: textColor, marginBottom: '8%', fontWeight: 500,
                  }}>{card.title}</div>
                  <div style={{
                    fontSize: 'clamp(7px,1vw,10px)',
                    color: mutedColor, lineHeight: 1.6, flex: 1,
                    overflow: 'hidden',
                  }}>{card.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Shell>
    )
  }

  // ── FALLBACK (content / split-left default) ───────────────────────────
  return (
    <Shell>
      <div style={{ position: 'absolute', inset: 0 }}>
        <SlideDecorations accent={accentColor} variant="corner" />
      </div>
      <LabelPill />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'row',
      }}>
        <div style={{
          flex: c.imageQuery ? '0 0 55%' : '1',
          padding: '8% 6%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <EditField
            value={c.heading}
            onChange={ch('heading')}
            placeholder="Heading"
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(12px,2.2vw,20px)',
              color: textColor, lineHeight: 1.3, marginBottom: '4%',
            }}
          />
          {c.subheading !== undefined && (
            <EditField
              value={c.subheading}
              onChange={ch('subheading')}
              placeholder="Subheading…"
              style={{
                fontSize: 'clamp(8px,1.1vw,11px)',
                color: accentColor, marginBottom: '3%', fontStyle: 'italic',
              }}
            />
          )}
          {c.body !== undefined && (
            <EditField
              value={c.body}
              onChange={ch('body')}
              placeholder="Body text…"
              style={{
                fontSize: 'clamp(8px,1.1vw,11px)',
                color: mutedColor, lineHeight: 1.7,
              }}
            />
          )}
        </div>
        {c.imageQuery && (
          <div style={{ flex: '0 0 45%', position: 'relative', overflow: 'hidden' }}>
            <SlideImage query={c.imageQuery} accent={accentColor} />
          </div>
        )}
      </div>
    </Shell>
  )
}

// ─── Filmstrip thumbnail ────────────────────────────────────────────────────

function FilmThumb({ slide, index, isActive, isDragging, accent, themeBg, themeText, onClick, onDragStart, onDragOver, onDrop, onDragEnd }: {
  slide: Slide; index: number; isActive: boolean; isDragging: boolean; accent: string
  themeBg?: string; themeText?: string
  onClick: () => void
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
}) {
  const c = slide.content
  const layout = c.layoutType ?? c.type ?? 'content'
  const heading = c.heading ?? ''
  const bg = themeBg ?? '#111'
  const textCol = themeText ?? '#F8F4EE'

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        cursor: isDragging ? 'grabbing' : 'pointer',
        opacity: isDragging ? 0.4 : 1,
        border: `1px solid ${isActive ? accent + '80' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 3, overflow: 'hidden',
        outline: isActive ? `1px solid ${accent}50` : 'none',
        outlineOffset: 1,
        transition: 'border-color 0.15s, opacity 0.15s',
        flexShrink: 0,
      }}
    >
      {/* Mini 16:9 preview */}
      <div style={{
        position: 'relative', width: '100%', paddingTop: '56.25%',
        background: bg, overflow: 'hidden',
      }}>
        {isActive && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
            background: accent, zIndex: 2,
          }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '8%',
        }}>
          <div style={{
            fontSize: 5, color: accent, fontFamily: "'DM Mono',monospace",
            letterSpacing: '0.1em', marginBottom: 2, opacity: 0.7,
            textTransform: 'uppercase',
          }}>
            {String(index + 1).padStart(2, '0')} {layout}
          </div>
          <div style={{
            fontSize: 5.5, color: textCol, lineHeight: 1.3,
            fontFamily: "'Playfair Display',serif",
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
          }}>
            {heading}
          </div>
        </div>
        {/* Drag handle overlay */}
        <div style={{
          position: 'absolute', bottom: 2, right: 3,
          fontSize: 7, color: '#444', userSelect: 'none', pointerEvents: 'none',
        }}>⠿</div>
      </div>
      {/* Number label */}
      <div style={{
        background: isActive ? accent + '18' : 'transparent',
        padding: '2px 4px',
        fontSize: 6.5, color: isActive ? accent : '#555',
        fontFamily: "'DM Mono',monospace",
        letterSpacing: '0.1em', textAlign: 'center',
        transition: 'background 0.15s',
      }}>
        {String(index + 1).padStart(2, '0')}
      </div>
    </div>
  )
}

// ─── Shared small buttons ──────────────────────────────────────────────────

function MiniBtn({ onClick, danger, children }: {
  onClick: () => void; danger?: boolean; children: React.ReactNode
}) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent',
      border: `1px solid ${danger ? '#8b2020' : 'rgba(255,255,255,0.1)'}`,
      color: danger ? '#c0392b' : 'rgba(255,255,255,0.35)',
      borderRadius: 3, padding: '3px 12px',
      fontSize: 10, cursor: 'pointer', letterSpacing: '0.06em',
    }}>{children}</button>
  )
}

function ToolbarBtn({ onClick, accent, active, children }: {
  onClick: () => void; accent: string; active?: boolean; children: React.ReactNode
}) {
  return (
    <button onClick={onClick} style={{
      background: active ? `${accent}20` : 'transparent',
      border: `1px solid ${accent}50`,
      color: accent, borderRadius: 4,
      padding: '5px 14px', fontSize: 11,
      cursor: 'pointer', letterSpacing: '0.08em',
      whiteSpace: 'nowrap', transition: 'background 0.15s',
    }}>{children}</button>
  )
}

// ─── Main SlideEditor ──────────────────────────────────────────────────────

export default function SlideEditor({
  existingPresentationId,
  presentationHook,
  presentationSlides = [],
  accentColor = '#C9A84C',
  generationId,
}: SlideEditorProps) {
  const [presentationId, setPresentationId] = useState<string | null>(existingPresentationId ?? null)
  const [slug, setSlug] = useState<string | null>(null)
  const [title, setTitle] = useState('My Presentation')
  const [slides, setSlides] = useState<Slide[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [initialising, setInitialising] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [copied, setCopied] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [presentMode, setPresentMode] = useState(false)
  const [presentIdx, setPresentIdx] = useState(0)
  const [selectedTheme, setSelectedTheme] = useState('noir')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdates = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const ops = useSlideOperations()
  const { update: updateMeta } = useUpdatePresentation()

  // ── Load / create ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setInitialising(true)
      try {
        let pid = existingPresentationId ?? null
        if (!pid && generationId) pid = sessionStorage.getItem(storageKey(generationId))

        if (pid) {
          const res = await fetch(`/api/presentation/${pid}`)
          if (res.ok) {
            const data = await res.json()
            if (!cancelled) {
              setPresentationId(data.presentation.id)
              setSlug(data.presentation.slug)
              setTitle(data.presentation.title)
              setSlides(data.presentation.slides)
              setActiveId(data.presentation.slides[0]?.id ?? null)
            }
            return
          }
          sessionStorage.removeItem(storageKey(generationId))
        }

        const res = await fetch('/api/presentation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'My Presentation', accentColor, generationId, presentationHook,
            presentationSlides: presentationSlides.map(s => ({
              layoutType: s.layoutType ?? 'split-left',
              heading: s.heading ?? s.title ?? '',
              title: s.title ?? s.heading ?? '',
              subheading: s.subheading, body: s.body,
              imageQuery: s.imageQuery ?? '', bullets: s.bullets,
              stats: s.stats, quote: s.quote,
              attribution: s.attribution, cards: s.cards,
            })),
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (generationId) sessionStorage.setItem(storageKey(generationId), data.presentation.id)
        if (!cancelled) {
          setPresentationId(data.presentation.id)
          setSlug(data.presentation.slug)
          setTitle(data.presentation.title)
          setSlides(data.presentation.slides)
          setActiveId(data.presentation.slides[0]?.id ?? null)
        }
      } catch (e) {
        const msg = (e as Error).message ?? ''
        if (msg.includes('401') || msg.includes('403')) {
          setInitError('You must be signed in to edit presentations.')
        } else {
          setInitError('Failed to load slide editor. Please refresh.')
        }
      } finally {
        if (!cancelled) setInitialising(false)
      }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPresentationId])

  // ── Title save ───────────────────────────────────────────────────────
  const handleTitleChange = useCallback((val: string) => {
    setTitle(val)
    if (!presentationId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(async () => {
      const ok = await updateMeta(presentationId, { title: val })
      setSaveStatus(ok ? 'saved' : 'error')
    }, 800)
  }, [presentationId, updateMeta])

  // ── Content save ─────────────────────────────────────────────────────
  const handleContentChange = useCallback((slideId: string, field: keyof SlideContent, value: string) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, content: { ...s.content, [field]: value } } : s))
    const existing = pendingUpdates.current.get(slideId)
    if (existing) clearTimeout(existing)
    setSaveStatus('saving')
    const t = setTimeout(() => {
      setSlides(prev => {
        const slide = prev.find(s => s.id === slideId)
        if (slide) ops.updateSlide(slideId, slide.content).then(ok => {
          setSaveStatus(ok !== null ? 'saved' : 'error')
        })
        return prev
      })
      pendingUpdates.current.delete(slideId)
    }, 800)
    pendingUpdates.current.set(slideId, t)
  }, [ops])

  // ── Add slide ────────────────────────────────────────────────────────
  const handleAdd = useCallback(async (afterOrder: number) => {
    if (!presentationId) return
    const newSlide = await ops.addSlide(presentationId, afterOrder)
    if (newSlide) {
      setSlides(prev => {
        const shifted = prev.map(s => s.order >= newSlide.order && s.id !== newSlide.id ? { ...s, order: s.order + 1 } : s)
        return [...shifted, newSlide].sort((a, b) => a.order - b.order)
      })
      setActiveId(newSlide.id)
    }
  }, [presentationId, ops])

  // ── Delete slide ─────────────────────────────────────────────────────
  const handleDelete = useCallback(async (slideId: string) => {
    if (slides.length <= 1) return
    const ok = await ops.deleteSlide(slideId)
    if (ok) {
      setSlides(prev => {
        const filtered = prev.filter(s => s.id !== slideId).map((s, i) => ({ ...s, order: i }))
        return filtered
      })
      setActiveId(prev => prev === slideId ? (slides.find(s => s.id !== slideId)?.id ?? null) : prev)
    }
  }, [slides, ops])

  // ── Duplicate slide ──────────────────────────────────────────────────
  const handleDuplicate = useCallback(async (slideId: string) => {
    const dup = await ops.duplicateSlide(slideId)
    if (dup) {
      setSlides(prev => {
        const shifted = prev.map(s => s.order >= dup.order && s.id !== dup.id ? { ...s, order: s.order + 1 } : s)
        return [...shifted, dup].sort((a, b) => a.order - b.order)
      })
      setActiveId(dup.id)
    }
  }, [ops])

  // ── Drag-to-reorder (filmstrip) ──────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    setDraggingId(id)
  }, [])
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'
  }, [])
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId || !presentationId) return
    setSlides(prev => {
      const arr = [...prev].sort((a, b) => a.order - b.order)
      const from = arr.findIndex(s => s.id === sourceId)
      const to = arr.findIndex(s => s.id === targetId)
      if (from === -1 || to === -1) return prev
      const [moved] = arr.splice(from, 1)
      arr.splice(to, 0, moved)
      const reindexed = arr.map((s, i) => ({ ...s, order: i }))
      ops.reorderSlides(presentationId, reindexed.map(s => s.id))
      return reindexed
    })
  }, [presentationId, ops])
  const handleDragEnd = useCallback(() => setDraggingId(null), [])

  // ── Export / share ───────────────────────────────────────────────────
 const handleExport = useCallback(async () => {
    if (!presentationId) return
    try {
      const res = await fetch(`/api/presentation/export/pptx?id=${presentationId}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Export failed (${res.status})` }))
        alert(err.error || 'Export failed')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `presentation.pptx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } catch {
      alert('Export failed. Please try again.')
    }
  }, [presentationId])
  // ── Fullscreen presentation mode ────────────────────────────────────
  const enterPresent = useCallback(async (startIdx = 0) => {
    setPresentIdx(startIdx)
    setPresentMode(true)
    try { await document.documentElement.requestFullscreen() } catch {}
  }, [])

  const exitPresent = useCallback(async () => {
    setPresentMode(false)
    try { if (document.fullscreenElement) await document.exitFullscreen() } catch {}
  }, [])

  useEffect(() => {
    if (!presentMode) return
    function onKey(e: KeyboardEvent) {
      const sorted2 = [...slides].sort((a, b) => a.order - b.order)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        setPresentIdx(i => Math.min(i + 1, sorted2.length - 1))
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setPresentIdx(i => Math.max(i - 1, 0))
      }
      if (e.key === 'Escape') exitPresent()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [presentMode, slides, exitPresent])

  useEffect(() => {
    function onFsChange() { if (!document.fullscreenElement) setPresentMode(false) }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const handleShare = useCallback(() => {
    if (!slug) return
    navigator.clipboard.writeText(buildShareUrl(slug)).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    })
  }, [slug])

  // ─────────────────────────────────────────────────────────────────────

  if (initError) return (
    <div style={{ padding: 40, textAlign: 'center', background: '#0A0A0A', borderRadius: 6, border: '1px solid rgba(192,57,43,0.3)', margin: 24 }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>⚠️</div>
      <div style={{ fontSize: 13, color: '#E57373', lineHeight: 1.6 }}>{initError}</div>
    </div>
  )

  if (initialising) return (
    <div style={{ padding: 40, textAlign: 'center', background: '#0A0A0A' }}>
      <div style={{
        display: 'inline-block', width: 20, height: 20,
        border: `2px solid ${accentColor}30`, borderTop: `2px solid ${accentColor}`,
        borderRadius: '50%', animation: 'se_spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes se_spin{to{transform:rotate(360deg)}} @keyframes se_pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      <div style={{ marginTop: 12, fontSize: 11, color: '#A09890', letterSpacing: '0.1em' }}>Loading editor…</div>
    </div>
  )

  const sorted = [...slides].sort((a, b) => a.order - b.order)
  const activeSlide = sorted.find(s => s.id === activeId) ?? sorted[0] ?? null
  const activeIdx = activeSlide ? sorted.findIndex(s => s.id === activeSlide.id) : 0
  const activeTheme = PRES_THEMES.find(t => t.key === selectedTheme) ?? PRES_THEMES[0]

  // ── FULLSCREEN PRESENTATION OVERLAY ─────────────────────────────────────
  if (presentMode) {
    const presSlide = sorted[presentIdx]
    const presContent = presSlide?.content as {
  heading?: string; subheading?: string; body?: string;
  layoutType?: string; type?: string; quote?: string;
  attribution?: string; imageQuery?: string;
  bullets?: string[];
  stats?: Array<{ value: string; label: string }>;
  cards?: Array<{ title: string; body: string }>;
} | undefined
    const presAccent = accentColor
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#09090A', zIndex: 9999,
        display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans',sans-serif",
      }}>
        {/* Slide stage */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {presSlide && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '5% 8%', position: 'relative' }}>
              {/* Accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${presAccent}, ${presAccent}60, transparent)` }} />
              {/* Slide number */}
              <div style={{ fontSize: 10, color: `${presAccent}60`, fontFamily: "'DM Mono',monospace", letterSpacing: '0.18em', marginBottom: 20, textTransform: 'uppercase' }}>
                {String(presentIdx + 1).padStart(2,'0')} / {String(sorted.length).padStart(2,'0')} · {String(presContent?.layoutType ?? presContent?.type ?? 'content').toUpperCase()}
              </div>
              {/* Heading */}
              {presContent?.heading && (
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,4.5vw,62px)', fontWeight: 400, color: '#F8F4EE', lineHeight: 1.15, marginBottom: 20, maxWidth: '80%' }}>
                  {String(presContent.heading)}
                </div>
              )}
              {/* Body */}
              {(presContent?.body || presContent?.subheading) && (
                <div style={{ fontSize: 'clamp(14px,1.6vw,22px)', color: '#A09890', lineHeight: 1.7, maxWidth: '65%', marginBottom: 20 }}>
                  {String(presContent.body ?? presContent.subheading)}
                </div>
              )}
              {/* Bullets */}
              {Array.isArray(presContent?.bullets) && presContent.bullets.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  {(presContent.bullets as string[]).map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: presAccent, marginTop: 8, flexShrink: 0 }} />
                      <span style={{ fontSize: 'clamp(13px,1.5vw,20px)', color: '#C8BFB5', lineHeight: 1.6 }}>{b}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Stats */}
              {Array.isArray(presContent?.stats) && presContent.stats.length > 0 && (
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20 }}>
                  {(presContent.stats as Array<{value:string;label:string}>).map((st, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${presAccent}25`, borderRadius: 12, padding: '18px 28px', textAlign: 'center' }}>
                      <div style={{ fontSize: 'clamp(28px,4vw,52px)', color: presAccent, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>{st.value}</div>
                      <div style={{ fontSize: 11, color: '#A09890', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace" }}>{st.label}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Quote */}
              {presContent?.quote && (
                <div style={{ borderLeft: `4px solid ${presAccent}`, paddingLeft: 28, maxWidth: '68%', marginBottom: 20 }}>
                  <div style={{ fontStyle: 'italic', fontSize: 'clamp(16px,2.2vw,30px)', color: '#F8F4EE', lineHeight: 1.6, marginBottom: 10 }}>&ldquo;{String(presContent.quote)}&rdquo;</div>
                  {presContent.attribution && <div style={{ fontSize: 13, color: presAccent, fontFamily: "'DM Mono',monospace" }}>— {String(presContent.attribution)}</div>}
                </div>
              )}
              {/* Cards */}
              {Array.isArray(presContent?.cards) && presContent.cards.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min((presContent.cards as unknown[]).length, 3)}, 1fr)`, gap: 14, maxWidth: '88%' }}>
                  {(presContent.cards as Array<{title:string;body:string}>).map((cd, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${presAccent}20`, borderRadius: 10, padding: '18px 20px', borderTop: `2px solid ${presAccent}40` }}>
                      <div style={{ fontSize: 'clamp(13px,1.2vw,16px)', color: '#F8F4EE', marginBottom: 7, fontFamily: "'Playfair Display',serif" }}>{cd.title}</div>
                      <div style={{ fontSize: 'clamp(11px,1vw,14px)', color: '#A09890', lineHeight: 1.6 }}>{cd.body}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Change image button */}
              {presContent?.imageQuery && (
                <div style={{ position: 'absolute', top: 20, right: 20 }}>
                  <div style={{ fontSize: 10, color: `${presAccent}50`, fontFamily: "'DM Mono',monospace", background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 6, border: `1px solid ${presAccent}20` }}>
                    📷 {String(presContent.imageQuery)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prev/Next click zones */}
          <div onClick={() => setPresentIdx(i => Math.max(i-1,0))} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '10%', cursor: presentIdx > 0 ? 'w-resize' : 'default', zIndex: 5 }} />
          <div onClick={() => setPresentIdx(i => Math.min(i+1, sorted.length-1))} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '10%', cursor: presentIdx < sorted.length-1 ? 'e-resize' : 'default', zIndex: 5 }} />

          {/* Arrow nav buttons */}
          {presentIdx > 0 && (
            <button onClick={() => setPresentIdx(i => i-1)} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.65)', border: `1px solid ${presAccent}40`, color: presAccent, width: 46, height: 46, borderRadius: '50%', fontSize: 22, cursor: 'pointer', zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>‹</button>
          )}
          {presentIdx < sorted.length - 1 && (
            <button onClick={() => setPresentIdx(i => i+1)} style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.65)', border: `1px solid ${presAccent}40`, color: presAccent, width: 46, height: 46, borderRadius: '50%', fontSize: 22, cursor: 'pointer', zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>›</button>
          )}
        </div>

        {/* Presenter bar */}
        <div style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Thumbnail strip */}
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
            {sorted.map((sl, i) => (
              <button key={sl.id} onClick={() => setPresentIdx(i)} style={{ flexShrink: 0, width: 52, height: 32, background: i === presentIdx ? `${presAccent}20` : 'rgba(255,255,255,0.04)', border: `1px solid ${i === presentIdx ? presAccent : 'rgba(255,255,255,0.07)'}`, borderRadius: 4, cursor: 'pointer', fontSize: 9, color: i === presentIdx ? presAccent : '#444', fontFamily: "'DM Mono',monospace" }}>
                {String(i+1).padStart(2,'0')}
              </button>
            ))}
          </div>
          {/* Hint + exit */}
          <span style={{ fontSize: 9, color: '#333', fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>← → to navigate · ESC to exit</span>
          <button onClick={exitPresent} style={{ background: 'transparent', border: `1px solid ${presAccent}40`, color: presAccent, padding: '6px 16px', fontSize: 10, cursor: 'pointer', borderRadius: 6, letterSpacing: '0.08em', fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>✕ Exit</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      fontFamily: "'DM Sans',sans-serif",
      background: '#09090A',
      display: 'flex', flexDirection: 'column',
      height: '100%', minHeight: 0,
    }}>
      <style>{`
        @keyframes se_spin{to{transform:rotate(360deg)}}
        @keyframes se_pulse{0%,100%{opacity:0.4}50%{opacity:1}}
        @media(max-width:640px){
          .se-body{flex-direction:column !important}
          .se-film{flex-direction:row !important;width:100% !important;min-width:unset !important;max-width:unset !important;overflow-x:auto !important;overflow-y:hidden !important;padding:8px !important;gap:8px !important;border-right:none !important;border-bottom:1px solid rgba(255,255,255,0.06) !important}
          .se-film-thumb{width:90px !important;flex-shrink:0 !important}
          .se-stage{padding:12px !important}
        }
      `}</style>

      {/* ── Top toolbar ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0f0f0f', flexWrap: 'wrap',
      }}>
        {/* Editable title */}
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={e => handleTitleChange(e.currentTarget.textContent ?? '')}
          style={{
            flex: 1, minWidth: 100, fontSize: 13, fontWeight: 600,
            color: '#F8F4EE', outline: 'none', cursor: 'text',
            borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 2,
          }}
        >
          {title}
        </div>

        <span style={{
          fontSize: 9, letterSpacing: '0.12em', fontFamily: "'DM Mono',monospace",
          color: saveStatus === 'saved' ? accentColor : saveStatus === 'error' ? '#c0392b' : '#A09890',
        }}>
          {saveStatus === 'saved' ? '✓ SAVED' : saveStatus === 'error' ? '✗ ERROR' : '● SAVING'}
        </span>

        {/* Theme picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 8, color: '#444', letterSpacing: '0.12em', fontFamily: "'DM Mono',monospace", textTransform: 'uppercase' }}>Theme</span>
          {PRES_THEMES.map(t => (
            <button
              key={t.key}
              title={t.label}
              onClick={() => setSelectedTheme(t.key)}
              style={{
                width: 18, height: 18, borderRadius: 3, cursor: 'pointer',
                background: t.bg, border: selectedTheme === t.key ? `2px solid ${t.accent}` : '2px solid transparent',
                boxShadow: selectedTheme === t.key ? `0 0 5px ${t.accent}60` : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent, opacity: 0.9 }} />
            </button>
          ))}
          <span style={{ fontSize: 9, color: '#555', fontFamily: "'DM Mono',monospace" }}>
            {PRES_THEMES.find(t => t.key === selectedTheme)?.label}
          </span>
        </div>

        <ToolbarBtn accent={accentColor} onClick={handleExport}>↓ PPTX</ToolbarBtn>
        <ToolbarBtn accent={accentColor} onClick={handleShare} active={copied}>
          {copied ? '✓ Copied!' : '⇗ Share'}
        </ToolbarBtn>
        <ToolbarBtn accent={accentColor} onClick={() => enterPresent(activeIdx ? sorted.findIndex(s => s.id === activeId) : 0)}>
          ⊞ Present
        </ToolbarBtn>
      </div>

      {/* ── Body: filmstrip + stage ──────────────────────────────────── */}
      <div className="se-body" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Filmstrip */}
        <div className="se-film" style={{
          width: 120, minWidth: 120, maxWidth: 120,
          overflowY: 'auto', overflowX: 'hidden',
          background: '#0f0f0f',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 7px',
          display: 'flex', flexDirection: 'column', gap: 5,
        }}>
          {sorted.map((slide, idx) => (
            <div key={slide.id} className="se-film-thumb">
              <FilmThumb
                slide={slide}
                index={idx}
                isActive={slide.id === activeId}
                isDragging={draggingId === slide.id}
                accent={activeTheme.accent}
                themeBg={activeTheme.bg}
                themeText={activeTheme.text}
                onClick={() => setActiveId(slide.id)}
                onDragStart={e => handleDragStart(e, slide.id)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, slide.id)}
                onDragEnd={handleDragEnd}
              />
            </div>
          ))}

          {/* Add slide button in filmstrip */}
          <button
            onClick={() => {
              const last = sorted[sorted.length - 1]
              handleAdd(last ? last.order : -1)
            }}
            style={{
              marginTop: 4, padding: '5px 0',
              background: 'transparent',
              border: `1px dashed ${activeTheme.accent}30`,
              borderRadius: 3, cursor: 'pointer',
              color: activeTheme.accent, fontSize: 9,
              letterSpacing: '0.1em', width: '100%',
            }}
          >
            + ADD
          </button>
        </div>

        {/* Main stage */}
        <div className="se-stage" style={{
          flex: 1, overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: 12,
          minWidth: 0,
          background: activeTheme.key === 'minimal' ? '#E8E4DF' : '#0c0c0d',
        }}>
          {/* Slide counter + prev/next */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, color: '#555', fontFamily: "'DM Mono',monospace", letterSpacing: '0.14em' }}>
              SLIDE {String(activeIdx + 1).padStart(2, '0')} / {String(sorted.length).padStart(2, '0')}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => { const prev = sorted[activeIdx - 1]; if (prev) setActiveId(prev.id) }}
                disabled={activeIdx === 0}
                style={{
                  background: 'transparent', border: `1px solid ${accentColor}40`,
                  color: activeIdx === 0 ? '#333' : accentColor, borderRadius: 2,
                  width: 22, height: 22, fontSize: 13, cursor: activeIdx === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >‹</button>
              <button
                onClick={() => { const next = sorted[activeIdx + 1]; if (next) setActiveId(next.id) }}
                disabled={activeIdx === sorted.length - 1}
                style={{
                  background: 'transparent', border: `1px solid ${accentColor}40`,
                  color: activeIdx === sorted.length - 1 ? '#333' : accentColor, borderRadius: 2,
                  width: 22, height: 22, fontSize: 13, cursor: activeIdx === sorted.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >›</button>
            </div>
          </div>

          {/* Active slide — full 16:9 render */}
          {activeSlide && (
            <LiveSlide
              key={activeSlide.id + selectedTheme}
              slide={activeSlide}
              accent={activeTheme.accent}
              theme={activeTheme}
              onContentChange={handleContentChange}
            />
          )}

          {/* Slide actions */}
          {activeSlide && (
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)',
              flexWrap: 'wrap',
            }}>
              <MiniBtn onClick={() => handleDuplicate(activeSlide.id)}>⧉ Duplicate</MiniBtn>
              <MiniBtn onClick={() => handleDelete(activeSlide.id)} danger>✕ Delete</MiniBtn>
              <span style={{ flex: 1 }} />
              <button
                onClick={() => handleAdd(activeSlide.order)}
                style={{
                  background: 'transparent',
                  border: `1px dashed ${accentColor}40`,
                  color: accentColor, borderRadius: 3,
                  padding: '3px 14px', fontSize: 10,
                  cursor: 'pointer', letterSpacing: '0.1em',
                }}
              >+ Add Slide After</button>
            </div>
          )}

          <div style={{
            textAlign: 'center', fontSize: 8, color: '#2a2a2a',
            letterSpacing: '0.14em', fontFamily: "'DM Mono',monospace",
          }}>
            DRAG THUMBNAILS TO REORDER · CLICK FIELD TO EDIT
          </div>
        </div>
      </div>
    </div>
  )
}
