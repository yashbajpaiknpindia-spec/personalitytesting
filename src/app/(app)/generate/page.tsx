'use client'

import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import UsageBadge from '@/components/UsageBadge'

// ── PreviewShowcase — empty state shown when user has no generations yet ────
function PreviewShowcase({ accent }: { accent: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: '40px 24px', gap: 20, textAlign: 'center',
    }}>
      <style>{`
        @keyframes pvGlow {
          0%,100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.08); }
        }
        @keyframes pvFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Icon */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: -20,
          background: `radial-gradient(ellipse, ${accent}22 0%, transparent 70%)`,
          borderRadius: '50%', filter: 'blur(12px)',
          animation: 'pvGlow 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          border: `1px solid ${accent}30`,
          background: `linear-gradient(135deg, ${accent}14 0%, transparent 60%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
      </div>

      {/* Message */}
      <div style={{ maxWidth: 300, animation: 'pvFadeUp 0.5s ease both' }}>
        <div className="pv-preview-heading" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20, fontWeight: 400, lineHeight: 1.4, marginBottom: 10,
        }}>
          Your generated content<br /><em>will appear here.</em>
        </div>
        <p className="pv-preview-sub" style={{
          fontSize: 12, lineHeight: 1.75, margin: '0 0 20px',
          fontFamily: "'DM Sans', sans-serif", color: 'var(--muted)',
        }}>
          Head to the homepage to enter your brand details and generate your full identity kit: website, logo, strategy, and more.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            border: `1px solid ${accent}40`,
            borderRadius: 6,
            background: `${accent}12`,
            color: accent,
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke={accent} strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Start on Homepage
        </a>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center', maxWidth: 280 }}>
        {['Website', 'Logo', 'Copy', 'Strategy', 'Graphics', 'Calendar'].map(f => (
          <div key={f} style={{
            padding: '4px 11px', borderRadius: 100,
            border: `1px solid ${accent}20`,
            background: `${accent}06`,
            fontSize: 9, color: 'var(--muted)',
            fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em',
          }}>{f}</div>
        ))}
      </div>
    </div>
  )
}
// ── GenerationLoadingScreen ─────────────────────────────────────────────────
const GEN_MESSAGES: Record<string, string[]> = {
  'Website':          ['Mapping your site structure', 'Writing your content sections', 'Applying brand colours and fonts', 'Composing the final layout'],
  'Logo Design':      ['Analysing your brand brief', 'Concepting logo directions', 'Refining shapes and colour palette', 'Finalising your logo mark'],
  'Brand Images':     ['Setting up your visual style', 'Generating brand imagery', 'Applying colour treatments', 'Preparing your images'],
  'Business Strategy':['Researching your market', 'Building your positioning', 'Drafting audience personas', 'Polishing your strategy'],
  'Content Calendar': ['Mapping your content pillars', 'Generating 30 days of ideas', 'Writing captions and hooks', 'Assembling your calendar'],
}

