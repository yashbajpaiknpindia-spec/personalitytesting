'use client'

import React, { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────
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
}

type BizOutputType = 'images' | 'copywriting'
type BizTone = 'bold' | 'professional' | 'playful' | 'luxury'

const GEN_STEPS = ['Analyzing prompt…', 'Crafting brand…', 'Generating assets…', 'Finalizing…', 'Ready']

// ── Step Progress Indicator ───────────────────────────────────────────────────
function StepProgress({ step, accent }: { step: number; accent: string }) {
  const steps = [
    'Analyzing your prompt',
    'Writing brand copy',
    'Applying style & layout',
    'Finalizing assets',
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
      {steps.map((label, i) => {
        const done = step > i
        const active = step === i
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: done || active ? 1 : 0.3, transition: 'opacity 0.3s' }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              border: `1.5px solid ${done ? accent : active ? accent : 'var(--border2)'}`,
              background: done ? accent : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.3s',
            }}>
              {done && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, animation: 'pulse 1s infinite' }} />}
            </div>
            <span style={{
              fontSize: 12, color: active ? 'var(--cream)' : done ? accent : 'var(--muted)',
              fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', textAlign: 'left',
            }}>
              Step {i + 1}: {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Output section previews ────────────────────────────────────────────────────

function ImagesPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const c1 = data.primaryColors?.[0] ?? accent
  const c2 = data.primaryColors?.[1] ?? '#0a0a0a'
  const initials = (data.companyName || 'B').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: -8 }}>
        Brand Images — Generated
      </div>

      {/* Logo concept card */}
      <div style={{ background: 'var(--surface)', border: `1px solid ${c1}30`, borderRadius: 6, padding: 20 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
          Logo Concept — {data.logoConceptName}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
          {[c2, '#F8F6F2', c1].map((bg, i) => (
            <div key={i} style={{
              width: 72, height: 72, borderRadius: 8, background: bg,
              border: `1px solid ${c1}30`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
                color: bg === c1 ? '#000' : bg === '#F8F6F2' ? c2 : c1,
              }}>{initials}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{data.logoConceptDescription}</p>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {data.primaryColors?.map((col, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: 3, background: col, border: '1px solid rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'var(--muted)' }}>{col}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Banner */}
      <div style={{ background: c2, border: `1px solid ${c1}30`, borderRadius: 6, padding: '14px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c1 }} />
        <div style={{ marginLeft: 16 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.2em', color: c1, textTransform: 'uppercase', marginBottom: 6 }}>
            Banner — 1200×375
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#fff', fontWeight: 700, marginBottom: 4 }}>{data.bannerHeadline}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 12 }}>{data.bannerSubheadline}</div>
          <div style={{ display: 'inline-block', padding: '6px 14px', background: c1, color: '#000', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2 }}>
            {data.bannerCta} →
          </div>
        </div>
      </div>

      {/* Poster / Flyer row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: `1px solid ${c1}20`, borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Flyer A5</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: 'var(--cream)', marginBottom: 6 }}>{data.flyerTitle}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>{data.flyerSubtitle}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: `1px solid ${c1}20`, borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Poster Portrait</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: 'var(--cream)', marginBottom: 6 }}>{data.posterHeadline}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>{data.posterTagline}</div>
        </div>
      </div>
    </div>
  )
}

function CopywritingPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const [copied, setCopied] = useState<string | null>(null)
  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
        Brand Copywriting — Generated
      </div>

      {/* Ad Headlines */}
      <div>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Ad Headlines</div>
        {(data.copyHeadlines || []).map((h, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: accent }}>0{i + 1}</span>
            <span style={{ fontSize: 13, color: 'var(--cream)', flex: 1 }}>{h}</span>
            <button onClick={() => copy(h, `h${i}`)} style={{ background: 'transparent', border: 'none', color: copied === `h${i}` ? accent : 'var(--muted)', cursor: 'pointer', fontSize: 10, padding: 4 }}>
              {copied === `h${i}` ? '✓' : '⌘'}
            </button>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>CTAs</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(data.copyCtas || []).map((cta, i) => (
            <button key={i} onClick={() => copy(cta, `cta${i}`)} style={{ padding: '6px 14px', border: `1px solid ${accent}60`, color: accent, background: copied === `cta${i}` ? `${accent}15` : 'transparent', fontSize: 11, fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: 2, letterSpacing: '0.06em' }}>
              {cta}
            </button>
          ))}
        </div>
      </div>

      {/* Email */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Email Subject</span>
          <button onClick={() => copy(data.copyEmailSubject, 'emailsubj')} style={{ background: 'transparent', border: 'none', color: copied === 'emailsubj' ? accent : 'var(--muted)', cursor: 'pointer', fontSize: 9 }}>{copied === 'emailsubj' ? '✓ Copied' : 'Copy'}</button>
        </div>
        <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--cream)', lineHeight: 1.6 }}>{data.copyEmailSubject}</div>
      </div>

      {/* Social Captions */}
      <div>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Social Captions</div>
        {(data.copySocialCaptions || []).map((cap, i) => {
          const platform = ['Instagram', 'LinkedIn', 'Twitter / X'][i] ?? `Platform ${i + 1}`
          return (
            <div key={i} style={{ marginBottom: 8, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>{platform}</span>
                <button onClick={() => copy(cap, `soc${i}`)} style={{ background: 'transparent', border: 'none', color: copied === `soc${i}` ? accent : 'var(--muted)', cursor: 'pointer', fontSize: 9 }}>{copied === `soc${i}` ? '✓ Copied' : 'Copy'}</button>
              </div>
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--cream)', lineHeight: 1.6 }}>{cap}</div>
            </div>
          )
        })}
      </div>

      {/* Ad Copy */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>30-Word Ad Copy</span>
          <button onClick={() => copy(data.copyAdCopy, 'adcopy')} style={{ background: 'transparent', border: 'none', color: copied === 'adcopy' ? accent : 'var(--muted)', cursor: 'pointer', fontSize: 9 }}>{copied === 'adcopy' ? '✓ Copied' : 'Copy'}</button>
        </div>
        <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--cream)', lineHeight: 1.6 }}>{data.copyAdCopy}</div>
      </div>
    </div>
  )
}

// ── Main Business Generate Studio ─────────────────────────────────────────────
function BusinessStudio() {
  const searchParams = useSearchParams()
  const accent = '#C9A84C'

  const [outputType, setOutputType] = useState<BizOutputType>('images')
  const [mobilePanel, setMobilePanel] = useState<'form' | 'preview'>('form')

  // Form
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  const [tone, setTone] = useState<BizTone>('professional')

  // Generation
  const [loading, setLoading] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [output, setOutput] = useState<BusinessOutput | null>(null)
  const [toast, setToast] = useState('')
  const [showToast, setShowToast] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showMsg(msg: string) {
    setToast(msg); setShowToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setShowToast(false), 3200)
  }

  async function handleGenerate() {
    if (!companyName.trim()) { showMsg('Company name is required'); return }
    setLoading(true); setOutput(null); setGenStep(0)
    const stepInterval = setInterval(() => setGenStep(s => Math.min(s + 1, 3)), 800)
    try {
      const res = await fetch('/api/generate-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, industry, description, tone, outputTypes: JSON.stringify(['logo', 'banner', 'flyer', 'poster', 'copy']) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      clearInterval(stepInterval)
      setGenStep(4)
      setOutput(data.output)
      setMobilePanel('preview')
      showMsg('Brand assets generated!')
    } catch (err) {
      clearInterval(stepInterval)
      showMsg(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6,
  }

  return (
    <div className="generate-layout">
      <style>{`@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>

      {/* ── FORM SIDE ── */}
      <div className={`generate-form-side${mobilePanel === 'preview' ? ' mobile-hidden' : ''}`}>

        {/* Mode toggle pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: 3, width: 'fit-content' }}>
          <button
            onClick={() => window.location.href = '/generate/personal'}
            style={{ padding: '5px 14px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', background: 'transparent', color: 'var(--muted)', border: 'none', borderRadius: 1, fontWeight: 400, transition: 'all 0.15s' }}
          >Personal</button>
          <button
            style={{ padding: '5px 14px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 1, fontWeight: 600, transition: 'all 0.15s' }}
          >Business ✦</button>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
          <div style={{ width: 20, height: 1, background: accent }} />Business Studio
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, lineHeight: 1.15, color: 'var(--cream)', marginBottom: 10 }}>
          Build your<br /><em style={{ color: accent, fontStyle: 'italic' }}>brand identity</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, fontWeight: 300, marginBottom: 36, maxWidth: 440 }}>
          Brand images and copy — generated from one business prompt.
        </p>

        {/* Output type selector — only Images and Copywriting */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>What do you need?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([
              {
                key: 'images' as BizOutputType,
                label: 'Images',
                icon: '◈',
                helper: 'Tell us what you need — logo direction, banners, flyers, or posters — and we\'ll generate exactly that. One prompt, one generation, no wasted tokens.',
              },
              {
                key: 'copywriting' as BizOutputType,
                label: 'Copywriting',
                icon: '✦',
                helper: 'Ad headlines, email body, social captions, and CTAs — all written to match your brand tone.',
              },
            ]).map(opt => (
              <div
                key={opt.key}
                onClick={() => setOutputType(opt.key)}
                style={{
                  padding: '16px 18px',
                  border: `1px solid ${outputType === opt.key ? accent : 'var(--border2)'}`,
                  background: outputType === opt.key ? 'var(--gold-dim)' : 'transparent',
                  cursor: 'pointer', borderRadius: 'var(--radius)', transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: outputType === opt.key ? accent : 'var(--muted)' }}>{opt.icon}</span>
                  <span style={{ fontSize: 13, color: outputType === opt.key ? accent : 'var(--text)', fontWeight: outputType === opt.key ? 600 : 400 }}>{opt.label}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{opt.helper}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company prompt */}
        <div style={{ background: 'var(--surface)', border: `1px solid ${accent}45`, borderRadius: 'var(--radius)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 10px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Company Name *</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2E7D52', fontFamily: "'DM Mono', monospace" }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2E7D52', animation: 'pulse 2s infinite', display: 'block' }} />Business Mode
            </span>
          </div>
          <input
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. Petal & Root (Ayurvedic skincare), Konnekt (HR tech SaaS)"
            style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 300, padding: '18px 16px 14px', caretColor: accent }}
          />
        </div>

        {/* Industry */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Industry</label>
          <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. D2C Skincare, HR Tech, Fine Dining" style={inputStyle} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Brand Description <span style={{ color: 'var(--muted2)' }}>{description.length}/400</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 400))} rows={4} placeholder="Tell us about your brand, target audience, and any specific direction…" style={{ ...inputStyle, resize: 'vertical' as const }} />
        </div>

        {/* Tone */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {(['bold', 'professional', 'playful', 'luxury'] as BizTone[]).map(t => (
            <button key={t} onClick={() => setTone(t)} style={{ padding: '6px 14px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', border: `1px solid ${tone === t ? accent : 'var(--border2)'}`, background: tone === t ? 'var(--gold-dim)' : 'transparent', color: tone === t ? accent : 'var(--muted)', borderRadius: 'var(--radius)', transition: 'all 0.15s' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: accent, border: 'none', color: '#000', padding: '12px 22px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 'var(--radius)', transition: 'all 0.2s', opacity: loading ? 0.7 : 1 }}
        >
          {loading
            ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block' }} />
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 3.5H13L9.5 7.5l1.5 4L7 10l-4 2.5 1.5-4L1 5.5h4.5z" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" /></svg>
          }
          {loading ? GEN_STEPS[genStep] : 'Generate Brand Assets'}
        </button>
      </div>

      {/* ── PREVIEW SIDE ── */}
      <div className={`generate-preview-side${mobilePanel === 'form' ? ' mobile-hidden' : ''}`}>

        {/* Preview bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 48, borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: output ? accent : 'var(--muted2)', display: 'block' }} />
            <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
              {output ? 'Live' : loading ? GEN_STEPS[genStep] : 'Waiting'}
            </span>
          </div>

          {/* Tab: Images / Copywriting */}
          <div style={{ display: 'flex', height: 48, alignItems: 'stretch', flex: 1, minWidth: 0 }}>
            {(['images', 'copywriting'] as BizOutputType[]).map(t => (
              <button key={t} onClick={() => setOutputType(t)} style={{ display: 'flex', alignItems: 'center', padding: '0 12px', flexShrink: 0, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: outputType === t ? accent : 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none', borderBottom: outputType === t ? `2px solid ${accent}` : '2px solid transparent', fontFamily: "'DM Mono', monospace", transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {t === 'images' ? '◈ Images' : '✦ Copywriting'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, padding: '4px 10px', border: `1px solid ${accent}50`, borderRadius: 'var(--radius)', background: 'var(--gold-dim)' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>✦ Business</span>
          </div>
        </div>

        {/* Preview viewport */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: `1px solid var(--border2)`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 28 }} />
              <StepProgress step={genStep} accent={accent} />
            </div>
          ) : output ? (
            <>
              {outputType === 'images' && <ImagesPreview data={output} accent={accent} />}
              {outputType === 'copywriting' && <CopywritingPreview data={output} accent={accent} />}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
              <div style={{ width: 160, height: 110, background: '#0A0A0A', border: `1px solid ${accent}55`, borderRadius: 6, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, boxShadow: `0 8px 32px ${accent}15` }}>
                <div style={{ height: 2, background: accent, borderRadius: 1, width: '100%' }} />
                <div style={{ height: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 1, width: '65%' }} />
                <div style={{ height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 1, width: '45%' }} />
                <div style={{ marginTop: 4, display: 'flex', gap: 5 }}>
                  <div style={{ height: 14, width: 44, background: accent, borderRadius: 2, opacity: 0.85 }} />
                  <div style={{ height: 14, width: 30, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>
                Business Mode
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--cream)', marginBottom: 8 }}>Ready to build</div>
              <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6, maxWidth: 240 }}>Enter your company name and click Generate Brand Assets.</div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mobile-bottom-nav">
        <button onClick={() => setMobilePanel('form')} className={`mobile-bottom-btn${mobilePanel === 'form' ? ' active' : ''}`} style={{ color: mobilePanel === 'form' ? accent : undefined, borderTop: mobilePanel === 'form' ? `2px solid ${accent}` : '2px solid transparent' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12M2 7h8M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Generate
        </button>
        <button onClick={() => setMobilePanel('preview')} className={`mobile-bottom-btn${mobilePanel === 'preview' ? ' active' : ''}`} style={{ color: mobilePanel === 'preview' ? accent : undefined, borderTop: mobilePanel === 'preview' ? `2px solid ${accent}` : '2px solid transparent' }}>
          {output && <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(14px)', width: 6, height: 6, borderRadius: '50%', background: accent, display: 'block' }} />}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M5 14h6M8 12v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Preview{output ? ' ✦' : ''}
        </button>
      </div>

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface2)', border: '1px solid var(--border2)', borderLeft: `3px solid ${accent}`, padding: '12px 20px', fontSize: 12, color: 'var(--text)', zIndex: 9998, maxWidth: 280, borderRadius: 'var(--radius)', pointerEvents: 'none', transform: showToast ? 'translateX(0)' : 'translateX(calc(100% + 32px))', transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)' }}>{toast}</div>
    </div>
  )
}

export default function BusinessGeneratePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
        <div style={{ width: 32, height: 32, border: '1px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <BusinessStudio />
    </Suspense>
  )
}
