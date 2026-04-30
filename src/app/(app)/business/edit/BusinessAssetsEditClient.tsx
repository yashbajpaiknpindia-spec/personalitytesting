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
  const genIdParam = searchParams.get('gen')
  const [resolvedGenId, setResolvedGenId] = useState<string | null>(genIdParam)
  const [historyList, setHistoryList] = useState<Array<{ id: string; companyName: string; industry: string; createdAt: string }>>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [error, setError] = useState<string | null>(null)
  // Read ?tab= from URL so sidebar links (Flyer, Poster, Banner) open the correct tab
  const tabParam = searchParams.get('tab') as Tab | null
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam && ['brand','logo','banner','flyer','poster','copy'].includes(tabParam) ? tabParam : 'brand'
  )
  const [data, setData] = useState<BusinessOutput | null>(null)
  const [inputData, setInputData] = useState<Record<string, unknown>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Use resolvedGenId everywhere genId was used
  const genId = resolvedGenId

  const accent = '#C9A84C'

  // ── Load generation — auto-load latest if no ?gen= param ──────────────────
  useEffect(() => {
    async function load() {
      try {
        let id = genIdParam
        // No ?gen= param — fetch the user's latest business generation
        if (!id) {
          const listRes = await fetch('/api/my-generations?mode=business&limit=1')
          if (listRes.ok) {
            const listData = await listRes.json()
            const latest = listData?.generations?.[0]
            if (latest?.id) {
              id = latest.id
              setResolvedGenId(id)
            }
          // Also store full list for the switcher
          if (listData?.generations?.length > 0) {
            setHistoryList(listData.generations.map((g: { id: string; inputData?: { companyName?: string; industry?: string } | null; createdAt: string }) => ({
              id: g.id,
              companyName: g.inputData?.companyName || 'Untitled',
              industry: g.inputData?.industry || '',
              createdAt: g.createdAt,
            })))
          }
          }
        }
        if (!id) {
          setError('No generations found. Generate your first brand identity to get started.')
          setLoading(false)
          return
        }
        const res = await fetch(`/api/generate/load-business?id=${id}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const result = await res.json()
        if (result.outputData) setData(result.outputData as BusinessOutput)
        else setError('No output data found for this generation.')
        if (result.inputData) setInputData(result.inputData)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load generation')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [genIdParam])

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

  // ── Fetch history list for the generation switcher ───────────────────────
  useEffect(() => {
    fetch('/api/my-generations?mode=business')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.generations?.length > 0) {
          setHistoryList(d.generations.map((g: { id: string; inputData?: { companyName?: string; industry?: string } | null; createdAt: string }) => ({
            id: g.id,
            companyName: g.inputData?.companyName || 'Untitled',
            industry: g.inputData?.industry || '',
            createdAt: g.createdAt,
          })))
        }
      })
      .catch(() => {})
  }, [])

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
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, maxWidth: 340, lineHeight: 1.7 }}>{error || 'No data found. Generate your first brand identity to get started.'}</p>
      <a href="/generate" style={{ background: accent, color: '#000', padding: '10px 24px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Generate Brand Assets ✦</a>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Top bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href={genId ? `/generate?gen=${genId}` : '/generate'} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          ← Preview
        </a>
        {/* History switcher */}
        {historyList.length > 1 && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setHistoryOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: historyOpen ? `${accent}15` : 'var(--surface)', border: `1px solid ${historyOpen ? accent : 'var(--border2)'}`, color: historyOpen ? accent : 'var(--muted)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: 'var(--radius)', transition: 'all 0.15s' }}
            >
              ⟳ Switch Generation
              <span style={{ fontSize: 8, opacity: 0.6 }}>({historyList.length})</span>
            </button>
            {historyOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, padding: 8, zIndex: 200, boxShadow: '0 12px 40px rgba(0,0,0,0.6)', minWidth: 260, maxHeight: 300, overflowY: 'auto' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", padding: '4px 8px 8px' }}>Your Generations</div>
                {historyList.map(h => (
                  <a
                    key={h.id}
                    href={`/business/edit?gen=${h.id}`}
                    style={{ display: 'flex', flexDirection: 'column', padding: '8px 10px', borderRadius: 4, textDecoration: 'none', background: h.id === genId ? `${accent}15` : 'transparent', border: h.id === genId ? `1px solid ${accent}30` : '1px solid transparent', marginBottom: 4, transition: 'all 0.12s' }}
                    onMouseEnter={e => { if (h.id !== genId) (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { if (h.id !== genId) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <span style={{ fontSize: 12, color: h.id === genId ? accent : 'var(--cream)', fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>{h.companyName}</span>
                    <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{h.industry} · {new Date(h.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent }}>Brand Assets Editor</div>
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

      {/* ── Split pane: Editor (left) + Live Preview (right) ── */}
      <div style={{ display: 'flex', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>

        {/* ── LEFT: Editor ── */}
        <div style={{ flex: '0 0 480px', overflowY: 'auto', borderRight: '1px solid var(--border)', padding: '28px 28px 80px' }}>

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

          {/* Auto-save note */}
          <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--surface)', border: `1px solid ${accent}20`, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: accent }}>✓</span>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Changes are saved automatically. Preview updates live on the right.</div>
          </div>
        </div>

        {/* ── RIGHT: Live Preview ── */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)', minWidth: 0 }}>
          {/* Preview header */}
          <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '0 20px', height: 42, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, display: 'block' }} />
            <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Live Preview · {TABS.find(t => t.id === activeTab)?.label}</span>
          </div>

          {/* Preview content */}
          <div style={{ padding: '20px' }}>

            {/* BRAND preview */}
            {activeTab === 'brand' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Tagline card */}
                <div style={{ background: 'var(--bg)', border: `1px solid ${accent}30`, borderRadius: 8, padding: '20px 24px', borderLeft: `4px solid ${accent}` }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Brand Identity</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--cream)', marginBottom: 4 }}>{data.companyName || '—'}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', color: accent, textTransform: 'uppercase', marginBottom: 12 }}>{data.industry || '—'}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: 'var(--cream)', fontStyle: 'italic', lineHeight: 1.5 }}>&ldquo;{data.tagline || 'Your tagline will appear here'}&rdquo;</div>
                </div>
                {/* Palette preview */}
                <div>
                  <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Brand Palette</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(data.primaryColors?.length ? data.primaryColors : ['#C9A84C','#0a0a0a','#333']).map((col, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ height: 56, borderRadius: 6, background: col, border: '1px solid rgba(255,255,255,0.08)' }} />
                        <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: 'var(--muted)', textAlign: 'center' }}>{col}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Brand story */}
                {data.brandStory && (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8, padding: '16px 20px' }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Brand Story</div>
                    <div style={{ fontSize: 13, color: 'var(--cream)', lineHeight: 1.7 }}>{data.brandStory}</div>
                  </div>
                )}
              </div>
            )}

            {/* LOGO preview */}
            {activeTab === 'logo' && (() => {
              const c1 = data.primaryColors?.[0] ?? accent
              const c2 = data.primaryColors?.[1] ?? '#1a1a1a'
              const symbolIdea = data.logoSymbolIdea || ''
              const initials = (data.companyName || 'B').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()
              // Simple SVG symbol builder (subset)
              const half = 48
              let symbol: React.ReactNode = (
                <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                  <path d={`M 14.4 48 A 33.6 33.6 0 0 1 81.6 48`} stroke={c1} strokeWidth="4" strokeLinecap="round" />
                  <path d={`M 81.6 48 A 33.6 33.6 0 0 1 14.4 48`} stroke={c2} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
                  <circle cx="14.4" cy="48" r="5" fill={c1} />
                  <circle cx="81.6" cy="48" r="5" fill={c2} />
                </svg>
              )
              const t = symbolIdea.toLowerCase()
              if (/triangle|pyramid|apex|arrow|peak|mountain/.test(t)) symbol = (
                <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                  <polygon points="48,11.5 86.4,84.5 9.6,84.5" fill={c1} opacity="0.92" />
                  <polygon points="48,28.8 69.1,69.1 26.9,69.1" fill={c2} opacity="0.6" />
                </svg>
              )
              else if (/circle|sphere|orbit|globe|round/.test(t)) symbol = (
                <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                  <circle cx="48" cy="48" r="34.6" stroke={c1} strokeWidth="3" />
                  <circle cx="48" cy="48" r="21.1" fill={c1} opacity="0.85" />
                </svg>
              )
              else if (/diamond|gem|crystal/.test(t)) symbol = (
                <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                  <polygon points="48,7.7 88.3,48 48,88.3 7.7,48" fill={c1} opacity="0.9" />
                  <polygon points="48,26.9 69.1,48 48,69.1 26.9,48" fill={c2} opacity="0.55" />
                </svg>
              )
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* 3-variant logo row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { bg: '#0a0a0a', textCol: '#F8F4EE', label: 'Dark' },
                      { bg: '#F8F6F2', textCol: '#1A1A1A', label: 'Light' },
                      { bg: c1, textCol: '#000', label: 'Brand' },
                    ].map(variant => (
                      <div key={variant.label} style={{ background: variant.bg, border: `1px solid ${c1}30`, borderRadius: 8, padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: variant.label === 'Brand' ? '#000' : c1, fontFamily: "'DM Mono', monospace", opacity: 0.7 }}>{variant.label}</div>
                        <div style={{ width: 56, height: 56, background: variant.label === 'Brand' ? '#00000020' : `${c1}20`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: variant.label === 'Brand' ? '#000' : c1 }}>{initials}</span>
                        </div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 11, fontWeight: 700, color: variant.textCol, letterSpacing: '0.05em', textAlign: 'center' }}>{data.companyName || '—'}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: variant.label === 'Brand' ? '#00000080' : c1, opacity: 0.8, textAlign: 'center' }}>{data.industry || ''}</div>
                      </div>
                    ))}
                  </div>
                  {/* Symbol preview */}
                  <div style={{ background: 'var(--bg)', border: `1px solid ${c1}20`, borderRadius: 8, padding: '20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 96, height: 96, flexShrink: 0 }}>{symbol}</div>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: 'var(--cream)', letterSpacing: '0.04em' }}>{data.companyName || '—'}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: c1, marginTop: 4 }}>{data.industry || ''}</div>
                      {data.logoConceptName && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>Concept: {data.logoConceptName}</div>}
                    </div>
                  </div>
                  {/* Keywords */}
                  {(data.logoKeywords || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {data.logoKeywords.map((kw: string, i: number) => (
                        <span key={i} style={{ padding: '4px 10px', border: `1px solid ${c1}50`, color: c1, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', borderRadius: 2 }}>{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* BANNER preview */}
            {activeTab === 'banner' && (() => {
              const c1 = data.primaryColors?.[0] ?? accent
              const c2 = data.primaryColors?.[1] ?? '#0a0a0a'
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Wide banner */}
                  <div style={{ background: c2, borderRadius: 6, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: `${c1}15` }} />
                    <div style={{ flex: 1, zIndex: 1 }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>{data.bannerHeadline || 'Your Headline Here'}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{data.bannerSubheadline || 'Supporting subheadline'}</div>
                    </div>
                    <div style={{ flexShrink: 0, padding: '8px 18px', background: c1, color: '#000', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2, zIndex: 1 }}>{data.bannerCta || 'CTA'} →</div>
                  </div>
                  {/* Square banner */}
                  <div style={{ background: c2, borderRadius: 6, aspectRatio: '1', maxWidth: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${c1}20, transparent)` }} />
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2, zIndex: 1 }}>{data.bannerHeadline || '—'}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'center', zIndex: 1 }}>{data.bannerSubheadline || ''}</div>
                    <div style={{ padding: '6px 14px', background: c1, color: '#000', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2, zIndex: 1 }}>{data.bannerCta || 'CTA'}</div>
                  </div>
                  {/* Theme note */}
                  {data.bannerTheme && (
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 6, padding: '12px 16px' }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Theme</div>
                      <div style={{ fontSize: 12, color: 'var(--cream)', lineHeight: 1.6 }}>{data.bannerTheme}</div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* FLYER preview */}
            {activeTab === 'flyer' && (() => {
              const c1 = data.primaryColors?.[0] ?? accent
              const c2 = data.primaryColors?.[1] ?? '#111'
              const initials = (data.companyName || 'B').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                  {/* A5-ish flyer */}
                  <div style={{ background: '#fff', border: `1px solid ${c1}40`, borderRadius: 8, overflow: 'hidden', width: '100%', maxWidth: 320, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div style={{ background: c2, padding: 0, position: 'relative', overflow: 'hidden' }}>
                      <svg width="100%" viewBox="0 0 320 130" preserveAspectRatio="xMidYMid slice" fill="none" style={{ display: 'block' }}>
                        <rect width="320" height="130" fill={c2} />
                        <circle cx="260" cy="-10" r="110" fill={c1} opacity="0.18" />
                        <rect x="0" y="0" width="4" height="130" fill={c1} />
                        <rect x="20" y="18" width="34" height="34" rx="6" fill={c1} />
                        <text x="37" y="40" textAnchor="middle" fontFamily="serif" fontSize="15" fontWeight="700" fill="#000">{initials}</text>
                        <text x="62" y="30" fontFamily="monospace" fontSize="7" letterSpacing="2" fill={c1} opacity="0.9">{(data.companyName||'').toUpperCase()}</text>
                        <text x="62" y="44" fontFamily="monospace" fontSize="6" letterSpacing="2" fill="rgba(255,255,255,0.45)">{(data.industry||'').toUpperCase()}</text>
                        <text x="20" y="76" fontFamily="serif" fontSize="18" fontWeight="700" fill="#FFF">{data.flyerTitle || 'Flyer Title'}</text>
                        <text x="20" y="96" fontFamily="sans-serif" fontSize="9" fill="rgba(255,255,255,0.6)">{data.flyerSubtitle || ''}</text>
                        <rect x="0" y="126" width="320" height="4" fill={c1} />
                      </svg>
                    </div>
                    {/* Body */}
                    <div style={{ padding: '16px 18px', background: '#fff', flex: 1 }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#333', lineHeight: 1.7, marginBottom: 12 }}>{data.flyerBody || 'Body copy will appear here.'}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                        {(data.flyerHighlights || []).slice(0, 3).map((h: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderLeft: `3px solid ${i === 0 ? c1 : c2}`, paddingLeft: 10 }}>
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#444', lineHeight: 1.5 }}>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Footer */}
                    <div style={{ background: c1, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 10, fontWeight: 600, color: '#000' }}>{data.tagline || data.companyName || ''}</div>
                      <div style={{ background: '#000', color: c1, padding: '5px 12px', borderRadius: 2, fontFamily: "'DM Mono', monospace", fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{data.flyerCta || 'CTA'} →</div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* POSTER preview */}
            {activeTab === 'poster' && (() => {
              const c1 = data.primaryColors?.[0] ?? accent
              const c2 = data.primaryColors?.[1] ?? '#0a0a0a'
              const initials = (data.companyName || 'B').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                  {/* Portrait poster */}
                  <div style={{ background: c2, borderRadius: 8, overflow: 'hidden', aspectRatio: '2 / 3', maxWidth: 280, width: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${c2}D0 0%, ${c2}60 40%, ${c2}CC 75%, ${c2}F0 100%)` }} />
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c1, zIndex: 2 }} />
                    {/* Top branding */}
                    <div style={{ padding: '16px 16px 0', zIndex: 4, position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, background: c1, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 10, fontWeight: 700, color: '#000' }}>{initials}</span>
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>{data.companyName || '—'}</div>
                      </div>
                    </div>
                    {/* Bottom content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px', zIndex: 4, position: 'relative' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <div style={{ width: 20, height: 2, background: c1 }} />
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.12em', color: c1, textTransform: 'uppercase' }}>{data.industry || ''}</div>
                      </div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 8, wordBreak: 'break-word' }}>{data.posterHeadline || 'Your Headline'}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 14 }}>{data.posterTagline || ''}</div>
                      {data.posterCallout && (
                        <div style={{ padding: '6px 12px', border: `1px solid ${c1}`, borderRadius: 2, display: 'inline-block', background: `${c1}20` }}>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.1em', color: c1, textTransform: 'uppercase' }}>{data.posterCallout}</div>
                        </div>
                      )}
                    </div>
                    <div style={{ background: c1, padding: '7px 16px', zIndex: 4, position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.12em', color: '#000', textTransform: 'uppercase', opacity: 0.7 }}>{data.industry || ''}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#000', opacity: 0.5 }}>{new Date().getFullYear()}</div>
                    </div>
                  </div>
                  {/* Typographic variant */}
                  <div style={{ background: c1, borderRadius: 8, padding: '16px 18px', width: '100%', maxWidth: 280, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -16, right: -16, width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)' }} />
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.16em', color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>{(data.industry || '').toUpperCase()} · {(data.companyName || '').toUpperCase()}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: '#000', lineHeight: 1.1, marginBottom: 8 }}>{data.posterHeadline || '—'}</div>
                    <div style={{ width: 20, height: 2, background: 'rgba(0,0,0,0.4)', marginBottom: 6 }} />
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.1em', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase' }}>{data.posterCallout || ''}</div>
                  </div>
                </div>
              )
            })()}

            {/* COPY preview */}
            {activeTab === 'copy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(data.copyHeadlines || []).length > 0 && (
                  <div style={{ background: 'var(--bg)', border: `1px solid ${accent}20`, borderRadius: 8, padding: '16px 18px' }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Headlines</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {data.copyHeadlines.map((h: string, i: number) => (
                        <div key={i} style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: 'var(--cream)', lineHeight: 1.4, borderLeft: `2px solid ${accent}50`, paddingLeft: 12 }}>{h}</div>
                      ))}
                    </div>
                  </div>
                )}
                {(data.copyCtas || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>CTA Variants</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {data.copyCtas.map((cta: string, i: number) => (
                        <div key={i} style={{ padding: '6px 14px', background: i === 0 ? accent : 'transparent', color: i === 0 ? '#000' : accent, border: `1px solid ${accent}`, borderRadius: 2, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{cta}</div>
                      ))}
                    </div>
                  </div>
                )}
                {data.copyEmailSubject && (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8, padding: '14px 18px' }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Email Subject</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'var(--cream)', fontWeight: 600 }}>{data.copyEmailSubject}</div>
                  </div>
                )}
                {data.copyAdCopy && (
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8, padding: '14px 18px' }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Ad Copy</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--cream)', lineHeight: 1.6 }}>{data.copyAdCopy}</div>
                  </div>
                )}
                {!data.copyHeadlines?.length && !data.copyCtas?.length && !data.copyEmailSubject && !data.copyAdCopy && (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 13 }}>Start typing copy on the left to see it here.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
