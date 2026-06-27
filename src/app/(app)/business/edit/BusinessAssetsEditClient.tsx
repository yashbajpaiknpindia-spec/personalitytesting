'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────────────────────
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
  strategy?: unknown
  contentCalendar?: unknown
  websiteHtml?: string
  renderContract?: unknown
  finalPosterUrl?: string
  imageUrl?: string
  imageDataUri?: string
  _logoImageUri?: string
  finalLogoUri?: string
  logoImageUri?: string
  graphics?: Array<Record<string, unknown>>
  variations?: Array<Record<string, unknown>>
  [key: string]: unknown
}

type Tab = 'brand' | 'logo' | 'images' | 'flyer' | 'poster' | 'copy' | 'strategy' | 'calendar' | 'website'

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'brand',    label: 'Brand',    icon: '◈' },
  { id: 'logo',     label: 'Logo',     icon: '◇' },
  { id: 'images',   label: 'Images',   icon: '▣' },
  { id: 'flyer',    label: 'Flyer',    icon: '◻' },
  { id: 'poster',   label: 'Poster',   icon: '◼' },
  { id: 'copy',     label: 'Copy',     icon: '✦' },
  { id: 'strategy', label: 'Strategy', icon: '⌁' },
  { id: 'calendar', label: 'Calendar', icon: '▤' },
  { id: 'website',  label: 'Website',  icon: '⊕' },
]

const VALID_TABS: Tab[] = ['brand','logo','images','flyer','poster','copy','strategy','calendar','website']

function normaliseEditTab(value: string | null): Tab {
  const v = String(value || '').toLowerCase().replace(/[-_\s]+/g, ' ')
  if (v === 'graphics' || v === 'brand images' || v === 'image') return 'images'
  if (v === 'content' || v === 'brand copy') return 'copy'
  if (v === 'business strategy') return 'strategy'
  if (v === 'content calendar') return 'calendar'
  if (VALID_TABS.includes(v as Tab)) return v as Tab
  return 'brand'
}

function isImageUrlLike(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const v = value.trim()
  return Boolean(v && (v.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)(\?|#|$)/i.test(v) || /^https?:\/\//i.test(v)))
}

function getLogoImage(data: BusinessOutput | null): string | null {
  if (!data) return null
  const direct = data._logoImageUri || data.finalLogoUri || data.logoImageUri || data.imageDataUri || data.imageUrl
  return isImageUrlLike(direct) ? direct : null
}

function getImageAssetsFromData(data: BusinessOutput | null, limit = 12): Array<{ src: string; label: string }> {
  if (!data) return []
  const out: Array<{ src: string; label: string }> = []
  const seen = new Set<string>()
  const walk = (node: unknown, key = 'Image', depth = 0) => {
    if (!node || depth > 5 || out.length >= limit) return
    if (isImageUrlLike(node)) {
      if (!seen.has(node)) {
        seen.add(node)
        out.push({ src: node, label: key.replace(/^_+/, '').replace(/([a-z])([A-Z])/g, '$1 $2') })
      }
      return
    }
    if (Array.isArray(node)) node.forEach((item, i) => walk(item, `Image ${i + 1}`, depth + 1))
    else if (typeof node === 'object') Object.entries(node as Record<string, unknown>).forEach(([k, v]) => walk(v, k, depth + 1))
  }
  walk(data)
  return out
}

function getFirstRenderContract(data: BusinessOutput | null): Record<string, unknown> | null {
  if (!data) return null
  if (data.renderContract && typeof data.renderContract === 'object') return data.renderContract as Record<string, unknown>
  const fromGraphics = Array.isArray(data.graphics) ? data.graphics.find(g => g?.renderContract && typeof g.renderContract === 'object')?.renderContract : null
  if (fromGraphics && typeof fromGraphics === 'object') return fromGraphics as Record<string, unknown>
  const fromVariations = Array.isArray(data.variations) ? data.variations.find(g => g?.renderContract && typeof g.renderContract === 'object')?.renderContract : null
  if (fromVariations && typeof fromVariations === 'object') return fromVariations as Record<string, unknown>
  return null
}

function mergePosterEdit(data: BusinessOutput, imageDataUri: string, renderContract: unknown): BusinessOutput {
  const updateItem = (item: Record<string, unknown>, index: number) => index === 0
    ? { ...item, imageDataUri, finalPosterUrl: imageDataUri, imageUrl: imageDataUri, renderContract }
    : item
  return {
    ...data,
    finalPosterUrl: imageDataUri,
    imageUrl: imageDataUri,
    imageDataUri,
    renderContract,
    graphics: Array.isArray(data.graphics) && data.graphics.length > 0
      ? data.graphics.map(updateItem)
      : [{ type: 'campaign-poster', title: 'Edited asset', imageDataUri, finalPosterUrl: imageDataUri, imageUrl: imageDataUri, renderContract }],
    variations: Array.isArray(data.variations) && data.variations.length > 0
      ? data.variations.map(updateItem)
      : data.variations,
  }
}


// ── Shared input components ──────────────────────────────────────────────────
function Field({
  label, value, onChange, multiline, rows = 3, placeholder, mono,
}: {
  label: string; value: string; onChange: (v: string) => void
  multiline?: boolean; rows?: number; placeholder?: string; mono?: boolean
}) {
  const base: React.CSSProperties = {
    width: '100%', background: 'var(--surface)',
    border: '1px solid var(--border)', color: 'var(--cream)',
    fontFamily: mono ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
    fontSize: 13, padding: '9px 12px', outline: 'none',
    borderRadius: 'var(--radius)', resize: 'vertical' as const,
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>{label}</div>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder} style={base} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      }
    </div>
  )
}

