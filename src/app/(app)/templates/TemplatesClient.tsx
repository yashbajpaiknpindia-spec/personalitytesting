'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import type { TemplateItem } from './page'

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: TEMPLATE_THUMBNAILS and WEBSITE_TEMPLATE_LIBRARY are intentionally NOT
// imported here. All merging happens server-side in page.tsx so this client
// bundle stays lean (~4KB instead of ~900KB).
// ─────────────────────────────────────────────────────────────────────────────

const SLIDER_INITIAL = 42  // matches homepage preview count
const SLIDER_CHUNK   = 42   // cards added when user taps Load More or scrolls near end

// ── Template Card ─────────────────────────────────────────────────────────────
function TemplateCard({
  t,
  isLoggedIn,
  priority,
}: {
  t: TemplateItem
  isLoggedIn: boolean
  priority: boolean
}) {
  const [imgErr, setImgErr] = useState(false)
  const [imgSrc, setImgSrc] = useState(t.thumb || t.fallbackThumb)
  const [hovered, setHovered] = useState(false)


  useEffect(() => {
    setImgErr(false)
    setImgSrc(t.thumb || t.fallbackThumb)
  }, [t.id, t.thumb, t.fallbackThumb])

  return (
    <div
      className="tpl-card"
      style={{
        borderColor: hovered ? `${t.color}55` : 'var(--border)',
        boxShadow: hovered ? `0 12px 40px ${t.color}18, 0 2px 12px rgba(0,0,0,0.55)` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div className="tpl-thumb">
        <div className="tpl-img-wrap">
          {/* Solid colour fallback always shown under the image */}
          <div style={{ position: 'absolute', inset: 0, background: t.bg }} />

          {imgSrc && !imgErr ? (
            <img
              src={imgSrc}
              alt={t.label}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              referrerPolicy="no-referrer"
              onError={(e) => {
                if (imgSrc !== t.fallbackThumb) {
                  setImgSrc(t.fallbackThumb)
                  e.currentTarget.src = t.fallbackThumb
                } else {
                  setImgErr(true)
                }
              }}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s ease',
                transform: hovered ? 'scale(1.04)' : 'scale(1)',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at 30% 40%, ${t.color}22 0%, transparent 70%), ${t.bg}`, backgroundImage: `url(${t.fallbackThumb})`, backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 9, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: t.color, opacity: 0.6,
              }}>{t.label}</span>
            </div>
          )}

          {/* Dark gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }} />
        </div>

        <div className="tpl-color-bar" style={{ background: `linear-gradient(90deg,${t.color},${t.color}44,transparent)` }} />
        <div className="tpl-overlay-shine" />

        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 9, left: 9, zIndex: 3,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          borderRadius: 2, padding: '2.5px 8px',
          fontSize: 8, color: t.color, letterSpacing: '0.18em',
          textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
          border: `1px solid ${t.color}28`,
        }}>
          {t.category}
        </div>

        {/* Hover action buttons */}
        <div className="tpl-hover-btns">
          <a
            href={`/samples/${t.id}.html`}
            target="_blank"
            rel="noreferrer"
            className="tpl-view-btn"
            style={{ color: t.color, border: `1px solid ${t.color}55`, boxShadow: `0 8px 22px ${t.color}12` }}
          >
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            View Site
          </a>
          <a
            href={isLoggedIn ? `/generate?chip=website&sample=${t.id}` : `/login?tab=signup&template=${t.id}`}
            className="tpl-use-btn"
            style={{ background: `linear-gradient(135deg,#FFE6A3,${t.color} 55%,#9B7626)`, color: '#050505', boxShadow: `0 10px 26px ${t.color}28` }}
          >
            Use Template
          </a>
        </div>
      </div>

      {/* Info row */}
      <div className="tpl-info">
        <div className="tpl-name">{t.label}</div>
        <div className="tpl-desc">{t.description}</div>
        <div className="tpl-meta">
          <span className="tpl-cat-tag" style={{ color: t.color }}>{t.category}</span>
          <span className="tpl-tier-tag" style={{ color: 'var(--muted2)', borderColor: 'rgba(255,255,255,0.08)' }}>Free</span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TemplatesClient({
  isLoggedIn,
  templates,
}: {
  isLoggedIn: boolean
  templates: TemplateItem[]
}) {
  const [activeCat, setActiveCat]     = useState('All')
  const [rendered,  setRendered]      = useState(SLIDER_INITIAL)
  const sliderRef                     = useRef<HTMLDivElement | null>(null)

  const ALL_CATEGORIES = useMemo(
    () => ['All', ...Array.from(new Set(templates.map(t => t.category)))],
    [templates]
  )

  const filtered = useMemo(
    () => activeCat === 'All' ? templates : templates.filter(t => t.category === activeCat),
    [activeCat, templates]
  )

  const sliderItems = useMemo(() => filtered.slice(0, Math.min(SLIDER_INITIAL, filtered.length)), [filtered])
  const gridItems   = useMemo(() => filtered.slice(0, rendered), [filtered, rendered])
  const canLoadMore = rendered < filtered.length

  // Reset on category switch
  const handleCatClick = useCallback((cat: string) => {
    setActiveCat(cat)
    setRendered(SLIDER_INITIAL)
    if (sliderRef.current) sliderRef.current.scrollLeft = 0
  }, [])

  // Lazy-load: add more cards as user scrolls near the end
  useEffect(() => {
    const el = sliderRef.current
    if (!el || !canLoadMore) return
    function onScroll() {
      if (!el) return
      const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 400
      if (nearEnd) setRendered(prev => Math.min(prev + SLIDER_CHUNK, filtered.length))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [canLoadMore, filtered.length])

  // Arrow nav
  const slideBy = useCallback((dir: 1 | -1) => {
    const el = sliderRef.current
    if (!el) return
    const cardW = el.querySelector<HTMLElement>('.tpl-card')?.offsetWidth ?? 280
    el.scrollBy({ left: dir * (cardW + 18) * 3, behavior: 'smooth' })
  }, [])

  // Load on-demand fonts for tpl-name
  useEffect(() => {
    const id = 'tpl-fonts-cormorant-baskerville'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.media = 'print'
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital@0&family=Libre+Baskerville&display=swap'
    link.onload = () => { link.media = 'all' }
    document.head.appendChild(link)
  }, [])

  return (
    <div className="page-pad">
      <style>{`
        @keyframes tplFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Filter bar ── */
        .tpl-filter-bar {
          display: flex; gap: 7px; margin-bottom: 32px; margin-top: 8px;
          flex-wrap: nowrap; overflow-x: auto; padding-bottom: 6px;
          -webkit-overflow-scrolling: touch; scrollbar-width: none;
        }
        .tpl-filter-bar::-webkit-scrollbar { display: none; }
        .tpl-filter-btn {
          padding: 5px 14px; font-size: 9px; letter-spacing: 0.14em;
          text-transform: uppercase; font-family: 'DM Mono', monospace;
          background: transparent; border: 1px solid var(--border2);
          color: var(--muted); border-radius: 999px; cursor: pointer;
          transition: all 0.15s ease; white-space: nowrap; flex-shrink: 0;
        }
        .tpl-filter-btn:hover { border-color: var(--gold); color: var(--gold); }
        .tpl-filter-btn.active {
          background: var(--gold); color: #0A0A0E; border-color: var(--gold);
        }

        /* ── Card ── */
        .tpl-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px; overflow: hidden;
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.25s, border-color 0.2s;
          text-decoration: none; display: block; position: relative;
          flex: 0 0 280px; min-width: 0;
          scroll-snap-align: start;
        }
        @media (hover: hover) {
          .tpl-card:hover { transform: translateY(-4px) scale(1.01); }
        }

        /* ── Thumb ── */
        .tpl-thumb {
          aspect-ratio: 16 / 10;
          background: #060608;
          position: relative; overflow: hidden;
        }
        .tpl-img-wrap {
          position: absolute; inset: 0; overflow: hidden;
        }

        /* ── Info row ── */
        .tpl-info {
          padding: 13px 15px 15px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .tpl-name {
          font-family: 'Cormorant Garamond', 'Libre Baskerville', Georgia, serif;
          font-size: 13.5px; letter-spacing: 0.01em;
          color: var(--cream); line-height: 1.35;
          margin-bottom: 9px; font-weight: 400;
        }
        .tpl-desc {
          min-height: 34px; margin: -2px 0 10px; color: var(--muted2);
          font-size: 10.5px; line-height: 1.45; display: -webkit-box;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .tpl-meta {
          display: flex; align-items: center;
          justify-content: space-between; gap: 8px;
        }
        .tpl-cat-tag {
          font-size: 8.5px; letter-spacing: 0.18em;
          text-transform: uppercase; font-family: 'DM Mono', monospace;
        }
        .tpl-tier-tag {
          font-size: 8.5px; letter-spacing: 0.14em;
          text-transform: uppercase; font-family: 'DM Mono', monospace;
          border: 1px solid; padding: 2px 8px; border-radius: 2px;
        }

        /* ── Hover buttons ── */
        .tpl-hover-btns {
          position: absolute; bottom: 10px; left: 10px; right: 10px;
          display: flex; gap: 7px; align-items: center;
          opacity: 0; transform: translateY(5px);
          transition: opacity 0.18s, transform 0.18s;
          pointer-events: none; z-index: 4;
        }
        .tpl-card:hover .tpl-hover-btns,
        .tpl-card:focus-within .tpl-hover-btns {
          opacity: 1; transform: translateY(0); pointer-events: auto;
        }
        @media (hover: none) {
          .tpl-hover-btns {
            opacity: 1 !important; transform: none !important;
            pointer-events: auto !important;
          }
        }
        .tpl-use-btn {
          flex: 1; padding: 7px 14px; font-size: 8.5px;
          letter-spacing: 0.16em; text-transform: uppercase;
          font-family: 'DM Mono', monospace; font-weight: 500;
          border-radius: 3px; border: none; cursor: pointer;
          text-decoration: none; display: inline-flex;
          align-items: center; justify-content: center; gap: 5px;
        }
        .tpl-view-btn {
          padding: 7px 12px; font-size: 8.5px; letter-spacing: 0.14em;
          text-transform: uppercase; font-family: 'DM Mono', monospace;
          font-weight: 400; border-radius: 3px; cursor: pointer;
          text-decoration: none; display: inline-flex; align-items: center;
          gap: 5px; backdrop-filter: blur(10px);
          background: rgba(4,4,14,0.85); white-space: nowrap;
        }

        /* ── Misc ── */
        .tpl-overlay-shine {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%);
          pointer-events: none; opacity: 0; transition: opacity 0.25s; z-index: 2;
        }
        .tpl-card:hover .tpl-overlay-shine { opacity: 1; }
        .tpl-color-bar {
          position: absolute; top: 0; left: 0; right: 0;
          height: 2px; transition: height 0.2s; z-index: 3;
        }
        .tpl-card:hover .tpl-color-bar { height: 3px; }

        /* ── Slider ── */
        .tpl-slider-outer {
          position: relative;
          margin: 0 -8px;
        }
        .tpl-slider-rail {
          display: flex;
          flex-direction: row;
          gap: 18px;
          overflow-x: auto;
          overflow-y: visible;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 12px 44px 20px;
          cursor: grab;
          user-select: none;
          box-sizing: border-box;
        }
        .tpl-slider-rail::-webkit-scrollbar { display: none; }
        .tpl-slider-rail:active { cursor: grabbing; }

        /* Ghost placeholder card */
        .tpl-ghost-card {
          flex: 0 0 280px;
          min-width: 0;
          background: var(--surface);
          border: 1px dashed var(--border2);
          border-radius: 8px;
          padding: 16px;
          opacity: 0.4;
          scroll-snap-align: start;
        }

        /* Arrow nav */
        .tpl-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 4;
          width: 38px; height: 38px;
          border-radius: 50%;
          background: var(--surface);
          border: 1px solid var(--border2);
          color: var(--cream);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
          box-shadow: 0 4px 18px rgba(0,0,0,0.45);
        }
        .tpl-arrow:hover {
          background: var(--gold);
          border-color: var(--gold);
          color: #0A0A0E;
          transform: translateY(-50%) scale(1.08);
        }
        .tpl-arrow-prev { left: 0; }
        .tpl-arrow-next { right: 0; }
        .tpl-load-more-btn {
          margin: 22px auto 0; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 26px; border-radius: 999px; border: 1px solid rgba(201,168,76,.62);
          background: linear-gradient(135deg,#F7D986,#C9A84C 55%,#8D6B22); color: #080808;
          font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
          cursor: pointer; box-shadow: 0 18px 42px rgba(201,168,76,.18); transition: transform .18s, box-shadow .18s;
        }
        .tpl-load-more-btn:hover { transform: translateY(-2px); box-shadow: 0 22px 55px rgba(201,168,76,.26); }

        /* Fade edges */
        @media (min-width: 601px) {
          .tpl-slider-outer::before,
          .tpl-slider-outer::after {
            content: '';
            position: absolute;
            top: 0; bottom: 0;
            width: 52px;
            pointer-events: none;
            z-index: 3;
          }
          .tpl-slider-outer::before {
            left: 0;
            background: linear-gradient(to right, var(--bg, #0A0A0E), transparent);
          }
          .tpl-slider-outer::after {
            right: 0;
            background: linear-gradient(to left, var(--bg, #0A0A0E), transparent);
          }
        }

        @media (max-width: 600px) {
          .tpl-arrow { display: none; }
          .tpl-slider-rail { padding: 12px 16px 20px; gap: 14px; }
          .tpl-card { flex: 0 0 260px; }
          .tpl-ghost-card { flex: 0 0 260px; }
        }
        @media (max-width: 400px) {
          .tpl-card { flex: 0 0 88vw; }
          .tpl-ghost-card { flex: 0 0 88vw; }
        }

        /* ── Grid view ── */
        .tpl-section-label {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin: 30px 0 14px;
        }
        .tpl-section-label h2 {
          margin: 0; color: var(--cream); font-size: 16px; font-weight: 400;
          font-family: 'Cormorant Garamond', Georgia, serif; letter-spacing: .01em;
        }
        .tpl-section-label span {
          color: var(--muted); font-family: 'DM Mono', monospace;
          font-size: 9px; letter-spacing: .14em; text-transform: uppercase;
        }
        .tpl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 18px;
          align-items: stretch;
        }
        .tpl-grid .tpl-card {
          width: 100%;
          flex: initial;
          min-width: 0;
          height: 100%;
        }
        @media (max-width: 640px) {
          .tpl-section-label { align-items: flex-start; flex-direction: column; gap: 4px; }
          .tpl-grid { grid-template-columns: 1fr; gap: 14px; }
          .tpl-grid .tpl-card { flex: initial; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 44 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 32, height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)' }} />
          <span style={{
            fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'var(--gold)', fontFamily: "'DM Mono', monospace", fontWeight: 400,
          }}>
            Template Gallery
          </span>
        </div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 300,
          color: 'var(--cream)', margin: '0 0 12px',
          lineHeight: 1.08, letterSpacing: '-0.01em',
        }}>
          {templates.length}&thinsp;<em style={{ color: 'var(--gold)', fontStyle: 'italic', fontWeight: 400 }}>Industry</em>
          <br />Templates
        </h1>
        <p style={{
          fontSize: 13, color: 'var(--muted)', maxWidth: 480,
          lineHeight: 1.7, margin: 0,
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontWeight: 300, letterSpacing: '0.01em',
        }}>
          Every template is precision-tuned for AI generation. Choose your industry,
          preview the live site, then generate your custom version.
        </p>
      </div>

      {/* ── Website Templates ── */}
      <div style={{ marginBottom: 80 }}>
        {/* Filter bar */}
        <div className="tpl-filter-bar">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`tpl-filter-btn${activeCat === cat ? ' active' : ''}`}
              onClick={() => handleCatClick(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count + loaded info */}
        <div style={{
          marginBottom: 20, fontSize: 10,
          color: 'var(--muted)', fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>
            {filtered.length} template{filtered.length !== 1 ? 's' : ''}
            {activeCat !== 'All' ? ` · ${activeCat}` : ''}
          </span>
          <span style={{ opacity: 0.6 }}>
            Showing {Math.min(rendered, filtered.length)} of {filtered.length} — tap Load More
          </span>
        </div>

        <div className="tpl-section-label">
          <h2>Slider Preview</h2>
          <span>Swipe / use arrows</span>
        </div>

        {/* Horizontal slider */}
        <div className="tpl-slider-outer">
          {/* Prev arrow */}
          <button className="tpl-arrow tpl-arrow-prev" onClick={() => slideBy(-1)} aria-label="Scroll left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div ref={sliderRef} className="tpl-slider-rail" key={`${activeCat}-slider`}>
            {sliderItems.map((t, i) => (
              <TemplateCard
                key={`slider-${t.id}`}
                t={t}
                isLoggedIn={isLoggedIn}
                priority={i < 4}
              />
            ))}
          </div>

          {/* Next arrow */}
          <button className="tpl-arrow tpl-arrow-next" onClick={() => slideBy(1)} aria-label="Scroll right">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="tpl-section-label" style={{ marginTop: 42 }}>
          <h2>Grid Gallery</h2>
          <span>{Math.min(rendered, filtered.length)} of {filtered.length} shown</span>
        </div>

        {/* Grid view */}
        <div className="tpl-grid">
          {gridItems.map((t, i) => (
            <TemplateCard
              key={`grid-${t.id}`}
              t={t}
              isLoggedIn={isLoggedIn}
              priority={i < 6}
            />
          ))}
        </div>

        {canLoadMore && (
          <button className="tpl-load-more-btn" onClick={() => setRendered(prev => Math.min(prev + SLIDER_CHUNK, filtered.length))}>
            Load More Templates · {Math.min(SLIDER_CHUNK, filtered.length - rendered)}
          </button>
        )}
      </div>
    </div>
  )
}