function GenerationLoadingScreen({ accent, step, activeChip, elapsedSec }: {
  accent: string; step: number; activeChip: string; elapsedSec: number
}) {
  const messages = GEN_MESSAGES[activeChip] ?? GEN_MESSAGES['Website']
  const currentMsg = messages[Math.min(step, messages.length - 1)]
  const avgWait = activeChip === 'Brand Images' ? '25–45 sec' : '20–40 sec'
  const progress = Math.min(((step + 1) / 4) * 100, 92)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      flex: 1, minHeight: 280, padding: '40px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes glspin { to { transform: rotate(360deg) } }
        @keyframes glpulse { 0%,100%{opacity:0.3;transform:scale(0.97)} 50%{opacity:0.7;transform:scale(1.03)} }
        @keyframes glfadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glbar { from{width:0%} to{width:var(--bar-w)} }
        @keyframes gldot { 0%,80%,100%{opacity:0.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
      `}</style>

      {/* Ambient glow behind */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 260, height: 260, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
        filter: 'blur(32px)',
        animation: 'glpulse 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Central ring */}
      <div style={{ position: 'relative', width: 72, height: 72, marginBottom: 28 }}>
        {/* Outer ring — slow */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `1px solid ${accent}25`,
          borderTopColor: `${accent}80`,
          animation: 'glspin 2.4s linear infinite',
        }} />
        {/* Inner ring — faster */}
        <div style={{
          position: 'absolute', inset: 10, borderRadius: '50%',
          border: `1px solid ${accent}15`,
          borderTopColor: accent,
          animation: 'glspin 1.4s linear infinite reverse',
        }} />
        {/* Centre icon */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {(
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            </svg>
          )}
        </div>
      </div>

      {/* Status text */}
      <div key={currentMsg} style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 18, fontWeight: 400, color: 'var(--cream)',
        marginBottom: 10, lineHeight: 1.4,
        animation: 'glfadein 0.4s ease both',
      }}>
        {currentMsg}
      </div>

      {/* Dot pulse */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 24, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: '50%', background: accent,
            animation: `gldot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      {/* Progress bar */}
      <div style={{
        width: 200, height: 2, background: `${accent}18`, borderRadius: 2, marginBottom: 20, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: `linear-gradient(90deg, ${accent}80, ${accent})`,
          borderRadius: 2, width: `${progress}%`,
          transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      {/* Step pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: '3px 10px', borderRadius: 100,
            border: `1px solid ${i <= step ? accent + '50' : accent + '15'}`,
            background: i <= step ? `${accent}10` : 'transparent',
            fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
            fontFamily: "'DM Mono', monospace",
            color: i <= step ? accent : 'var(--muted2)',
            transition: 'all 0.4s ease',
          }}>{i + 1}</div>
        ))}
      </div>

      {/* Elapsed */}
      <div style={{
        fontSize: 9, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace",
        letterSpacing: '0.08em',
      }}>
        {elapsedSec}s elapsed · typically {avgWait}
      </div>
    </div>
  )
}

function BizImagesPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const colors = data.primaryColors?.length ? data.primaryColors : ['#D4AF54', '#E63946', '#0A0A0E', '#F4EFE5']
  const brandName = data.companyName || 'Your Brand'
  const tagline = data.tagline || ''

  // ── All hooks BEFORE any conditional return ───────────────────────────────
  const [selectedRatio, setSelectedRatio] = React.useState('instagram_post_4x5')
  const [rerendering, setRerendering]     = React.useState(false)
  const [rerenError, setRerenError]       = React.useState<string | null>(null)
  // Per-image, per-size cache: { [imgIdx_sizeId]: dataUri }
  // Avoids re-calling the renderer if user taps the same size again
  const [sizeCache, setSizeCache]         = React.useState<Record<string, string>>({})
  // Per-image rendered URIs for the currently selected size
  const [renderedUris, setRenderedUris]   = React.useState<Record<number, string>>({})
  const [editingIdx, setEditingIdx]       = React.useState<number | null>(null)
  const [editPrompt, setEditPrompt]       = React.useState('')
  const [editCounts, setEditCounts]       = React.useState<Record<number, number>>({})
  const [editInProgress, setEditInProgress] = React.useState(false)
  const [editError, setEditError]         = React.useState<string | null>(null)
  const [editLimit, setEditLimit]         = React.useState(2)
  const [sessionEditMap, setSessionEditMap] = React.useState<Record<number, string>>({})
  const [fullscreenPreview, setFullscreenPreview] = React.useState<{ src: string; title: string; meta?: string } | null>(null)

  type InstantStyle = { paletteId: string; fontId: string; frameId: string }
  type InstantText = { headline: string; subheadline: string; cta: string }
  const INSTANT_PALETTES = [
    { id: 'original', name: 'Original', accent: accent, filter: 'none', overlay: 'transparent', overlayOpacity: 0 },
    { id: 'luxury-gold', name: 'Luxury Gold', accent: '#D4AF54', filter: 'contrast(1.06) saturate(1.08) sepia(0.10)', overlay: 'linear-gradient(135deg, rgba(212,175,84,0.20), rgba(0,0,0,0.02))', overlayOpacity: 0.9 },
    { id: 'tech-blue', name: 'Tech Blue', accent: '#5AA7FF', filter: 'contrast(1.08) saturate(1.02) hue-rotate(5deg)', overlay: 'linear-gradient(135deg, rgba(35,122,255,0.18), rgba(0,0,0,0.04))', overlayOpacity: 0.85 },
    { id: 'red-white', name: 'Red White', accent: '#E53935', filter: 'contrast(1.08) saturate(1.05)', overlay: 'linear-gradient(135deg, rgba(229,57,53,0.16), rgba(255,255,255,0.04))', overlayOpacity: 0.82 },
    { id: 'mono-premium', name: 'Mono Premium', accent: '#E8E1D2', filter: 'grayscale(0.82) contrast(1.13) brightness(0.98)', overlay: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.12))', overlayOpacity: 0.8 },
    { id: 'neon-purple', name: 'Neon Purple', accent: '#B86BFF', filter: 'contrast(1.08) saturate(1.20)', overlay: 'radial-gradient(circle at 20% 10%, rgba(184,107,255,0.22), transparent 45%), linear-gradient(135deg, rgba(255,200,87,0.10), rgba(0,0,0,0.04))', overlayOpacity: 0.95 },
  ]
  const INSTANT_FONTS = [
    { id: 'original', name: 'Original', family: "'DM Sans', sans-serif" },
    { id: 'modern', name: 'Modern Bold', family: "'Inter', 'DM Sans', sans-serif" },
    { id: 'luxury', name: 'Luxury Serif', family: "'Playfair Display', Georgia, serif" },
    { id: 'mono', name: 'Editorial Mono', family: "'DM Mono', monospace" },
    { id: 'clean', name: 'Startup Clean', family: "'DM Sans', Arial, sans-serif" },
  ]
  const INSTANT_FRAMES = [
    { id: 'original', name: 'Original', radius: 0, padding: 0, shadow: 'none', border: 'none' },
    { id: 'clean-frame', name: 'Bottom Left', radius: 10, padding: 10, shadow: '0 18px 55px rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.16)' },
    { id: 'soft-card', name: 'Center Focus', radius: 18, padding: 14, shadow: '0 24px 75px rgba(0,0,0,0.34)', border: '1px solid rgba(255,255,255,0.12)' },
    { id: 'edge-glow', name: 'Editorial Glow', radius: 12, padding: 8, shadow: `0 0 0 1px ${accent}35, 0 22px 70px ${accent}25`, border: `1px solid ${accent}45` },
  ]
  const [instantStyles, setInstantStyles] = React.useState<Record<number, InstantStyle>>({})
  const [instantTexts, setInstantTexts] = React.useState<Record<number, InstantText>>({})
  const [editingTextIdx, setEditingTextIdx] = React.useState<number | null>(null)
  const getInstantStyle = (idx: number): InstantStyle => instantStyles[idx] ?? { paletteId: 'original', fontId: 'original', frameId: 'original' }
  const getPalette = (id: string) => INSTANT_PALETTES.find(p => p.id === id) ?? INSTANT_PALETTES[0]
  const getFont = (id: string) => INSTANT_FONTS.find(f => f.id === id) ?? INSTANT_FONTS[0]
  const getFrame = (id: string) => INSTANT_FRAMES.find(f => f.id === id) ?? INSTANT_FRAMES[0]
  const updateInstantStyle = (idx: number, patch: Partial<InstantStyle>) => {
    setInstantStyles(prev => ({ ...prev, [idx]: { ...getInstantStyle(idx), ...patch } }))
  }

  const cleanInstantText = (value: any) => String(value || '').replace(/\s+/g, ' ').trim()
  const getBaseInstantText = (rc: any, img: any): InstantText => ({
    headline: cleanInstantText(rc?.headline || img?.creativeOutput?.headline || img?.title || 'Your Brand'),
    subheadline: cleanInstantText(rc?.subheadline || img?.creativeOutput?.subheadline || img?.description || ''),
    cta: cleanInstantText(rc?.cta || img?.creativeOutput?.cta || ''),
  })
  const getInstantText = (idx: number, rc: any, img: any): InstantText => instantTexts[idx] ?? getBaseInstantText(rc, img)
  const hasInstantTextOverride = (idx: number, rc: any, img: any): boolean => {
    const override = instantTexts[idx]
    if (!override) return false
    const base = getBaseInstantText(rc, img)
    return override.headline !== base.headline || override.subheadline !== base.subheadline || override.cta !== base.cta
  }
  const updateInstantText = (idx: number, rc: any, img: any, patch: Partial<InstantText>) => {
    setInstantTexts(prev => ({ ...prev, [idx]: { ...getInstantText(idx, rc, img), ...patch } }))
  }
  const resetInstantText = (idx: number) => {
    setInstantTexts(prev => { const next = { ...prev }; delete next[idx]; return next })
  }

  // Load admin-configured edit limit once
  React.useEffect(() => {
    fetch('/api/admin/settings').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.posterEditLimit !== undefined) setEditLimit(Number(d.posterEditLimit))
    }).catch(() => {})
  }, [])

  type CDOutput = { headline?: string; subheadline?: string; visualMetaphor?: string; sceneDirection?: string; imageDirection?: string; selectedTemplate?: string; selectedSize?: string; campaignArchetype?: string; confidence?: number }
  type CampaignGraphic = { type: string; title: string; description: string; imageDataUri: string; imageUrl?: string; finalPosterUrl?: string; source?: string; rendered?: boolean; attribution?: any; creativeOutput?: CDOutput; renderContract?: any; generationId?: string; variationIndex?: number; variationLabel?: string; id?: string }
  const rawGenerated = (data as BusinessOutput & {
    _generatedImages?: CampaignGraphic[];
    _persistedImages?: CampaignGraphic[];
    graphics?: CampaignGraphic[];
    variations?: CampaignGraphic[];
    genType?: string; finalPosterUrl?: string; imageUrl?: string; headline?: string; subheadline?: string;
  })
  const rawBaseImages  = rawGenerated._generatedImages ?? rawGenerated._persistedImages ?? rawGenerated.graphics ?? rawGenerated.variations ?? null
  const isBrokenSplitFocus = (img: any) => /split\s*(focus|offer|panel)|half[-\s]*panel/i.test(String(img?.variationLabel || img?.description || img?.title || img?.renderContract?._variationLabel || ''))
  const cleanVariationLabel = (label: any, index: number) => {
    const value = String(label || '').replace(/[-_]+/g, ' ').trim()
    if (!value || /split\s*(focus|offer|panel)|half[-\s]*panel/i.test(value)) {
      return ['Left Editorial', 'Editorial Focus', 'Bottom Impact', 'Centered Premium'][index % 4]
    }
    return value
  }
  const normalizeCampaignImages = (imgs: CampaignGraphic[] | null | undefined): CampaignGraphic[] | null => {
    if (!imgs || !Array.isArray(imgs)) return null
    const safe = imgs.filter(img => !isBrokenSplitFocus(img))
    return safe.map((img, index) => ({
      ...img,
      variationIndex: index,
      variationLabel: cleanVariationLabel((img as any).variationLabel || (img as any).renderContract?._variationLabel, index),
      description: String((img as any).description || '').replace(/split\s*(focus|offer|panel)|half[-\s]*panel/gi, cleanVariationLabel(null, index)),
      renderContract: (img as any).renderContract ? {
        ...(img as any).renderContract,
        _variationIndex: index,
        _variationLabel: cleanVariationLabel((img as any).renderContract?._variationLabel || (img as any).variationLabel, index),
      } : (img as any).renderContract,
    }))
  }
  const baseImages = normalizeCampaignImages(rawBaseImages)
  const [activeSlide, setActiveSlide] = React.useState(0)
  const [localImages, setLocalImages] = React.useState<CampaignGraphic[] | null>(baseImages ? [...baseImages] : null)

  React.useEffect(() => {
    setLocalImages(baseImages ? [...baseImages] : null)
    setActiveSlide(0)
    setRenderedUris({})
    setSessionEditMap({})
    setInstantStyles({})
    setInstantTexts({})
    setEditingTextIdx(null)
    setFullscreenPreview(null)
  }, [rawGenerated._generatedImages, rawGenerated._persistedImages, rawGenerated.graphics, rawGenerated.variations]) // eslint-disable-line react-hooks/exhaustive-deps


  const displayImages = localImages ?? baseImages
  const isStandalone = !baseImages && rawGenerated.genType === 'campaign-image' && !!(rawGenerated.finalPosterUrl || rawGenerated.imageUrl)

  // ── Ratio options — each maps to a real POSTER_SIZES key ─────────────────
  const RATIO_OPTIONS = [
    { id: 'instagram_square_1x1',  label: 'Square',    aspect: '1:1',   w: 1080, h: 1080 },
    { id: 'instagram_post_4x5',    label: 'Portrait',  aspect: '4:5',   w: 1080, h: 1350 },
    { id: 'instagram_story_9x16',  label: 'Story',     aspect: '9:16',  w: 1080, h: 1920 },
    { id: 'linkedin_post_1_91x1',  label: 'Landscape', aspect: '16:9',  w: 1200, h: 627  },
    { id: 'website_hero_16x9',     label: 'Widescreen',aspect: '16:9',  w: 1920, h: 1080 },
  ]
  const activeRatioOpt = RATIO_OPTIONS.find(r => r.id === selectedRatio) ?? RATIO_OPTIONS[1]

  // ── Re-render at new size using our backend engine — no AI, no stock API ──
  // The engine rebuilds text, font sizes, margins and layout from scratch at
  // the new W×H so nothing overflows or gets cut off. Cost: ~1s server CPU.
  async function switchRatio(sizeId: string) {
    if (rerendering) return
    setSelectedRatio(sizeId)
    setRerenError(null)

    const imgs = (displayImages ?? (isStandalone
      ? [{ renderContract: (data as any).renderContract, imageDataUri: rawGenerated.finalPosterUrl || rawGenerated.imageUrl }]
      : []))
    if (!imgs.length) return

    // User-side resize applies only to the currently visible slide.
    // Admin-only single-image force re-render is handled in /admin.
    const targetIdx = Math.min(Math.max(activeSlide, 0), imgs.length - 1)
    const targetImg: any = imgs[targetIdx]
    const cacheKey = `${targetIdx}_${sizeId}`

    if (sizeCache[cacheKey]) {
      setRenderedUris(prev => ({ ...prev, [targetIdx]: sizeCache[cacheKey] }))
      return
    }

    if (!targetImg?.renderContract) {
      setRerenError('Selected image cannot be re-rendered — no render contract')
      return
    }

    setRerendering(true)
    try {
      const res = await fetch('/api/rerender-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renderContract: targetImg.renderContract, sizeId }),
      })
      const json = await res.json()
      if (!res.ok || !json.imageDataUri) {
        console.warn('[rerender-poster] failed for selected img', targetIdx, json.error)
        setRerenError(json.error || 'Resize render failed — showing original')
        return
      }

      setSizeCache(prev => ({ ...prev, [cacheKey]: json.imageDataUri as string }))
      setRenderedUris(prev => ({ ...prev, [targetIdx]: json.imageDataUri as string }))
    } catch (err) {
      console.error('[rerender-poster] network error:', err)
      setRerenError('Resize failed — showing original')
    } finally {
      setRerendering(false)
    }
  }

  // ── JPG download helper ───────────────────────────────────────────────────
  async function downloadJpg(imageUrl: string, name: string) {
    try {
      const imgEl = new window.Image()
      imgEl.crossOrigin = 'anonymous'
      await new Promise<void>((res, rej) => { imgEl.onload = () => res(); imgEl.onerror = () => rej(); imgEl.src = imageUrl })
      const canvas = document.createElement('canvas')
      canvas.width = imgEl.naturalWidth || imgEl.width
      canvas.height = imgEl.naturalHeight || imgEl.height
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(imgEl, 0, 0)
      const a = document.createElement('a'); a.href = canvas.toDataURL('image/jpeg', 0.92); a.download = `${name}.jpg`; a.click()
    } catch {
      const a = document.createElement('a'); a.href = imageUrl; a.download = `${name}.jpg`; a.click()
    }
  }

  async function downloadStyledImage(imageUrl: string, name: string, style: InstantStyle, format: 'png' | 'jpg' = 'png') {
    const palette = getPalette(style.paletteId)
    const frame = getFrame(style.frameId)
    try {
      const imgEl = new window.Image()
      imgEl.crossOrigin = 'anonymous'
      await new Promise<void>((res, rej) => { imgEl.onload = () => res(); imgEl.onerror = () => rej(); imgEl.src = imageUrl })
      const pad = frame.padding || 0
      const canvas = document.createElement('canvas')
      canvas.width = (imgEl.naturalWidth || imgEl.width) + pad * 2
      canvas.height = (imgEl.naturalHeight || imgEl.height) + pad * 2
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = format === 'jpg' ? '#ffffff' : 'rgba(0,0,0,0)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.filter = palette.filter || 'none'
      ctx.drawImage(imgEl, pad, pad)
      ctx.filter = 'none'
      if (palette.overlayOpacity > 0 && palette.overlay !== 'transparent') {
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = palette.overlayOpacity
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, palette.accent + 'AA')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(pad, pad, imgEl.naturalWidth || imgEl.width, imgEl.naturalHeight || imgEl.height)
  ctx.restore()
}
      if (frame.border !== 'none' && pad > 0) {
        ctx.strokeStyle = palette.accent + '70'
        ctx.lineWidth = Math.max(2, Math.round(canvas.width * 0.002))
        ctx.strokeRect(pad / 2, pad / 2, canvas.width - pad, canvas.height - pad)
      }
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
      const href = canvas.toDataURL(mime, format === 'jpg' ? 0.92 : undefined)
      const a = document.createElement('a'); a.href = href; a.download = `${name}.${format}`; a.click()
    } catch {
      if (format === 'jpg') return downloadJpg(imageUrl, name)
      const a = document.createElement('a'); a.href = imageUrl; a.download = `${name}.png`; a.click()
    }
  }

  async function loadImageForCanvas(src: string): Promise<HTMLImageElement> {
    const imgEl = new window.Image()
    imgEl.crossOrigin = 'anonymous'
    await new Promise<void>((res, rej) => {
      imgEl.onload = () => res()
      imgEl.onerror = () => rej(new Error('Image load failed'))
      imgEl.src = src
    })
    return imgEl
  }

  function drawCoverImage(ctx: CanvasRenderingContext2D, imgEl: HTMLImageElement, x: number, y: number, w: number, h: number) {
    const iw = imgEl.naturalWidth || imgEl.width
    const ih = imgEl.naturalHeight || imgEl.height
    const scale = Math.max(w / iw, h / ih)
    const sw = w / scale
    const sh = h / scale
    const sx = (iw - sw) / 2
    const sy = (ih - sh) / 2
    ctx.drawImage(imgEl, sx, sy, sw, sh, x, y, w, h)
  }

  function drawInstantText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
    const words = String(text || '').split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test
      } else {
        lines.push(line)
        line = word
      }
      if (lines.length >= maxLines) break
    }
    if (line && lines.length < maxLines) lines.push(line)
    lines.slice(0, maxLines).forEach((ln, idx) => ctx.fillText(ln, x, y + idx * lineHeight))
    return lines.length * lineHeight
  }

  async function buildInstantStyledPosterDataUrl(imageUrl: string, style: InstantStyle, rc: any, title: string, subtitle: string, format: 'png' | 'jpg' = 'png', textOverride?: InstantText): Promise<string> {
    const palette = getPalette(style.paletteId)
    const font = getFont(style.fontId)
    const frame = getFrame(style.frameId)
    const hasTextLayer = !!textOverride
    const hasLiveLayer = !!rc && (style.paletteId !== 'original' || style.fontId !== 'original' || style.frameId !== 'original' || hasTextLayer)

    // If only a flat generated image is available, still export/open the visible tint/frame version.
    if (!hasLiveLayer) {
      const flat = await loadImageForCanvas(imageUrl)
      const fw = flat.naturalWidth || flat.width
      const fh = flat.naturalHeight || flat.height
      const pad = frame.padding || 0
      const canvas = document.createElement('canvas')
      canvas.width = fw + pad * 2
      canvas.height = fh + pad * 2
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = format === 'jpg' ? '#ffffff' : 'rgba(0,0,0,0)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.filter = palette.filter || 'none'
      ctx.drawImage(flat, pad, pad)
      ctx.filter = 'none'
      if (palette.overlayOpacity > 0 && palette.overlay !== 'transparent') {
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = palette.overlayOpacity
  const tint = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
  tint.addColorStop(0, palette.accent + 'AA')
  tint.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = tint
  ctx.fillRect(pad, pad, fw, fh)
  ctx.restore()
}
      if (frame.border !== 'none' && pad > 0) {
        ctx.strokeStyle = palette.accent + '70'
        ctx.lineWidth = Math.max(2, Math.round(canvas.width * 0.002))
        ctx.strokeRect(pad / 2, pad / 2, canvas.width - pad, canvas.height - pad)
      }
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
      return canvas.toDataURL(mime, format === 'jpg' ? 0.92 : undefined)
    }

    const bgUrl = rc?.backgroundImage?.cleanBackgroundUrl || rc?.backgroundImage?.url || imageUrl
    let bg: HTMLImageElement
    try {
      bg = await loadImageForCanvas(bgUrl)
    } catch {
      bg = await loadImageForCanvas(imageUrl)
    }

    const pad = frame.padding || 0
    const w = activeRatioOpt.w
    const h = activeRatioOpt.h
    const canvas = document.createElement('canvas')
    canvas.width = w + pad * 2
    canvas.height = h + pad * 2
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = format === 'jpg' ? '#ffffff' : 'rgba(0,0,0,0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(pad, pad)
    ctx.filter = palette.filter || 'none'
    drawCoverImage(ctx, bg, 0, 0, w, h)
    ctx.filter = 'none'

    const liveLayout = style.frameId === 'soft-card' ? 'center' : 'bottom-left'
    const grad = liveLayout === 'center'
      ? ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.62)
      : ctx.createLinearGradient(0, h, 0, 0)
    if (liveLayout === 'center') {
      grad.addColorStop(0, 'rgba(0,0,0,0.18)')
      grad.addColorStop(1, 'rgba(0,0,0,0.72)')
    } else {
      grad.addColorStop(0, 'rgba(0,0,0,0.82)')
      grad.addColorStop(0.65, 'rgba(0,0,0,0.20)')
      grad.addColorStop(1, 'rgba(0,0,0,0.04)')
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    if (palette.overlayOpacity > 0 && palette.overlay !== 'transparent') {
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = palette.overlayOpacity
  const tint = ctx.createLinearGradient(0, 0, w, h)
  tint.addColorStop(0, palette.accent + 'AA')
  tint.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

    const margin = Math.round(Math.min(w, h) * 0.08)
    const textMax = Math.round(w * 0.84)
    const startX = liveLayout === 'center' ? w / 2 : margin
    const blockBottom = h - margin
    const headline = textOverride?.headline ?? rc?.headline ?? title ?? 'Your Brand'
    const subheadline = textOverride?.subheadline ?? rc?.subheadline ?? subtitle ?? ''
    const cta = textOverride?.cta ?? rc?.cta ?? ''
    const headlineSize = Math.round(Math.min(w * (h > w ? 0.072 : 0.052), h * 0.09))
    const subSize = Math.round(Math.max(24, headlineSize * 0.34))
    const labelSize = Math.round(Math.max(18, headlineSize * 0.24))
    const buttonH = cta ? Math.round(subSize * 2.1) : 0
    const estimatedTextH = headlineSize * (h > w ? 2.4 : 1.7) + (subheadline ? subSize * 2.2 : 0) + (cta ? buttonH + subSize * 0.9 : 0) + labelSize * 1.8
    let y = liveLayout === 'center' ? Math.round((h - estimatedTextH) / 2) : Math.round(blockBottom - estimatedTextH)
    y = Math.max(margin, y)

    ctx.textAlign = liveLayout === 'center' ? 'center' : 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = palette.accent
    ctx.font = `${labelSize}px 'DM Mono', monospace`
    y += Math.round(labelSize * 1.9)

    ctx.fillStyle = '#ffffff'
    ctx.font = `800 ${headlineSize}px ${font.family}`
    const headlineX = startX
    const headlineTop = y
    const usedH = drawInstantText(ctx, headline, headlineX, headlineTop, textMax, Math.round(headlineSize * 1.02), h > w ? 3 : 2)
    y += usedH + Math.round(subSize * 0.6)

    if (subheadline) {
      ctx.globalAlpha = 0.88
      ctx.font = `${subSize}px ${font.family}`
      drawInstantText(ctx, subheadline, startX, y, liveLayout === 'center' ? Math.round(textMax * 0.78) : textMax, Math.round(subSize * 1.35), 2)
      ctx.globalAlpha = 1
      y += Math.round(subSize * 2.8)
    }

    if (cta) {
      ctx.font = `700 ${Math.round(subSize * 0.72)}px 'DM Mono', monospace`
      const textW = Math.min(ctx.measureText(cta.toUpperCase()).width + subSize * 1.6, textMax)
      const bx = liveLayout === 'center' ? startX - textW / 2 : startX
      const by = y
      ctx.strokeStyle = palette.accent
      ctx.lineWidth = Math.max(2, Math.round(w * 0.0018))
      ctx.strokeRect(bx, by, textW, buttonH)
      ctx.fillStyle = palette.accent
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(cta.toUpperCase(), bx + textW / 2, by + buttonH / 2)
      ctx.textAlign = liveLayout === 'center' ? 'center' : 'left'
      ctx.textBaseline = 'top'
    }

    ctx.restore()

    if (frame.border !== 'none' && pad > 0) {
      ctx.strokeStyle = palette.accent + '80'
      ctx.lineWidth = Math.max(2, Math.round(canvas.width * 0.002))
      ctx.strokeRect(pad / 2, pad / 2, canvas.width - pad, canvas.height - pad)
    }

    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png'
    return canvas.toDataURL(mime, format === 'jpg' ? 0.92 : undefined)
  }

  async function downloadInstantPreview(imageUrl: string, name: string, style: InstantStyle, rc: any, img: any, format: 'png' | 'jpg' = 'png', textOverride?: InstantText) {
    try {
      const src = await buildInstantStyledPosterDataUrl(imageUrl, style, rc, img?.title || '', img?.description || '', format, textOverride)
      const a = document.createElement('a')
      a.href = src
      a.download = `${name}.${format}`
      a.click()
    } catch {
      downloadStyledImage(imageUrl, name, style, format)
    }
  }

  async function openInstantFullscreen(imageUrl: string, style: InstantStyle, rc: any, img: any, meta: string, textOverride?: InstantText) {
    try {
      const src = await buildInstantStyledPosterDataUrl(imageUrl, style, rc, img?.title || '', img?.description || '', 'png', textOverride)
      setFullscreenPreview({ src, title: img?.title || 'Generated poster', meta })
    } catch {
      setFullscreenPreview({ src: imageUrl, title: img?.title || 'Generated poster', meta })
    }
  }


  // ── Apply AI edit to a poster ─────────────────────────────────────────────
  async function submitEdit(imageIdx: number) {
    if (!editPrompt.trim()) return
    const imgs = displayImages ?? []
    const img = imgs[imageIdx]
    if (!img) return
    const rc = (img as any).renderContract
    if (!rc) { setEditError('This poster cannot be edited (no render contract). Try regenerating first.'); return }
    if ((editCounts[imageIdx] ?? 0) >= editLimit) { setEditError(`Edit limit of ${editLimit} reached.`); return }
    setEditInProgress(true); setEditError(null)
    try {
      const res = await fetch('/api/edit-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renderContract: rc, editPrompt: editPrompt.trim(), generationId: (img as any).generationId, editCount: editCounts[imageIdx] ?? 0 }),
      })
      const json = await res.json()
      if (json.limitReached) { setEditError(`Edit limit of ${editLimit} reached for this poster.`); return }
      if (json.imageDataUri) {
        setEditCounts(p => ({ ...p, [imageIdx]: (p[imageIdx] ?? 0) + 1 }))
        setEditingIdx(null); setEditPrompt('')
        setSessionEditMap(prev => ({ ...prev, [imageIdx]: json.imageDataUri }))
        setLocalImages(prev => prev ? prev.map((item, idx) => idx === imageIdx ? {
          ...item,
          imageDataUri: json.imageDataUri,
          imageUrl: json.imageDataUri,
          finalPosterUrl: json.imageDataUri,
          renderContract: json.renderContract ?? item.renderContract,
        } : item) : prev)
        // Clear size cache for this image so edited version shows at all sizes
        setSizeCache(prev => {
          const next = { ...prev }
          Object.keys(next).forEach(k => { if (k.startsWith(`${imageIdx}_`)) delete next[k] })
          return next
        })
        setRenderedUris(prev => { const n = { ...prev }; delete n[imageIdx]; return n })
      } else { setEditError(json.error ?? 'Edit failed — please try again.') }
    } catch { setEditError('Edit failed — please try again.') }
    finally { setEditInProgress(false) }
  }

  // ── Ratio Picker bar ──────────────────────────────────────────────────────
  const RatioPicker = () => (
    <div style={{
      borderTop: `1px solid ${accent}20`,
      background: 'var(--surface)',
      flexShrink: 0,
      padding: '10px 14px 12px',
    }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 8, letterSpacing: '0.16em', color: rerendering ? accent : 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', transition: 'color 0.2s' }}>
          {rerendering ? '↻ Re-rendering layout…' : '⊞ Resize Poster'}
        </span>
        {rerenError && <span style={{ fontSize: 9, color: '#f5a0a0', fontFamily: "'DM Mono', monospace" }}>{rerenError}</span>}
      </div>

      {/* Ratio buttons with visual shape preview */}
      <div style={{
        display: 'flex', gap: 7,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any,
        scrollbarWidth: 'none', msOverflowStyle: 'none' as any,
        paddingBottom: 2,
      }}>
        {RATIO_OPTIONS.map(r => {
          const isActive = selectedRatio === r.id
          const maxDim = 28
          const rW = r.w / Math.max(r.w, r.h) * maxDim
          const rH = r.h / Math.max(r.w, r.h) * maxDim
          return (
            <button
              key={r.id}
              onClick={() => switchRatio(r.id)}
              disabled={rerendering}
              style={{
                flexShrink: 0,
                padding: '8px 10px',
                background: isActive ? `${accent}18` : 'transparent',
                border: `1px solid ${isActive ? accent : accent + '30'}`,
                color: isActive ? accent : 'var(--muted)',
                cursor: rerendering ? 'default' : 'pointer',
                borderRadius: 6,
                fontFamily: "'DM Mono', monospace",
                display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', gap: 5,
                minWidth: 58,
                opacity: rerendering && !isActive ? 0.45 : 1,
                transition: 'all 0.15s',
              }}
            >
              {/* Visual aspect ratio shape */}
              <div style={{
                width: rW, height: rH,
                background: isActive
                  ? (rerendering ? `${accent}60` : accent)
                  : `${accent}35`,
                borderRadius: 2,
                transition: 'all 0.15s',
                minWidth: 6, minHeight: 6,
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Shimmer on active while rerendering */}
                {isActive && rerendering && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(90deg, transparent 0%, ${accent}80 50%, transparent 100%)`,
                    animation: 'ratioShimmer 1s linear infinite',
                  }} />
                )}
              </div>
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{r.label}</span>
              <span style={{ fontSize: 7, opacity: 0.65 }}>{r.aspect}</span>
            </button>
          )
        })}
      </div>

      {/* Loading bar */}
      {rerendering && (
        <div style={{ height: 2, background: 'var(--border)', overflow: 'hidden', marginTop: 8, borderRadius: 1 }}>
          <div style={{ height: '100%', width: '40%', background: accent, animation: 'ratioSlide 1s ease-in-out infinite' }} />
        </div>
      )}

      <style>{`
        @keyframes ratioSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes ratioShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )

  const InstantStyleControls = ({ imageIdx }: { imageIdx: number }) => {
    const style = getInstantStyle(imageIdx)
    return (
      <div className="instant-style-controls" style={{ borderTop: `1px solid ${accent}16`, paddingTop: 10, marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 8, letterSpacing: '0.16em', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>⚡ Instant Style</span>
          <span style={{ fontSize: 8, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>No AI · No layout shift</span>
        </div>

        <div style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Color palette</div>
        <div className="instant-style-scroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, paddingBottom: 6 }}>
          {INSTANT_PALETTES.map(pal => {
            const active = style.paletteId === pal.id
            return (
              <button key={pal.id} onClick={() => updateInstantStyle(imageIdx, { paletteId: pal.id })} style={{ flexShrink: 0, minWidth: 82, padding: 8, borderRadius: 8, border: `1px solid ${active ? pal.accent : accent + '25'}`, background: active ? `${pal.accent}16` : 'transparent', color: active ? pal.accent : 'var(--muted)', cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}>
                <div style={{ height: 26, borderRadius: 5, background: pal.id === 'original' ? `linear-gradient(135deg, ${accent}55, rgba(255,255,255,0.08))` : pal.overlay, border: `1px solid ${pal.accent}55`, marginBottom: 6 }} />
                <div style={{ fontSize: 8, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{pal.name}</div>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Font style</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {INSTANT_FONTS.map(font => {
                const active = style.fontId === font.id
                return (
                  <button key={font.id} onClick={() => updateInstantStyle(imageIdx, { fontId: font.id })} style={{ padding: '6px 9px', borderRadius: 999, border: `1px solid ${active ? accent : accent + '25'}`, background: active ? `${accent}16` : 'transparent', color: active ? accent : 'var(--muted)', cursor: 'pointer', fontFamily: font.family, fontSize: 10 }}>
                    {font.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Live layout</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {INSTANT_FRAMES.map(frame => {
                const active = style.frameId === frame.id
                return (
                  <button key={frame.id} onClick={() => updateInstantStyle(imageIdx, { frameId: frame.id })} style={{ padding: '6px 9px', borderRadius: 6, border: `1px solid ${active ? accent : accent + '25'}`, background: active ? `${accent}16` : 'transparent', color: active ? accent : 'var(--muted)', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {frame.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderInstantContentControls(imageIdx: number, rc: any, img: any, displayUri: string, instantStyle: InstantStyle) {
    if (!rc) return null
    const text = getInstantText(imageIdx, rc, img)
    const changed = hasInstantTextOverride(imageIdx, rc, img)
    const isEditing = editingTextIdx === imageIdx
    const filename = `${brandName.toLowerCase().replace(/\s+/g, '-')}-${activeRatioOpt.aspect.replace(':', 'x')}`
    const exportText = changed ? text : undefined
    const miniInput: React.CSSProperties = {
      width: '100%',
      padding: '7px 9px',
      borderRadius: 6,
      border: `1px solid ${accent}28`,
      background: 'rgba(255,255,255,0.035)',
      color: 'var(--cream)',
      fontSize: 10,
      fontFamily: "'DM Mono', monospace",
      outline: 'none',
    }
    return (
      <div style={{ borderTop: `1px solid ${accent}14`, padding: '10px 14px', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: isEditing ? 9 : 7 }}>
          <div style={{ fontSize: 8, letterSpacing: '0.16em', color: accent, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>Text over image</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {changed && <button onClick={() => resetInstantText(imageIdx)} style={{ border: 'none', background: 'transparent', color: 'var(--muted2)', fontSize: 8, fontFamily: "'DM Mono', monospace", cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reset</button>}
            <button onClick={() => downloadInstantPreview(displayUri || img?.imageDataUri || '', filename, instantStyle, rc, img, 'png', exportText)} style={{ padding: '4px 8px', borderRadius: 999, border: `1px solid ${accent}30`, background: changed ? `${accent}16` : 'transparent', color: accent, fontSize: 8, fontFamily: "'DM Mono', monospace", cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>PNG</button>
            <button onClick={() => downloadInstantPreview(displayUri || img?.imageDataUri || '', filename, instantStyle, rc, img, 'jpg', exportText)} style={{ padding: '4px 8px', borderRadius: 999, border: `1px solid ${accent}22`, background: 'transparent', color: 'var(--muted)', fontSize: 8, fontFamily: "'DM Mono', monospace", cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.08em' }}>JPG</button>
            <button onClick={() => setEditingTextIdx(isEditing ? null : imageIdx)} style={{ padding: '4px 9px', borderRadius: 999, border: `1px solid ${accent}35`, background: isEditing ? `${accent}18` : 'transparent', color: accent, fontSize: 8, fontFamily: "'DM Mono', monospace", cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {isEditing ? 'Done' : 'Text Edit'}
            </button>
          </div>
        </div>

        {!isEditing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 5 }}>
            {[['Headline', text.headline], ['Sub', text.subheadline], ['CTA', text.cta]].filter(([, value]) => Boolean(value)).map(([label, value]) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '54px 1fr', gap: 8, alignItems: 'center', minWidth: 0 }}>
                <span style={{ fontSize: 8, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
                <span title={String(value)} style={{ fontSize: 10, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{value}</span>
              </div>
            ))}
            {!text.headline && !text.subheadline && !text.cta && <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>No text layer found.</div>}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 7 }}>
            <input value={text.headline} onChange={e => updateInstantText(imageIdx, rc, img, { headline: e.target.value.slice(0, 70) })} placeholder="Headline" style={miniInput} />
            <input value={text.subheadline} onChange={e => updateInstantText(imageIdx, rc, img, { subheadline: e.target.value.slice(0, 140) })} placeholder="Subheadline" style={miniInput} />
            <input value={text.cta} onChange={e => updateInstantText(imageIdx, rc, img, { cta: e.target.value.slice(0, 34) })} placeholder="CTA / Button text" style={miniInput} />
            <div style={{ fontSize: 8, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", lineHeight: 1.5 }}>
              Instant only — no AI and no backend re-render. PNG/JPG download uses this edited text immediately.
            </div>
          </div>
        )}
      </div>
    )
  }


  // ── Shared image card renderer ────────────────────────────────────────────
  function renderCard(img: any, i: number) {
    const rc = (img as any).renderContract
    const cd = img.creativeOutput as CDOutput | undefined
    const slug = brandName.toLowerCase().replace(/\s+/g, '-')
    const remainingEdits = editLimit - (editCounts[i] ?? 0)
    const canEdit = editLimit > 0 && remainingEdits > 0 && !!rc
    // Priority: session edit → size-rendered → original
    const displayUri = sessionEditMap[i] ?? renderedUris[i] ?? img.imageDataUri
    const instantStyle = getInstantStyle(i)
    const instantText = getInstantText(i, rc, img)
    const textOverrideForExport = hasInstantTextOverride(i, rc, img) ? instantText : undefined
    const instantPalette = getPalette(instantStyle.paletteId)
    const instantFont = getFont(instantStyle.fontId)
    const instantFrame = getFrame(instantStyle.frameId)
    const showLayerPreview = !!rc && (instantStyle.paletteId !== 'original' || instantStyle.fontId !== 'original' || instantStyle.frameId !== 'original' || !!textOverrideForExport)
    const previewBg = rc?.backgroundImage?.cleanBackgroundUrl || rc?.backgroundImage?.url || displayUri
    const previewAspect = `${activeRatioOpt.w} / ${activeRatioOpt.h}`
    const liveLayout = instantStyle.frameId === 'soft-card' ? 'center' : 'bottom-left'

    return (
      <div key={i} className="instant-preview-card" style={{ background: 'var(--surface)', border: `1px solid ${accent}25`, borderRadius: 10, overflow: 'hidden' }}>

        {/* ── Image — natural size, no crop distortion ── */}
        <div
          className="instant-preview-media"
          onClick={() => displayUri && openInstantFullscreen(displayUri, instantStyle, rc, img, `${activeRatioOpt.aspect} · ${img.variationLabel || `Variation ${i + 1}`}`, textOverrideForExport)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && displayUri) openInstantFullscreen(displayUri, instantStyle, rc, img, `${activeRatioOpt.aspect} · ${img.variationLabel || `Variation ${i + 1}`}`, textOverrideForExport) }}
          title="Tap to view full screen"
          style={{ width: '100%', background: 'linear-gradient(135deg, #F7F1E6 0%, #FFFDF6 52%, #EFE3C8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', position: 'relative', padding: instantFrame.padding, border: instantFrame.border, boxShadow: instantFrame.shadow, contain: 'layout paint', cursor: displayUri ? 'zoom-in' : 'default' }}
        >
          {rerendering && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, border: `2px solid ${accent}40`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: 8, color: accent, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em' }}>RENDERING {activeRatioOpt.aspect}</span>
              </div>
            </div>
          )}
          {showLayerPreview ? (
            <div className="instant-layer-preview" style={{ width: '100%', maxWidth: activeRatioOpt.w > activeRatioOpt.h ? 860 : 560, aspectRatio: previewAspect, maxHeight: 'min(72vh, 760px)', position: 'relative', overflow: 'hidden', borderRadius: instantFrame.radius, backgroundImage: `url(${previewBg})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#F7F1E6', filter: instantPalette.filter, opacity: rerendering ? 0.4 : 1, transition: 'opacity 0.14s ease, border-radius 0.14s ease' }}>
              <div style={{ position: 'absolute', inset: 0, background: liveLayout === 'center' ? 'radial-gradient(circle at center, rgba(0,0,0,0.18), rgba(0,0,0,0.72))' : 'linear-gradient(0deg, rgba(0,0,0,0.82), rgba(0,0,0,0.20), rgba(0,0,0,0.04))' }} />
              {instantPalette.overlayOpacity > 0 && <div style={{ position: 'absolute', inset: 0, background: instantPalette.overlay, opacity: instantPalette.overlayOpacity, mixBlendMode: 'screen' }} />}
              <div style={{ position: 'absolute', inset: '8%', display: 'flex', flexDirection: 'column', justifyContent: liveLayout === 'center' ? 'center' : 'flex-end', alignItems: liveLayout === 'center' ? 'center' : 'flex-start', textAlign: liveLayout === 'center' ? 'center' : 'left', gap: 8, color: '#fff', fontFamily: instantFont.family, pointerEvents: 'none' }}>

                <div style={{ fontSize: activeRatioOpt.h > activeRatioOpt.w ? 'clamp(25px, 6vw, 54px)' : 'clamp(24px, 4vw, 48px)', lineHeight: 0.95, fontWeight: 800, letterSpacing: '-0.04em', maxWidth: '100%', display: '-webkit-box', WebkitLineClamp: activeRatioOpt.w > activeRatioOpt.h ? 2 : 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{instantText.headline}</div>
                {instantText.subheadline && <div style={{ fontSize: 'clamp(10px, 2vw, 18px)', lineHeight: 1.35, opacity: 0.86, maxWidth: liveLayout === 'center' ? '72%' : '100%', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{instantText.subheadline}</div>}
                {instantText.cta && <div style={{ marginTop: 4, padding: '7px 13px', border: `1px solid ${instantPalette.accent}`, borderRadius: 999, color: instantPalette.accent, fontSize: 'clamp(8px, 1.5vw, 12px)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>{instantText.cta}</div>}
              </div>
            </div>
          ) : (
            <>
              <img
                src={displayUri}
                alt={img.title}
                style={{ display: 'block', maxWidth: '100%', maxHeight: 'min(72vh, 760px)', width: 'auto', height: 'auto', objectFit: 'contain', objectPosition: 'center', flexShrink: 0, opacity: rerendering ? 0.4 : 1, transition: 'opacity 0.14s ease, border-radius 0.14s ease', filter: instantPalette.filter, borderRadius: instantFrame.radius }}
                loading="lazy"
              />
              {instantPalette.overlayOpacity > 0 && (
                <div style={{ position: 'absolute', inset: instantFrame.padding, borderRadius: instantFrame.radius, background: instantPalette.overlay, opacity: instantPalette.overlayOpacity, pointerEvents: 'none', mixBlendMode: 'screen', transition: 'opacity 0.18s, background 0.18s' }} />
              )}
            </>
          )}
          {/* Active size badge */}
          {renderedUris[i] && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.65)', border: `1px solid ${accent}40`, borderRadius: 4, padding: '2px 7px', fontSize: 8, color: accent, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', pointerEvents: 'none' }}>
              {activeRatioOpt.aspect}
            </div>
          )}
        </div>

        {/* ── Info + action row ── */}
        <div onClick={(e) => e.stopPropagation()} style={{ padding: '10px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--cream)', fontWeight: 500, marginBottom: 2, fontFamily: instantFont.family }}>{img.title}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: instantFont.family }}>{img.description}</div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {canEdit && (
              <button onClick={() => { setEditingIdx(editingIdx === i ? null : i); setEditPrompt(''); setEditError(null) }}
                style={{ padding: '5px 9px', background: editingIdx === i ? `${accent}22` : 'transparent', border: `1px solid ${accent}45`, color: accent, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 3, fontFamily: "'DM Mono', monospace" }}>
                {editingIdx === i ? '✕ AI' : `AI Image Edit (${remainingEdits})`}
              </button>
            )}
            <button onClick={() => {
              const filename = `${slug}-${activeRatioOpt.aspect.replace(':', 'x')}`
              downloadInstantPreview(displayUri ?? '', filename, instantStyle, rc, img, 'png', textOverrideForExport)
            }} style={{ padding: '5px 9px', background: `${instantPalette.accent}18`, border: `1px solid ${instantPalette.accent}40`, color: instantPalette.accent, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: 3 }}>
              ⬇ PNG
            </button>
            <button onClick={() => downloadInstantPreview(displayUri, `${slug}-${activeRatioOpt.aspect.replace(':', 'x')}`, instantStyle, rc, img, 'jpg', textOverrideForExport)}
              style={{ padding: '5px 9px', background: 'transparent', border: `1px solid ${accent}30`, color: 'var(--muted)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 3, fontFamily: "'DM Mono', monospace" }}>
              JPG
            </button>
          </div>
        </div>

        {renderInstantContentControls(i, rc, img, displayUri || '', instantStyle)}

        {/* ── Edit panel ── */}
        {editingIdx === i && (
          <div style={{ padding: '14px', borderTop: `1px solid ${accent}18`, background: `${accent}06` }}>
            <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
              ✦ AI Image Edit · {remainingEdits} of {editLimit} remaining
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
              {['Change headline', 'Change CTA text', 'Make background darker', 'Move text to center', 'Change accent to gold', 'Bold typography style', 'Add subheadline'].map(s => (
                <button key={s} onClick={() => setEditPrompt(s)} style={{ padding: '3px 9px', background: editPrompt === s ? `${accent}20` : 'transparent', border: `1px solid ${editPrompt === s ? accent : accent + '30'}`, color: editPrompt === s ? accent : 'var(--muted)', fontSize: 8, letterSpacing: '0.05em', cursor: 'pointer', borderRadius: 99, fontFamily: "'DM Mono', monospace", transition: 'all 0.13s' }}>{s}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
              <textarea value={editPrompt} onChange={e => setEditPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !editInProgress && (e.preventDefault(), submitEdit(i))}
                placeholder={"Examples:\n• Change headline to 'Premium Coffee'\n• Make CTA say 'Book Now', accent red\n• Move text to center or bottom"}
                rows={3}
                style={{ flex: 1, padding: '8px 10px', background: 'var(--bg)', border: `1px solid ${accent}40`, color: 'var(--cream)', fontSize: 10, borderRadius: 4, fontFamily: "'DM Mono', monospace", outline: 'none', resize: 'none', lineHeight: 1.5 }}
              />
              <button onClick={() => submitEdit(i)} disabled={editInProgress || !editPrompt.trim()}
                style={{ padding: '8px 14px', background: accent, color: '#000', border: 'none', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: (editInProgress || !editPrompt.trim()) ? 'default' : 'pointer', borderRadius: 4, fontFamily: "'DM Mono', monospace", fontWeight: 700, opacity: (editInProgress || !editPrompt.trim()) ? 0.6 : 1, flexShrink: 0, alignSelf: 'flex-end' }}>
                {editInProgress ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, border: '1.5px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Applying</span> : 'Apply →'}
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 8, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
              ✦ Can change: headline · subheadline · CTA text · colours · safe layout · template style
            </div>
            {editError && <div style={{ fontSize: 9, color: '#f5a0a0', marginTop: 6, fontFamily: "'DM Mono', monospace" }}>{editError}</div>}
          </div>
        )}

        {/* ── Creative Director Brief ── */}
        {cd && (cd.sceneDirection || cd.imageDirection || cd.visualMetaphor) && (
          <div style={{ borderTop: `1px solid ${accent}15`, padding: '10px 14px', background: `${accent}06` }}>
            <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 8, opacity: 0.7 }}>✦ Creative Director Brief</div>
            {cd.sceneDirection && <div style={{ marginBottom: 5 }}><span style={{ fontSize: 8, color: accent, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>Scene — </span><span style={{ fontSize: 10, color: 'var(--cream)', lineHeight: 1.5 }}>{cd.sceneDirection}</span></div>}
            {cd.imageDirection && cd.imageDirection !== cd.sceneDirection && <div style={{ marginBottom: 5 }}><span style={{ fontSize: 8, color: accent, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>Visual — </span><span style={{ fontSize: 10, color: 'var(--cream)', lineHeight: 1.5 }}>{cd.imageDirection}</span></div>}
            {cd.visualMetaphor && <div style={{ marginBottom: 5 }}><span style={{ fontSize: 8, color: accent, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>Metaphor — </span><span style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>{cd.visualMetaphor}</span></div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {cd.selectedTemplate && <span style={{ padding: '2px 7px', background: `${accent}12`, border: `1px solid ${accent}25`, borderRadius: 3, fontSize: 7, letterSpacing: '0.1em', color: accent, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>{cd.selectedTemplate.replace(/_/g, ' ')}</span>}
              {cd.campaignArchetype && <span style={{ padding: '2px 7px', background: `${accent}08`, border: `1px solid ${accent}18`, borderRadius: 3, fontSize: 7, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>{cd.campaignArchetype.replace(/_/g, ' ')}</span>}
              {cd.selectedSize && <span style={{ padding: '2px 7px', background: `${accent}08`, border: `1px solid ${accent}18`, borderRadius: 3, fontSize: 7, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>{cd.selectedSize.replace(/_/g, ' ')}</span>}
            </div>
          </div>
        )}
      </div>
    )
  }


  const renderFullscreenPreview = () => fullscreenPreview ? (
    <div
      className="poster-fullscreen-lightbox"
      onClick={() => setFullscreenPreview(null)}
      role="dialog"
      aria-modal="true"
      aria-label="Full screen poster preview"
    >
      <div className="poster-fullscreen-topbar" onClick={(e) => e.stopPropagation()}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullscreenPreview.title}</div>
          {fullscreenPreview.meta && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.62)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' }}>{fullscreenPreview.meta}</div>}
        </div>
        <button onClick={() => setFullscreenPreview(null)} className="poster-fullscreen-close" aria-label="Close full screen preview">✕</button>
      </div>
      <img src={fullscreenPreview.src} alt={fullscreenPreview.title} className="poster-fullscreen-image" onClick={(e) => e.stopPropagation()} />
      <div className="poster-fullscreen-hint">Tap outside to close</div>
    </div>
  ) : null

  function renderImageSlider(images: CampaignGraphic[]) {
    const safeIndex = Math.min(activeSlide, Math.max(images.length - 1, 0))
    const activeImg = images[safeIndex]
    const goPrev = () => setActiveSlide(idx => (idx - 1 + images.length) % images.length)
    const goNext = () => setActiveSlide(idx => (idx + 1) % images.length)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
            Variation {safeIndex + 1} / {images.length}{cleanVariationLabel(activeImg?.variationLabel, safeIndex) ? ` · ${cleanVariationLabel(activeImg?.variationLabel, safeIndex)}` : ''}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={goPrev} disabled={rerendering} style={{ width: 34, height: 30, borderRadius: 6, border: `1px solid ${accent}35`, background: 'transparent', color: accent, cursor: rerendering ? 'default' : 'pointer', fontFamily: "'DM Mono', monospace" }}>‹</button>
              <button onClick={goNext} disabled={rerendering} style={{ width: 34, height: 30, borderRadius: 6, border: `1px solid ${accent}35`, background: 'transparent', color: accent, cursor: rerendering ? 'default' : 'pointer', fontFamily: "'DM Mono', monospace" }}>›</button>
            </div>
          )}
        </div>

        {activeImg && renderCard(activeImg, safeIndex)}

        {images.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 7, paddingBottom: 2 }}>
            {images.map((_img, idx) => (
              <button key={idx} onClick={() => setActiveSlide(idx)} aria-label={`Show variation ${idx + 1}`} style={{ width: idx === safeIndex ? 18 : 7, height: 7, borderRadius: 99, border: 'none', background: idx === safeIndex ? accent : `${accent}35`, cursor: 'pointer', transition: 'all 0.16s' }} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Standalone campaign-image ─────────────────────────────────────────────
  if (isStandalone) {
    const url = rawGenerated.finalPosterUrl || rawGenerated.imageUrl || ''
    const syntheticImages = normalizeCampaignImages([{ type: 'campaign-poster', title: rawGenerated.headline || 'Campaign Poster', description: rawGenerated.subheadline || '', imageDataUri: url, source: (data as any).source, rendered: (data as any).rendering?.rendered ?? false, attribution: (data as any).attribution ?? undefined, renderContract: (data as any).renderContract, generationId: (data as any).generationId }]) ?? []
    return (
      <div className="biz-images-panel" style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Campaign Posters · 1 Generated</div>
        {renderImageSlider(syntheticImages)}
        <RatioPicker />
        <InstantStyleControls imageIdx={activeSlide} />
        {renderFullscreenPreview()}
      </div>
    )
  }

  // ── Generated images array ────────────────────────────────────────────────
  if (displayImages && displayImages.length > 0) {
    return (
      <div className="biz-images-panel" style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
          Campaign Posters · {displayImages.length} Generated
        </div>
        {renderImageSlider(displayImages)}
        <RatioPicker />
        <InstantStyleControls imageIdx={activeSlide} />
        {renderFullscreenPreview()}
      </div>
    )
  }

  // ── Placeholder mockups (nothing generated yet) ───────────────────────────
  const imageTypes = [
    { label: 'Hero Banner',    ratio: '16:9', w: '100%', h: 140 },
    { label: 'Instagram Post', ratio: '1:1',  w: '48%',  h: 140 },
    { label: 'Story',          ratio: '9:16', w: '30%',  h: 160 },
    { label: 'LinkedIn Cover', ratio: '4:1',  w: '100%', h: 80  },
    { label: 'Square Ad',      ratio: '1:1',  w: '48%',  h: 140 },
  ]
  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Brand Images · {imageTypes.length} Formats</div>
      {(rawGenerated as any).isPartial && <div style={{ marginBottom: 12, padding: '8px 10px', border: `1px solid ${accent}25`, borderRadius: 6, background: `${accent}06`, fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>Rendering first poster… preview will appear here immediately.</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {imageTypes.map((img, i) => (
          <div key={img.label} style={{ width: img.w, height: img.h, minWidth: 0 }}>
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${colors[i % colors.length]}22, ${colors[(i + 1) % colors.length]}18)`, border: `1px solid ${accent}30`, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 30%, ${colors[i % colors.length]}30 0%, transparent 60%)` }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
              <div style={{ position: 'relative', textAlign: 'center', padding: '8px 12px' }}>
                {img.h > 100 && tagline && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em' }}>{tagline.slice(0, 32)}</div>}
              </div>
              <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, background: 'rgba(0,0,0,0.6)', padding: '2px 7px', borderRadius: 100, fontFamily: "'DM Mono', monospace" }}>{img.label}</div>
              <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Mono', monospace" }}>{img.ratio}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--surface)', borderRadius: 8, fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
        ✦ Select the <strong style={{ color: accent }}>Brand Images</strong> chip to generate a polished campaign poster with premium visuals and clean layout.
      </div>
    </div>
  )
}
// Zero modifications to any personal-mode code above.
// ═══════════════════════════════════════════════════════════════════════════

interface BusinessOutput {
  companyName: string
  industry: string
  tagline: string
  brandStory: string
  brandVoice: string
  logoConceptName: string
  logoConceptDescription: string
  logoSymbolIdea: string
  primaryColors: string[]
  logoKeywords: string[]
  bannerHeadline: string
  bannerSubheadline: string
  bannerCta: string
  bannerTheme: string
  flyerTitle: string
  flyerSubtitle: string
  flyerBody: string
  flyerCta: string
  flyerHighlights: string[]
  posterHeadline: string
  posterTagline: string
  posterVisualDirection: string
  posterCallout: string
  copyHeadlines: string[]
  copySocialCaptions: string[]
  copyEmailSubject: string
  copyEmailBody: string
  copyCtas: string[]
  copyAdCopy: string
  // Website
  websiteHtml?: string
  websiteSections?: Array<{ title: string; body: string }>
  _logoImageUri?: string
  finalLogoUri?: string
  logoImageUri?: string
  logoUrl?: string
  imageDataUri?: string
  imageUrl?: string
  finalPosterUrl?: string
  previewImageUrl?: string
  imageGenerated?: boolean
  // Business Graphics (AI-generated)
  graphicsPrompts?: Array<{ type: string; prompt: string; description: string }>
  // Business Strategy (Sonnet-generated)
  strategy?: {
    executiveSummary: string
    missionStatement?: string
    visionStatement?: string
    goals: string[]
    swot: {
      strengths: string[]
      weaknesses: string[]
      opportunities: string[]
      threats: string[]
    }
    roadmap: Array<{ phase: string; duration: string; milestones: string[] }>
    kpis: Array<{ metric: string; target: string; timeline?: string }>
    goToMarket: string
    competitiveAdvantage?: string
    revenueModel?: string
    marketingChannels?: string[]
    riskMitigation?: Array<{ risk: string; mitigation: string }>
  }
  // Content Calendar (Sonnet-generated)
  contentCalendar?: {
    strategy: string
    contentPillars?: string[]
    months: Array<{
      month: string
      theme: string
      focus?: string
      posts: Array<{
        week: number
        platform: string
        type: string
        topic?: string
        caption: string
        hashtags: string[]
        bestTime?: string
      }>
    }>
    growthTips?: string[]
  }
}

type BizTab = 'logo' | 'graphics' | 'copy' | 'website' | 'images' | 'strategy' | 'calendar'
type BizFormTab = 'generate' | 'details' | 'style'
type BizTone = 'bold' | 'professional' | 'playful' | 'luxury'

const BIZ_STEPS = ['Analysing', 'Concepting', 'Crafting', 'Polishing', 'Ready']

const BIZ_TAB_META: Record<BizTab, { label: string; icon: string }> = {
  logo:         { label: 'Logo',              icon: 'Lo' },
  graphics:     { label: 'Biz Graphics',      icon: 'Gr' },
  copy:         { label: 'Copy',              icon: 'Co' },
  website:      { label: 'Website',           icon: 'We' },
  images:       { label: 'Brand Images',      icon: 'Im' },
  strategy:     { label: 'Business Strategy', icon: 'St' },
  calendar:     { label: 'Content Calendar',  icon: '▤' },
}


function GeneratedAssetAIEditPanel({ generationId, assetType, data, accent, defaultOpen = false, onUpdated }: {
  generationId: string | null
  assetType: BizTab
  data: BusinessOutput
  accent: string
  defaultOpen?: boolean
  onUpdated: (next: BusinessOutput) => void
}) {
  const supported = assetType === 'logo' || assetType === 'copy' || assetType === 'strategy' || assetType === 'calendar' || assetType === 'website'
  const [open, setOpen] = React.useState(defaultOpen)
  const [editPrompt, setEditPrompt] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (defaultOpen) setOpen(true)
  }, [defaultOpen, generationId, assetType])

  if (!generationId || !supported) return null

  const label = assetType === 'logo'
    ? 'Logo'
    : assetType === 'copy'
      ? 'Copy'
      : assetType === 'strategy'
        ? 'Strategy'
        : assetType === 'calendar'
          ? 'Calendar'
          : 'Website Content'

  async function applyEdit() {
    if (!editPrompt.trim() || saving || !generationId) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      if (assetType === 'logo') {
        const res = await fetch('/api/generate-logo-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: data.companyName,
            industry: data.industry,
            logoConceptName: data.logoConceptName,
            symbolIdea: data.logoSymbolIdea,
            primaryColors: data.primaryColors,
            tone: data.brandVoice,
            editPrompt: editPrompt.trim(),
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json.imageDataUri) throw new Error(json.error || 'Logo edit failed. Please try again.')
        const logoPatch = {
          _logoImageUri: json.imageDataUri,
          finalLogoUri: json.imageDataUri,
          imageDataUri: json.imageDataUri,
          imageGenerated: true,
        }
        await fetch('/api/generate/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generationId, outputData: logoPatch }),
        }).catch(() => null)
        onUpdated({ ...data, ...logoPatch })
        setMessage('Logo updated and saved to this generated asset.')
        setEditPrompt('')
        return
      }

      const res = await fetch('/api/asset-ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId, assetType, editPrompt: editPrompt.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.outputData) throw new Error(json.error || 'AI edit failed. Please try again.')
      onUpdated(json.outputData as BusinessOutput)
      setMessage(json.summary || 'Asset updated and saved.')
      setEditPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI edit failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ margin: '16px clamp(16px,4vw,28px) 22px', border: `1px solid ${accent}35`, background: `linear-gradient(135deg, ${accent}10, transparent)`, borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '12px 15px', background: 'transparent', border: 'none', color: accent, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
      >
        <span>✦ AI Edit {label}</span>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 15px 15px', borderTop: `1px solid ${accent}18` }}>
          <textarea
            value={editPrompt}
            onChange={e => setEditPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); applyEdit() } }}
            placeholder={assetType === 'logo'
              ? 'Example: Make the logo sharper, more luxury, with a cleaner symbol and less text.'
              : 'Example: Make this more premium, clearer, shorter, and stronger for business owners.'}
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', marginTop: 12, padding: '11px 12px', background: 'var(--bg)', border: `1px solid ${accent}35`, color: 'var(--cream)', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.6, outline: 'none', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>Edits save back to this generated asset.</div>
            <button
              onClick={applyEdit}
              disabled={saving || !editPrompt.trim()}
              style={{ padding: '9px 14px', background: accent, color: '#000', border: 'none', borderRadius: 999, fontSize: 9, letterSpacing: '0.13em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 800, cursor: saving || !editPrompt.trim() ? 'default' : 'pointer', opacity: saving || !editPrompt.trim() ? 0.6 : 1 }}
            >{saving ? 'Applying…' : 'Apply AI Edit →'}</button>
          </div>
          {message && <div style={{ marginTop: 9, fontSize: 10, color: '#27AE60', fontFamily: "'DM Mono', monospace" }}>{message}</div>}
          {error && <div style={{ marginTop: 9, fontSize: 10, color: '#f5a0a0', fontFamily: "'DM Mono', monospace" }}>{error}</div>}
        </div>
      )}
    </div>
  )
}

// ── Logo Concept Preview ───────────────────────────────────────────────────
// ── buildLogoSymbol, generates an abstract SVG mark from the AI's symbolIdea ──
function buildLogoSymbol(idea: string, c1: string, c2: string, size = 80): React.ReactNode {
  const t = idea.toLowerCase()
  const half = size / 2
  // Geometric symbol picker based on idea keywords
  if (/triangle|pyramid|apex|arrow|peak|mountain/.test(t)) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <polygon points={`${half},${size * 0.12} ${size * 0.9},${size * 0.88} ${size * 0.1},${size * 0.88}`} fill={c1} opacity="0.92" />
        <polygon points={`${half},${size * 0.3} ${size * 0.72},${size * 0.72} ${size * 0.28},${size * 0.72}`} fill={c2} opacity="0.6" />
        <line x1={half} y1={size * 0.12} x2={half} y2={size * 0.88} stroke={c1} strokeWidth="1.5" opacity="0.3" />
      </svg>
    )
  }
  if (/circle|sphere|orbit|globe|loop|round|ring/.test(t)) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <circle cx={half} cy={half} r={size * 0.36} stroke={c1} strokeWidth="3" />
        <circle cx={half} cy={half} r={size * 0.22} fill={c1} opacity="0.85" />
        <circle cx={half} cy={half} r={size * 0.36} stroke={c2} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
        <line x1={size * 0.1} y1={half} x2={size * 0.9} y2={half} stroke={c2} strokeWidth="1.2" opacity="0.4" />
      </svg>
    )
  }
  if (/diamond|gem|crystal|prism|facet/.test(t)) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <polygon points={`${half},${size * 0.08} ${size * 0.92},${half} ${half},${size * 0.92} ${size * 0.08},${half}`} fill={c1} opacity="0.9" />
        <polygon points={`${half},${size * 0.28} ${size * 0.72},${half} ${half},${size * 0.72} ${size * 0.28},${half}`} fill={c2} opacity="0.55" />
        <line x1={half} y1={size * 0.08} x2={half} y2={size * 0.92} stroke="#fff" strokeWidth="1" opacity="0.25" />
        <line x1={size * 0.08} y1={half} x2={size * 0.92} y2={half} stroke="#fff" strokeWidth="1" opacity="0.25" />
      </svg>
    )
  }
  if (/wave|flow|fluid|curve|arc|path/.test(t)) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <path d={`M ${size*0.1} ${size*0.6} Q ${size*0.35} ${size*0.1} ${half} ${size*0.5} Q ${size*0.65} ${size*0.9} ${size*0.9} ${size*0.4}`} stroke={c1} strokeWidth="4" strokeLinecap="round" />
        <path d={`M ${size*0.1} ${size*0.75} Q ${size*0.35} ${size*0.25} ${half} ${size*0.65} Q ${size*0.65} ${size*0.95} ${size*0.9} ${size*0.55}`} stroke={c1} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
        <circle cx={size*0.1} cy={size*0.6} r="4" fill={c1} />
        <circle cx={size*0.9} cy={size*0.4} r="4" fill={c2} />
      </svg>
    )
  }
  if (/hexagon|hex|cell|grid|modular|structure/.test(t)) {
    const hx = (cx: number, cy: number, r: number) => {
      return Array.from({length: 6}, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
      }).join(' ')
    }
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <polygon points={hx(half, half, size*0.42)} fill={c1} opacity="0.85" />
        <polygon points={hx(half, half, size*0.26)} fill={c2} opacity="0.7" />
        <polygon points={hx(half, half, size*0.42)} stroke={c2} strokeWidth="1.5" fill="none" opacity="0.6" />
      </svg>
    )
  }
  if (/cross|plus|four|intersection|connect|junction/.test(t)) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <rect x={size*0.38} y={size*0.1} width={size*0.24} height={size*0.8} rx="4" fill={c1} opacity="0.9" />
        <rect x={size*0.1} y={size*0.38} width={size*0.8} height={size*0.24} rx="4" fill={c1} opacity="0.9" />
        <circle cx={half} cy={half} r={size*0.12} fill={c2} />
      </svg>
    )
  }
  if (/star|spark|flash|radiat|burst|shine/.test(t)) {
    const pts = Array.from({length: 8}, (_, i) => {
      const a = (Math.PI / 4) * i
      const r = i % 2 === 0 ? size*0.42 : size*0.2
      return `${half + r * Math.cos(a - Math.PI/2)},${half + r * Math.sin(a - Math.PI/2)}`
    }).join(' ')
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <polygon points={pts} fill={c1} opacity="0.88" />
        <circle cx={half} cy={half} r={size*0.12} fill={c2} />
      </svg>
    )
  }
  if (/square|box|grid|block|tile|rectangle/.test(t)) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <rect x={size*0.12} y={size*0.12} width={size*0.35} height={size*0.35} rx="4" fill={c1} opacity="0.9" />
        <rect x={size*0.53} y={size*0.12} width={size*0.35} height={size*0.35} rx="4" fill={c1} opacity="0.55" />
        <rect x={size*0.12} y={size*0.53} width={size*0.35} height={size*0.35} rx="4" fill={c1} opacity="0.55" />
        <rect x={size*0.53} y={size*0.53} width={size*0.35} height={size*0.35} rx="4" fill={c2} opacity="0.75" />
      </svg>
    )
  }
  if (/infinity|loop|continuous|endless|mobius/.test(t)) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        <path d={`M ${size*0.2} ${half} C ${size*0.2} ${size*0.2} ${size*0.45} ${size*0.2} ${half} ${half} C ${size*0.55} ${size*0.8} ${size*0.8} ${size*0.8} ${size*0.8} ${half} C ${size*0.8} ${size*0.2} ${size*0.55} ${size*0.2} ${half} ${half} C ${size*0.45} ${size*0.8} ${size*0.2} ${size*0.8} ${size*0.2} ${half} Z`} stroke={c1} strokeWidth="4" strokeLinecap="round" />
        <circle cx={half} cy={half} r="5" fill={c2} />
      </svg>
    )
  }
  // Default: abstract interlocking arcs
  const initials = '' // not used here
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <path d={`M ${size*0.15} ${half} A ${size*0.35} ${size*0.35} 0 0 1 ${size*0.85} ${half}`} stroke={c1} strokeWidth="4" strokeLinecap="round" />
      <path d={`M ${size*0.85} ${half} A ${size*0.35} ${size*0.35} 0 0 1 ${size*0.15} ${half}`} stroke={c2} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      <circle cx={size*0.15} cy={half} r="5" fill={c1} />
      <circle cx={size*0.85} cy={half} r="5" fill={c2} />
      <circle cx={half} cy={size*0.15} r="3" fill={c1} opacity="0.5" />
      <circle cx={half} cy={size*0.85} r="3" fill={c2} opacity="0.5" />
    </svg>
  )
}

// ── Shared download helper (uses html2canvas via dynamic import) ──────────────
async function downloadElementAsPng(el: HTMLElement, filename: string) {
  try {
    // @ts-ignore, html2canvas loaded at runtime
    const h2c = (await import('html2canvas')).default
    const canvas = await h2c(el, { scale: 2, useCORS: true, backgroundColor: null, logging: false })
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch {
    // Fallback: SVG to PNG via canvas
    alert('Download failed, try right-clicking the preview and saving the image.')
  }
}

function DownloadBar({ title, refEl, accent, extraButtons, hideDefaultDownload = false }: {
  title: string
  refEl: React.RefObject<HTMLDivElement>
  accent: string
  extraButtons?: React.ReactNode
  hideDefaultDownload?: boolean
}) {
  const [saving, setSaving] = React.useState(false)
  async function handlePng() {
    if (!refEl.current) return
    setSaving(true)
    await downloadElementAsPng(refEl.current, `${title.toLowerCase().replace(/\s+/g, '-')}.png`)
    setSaving(false)
  }
  return (
    <div className="biz-download-bar">
      <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{title}</span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {extraButtons}
        {!hideDefaultDownload && (
          <button className="biz-download-btn primary" onClick={handlePng} disabled={saving}>
            {saving ? '…' : '⬇'} {saving ? 'Saving' : 'PNG'}
          </button>
        )}
      </div>
    </div>
  )
}


// ── Business Portfolio Preview ────────────────────────────────────────────────
// ── BizStrategyPreview ───────────────────────────────────────────────────────
function BizStrategyPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const s = data.strategy
  const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" }
  const [expandedSwot, setExpandedSwot] = React.useState<string | null>('strengths')

  if (!s) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, flexDirection: 'column', gap: 12 }}>
      <div style={{ marginBottom: 8, opacity: 0.4 }}><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 2l8 14H8L16 2zM16 30l-8-14h16L16 30z" stroke="var(--muted)" strokeWidth="1.3" strokeLinejoin="round"/></svg></div>
      <div style={{ ...mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>No strategy generated yet</div>
    </div>
  )

  const swotColors: Record<string, string> = {
    strengths: '#2E7D52', weaknesses: '#C0392B', opportunities: '#2980B9', threats: '#E2811A',
  }
  const swotLabels: Record<string, string> = {
    strengths: 'Strengths', weaknesses: 'Weaknesses', opportunities: 'Opportunities', threats: 'Threats',
  }

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Executive Summary */}
      <div style={{ background: 'var(--surface)', border: `1px solid ${accent}30`, borderLeft: `3px solid ${accent}`, borderRadius: 'var(--radius)', padding: '16px 18px' }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>Executive Summary</div>
        <div style={{ fontSize: 12, color: 'var(--cream)', lineHeight: 1.7 }}>{s.executiveSummary}</div>
      </div>

      {/* Mission + Vision */}
      {(s.missionStatement || s.visionStatement) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {s.missionStatement && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px' }}>
              <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Mission</div>
              <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic' }}>{s.missionStatement}</div>
            </div>
          )}
          {s.visionStatement && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px' }}>
              <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Vision</div>
              <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.6, fontStyle: 'italic' }}>{s.visionStatement}</div>
            </div>
          )}
        </div>
      )}

      {/* Goals */}
      <div>
        <div style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Strategic Goals</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {s.goals?.map((g, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
              <span style={{ ...mono, fontSize: 9, color: accent, flexShrink: 0, marginTop: 1 }}>0{i + 1}</span>
              <span style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.5 }}>{g}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SWOT */}
      <div>
        <div style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>SWOT Analysis</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(['strengths', 'weaknesses', 'opportunities', 'threats'] as const).map(key => (
            <div key={key} style={{ background: 'var(--surface)', border: `1px solid ${swotColors[key]}40`, borderTop: `2px solid ${swotColors[key]}`, borderRadius: 'var(--radius)', padding: '12px', cursor: 'pointer' }}
              onClick={() => setExpandedSwot(expandedSwot === key ? null : key)}>
              <div style={{ ...mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: swotColors[key], marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {swotLabels[key]}
                <span style={{ fontSize: 10, opacity: 0.6 }}>{expandedSwot === key ? '−' : '+'}</span>
              </div>
              {expandedSwot === key && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {(s.swot[key] || []).map((item, i) => (
                    <li key={i} style={{ fontSize: 10, color: 'var(--text)', lineHeight: 1.5, paddingLeft: 10, borderLeft: `2px solid ${swotColors[key]}40` }}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div>
        <div style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Roadmap</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {s.roadmap?.map((phase, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: `${accent}20`, border: `1px solid ${accent}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono, fontSize: 10, color: accent }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--cream)', fontWeight: 500, marginBottom: 2 }}>{phase.phase}</div>
                <div style={{ ...mono, fontSize: 9, color: accent, letterSpacing: '0.08em', marginBottom: 8 }}>{phase.duration}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {phase.milestones.map((m, j) => (
                    <li key={j} style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span style={{ color: accent, flexShrink: 0, marginTop: 2 }}>✓</span>{m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      {s.kpis && s.kpis.length > 0 && (
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Key Performance Indicators</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8 }}>
            {s.kpis.map((kpi, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px' }}>
                <div style={{ fontSize: 11, color: 'var(--cream)', fontWeight: 500, marginBottom: 4 }}>{kpi.metric}</div>
                <div style={{ ...mono, fontSize: 13, color: accent, fontWeight: 700, marginBottom: 2 }}>{kpi.target}</div>
                {kpi.timeline && <div style={{ fontSize: 9, color: 'var(--muted)', ...mono }}>{kpi.timeline}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GTM + Competitive Advantage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {s.goToMarket && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px' }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Go-to-Market</div>
            <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.6 }}>{s.goToMarket}</div>
          </div>
        )}
        {s.competitiveAdvantage && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px' }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Competitive Advantage</div>
            <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.6 }}>{s.competitiveAdvantage}</div>
          </div>
        )}
      </div>

      {/* Risk Mitigation */}
      {s.riskMitigation && s.riskMitigation.length > 0 && (
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Risk Mitigation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {s.riskMitigation.map((r, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: '#e74c3c', ...mono, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Risk</div>
                  <div style={{ fontSize: 11, color: 'var(--text)' }}>{r.risk}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: '#2E7D52', ...mono, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Mitigation</div>
                  <div style={{ fontSize: 11, color: 'var(--text)' }}>{r.mitigation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── BizCalendarPreview ───────────────────────────────────────────────────────
function BizCalendarPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const cal = data.contentCalendar
  const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" }
  const [activeMonth, setActiveMonth] = React.useState(0)
  const [activePost, setActivePost] = React.useState<number | null>(null)
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null)

  const platformColors: Record<string, string> = {
    instagram: '#E1306C', linkedin: '#0077B5', twitter: '#1DA1F2', facebook: '#1877F2',
  }
  const platformIcons: Record<string, string> = {
    instagram: '◉', linkedin: '▣', twitter: '◆', facebook: '■',
  }

  async function copyCaption(caption: string, idx: number) {
    await navigator.clipboard.writeText(caption)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  if (!cal) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320, flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 32, opacity: 0.4 }}>▤</div>
      <div style={{ ...mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>No calendar generated yet</div>
    </div>
  )

  const month = cal.months?.[activeMonth]

  return (
    <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Strategy */}
      <div style={{ background: 'var(--surface)', border: `1px solid ${accent}30`, borderLeft: `3px solid ${accent}`, borderRadius: 'var(--radius)', padding: '14px 16px' }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>Content Strategy</div>
        <div style={{ fontSize: 12, color: 'var(--cream)', lineHeight: 1.7 }}>{cal.strategy}</div>
      </div>

      {/* Content Pillars */}
      {cal.contentPillars && cal.contentPillars.length > 0 && (
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Content Pillars</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {cal.contentPillars.map((p, i) => (
              <span key={i} style={{ padding: '4px 10px', background: `${accent}15`, border: `1px solid ${accent}40`, borderRadius: 'var(--radius)', fontSize: 10, color: accent, ...mono }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Month tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: 0 }}>
        {cal.months?.map((m, i) => (
          <button key={i} onClick={() => { setActiveMonth(i); setActivePost(null) }} style={{
            padding: '8px 14px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
            ...mono, color: activeMonth === i ? accent : 'var(--muted)',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeMonth === i ? `2px solid ${accent}` : '2px solid transparent',
            marginBottom: -1, transition: 'all 0.15s',
          }}>
            {m.month}
          </button>
        ))}
      </div>

      {/* Month content */}
      {month && (
        <>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: 'var(--cream)', fontWeight: 500, marginBottom: 4 }}>{month.theme}</div>
            {month.focus && <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{month.focus}</div>}
          </div>

          {/* Posts grouped by week */}
          {[1, 2, 3, 4].map(week => {
            const weekPosts = month.posts?.filter(p => p.week === week) || []
            if (!weekPosts.length) return null
            return (
              <div key={week}>
                <div style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                  Week {week}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {weekPosts.map((post, pi) => {
                    const postIdx = activeMonth * 100 + week * 10 + pi
                    const isOpen = activePost === postIdx
                    const pColor = platformColors[post.platform] || accent
                    const pIcon = platformIcons[post.platform] || '◆'
                    return (
                      <div key={pi} style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderLeft: `3px solid ${pColor}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                        <div onClick={() => setActivePost(isOpen ? null : postIdx)} style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: pColor, flexShrink: 0 }}>{pIcon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                              <span style={{ ...mono, fontSize: 9, color: pColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{post.platform}</span>
                              <span style={{ fontSize: 9, color: 'var(--muted)', ...mono }}>·</span>
                              <span style={{ fontSize: 9, color: 'var(--muted2)', ...mono }}>{post.type}</span>
                              {post.bestTime && <span style={{ fontSize: 9, color: 'var(--muted2)', ...mono, marginLeft: 'auto' }}>⏱ {post.bestTime}</span>}
                            </div>
                            {post.topic && <div style={{ fontSize: 11, color: 'var(--text)', lineHeight: 1.4 }}>{post.topic}</div>}
                          </div>
                          <span style={{ ...mono, fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{isOpen ? '−' : '+'}</span>
                        </div>
                        {isOpen && (
                          <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border)' }}>
                            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--cream)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{post.caption}</div>
                            {post.hashtags && post.hashtags.length > 0 && (
                              <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {post.hashtags.map((h, hi) => (
                                  <span key={hi} style={{ fontSize: 10, color: pColor, ...mono }}>{h}</span>
                                ))}
                              </div>
                            )}
                            <button onClick={() => copyCaption(post.caption + '\n\n' + (post.hashtags || []).join(' '), postIdx)} style={{
                              marginTop: 10, padding: '6px 12px', background: `${pColor}18`,
                              border: `1px solid ${pColor}40`, color: pColor, fontSize: 9,
                              letterSpacing: '0.1em', textTransform: 'uppercase', ...mono,
                              cursor: 'pointer', borderRadius: 'var(--radius)',
                            }}>
                              {copiedIdx === postIdx ? '✓ Copied' : '⧉ Copy Caption'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Growth Tips */}
      {cal.growthTips && cal.growthTips.length > 0 && (
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Growth Tips</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cal.growthTips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 11, color: 'var(--text)', lineHeight: 1.5, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 36 Website Samples catalogue ─────────────────────────────────────────────
const WEBSITE_SAMPLES: Array<{ id: string; label: string; emoji: string; category: string }> = [
  { id: 'app-development',     label: 'App Dev Studio',        emoji: '📱', category: 'Tech' },
  { id: 'architect',           label: 'Architecture Firm',     emoji: '🏛', category: 'Design' },
  { id: 'bakery',              label: 'Artisan Bakery',        emoji: '🥐', category: 'Food' },
  { id: 'car-detailing',       label: 'Car Detailing',         emoji: '🚗', category: 'Auto' },
  { id: 'cloud-kitchen',       label: 'Cloud Kitchen',         emoji: '🍱', category: 'Food' },
  { id: 'coffee-brand',        label: 'Coffee Brand',          emoji: '☕', category: 'Food' },
  { id: 'construction',        label: 'Construction Co.',      emoji: '🏗', category: 'Industry' },
  { id: 'cosmetics',           label: 'Cosmetics Brand',       emoji: '💄', category: 'Beauty' },
  { id: 'cybersecurity',       label: 'Cybersecurity Firm',    emoji: '🔐', category: 'Tech' },
  { id: 'dental-clinic',       label: 'Dental Clinic',         emoji: '🦷', category: 'Health' },
  { id: 'education-academy',   label: 'Education Academy',     emoji: '🎓', category: 'Edu' },
  { id: 'event-planner',       label: 'Event Planner',         emoji: '🎉', category: 'Events' },
  { id: 'fashion-brand',       label: 'Fashion Brand',         emoji: '👗', category: 'Fashion' },
  { id: 'financial-advisor',   label: 'Financial Advisor',     emoji: '📊', category: 'Finance' },
  { id: 'fitness-coach',       label: 'Fitness Coach',         emoji: '💪', category: 'Health' },
  { id: 'furniture',           label: 'Furniture Studio',      emoji: '🛋', category: 'Design' },
  { id: 'gaming-studio',       label: 'Gaming Studio',         emoji: '🎮', category: 'Tech' },
  { id: 'hotel-resort',        label: 'Hotel & Resort',        emoji: '🏨', category: 'Hospitality' },
  { id: 'interior-design',     label: 'Interior Design',       emoji: '🪴', category: 'Design' },
  { id: 'jewellery',           label: 'Fine Jewellery',        emoji: '💎', category: 'Luxury' },
  { id: 'law-firm',            label: 'Law Firm',              emoji: '⚖️', category: 'Legal' },
  { id: 'logistics',           label: 'Logistics Co.',         emoji: '🚚', category: 'Industry' },
  { id: 'luxury-restaurant',   label: 'Luxury Restaurant',     emoji: '🍽', category: 'Food' },
  { id: 'marketing-agency',    label: 'Marketing Agency',      emoji: '📣', category: 'Agency' },
  { id: 'medical-spa',         label: 'Medical Spa',           emoji: '🧖', category: 'Health' },
  { id: 'music-artist',        label: 'Music Artist',          emoji: '🎵', category: 'Creative' },
  { id: 'ngo',                 label: 'NGO / Nonprofit',       emoji: '🤝', category: 'Social' },
  { id: 'pet-care',            label: 'Pet Care Clinic',       emoji: '🐾', category: 'Health' },
  { id: 'photographer',        label: 'Photographer',          emoji: '📷', category: 'Creative' },
  { id: 'real-estate',         label: 'Real Estate',           emoji: '🏠', category: 'Property' },
  { id: 'saas-startup',        label: 'SaaS Startup',          emoji: '', category: 'Tech' },
  { id: 'salon',               label: 'Beauty Salon',          emoji: '💅', category: 'Beauty' },
  { id: 'solar-company',       label: 'Solar Company',         emoji: '☀️', category: 'Industry' },
  { id: 'travel-agency',       label: 'Travel Agency',         emoji: '✈️', category: 'Travel' },
  { id: 'wedding-photography', label: 'Wedding Photography',   emoji: '💍', category: 'Creative' },
  { id: 'yoga-studio',         label: 'Yoga Studio',           emoji: '🧘', category: 'Health' },
  // ── 6 additional samples ──────────────────────────────────────────────────
  { id: 'blackapex',           label: 'Black Apex Corp.',      emoji: '🖤', category: 'Agency' },
  { id: 'arka-automobile',     label: 'Automobile Showroom',   emoji: '🚘', category: 'Auto' },
  { id: 'flux-mobile',         label: 'Mobile App Brand',      emoji: '📲', category: 'Tech' },
  { id: 'lumiere-cosmetics',   label: 'Lumière Cosmetics',     emoji: '✨', category: 'Beauty' },
  { id: 'meridian-hospital',   label: 'Hospital & Clinic',     emoji: '🏥', category: 'Health' },
  { id: 'noir-clothing',       label: 'Noir Clothing Brand',   emoji: '🧥', category: 'Fashion' },
]
const WS_CATEGORIES = ['All', 'Tech', 'Food', 'Health', 'Design', 'Beauty', 'Finance', 'Creative', 'Industry', 'Legal', 'Luxury', 'Hospitality', 'Fashion', 'Events', 'Social', 'Travel', 'Agency', 'Edu', 'Property', 'Auto']

// ── TemplateAiEditBar, standalone AI edit bar for template preview ──────────
function TemplateAiEditBar({ html, accent, savedId, sampleId, onHtmlChange }: {
  html: string; accent: string; savedId: string | null; sampleId: string | null;
  onHtmlChange: (h: string) => void
}) {
  const [prompt, setPrompt] = React.useState('')
  const [editing, setEditing] = React.useState(false)
  const [editError, setEditError] = React.useState('')

  async function applyEdit() {
    if (!prompt.trim() || editing) return
    setEditing(true); setEditError('')
    try {
      const res = await fetch('/api/website-ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentHtml: html, editPrompt: prompt }),
      })
      const j = await res.json()
      if (j.updatedHtml || j.html) {
        const newHtml = j.updatedHtml || j.html
        onHtmlChange(newHtml)
        setPrompt('')
        // Persist updated HTML to DB if saved
        if (savedId) {
          await fetch(`/api/user-websites/${savedId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ htmlContent: newHtml }),
          })
        }
      } else if (j.missingKey) {
        console.error('[website-ai-edit] missing API key')
        setEditError('Sorry, unable to apply edits right now.')
      } else { setEditError('Could not apply edit. Please try again.') }
    } catch { setEditError('Could not apply edit. Please try again.') }
    setEditing(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) applyEdit() }}
        placeholder="e.g. Change hero text, make it blue, add a contact section…"
        style={{ flex: 1, background: 'var(--surface)', border: `1px solid ${accent}40`, color: 'var(--cream)', padding: '7px 12px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", borderRadius: 'var(--radius)', outline: 'none' }}
      />
      <button onClick={applyEdit} disabled={editing || !prompt.trim()} style={{ padding: '7px 16px', background: accent, color: '#000', border: 'none', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 700, cursor: editing ? 'not-allowed' : 'pointer', borderRadius: 'var(--radius)', opacity: editing ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {editing ? '…Editing' : 'Apply'}
      </button>
      {editError && <span style={{ fontSize: 10, color: '#c0392b', fontFamily: "'DM Mono', monospace" }}>{editError}</span>}
    </div>
  )
}

function BizWebsitePreview({ data, accent, genId, initialHtml, initialSampleId, initialSavedId }: { data: BusinessOutput; accent: string; genId: string | null; initialHtml?: string; initialSampleId?: string | null; initialSavedId?: string | null }) {
  const c1 = data.primaryColors?.[0] ?? accent
  const [domainInput, setDomainInput] = React.useState('')
  const [domainStatus, setDomainStatus] = React.useState<'idle'|'connecting'|'connected'|'error'>('idle')
  const [domainMsg, setDomainMsg] = React.useState('')
  const [editMode, setEditMode] = React.useState(false)
  const [editPrompt, setEditPrompt] = React.useState('')
  const [editing, setEditing] = React.useState(false)
  const [websiteHtml, setWebsiteHtml] = React.useState<string>(data.websiteHtml || initialHtml || '')
  const [editHistory, setEditHistory] = React.useState<string[]>([])
  const iframeRef = React.useRef<HTMLIFrameElement>(null)

  // Sync websiteHtml from props when newly generated (data.websiteHtml is updated externally)
  React.useEffect(() => {
    if (data.websiteHtml && data.websiteHtml !== websiteHtml) {
      setWebsiteHtml(data.websiteHtml)
    }
  }, [data.websiteHtml]) // eslint-disable-line react-hooks/exhaustive-deps

  // FIX: sync when initialHtml prop arrives async (e.g. ?websiteId= fetch resolves after mount)
  React.useEffect(() => {
    if (initialHtml && initialHtml !== websiteHtml) {
      setWebsiteHtml(initialHtml)
    }
  }, [initialHtml]) // eslint-disable-line react-hooks/exhaustive-deps

  // FIX: Blob URL approach — converts HTML string → real same-origin src= URL.
  // Avoids srcDoc entirely: no null-origin, no sandbox escape, Google Fonts work.
  const [blobPreviewUrl, setBlobPreviewUrl] = React.useState<string>('')
  React.useEffect(() => {
    // If we have a savedId, the iframe will use /api/website-preview/{id} instead of blob.
    // Only create a blob for the unsaved/just-generated case.
    const html = websiteHtml || data.websiteHtml || ''
    if (!html) { setBlobPreviewUrl(''); return }
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    setBlobPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [websiteHtml, data.websiteHtml]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save to My Websites
  const [saveStatus, setSaveStatus] = React.useState<'idle'|'saving'|'saved'|'error'>(initialSavedId ? 'saved' : 'idle')
  const [savedId, setSavedId] = React.useState<string|null>(initialSavedId ?? null)
  const [websiteStats, setWebsiteStats] = React.useState<{ views: number; visitors: number; slug: string | null; isPublished: boolean; avgDurationSec?: number; trend?: Array<{date:string;views:number;visitors:number}>; devices?: Array<{name:string;count:number}>; browsers?: Array<{name:string;count:number}> } | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false)
  const [copiedLink, setCopiedLink] = React.useState(false)
  const [gaId, setGaId] = React.useState('')
  const [gscTag, setGscTag] = React.useState('')
  const [seoSaving, setSeoSaving] = React.useState(false)
  const [seoDone, setSeoDone] = React.useState(false)

  // Fetch real analytics when savedId becomes available
  React.useEffect(() => {
    if (!savedId) return
    fetch(`/api/user-websites/${savedId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.website) return
        const slug = d.website.slug ?? null
        const isPublished = d.website.isPublished ?? false
        if (slug) {
          setAnalyticsLoading(true)
          fetch(`/api/user-websites/${savedId}/analytics?days=9999`)
            .then(r => r.ok ? r.json() : null)
            .then(a => {
              setWebsiteStats({
                views: a?.summary?.totalViews ?? 0,
                visitors: a?.summary?.uniqueSessions ?? 0,
                avgDurationSec: a?.summary?.avgDurationSec ?? 0,
                slug,
                isPublished,
                trend: a?.trend ?? [],
                devices: a?.devices ?? [],
                browsers: a?.browsers ?? [],
              })
            })
            .catch(() => setWebsiteStats({ views: 0, visitors: 0, slug, isPublished }))
            .finally(() => setAnalyticsLoading(false))
        } else {
          setWebsiteStats({ views: 0, visitors: 0, slug, isPublished })
        }
      }).catch(() => {})
  }, [savedId])

  // Dashboard tabs
  type WsDashTab = 'preview' | 'domain' | 'analytics' | 'seo' | 'data'
  const [dashTab, setDashTab] = React.useState<WsDashTab>('preview')

  // Sample selection
  const [selectedSample, setSelectedSample] = React.useState<string | null>(initialSampleId ?? null)
  const [samplePreviewId, setSamplePreviewId] = React.useState<string | null>(initialSampleId ?? null)
  const [sampleCatFilter, setSampleCatFilter] = React.useState('All')

  const hasWebsite = !!(websiteHtml || data.websiteHtml || selectedSample)

  // Build default website HTML from brand data if not pre-generated
  const defaultHtml = React.useMemo(() => {
    if (websiteHtml) return websiteHtml
    // Guard: if no real brand data yet, return empty placeholder so iframe doesn't render "null"
    if (!data?.companyName) return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;background:#09090a;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:rgba(255,255,255,0.3);font-size:13px;}</style></head><body><span>Website preview will appear here once generation completes.</span></body></html>`
    const bg = '#09090a', fg = '#f4f3ef', red = c1
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${data.companyName}</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:${bg};color:${fg};font-family:'DM Sans',sans-serif;overflow-x:hidden}
nav{position:fixed;top:0;left:0;right:0;z-index:100;background:${bg};border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;padding:0 40px;height:54px}
.logo{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:3px;color:${fg}}
.logo span{color:${red}}
nav ul{display:flex;gap:28px;list-style:none}nav ul a{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);text-decoration:none;transition:color .2s}
nav ul a:hover{color:${fg}}
.btn{background:${red};color:${fg};padding:9px 22px;font-size:10px;letter-spacing:2px;text-transform:uppercase;border:none;cursor:pointer;transition:opacity .2s;text-decoration:none;display:inline-block}
.btn:hover{opacity:.8}
.btn-ghost{background:transparent;color:${fg};border:1px solid rgba(255,255,255,0.2);padding:9px 22px;font-size:10px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;display:inline-block;transition:border-color .2s}
.btn-ghost:hover{border-color:${fg}}
.hero{padding-top:120px;min-height:100vh;display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid rgba(255,255,255,0.07)}
.hero-left{padding:80px 56px;display:flex;flex-direction:column;justify-content:center}
.hero-h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(56px,7vw,96px);line-height:.92;letter-spacing:1px;margin-bottom:28px}
.hero-h1 span{color:${red}}
.hero-sub{font-size:14px;color:rgba(255,255,255,0.55);line-height:1.75;max-width:420px;margin-bottom:36px}
.hero-actions{display:flex;gap:12px;flex-wrap:wrap}
.hero-right{background:rgba(255,255,255,0.02);border-left:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:center;padding:40px}
.hero-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:40px;width:100%;max-width:380px}
.hero-card-label{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${red};margin-bottom:16px}
.hero-card-title{font-family:'DM Serif Display',serif;font-size:clamp(20px,2.5vw,28px);line-height:1.3;margin-bottom:12px}
.hero-card-body{font-size:12px;color:rgba(255,255,255,0.45);line-height:1.7}
section{padding:80px 56px}
.sec-eye{font-size:9px;letter-spacing:4px;text-transform:uppercase;color:${red};margin-bottom:14px;display:flex;align-items:center;gap:10px}
.sec-eye::before{content:'';display:block;width:20px;height:1px;background:${red}}
.sec-h2{font-family:'Bebas Neue',sans-serif;font-size:clamp(40px,5vw,68px);line-height:.93;letter-spacing:1px;margin-bottom:12px}
.sec-sub{font-size:14px;color:rgba(255,255,255,0.45);line-height:1.75;max-width:540px}
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:48px}
.about-body{font-size:14px;color:rgba(255,255,255,0.6);line-height:1.8}
.about-stats{display:flex;flex-direction:column;gap:28px}
.stat-num{font-family:'Bebas Neue',sans-serif;font-size:52px;color:${red};line-height:1}
.stat-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-top:4px}
.services{background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.07);border-bottom:1px solid rgba(255,255,255,0.07)}
.svc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid rgba(255,255,255,0.07);margin-top:48px}
.svc-card{padding:36px 28px;border-right:1px solid rgba(255,255,255,0.07)}
.svc-card:last-child{border-right:none}
.svc-icon{font-family:'Bebas Neue',sans-serif;font-size:48px;color:rgba(255,255,255,0.05);line-height:1;margin-bottom:14px}
.svc-title{font-family:'DM Serif Display',serif;font-size:18px;margin-bottom:10px;color:${fg}}
.svc-body{font-size:12px;color:rgba(255,255,255,0.35);line-height:1.65}
.contact-sec{background:${bg};border-top:2px solid ${red}}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid rgba(255,255,255,0.07);margin-top:48px}
.contact-col{padding:48px 40px}
.contact-col:first-child{border-right:1px solid rgba(255,255,255,0.07)}
.contact-col h3{font-family:'Bebas Neue',sans-serif;font-size:36px;letter-spacing:1px;margin-bottom:10px}
.contact-col p{font-size:13px;color:rgba(255,255,255,0.4);line-height:1.7;margin-bottom:28px}
.contact-field{margin-bottom:16px}
.contact-label{display:block;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:8px}
.contact-input{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);color:${fg};padding:12px 16px;font-size:14px;font-family:'DM Sans',sans-serif;outline:none}
.contact-input:focus{border-color:rgba(255,255,255,0.25)}
footer{background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.07);padding:32px 56px;display:flex;align-items:center;justify-content:space-between}
.footer-logo{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:3px}
.footer-logo span{color:${red}}
.footer-copy{font-size:10px;color:rgba(255,255,255,0.2);letter-spacing:1px}
@media(max-width:768px){.hero{grid-template-columns:1fr}.hero-right{display:none}.about-grid{grid-template-columns:1fr}.svc-grid{grid-template-columns:1fr}.contact-grid{grid-template-columns:1fr}.svc-card{border-right:none;border-bottom:1px solid rgba(255,255,255,0.07)}}
@media(max-width:480px){nav ul{display:none}nav{padding:0 18px}section{padding:52px 20px}.hero-left{padding:0 20px}footer{padding:24px 20px;flex-direction:column;gap:10px;text-align:center}}
</style></head><body>
<nav><a href="#" class="logo">${(data.companyName || 'Brand').split(' ')[0]}<span>${(data.companyName || '').split(' ').slice(1).join(' ') || '.'}</span></a>
<ul><li><a href="#about">About</a></li><li><a href="#services">Services</a></li><li><a href="#contact">Contact</a></li></ul>
<a href="#contact" class="btn">Get Started</a></nav>
<section class="hero">
<div class="hero-left">
<div class="sec-eye">${data.industry || 'Brand'}</div>
<h1 class="hero-h1">${(data.tagline || data.companyName || 'Brand').split(' ').slice(0,3).join(' ')}<br><span>${(data.tagline || '').split(' ').slice(3).join(' ') || 'Built Different'}</span></h1>
<p class="hero-sub">${data.brandStory?.slice(0,200) || 'We deliver exceptional results for our clients through innovation, quality, and dedication.'}</p>
<div class="hero-actions"><a href="#services" class="btn">Our Services</a><a href="#about" class="btn-ghost">Learn More</a></div>
</div>
<div class="hero-right">
<div class="hero-card">
<div class="hero-card-label">What We Do</div>
<div class="hero-card-title">${data.tagline || data.companyName}</div>
<div class="hero-card-body">${data.brandVoice?.slice(0,160) || 'Delivering excellence through innovation.'}</div>
</div>
</div>
</section>
<section id="about"><div class="sec-eye">Our Story</div><h2 class="sec-h2">About ${data.companyName}</h2>
<p class="sec-sub">${data.brandStory?.slice(0,180) || 'We are dedicated to delivering the best for our clients.'}</p>
<div class="about-grid">
<p class="about-body">${data.brandStory || 'Our team brings together years of expertise to deliver exceptional outcomes.'}</p>
<div class="about-stats">
<div><div class="stat-num">10+</div><div class="stat-label">Years Experience</div></div>
<div><div class="stat-num">500+</div><div class="stat-label">Happy Clients</div></div>
<div><div class="stat-num">98%</div><div class="stat-label">Satisfaction Rate</div></div>
</div>
</div></section>
<section class="services" id="services"><div class="sec-eye">What We Offer</div><h2 class="sec-h2">Our Services</h2>
<p class="sec-sub">${data.flyerBody || 'Comprehensive solutions tailored to your needs.'}</p>
<div class="svc-grid">
<div class="svc-card"><div class="svc-icon">01</div><div class="svc-title">${(data.flyerHighlights || ['Strategy', 'Execution', 'Growth'])[0] || 'Strategy'}</div><div class="svc-body">Expert guidance and strategic planning for your business goals.</div></div>
<div class="svc-card"><div class="svc-icon">02</div><div class="svc-title">${(data.flyerHighlights || ['Strategy', 'Execution', 'Growth'])[1] || 'Execution'}</div><div class="svc-body">Flawless execution with attention to every detail that matters.</div></div>
<div class="svc-card"><div class="svc-icon">03</div><div class="svc-title">${(data.flyerHighlights || ['Strategy', 'Execution', 'Growth'])[2] || 'Growth'}</div><div class="svc-body">Sustainable growth strategies built for long-term success.</div></div>
</div></section>
<section class="contact-sec" id="contact"><div class="sec-eye">Get In Touch</div><h2 class="sec-h2">Let&apos;s Work Together</h2>
<p class="sec-sub">${data.bannerCta || 'Ready to take the next step? Reach out today.'}</p>
<div class="contact-grid">
<div class="contact-col">
<h3>Send a Message</h3>
<p>We respond within 24 hours.</p>
<div class="contact-field"><label class="contact-label">Your Name</label><input class="contact-input" type="text" placeholder="John Smith"></div>
<div class="contact-field"><label class="contact-label">Email</label><input class="contact-input" type="email" placeholder="john@company.com"></div>
<div class="contact-field"><label class="contact-label">Message</label><textarea class="contact-input" rows="4" placeholder="Tell us about your project..."></textarea></div>
<button class="btn" style="margin-top:8px;width:100%">Send Message</button>
</div>
<div class="contact-col">
<h3>Contact Info</h3>
<p style="margin-bottom:12px">Reach us through any of these channels.</p>
<p style="font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:8px">📧 hello@${(data.companyName || 'company').toLowerCase().replace(/\s+/g,'')}.com</p>
<p style="font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:8px">📍 ${data.industry || 'Global'}</p>
<p style="font-size:13px;color:rgba(255,255,255,0.55)">🕐 Mon–Fri, 9am–6pm</p>
</div>
</div></section>
<footer><div class="footer-logo">${(data.companyName || 'Brand').split(' ')[0]}<span>${(data.companyName || '').split(' ').slice(1).join(' ') || '.'}</span></div>
<div class="footer-copy">© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</div></footer>
</body></html>`
  }, [data, c1, websiteHtml])

  const currentHtml = websiteHtml || data.websiteHtml || defaultHtml

  async function handleDomainConnect() {
    if (!domainInput.trim()) return
    setDomainStatus('connecting')
    setDomainMsg('Verifying domain ownership...')
    await new Promise(r => setTimeout(r, 1200))
    if (genId) {
      try {
        const res = await fetch('/api/domain/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: domainInput.trim(), generationId: genId })
        })
        const d = await res.json()
        if (res.ok) {
          setDomainStatus('connected')
          setDomainMsg(d.message || `Domain ${domainInput} connected! Add CNAME record pointing to app.brandsyndicate.io`)
        } else {
          setDomainStatus('error')
          setDomainMsg(d.error || 'Connection failed. Check domain and try again.')
        }
      } catch {
        setDomainStatus('connected')
        setDomainMsg(`Add CNAME: ${domainInput} → app.brandsyndicate.io to complete setup.`)
      }
    } else {
      setDomainStatus('error')
      setDomainMsg('Generate and publish your website first, then connect a domain.')
    }
  }

  async function handleAIEdit() {
    if (!editPrompt.trim()) return
    setEditing(true)
    try {
      const res = await fetch('/api/website-ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentHtml, editPrompt }),
      })
      const json = await res.json()
      if (json.updatedHtml) {
        setEditHistory(h => [...h, currentHtml])
        setWebsiteHtml(json.updatedHtml)
        setEditPrompt('')
        setEditMode(false)
      } else if (json.missingKey) {
        console.error('[website-ai-edit] missing API key')
        setEditPrompt('')
        setEditMode(false)
        // Surface error via the preview panel — brief inline alert
        alert('Sorry, unable to apply edits right now.')
      } else {
        alert('Could not apply edit. Please try again.')
      }
    } catch {
      alert('Could not apply edit. Please try again.')
    } finally {
      setEditing(false)
    }
  }

  function undoEdit() {
    if (editHistory.length === 0) return
    const prev = editHistory[editHistory.length - 1]
    setWebsiteHtml(prev)
    setEditHistory(h => h.slice(0, -1))
  }

  // ── Filtered samples ──────────────────────────────────────────────────────
  const filteredSamples = sampleCatFilter === 'All'
    ? WEBSITE_SAMPLES
    : WEBSITE_SAMPLES.filter(s => s.category === sampleCatFilter)

  // ── Dashboard tab button style ────────────────────────────────────────────
  const dashBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', background: active ? c1 : 'transparent',
    border: `1px solid ${active ? c1 : 'var(--border2)'}`,
    color: active ? '#000' : 'var(--muted)', fontSize: 9,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    fontFamily: "'DM Mono', monospace", fontWeight: active ? 700 : 400,
    cursor: 'pointer', borderRadius: 'var(--radius)', whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s',
  })

  // ── PHASE 1: No website yet, show samples gallery ────────────────────────
  if (!hasWebsite) {
    const selectedMeta = WEBSITE_SAMPLES.find(s => s.id === samplePreviewId)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* ── Header bar ── */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c1, boxShadow: `0 0 8px ${c1}80` }}/>
            <span style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace" }}>Website Templates</span>
          </div>
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
            {filteredSamples.length} templates
          </span>
        </div>

        {/* ── Category filter chips, pill style ── */}
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 5, overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
          {['All','Tech','Food','Health','Design','Beauty','Finance','Creative','Industry','Legal','Luxury','Events','Fashion','Travel'].map(cat => (
            <button
              key={cat}
              onClick={() => setSampleCatFilter(cat)}
              style={{
                padding: '4px 12px',
                background: sampleCatFilter === cat ? c1 : 'transparent',
                border: `1px solid ${sampleCatFilter === cat ? c1 : 'var(--border)'}`,
                color: sampleCatFilter === cat ? '#000' : 'var(--muted)',
                fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                fontFamily: "'DM Mono', monospace", fontWeight: sampleCatFilter === cat ? 700 : 400,
                cursor: 'pointer', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >{cat}</button>
          ))}
        </div>

        {/* ── Two-panel layout ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* Left: template list, premium card style */}
          <div style={{ width: 'clamp(148px,28%,210px)', borderRight: '1px solid var(--border)', overflowY: 'auto', overflowX: 'hidden', flexShrink: 0, WebkitOverflowScrolling: 'touch' as any, scrollbarWidth: 'thin' }}>
            {filteredSamples.map(s => {
              const isActive = samplePreviewId === s.id
              return (
                <div
                  key={s.id}
                  onClick={() => setSamplePreviewId(s.id)}
                  style={{
                    padding: '9px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
                    background: isActive ? `${c1}12` : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: isActive ? `2px solid ${c1}` : '2px solid transparent',
                    transition: 'all 0.13s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = `${c1}07` }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {/* Mini thumbnail */}
                  <div style={{ width: 36, height: 24, borderRadius: 3, overflow: 'hidden', flexShrink: 0, border: `1px solid ${isActive ? c1 + '40' : 'var(--border)'}`, background: '#08080f' }}>
                    <svg viewBox="0 0 36 24" width="36" height="24" xmlns="http://www.w3.org/2000/svg">
                      <rect width="36" height="24" fill="#08080f"/>
                      <rect width="36" height="3.5" fill={`${c1}20`}/>
                      <rect x="0" y="0" width="36" height="1.5" fill={c1} opacity={isActive ? 0.9 : 0.4}/>
                      <rect x="3" y="7" width="18" height="2.5" rx="1" fill="#fff" opacity="0.55"/>
                      <rect x="3" y="11" width="12" height="1.5" rx="0.5" fill={c1} opacity="0.6"/>
                      <rect x="3" y="15" width="22" height="1.5" rx="0.5" fill="#fff" opacity="0.12"/>
                      <rect x="3" y="18" width="7" height="4" rx="1" fill={c1} opacity="0.5"/>
                      <text x="28" y="22" fontSize="8" textAnchor="middle">{s.emoji}</text>
                    </svg>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 10, color: isActive ? 'var(--cream)' : 'var(--muted)', fontWeight: isActive ? 600 : 400, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Mono', monospace" }}>{s.label}</div>
                    <div style={{ fontSize: 8, color: isActive ? c1 : 'var(--muted2)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', marginTop: 2, textTransform: 'uppercase' }}>{s.category}</div>
                  </div>
                  {isActive && (
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: c1, flexShrink: 0, boxShadow: `0 0 6px ${c1}` }}/>
                  )}
                </div>
              )
            })}
          </div>

          {/* Right: preview pane */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {samplePreviewId ? (
              <>
                {/* Preview toolbar */}
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', flexShrink: 0, flexWrap: 'nowrap', minWidth: 0 }}>
                  {/* Template identity */}
                  <span style={{ fontSize: 15 }}>{selectedMeta?.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, color: 'var(--cream)', fontWeight: 600, fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{selectedMeta?.label}</div>
                    <div style={{ fontSize: 8, color: c1, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", marginTop: 1 }}>{selectedMeta?.category}</div>
                  </div>
                  {/* View live button */}
                  <a
                    href={websiteStats?.slug ? `/w/${websiteStats.slug}` : `/samples/${samplePreviewId}.html`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 5, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${c1}50`; el.style.color = c1 }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--muted)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M7 1h4v4M11 1L5.5 6.5M2 3h3M1 1v10h10v-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    View Live
                  </a>
                  {/* Use template CTA */}
                  <button
                    onClick={async () => {
                      setSelectedSample(samplePreviewId); setDashTab('preview')
                      if (savedId) return
                      try {
                        setSaveStatus('saving')
                        const res = await fetch(`/samples/${samplePreviewId}.html`)
                        if (!res.ok) throw new Error(`HTTP ${res.status}`)
                        const html = await res.text()
                        const sample = WEBSITE_SAMPLES.find(s => s.id === samplePreviewId)
                        const safeName = (data.companyName || sample?.label || samplePreviewId).trim() || 'My Website'
                        const saveRes = await fetch('/api/user-websites', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name: safeName, templateId: samplePreviewId, templateLabel: sample?.label, htmlContent: html, isGenerated: false, isPublished: true, autoPublish: true, prompt: `Template selected: ${sample?.label || samplePreviewId}` }),
                        })
                        if (saveRes.ok) {
                          const { website } = await saveRes.json()
                          setSavedId(website.id)
                          setSaveStatus('saved')
                          if (website.slug) {
                            setWebsiteStats({ views: 0, visitors: 0, slug: website.slug, isPublished: true })
                          }
                        } else {
                          const errBody = await saveRes.json().catch(() => ({}))
                          console.error('Template save error:', saveRes.status, errBody)
                          setSaveStatus('error')
                        }
                      } catch (e) {
                        console.error('Template save error:', e)
                        setSaveStatus('error')
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '6px 14px',
                      background: savedId ? 'var(--surface2)' : c1,
                      color: savedId ? 'var(--muted)' : '#000',
                      border: savedId ? '1px solid var(--border)' : 'none',
                      fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                      fontFamily: "'DM Mono', monospace", fontWeight: 700,
                      cursor: savedId ? 'default' : 'pointer', borderRadius: 5,
                      flexShrink: 0, whiteSpace: 'nowrap',
                      boxShadow: savedId ? 'none' : `0 2px 12px ${c1}40`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {savedId ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6.5 5,9.5 10,3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Saved
                      </>
                    ) : (
                      <>
                        Use This Template
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </>
                    )}
                  </button>
                </div>

                {/* iframe with subtle browser frame */}
                <div style={{ flex: 1, background: '#111', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                  {/* Fake browser address bar */}
                  <div style={{ padding: '6px 10px', background: '#0c0c14', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {['#ff5f57','#ffbd2e','#28ca42'].map((c, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }}/>)}
                    <div style={{ flex: 1, background: '#1a1a24', borderRadius: 4, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><rect x="1" y="3" width="10" height="8" rx="1" stroke={c1} strokeWidth="1" opacity="0.6"/><path d="M4 3V2.5A2 2 0 0 1 8 2.5V3" stroke={c1} strokeWidth="1" strokeLinecap="round" opacity="0.6"/></svg>
                      <span style={{ fontSize: 9, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>brandsyndicate.io/preview/{samplePreviewId}</span>
                    </div>
                  </div>
                  <iframe
                    src={`/samples/${samplePreviewId}.html`}
                    style={{ flex: 1, border: 'none', background: '#fff', display: 'block', width: '100%', minHeight: 0 }}
                    title="Template Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </>
            ) : (
              /* Empty state, premium */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '24px 20px', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: `${c1}12`, border: `1px solid ${c1}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="13" rx="2" stroke={c1} strokeWidth="1.4"/>
                    <rect x="5" y="5" width="14" height="9" rx="1" fill={c1} opacity="0.08"/>
                    <line x1="9" y1="20" x2="15" y2="20" stroke={c1} strokeWidth="1.8" strokeLinecap="round"/>
                    <line x1="12" y1="16" x2="12" y2="20" stroke={c1} strokeWidth="1.4"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: 'var(--cream)', marginBottom: 8 }}>
                    Select a template to preview
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 240, lineHeight: 1.65 }}>
                    Pick any industry template from the list, or generate a fully custom AI website above.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 300 }}>
                  {WEBSITE_SAMPLES.slice(0, 6).map(s => (
                    <button key={s.id} onClick={() => setSamplePreviewId(s.id)} style={{ padding: '4px 10px', background: `${c1}10`, border: `1px solid ${c1}28`, borderRadius: 4, fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── PHASE 2: Website selected/generated, show dashboard ─────────────────
  const siteUrl = `app.brandsyndicate.io/p/${(data.companyName || '').toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: 'var(--bg)', flexShrink: 0, minWidth: 0 }}>
        <span style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>Website</span>
        {/* Dashboard tabs, scrollable on mobile */}
        <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', flex: 1, minWidth: 0 }}>
          {(['preview','domain','analytics','seo','data'] as WsDashTab[]).map(t => (
            <button key={t} onClick={() => setDashTab(t)} style={{
              padding: '4px 8px', background: 'transparent', flexShrink: 0,
              border: 'none', borderBottom: dashTab === t ? `2px solid ${c1}` : '2px solid transparent',
              color: dashTab === t ? c1 : 'var(--muted)', fontSize: 9,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: "'DM Mono', monospace", cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {t === 'preview' ? (
                <><svg width="9" height="9" viewBox="0 0 10 10" fill="none"><rect x="1" y="1" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.1"/><rect x="5.5" y="1" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.1"/><rect x="1" y="5.5" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.1"/><rect x="5.5" y="5.5" width="3.5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1.1"/></svg> Preview</>
              ) : t === 'domain' ? (
                <><svg width="9" height="9" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.1"/><path d="M5 1c0 0-2 1.5-2 4s2 4 2 4M5 1c0 0 2 1.5 2 4s-2 4-2 4M1 5h8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> Domain</>
              ) : t === 'analytics' ? (
                <><svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 8l2.5-3 2 2 2.5-4 1.5 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg> Analytics</>
              ) : t === 'seo' ? (
                <><svg width="9" height="9" viewBox="0 0 10 10" fill="none"><circle cx="4.5" cy="4.5" r="3" stroke="currentColor" strokeWidth="1.1"/><path d="M7 7l2.5 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> SEO</>
              ) : (
                <><svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 8V5l3-4 3 4v3H6.5V6.5h-3V8z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg> Data</>
              )}
            </button>
          ))}
        </div>
        {/* Change template button */}
        <button onClick={() => { setSelectedSample(null); setWebsiteHtml('') }} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', fontSize: 9, cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>↩ Change</button>
        {editHistory.length > 0 && (
          <button onClick={undoEdit} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', fontSize: 9, cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>↩ Undo</button>
        )}
        {websiteStats?.slug && (
          <>
            <a
              href={`/w/${websiteStats.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: c1, color: '#000', border: 'none', fontSize: 9, cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              View Live
            </a>
            <button
              onClick={() => {
                const url = `${window.location.origin}/w/${websiteStats!.slug}`
                navigator.clipboard.writeText(url).then(() => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000) }).catch(() => {})
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'transparent', border: `1px solid ${c1}50`, color: c1, fontSize: 9, cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><rect x="3" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4v4a1 1 0 0 0 1 1h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              {copiedLink ? '✓ Copied' : 'Share'}
            </button>
          </>
        )}
      </div>

      {/* ── PREVIEW TAB ── */}
      {dashTab === 'preview' && (
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Visit Live Website bar */}
          {websiteStats?.slug && websiteStats.isPublished && (
            <div style={{ padding: '8px 14px', background: '#0a1a10', borderBottom: `1px solid #27AE6030`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#27AE60', boxShadow: '0 0 6px #27AE6090', flexShrink: 0 }}/>
              <span style={{ fontSize: 9, color: '#27AE60', fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase', flex: 1 }}>
                Your website is live
              </span>
              <a
                href={`/w/${websiteStats.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px', background: '#27AE60', color: '#fff', border: 'none', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 700, borderRadius: 5, textDecoration: 'none', flexShrink: 0, transition: 'opacity 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
              >
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Visit Live Website
              </a>
            </div>
          )}
          {selectedSample && !websiteHtml && !data.websiteHtml ? (
            <iframe src={`/samples/${selectedSample}.html`} style={{ flex: 1, width: '100%', border: 'none', display: 'block' }} title="Website Preview" />
          ) : blobPreviewUrl ? (
            /* LIVE PREVIEW FIX: blob URL always wins over savedId API route during/after generation.
               Blob reflects the latest in-memory HTML (including partial streaming content).
               savedId API route only has what's been saved — may lag behind or be empty. */
            <iframe ref={iframeRef} src={blobPreviewUrl} key={blobPreviewUrl.slice(-8)} style={{ flex: 1, width: '100%', border: 'none', background: '#09090a', display: 'block' }} title="Website Preview" />
          ) : savedId ? (
            /* Fallback: saved website via auth-gated route (e.g. after page reload) */
            <iframe ref={iframeRef} src={`/api/website-preview/${savedId}`} key={savedId} style={{ flex: 1, width: '100%', border: 'none', background: '#fff', display: 'block' }} title="Website Preview" />
          ) : null}
        </div>
      )}

      {/* ── DOMAIN TAB ── */}
      {dashTab === 'domain' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          <div style={{ maxWidth: 520 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke={c1} strokeWidth="1.1"/><path d="M5 1c0 0-1.5 1.5-1.5 4S5 9 5 9M5 1c0 0 1.5 1.5 1.5 4S5 9 5 9M1 5h8" stroke={c1} strokeWidth="1.1" strokeLinecap="round"/></svg>
              Domain Connection
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 6 }}>Connect Your Domain</div>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20 }}>Your website is live at <span style={{ color: c1 }}>{siteUrl}</span>. Connect a custom domain to replace it with your own.</p>

            {/* Domain input */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input value={domainInput} onChange={e => setDomainInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleDomainConnect() }} placeholder="yourdomain.com" style={{ flex: 1, background: 'var(--surface)', border: `1px solid ${domainStatus === 'connected' ? '#27AE60' : domainStatus === 'error' ? '#c0392b' : 'var(--border2)'}`, color: 'var(--cream)', padding: '10px 14px', fontSize: 13, fontFamily: "'DM Mono', monospace", borderRadius: 'var(--radius)', outline: 'none' }} />
              <button onClick={handleDomainConnect} disabled={domainStatus === 'connecting' || !domainInput.trim()} style={{ padding: '10px 20px', background: domainStatus === 'connected' ? '#27AE60' : c1, color: '#000', border: 'none', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 700, cursor: 'pointer', borderRadius: 'var(--radius)', whiteSpace: 'nowrap', opacity: domainStatus === 'connecting' ? 0.6 : 1 }}>
                {domainStatus === 'connecting' ? '…' : domainStatus === 'connected' ? '✓ Connected' : 'Connect'}
              </button>
            </div>
            {domainMsg && <div style={{ fontSize: 11, color: domainStatus === 'connected' ? '#27AE60' : domainStatus === 'error' ? '#e74c3c' : 'var(--muted)', fontFamily: "'DM Mono', monospace", lineHeight: 1.5, marginBottom: 20 }}>{domainMsg}</div>}

            {/* DNS instructions */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>DNS Setup Instructions</div>
              {[
                { type: 'CNAME', host: 'www', value: 'app.brandsyndicate.io', ttl: '3600' },
                { type: 'A', host: '@', value: '76.76.21.21', ttl: '3600' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 60px 1fr 60px', gap: 8, padding: '8px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: c1, letterSpacing: '0.1em' }}>{r.type}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{r.host}</span>
                  <span style={{ fontSize: 11, color: 'var(--cream)', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.value}</span>
                  <span style={{ fontSize: 9, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>{r.ttl}s</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, color: 'var(--muted2)', lineHeight: 1.7, fontFamily: "'DM Mono', monospace" }}>
              ① Log into your domain registrar (GoDaddy, Namecheap, etc.)<br/>
              ② Go to DNS Management → Add the records above<br/>
              ③ DNS propagation takes 5 min to 48 hrs<br/>
              ④ SSL certificate is auto-provisioned after verification
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {dashTab === 'analytics' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 10l3-4 2 2 3-5 2 2" stroke={c1} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Website Analytics
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 16 }}>Traffic Overview</div>

          {/* View Live + Share row */}
          {websiteStats?.slug && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <a
                href={`/w/${websiteStats.slug}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: c1, color: '#000', borderRadius: 6, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}
              >
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                View Live
              </a>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/w/${websiteStats.slug}`
                  navigator.clipboard.writeText(url).then(() => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000) }).catch(() => {})
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'transparent', border: `1px solid ${c1}50`, color: c1, borderRadius: 6, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', flexShrink: 0 }}
              >
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><rect x="3" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4v4a1 1 0 0 0 1 1h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                {copiedLink ? '✓ Copied!' : 'Share Link'}
              </button>
            </div>
          )}

          {/* Stats row — real data from analytics API */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Page Views', value: analyticsLoading ? '…' : websiteStats ? String(websiteStats.views) : (savedId ? '—' : '—'), sub: 'All time' },
              { label: 'Unique Visitors', value: analyticsLoading ? '…' : websiteStats ? String(websiteStats.visitors) : (savedId ? '—' : '—'), sub: 'All time' },
              { label: 'Avg. Duration', value: analyticsLoading ? '…' : (websiteStats?.avgDurationSec ?? 0) > 0 ? `${websiteStats!.avgDurationSec}s` : '—', sub: 'Per session' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'var(--cream)', marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 8, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Live URL */}
          {websiteStats?.slug && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>URL</span>
              <a href={`/w/${websiteStats.slug}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#4CA8C9', fontFamily: "'DM Mono', monospace", textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {typeof window !== 'undefined' ? window.location.origin : ''}/w/{websiteStats.slug}
              </a>
              <span style={{ fontSize: 8, color: websiteStats.isPublished ? '#27AE60' : 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
                {websiteStats.isPublished ? '● Live' : '○ Draft'}
              </span>
            </div>
          )}

          {/* No slug yet — website not published */}
          {savedId && !websiteStats?.slug && !analyticsLoading && (
            <div style={{ background: `${c1}08`, border: `1px solid ${c1}20`, borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 16, fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
              Website is saved but not yet published. Analytics will appear once it's live.
            </div>
          )}

          {/* Devices breakdown */}
          {websiteStats && (websiteStats.devices?.length ?? 0) > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Devices</div>
              {(websiteStats.devices ?? []).map((d, i) => {
                const total = (websiteStats.devices ?? []).reduce((s, x) => s + x.count, 0)
                const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{d.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--cream)', fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: c1, borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Browsers breakdown */}
          {websiteStats && (websiteStats.browsers?.length ?? 0) > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Browsers</div>
              {(websiteStats.browsers ?? []).map((b, i) => {
                const total = (websiteStats.browsers ?? []).reduce((s, x) => s + x.count, 0)
                const pct = total > 0 ? Math.round((b.count / total) * 100) : 0
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{b.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--cream)', fontFamily: "'DM Mono', monospace" }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: c1, borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Zero state when no visits yet */}
          {websiteStats && websiteStats.views === 0 && !analyticsLoading && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>📊</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, fontFamily: "'DM Mono', monospace" }}>
                No visits yet. Share your live link to start collecting traffic data.
              </div>
            </div>
          )}

          {/* GA connect */}
          <div style={{ background: `${c1}10`, border: `1px solid ${c1}30`, borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Connect Google Analytics</div>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 14 }}>Add your GA4 Measurement ID to inject tracking into your website HTML.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={gaId} onChange={e => setGaId(e.target.value)} placeholder="G-XXXXXXXXXX" style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--cream)', padding: '9px 14px', fontSize: 12, fontFamily: "'DM Mono', monospace", borderRadius: 'var(--radius)', outline: 'none' }} />
              <button onClick={async () => {
                if (!gaId.trim() || !savedId) return
                setSeoSaving(true)
                const gaScript = `\n<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');</script>`
                const newHtml = (currentHtml || websiteHtml).replace('</head>', gaScript + '</head>')
                setWebsiteHtml(newHtml)
                await fetch(`/api/user-websites/${savedId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ htmlContent: newHtml }) })
                setSeoSaving(false); setSeoDone(true)
              }} disabled={seoSaving || !gaId.trim()} style={{ padding: '9px 18px', background: c1, color: '#000', border: 'none', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 700, cursor: 'pointer', borderRadius: 'var(--radius)' }}>
                {seoSaving ? '…' : seoDone ? '✓' : 'Inject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEO TAB ── */}
      {dashTab === 'seo' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>🔍 SEO Settings</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 16 }}>Search Engine Optimisation</div>

          {/* SEO health score */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Title Tag', status: 'ok', note: `${data.companyName}, ${data.tagline || data.industry || 'Brand'}` },
              { label: 'Meta Description', status: 'ok', note: data.brandStory?.slice(0,80) || 'Set in brand story' },
              { label: 'Sitemap', status: 'pending', note: 'Auto-generated on publish' },
              { label: 'robots.txt', status: 'ok', note: 'Allow all crawlers' },
              { label: 'Canonical URL', status: domainStatus === 'connected' ? 'ok' : 'pending', note: domainStatus === 'connected' ? domainInput : 'Connect domain first' },
              { label: 'Open Graph', status: 'ok', note: 'Title + description set' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${item.status === 'ok' ? '#27AE6030' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.status === 'ok' ? '#27AE60' : '#C9A84C', flexShrink: 0 }} />
                  <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: item.status === 'ok' ? '#27AE60' : '#C9A84C', fontFamily: "'DM Mono', monospace" }}>{item.label}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.note}</div>
              </div>
            ))}
          </div>

          {/* Keywords */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Target Keywords</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[data.industry, data.companyName, ...(data.flyerHighlights || []).slice(0,3)].filter(Boolean).map((kw, i) => (
                <span key={i} style={{ padding: '3px 10px', background: `${c1}18`, border: `1px solid ${c1}30`, color: c1, fontSize: 10, borderRadius: 99, fontFamily: "'DM Mono', monospace" }}>{kw}</span>
              ))}
            </div>
            <input placeholder="Add a keyword and press Enter…" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--cream)', padding: '9px 14px', fontSize: 12, fontFamily: "'DM Mono', monospace", borderRadius: 'var(--radius)', outline: 'none' }} />
          </div>

          {/* Google Search Console */}
          <div style={{ background: `${c1}10`, border: `1px solid ${c1}30`, borderRadius: 'var(--radius)', padding: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Google Search Console</div>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>Verify ownership to submit your sitemap and track search impressions.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input placeholder="GSC verification meta tag content" style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--cream)', padding: '9px 14px', fontSize: 12, fontFamily: "'DM Mono', monospace", borderRadius: 'var(--radius)', outline: 'none' }} />
              <button style={{ padding: '9px 18px', background: c1, color: '#000', border: 'none', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 700, cursor: 'pointer', borderRadius: 'var(--radius)' }}>Verify</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DATA USAGE TAB ── */}
      {dashTab === 'data' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>💾 Data & Usage</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 16 }}>Storage & Bandwidth</div>

          {/* Usage bars */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Storage Used', used: 0.12, total: 1, unit: 'GB', pct: 12 },
              { label: 'Bandwidth This Month', used: 0, total: 10, unit: 'GB', pct: 0 },
              { label: 'Form Submissions', used: 0, total: 500, unit: 'leads', pct: 0 },
              { label: 'AI Edits Used', used: editHistory.length, total: 50, unit: 'edits', pct: Math.min(editHistory.length * 2, 100) },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--cream)', fontFamily: "'DM Mono', monospace" }}>{item.used} / {item.total} {item.unit}</div>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.pct > 80 ? '#c0392b' : c1, borderRadius: 3, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 9, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginTop: 6 }}>{item.pct}% used</div>
              </div>
            ))}
          </div>

          {/* Form leads */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Form Leads Collected</div>
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 12 }}>
              No leads yet. Leads from your website contact form will appear here.
            </div>
          </div>

          {/* Plan info */}
          <div style={{ background: `${c1}10`, border: `1px solid ${c1}30`, borderRadius: 'var(--radius)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace" }}>Current Plan</div>
              <a href="/billing" style={{ fontSize: 9, color: c1, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>Upgrade →</a>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: 'var(--cream)', marginBottom: 4 }}>Starter</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>1 GB storage · 10 GB/month bandwidth · 500 leads/month · 50 AI edits/month. Upgrade to Pro for unlimited everything.</div>
          </div>
        </div>
      )}
    </div>
  )
}


function BizLogoPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const c1 = data.primaryColors?.[0] ?? accent
  const c2 = data.primaryColors?.[1] ?? '#1a1a1a'
  const c3 = data.primaryColors?.[2] ?? '#333'
  const symbolIdea = data.logoSymbolIdea || ''
  const darkRef  = React.useRef<HTMLDivElement>(null)
  const lightRef = React.useRef<HTMLDivElement>(null)
  const brandRef = React.useRef<HTMLDivElement>(null)
  const wordmarkRef = React.useRef<HTMLDivElement>(null)

  // AI logo image generation (OpenAI), pre-populate if already generated via chip
  const dataLogoUri = data._logoImageUri ?? data.finalLogoUri ?? data.logoImageUri ?? data.logoUrl ?? data.imageDataUri ?? data.imageUrl ?? data.finalPosterUrl ?? data.previewImageUrl ?? null
  const [logoImageUri, setLogoImageUri] = React.useState<string | null>(dataLogoUri)
  const [generatingLogo, setGeneratingLogo] = React.useState(false)
  const [logoError, setLogoError] = React.useState<string | null>(null)
  const [logoFullscreen, setLogoFullscreen] = React.useState(false)

  // Sync when data changes (chip re-generation passes _logoImageUri on output object)
  React.useEffect(() => {
    const uri = data._logoImageUri ?? data.finalLogoUri ?? data.logoImageUri ?? data.logoUrl ?? data.imageDataUri ?? data.imageUrl ?? data.finalPosterUrl ?? data.previewImageUrl ?? null
    if (uri && uri !== logoImageUri) setLogoImageUri(uri)
  }, [data._logoImageUri, data.finalLogoUri, data.logoImageUri, data.logoUrl, data.imageDataUri, data.imageUrl, data.finalPosterUrl, data.previewImageUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  async function generateLogoImage() {
    setGeneratingLogo(true)
    setLogoError(null)
    try {
      const res = await fetch('/api/generate-logo-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName:     data.companyName,
          industry:        data.industry,
          logoConceptName: data.logoConceptName,
          symbolIdea:      data.logoSymbolIdea,
          primaryColors:   data.primaryColors,
          tone:            data.brandVoice,
        }),
      })
      const json = await res.json()
      if (json.missingKey) { console.error('[logo-image] missing OPENAI_API_KEY'); setLogoError('Sorry, logo image generation is unavailable right now.') }
      else if (json.limitReached) { setLogoError('We could not generate content. Please upgrade your plan.') }
      else if (!res.ok) { setLogoError(json.error || 'Logo generation failed. Please try again.') }
      else if (json.imageDataUri) { setLogoImageUri(json.imageDataUri) }
      else { setLogoError('Logo image could not be generated. Please try again.') }
    } catch (error) { setLogoError(error instanceof Error ? error.message : 'Logo generation failed. Please try again.') } finally {
      setGeneratingLogo(false)
    }
  }

  function CopyHexBtn({ hex }: { hex: string }) {
    const [copied, setCopied] = React.useState(false)
    return (
      <button className="biz-download-btn" onClick={() => { navigator.clipboard.writeText(hex); setCopied(true); setTimeout(()=>setCopied(false),1500) }}>
        {copied ? '✓' : hex}
      </button>
    )
  }

  return (
    <div>
      <DownloadBar title={logoImageUri ? "Logo Image" : "Logo Dark"} refEl={darkRef} accent={c1}
        hideDefaultDownload={!!logoImageUri}
        extraButtons={
          <>
            {!logoImageUri && <button className="biz-download-btn" onClick={() => downloadElementAsPng(lightRef.current!, 'logo-light.png')}>Light PNG</button>}
            {!logoImageUri && <button className="biz-download-btn" onClick={() => downloadElementAsPng(brandRef.current!, 'logo-brand.png')}>Brand PNG</button>}
            {!logoImageUri && <button className="biz-download-btn" onClick={() => downloadElementAsPng(wordmarkRef.current!, 'wordmark.png')}>Wordmark PNG</button>}
            <button
              className="biz-download-btn primary"
              style={{ background: c1, color: '#000', display: 'flex', alignItems: 'center', gap: 5, opacity: generatingLogo ? 0.6 : 1 }}
              onClick={generateLogoImage}
              disabled={generatingLogo}
            >
              {generatingLogo
                ? <><span style={{ width: 9, height: 9, border: '1.5px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Generating…</>
                : (logoImageUri ? '↺ Regenerate Logo' : '✦ Generate Logo')
              }
            </button>
          </>
        }
      />

      {/* Logo error message */}
      {logoError && (
        <div style={{ margin: '8px clamp(16px,4vw,28px) 0', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.3)', borderLeft: '3px solid #dc3545', borderRadius: 'var(--radius)' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="8" cy="8" r="7.5" stroke="#dc3545"/><path d="M8 4.5v4M8 10.5v1" stroke="#dc3545" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <span style={{ fontSize: 11, color: '#f5c6cb', lineHeight: 1.5, fontFamily: "'DM Mono', monospace", flex: 1 }}>{logoError}</span>
          <button onClick={() => setLogoError(null)} style={{ background: 'none', border: 'none', color: 'rgba(245,198,203,0.5)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
        </div>
      )}

      {/* AI-generated logo image panel */}
      {(logoImageUri || generatingLogo) && (
        <div style={{ margin: '0 clamp(16px,4vw,28px)', marginBottom: 0, marginTop: 20, border: `1px solid ${c1}30`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: 'var(--surface)', borderBottom: `1px solid var(--border)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace" }}>AI Generated Logo</span>
            {logoImageUri && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <a href={logoImageUri} download={`${data.companyName?.toLowerCase().replace(/\s+/g, '-')}-logo.png`} style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", textDecoration: 'none', padding: '3px 8px', border: `1px solid ${c1}50`, borderRadius: 2 }}>⬇ PNG</a>
                <button onClick={async () => {
                  try {
                    const imgEl = new window.Image(); imgEl.crossOrigin = 'anonymous'
                    await new Promise<void>((res, rej) => { imgEl.onload = () => res(); imgEl.onerror = () => rej(); imgEl.src = logoImageUri })
                    const canvas = document.createElement('canvas'); canvas.width = imgEl.naturalWidth || imgEl.width; canvas.height = imgEl.naturalHeight || imgEl.height
                    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(imgEl, 0, 0)
                    const a = document.createElement('a'); a.href = canvas.toDataURL('image/jpeg', 0.92); a.download = `${data.companyName?.toLowerCase().replace(/\s+/g, '-')}-logo.jpg`; a.click()
                  } catch { const a = document.createElement('a'); a.href = logoImageUri; a.download = `${data.companyName?.toLowerCase().replace(/\s+/g, '-')}-logo.jpg`; a.click() }
                }} style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", padding: '3px 8px', border: `1px solid ${c1}30`, borderRadius: 2, background: 'transparent', cursor: 'pointer' }}>JPG</button>
              </div>
            )}
          </div>
          <div style={{ background: '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            {generatingLogo && !logoImageUri ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--muted)' }}>
                <span style={{ width: 24, height: 24, border: `2px solid ${c1}40`, borderTopColor: c1, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>Generating logo…</span>
              </div>
            ) : logoImageUri ? (
              <img
                src={logoImageUri}
                alt={`${data.companyName} logo`}
                onClick={() => setLogoFullscreen(true)}
                title="Tap to view full logo"
                style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', display: 'block', cursor: 'zoom-in' }}
              />
            ) : null}
          </div>
        </div>
      )}


      {logoFullscreen && logoImageUri && (
        <div onClick={() => setLogoFullscreen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
          <button onClick={() => setLogoFullscreen(false)} aria-label="Close logo preview" style={{ position: 'fixed', top: 18, right: 18, width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
          <img src={logoImageUri} alt={`${data.companyName} logo full preview`} style={{ maxWidth: '92vw', maxHeight: '86vh', objectFit: 'contain', background: '#f8f8f8', borderRadius: 12, padding: 18, boxShadow: '0 30px 90px rgba(0,0,0,0.55)' }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {!logoImageUri && (
      <div style={{ padding: 'clamp(16px,4vw,28px)', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Logo 3-variant grid, responsive via CSS class */}
        <div className="biz-logo-variants">
          <div ref={darkRef} style={{ background: '#0a0a0a', border: `1px solid ${c1}30`, borderRadius: 6, padding: 'clamp(14px,3vw,24px) clamp(10px,2vw,16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", opacity: 0.7 }}>Dark</div>
            {buildLogoSymbol(symbolIdea, c1, c2, 64)}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(11px,2vw,13px)', fontWeight: 700, color: '#F8F4EE', letterSpacing: '0.05em' }}>{data.companyName}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: c1, marginTop: 3, opacity: 0.8 }}>{data.industry}</div>
            </div>
          </div>
          <div ref={lightRef} style={{ background: '#F8F6F2', border: `1px solid ${c1}30`, borderRadius: 6, padding: 'clamp(14px,3vw,24px) clamp(10px,2vw,16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: c2, fontFamily: "'DM Mono', monospace", opacity: 0.6 }}>Light</div>
            {buildLogoSymbol(symbolIdea, c2, c1, 64)}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(11px,2vw,13px)', fontWeight: 700, color: '#1A1A1A', letterSpacing: '0.05em' }}>{data.companyName}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: c2, marginTop: 3, opacity: 0.7 }}>{data.industry}</div>
            </div>
          </div>
          <div ref={brandRef} style={{ background: c1, border: `1px solid ${c1}`, borderRadius: 6, padding: 'clamp(14px,3vw,24px) clamp(10px,2vw,16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#000', fontFamily: "'DM Mono', monospace", opacity: 0.6 }}>Brand</div>
            {buildLogoSymbol(symbolIdea, '#000', c2, 64)}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(11px,2vw,13px)', fontWeight: 700, color: '#000', letterSpacing: '0.05em' }}>{data.companyName}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#000', marginTop: 3, opacity: 0.6 }}>{data.industry}</div>
            </div>
          </div>
        </div>

        {/* Horizontal wordmark */}
        <div ref={wordmarkRef} style={{ background: 'var(--surface2)', border: `1px solid var(--border2)`, borderRadius: 6, padding: 'clamp(18px,3vw,28px) clamp(20px,4vw,32px)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {buildLogoSymbol(symbolIdea, c1, c2, 48)}
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px,3vw,24px)', fontWeight: 700, color: 'var(--cream)', letterSpacing: '0.04em', lineHeight: 1.1 }}>{data.companyName}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: c1, marginTop: 5 }}>{data.industry}</div>
          </div>
        </div>

        {/* Color palette */}
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Brand Palette</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[c1, c2, c3].map((col, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 44, height: 44, borderRadius: 4, background: col, border: '1px solid rgba(255,255,255,0.08)' }} />
                <CopyHexBtn hex={col} />
              </div>
            ))}
          </div>
        </div>

        {/* Concept details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '14px 16px', background: 'var(--surface)', border: `1px solid ${c1}30`, borderLeft: `3px solid ${c1}`, borderRadius: 2 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Concept, {data.logoConceptName}</div>
            <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.6 }}>{data.logoConceptDescription}</div>
          </div>
          <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Symbol Direction</div>
            <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.6 }}>{data.logoSymbolIdea}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Brand Keywords</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(data.logoKeywords || []).map((kw, i) => (
                <span key={i} style={{ padding: '4px 10px', border: `1px solid ${c1}50`, color: c1, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', borderRadius: 2 }}>{kw}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

// ── Business Graphics Preview ──────────────────────────────────────────────────
function BizGraphicsPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const c1 = data.primaryColors?.[0] ?? accent
  const c2 = data.primaryColors?.[1] ?? '#0a0a0a'
  // Pre-populate from chip-generated images (in-memory) or persisted DB images
  type GraphicImg = {type:string;title:string;description:string;imageDataUri:string}
  const dataWithImages = data as BusinessOutput & { _generatedImages?: GraphicImg[]; _persistedImages?: GraphicImg[] }
  const dataGraphics = dataWithImages._generatedImages ?? dataWithImages._persistedImages ?? []
  const [generating, setGenerating] = React.useState(false)
  const [generatedGraphics, setGeneratedGraphics] = React.useState<GraphicImg[]>(dataGraphics)
  const [copied, setCopied] = React.useState<string|null>(null)
  const [graphicsError, setGraphicsError] = React.useState<string | null>(null)
  const [activeGraphicSlide, setActiveGraphicSlide] = React.useState(0)

  // Sync when chip re-generates images or DB images load
  React.useEffect(() => {
    const d = data as BusinessOutput & { _generatedImages?: GraphicImg[]; _persistedImages?: GraphicImg[] }
    const imgs = d._generatedImages ?? d._persistedImages
    if (imgs && imgs.length > 0) { setGeneratedGraphics(imgs); setActiveGraphicSlide(0) }
  }, [(data as any)._generatedImages, (data as any)._persistedImages]) // eslint-disable-line react-hooks/exhaustive-deps

  const graphicTypes = [
    { type: 'social', label: 'Brand Graphic', size: '1080×1080', icon: '◻' },
  ]

  async function generateGraphics() {
    setGenerating(true)
    setGraphicsError(null)
    try {
      const res = await fetch('/api/generate-graphics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName:   data.companyName,
          industry:      data.industry,
          tagline:       data.tagline,
          primaryColors: data.primaryColors || [c1],
          brandVoice:    data.brandVoice?.slice(0, 100),
        }),
      })
      const json = await res.json()
      if (json.missingKey) { console.error('[graphics] missing OPENAI_API_KEY'); setGraphicsError('Sorry, brand image generation is unavailable right now.') }
      else if (json.limitReached) { setGraphicsError('We could not generate content. Please upgrade your plan.') }
      else if (!res.ok) { setGraphicsError('Brand image generation failed. Please try again.') }
      else if (Array.isArray(json.graphics) && json.graphics.length > 0) { setGeneratedGraphics(json.graphics); setActiveGraphicSlide(0) }
      else { setGraphicsError('Brand images could not be generated. Please try again.') }
    } catch { setGraphicsError('Brand image generation failed. Please try again.') } finally {
      setGenerating(false)
    }
  }

  function downloadPng(imageDataUri: string, name: string) {
    const a = document.createElement('a')
    a.href = imageDataUri
    a.download = `${name}.png`
    a.click()
  }

  async function downloadJpgGraphic(imageDataUri: string, name: string) {
    try {
      const imgEl = new window.Image(); imgEl.crossOrigin = 'anonymous'
      await new Promise<void>((res, rej) => { imgEl.onload = () => res(); imgEl.onerror = () => rej(); imgEl.src = imageDataUri })
      const canvas = document.createElement('canvas'); canvas.width = imgEl.naturalWidth || imgEl.width; canvas.height = imgEl.naturalHeight || imgEl.height
      const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(imgEl, 0, 0)
      const a = document.createElement('a'); a.href = canvas.toDataURL('image/jpeg', 0.92); a.download = `${name}.jpg`; a.click()
    } catch { const a = document.createElement('a'); a.href = imageDataUri; a.download = `${name}.jpg`; a.click() }
  }

  // Default placeholder cards (show skeleton/preview until AI generates real images)
  const placeholders = graphicTypes.map(gt => ({
    ...gt,
    imageDataUri: '',
  }))

  const displayGraphics = generatedGraphics.length > 0 ? generatedGraphics : placeholders

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="biz-download-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>▨ Business Graphics</span>
          <span style={{ padding: '2px 8px', background: `${c1}15`, border: `1px solid ${c1}30`, borderRadius: 'var(--radius)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace" }}>AI Generated</span>
        </div>
        <button
          onClick={generateGraphics}
          disabled={generating}
          className="biz-download-btn primary"
          style={{ background: c1, color: '#000', opacity: generating ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {generating ? (
            <><span style={{ width: 10, height: 10, border: '1.5px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Generating…</>
          ) : (generatedGraphics.length > 0 ? '↺ Regenerate' : '✦ Generate All Graphics')}
        </button>
      </div>

      {/* Graphics error message */}
      {graphicsError && (
        <div style={{ margin: '0 clamp(14px,3vw,24px)', marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.3)', borderLeft: '3px solid #dc3545', borderRadius: 'var(--radius)' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="8" cy="8" r="7.5" stroke="#dc3545"/><path d="M8 4.5v4M8 10.5v1" stroke="#dc3545" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <span style={{ fontSize: 11, color: '#f5c6cb', lineHeight: 1.5, fontFamily: "'DM Mono', monospace", flex: 1 }}>{graphicsError}</span>
          <button onClick={() => setGraphicsError(null)} style={{ background: 'none', border: 'none', color: 'rgba(245,198,203,0.5)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
        </div>
      )}

      <div style={{ padding: 'clamp(14px,3vw,24px)', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        {generatedGraphics.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Variation {activeGraphicSlide + 1} / {generatedGraphics.length}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setActiveGraphicSlide(i => (i - 1 + generatedGraphics.length) % generatedGraphics.length)} style={{ width: 34, height: 30, borderRadius: 6, border: `1px solid ${c1}35`, background: 'transparent', color: c1, cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}>‹</button>
              <button onClick={() => setActiveGraphicSlide(i => (i + 1) % generatedGraphics.length)} style={{ width: 34, height: 30, borderRadius: 6, border: `1px solid ${c1}35`, background: 'transparent', color: c1, cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}>›</button>
            </div>
          </div>
        )}
        {displayGraphics.slice(generatedGraphics.length > 0 ? activeGraphicSlide : 0, generatedGraphics.length > 0 ? activeGraphicSlide + 1 : 1).map((g, i) => (
          <div key={generatedGraphics.length > 0 ? activeGraphicSlide : i} style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 6, overflow: 'hidden' }}>
            {/* Image preview */}
            <div style={{ background: '#0a0a0a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140, position: 'relative' }}>
              {g.imageDataUri ? (
                <div style={{ width: '100%', background: 'linear-gradient(135deg, #F7F1E6 0%, #FFFDF6 52%, #EFE3C8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', maxHeight: 'min(72vh, 760px)' }}>
                  <img
                    src={g.imageDataUri}
                    alt={(g as any).title || g.type}
                    style={{ maxWidth: '100%', maxHeight: 'min(72vh, 760px)', objectFit: 'contain', display: 'block', width: 'auto', height: 'auto' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 24 }}>
                  <div style={{ width: 32, height: 32, border: `2px solid ${c1}30`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: `${c1}50` }}>
                    {graphicTypes.find(x => x.type === g.type)?.icon || '▨'}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--muted2)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
                    {graphicTypes.find(x => x.type === g.type)?.size || g.type}
                  </div>
                </div>
              )}
            </div>
            {/* Card info */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: 'var(--cream)', fontFamily: "'Playfair Display', serif" }}>{'title' in g ? g.title : g.label || g.type}</div>
                <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace" }}>{graphicTypes.find(x=>x.type===g.type)?.size || ''}</div>
              </div>
             <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.4 }}>{'description' in g ? g.description?.slice(0,80) : ''}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {generatedGraphics.length > 0 && (
                  <>
                    <button onClick={() => downloadPng(g.imageDataUri, `${data.companyName?.toLowerCase().replace(/\s+/g,'-')}-${g.type}`)} style={{ flex: 1, padding: '5px 0', background: 'transparent', border: `1px solid ${c1}50`, color: c1, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace" }}>⬇ PNG</button>
                    <button onClick={() => downloadJpgGraphic(g.imageDataUri, `${data.companyName?.toLowerCase().replace(/\s+/g,'-')}-${g.type}`)} style={{ flex: 1, padding: '5px 0', background: 'transparent', border: `1px solid ${c1}30`, color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace" }}>JPG</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {generatedGraphics.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 7 }}>
            {generatedGraphics.map((_g, idx) => (
              <button key={idx} onClick={() => setActiveGraphicSlide(idx)} aria-label={`Show graphic ${idx + 1}`} style={{ width: idx === activeGraphicSlide ? 18 : 7, height: 7, borderRadius: 99, border: 'none', background: idx === activeGraphicSlide ? c1 : `${c1}35`, cursor: 'pointer', transition: 'all 0.16s' }} />
            ))}
          </div>
        )}
      </div>

      {generatedGraphics.length === 0 && !generating && (
        <div style={{ textAlign: 'center', padding: '20px 40px 28px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>
            Click <strong style={{ color: c1 }}>Generate Brand Graphic</strong> to create a premium campaign poster with polished visuals and clean layout.
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase' }}>PNG · Real Campaign Poster · Instant Download</div>
        </div>
      )}
    </div>
  )
}


// ── Copy Preview ───────────────────────────────────────────────────────────────
function BizCopyPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const [copied, setCopied] = React.useState<string | null>(null)
  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(()=>{})
    setCopied(key); setTimeout(()=>setCopied(null), 1800)
  }
  function copyAll() {
    const all = [
      `=== HEADLINES ===\n${(data.copyHeadlines||[]).join('\n')}`,
      `\n=== CTAS ===\n${(data.copyCtas||[]).join(' | ')}`,
      `\n=== EMAIL SUBJECT ===\n${data.copyEmailSubject}`,
      `\n=== EMAIL BODY ===\n${data.copyEmailBody}`,
      `\n=== AD COPY ===\n${data.copyAdCopy}`,
      `\n=== SOCIAL CAPTIONS ===\n${(data.copySocialCaptions||[]).join('\n\n---\n')}`,
    ].join('')
    navigator.clipboard.writeText(all).catch(()=>{})
    setCopied('all'); setTimeout(()=>setCopied(null), 2000)
  }

  function CopyBlock({ label, content, id }: { label: string; content: string; id: string }) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{label}</span>
          <button onClick={()=>copy(content, id)} style={{ background: copied===id?`${accent}20`:'transparent', border: `1px solid ${copied===id?accent:'var(--border2)'}`, color: copied===id?accent:'var(--muted)', fontSize: 8, padding: '2px 8px', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: 2, textTransform: 'uppercase' }}>
            {copied===id?'✓ Copied':'Copy'}
          </button>
        </div>
        <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--cream)', lineHeight: 1.6 }}>{content}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="biz-download-bar">
        <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Copy Assets</span>
        <button className="biz-download-btn primary" onClick={copyAll}>{copied==='all'?'✓ All Copied':'⌘ Copy All'}</button>
      </div>
      <div style={{ padding: 'clamp(16px,4vw,28px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Ad Headlines</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(data.copyHeadlines||[]).map((h, i)=>(
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: accent }}>0{i+1}</span>
                <span style={{ fontSize: 13, color: 'var(--cream)', flex: 1, minWidth: 100 }}>{h}</span>
                <button onClick={()=>copy(h,`h${i}`)} style={{ background: 'transparent', border: 'none', color: copied===`h${i}`?accent:'var(--muted)', cursor: 'pointer', fontSize: 10, padding: 4 }}>{copied===`h${i}`?'✓':'⌘'}</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>CTAs</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(data.copyCtas||[]).map((cta, i)=>(
              <button key={i} onClick={()=>copy(cta,`cta${i}`)} style={{ padding: '6px 14px', border: `1px solid ${accent}60`, color: accent, background: copied===`cta${i}`?`${accent}15`:'transparent', fontSize: 11, fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: 2, letterSpacing: '0.06em' }}>{cta}</button>
            ))}
          </div>
        </div>
        <CopyBlock label="Email Subject" content={data.copyEmailSubject} id="emailsubj" />
        <CopyBlock label="Email Body" content={data.copyEmailBody} id="emailbody" />
        <CopyBlock label="30-Word Ad Copy" content={data.copyAdCopy} id="adcopy" />
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Social Captions</div>
          {(data.copySocialCaptions||[]).map((cap, i)=>{
            const platform = ['Instagram','LinkedIn','Twitter / X'][i] ?? `Platform ${i+1}`
            return (
              <div key={i} style={{ marginBottom: 8, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>{platform}</span>
                  <button onClick={()=>copy(cap,`soc${i}`)} style={{ background: 'transparent', border: 'none', color: copied===`soc${i}`?accent:'var(--muted)', cursor: 'pointer', fontSize: 9, fontFamily: "'DM Mono', monospace" }}>{copied===`soc${i}`?'✓ Copied':'Copy'}</button>
                </div>
                <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--cream)', lineHeight: 1.6 }}>{cap}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── inferOutputTypes ──────────────────────────────────────────────────────────
// Derives which asset tabs to show from outputData when inputData.outputTypes
// was never saved (old generations, logo-only chip generations, etc.)
// Priority: saved outputTypes → inferred from outputData keys → empty (no guessing)
function inferOutputTypes(
  savedTypes: unknown,
  outputData: Record<string, unknown> | null,
): BizTab[] {
  // 1. If DB has a valid non-empty outputTypes array, use it
  if (Array.isArray(savedTypes) && savedTypes.length > 0) {
    return savedTypes as BizTab[]
  }
  // 2. Derive from what keys are present in outputData
  if (!outputData) return []
  const tabs: BizTab[] = []
  // Website — has non-empty websiteHtml
  if (typeof outputData.websiteHtml === 'string' && outputData.websiteHtml.length > 50) tabs.push('website')
  // Logo — has logoConceptName or logoSymbolIdea (brand data = logo was selected)
  if (
    outputData.logoConceptName || outputData.logoSymbolIdea ||
    (outputData as Record<string, unknown>)._logoImageUri ||
    (outputData as Record<string, unknown>).finalLogoUri ||
    (outputData as Record<string, unknown>).logoImageUri ||
    (outputData as Record<string, unknown>).logoUrl ||
    ((outputData as Record<string, unknown>).imageGenerated && ((outputData as Record<string, unknown>).imageDataUri || (outputData as Record<string, unknown>).imageUrl))
  ) tabs.push('logo')
  // Copy — has copyHeadlines
  if (Array.isArray(outputData.copyHeadlines) && outputData.copyHeadlines.length > 0) tabs.push('copy')
  // Graphics — has graphicsPrompts
  if (Array.isArray(outputData.graphicsPrompts) && outputData.graphicsPrompts.length > 0) tabs.push('graphics')
  // Images — _generatedImages (in-memory) OR finalPosterUrl/imageUrl persisted by generate-graphics
  if (
    Array.isArray((outputData as Record<string, unknown>)._generatedImages) ||
    Array.isArray((outputData as Record<string, unknown>).graphics) ||
    Array.isArray((outputData as Record<string, unknown>).variations) ||
    (outputData.genType === 'campaign-image' && (outputData.finalPosterUrl || outputData.imageUrl)) ||
    Boolean((outputData as Record<string, unknown>).imageDataUri || (outputData as Record<string, unknown>).previewImageUrl) ||
    Array.isArray((outputData as Record<string, unknown>)._persistedImages)
  ) tabs.push('images')
  // Strategy — has strategy object
  if (outputData.strategy && typeof outputData.strategy === 'object') tabs.push('strategy')
  // Calendar — has contentCalendar object
  if (outputData.contentCalendar && typeof outputData.contentCalendar === 'object') tabs.push('calendar')
  // 3. Nothing found — return empty; never guess 'logo' just because companyName exists
  return tabs
}



type ChatThreadSummary = {
  id: string
  title: string
  totalCostInr: number
  totalCostUsd: number
  messageCount: number
  lastMessageAt: string | null
  messages?: Array<{ content: string; createdAt: string }>
}

type ChatMessageView = {
  id: string
  role: string
  content: string
  provider?: string | null
  model?: string | null
  totalTokens?: number | null
  costInr?: number | null
  usedExternalApi?: boolean
  createdAt: string
}

// ── Chat content formatter: strips markdown symbols for clean display ──────
function formatChatContent(raw: string): React.ReactNode {
  if (!raw) return null
  // Strip markdown: ##/###, **bold**, *italic*, `, ---, horizontal lines, leading hyphens as bullets
  const clean = raw
    .replace(/^#{1,6}\s*/gm, '')           // Remove # heading markers
    .replace(/\*\*(.*?)\*\*/g, '$1')        // Remove **bold**
    .replace(/\*(.*?)\*/g, '$1')            // Remove *italic*
    .replace(/`([^`]+)`/g, '$1')           // Remove `inline code`
    .replace(/^---+\s*$/gm, '')            // Remove horizontal rules
    .replace(/^- /gm, '\u2022 ')           // Convert - bullets to •
    .replace(/^\* /gm, '\u2022 ')          // Convert * bullets to •
    .replace(/^(\d+)\.\s/gm, '$1. ')       // Keep numbered lists clean
    .replace(/\n{3,}/g, '\n\n')            // Collapse triple+ newlines
    .trim()

  // Split into paragraphs/lines and render with proper spacing
  const paragraphs = clean.split('\n\n')
  return (
    <>
      {paragraphs.map((para, i) => {
        const lines = para.split('\n')
        return (
          <React.Fragment key={i}>
            {i > 0 && <div style={{ height: 10 }} />}
            {lines.map((line, j) => (
              <div key={j} style={{ lineHeight: 1.7 }}>{line || '\u00A0'}</div>
            ))}
          </React.Fragment>
        )
      })}
    </>
  )
}

function BrandChatStudio({ accent, initialPrompt, initialThreadId }: { accent: string; initialPrompt?: string; initialThreadId?: string | null }) {
  const [threads, setThreads] = React.useState<ChatThreadSummary[]>([])
  const [threadId, setThreadId] = React.useState<string | null>(initialThreadId || null)
  const [messages, setMessages] = React.useState<ChatMessageView[]>([])
  const [input, setInput] = React.useState(initialPrompt || '')
  const [sending, setSending] = React.useState(false)
  const [loadingThreads, setLoadingThreads] = React.useState(false)
  const [totalCostInr, setTotalCostInr] = React.useState(0)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)
  const sentInitialRef = React.useRef(false)
  const bottomRef = React.useRef<HTMLDivElement | null>(null)
  // When arriving with a specific ?threadId=, don't let loadThreads() auto-pick the most recent thread instead.
  const pinnedThreadRef = React.useRef(Boolean(initialThreadId))

  const loadThreads = React.useCallback(async () => {
    setLoadingThreads(true)
    try {
      const res = await fetch('/api/chat/threads')
      const data = await res.json()
      if (res.ok) {
        setThreads(data.threads || [])
        setTotalCostInr(Number(data.totals?.costInr || 0))
        if (!threadId && !pinnedThreadRef.current && data.threads?.[0]) setThreadId(data.threads[0].id)
      }
    } finally { setLoadingThreads(false) }
  }, [threadId])

  const loadThread = React.useCallback(async (id: string) => {
    const res = await fetch(`/api/chat/threads/${id}`)
    const data = await res.json()
    if (res.ok && data.thread) {
      setThreadId(id)
      setMessages(data.thread.messages || [])
    }
  }, [])

  React.useEffect(() => { loadThreads() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { if (threadId) loadThread(threadId) }, [threadId, loadThread])
  React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, sending])

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    const tempUser: ChatMessageView = { id: `tmp-user-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() }
    setMessages(prev => [...prev, tempUser])
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, message: text, mode: 'brand_studio' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat failed')
      setThreadId(data.threadId)
      setMessages(prev => [...prev.filter(m => m.id !== tempUser.id), tempUser, data.message])
      await loadThreads()
    } catch (e) {
      setMessages(prev => [...prev, { id: `tmp-error-${Date.now()}`, role: 'assistant', content: 'Chat failed. Please try again after some time.', provider: 'local', usedExternalApi: false, createdAt: new Date().toISOString() }])
    } finally { setSending(false) }
  }

  React.useEffect(() => {
    if (!initialPrompt?.trim() || sentInitialRef.current) return
    sentInitialRef.current = true
    setTimeout(() => sendMessage(initialPrompt), 250)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startNew = () => { setThreadId(null); setMessages([]); setInput('') }
  const quickPrompts = [
    'What should I generate first for my business?',
    'Make a growth plan using low cost marketing.',
    'Improve my website idea and CTA.',
    'Create WhatsApp follow-up flow for leads.',
  ]
  const hasStartedChat = loadingThreads || threads.length > 0 || messages.length > 0 || Boolean(threadId)

  return (
    <div className={hasStartedChat ? "generate-layout" : "generate-layout chat-layout-full"} style={{ position: 'relative' }}>
      {/* Mobile sidebar overlay backdrop */}
      {hasStartedChat && mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 998,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
          }}
          className="chat-sidebar-backdrop"
        />
      )}

      {hasStartedChat && <div className={`generate-form-side gen-hero-form chat-sidebar${mobileSidebarOpen ? ' chat-sidebar-open' : ''}`} style={{ minWidth: 0 }}>
        <div className="gen-hero-bg" />
        {/* Mobile close button */}
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="chat-sidebar-close-btn"
          aria-label="Close history"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 2,
            background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)',
            borderRadius: 6, width: 30, height: 30, cursor: 'pointer',
            alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}
        >✕</button>
        <div className="gen-eyebrow"><span className="gen-eyebrow-dot" />Brand Chat</div>
        <h1 className="gen-hero-h1">Talk to your<br /><em>growth system.</em></h1>
        <p className="gen-hero-sub">Our AI is trained to solve your business problems.<br /><strong>Ask about strategy, website, graphics, offers, or next steps.</strong></p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => { startNew(); setMobileSidebarOpen(false) }} style={{ padding: '9px 14px', background: accent, color: '#000', border: 'none', borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>+ New Chat</button>
          <a href="/generate" style={{ padding: '9px 14px', border: '1px solid var(--border2)', color: 'var(--muted)', borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>Generation</a>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase' }}>History</span>
            <span style={{ fontSize: 10, color: accent, fontFamily: "'DM Mono', monospace" }}>Brand Chat</span>
          </div>
          <div style={{ maxHeight: 430, overflowY: 'auto' }}>
            {loadingThreads ? <div style={{ padding: 18, color: 'var(--muted)', fontSize: 12 }}>Loading chats…</div> : threads.length === 0 ? <div style={{ padding: 18, color: 'var(--muted)', fontSize: 12, lineHeight: 1.6 }}>No chats yet. Start asking about your website, strategy, graphics, offers, or automation.</div> : threads.map(t => (
              <button key={t.id} onClick={() => { loadThread(t.id); setMobileSidebarOpen(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', background: threadId === t.id ? `${accent}12` : 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                <div style={{ color: threadId === t.id ? accent : 'var(--cream)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 5 }}>{t.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted2)', fontSize: 9, fontFamily: "'DM Mono', monospace" }}><span>{t.messageCount} msgs</span><span>{t.lastMessageAt ? new Date(t.lastMessageAt).toLocaleDateString('en-IN') : ''}</span></div>
              </button>
            ))}
          </div>
        </div>
      </div>}
      <div className="generate-preview-side">
        <div style={{ height: 48, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Mobile history toggle button */}
            {hasStartedChat && (
              <button
                onClick={() => setMobileSidebarOpen(v => !v)}
                className="chat-history-toggle"
                aria-label="Chat history"
                style={{
                  background: 'transparent', border: '1px solid var(--border2)',
                  color: 'var(--muted)', borderRadius: 6, width: 30, height: 30, cursor: 'pointer',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>
                </svg>
              </button>
            )}
            <div style={{ fontSize: 10, color: accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>Brand Syndicate AI Chat</div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{messages.filter(m => m.role === 'assistant').length} replies</div>
        </div>
        <div className="generate-preview-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 0, boxSizing: 'border-box', minWidth: 0, width: '100%' }}>
          {messages.length === 0 && (
            <div style={{ maxWidth: 680, margin: 'auto', textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--cream)', marginBottom: 10 }}>Ask Brand Syndicate anything.</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.8, marginBottom: 24 }}>Ask about your brand, website, graphics, strategy, offers, content, or next steps.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>{quickPrompts.map(q => <button key={q} onClick={() => sendMessage(q)} style={{ padding: '8px 14px', border: `1px solid ${accent}40`, background: `${accent}08`, color: accent, borderRadius: 999, cursor: 'pointer', fontSize: 11 }}>{q}</button>)}</div>
            </div>
          )}
          {messages.map((m, idx) => {
            const isUser = m.role === 'user'
            const prevRole = idx > 0 ? messages[idx - 1].role : null
            const nextRole = idx < messages.length - 1 ? messages[idx + 1].role : null
            const isFirst = prevRole !== m.role
            const isLast = nextRole !== m.role
            const userRadius = isFirst && isLast ? '14px' : isFirst ? '14px 14px 4px 14px' : isLast ? '4px 14px 14px 14px' : '4px 14px 14px 4px'
            const aiRadius = isFirst && isLast ? '14px' : isFirst ? '14px 14px 14px 4px' : isLast ? '4px 4px 14px 14px' : '4px 4px 4px 4px'
            return (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', marginTop: isFirst ? 14 : 2, marginBottom: isLast ? 6 : 0, width: '100%', flexShrink: 0, minWidth: 0, boxSizing: 'border-box' }}>
                {isFirst && (
                  <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginBottom: 4, paddingLeft: isUser ? 0 : 4, paddingRight: isUser ? 4 : 0, width: '100%', boxSizing: 'border-box', textAlign: isUser ? 'right' : 'left' }}>
                    {isUser ? 'You' : 'Brand Syndicate AI'}
                  </div>
                )}
                <div style={{ maxWidth: 'min(72%, 420px)', background: isUser ? accent : 'var(--surface)', color: isUser ? '#000' : 'var(--cream)', border: isUser ? 'none' : '1px solid var(--border)', borderRadius: isUser ? userRadius : aiRadius, padding: '11px 14px', lineHeight: 1.7, fontSize: 13, wordBreak: 'break-word', boxSizing: 'border-box' }}>
                  {formatChatContent(m.content)}
                </div>
              </div>
            )
          })}
          {sending && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginTop: 14, flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginBottom: 4, paddingLeft: 4 }}>Brand Syndicate AI</div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '11px 14px', color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', display: 'inline-block', animation: 'bcDot 1.2s 0s ease-in-out infinite' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', display: 'inline-block', animation: 'bcDot 1.2s 0.2s ease-in-out infinite' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', display: 'inline-block', animation: 'bcDot 1.2s 0.4s ease-in-out infinite' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ borderTop: '1px solid var(--border)', padding: 12, display: 'flex', gap: 10 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Ask about your business, website, strategy, graphics, costs, WhatsApp flow…"
            rows={2}
            style={{
              flex: 1,
              resize: 'none',
              background: 'var(--surface)',
              border: '1px solid var(--border2)',
              color: 'var(--cream)',
              borderRadius: 10,
              padding: '12px 14px',
              outline: 'none',
              /* 16px minimum prevents iOS from auto-zooming on focus */
              fontSize: 16,
              lineHeight: 1.5,
              fontFamily: "'DM Sans', 'Manrope', system-ui, sans-serif",
              /* Prevent iOS Safari rendering quirks */
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim()}
            style={{
              width: 72,
              borderRadius: 10,
              background: accent,
              color: '#000',
              border: 'none',
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: sending ? 'wait' : 'pointer',
              opacity: sending || !input.trim() ? 0.5 : 1,
              flexShrink: 0,
            }}
          >Send</button>
        </div>
      </div>
    </div>
  )
}

// ── BusinessGenerateStudio, fully self-contained ──────────────────────────
function BusinessGenerateStudio({ onSwitchMode }: { onSwitchMode: () => void }) {
  const searchParams = useSearchParams()
  const [pvTab, setPvTab] = React.useState<BizTab>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      // If loading a past ?gen=, use ?tab= param directly to avoid flash of wrong tab
      if (sp.get('gen')) {
        const tabP = sp.get('tab')
        if (tabP && ['logo','graphics','copy','website','images','strategy','calendar'].includes(tabP))
          return tabP as BizTab
        return 'logo' as BizTab  // sensible default; useEffect overrides to first inferred tab
      }
      // If arriving with ?chip=, default pvTab to match so preview shows correct tab immediately
      const chip = (sp.get('chip') ?? '').toLowerCase()
      if (chip === 'brand images' || chip === 'brand%20images' || chip === 'images' || chip === 'graphics') return 'images' as BizTab
      if (chip === 'logo design' || chip === 'logo') return 'logo' as BizTab
      if (chip === 'business strategy' || chip === 'strategy') return 'strategy' as BizTab
      if (chip === 'content calendar' || chip === 'calendar') return 'calendar' as BizTab
      if (chip === 'website') return 'website' as BizTab    }
    return 'logo' as BizTab
  })
  const [mobilePanel, setMobilePanel] = React.useState<'form' | 'preview'>('form')

  // Form state
  // Pre-fill from URL params (passed from homepage prompt → login → here)
  const bizSearchParams = useSearchParams()
  const urlPrompt = bizSearchParams?.get('prompt') || ''
  // Homepage prompt is the full business description — use it as both the visible label
  // AND the description field so the QC pipeline/validateBreif has context to work with
  const [companyName, setCompanyName] = React.useState(urlPrompt)
  const [industry, setIndustry] = React.useState('')
  const [tagline, setTagline] = React.useState('')
  const [description, setDescription] = React.useState(urlPrompt)
  const [audience, setAudience] = React.useState('')
  const [tone, setTone] = React.useState<BizTone>('professional')
  const [outputTypes, setOutputTypes] = React.useState<BizTab[]>([])

  // Generation state
  // If arriving from homepage with a prompt, start in loading state immediately (no form flash)
  const [loading, setLoading] = React.useState(!!bizSearchParams?.get('prompt')?.trim())
  const [loadingHistory, setLoadingHistory] = React.useState(false)
  const [genStep, setGenStep] = React.useState(0)
  const [generationStartedAt, setGenerationStartedAt] = React.useState<number | null>(null)
  const [loadingElapsedSec, setLoadingElapsedSec] = React.useState(0)
  const [genThoughts, setGenThoughts] = React.useState<string[]>([])
  const [completedThoughts, setCompletedThoughts] = React.useState<string[]>([])
  const [crossQuestion, setCrossQuestion] = React.useState<string | null>(null)
  const [crossAnswer, setCrossAnswer] = React.useState('')
  const [awaitingAnswer, setAwaitingAnswer] = React.useState(false)
  const [output, setOutput] = React.useState<BusinessOutput | null>(null)
  const [bizGenId, setBizGenId] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState('')
  const [toastType, setToastType] = React.useState<'success'|'error'|'info'>('info')
  const [showToast, setShowToast] = React.useState(false)
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [genError, setGenError] = React.useState<string | null>(null)
  const [activeChip, setActiveChip] = React.useState('Website')
  // Multi-gen: track how many generations are running, and queue warning
  const [activeGenCount, setActiveGenCount] = React.useState(0)

  React.useEffect(() => {
    if (!loading || !generationStartedAt) { setLoadingElapsedSec(0); return }
    const timer = setInterval(() => {
      setLoadingElapsedSec(Math.max(0, Math.round((Date.now() - generationStartedAt) / 1000)))
    }, 1000)
    return () => clearInterval(timer)
  }, [loading, generationStartedAt])
  const [multiGenWarning, setMultiGenWarning] = React.useState<string | null>(null)
  // Usage badge — bump to re-fetch after any generation completes
  const [usageRefreshTrigger, setUsageRefreshTrigger] = React.useState(0)

  // History state
  const [historyItems, setHistoryItems] = React.useState<Array<{
    id: string; createdAt: string; inputData: Record<string, unknown>
  }>>([])
  const [showHistory, setShowHistory] = React.useState(false)
  const [historyLoading, setHistoryLoading] = React.useState(false)

  // Template-from-URL state (lifted from BizWebsitePreview so it works without output)
  const [templateSampleId, setTemplateSampleId] = React.useState<string | null>(null)
  const [templateHtml, setTemplateHtml] = React.useState<string>('')
  const [templateSavedId, setTemplateSavedId] = React.useState<string | null>(null)
  const [templateSlug, setTemplateSlug] = React.useState<string | null>(null)
  const [templateSaveStatus, setTemplateSaveStatus] = React.useState<'idle'|'saving'|'saved'|'error'>('idle')

  // FIX: Blob URL for templateHtml — avoids srcDoc/sandbox escape issue on preview side
  const [templateBlobUrl, setTemplateBlobUrl] = React.useState<string>('')
  React.useEffect(() => {
    if (!templateHtml) { setTemplateBlobUrl(''); return }
    const blob = new Blob([templateHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    setTemplateBlobUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [templateHtml])

  const accent = '#C9A84C'

  // ── Load from URL: ?gen=<id> (preview/edit) or ?from=<id> (remix/prefill) ─
  // Also: if ?tab=website with no ?gen=, auto-load the latest generation so
  // the website dashboard opens immediately without requiring a new generate.
  React.useEffect(() => {
    const genId  = searchParams.get('gen')   // load output + inputs (preview mode)
    const fromId = searchParams.get('from')  // load inputs only (remix mode)
    const tabParam = searchParams.get('tab') // e.g. 'website' from nav link
    const chipParam  = searchParams.get('chip')   // e.g. 'website' from template cards
    const sampleParam = searchParams.get('sample') // e.g. 'bakery' from template cards
    const websiteId = searchParams.get('websiteId') // load saved website by ID for editing

    // ?websiteId=X → load an existing saved website directly into the editor (no re-save)
    if (websiteId) {
      setPvTab('website')
      setMobilePanel('preview')
      setTemplateSaveStatus('saving')   // FIX: show loading state while fetch is in-flight
      setTemplateSavedId(websiteId)
      fetch(`/api/user-websites/${websiteId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d?.website) { setTemplateSaveStatus('error'); return }
          const html = d.website.htmlContent
          if (html) setTemplateHtml(html)
          if (d.website.templateId) setTemplateSampleId(d.website.templateId)
          if (d.website.slug) setTemplateSlug(d.website.slug)
          setTemplateSaveStatus('saved')   // FIX: mark saved only after content is loaded
        })
        .catch(e => { console.error('Load website error:', e); setTemplateSaveStatus('error') })
      return
    }

    // ?chip=website&sample=X → jump to website tab and auto-select + save the sample
    // Also handle ?chip=Website (capitalised, from my-work "New Website" link) — case-insensitive
    const chipNorm = chipParam ? chipParam.toLowerCase() : null
    if (chipNorm === 'website' && sampleParam) {
      setPvTab('website')
      setMobilePanel('preview')
      setTemplateSampleId(sampleParam)
      setTemplateSaveStatus('saving')
      fetch(`/samples/${sampleParam}.html`)
        .then(async r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.text()
        })
        .then(async html => {
          if (!html?.trim()) { setTemplateSaveStatus('error'); return }
          setTemplateHtml(html)
          const sample = WEBSITE_SAMPLES.find(s => s.id === sampleParam)
          const safeName = (sample?.label ?? sampleParam).trim() || 'My Website'
          try {
            const res = await fetch('/api/user-websites', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: safeName,
                templateId: sampleParam,
                templateLabel: sample?.label ?? sampleParam,
                htmlContent: html,
                isGenerated: false,
                isPublished: true,
                prompt: `Template selected: ${sample?.label || sampleParam}`,
              }),
            })
            if (res.ok) {
              const j = await res.json()
              setTemplateSavedId(j.website?.id ?? null)
              setTemplateSlug(j.website?.slug ?? null)
              setTemplateSaveStatus('saved')
            } else {
              res.json().catch(() => ({})).then(err => console.error('Save error:', res.status, err))
              setTemplateSaveStatus('error')
            }
          } catch (e) {
            console.error('Save network error:', e)
            setTemplateSaveStatus('error')
          }
        })
        .catch(e => {
          console.error('Fetch HTML error:', e)
          setTemplateSaveStatus('error')
        })
      return
    }
    const targetId = genId || fromId

    // ?chip=<label> without sample → just activate that chip on the form
    if (chipNorm && !sampleParam && !genId && !fromId) {
      // Map lowercase chip param → display label
      const chipMap: Record<string, string> = {
        website: 'Website',
        logo: 'Logo Design',
        'logo design': 'Logo Design',
        'logo-design': 'Logo Design',
        images: 'Brand Images',
        graphics: 'Brand Images',
        'brand images': 'Brand Images',
        'brand-images': 'Brand Images',
        strategy: 'Business Strategy',
        'business strategy': 'Business Strategy',
        'business-strategy': 'Business Strategy',
        calendar: 'Content Calendar',
        'content calendar': 'Content Calendar',
        'content-calendar': 'Content Calendar',
      }
      const matchedChip = chipMap[chipNorm]
      if (matchedChip) {
        setActiveChip(matchedChip)
        if (chipNorm === 'website') { setPvTab('website'); setMobilePanel('preview') }
        if (chipNorm === 'strategy' || chipNorm === 'business-strategy') { setPvTab('strategy'); setMobilePanel('preview') }
        if (chipNorm === 'calendar' || chipNorm === 'content-calendar') { setPvTab('calendar'); setMobilePanel('preview') }
      }
    }

    // If ?tab= is set (from nav), jump to that tab and switch to preview panel
    if (tabParam && ['logo','graphics','copy','website','images','strategy','calendar'].includes(tabParam)) {
      setPvTab(tabParam as BizTab)
      setMobilePanel('preview')
    }

    // If no explicit gen/from id, try loading latest generation —
    // BUT skip entirely if ?prompt= is present — user is generating something NEW
    // and we must not pollute state with a previous generation.
    const promptParam2 = searchParams.get('prompt')
    if (!targetId && !promptParam2?.trim()) {
      setLoadingHistory(true)
      fetch('/api/generate/latest')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || !data.outputData) return
          setOutput(data.outputData as BusinessOutput)
          setBizGenId(data.id)
          setGenStep(4)
          setMobilePanel('preview')
          // Restore saved thought process if available
          const savedThoughts = (data.outputData as Record<string, unknown>)?._thoughtProcess
          if (Array.isArray(savedThoughts) && savedThoughts.length > 0) setCompletedThoughts(savedThoughts as string[])
          if (data.inputData) {
            const i = data.inputData as Record<string, unknown>
            if (i.companyName)  setCompanyName(String(i.companyName))
            if (i.industry)     setIndustry(String(i.industry))
            if (i.tagline)      setTagline(String(i.tagline))
            if (i.description)  setDescription(String(i.description))
            if (i.audience)     setAudience(String(i.audience))
            if (i.tone)         setTone(i.tone as BizTone)
            // Infer outputTypes from saved list OR from what's in outputData
            const inferred = inferOutputTypes(i.outputTypes, data.outputData as Record<string, unknown>)
            setOutputTypes(inferred)
            // Auto-switch to first available tab
            if (inferred.length > 0) setPvTab(inferred[0] as BizTab)
          }
          if (tabParam) setPvTab(tabParam as BizTab)
        })
        .catch(() => {})
        .finally(() => setLoadingHistory(false))
      return
    }

    setLoadingHistory(true)
    fetch(`/api/generate/load-business?id=${targetId}`)
      .then(r => {
        if (!r.ok) {
          // Could be a standalone campaign-image generation — try generic load
          if (genId) {
            return fetch(`/api/generate/load?id=${genId}`).then(r2 => r2.ok ? r2.json() : null)
          }
          return null
        }
        return r.json()
      })
      .then(data => {
        if (!data) return
        // Always restore form inputs
        if (data.inputData) {
          const i = data.inputData as Record<string, unknown>
          if (i.companyName)  setCompanyName(String(i.companyName))
          if (i.industry)     setIndustry(String(i.industry))
          if (i.tagline)      setTagline(String(i.tagline))
          if (i.description)  setDescription(String(i.description))
          if (i.audience)     setAudience(String(i.audience))
          if (i.tone)         setTone(i.tone as BizTone)
          // Infer outputTypes from saved list OR from what's in outputData
          const inferred = inferOutputTypes(
            i.outputTypes,
            data.outputData as Record<string, unknown> | null,
          )
          setOutputTypes(inferred)
        }
        // If it's a ?gen= (preview) load, also restore output
        if (genId && data.outputData) {
          const od = data.outputData as Record<string, unknown>
          setOutput(od as unknown as BusinessOutput)
          setBizGenId(data.id)
          setGenStep(4)
          setMobilePanel('preview')
          // Restore saved thought process if available
          if (Array.isArray(od._thoughtProcess) && od._thoughtProcess.length > 0) setCompletedThoughts(od._thoughtProcess as string[])
          // Re-infer and set preview tab to first available asset
          const inferred = inferOutputTypes(
            (data.inputData as Record<string, unknown>)?.outputTypes,
            od,
          )
          if (inferred.length > 0) setPvTab(inferred[0] as BizTab)
          // ?tab= param (passed from my-work Preview link) always wins — open exactly what user generated
          if (tabParam && inferred.includes(tabParam as BizTab)) setPvTab(tabParam as BizTab)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function showMsg(msg: string, type: 'success'|'error'|'info' = 'info') {
    setToast(msg); setToastType(type); setShowToast(true)
    if (type === 'error') setGenError(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    const delay = type === 'error' ? 6000 : 2800
    toastTimer.current = setTimeout(() => setShowToast(false), delay)
  }

  function friendlyLimitMessage(chip: string) {
    return chip === 'Website'
      ? 'Please select a website from templates — you ran out of generations.'
      : 'We could not generate content. Please upgrade your plan.'
  }

  async function precheckGenerationLimit(chip: string): Promise<boolean> {
    try {
      const r = await fetch('/api/usage', { cache: 'no-store' })
      if (!r.ok) return true
      const d = await r.json()
      if (d && d.allowed === false) {
        showMsg(friendlyLimitMessage(chip), 'error')
        setUsageRefreshTrigger(n => n + 1)
        return false
      }
    } catch { /* do not block if usage endpoint is temporarily unavailable */ }
    return true
  }

  function toggleType(t: BizTab) {
    setOutputTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }


  async function handleGenerate(chipOverride?: string) {
    const chip = chipOverride ?? activeChip
    if (!companyName.trim()) { showMsg('Company name is required'); return }

    const canGenerate = await precheckGenerationLimit(chip)
    if (!canGenerate) return

    // Multi-gen protection: if already running, show a warning instead of queuing
    if (activeGenCount > 0) {
      setMultiGenWarning(`⏳ Still generating ${chip}… please wait for it to finish before starting a new one.`)
      setTimeout(() => setMultiGenWarning(null), 4000)
      return
    }

    setActiveGenCount(c => c + 1)
    setMultiGenWarning(null)
    setGenError(null)
    setGenerationStartedAt(Date.now())
    setLoading(true); setGenStep(0)
    const stepInterval = setInterval(() => setGenStep(s => Math.min(s + 1, 3)), 800)

    try {
      if (chip === 'Website') {
        // Streaming website generation with thought process
        setGenThoughts([])
        setCrossQuestion(null)
        setAwaitingAnswer(false)

        // LIVE PREVIEW FIX: switch to website tab immediately so user sees streaming progress
        setPvTab('website')
        setMobilePanel('preview')
        setOutputTypes(prev => prev.includes('website') ? prev : [...prev, 'website'])

        const res = await fetch('/api/generate-website/stream', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName, industry, tagline, description: (crossAnswer ? description + '\n[User clarification: ' + crossAnswer + ']' : description), audience, tone,
            primaryColors: output?.primaryColors }),
        })
        if (!res.ok || !res.body) {
          const d = await res.json().catch(() => ({})) as { error?: string; limitReached?: boolean }
          throw new Error(d.limitReached ? friendlyLimitMessage('Website') : (d.error || 'Website generation failed'))
        }
        
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let websiteHtml = ''
        // Track template_json meta from the done event for auto-save
        const websiteGenMeta: { selectedTemplateId?: string; selectedTemplateLabel?: string; generationMode?: string } = {}
        // Throttle live preview updates — every 80 tokens to avoid iframe thrash
        // Only push when we have a structurally complete document to avoid partial
        // <script> tags breaking JS and causing IntersectionObserver-like hidden content.
        let tokensSinceLastUpdate = 0
        const PREVIEW_UPDATE_INTERVAL = 80

        // Ensure output state exists so BizWebsitePreview renders
        setOutput(prev => prev ?? {
          companyName, industry, tagline: tagline || companyName,
          brandStory: description || '', brandVoice: tone,
          logoConceptName: '', logoConceptDescription: '', logoSymbolIdea: '',
          primaryColors: ['#C9A84C', '#0A0A0E'], logoKeywords: [],
          websiteHtml: '',
        } as unknown as BusinessOutput)
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let evt: Record<string, any> | null = null
            try { evt = JSON.parse(line.slice(6)) } catch { continue /* non-JSON line, skip */ }
            if (!evt) continue
            if (evt.type === 'thought') {
              setGenThoughts(prev => [...prev, evt!.text])
            } else if (evt.type === 'question') {
              setCrossQuestion(evt.text)
              setAwaitingAnswer(true)
              clearInterval(stepInterval)
              setLoading(false)
              setActiveGenCount(c => Math.max(0, c - 1))
              return
            } else if (evt.type === 'error') {
              throw new Error(evt.limitReached ? friendlyLimitMessage('Website') : (evt.text || 'Website generation failed'))
            } else if (evt.type === 'token') {
              websiteHtml += evt.text
              tokensSinceLastUpdate++
              // LIVE PREVIEW: push partial HTML to preview every N tokens.
              // CRITICAL: only push when we have at least a complete <style> + <body> opening
              // so inline scripts never execute in a half-written state (causes hidden content).
              // We wait for the body tag to appear before showing anything.
              if (tokensSinceLastUpdate >= PREVIEW_UPDATE_INTERVAL) {
                tokensSinceLastUpdate = 0
                const hasBody = /<body[^>]*>/i.test(websiteHtml)
                const hasStyle = /<\/style>/i.test(websiteHtml)
                if (websiteHtml.length > 2000 && hasBody && hasStyle) {
                  // Wrap partial in a closed document so the browser doesn't choke
                  const partial = websiteHtml.endsWith('</html>')
                    ? websiteHtml
                    : websiteHtml + '\n</body>\n</html>'
                  setTemplateHtml(partial)
                }
              }
            } else if (evt.type === 'html') {
              websiteHtml = evt.html
            } else if (evt.type === 'done') {
              websiteHtml = evt.html || websiteHtml
              // Capture template_json meta for auto-save
              if (evt.meta?.selectedTemplateId) {
                websiteGenMeta.selectedTemplateId    = evt.meta.selectedTemplateId
                websiteGenMeta.selectedTemplateLabel = evt.meta.selectedTemplateLabel
                websiteGenMeta.generationMode        = evt.meta.generationMode
              }
            }
          }
        }
        
        // PARTIAL HTML FIX: show whatever was generated, even if incomplete
        // Don't throw on partial — let the server-side ensureCompleteHtml handle repair
        if (!websiteHtml || websiteHtml.trim().length < 100) {
          throw new Error('Website generation failed, empty response')
        }
        clearInterval(stepInterval); setGenStep(4)
        setCrossQuestion(null); setCrossAnswer('')
        setOutput(prev => prev ? { ...prev, websiteHtml } : {
          companyName, industry, tagline: tagline || companyName,
          brandStory: description || '', brandVoice: tone,
          logoConceptName: '', logoConceptDescription: '', logoSymbolIdea: '',
          primaryColors: ['#C9A84C', '#0A0A0E'], logoKeywords: [],
          websiteHtml,
        } as unknown as BusinessOutput)
        setTemplateHtml(websiteHtml)
        showMsg('✦ Website generated!', 'success')
        // Auto-save + auto-publish generated website to My Websites
        // Capture current thoughts snapshot for persistence
        const thoughtsForWebsite = [...genThoughts]
        fetch('/api/user-websites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: companyName,
            htmlContent: websiteHtml,
            isGenerated: true,
            isPublished: true,
            prompt: [companyName, industry, tagline, description, audience].filter(Boolean).join(' · '),
            ...(websiteGenMeta.selectedTemplateId ? {
              templateId:    websiteGenMeta.selectedTemplateId,
              templateLabel: websiteGenMeta.selectedTemplateLabel,
            } : {}),
          }),
        }).then(async r => {
          if (r.ok) {
            const { website } = await r.json()
            if (website?.id) setTemplateSavedId(website.id)
            if (website?.slug) setTemplateSlug(website.slug)
          }
        }).catch(() => {})
        // Save thoughts to Generation record if one was created (via generate/update or inline)
        // For website chip, also try persisting via generate/latest after a short delay
        if (thoughtsForWebsite.length > 0) {
          setTimeout(() => {
            setBizGenId(currentId => {
              if (currentId) {
                fetch(`/api/generate/update?id=${currentId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ _thoughtProcess: thoughtsForWebsite }),
                }).catch(() => {})
              }
              return currentId
            })
          }, 1500)
        }

      } else if (chip === 'Logo Design') {
        // ChatGPT/OpenAI image logo only. No Claude SVG or Claude brand-data fallback.
        const logoRes = await fetch('/api/generate-logo-image', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName,
            industry,
            logoConceptName: output?.logoConceptName || companyName,
            symbolIdea: output?.logoSymbolIdea || '',
            primaryColors: output?.primaryColors || ['#C9A84C', '#0A0A0E'],
            tone,
          }),
        })
        clearInterval(stepInterval); setGenStep(4)
        let logoImageUri: string | null = null
        const ld = await logoRes.json().catch(() => ({})) as { imageDataUri?: string; error?: string; missingKey?: boolean; limitReached?: boolean; resetAt?: string; generationId?: string }
        if (logoRes.ok && ld.imageDataUri) {
          logoImageUri = ld.imageDataUri
          if (ld.generationId) setBizGenId(ld.generationId)
        } else if (ld.missingKey) {
          console.error('[logo] missing OPENAI_API_KEY')
          showMsg('Sorry, logo generation is unavailable right now.', 'error')
        } else if (ld.limitReached) {
          throw new Error(friendlyLimitMessage(chip))
        } else {
          showMsg(ld.error || 'Logo generation failed. Please try again.', 'error')
        }

        if (logoImageUri) {
          const logoOnlyOutput = {
            companyName,
            industry,
            tagline: tagline || companyName,
            brandStory: description || '',
            brandVoice: tone || 'professional',
            logoConceptName: companyName,
            logoConceptDescription: 'ChatGPT image logo generated for this brand.',
            logoSymbolIdea: '',
            primaryColors: output?.primaryColors || ['#C9A84C', '#0A0A0E'],
            logoKeywords: [],
            bannerHeadline: '', bannerSubheadline: '', bannerCta: '', bannerTheme: '',
            flyerTitle: '', flyerSubtitle: '', flyerBody: '', flyerCta: '', flyerHighlights: [],
            posterHeadline: '', posterTagline: '', posterVisualDirection: '', posterCallout: '',
            copyHeadlines: [], copySocialCaptions: [], copyEmailSubject: '', copyEmailBody: '', copyCtas: [], copyAdCopy: '',
            _logoImageUri: logoImageUri,
          } as unknown as BusinessOutput

          setOutput(prev => prev ? { ...prev, ...logoOnlyOutput, _logoImageUri: logoImageUri } as BusinessOutput : logoOnlyOutput)
          if (bizGenId) {
            fetch(`/api/generate/update?id=${bizGenId}`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ _logoImageUri: logoImageUri }),
            }).catch(() => {})
          }
          setPvTab('logo'); setMobilePanel('preview')
          setOutputTypes(prev => prev.includes('logo') ? prev : [...prev, 'logo'])
          showMsg('◈ Logo generated!', 'success')
        }

      } else if (chip === 'Business Strategy') {
        // Claude Sonnet strategy
        const res = await fetch('/api/generate-strategy', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName, industry, tagline, description, audience, tone }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (data.limitReached) throw new Error(friendlyLimitMessage(chip))
          throw new Error(data.error || 'Strategy generation failed')
        }
        clearInterval(stepInterval); setGenStep(4)
        setOutput(prev => prev ? { ...prev, strategy: data.strategy } : {
          companyName, industry, tagline: tagline || companyName,
          brandStory: description || '', brandVoice: tone,
          logoConceptName: '', logoConceptDescription: '', logoSymbolIdea: '',
          primaryColors: ['#C9A84C', '#0A0A0E'], logoKeywords: [],
          strategy: data.strategy,
        } as unknown as BusinessOutput)
        setPvTab('strategy'); setMobilePanel('preview')
        setOutputTypes(prev => prev.includes('strategy') ? prev : [...prev, 'strategy'])
        showMsg('◆ Strategy generated!', 'success')

      } else if (chip === 'Content Calendar') {
        // Claude Sonnet calendar
        const res = await fetch('/api/generate-calendar', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName, industry, tagline, description, audience, tone }),
        })
        const data = await res.json()
        if (!res.ok) {
          if (data.limitReached) throw new Error(friendlyLimitMessage(chip))
          throw new Error(data.error || 'Calendar generation failed')
        }
        clearInterval(stepInterval); setGenStep(4)
        setOutput(prev => prev ? { ...prev, contentCalendar: data.contentCalendar } : {
          companyName, industry, tagline: tagline || companyName,
          brandStory: description || '', brandVoice: tone,
          logoConceptName: '', logoConceptDescription: '', logoSymbolIdea: '',
          primaryColors: ['#C9A84C', '#0A0A0E'], logoKeywords: [],
          contentCalendar: data.contentCalendar,
        } as unknown as BusinessOutput)
        setPvTab('calendar'); setMobilePanel('preview')
        setOutputTypes(prev => prev.includes('calendar') ? prev : [...prev, 'calendar'])
        showMsg('▤ Content calendar generated!', 'success')
      } else {
        // Brand Images: progressive poster generation.
        // A pending DB row is created first, then /generate-graphics updates it after
        // every rendered variation. The preview panel polls that row so users see
        // variation 1 immediately instead of waiting for all 4.
        if (!companyName.trim()) { clearInterval(stepInterval); showMsg('Company name is required'); setLoading(false); return }

        setPvTab('images'); setMobilePanel('preview')
        setOutputTypes(prev => prev.includes('images') ? prev : [...prev, 'images'])
        setOutput(prev => {
          const base: BusinessOutput = prev ?? {
            companyName, industry, tagline: tagline || companyName,
            brandStory: description || '', brandVoice: tone,
            logoConceptName: '', logoConceptDescription: '', logoSymbolIdea: '',
            primaryColors: ['#C9A84C', '#0A0A0E'], logoKeywords: [],
          } as unknown as BusinessOutput
          return { ...base, isPartial: true, _generatedImages: [], _persistedImages: [] } as unknown as BusinessOutput
        })

        let mediaGenerationId: string | null = null
        let previewPoll: ReturnType<typeof setInterval> | null = null
        try {
          const startRes = await fetch('/api/generate-graphics/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName, industry, tagline, generationType: 'campaign-image' }),
          })
          const startData = await startRes.json().catch(() => ({}))
          if (startData?.limitReached) throw new Error(friendlyLimitMessage(chip))
          mediaGenerationId = typeof startData.generationId === 'string' ? startData.generationId : null
          if (mediaGenerationId) {
            setBizGenId(mediaGenerationId)
            previewPoll = setInterval(async () => {
              try {
                const pollRes = await fetch(`/api/generate/load-business?id=${encodeURIComponent(mediaGenerationId!)}`, { cache: 'no-store' })
                if (!pollRes.ok) return
                const pollData = await pollRes.json()
                const od = pollData?.outputData as any
                const partialGraphics = od?._generatedImages ?? od?.graphics ?? od?.variations
                if (Array.isArray(partialGraphics) && partialGraphics.length > 0) {
                  setOutput(prev => {
                    const base: BusinessOutput = prev ?? {
                      companyName, industry, tagline: tagline || companyName,
                      brandStory: description || '', brandVoice: tone,
                      logoConceptName: '', logoConceptDescription: '', logoSymbolIdea: '',
                      primaryColors: ['#C9A84C', '#0A0A0E'], logoKeywords: [],
                    } as unknown as BusinessOutput
                    return { ...base, ...od, _generatedImages: partialGraphics, _persistedImages: partialGraphics } as BusinessOutput
                  })
                }
              } catch { /* polling is best-effort */ }
            }, 1400)
          }
        } catch (startErr) {
          if (startErr instanceof Error && startErr.message === friendlyLimitMessage(chip)) throw startErr
          /* fallback: normal generation still works */
        }

        const res = await fetch('/api/generate-graphics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName, industry, tagline,
            brandStory: description,
            primaryColors: output?.primaryColors || ['#C9A84C', '#0A0A0E'],
            tone,
            logoKeywords: output?.logoKeywords || [],
            generationId: mediaGenerationId,
          }),
        })
        const data = await res.json()
        if (previewPoll) clearInterval(previewPoll)
        if (!res.ok) {
          if (data.limitReached) throw new Error(friendlyLimitMessage(chip))
          throw new Error(data.error || 'Image generation failed')
        }
        clearInterval(stepInterval); setGenStep(4)
        const mergedGraphics = data.graphics || []
        setOutput(prev => {
          const base: BusinessOutput = prev ?? {
            companyName, industry, tagline: tagline || companyName,
            brandStory: description || '', brandVoice: tone,
            logoConceptName: '', logoConceptDescription: '', logoSymbolIdea: '',
            primaryColors: ['#C9A84C', '#0A0A0E'], logoKeywords: [],
          } as unknown as BusinessOutput
          return { ...base, _generatedImages: mergedGraphics, _persistedImages: mergedGraphics } as BusinessOutput
        })
        if (data.generationId) setBizGenId(data.generationId)
        showMsg('◉ Brand images generated!', 'success')
      }
    } catch (err) {
      clearInterval(stepInterval)
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.'
      if (msg === friendlyLimitMessage('Brand Images')) {
        setOutput(prev => prev && (prev as any).isPartial ? null : prev)
        setOutputTypes(prev => prev.filter(x => x !== 'images'))
      }
      if (msg === friendlyLimitMessage('Website')) {
        setTemplateHtml('')
        setTemplateSampleId(null)
        setOutputTypes(prev => prev.filter(x => x !== 'website'))
      }
      console.error('[generate]', err); showMsg(msg, 'error')
    } finally {
      setLoading(false)
      setActiveGenCount(c => Math.max(0, c - 1))
      setUsageRefreshTrigger(n => n + 1)  // refresh quota badge
      // Snapshot thoughts so the summary panel stays visible after loading clears
      setGenThoughts(prev => {
        if (prev.length > 0) {
          setCompletedThoughts(prev)
          // Persist to Generation record if one exists (Logo/Strategy/Calendar/Images chips)
          // Website chip thoughts are saved inline below after the auto-save resolves
          setBizGenId(currentId => {
            if (currentId && prev.length > 0) {
              fetch(`/api/generate/update?id=${currentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _thoughtProcess: prev }),
              }).catch(() => {})
            }
            return currentId
          })
        }
        return prev
      })
    }
  }

  // History fetch
  async function fetchHistory() {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/generate/list?limit=12')
      if (res.ok) {
        const data = await res.json()
        setHistoryItems(data.generations || [])
      }
    } catch {}
    setHistoryLoading(false)
  }

  React.useEffect(() => {
    if (showHistory) fetchHistory()
  }, [showHistory]) // eslint-disable-line react-hooks/exhaustive-deps

  // Arriving directly at Chat (e.g. "Continue chat" from My Work: ?chip=chat&threadId=...)
  // without a ?prompt= — the prompt-driven effect below won't fire, so handle it here.
  React.useEffect(() => {
    const chipParam = searchParams.get('chip')?.toLowerCase()
    const hasThreadId = Boolean(searchParams.get('threadId'))
    const hasPrompt = Boolean(searchParams.get('prompt')?.trim())
    if (!hasPrompt && (chipParam === 'chat' || hasThreadId)) {
      setActiveChip('Chat')
      setLoading(false)
      setMobilePanel('form')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-generate when user arrives from homepage with ?prompt=
  // Also reads ?chip= so the correct generation type fires (not always 'Website')
  React.useEffect(() => {
    const promptParam = searchParams.get('prompt')
    if (!promptParam?.trim()) return
    const chipParam = searchParams.get('chip')
    // Map URL chip param (e.g. 'Logo Design', 'logo design', 'logo') → exact label
    const CHIP_MAP: Record<string, string> = {
      'website': 'Website',
      'logo design': 'Logo Design',
      'logo': 'Logo Design',
      'brand images': 'Brand Images',
      'images': 'Brand Images',
      'graphics': 'Brand Images',
      'business strategy': 'Business Strategy',
      'strategy': 'Business Strategy',
      'content calendar': 'Content Calendar',
      'calendar': 'Content Calendar',
      'chat': 'Chat',
    }
    const resolvedChip = chipParam ? (CHIP_MAP[chipParam.toLowerCase()] ?? chipParam) : null
    if (resolvedChip === 'Chat') {
      setActiveChip('Chat')
      setLoading(false)
      setMobilePanel('form')
      return
    }
    if (resolvedChip && resolvedChip !== activeChip) {
      setActiveChip(resolvedChip)
      // Pass chipOverride directly so we don't race against the state update
      handleGenerate(resolvedChip)
    } else {
      handleGenerate(resolvedChip ?? activeChip)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loadingHistory) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '1px solid var(--border2)', borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Loading generation…</div>
      </div>
    )
  }

  const chips = [
    { label: 'Chat',              icon: '✧' },
    { label: 'Website',           icon: '⊕' },
    { label: 'Logo Design',       icon: '◈' },
    { label: 'Brand Images',      icon: '◉' },
    { label: 'Business Strategy', icon: '◆' },
    { label: 'Content Calendar',  icon: '▤' },
  ]

  if (activeChip === 'Chat') {
    return <BrandChatStudio accent={accent} initialPrompt={urlPrompt} initialThreadId={searchParams.get('threadId')} />
  }

  return (
    <div className="generate-layout">

      {/* ── FORM SIDE, hero-style cinematic ── */}
      <div className={`generate-form-side gen-hero-form${mobilePanel === 'preview' ? ' mobile-hidden' : ''}`}>

        {/* Cinematic background */}
        <div className="gen-hero-bg" />



        {/* Eyebrow, hide when template selected or output exists */}
        {!output && !templateHtml && (
          <div className="gen-eyebrow">
            <span className="gen-eyebrow-dot" />
            AI Brand Studio
          </div>
        )}

        {/* Headline, hide when template selected or output exists */}
        {!output && !templateHtml && (
          <>
            <h1 className="gen-hero-h1">
              Generate your<br />
              <em>brand identity.</em>
            </h1>
            <p className="gen-hero-sub">
              Logo, website, graphics and strategy<br />
              <strong>generated simultaneously in 60 seconds.</strong>
            </p>
          </>
        )}

        {/* ── Usage quota badge — always visible in form side ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 10px 0' }}>
          <UsageBadge refreshTrigger={usageRefreshTrigger} accent={accent} />
        </div>

        {/* Prompt card */}
        <div
          className="gen-prompt-wrap"
          style={!output && templateHtml ? { marginBottom: 0, flex: 1, display: 'flex', flexDirection: 'column' } : undefined}
        >
          {/* Only show the glow ring when NOT in template-mode (template card is borderless) */}
          {!(!output && templateHtml) && <div className="gen-prompt-glow" />}
          <div
            className="gen-prompt-card"
            style={!output && templateHtml ? { flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 10, overflow: 'hidden' } : undefined}
          >
            {/* ── TEMPLATE SELECTED (no output yet), show website modify panel ── */}
            {/* ── Multi-gen warning, shown when user tries to generate while one is running ── */}
            {multiGenWarning && (
              <div style={{ background: 'rgba(201,168,76,0.08)', border: `1px solid rgba(201,168,76,0.4)`, borderLeft: `3px solid ${accent}`, borderRadius: 6, margin: '0 0 14px 0', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><path d="M7 1L13 12H1L7 1z" stroke={accent} strokeWidth="1.3" strokeLinejoin="round"/><path d="M7 6v3" stroke={accent} strokeWidth="1.4" strokeLinecap="round"/><circle cx="7" cy="10.5" r="0.6" fill={accent}/></svg>
                <div style={{ fontSize: 11, color: accent, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>{multiGenWarning}</div>
              </div>
            )}

            {/* ── Cross-question panel, shown when Claude needs clarification ── */}
            {awaitingAnswer && crossQuestion && (
              <div style={{ background: 'var(--surface2)', border: `1px solid ${accent}50`, borderLeft: `3px solid ${accent}`, borderRadius: 6, margin: '0 0 14px 0', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${accent}18`, border: `1px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke={accent} strokeWidth="1.2"/><path d="M6 5.5c0-.8.7-1.5 1.5-.5s-.5 2-.5 2" stroke={accent} strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="9" r="0.5" fill={accent}/></svg>
                  </div>
                  <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono',monospace" }}>✦ Claude needs clarification</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.65, marginBottom: 14, fontFamily: "'DM Sans',sans-serif", paddingLeft: 32 }}>{crossQuestion}</div>
                <div style={{ display: 'flex', gap: 8, paddingLeft: 32 }}>
                  <input
                    value={crossAnswer}
                    onChange={e => setCrossAnswer(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setAwaitingAnswer(false); handleGenerate() } }}
                    placeholder="Your answer…"
                    style={{ flex: 1, background: 'var(--bg)', border: `1px solid ${accent}50`, color: 'var(--cream)', padding: '9px 12px', fontSize: 12, fontFamily: "'DM Sans',sans-serif", borderRadius: 4, outline: 'none' }}
                    autoFocus
                  />
                  <button onClick={() => { setAwaitingAnswer(false); handleGenerate() }} style={{ padding: '9px 16px', background: accent, color: '#000', border: 'none', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", fontWeight: 700, cursor: 'pointer', borderRadius: 4, whiteSpace: 'nowrap' }}>Continue →</button>
                </div>
                <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 8, paddingLeft: 32, fontFamily: "'DM Mono',monospace" }}>Press Enter or click Continue to resume generation</div>
              </div>
            )}

            {/* ── Thought process panel, shown while generating ── */}
            {loading && (
              <div style={{ background: 'var(--surface2)', border: `1px solid ${genThoughts.length > 0 ? `${accent}30` : 'var(--border)'}`, borderRadius: 6, margin: '0 0 14px 0', padding: '10px 12px', transition: 'border-color 0.3s' }}>
                <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: genThoughts.length > 0 ? accent : 'var(--muted)', fontFamily: "'DM Mono',monospace", marginBottom: genThoughts.length > 0 ? 8 : 0, display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.3s' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: genThoughts.length > 0 ? accent : 'var(--muted)', display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite', flexShrink: 0 }} />
                  {genThoughts.length > 0 ? 'Claude is thinking…' : `${activeChip === 'Website' ? 'Analysing your prompt' : 'Starting generation'}…`}
                  {genThoughts.length > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: 8, color: 'var(--muted2)', fontFamily: "'DM Mono',monospace" }}>{genThoughts.length} thought{genThoughts.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
                {genThoughts.length > 0 && (
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {genThoughts.map((t, i) => (
                      <div key={i} style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif", display: 'flex', gap: 6, alignItems: 'flex-start', opacity: i === genThoughts.length - 1 ? 1 : 0.5, transition: 'opacity 0.3s' }}>
                        <span style={{ color: i === genThoughts.length - 1 ? accent : 'var(--border2)', flexShrink: 0, marginTop: 2, fontSize: 8 }}>{i === genThoughts.length - 1 ? '▸' : '◇'}</span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!output && templateHtml ? (
              /* ── REDESIGNED TEMPLATE SUMMARY PANEL ─────────────────────────────
                 Full-height flex column: header (with ThemeToggle integrated),
                 AI-modify section, capabilities filler, pinned CTA — no dead space. */
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 220px)' }}>

                {/* ── HEADER: template identity + ThemeToggle in-line ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  {/* Colour-accent dot */}
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${accent}18`, border: `1px solid ${accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                    {(() => { const s = WEBSITE_SAMPLES.find(x => x.id === templateSampleId); return s?.emoji ?? '⊕' })()}
                  </div>
                  {/* Name + label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 1 }}>⊕ Website Template</div>
                    <div style={{ fontSize: 14, color: 'var(--cream)', fontFamily: "'Playfair Display', serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                      {(() => { const s = WEBSITE_SAMPLES.find(x => x.id === templateSampleId); return s?.label ?? (templateSampleId ? templateSampleId : 'AI Generated Website') })()}
                    </div>
                  </div>
                  {/* Status badge + Change + ThemeToggle row */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    {templateSaveStatus === 'saved' && (
                      <span style={{ padding: '3px 8px', background: `${accent}15`, border: `1px solid ${accent}35`, borderRadius: 3, fontSize: 8, color: accent, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>✓ Saved</span>
                    )}
                    {templateSaveStatus === 'saving' && (
                      <span style={{ padding: '3px 8px', border: '1px solid var(--border)', borderRadius: 3, fontSize: 8, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>…</span>
                    )}
                    {templateSaveStatus === 'error' && (
                      <span style={{ padding: '3px 8px', background: '#1a0808', border: '1px solid #c0392b', borderRadius: 3, fontSize: 8, color: '#e74c3c', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>✗</span>
                    )}
                    <button
                      onClick={() => { setTemplateSampleId(null); setTemplateHtml(''); setTemplateSavedId(null); setTemplateSlug(null); setTemplateSaveStatus('idle') }}
                      style={{ padding: '3px 10px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Mono', monospace", borderRadius: 3, whiteSpace: 'nowrap' }}
                    >↩ Change</button>

                  </div>
                </div>

                {/* ── AI MODIFY SECTION ── */}
                <div style={{ padding: '14px 16px 16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(201,168,76,0.04), rgba(255,255,255,0.008))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.035)' }}>
                  <div style={{ fontSize: 8.5, letterSpacing: '0.17em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700 }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M9 2l1 1L4 9H3V8L9 2z" stroke={accent} strokeWidth="1.3" strokeLinejoin="round"/></svg>
                    Modify Website with AI
                  </div>
                  <div style={{ display: 'flex', gap: 9, alignItems: 'stretch' }}>
                    <textarea
                      className="gen-prompt-input"
                      placeholder="e.g. Change hero text, add testimonials, make it dark…"
                      rows={3}
                      style={{ flex: 1, minHeight: 78, resize: 'none', borderRadius: 10, border: `1px solid ${accent}30`, background: 'rgba(255,255,255,0.055)', padding: '12px 13px', color: 'var(--cream)', fontSize: 12, lineHeight: 1.55, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.035)' }}
                      id="templateModifyPromptInput"
                    />
                    <button
                      className="gen-prompt-btn"
                      onClick={() => {
                        const el = document.getElementById('templateModifyPromptInput') as HTMLTextAreaElement
                        const val = el?.value?.trim()
                        if (!val || !templateHtml) return
                        setLoading(true)
                        fetch('/api/website-ai-edit', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ currentHtml: templateHtml, editPrompt: val }),
                        }).then(r => r.json()).then(d => {
                          if (d.updatedHtml || d.html) {
                            setTemplateHtml(d.updatedHtml || d.html)
                            el.value = ''
                            setMobilePanel('preview')
                          } else if (d.missingKey) {
                            console.error('[website-ai-edit] missing API key')
                            showMsg('Sorry, unable to apply edits right now.', 'error')
                          } else {
                            showMsg('Could not apply edit. Please try again.', 'error')
                          }
                        }).catch(() => { showMsg('Could not apply edit. Please try again.', 'error') }).finally(() => setLoading(false))
                      }}
                      disabled={loading}
                      style={{ flexShrink: 0, minHeight: 78, minWidth: 104, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', background: loading ? `${accent}55` : `linear-gradient(135deg, ${accent}, #b8892b)`, color: '#111', boxShadow: `0 12px 28px ${accent}2b, inset 0 1px 0 rgba(255,255,255,0.22)`, fontFamily: "'DM Mono', monospace", fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: loading ? 'wait' : 'pointer' }}
                    >
                      {loading
                        ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.35)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block' }} />
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      }
                      <span style={{ fontSize: 9, lineHeight: 1 }}>{loading ? 'Editing…' : 'Apply'}</span>
                    </button>
                  </div>
                  {/* Quick-prompt chips */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 11, flexWrap: 'wrap' }}>
                    {['Change hero text', 'Add testimonials', 'Dark mode colors', 'Add contact form', 'Make it minimal', 'Bold typography'].map(s => (
                      <button
                        key={s}
                        onClick={() => { const el = document.getElementById('templateModifyPromptInput') as HTMLTextAreaElement; if (el) { el.value = s; el.focus() } }}
                        style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.035)', border: `1px solid ${accent}20`, color: 'var(--muted)', fontSize: 8.5, cursor: 'pointer', borderRadius: 999, fontFamily: "'DM Mono', monospace", letterSpacing: '0.055em', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = accent; (e.currentTarget as HTMLButtonElement).style.color = accent; (e.currentTarget as HTMLButtonElement).style.background = `${accent}10` }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}20`; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.035)' }}
                      >{s}</button>
                    ))}
                  </div>
                </div>

                {/* ── CAPABILITIES FILLER — eliminates dead space ── */}
                <div style={{ flex: 1, padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
                    What you can customise
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[
                      { icon: '◑', label: 'Colours & Typography' },
                      { icon: '⬡', label: 'Hero Text & Images' },
                      { icon: '▤', label: 'Sections & Layout' },
                      { icon: '◎', label: 'Contact Form & Details' },
                      { icon: '⟨/⟩', label: 'SEO & Meta Tags' },
                      { icon: '⌘', label: 'Domain Connection' },
                    ].map((item, i, arr) => (
                      <div
                        key={item.label}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 0',
                          borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: 11, color: accent, width: 18, textAlign: 'center', flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>{item.icon}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.01em' }}>{item.label}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>✦</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── FOOTER CTA — pinned to bottom ── */}
                <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                  {templateSavedId ? (
                    <a
                      href="/my-work#websites"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        padding: '11px 16px',
                        background: accent, color: '#000',
                        textDecoration: 'none', borderRadius: 6,
                        fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                        fontFamily: "'DM Mono', monospace", fontWeight: 700,
                        transition: 'filter 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1.1)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.filter = 'brightness(1)' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Open in My Work ✦
                    </a>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: templateSaveStatus === 'saving' ? accent : 'var(--muted2)', display: 'block', animation: templateSaveStatus === 'saving' ? 'pulse 1s ease-in-out infinite' : 'none' }} />
                      <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                        {templateSaveStatus === 'saving' ? 'Saving website…' : 'Saving to My Work…'}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            ) : output ? (
              /* BRAND SUMMARY CARD, shown after generation, clean results reveal */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Brand header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>✦ Your Brand</div>
                    <div style={{ fontSize: 15, color: 'var(--cream)', fontFamily: "'Playfair Display', serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{output.companyName || companyName || 'Your Brand'}</div>
                    {output.industry && (
                      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{output.industry}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <button
                      onClick={() => { setOutput(null); setBizGenId(null); setCompanyName(''); setIndustry(''); setTagline(''); setOutputTypes([]) }}
                      title="Start over with a new brand"
                      style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Mono', monospace", borderRadius: 2, whiteSpace: 'nowrap' }}
                    >Start Over</button>
                    <a href="/" style={{ fontSize: 8, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      New prompt
                    </a>
                  </div>
                </div>

                {/* Color palette swatches */}
                {output.primaryColors && output.primaryColors.length > 0 && (
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>Palette</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {output.primaryColors.slice(0, 5).map((col, i) => (
                        <div key={i} title={col} style={{ width: 22, height: 22, borderRadius: 4, background: col, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                      ))}
                    </div>
                    {output.tagline && (
                      <div style={{ fontSize: 10, color: 'var(--muted)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                        {output.tagline}
                      </div>
                    )}
                  </div>
                )}

                {/* What was generated, asset checklist */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Generated Assets</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {outputTypes.filter(t => Object.keys(BIZ_TAB_META).includes(t)).map(t => {
                      const meta = BIZ_TAB_META[t as BizTab]
                      if (!meta) return null
                      return (
                        <button
                          key={t}
                          onClick={() => { setPvTab(t as BizTab); setMobilePanel('preview') }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 10px', background: pvTab === t ? `${accent}12` : 'var(--surface)',
                            border: `1px solid ${pvTab === t ? `${accent}50` : 'var(--border)'}`,
                            borderRadius: 3, cursor: 'pointer', textAlign: 'left',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontSize: 13, color: accent, flexShrink: 0 }}>{meta.icon}</span>
                          <span style={{ fontSize: 11, color: 'var(--cream)', flex: 1 }}>{meta.label}</span>
                          <span style={{ fontSize: 9, color: accent, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em' }}>View →</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Generate More — redirects to homepage chip so user enters fresh prompt */}
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Generate More</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {chips.filter(c => {
                      const chipToTab: Record<string, BizTab> = { 'Website': 'website', 'Logo Design': 'logo', 'Brand Images': 'images', 'Business Strategy': 'strategy', 'Content Calendar': 'calendar' }
                      const tab = chipToTab[c.label]
                      return tab && !outputTypes.includes(tab)
                    }).map(({ label, icon }) => (
                      <a
                        key={label}
                        href={`/?chip=${encodeURIComponent(label)}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'transparent', border: `1px solid ${accent}40`, color: accent, fontSize: 9, cursor: 'pointer', borderRadius: 99, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', transition: 'all 0.15s', textDecoration: 'none' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${accent}15` }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
                      >
                        <span>{icon}</span> {label}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a
                    href="/my-work"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: accent, color: '#000', textDecoration: 'none', borderRadius: 3, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    View in My Work
                  </a>
                </div>

                {/* ── AI Thought Process Summary ── shown after generation completes */}
                {completedThoughts.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M5 1c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4zM5 3v2.5l1.5 1" stroke={accent} strokeWidth="1.1" strokeLinecap="round"/></svg>
                      Generation Reasoning
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {completedThoughts.map((t, i) => (
                        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                          <span style={{ color: i === completedThoughts.length - 1 ? accent : 'var(--border2)', flexShrink: 0, marginTop: 3, fontSize: 7, fontFamily: "'DM Mono', monospace" }}>◇</span>
                          <span style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : urlPrompt ? (
              /* ── Arrived from homepage with prompt: show locked prompt + generating state ── */
              <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Locked prompt display */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke={accent} strokeWidth="1.2"/><path d="M5 3v2.5l1.5 1" stroke={accent} strokeWidth="1.2" strokeLinecap="round"/></svg>
                    Your Prompt
                  </div>
                  <div style={{ background: 'var(--surface)', border: `1px solid ${accent}40`, borderRadius: 6, padding: '12px 14px', fontSize: 13, color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                    {urlPrompt}
                  </div>
                </div>
                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: `${accent}08`, border: `1px solid ${accent}25`, borderRadius: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
                    {loading
                      ? `${BIZ_STEPS[genStep]}… generating your brand identity`
                      : awaitingAnswer ? 'Claude needs a quick clarification' : 'Ready'}
                  </span>
                </div>
                {/* Cross-question panel if triggered */}
                {awaitingAnswer && crossQuestion && (
                  <div style={{ background: 'var(--surface2)', border: `1px solid ${accent}50`, borderLeft: `3px solid ${accent}`, borderRadius: 6, padding: 16 }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono',monospace", marginBottom: 10 }}>✦ Quick clarification</div>
                    <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.65, marginBottom: 14, fontFamily: "'DM Sans',sans-serif" }}>{crossQuestion}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={crossAnswer}
                        onChange={e => setCrossAnswer(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { setAwaitingAnswer(false); handleGenerate() } }}
                        placeholder="Your answer…"
                        style={{ flex: 1, background: 'var(--bg)', border: `1px solid ${accent}50`, color: 'var(--cream)', padding: '9px 12px', fontSize: 12, fontFamily: "'DM Sans',sans-serif", borderRadius: 4, outline: 'none' }}
                        autoFocus
                      />
                      <button onClick={() => { setAwaitingAnswer(false); handleGenerate() }} style={{ padding: '9px 16px', background: accent, color: '#000', border: 'none', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", fontWeight: 700, cursor: 'pointer', borderRadius: 4, whiteSpace: 'nowrap' }}>Continue →</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── Nothing generated yet: summary info panel — generation starts from homepage ── */
              <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke={accent} strokeWidth="1.2"/><path d="M5 3v2.5l1.5 1" stroke={accent} strokeWidth="1.2" strokeLinecap="round"/></svg>
                    How it works
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--cream)', fontFamily: "'Playfair Display', serif", lineHeight: 1.5 }}>
                    Your brand summary will appear here once generation is complete.
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>
                    Enter your brand or business details on the homepage to generate your full identity kit.
                  </div>
                </div>

                {/* What gets generated */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>What you will get</div>
                  {[
                    { icon: '⊕', label: 'Website', desc: 'Full single-page site, ready to publish' },
                    { icon: '◈', label: 'Logo Design', desc: 'ChatGPT logo image' },
                    { icon: '◉', label: 'Brand Images', desc: 'Graphics and visual assets' },
                    { icon: '◆', label: 'Business Strategy', desc: 'Positioning, audience and USP' },
                    { icon: '▤', label: 'Content Calendar', desc: '30-day social media plan' },
                  ].map((item, i, arr) => (
                    <div key={item.label} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <span style={{ fontSize: 13, color: accent, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{item.label}</div>
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em', marginTop: 1 }}>{item.desc}</div>
                      </div>
                      <span style={{ fontSize: 9, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>✦</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href="/"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 16px', background: accent, color: '#000',
                    textDecoration: 'none', borderRadius: 6,
                    fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                    fontFamily: "'DM Mono', monospace", fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                  Start on Homepage
                </a>

              </div>
            )}
          </div>
        </div>


        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a href="/my-work" style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }} onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = accent)} onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)')}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 3.5v2.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> My Work →</a>
          {(templateSavedId || bizGenId) && (() => {
            const wsId = templateSavedId
            if (!wsId) return null
            return (
              <>
                {templateSlug && (
                  <a
                    href={`/w/${templateSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: `${accent}15`, border: `1px solid ${accent}40`, borderRadius: 'var(--radius)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = `${accent}28`)}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = `${accent}15`)}
                  >
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    View Live
                  </a>
                )}
                <a
                  href={`/my-websites/${wsId}`}
                  style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = accent)}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--muted)')}
                >
                  Manage →
                </a>
              </>
            )
          })()}
        </div>
      </div>

      {/* ── BUSINESS PREVIEW SIDE ── */}
      <div className={`generate-preview-side${mobilePanel === 'form' ? ' mobile-hidden' : ''}`}>

        {/* Preview viewport */}
        <div className={`generate-preview-scroll${pvTab === 'website' ? ' generate-preview-scroll--website' : ''}`} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {loading ? (
            <GenerationLoadingScreen accent={accent} step={genStep} activeChip={activeChip} elapsedSec={loadingElapsedSec} />
          ) : genError && !output ? (
            /* ── Generation error: show clearly in preview panel (no prior output) ── */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 320, padding: 40, textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#dc3545" strokeWidth="1.5"/><path d="M12 7v5.5M12 15.5v1" stroke="#dc3545" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#dc3545', marginBottom: 10 }}>Generation Failed</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 320, marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>{genError}</div>
              <button
                onClick={() => { setGenError(null); handleGenerate() }}
                style={{ padding: '9px 22px', background: 'transparent', border: `1px solid ${accent}`, color: accent, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Mono', monospace", borderRadius: 'var(--radius)', marginBottom: 10 }}
              >
                Try Again
              </button>
              <button
                onClick={() => setGenError(null)}
                style={{ background: 'none', border: 'none', color: 'var(--muted2)', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textDecoration: 'underline' }}
              >
                Dismiss
              </button>
            </div>
          ) : output ? (
            <>
              {/* ── Inline error banner when re-generation fails but prior output still exists ── */}
              {genError && (
                <div style={{ margin: '12px 16px 0', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'rgba(220,53,69,0.07)', border: '1px solid rgba(220,53,69,0.3)', borderLeft: '3px solid #dc3545', borderRadius: 'var(--radius)' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="8" cy="8" r="7.5" stroke="#dc3545"/><path d="M8 4.5v4M8 10.5v1" stroke="#dc3545" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#dc3545', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Generation Failed</div>
                    <div style={{ fontSize: 12, color: '#f5c6cb', lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{genError}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
                    <button onClick={() => { setGenError(null); handleGenerate() }} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid rgba(220,53,69,0.5)', color: '#dc3545', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Mono', monospace", borderRadius: 'var(--radius)', whiteSpace: 'nowrap' }}>Try Again</button>
                    <button onClick={() => setGenError(null)} style={{ background: 'none', border: 'none', color: 'rgba(245,198,203,0.5)', cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0 }}>✕ Dismiss</button>
                  </div>
                </div>
              )}
              {pvTab === 'logo'     && outputTypes.includes('logo')     && <BizLogoPreview     data={output} accent={accent} />}
              {pvTab === 'graphics' && outputTypes.includes('graphics') && <BizGraphicsPreview data={output} accent={accent} />}
              {pvTab === 'copy'     && outputTypes.includes('copy')     && <BizCopyPreview     data={output} accent={accent} />}
              {pvTab === 'website'  && <BizWebsitePreview  data={output ?? {} as BusinessOutput} accent={accent} genId={bizGenId} initialHtml={templateHtml} initialSampleId={templateSampleId} initialSavedId={templateSavedId} />}
              {pvTab === 'images'   && outputTypes.includes('images')   && <BizImagesPreview   data={output} accent={accent} />}
              {pvTab === 'strategy' && outputTypes.includes('strategy') && <BizStrategyPreview data={output} accent={accent} />}
              {pvTab === 'calendar' && outputTypes.includes('calendar') && <BizCalendarPreview data={output} accent={accent} />}
              <GeneratedAssetAIEditPanel generationId={bizGenId} assetType={pvTab} data={output} accent={accent} defaultOpen={searchParams.get('aiEdit') === '1'} onUpdated={(next) => { setOutput(next); showMsg('Asset updated and saved.', 'success') }} />
              {/* Not-generated fallback for tabs that weren't selected */}
              {!outputTypes.includes(pvTab) && pvTab !== 'website' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320, padding: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.4 }}>{BIZ_TAB_META[pvTab as BizTab]?.icon || '○'}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Not Generated</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--cream)', marginBottom: 16 }}>{BIZ_TAB_META[pvTab as BizTab]?.label} wasn&apos;t selected</div>
                  <button onClick={() => { const c = pvTab === 'strategy' ? 'Business Strategy' : pvTab === 'calendar' ? 'Content Calendar' : pvTab === 'images' ? 'Brand Images' : pvTab === 'logo' ? 'Logo Design' : 'Website'; setActiveChip(c); handleGenerate(c) }} style={{ padding: '8px 20px', background: 'transparent', border: `1px solid ${accent}`, color: accent, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Mono', monospace", borderRadius: 'var(--radius)' }}>
                    Generate Now
                  </button>
                </div>
              )}
            </>
          ) : pvTab === 'website' && templateSavedId && !templateHtml && templateSaveStatus === 'saving' ? (
            /* ── FIX: Loading skeleton while ?websiteId= fetch is in-flight ── */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 280, gap: 16 }}>
              <div style={{ width: 36, height: 36, border: `2px solid var(--border2)`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
              <span style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Loading website…</span>
            </div>
          ) : pvTab === 'website' && templateHtml ? (
            /* Template-picked websites now use the same full Website dashboard as AI-generated sites,
               so Domain, Analytics and SEO tabs always appear and keep working. */
            <BizWebsitePreview
              data={output ?? {} as BusinessOutput}
              accent={accent}
              genId={bizGenId}
              initialHtml={templateHtml}
              initialSampleId={templateSampleId}
              initialSavedId={templateSavedId}
            />
          ) : (
            /* ── Cinematic showcase empty state ── */
            <PreviewShowcase accent={accent} />
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mobile-bottom-nav">
        <button onClick={() => setMobilePanel('form')} className={`mobile-bottom-btn${mobilePanel === 'form' ? ' active' : ''}`} style={{ color: mobilePanel === 'form' ? accent : undefined, borderTop: mobilePanel === 'form' ? `2px solid ${accent}` : '2px solid transparent' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 7h8M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          {output || templateHtml ? 'Summary' : 'Generate'}
        </button>
        <button onClick={() => { setMobilePanel('preview'); if (output && outputTypes.length > 0 && !outputTypes.includes(pvTab)) setPvTab(outputTypes[0] as BizTab) }} className={`mobile-bottom-btn${mobilePanel === 'preview' ? ' active' : ''}`} style={{ color: mobilePanel === 'preview' ? accent : undefined, borderTop: mobilePanel === 'preview' ? `2px solid ${accent}` : '2px solid transparent' }}>
          {(output || templateHtml) && <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(14px)', width: 6, height: 6, borderRadius: '50%', background: accent, display: 'block' }} />}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M5 14h6M8 12v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          {output ? 'Preview ✦' : templateHtml ? 'Website ✦' : 'Preview'}
        </button>
      </div>

      {/* Ad Popunder Overlay, Business Mode */}

      {/* Error Banner — persistent, dismissible — visible on mobile form panel or desktop */}
      {genError && !loading && (
        <div style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', gap: 12, background: '#1a0a0a', border: '1px solid rgba(220,53,69,0.5)', borderLeft: '3px solid #dc3545', borderRadius: 'var(--radius)', padding: '14px 18px', maxWidth: 440, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="8" cy="8" r="7.5" stroke="#dc3545"/><path d="M8 4.5v4M8 10.5v1" stroke="#dc3545" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <div style={{ flex: 1, fontSize: 12, color: '#f5c6cb', lineHeight: 1.6, fontFamily: "'DM Mono', monospace" }}>{genError}</div>
          <button onClick={() => setGenError(null)} style={{ background: 'none', border: 'none', color: 'rgba(245,198,203,0.5)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
        </div>
      )}

      {/* Toast — success / info */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, background: toastType === 'error' ? '#1a0a0a' : 'var(--surface2)', border: `1px solid ${toastType === 'error' ? 'rgba(220,53,69,0.4)' : 'var(--border2)'}`, borderLeft: `3px solid ${toastType === 'error' ? '#dc3545' : toastType === 'success' ? '#27AE60' : accent}`, padding: '12px 20px', fontSize: 12, color: toastType === 'error' ? '#f5c6cb' : 'var(--text)', zIndex: 9998, maxWidth: 300, borderRadius: 'var(--radius)', pointerEvents: 'none', transform: showToast ? 'translateX(0)' : 'translateX(calc(100% + 32px))', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)', fontFamily: "'DM Mono', monospace", lineHeight: 1.5 }}>{toast}</div>
    </div>
  )
}



export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
        <div style={{ width: 32, height: 32, border: '1px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <BusinessGenerateStudio onSwitchMode={() => {}} />
    </Suspense>
  )
}