function ArrayField({ label, values, onChange }: {
  label: string; values: string[]; onChange: (v: string[]) => void
}) {
  const [input, setInput] = useState('')
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
        {values.map((v, i) => (
          <span key={i} style={{ padding: '4px 10px', background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--cream)', fontSize: 11, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { onChange([...values, input.trim()]); setInput('') } }}
        placeholder="Type and press Enter to add…"
        style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)' }}
      />
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="color" value={value.startsWith('#') ? value : '#C9A84C'} onChange={e => onChange(e.target.value)}
          style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4, padding: 0 }} />
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="#hex"
          style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', fontFamily: "'DM Mono', monospace", fontSize: 12, padding: '8px 12px', outline: 'none', borderRadius: 'var(--radius)' }} />
      </div>
    </div>
  )
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 14, height: 1, background: accent }} />{title}
      </div>
      {children}
    </div>
  )
}


function AssetAIEditPanel({
  genId, activeTab, data, inputData, accent, onUpdated,
}: {
  genId: string | null
  activeTab: Tab
  data: BusinessOutput
  inputData: Record<string, unknown>
  accent: string
  onUpdated: (updated: BusinessOutput, msg?: string) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')
  const renderContract = getFirstRenderContract(data)
  const canImageEdit = Boolean(renderContract && ['images','poster','flyer'].includes(activeTab))

  async function savePatch(updated: BusinessOutput) {
    if (!genId) return
    await fetch(`/api/generate/update?id=${genId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
  }

  async function applyAIEdit() {
    if (!genId || !prompt.trim() || working) return
    setWorking(true)
    setMessage('')
    try {
      if (activeTab === 'logo') {
        const res = await fetch('/api/generate-logo-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: data.companyName || inputData.companyName || 'Brand',
            industry: data.industry || inputData.industry || '',
            logoConceptName: data.logoConceptName || data.companyName || inputData.companyName || 'Premium logo',
            symbolIdea: data.logoSymbolIdea || '',
            primaryColors: Array.isArray(data.primaryColors) ? data.primaryColors : ['#C9A84C', '#0A0A0E'],
            tone: data.brandVoice || inputData.tone || 'premium',
            editPrompt: prompt.trim(),
          }),
        })
        const json = await res.json().catch(() => ({})) as { imageDataUri?: string; error?: string }
        if (!res.ok || !json.imageDataUri) throw new Error(json.error || 'Logo edit failed')
        const updated = {
          ...data,
          _logoImageUri: json.imageDataUri,
          finalLogoUri: json.imageDataUri,
          logoImageUri: json.imageDataUri,
          logoConceptDescription: `${data.logoConceptDescription || 'Logo generated for this brand.'}\n\nLatest AI edit: ${prompt.trim()}`,
        } as BusinessOutput
        await savePatch(updated)
        onUpdated(updated, 'Logo edited and saved.')
        setPrompt('')
        return
      }

      if (canImageEdit && renderContract) {
        const res = await fetch('/api/edit-poster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ renderContract, editPrompt: prompt.trim(), generationId: genId, editCount: 0 }),
        })
        const json = await res.json().catch(() => ({})) as { imageDataUri?: string; renderContract?: unknown; error?: string }
        if (!res.ok || !json.imageDataUri) throw new Error(json.error || 'Image edit failed')
        const updated = mergePosterEdit(data, json.imageDataUri, json.renderContract || renderContract)
        await savePatch(updated)
        onUpdated(updated, 'Image edited and saved.')
        setPrompt('')
        return
      }

      const res = await fetch('/api/asset-ai-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: genId, assetType: activeTab, editPrompt: prompt.trim() }),
      })
      const json = await res.json().catch(() => ({})) as { outputData?: BusinessOutput; summary?: string; error?: string }
      if (!res.ok || !json.outputData) throw new Error(json.error || 'AI edit failed')
      onUpdated(json.outputData, json.summary || 'Asset edited and saved.')
      setPrompt('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Edit failed. Please try again.')
    } finally {
      setWorking(false)
    }
  }

  const hints: Record<Tab, string> = {
    brand: 'Example: make the brand voice sharper and more premium.',
    logo: 'Example: make the logo more minimal, sharper, and luxury-looking.',
    images: canImageEdit ? 'Example: make the headline shorter and background darker.' : 'Example: improve the image concept and caption direction.',
    flyer: canImageEdit ? 'Example: change CTA to Book Now and use a warmer luxury tone.' : 'Example: make the flyer copy shorter and stronger.',
    poster: canImageEdit ? 'Example: make it darker, reduce text, and make CTA gold.' : 'Example: make the poster copy shorter and more premium.',
    copy: 'Example: rewrite captions with stronger hooks and cleaner CTAs.',
    strategy: 'Example: make the positioning more focused for premium business owners.',
    calendar: 'Example: make the calendar more sales-focused and less generic.',
    website: 'Example: make hero copy sharper and services clearer.',
  }

  return (
    <div style={{ marginBottom: 28, padding: 16, border: `1px solid ${accent}28`, borderRadius: 'var(--radius)', background: `linear-gradient(135deg, ${accent}10, transparent)` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 5 }}>AI edit this saved asset</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            This edits the exact saved {activeTab} asset and keeps it attached to this generation.
          </div>
        </div>
        <span style={{ fontSize: 9, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>{canImageEdit ? 'Render edit' : activeTab === 'logo' ? 'Logo API' : 'Text AI'}</span>
      </div>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        rows={3}
        placeholder={hints[activeTab]}
        style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '10px 12px', outline: 'none', borderRadius: 'var(--radius)', resize: 'vertical', marginBottom: 10 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={applyAIEdit} disabled={working || !prompt.trim()} style={{ background: accent, color: '#000', border: 'none', padding: '9px 18px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace", cursor: working ? 'wait' : 'pointer', opacity: working || !prompt.trim() ? 0.55 : 1 }}>
          {working ? 'Editing…' : 'Apply AI Edit'}
        </button>
        {message && <span style={{ color: message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') ? '#e74c3c' : accent, fontSize: 11 }}>{message}</span>}
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function BusinessAssetsEditClient() {
  const searchParams = useSearchParams()
  const genId = searchParams.get('gen')
  const tabParam = searchParams.get('tab') as Tab | null

  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>(() => normaliseEditTab(tabParam))
  const [data, setData] = useState<BusinessOutput | null>(null)
  const [inputData, setInputData] = useState<Record<string, unknown>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const accent = '#C9A84C'

  // ── Load generation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!genId) { setLoading(false); setError('No generation ID provided. Go back and generate first.'); return }
    fetch(`/api/generate/load?id=${genId}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(res => {
        if (res.outputData) setData(res.outputData as BusinessOutput)
        else setError('No output data found for this generation.')
        if (res.inputData) setInputData(res.inputData)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [genId])

  // ── Auto-save on data change ───────────────────────────────────────────────
  const scheduleSave = useCallback((updated: BusinessOutput) => {
    if (!genId) return
    setSaveStatus('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/generate/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: genId, outputData: updated }),
        })
        setSaveStatus(res.ok ? 'saved' : 'error')
      } catch {
        setSaveStatus('error')
      }
    }, 900)
  }, [genId])

  function update<K extends keyof BusinessOutput>(key: K, value: BusinessOutput[K]) {
    if (!data) return
    const updated = { ...data, [key]: value }
    setData(updated)
    scheduleSave(updated)
  }

  function handleAIUpdated(updated: BusinessOutput, msg?: string) {
    setData(updated)
    setSaveStatus('saved')
    if (msg) {
      // keep the UI calm: use the existing saved indicator instead of a separate toast system
      console.info('[asset-ai-edit]', msg)
    }
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)',
  }
  const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)', background: 'var(--bg)' }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${accent}30`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error || !data) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)', padding: 40, textAlign: 'center', background: 'var(--bg)' }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--cream)', marginBottom: 12 }}>Nothing to edit</div>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, maxWidth: 340, lineHeight: 1.7 }}>{error || 'No data found. Go back to Business Studio and generate first.'}</p>
      <a href="/generate" style={{ background: accent, color: '#000', padding: '10px 24px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Back to Studio →</a>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .biz-edit-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 10% 15%, rgba(212,175,84,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 50% 55% at 92% 85%, rgba(230,57,70,0.08) 0%, transparent 60%);
        }
      `}</style>
      <div className="biz-edit-bg" />

      {/* ── Top bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(9,9,10,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href={genId ? `/generate?from=${genId}` : '/generate'} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          ← Back
        </a>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent }}>Business Assets Editor</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.companyName || 'Untitled'} · {data.industry || ''}</div>
        </div>
        <span style={{ ...mono, fontSize: 9, letterSpacing: '0.12em', color: saveStatus === 'saved' ? accent : saveStatus === 'error' ? '#c0392b' : 'var(--muted)', flexShrink: 0 }}>
          {saveStatus === 'saved' ? '✓ SAVED' : saveStatus === 'error' ? '✗ ERROR' : '● SAVING'}
        </span>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ background: 'rgba(9,9,10,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', position: 'sticky', top: 52, zIndex: 49 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '12px 16px 11px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: activeTab === t.id ? accent : 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none',
            borderBottom: activeTab === t.id ? `2px solid ${accent}` : '2px solid transparent',
            marginBottom: -1, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 10 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 24px 80px' }}>
        <AssetAIEditPanel genId={genId} activeTab={activeTab} data={data} inputData={inputData} accent={accent} onUpdated={handleAIUpdated} />

        {/* BRAND tab */}
        {activeTab === 'brand' && (
          <>
            <Section title="Core Identity" accent={accent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Company Name" value={data.companyName || ''} onChange={v => update('companyName', v)} placeholder="e.g. Luminary Labs" />
                <Field label="Industry" value={data.industry || ''} onChange={v => update('industry', v)} placeholder="e.g. SaaS, F&B, Fashion" />
              </div>
              <Field label="Tagline" value={data.tagline || ''} onChange={v => update('tagline', v)} placeholder="Your brand promise in one line" />
              <Field label="Brand Story" value={data.brandStory || ''} onChange={v => update('brandStory', v)} multiline rows={4} placeholder="2-3 sentence origin/mission narrative…" />
              <Field label="Brand Voice" value={data.brandVoice || ''} onChange={v => update('brandVoice', v)} multiline rows={3} placeholder="Brand personality and communication style…" />
            </Section>

            <Section title="Brand Palette" accent={accent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {[0, 1, 2].map(i => (
                  <ColorField
                    key={i}
                    label={`Color ${i + 1}${i === 0 ? ' (Primary)' : i === 1 ? ' (Dark)' : ' (Accent)'}`}
                    value={(data.primaryColors || [])[i] || ''}
                    onChange={v => {
                      const cols = [...(data.primaryColors || ['#C9A84C', '#0a0a0a', '#333'])]
                      cols[i] = v
                      update('primaryColors', cols)
                    }}
                  />
                ))}
              </div>
              {/* Live palette preview */}
              <div style={{ display: 'flex', gap: 0, height: 24, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border2)', marginTop: 4 }}>
                {(data.primaryColors || []).map((col, i) => (
                  <div key={i} style={{ flex: 1, background: col }} />
                ))}
              </div>
            </Section>
          </>
        )}

        {/* LOGO tab */}
        {activeTab === 'logo' && (
          <>
            <Section title="Logo Concept" accent={accent}>
              <Field label="Concept Name" value={data.logoConceptName || ''} onChange={v => update('logoConceptName', v)} placeholder="e.g. The Ascending Arc" />
              <Field label="Concept Description" value={data.logoConceptDescription || ''} onChange={v => update('logoConceptDescription', v)} multiline rows={4} placeholder="2-3 sentences: what it looks like and what it communicates…" />
              <Field label="Symbol Idea" value={data.logoSymbolIdea || ''} onChange={v => update('logoSymbolIdea', v)} multiline rows={3} placeholder="One abstract symbol or geometric concept…" />
            </Section>
            <Section title="Brand Keywords" accent={accent}>
              <ArrayField label="Keywords (press Enter to add)" values={data.logoKeywords || []} onChange={v => update('logoKeywords', v)} />
            </Section>
          </>
        )}

        {/* IMAGES tab */}
        {activeTab === 'images' && (
          <>
            <Section title="Saved Visuals" accent={accent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
                {getImageAssetsFromData(data, 12).map((img, i) => (
                  <a key={`${img.src}-${i}`} href={img.src} target="_blank" rel="noopener noreferrer" style={{ height: 140, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--surface)', display: 'block' }}>
                    <img src={img.src} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </a>
                ))}
              </div>
              {getImageAssetsFromData(data, 1).length === 0 && (
                <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>No saved image URL was found in this asset yet. Use the AI edit box above for text/concept changes, or regenerate the image from the Generate page.</div>
              )}
            </Section>
            <Section title="Visual Direction" accent={accent}>
              <Field label="Poster / Image Headline" value={String(data.posterHeadline || data.bannerHeadline || data.headline || '')} onChange={v => update('posterHeadline', v)} placeholder="Main visual headline" />
              <Field label="Visual Direction" value={String(data.posterVisualDirection || '')} onChange={v => update('posterVisualDirection', v)} multiline rows={4} placeholder="Style, mood, composition direction…" />
            </Section>
          </>
        )}

        {/* STRATEGY tab */}
        {activeTab === 'strategy' && (
          <>
            <Section title="Strategy" accent={accent}>
              <Field label="Brand Story" value={data.brandStory || ''} onChange={v => update('brandStory', v)} multiline rows={5} placeholder="Your brand narrative…" />
              <Field label="Brand Voice" value={data.brandVoice || ''} onChange={v => update('brandVoice', v)} multiline rows={4} placeholder="Tone, personality, communication style…" />
              <Field label="Saved Strategy Data" value={typeof data.strategy === 'string' ? data.strategy : data.strategy ? JSON.stringify(data.strategy, null, 2) : ''} onChange={v => update('strategy', v)} multiline rows={8} mono placeholder="Strategy details generated by AI…" />
            </Section>
          </>
        )}

        {/* CALENDAR tab */}
        {activeTab === 'calendar' && (
          <>
            <Section title="Content Calendar" accent={accent}>
              <Field label="Saved Calendar Data" value={typeof data.contentCalendar === 'string' ? data.contentCalendar : data.contentCalendar ? JSON.stringify(data.contentCalendar, null, 2) : ''} onChange={v => update('contentCalendar', v)} multiline rows={10} mono placeholder="Content calendar generated by AI…" />
            </Section>
          </>
        )}

        {/* FLYER tab */}
        {activeTab === 'flyer' && (
          <>
            <Section title="Flyer Content" accent={accent}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Title" value={data.flyerTitle || ''} onChange={v => update('flyerTitle', v)} placeholder="Main title, max 6 words" />
                <Field label="Subtitle" value={data.flyerSubtitle || ''} onChange={v => update('flyerSubtitle', v)} placeholder="Subtitle, max 10 words" />
              </div>
              <Field label="Body Copy" value={data.flyerBody || ''} onChange={v => update('flyerBody', v)} multiline rows={4} placeholder="2-3 compelling sentences…" />
              <Field label="CTA Text" value={data.flyerCta || ''} onChange={v => update('flyerCta', v)} placeholder="e.g. Contact Us, Book Now" />
            </Section>
            <Section title="Highlights" accent={accent}>
              <ArrayField label="Highlight Points (press Enter to add)" values={data.flyerHighlights || []} onChange={v => update('flyerHighlights', v)} />
            </Section>
          </>
        )}

        {/* POSTER tab */}
        {activeTab === 'poster' && (
          <>
            <Section title="Poster Copy" accent={accent}>
              <Field label="Headline" value={data.posterHeadline || ''} onChange={v => update('posterHeadline', v)} placeholder="Bold headline, max 5 words" />
              <Field label="Tagline" value={data.posterTagline || ''} onChange={v => update('posterTagline', v)} placeholder="Supporting tagline, max 8 words" />
              <Field label="Callout Box Text" value={data.posterCallout || ''} onChange={v => update('posterCallout', v)} placeholder="Callout, max 6 words" />
            </Section>
            <Section title="Art Direction" accent={accent}>
              <Field label="Visual Direction" value={data.posterVisualDirection || ''} onChange={v => update('posterVisualDirection', v)} multiline rows={4} placeholder="Style, mood, composition direction…" />
            </Section>
          </>
        )}

        {/* COPY tab */}
        {activeTab === 'copy' && (
          <>
            <Section title="Headlines & CTAs" accent={accent}>
              <ArrayField label="Ad Headlines (press Enter to add)" values={data.copyHeadlines || []} onChange={v => update('copyHeadlines', v)} />
              <ArrayField label="CTA Variants (press Enter to add)" values={data.copyCtas || []} onChange={v => update('copyCtas', v)} />
            </Section>
            <Section title="Social Captions" accent={accent}>
              <ArrayField label="Social Captions (Instagram, LinkedIn, Twitter)" values={data.copySocialCaptions || []} onChange={v => update('copySocialCaptions', v)} />
            </Section>
            <Section title="Email" accent={accent}>
              <Field label="Subject Line" value={data.copyEmailSubject || ''} onChange={v => update('copyEmailSubject', v)} placeholder="Email subject, max 50 chars" />
              <Field label="Email Body" value={data.copyEmailBody || ''} onChange={v => update('copyEmailBody', v)} multiline rows={6} placeholder="3-paragraph email body…" />
            </Section>
            <Section title="Ad Copy" accent={accent}>
              <Field label="30-Word Ad Copy" value={data.copyAdCopy || ''} onChange={v => update('copyAdCopy', v)} multiline rows={3} placeholder="Google/Meta ad copy, under 30 words…" />
            </Section>
          </>
        )}

        {/* WEBSITE tab */}
        {activeTab === 'website' && (
          <>
            <Section title="Website Content" accent={accent}>
              <Field label="Hero Headline" value={data.tagline || ''} onChange={v => update('tagline', v)} placeholder="Main headline shown on your website hero section" />
              <Field label="Brand Story / About" value={data.brandStory || ''} onChange={v => update('brandStory', v)} multiline rows={5} placeholder="2–3 paragraph brand story for your About section…" />
              <Field label="Services Intro" value={data.flyerBody || ''} onChange={v => update('flyerBody', v)} multiline rows={3} placeholder="Intro text for your Services section…" />
            </Section>
            <Section title="Services" accent={accent}>
              <ArrayField label="Service Names (press Enter to add)" values={data.flyerHighlights || []} onChange={v => update('flyerHighlights', v)} />
            </Section>
            <Section title="Contact & CTA" accent={accent}>
              <Field label="CTA Text" value={data.copyCtas?.[0] || ''} onChange={v => update('copyCtas', [v])} placeholder="e.g. Ready to grow? Let's talk." />
            </Section>
            <div style={{ marginTop: 16, padding: '14px 18px', background: `${accent}10`, border: `1px solid ${accent}30`, borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
              ⊕ These fields drive your website generation. After editing, go to <strong style={{ color: accent }}>Generate → Business Studio → Website</strong> to regenerate with the updated content.
            </div>
          </>
        )}

        {/* Back to preview */}
        <div style={{ marginTop: 24, padding: '14px 18px', background: 'var(--surface)', border: `1px solid ${accent}20`, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Changes are saved automatically as you type.</div>
          <a href={genId ? `/generate?from=${genId}` : '/generate'} style={{ background: accent, color: '#000', padding: '8px 20px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, textDecoration: 'none', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
            Preview →
          </a>
        </div>
      </div>
    </div>
  )
}
