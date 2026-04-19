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

// ─── LiveSlide ─────────────────────────────────────────────────────────────
// Renders a real 16:9 slide with inline-editable fields

function LiveSlide({ slide, accent, onContentChange }: {
  slide: Slide
  accent: string
  onContentChange: (id: string, field: keyof SlideContent, value: string) => void
}) {
  const c = slide.content
  const layout = c.layoutType ?? c.type ?? 'content'
  const ch = (field: keyof SlideContent) => (v: string) => onContentChange(slide.id, field, v)

  // Label pill (non-interactive)
  const LabelPill = ({ pos }: { pos?: React.CSSProperties }) => (
    <div style={{
      position: 'absolute', top: 10, left: 10, zIndex: 3,
      display: 'flex', alignItems: 'center', gap: 5,
      pointerEvents: 'none', userSelect: 'none',
      ...pos,
    }}>
      <span style={{
        fontSize: 8, letterSpacing: '0.14em', color: accent,
        fontFamily: "'DM Mono',monospace", opacity: 0.7,
      }}>{layout.toUpperCase()}</span>
    </div>
  )

  // Outer 16:9 wrapper
  const Shell = ({ children, bg }: { children: React.ReactNode; bg?: string }) => (
    <div style={{
      position: 'relative', width: '100%', paddingTop: '56.25%',
      background: bg ?? '#0A0A0A', borderRadius: 4, overflow: 'hidden',
      border: `1px solid ${accent}20`,
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
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg,transparent,${accent},transparent)`,
        }} />
        <LabelPill />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '10% 12%', textAlign: 'center',
        }}>
          <EditField
            value={c.heading}
            onChange={ch('heading')}
            placeholder="Slide heading"
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(14px,3vw,28px)',
              color: '#F8F4EE', lineHeight: 1.3,
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
                color: '#C9B99A', fontStyle: 'italic',
                textAlign: 'center',
              }}
            />
          )}
          <div style={{
            position: 'absolute', bottom: '8%',
            width: 24, height: 2, background: accent, borderRadius: 1,
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
        {c.imageQuery && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <SlideImage query={c.imageQuery} accent={accent} />
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
              color: '#F8F4EE', lineHeight: 1.25,
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
                color: accent, letterSpacing: '0.06em',
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
            overflow: 'hidden',
          }}>
            <EditField
              value={c.heading}
              onChange={ch('heading')}
              placeholder="Heading"
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 'clamp(12px,2.2vw,20px)',
                color: '#F8F4EE', lineHeight: 1.3, marginBottom: '4%',
              }}
            />
            {c.subheading !== undefined && (
              <EditField
                value={c.subheading}
                onChange={ch('subheading')}
                placeholder="Subheading…"
                style={{
                  fontSize: 'clamp(8px,1.1vw,11px)',
                  color: accent, marginBottom: '3%', fontStyle: 'italic',
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
                  color: '#A09890', lineHeight: 1.7,
                }}
              />
            )}
          </div>
          {/* Image column */}
          <div style={{ flex: '0 0 45%', position: 'relative', overflow: 'hidden' }}>
            {c.imageQuery
              ? <SlideImage query={c.imageQuery} accent={accent} />
              : <div style={{ width: '100%', height: '100%', background: '#111' }} />
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
        <LabelPill />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '8% 10%',
        }}>
          <EditField
            value={c.heading}
            onChange={ch('heading')}
            placeholder="Heading"
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(12px,2vw,18px)',
              color: '#F8F4EE', marginBottom: '6%', textAlign: 'center',
            }}
          />
          {c.stats && c.stats.length > 0 && (
            <div style={{ display: 'flex', gap: '4%', width: '100%', justifyContent: 'center' }}>
              {c.stats.map((stat, j) => (
                <div key={j} style={{
                  flex: 1, background: '#111',
                  border: `1px solid ${accent}40`, borderRadius: 4,
                  padding: '4% 2%', textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 'clamp(18px,3.5vw,36px)',
                    color: accent, fontFamily: "'DM Mono',monospace", lineHeight: 1,
                  }}>{stat.value}</div>
                  <div style={{
                    fontSize: 'clamp(7px,0.9vw,10px)',
                    color: '#A09890', letterSpacing: '0.08em',
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
                color: '#F8F4EE', marginBottom: '5%',
              }}
            />
            {c.bullets && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3%' }}>
                {c.bullets.map((b, j) => (
                  <div key={j} style={{ display: 'flex', gap: '2%', alignItems: 'flex-start' }}>
                    <span style={{ color: accent, flexShrink: 0, fontSize: 'clamp(8px,1.2vw,12px)', marginTop: '0.1em' }}>›</span>
                    <span style={{ fontSize: 'clamp(8px,1.1vw,11px)', color: '#A09890', lineHeight: 1.6 }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {c.imageQuery && (
            <div style={{ flex: '0 0 42%', position: 'relative', overflow: 'hidden' }}>
              <SlideImage query={c.imageQuery} accent={accent} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to right,rgba(10,10,10,0.5) 0%,transparent 40%)',
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
      <Shell bg={`linear-gradient(135deg,#0A0A0A 0%,${accent}0A 100%)`}>
        <LabelPill />
        <div style={{
          position: 'absolute', top: '10%', left: '8%',
          fontSize: 'clamp(60px,12vw,120px)', color: accent, opacity: 0.07,
          fontFamily: "'Playfair Display',serif", lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none',
        }}>"</div>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '12% 14%', textAlign: 'center',
        }}>
          {c.heading && (
            <EditField
              value={c.heading}
              onChange={ch('heading')}
              placeholder="Section title"
              style={{
                fontSize: 'clamp(9px,1.2vw,12px)', color: accent,
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
              color: '#F8F4EE', lineHeight: 1.6, fontStyle: 'italic',
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
                color: accent, letterSpacing: '0.1em', textAlign: 'center',
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
              color: '#F8F4EE', marginBottom: '4%',
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
                  background: '#111', border: `1px solid ${accent}25`,
                  borderRadius: 3, padding: '5% 6%',
                  display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                  <div style={{
                    fontSize: 'clamp(9px,1.3vw,12px)',
                    color: '#F8F4EE', marginBottom: '8%', fontWeight: 500,
                  }}>{card.title}</div>
                  <div style={{
                    fontSize: 'clamp(7px,1vw,10px)',
                    color: '#A09890', lineHeight: 1.6, flex: 1,
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
              color: '#F8F4EE', lineHeight: 1.3, marginBottom: '4%',
            }}
          />
          {c.subheading !== undefined && (
            <EditField
              value={c.subheading}
              onChange={ch('subheading')}
              placeholder="Subheading…"
              style={{
                fontSize: 'clamp(8px,1.1vw,11px)',
                color: accent, marginBottom: '3%', fontStyle: 'italic',
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
                color: '#A09890', lineHeight: 1.7,
              }}
            />
          )}
        </div>
        {c.imageQuery && (
          <div style={{ flex: '0 0 45%', position: 'relative', overflow: 'hidden' }}>
            <SlideImage query={c.imageQuery} accent={accent} />
          </div>
        )}
      </div>
    </Shell>
  )
}

// ─── Filmstrip thumbnail ────────────────────────────────────────────────────

function FilmThumb({ slide, index, isActive, isDragging, accent, onClick, onDragStart, onDragOver, onDrop, onDragEnd }: {
  slide: Slide; index: number; isActive: boolean; isDragging: boolean; accent: string
  onClick: () => void
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
}) {
  const c = slide.content
  const layout = c.layoutType ?? c.type ?? 'content'
  const heading = c.heading ?? ''

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
        background: '#111', overflow: 'hidden',
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
            fontSize: 5.5, color: '#F8F4EE', lineHeight: 1.3,
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
  const handleExport = useCallback(() => {
    if (presentationId) window.open(`/api/presentation/export/pptx?id=${presentationId}`, '_blank')
  }, [presentationId])
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

        <ToolbarBtn accent={accentColor} onClick={handleExport}>↓ PPTX</ToolbarBtn>
        <ToolbarBtn accent={accentColor} onClick={handleShare} active={copied}>
          {copied ? '✓ Copied!' : '⇗ Share'}
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
                accent={accentColor}
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
              border: `1px dashed ${accentColor}30`,
              borderRadius: 3, cursor: 'pointer',
              color: accentColor, fontSize: 9,
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
              key={activeSlide.id}
              slide={activeSlide}
              accent={accentColor}
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
