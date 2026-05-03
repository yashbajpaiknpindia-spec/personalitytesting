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

type Tab = 'brand' | 'logo' | 'banner' | 'flyer' | 'poster' | 'copy'

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'brand',  label: 'Brand',  icon: '◈' },
  { id: 'logo',   label: 'Logo',   icon: '◇' },
  { id: 'banner', label: 'Banner', icon: '▭' },
  { id: 'flyer',  label: 'Flyer',  icon: '◻' },
  { id: 'poster', label: 'Poster', icon: '◼' },
  { id: 'copy',   label: 'Copy',   icon: '✦' },
]

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

// ── Main Component ───────────────────────────────────────────────────────────
export default function BusinessAssetsEditClient() {
  const searchParams = useSearchParams()
  const genId = searchParams.get('gen')

  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('brand')
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
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Top bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 16 }}>
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
      <div style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
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

        {/* BANNER tab */}
        {activeTab === 'banner' && (
          <>
            <Section title="Banner Copy" accent={accent}>
              <Field label="Headline" value={data.bannerHeadline || ''} onChange={v => update('bannerHeadline', v)} placeholder="Bold headline, max 8 words" />
              <Field label="Subheadline" value={data.bannerSubheadline || ''} onChange={v => update('bannerSubheadline', v)} placeholder="Supporting subheadline, max 15 words" />
              <Field label="CTA Button Text" value={data.bannerCta || ''} onChange={v => update('bannerCta', v)} placeholder="e.g. Get Started, Learn More" />
            </Section>
            <Section title="Visual Direction" accent={accent}>
              <Field label="Theme / Visual Direction" value={data.bannerTheme || ''} onChange={v => update('bannerTheme', v)} multiline rows={3} placeholder="Colors, mood, layout style…" />
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
