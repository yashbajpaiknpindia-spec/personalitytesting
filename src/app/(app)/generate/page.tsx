'use client'

import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

// ── Inlined: SlideContent / Slide types ──────────────────────────────────
interface SlideContent {
  // New rich shape
  layoutType?: 'hero' | 'split-left' | 'split-right' | 'stats' | 'bullets' | 'quote' | 'grid' | 'title-only'
  heading?: string
  subheading?: string
  body?: string
  imageQuery?: string
  bullets?: string[]
  stats?: Array<{ value: string; label: string }>
  quote?: string
  attribution?: string
  cards?: Array<{ title: string; body: string }>
  // Legacy editor shape (kept for backward compat)
  type?: 'hook' | 'content' | 'cta'
}
interface Slide {
  id: string; presentationId: string; order: number
  content: SlideContent; createdAt: string; updatedAt: string
}

// ── Inlined: usePublishPortfolio ──────────────────────────────────────────
interface PublishResult { slug: string; url: string; usernameUrl: string | null }

function usePublishPortfolio() {
  const [pbLoading, setPbLoading] = useState(false)
  const [pbResult, setPbResult] = useState<PublishResult | null>(null)
  async function publish(generationId: string): Promise<PublishResult> {
    setPbLoading(true)
    try {
      const res = await fetch('/api/portfolio/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ generationId }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Publish failed') }
      const data: PublishResult = await res.json(); setPbResult(data); return data
    } finally { setPbLoading(false) }
  }
  return { publish, loading: pbLoading, result: pbResult }
}

// ── Inlined: useSlideOperations ───────────────────────────────────────────
function useSlideOperations() {
  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    try { return await fn() } catch { return null }
  }, [])

  const addSlide = useCallback((presentationId: string, afterOrder?: number) =>
    run(async () => {
      const res = await fetch('/api/presentation/slide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ presentationId, afterOrder }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()).slide as Slide
    }), [run])

  const updateSlide = useCallback((slideId: string, content: SlideContent) =>
    run(async () => {
      const res = await fetch(`/api/presentation/slide/${slideId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()).slide as Slide
    }), [run])

  const deleteSlide = useCallback((slideId: string) =>
    run(async () => {
      const res = await fetch(`/api/presentation/slide/${slideId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return true
    }).then(v => v ?? false), [run])

  const duplicateSlide = useCallback((slideId: string) =>
    run(async () => {
      const res = await fetch('/api/presentation/slide/duplicate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slideId }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()).slide as Slide
    }), [run])

  const reorderSlides = useCallback((presentationId: string, orderedIds: string[]) =>
    run(async () => {
      const res = await fetch('/api/presentation/slide/reorder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ presentationId, orderedIds }) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()).slides as Slide[]
    }), [run])

  return { addSlide, updateSlide, deleteSlide, duplicateSlide, reorderSlides }
}

// ── Inlined: useUpdatePresentation ───────────────────────────────────────
function useUpdatePresentation() {
  const update = async (id: string, payload: { title?: string; accentColor?: string }) => {
    try {
      const res = await fetch(`/api/presentation/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) return null
      return (await res.json()).presentation
    } catch { return null }
  }
  return { update }
}

// ── Inlined: PublishButton ────────────────────────────────────────────────
function PublishButton({ generationId, accent }: { generationId: string | null; accent: string }) {
  const { publish, loading, result } = usePublishPortfolio()
  const [showPanel, setShowPanel] = useState(false)
  const [copied, setCopied] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  async function handlePublish() {
    if (!generationId) return
    setPublishError(null)
    try {
      await publish(generationId)
      setShowPanel(true)
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : 'Publish failed')
      setTimeout(() => setPublishError(null), 4000)
    }
  }

  function copyUrl() {
    if (!result?.url) return
    navigator.clipboard.writeText(result.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (result && showPanel) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowPanel(s => !s)}
          title="Portfolio is live"
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: `1px solid ${accent}`, color: accent, padding: '4px 10px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: 'var(--radius)', whiteSpace: 'nowrap' }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent, display: 'inline-block', animation: 'pulse 2s infinite' }} />
          Live
        </button>
        {showPanel && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 400, background: 'var(--surface)', border: `1px solid ${accent}40`, padding: 16, width: 280, borderRadius: 'var(--radius)', boxShadow: '0 12px 40px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace" }}>
                ✦ Portfolio Live
              </div>
              <button onClick={() => setShowPanel(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input readOnly value={result.url} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 8px', fontSize: 10, borderRadius: 2, fontFamily: "'DM Mono', monospace", outline: 'none', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }} />
              <button onClick={copyUrl} style={{ background: accent, color: '#000', border: 'none', padding: '6px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 2, fontWeight: 600, flexShrink: 0 }}>
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', padding: '6px', background: `${accent}18`, border: `1px solid ${accent}40`, color: accent, textDecoration: 'none', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2 }}>
                Open ↗
              </a>
              <button onClick={handlePublish} disabled={loading} style={{ flex: 1, padding: '6px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: 2 }}>
                {loading ? '…' : 'Re-publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handlePublish}
        disabled={!generationId || loading}
        title={!generationId ? 'Generate first' : 'Publish portfolio live'}
        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: `1px solid ${generationId ? accent : 'var(--border)'}`, color: generationId ? accent : 'var(--muted)', padding: '4px 10px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: generationId ? 'pointer' : 'not-allowed', borderRadius: 'var(--radius)', opacity: loading ? 0.6 : 1, transition: 'all 0.15s', whiteSpace: 'nowrap' }}
      >
        {loading ? (
          <span style={{ width: 10, height: 10, border: `1.5px solid ${accent}40`, borderTopColor: accent, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v6M2 4l3-3 3 3M1 9h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {loading ? 'Publishing…' : 'Publish'}
      </button>
      {publishError && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#1a0a0a', border: '1px solid #c0392b', color: '#e74c3c', padding: '6px 10px', fontSize: 10, borderRadius: 3, whiteSpace: 'nowrap', zIndex: 400, fontFamily: "'DM Mono', monospace" }}>
          ✕ {publishError}
        </div>
      )}
    </div>
  )
}

// ── Inlined: ResumeData types ─────────────────────────────────────────────
interface ResumeData {
  name?: string; headline?: string; bio?: string; skills?: string[]
  resumeBullets?: string[]
  experience?: Array<{ title: string; company: string; duration: string; bullets: string[] }>
  education?: Array<{ degree: string; institution: string; year: string }>
  [key: string]: unknown
}
type CoverLetterTone = 'professional' | 'casual' | 'executive' | 'creative'

function useTailorResume() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ versionId: string; tailoredResume: ResumeData; changes: string[] } | null>(null)
  const tailor = useCallback(async (resumeData: ResumeData, jobDescription: string) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/resume/tailor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeData, jobDescription }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Tailoring failed')
      setResult(data); return data
    } catch (err) { setError(err instanceof Error ? err.message : 'Tailoring failed'); return null }
    finally { setLoading(false) }
  }, [])
  const reset = useCallback(() => { setResult(null); setError(null) }, [])
  return { tailor, loading, error, result, reset }
}

function useATSScore() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ score: number; breakdown: Record<string, number>; suggestions: string[] } | null>(null)
  const analyze = useCallback(async (resumeData: ResumeData, jobDescription?: string) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/resume/ats-score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeData, jobDescription }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scoring failed')
      setResult(data); return data
    } catch (err) { setError(err instanceof Error ? err.message : 'Scoring failed'); return null }
    finally { setLoading(false) }
  }, [])
  const reset = useCallback(() => { setResult(null); setError(null) }, [])
  return { analyze, loading, error, result, reset }
}

function useCoverLetter() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ coverLetter: string; versionId: string } | null>(null)
  const generate = useCallback(async (resumeData: ResumeData, jobDescription: string, tone: CoverLetterTone = 'professional', versionId?: string) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/resume/cover-letter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeData, jobDescription, tone, versionId }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setResult(data); return data
    } catch (err) { setError(err instanceof Error ? err.message : 'Generation failed'); return null }
    finally { setLoading(false) }
  }, [])
  const reset = useCallback(() => { setResult(null); setError(null) }, [])
  return { generate, loading, error, result, reset }
}

function useLinkedInImport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ resumeData: ResumeData; rawTextLength: number } | null>(null)
  const [progress, setProgress] = useState('')
  const importPDF = useCallback(async (file: File) => {
    setLoading(true); setError(null); setProgress('Uploading PDF…')
    try {
      const formData = new FormData(); formData.append('file', file)
      setProgress('Extracting text…')
      const res = await fetch('/api/resume/import-linkedin', { method: 'POST', body: formData })
      setProgress('Parsing profile with AI…')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      setResult(data); setProgress('Done!'); return data
    } catch (err) { setError(err instanceof Error ? err.message : 'Import failed'); setProgress(''); return null }
    finally { setLoading(false) }
  }, [])
  const reset = useCallback(() => { setResult(null); setError(null); setProgress('') }, [])
  return { importPDF, loading, error, result, progress, reset }
}

// ── Inlined: ResumeIntelligencePanel ─────────────────────────────────────
function ResumeIntelligencePanel({ resumeData, accent = '#C9A84C', onImported }: { resumeData: ResumeData; accent?: string; onImported?: (data: ResumeData) => void }) {
  type ActivePanel = 'tailor' | 'ats' | 'cover' | 'import' | null
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [jobDesc, setJobDesc] = useState('')
  const [clTone, setClTone] = useState<CoverLetterTone>('professional')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const tailor = useTailorResume(); const ats = useATSScore(); const cover = useCoverLetter(); const linkedin = useLinkedInImport()
  function toggle(panel: ActivePanel) { setActivePanel(p => p === panel ? null : panel) }
  async function copyText(text: string) { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  function scoreColor(n: number) { return n >= 75 ? '#2E7D52' : n >= 50 ? '#E2C57A' : '#C0392B' }
  const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" }
  const panelWrap: React.CSSProperties = { background: 'var(--surface)', border: `1px solid var(--border2)`, borderTop: `2px solid ${accent}`, borderRadius: 'var(--radius)', marginTop: 24, overflow: 'hidden' }
  const sectionHead: React.CSSProperties = { fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, ...mono, marginBottom: 10 }
  const textarea: React.CSSProperties = { width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--cream)', fontSize: 12, fontFamily: "'DM Sans', sans-serif", padding: '10px 12px', resize: 'vertical', outline: 'none', minHeight: 100 }
  const btn = (active = false, ghost = false): React.CSSProperties => ({ padding: '8px 16px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', ...mono, cursor: 'pointer', borderRadius: 'var(--radius)', background: ghost ? 'transparent' : active ? accent : 'var(--surface2)', color: ghost ? 'var(--muted)' : active ? '#000' : 'var(--text)', border: ghost ? '1px solid var(--border)' : active ? 'none' : '1px solid var(--border)', transition: 'all 0.15s', fontWeight: active ? 600 : 400 })
  const metaLabel: React.CSSProperties = { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', ...mono }
  const actions = [{ id: 'tailor' as ActivePanel, icon: '✦', label: 'Tailor Resume' }, { id: 'ats' as ActivePanel, icon: '◎', label: 'ATS Score' }, { id: 'cover' as ActivePanel, icon: '✉', label: 'Cover Letter' }, { id: 'import' as ActivePanel, icon: '↑', label: 'Import LinkedIn' }]

  // Guard: show banner if no resume data yet
  const hasData = !!(resumeData.name || resumeData.bio || (resumeData.resumeBullets?.length ?? 0) > 0)

  return (
    <div style={panelWrap}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...metaLabel, marginRight: 6 }}>Resume Intelligence</div>
        {actions.map(a => (<button key={a.id} onClick={() => toggle(a.id)} style={{ ...btn(activePanel === a.id), display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px' }}><span style={{ fontSize: 11 }}>{a.icon}</span>{a.label}</button>))}
      </div>
      {!hasData && activePanel !== 'import' && (
        <div style={{ padding: '14px 20px', background: accent + '0C', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, ...mono }}>
            <span style={{ color: accent }}>⚠ </span>Generate your brand above first, or use <strong style={{ color: accent }}>Import LinkedIn</strong> to populate resume data before using these tools.
          </div>
        </div>
      )}
      {activePanel === 'tailor' && (
        <div style={{ padding: 20 }}>
          <div style={sectionHead}>Tailor Resume to Job Description</div>
          <textarea style={textarea} placeholder="Paste the full job description here…" value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={5} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => tailor.tailor(resumeData, jobDesc)} disabled={tailor.loading || !jobDesc.trim() || !hasData} style={{ ...btn(true), opacity: tailor.loading || !jobDesc.trim() || !hasData ? 0.5 : 1 }}>{tailor.loading ? '⏳ Tailoring…' : '✦ Tailor Now'}</button>
            {tailor.result && <button onClick={tailor.reset} style={btn(false, true)}>Reset</button>}
          </div>
          {tailor.error && <div style={{ marginTop: 12, fontSize: 11, color: '#C0392B', ...mono }}>✕ {tailor.error}</div>}
          {tailor.result && (
            <div style={{ marginTop: 20 }}>
              <div style={sectionHead}>Tailored Resume Preview</div>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ ...metaLabel, marginBottom: 8 }}>Changes Made</div>
                {tailor.result.changes.map((c, i) => <div key={i} style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 4 }}><span style={{ color: accent }}>→ </span>{c}</div>)}
              </div>
            </div>
          )}
        </div>
      )}
      {activePanel === 'ats' && (
        <div style={{ padding: 20 }}>
          <div style={sectionHead}>ATS Score Analyzer</div>
          <textarea style={{ ...textarea, minHeight: 72 }} placeholder="Paste job description (optional)…" value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={3} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => ats.analyze(resumeData, jobDesc || undefined)} disabled={ats.loading || !hasData} style={{ ...btn(true), opacity: ats.loading || !hasData ? 0.5 : 1 }}>{ats.loading ? '⏳ Analyzing…' : '◎ Analyze ATS'}</button>
            {ats.result && <button onClick={ats.reset} style={btn(false, true)}>Reset</button>}
          </div>
          {ats.error && <div style={{ marginTop: 12, fontSize: 11, color: '#C0392B', ...mono }}>✕ {ats.error}</div>}
          {ats.result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, color: scoreColor(ats.result.score), ...mono }}>{ats.result.score}</div>
                  <div style={{ ...metaLabel, marginTop: 4 }}>/ 100</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${ats.result.score}%`, background: scoreColor(ats.result.score), borderRadius: 3 }} /></div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>{ats.result.score >= 75 ? 'Strong ATS match' : ats.result.score >= 50 ? 'Moderate match — follow suggestions' : 'Low match — needs optimization'}</div>
                </div>
              </div>
              <div style={{ ...metaLabel, marginBottom: 10 }}>Recommendations</div>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                {ats.result.suggestions.map((s, i) => <div key={i} style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 4 }}><span style={{ color: '#E2C57A' }}>⚡ </span>{s}</div>)}
              </div>
            </div>
          )}
        </div>
      )}
      {activePanel === 'cover' && (
        <div style={{ padding: 20 }}>
          <div style={sectionHead}>Cover Letter Generator</div>
          <textarea style={textarea} placeholder="Paste the job description here…" value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={4} />
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <div style={{ ...metaLabel, marginBottom: 8 }}>Tone</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['professional', 'executive', 'casual', 'creative'] as CoverLetterTone[]).map(t => <button key={t} onClick={() => setClTone(t)} style={{ ...btn(clTone === t), padding: '5px 12px', fontSize: 9 }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => cover.generate(resumeData, jobDesc, clTone, tailor.result?.versionId)} disabled={cover.loading || !jobDesc.trim()} style={{ ...btn(true), opacity: cover.loading || !jobDesc.trim() ? 0.5 : 1 }}>{cover.loading ? '⏳ Writing…' : '✉ Generate Letter'}</button>
            {cover.result && <button onClick={cover.reset} style={btn(false, true)}>Reset</button>}
          </div>
          {cover.error && <div style={{ marginTop: 12, fontSize: 11, color: '#C0392B', ...mono }}>✕ {cover.error}</div>}
          {cover.result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={sectionHead}>Generated Cover Letter</div>
                <button onClick={() => copyText(cover.result!.coverLetter)} style={{ ...btn(false, true), padding: '4px 10px', fontSize: 9 }}>{copied ? '✓ Copied' : '⎘ Copy'}</button>
              </div>
              <div style={{ background: '#F8F6F2', border: '1px solid #E0D8CE', borderRadius: 'var(--radius)', padding: '20px 22px', color: '#1A1A1A', fontSize: 12, lineHeight: 1.85, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'pre-wrap' }}>{cover.result.coverLetter}</div>
            </div>
          )}
        </div>
      )}
      {activePanel === 'import' && (
        <div style={{ padding: 20 }}>
          <div style={sectionHead}>Import LinkedIn PDF</div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>Export your LinkedIn profile as PDF, then upload it here.<br /><span style={{ color: accent }}>LinkedIn → Me → View Profile → More → Save to PDF</span></p>
          <div onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) linkedin.importPDF(f) }} style={{ border: `2px dashed ${linkedin.loading ? accent : 'var(--border2)'}`, borderRadius: 'var(--radius)', padding: '32px 24px', textAlign: 'center', cursor: linkedin.loading ? 'default' : 'pointer', background: 'var(--surface2)' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{linkedin.loading ? '⏳' : '↑'}</div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{linkedin.loading ? linkedin.progress : 'Click or drag your LinkedIn PDF'}</div>
            <div style={{ ...metaLabel }}>PDF files only — max 10 MB</div>
          </div>
          <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) linkedin.importPDF(f); e.target.value = '' }} />
          {linkedin.error && <div style={{ marginTop: 12, fontSize: 11, color: '#C0392B', ...mono }}>✕ {linkedin.error}</div>}
          {linkedin.result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ ...sectionHead, marginBottom: 12 }}>Parsed Profile</div>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                {Object.entries(linkedin.result.resumeData).filter(([, v]) => v && (!Array.isArray(v) || v.length > 0)).map(([key, val]) => (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <div style={{ ...metaLabel, marginBottom: 3 }}>{key}</div>
                    <div style={{ fontSize: 11, color: 'var(--cream)', lineHeight: 1.6 }}>{Array.isArray(val) ? typeof val[0] === 'string' ? (val as string[]).join(' • ') : JSON.stringify(val).substring(0, 200) : String(val).substring(0, 200)}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => { onImported?.(linkedin.result!.resumeData); toggle('import') }} style={btn(true)}>✓ Use This Profile</button>
                <button onClick={linkedin.reset} style={btn(false, true)}>Clear</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Inlined: SlideEditor ──────────────────────────────────────────────────
interface SlideEditorProps {
  existingPresentationId?: string
  presentationHook?: string
  presentationTheme?: string
  presentationFontPair?: string
  presentationSlides?: Array<{
    layoutType?: string
    heading?: string
    title?: string    // backward compat alias
    body?: string
    imageQuery?: string
    bullets?: string[]
    stats?: Array<{ value: string; label: string }>
    quote?: string
    attribution?: string
    cards?: Array<{ title: string; body: string }>
  }>
  accentColor?: string
  generationId?: string
}

// ── SlideImage — fetches a Pexels photo and renders it in the slide card ──
function SlideImage({ query, accent }: { query: string; accent: string }) {
  const [src, setSrc] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    let cancelled = false
    setLoading(true); setSrc(null)
    // FIX: always call .json() — API always returns 200 with {url: string|null}
    fetch(`/api/image?query=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => { if (cancelled) return; if (data?.url) setSrc(data.url) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [query])
  return (
    <div style={{ marginTop: 8 }}>
      {loading && (
        <div style={{ height: 70, background: '#111', border: `1px dashed ${accent}30`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#555', letterSpacing: '0.08em' }}>
          📷 {query}
        </div>
      )}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={query} style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 3, display: 'block', border: `1px solid ${accent}30` }} />
      )}
      {!loading && !src && (
        <div style={{ height: 70, background: '#0A0A0A', border: `1px dashed ${accent}20`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#444', letterSpacing: '0.08em' }}>
          📷 {query}
        </div>
      )}
    </div>
  )
}

function MiniBtn({ onClick, title, danger, children }: { onClick: () => void; title?: string; danger?: boolean; children: React.ReactNode }) {
  return <button onClick={onClick} title={title} style={{ background: 'transparent', border: `1px solid ${danger ? '#8b2020' : 'rgba(255,255,255,0.1)'}`, color: danger ? '#c0392b' : 'rgba(255,255,255,0.35)', borderRadius: 3, padding: '2px 10px', fontSize: 10, cursor: 'pointer', letterSpacing: '0.06em' }}>{children}</button>
}

function ToolbarBtn({ onClick, accent, active, children }: { onClick: () => void; accent: string; active?: boolean; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ background: active ? `${accent}20` : 'transparent', border: `1px solid ${accent}50`, color: accent, borderRadius: 4, padding: '5px 12px', fontSize: 11, cursor: 'pointer', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{children}</button>
}

function SlideCard({ slide, index, accent, isActive, isDragging, onSelect, onDragStart, onDragOver, onDrop, onDragEnd, onDelete, onDuplicate, onAdd, onContentChange }: {
  slide: Slide; index: number; accent: string; isActive: boolean; isDragging: boolean
  onSelect: () => void; onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void; onDrop: (e: React.DragEvent<HTMLDivElement>, id: string) => void
  onDragEnd: () => void; onDelete: (id: string) => void; onDuplicate: (id: string) => void
  onAdd: (afterOrder: number) => void; onContentChange: (id: string, field: keyof SlideContent, value: string) => void
}) {
  const c = slide.content
  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      <div draggable onClick={onSelect} onDragStart={e => onDragStart(e, slide.id)} onDragOver={onDragOver} onDrop={e => onDrop(e, slide.id)} onDragEnd={onDragEnd} style={{ background: isDragging ? 'rgba(255,255,255,0.04)' : isActive ? '#1a1a1a' : '#111', border: `1px solid ${isActive ? accent + '80' : 'rgba(255,255,255,0.07)'}`, borderLeft: `3px solid ${isActive ? accent : 'rgba(255,255,255,0.1)'}`, borderRadius: 5, padding: '14px 14px 10px', cursor: isDragging ? 'grabbing' : 'pointer', opacity: isDragging ? 0.4 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, pointerEvents: 'none', userSelect: 'none' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.18em', color: accent, fontFamily: "'DM Mono', monospace" }}>{String(index + 1).padStart(2, '0')} — {(c.layoutType ?? c.type ?? 'content').toUpperCase()}</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
          <span style={{ fontSize: 12, opacity: 0.3, cursor: 'grab' }}>⠿</span>
        </div>
        <div contentEditable suppressContentEditableWarning onBlur={e => onContentChange(slide.id, 'heading', e.currentTarget.textContent ?? '')} onClick={e => e.stopPropagation()} style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#F8F4EE', lineHeight: 1.4, outline: 'none', borderBottom: '1px dashed transparent', minHeight: 22, cursor: 'text' }}>{c.heading}</div>
        {c.type !== 'hook' && <div contentEditable suppressContentEditableWarning onBlur={e => onContentChange(slide.id, 'body', e.currentTarget.textContent ?? '')} onClick={e => e.stopPropagation()} style={{ marginTop: 8, fontSize: 12, color: '#A09890', lineHeight: 1.6, outline: 'none', borderBottom: '1px dashed transparent', minHeight: 18, cursor: 'text' }}>{c.body}</div>}
        {c.type === 'hook' && <div contentEditable suppressContentEditableWarning onBlur={e => onContentChange(slide.id, 'subheading', e.currentTarget.textContent ?? '')} onClick={e => e.stopPropagation()} style={{ marginTop: 8, fontSize: 12, color: '#A09890', lineHeight: 1.6, outline: 'none', borderBottom: '1px dashed transparent', minHeight: 18, cursor: 'text' }}>{c.subheading}</div>}
        {/* Bullets preview */}
        {c.bullets && c.bullets.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {c.bullets.map((b, i) => (
              <div key={i} style={{ fontSize: 11, color: '#7a7060', lineHeight: 1.5, paddingLeft: 12 }}>› {b}</div>
            ))}
          </div>
        )}
        {/* Stats preview */}
        {c.stats && c.stats.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' as const }}>
            {c.stats.map((stat, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}40`, borderRadius: 3, padding: '4px 10px', textAlign: 'center' as const }}>
                <div style={{ fontSize: 14, color: accent, fontFamily: "'DM Mono', monospace" }}>{stat.value}</div>
                <div style={{ fontSize: 9, color: '#7a7060', letterSpacing: '0.08em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}
        {/* Quote preview */}
        {c.quote && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#A09890', fontStyle: 'italic', borderLeft: `2px solid ${accent}`, paddingLeft: 8, lineHeight: 1.6 }}>
            &ldquo;{c.quote}&rdquo;
          </div>
        )}
        {/* Cards preview */}
        {c.cards && c.cards.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
            {c.cards.map((card, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${accent}30`, borderRadius: 3, padding: '4px 8px', minWidth: 80, flex: 1 }}>
                <div style={{ fontSize: 10, color: '#F8F4EE', marginBottom: 2 }}>{card.title}</div>
                <div style={{ fontSize: 9, color: '#7a7060', lineHeight: 1.4 }}>{card.body}</div>
              </div>
            ))}
          </div>
        )}
        {/* Image — fetched via Pexels proxy, with change button */}
        {c.imageQuery && (
          <div style={{ position: 'relative' }}>
            <SlideImage query={c.imageQuery} accent={accent} />
            <button
              onClick={e => {
                e.stopPropagation()
                const newQuery = prompt('Enter new image search query:', c.imageQuery)
                if (newQuery && newQuery.trim()) onContentChange(slide.id, 'imageQuery', newQuery.trim())
              }}
              title="Change image"
              style={{
                position: 'absolute', top: 4, right: 4,
                background: 'rgba(0,0,0,0.75)', border: `1px solid ${accent}60`,
                color: accent, borderRadius: 3, padding: '2px 7px',
                fontSize: 9, cursor: 'pointer', letterSpacing: '0.08em',
                backdropFilter: 'blur(4px)',
              }}
            >
              ✎ image
            </button>
          </div>
        )}
        {!c.imageQuery && (
          <button
            onClick={e => {
              e.stopPropagation()
              const newQuery = prompt('Enter image search query to add an image:')
              if (newQuery && newQuery.trim()) onContentChange(slide.id, 'imageQuery', newQuery.trim())
            }}
            style={{
              marginTop: 8, width: '100%', padding: '6px', background: 'transparent',
              border: `1px dashed ${accent}30`, borderRadius: 3,
              color: accent + '80', fontSize: 9, cursor: 'pointer',
              letterSpacing: '0.08em', textAlign: 'center',
            }}
          >
            + Add Image
          </button>
        )}
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
          <MiniBtn onClick={() => onDuplicate(slide.id)}>⧉ Duplicate</MiniBtn>
          <MiniBtn onClick={() => onDelete(slide.id)} danger>✕ Delete</MiniBtn>
        </div>
      </div>
      <div onClick={() => onAdd(slide.order)} style={{ textAlign: 'center', marginTop: 3, cursor: 'pointer', fontSize: 10, color: accent, letterSpacing: '0.12em', opacity: 0, transition: 'opacity 0.15s', padding: '3px 0' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0' }}>+ Add Slide Here</div>
    </div>
  )
}

function SlideEditor({ existingPresentationId, presentationHook, presentationSlides = [], accentColor = '#C9A84C', generationId, presentationTheme, presentationFontPair }: SlideEditorProps) {
  const [presentationId, setPresentationId] = useState<string | null>(existingPresentationId ?? null)
  const [slug, setSlug] = useState<string | null>(null)
  const [title, setTitle] = useState('My Presentation')
  const [slides, setSlides] = useState<Slide[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [initialising, setInitialising] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)  // FIX: surface auth/load errors
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [copied, setCopied] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdates = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const ops = useSlideOperations()
  const { update: updateMeta } = useUpdatePresentation()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setInitialising(true)
      try {
        let pid = existingPresentationId ?? null
        if (!pid && generationId) pid = sessionStorage.getItem(`bs_pres_${generationId}`)
        if (pid) {
          const res = await fetch(`/api/presentation/${pid}`)
          if (res.ok) {
            const data = await res.json()
            if (!cancelled) { setPresentationId(data.presentation.id); setSlug(data.presentation.slug); setTitle(data.presentation.title); setSlides(data.presentation.slides) }
            return
          }
          sessionStorage.removeItem(`bs_pres_${generationId}`)
        }
        const res = await fetch('/api/presentation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'My Presentation', accentColor, generationId, presentationHook, presentationTheme, presentationFontPair, presentationSlides: presentationSlides.map(s => ({
  layoutType:  s.layoutType ?? 'split-left',
  title:       s.title ?? s.heading ?? '',
  heading:     s.heading ?? s.title ?? '',
  body:        s.body,
  imageQuery:  s.imageQuery,
  bullets:     s.bullets,
  stats:       s.stats,
  quote:       s.quote,
  attribution: s.attribution,
  cards:       s.cards,
})) }) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (generationId) sessionStorage.setItem(`bs_pres_${generationId}`, data.presentation.id)
        if (!cancelled) { setPresentationId(data.presentation.id); setSlug(data.presentation.slug); setTitle(data.presentation.title); setSlides(data.presentation.slides) }
      } catch (e) { 
        console.error('[SlideEditor] init error', e)
        const msg = (e as Error).message ?? ''
        if (msg.includes('401') || msg.includes('403')) {
          setInitError('You must be signed in to create or edit presentations.')
        } else {
          setInitError('Failed to load slide editor. Please refresh the page.')
        }
      }
      finally { if (!cancelled) setInitialising(false) }
    })()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingPresentationId, generationId])

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

  const handleContentChange = useCallback((slideId: string, field: keyof SlideContent, value: string) => {
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, content: { ...s.content, [field]: value } } : s))
    const existing = pendingUpdates.current.get(slideId)
    if (existing) clearTimeout(existing)
    setSaveStatus('saving')
    const t = setTimeout(() => {
      setSlides(prev => {
        const slide = prev.find(s => s.id === slideId)
        if (slide) ops.updateSlide(slideId, slide.content).then(ok => setSaveStatus(ok !== null ? 'saved' : 'error'))
        return prev
      })
      pendingUpdates.current.delete(slideId)
    }, 800)
    pendingUpdates.current.set(slideId, t)
  }, [ops])

  const handleAdd = useCallback(async (afterOrder: number) => {
    if (!presentationId) return
    const newSlide = await ops.addSlide(presentationId, afterOrder)
    if (newSlide) { setSlides(prev => { const shifted = prev.map(s => s.order >= newSlide.order && s.id !== newSlide.id ? { ...s, order: s.order + 1 } : s); return [...shifted, newSlide].sort((a, b) => a.order - b.order) }); setActiveId(newSlide.id) }
  }, [presentationId, ops])

  const handleDelete = useCallback(async (slideId: string) => {
    if (slides.length <= 1) return
    const ok = await ops.deleteSlide(slideId)
    if (ok) { setSlides(prev => prev.filter(s => s.id !== slideId).map((s, i) => ({ ...s, order: i }))); setActiveId(null) }
  }, [slides.length, ops])

  const handleDuplicate = useCallback(async (slideId: string) => {
    const dup = await ops.duplicateSlide(slideId)
    if (dup) { setSlides(prev => { const shifted = prev.map(s => s.order >= dup.order && s.id !== dup.id ? { ...s, order: s.order + 1 } : s); return [...shifted, dup].sort((a, b) => a.order - b.order) }); setActiveId(dup.id) }
  }, [ops])

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); setDraggingId(id) }, [])
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }, [])
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId || !presentationId) return
    setSlides(prev => {
      const arr = [...prev].sort((a, b) => a.order - b.order)
      const from = arr.findIndex(s => s.id === sourceId); const to = arr.findIndex(s => s.id === targetId)
      if (from === -1 || to === -1) return prev
      const [moved] = arr.splice(from, 1); arr.splice(to, 0, moved)
      const reindexed = arr.map((s, i) => ({ ...s, order: i }))
      ops.reorderSlides(presentationId, reindexed.map(s => s.id))
      return reindexed
    })
  }, [presentationId, ops])
  const handleDragEnd = useCallback(() => setDraggingId(null), [])
  const handleExport = useCallback(() => { if (presentationId) window.open(`/api/presentation/export/pptx?id=${presentationId}`, '_blank') }, [presentationId])
  const handleShare = useCallback(() => {
    if (!slug) return
    navigator.clipboard.writeText(`${window.location.origin}/presentation/${slug}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
  }, [slug])

  if (initError) return (
    <div style={{ padding: 32, textAlign: 'center', background: '#0A0A0A', borderRadius: 6, border: '1px solid rgba(192,57,43,0.3)' }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>⚠️</div>
      <div style={{ fontSize: 13, color: '#E57373', lineHeight: 1.6 }}>{initError}</div>
    </div>
  )

  if (initialising) return (
    <div style={{ padding: 32, textAlign: 'center', background: '#0A0A0A' }}>
      <div style={{ display: 'inline-block', width: 18, height: 18, border: `2px solid ${accentColor}30`, borderTop: `2px solid ${accentColor}`, borderRadius: '50%', animation: 'bs_spin 0.8s linear infinite' }} />
      <style>{`@keyframes bs_spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ marginTop: 10, fontSize: 11, color: '#A09890', letterSpacing: '0.1em' }}>Loading slide editor…</div>
    </div>
  )

  const sorted = [...slides].sort((a, b) => a.order - b.order)
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0A0A0A', padding: '20px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <div contentEditable suppressContentEditableWarning onBlur={e => handleTitleChange(e.currentTarget.textContent ?? '')} style={{ flex: 1, minWidth: 120, fontSize: 13, fontWeight: 600, color: '#F8F4EE', outline: 'none', cursor: 'text', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 2 }}>{title}</div>
        <span style={{ fontSize: 9, letterSpacing: '0.12em', fontFamily: "'DM Mono', monospace", color: saveStatus === 'saved' ? accentColor : saveStatus === 'error' ? '#c0392b' : '#A09890' }}>{saveStatus === 'saved' ? '✓ SAVED' : saveStatus === 'error' ? '✗ ERROR' : '● SAVING'}</span>
        <ToolbarBtn accent={accentColor} onClick={handleExport}>↓ PPTX</ToolbarBtn>
        <ToolbarBtn accent={accentColor} onClick={handleShare} active={copied}>{copied ? '✓ Copied!' : '⇗ Share'}</ToolbarBtn>
      </div>
      {sorted.map((slide, idx) => <SlideCard key={slide.id} slide={slide} index={idx} accent={accentColor} isActive={activeId === slide.id} isDragging={draggingId === slide.id} onSelect={() => setActiveId(slide.id)} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} onDelete={handleDelete} onDuplicate={handleDuplicate} onAdd={handleAdd} onContentChange={handleContentChange} />)}
      <button onClick={() => { const last = sorted[sorted.length - 1]; handleAdd(last ? last.order : -1) }} style={{ width: '100%', padding: '10px 0', marginTop: 4, background: 'transparent', border: `1px dashed ${accentColor}40`, borderRadius: 5, cursor: 'pointer', color: accentColor, fontSize: 11, letterSpacing: '0.12em' }} onMouseEnter={e => { const el = e.currentTarget; el.style.background = `${accentColor}10`; el.style.borderColor = `${accentColor}80` }} onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'transparent'; el.style.borderColor = `${accentColor}40` }}>+ ADD SLIDE</button>
      <div style={{ textAlign: 'center', marginTop: 14, fontSize: 9, color: '#2a2a2a', letterSpacing: '0.16em', fontFamily: "'DM Mono', monospace" }}>{sorted.length} {sorted.length === 1 ? 'SLIDE' : 'SLIDES'} · DRAG TO REORDER</div>
    </div>
  )
}
interface BrandOutput {
  headline: string
  tagline: string
  bio: string
  skills: string[]
  cta: string
  portfolioSections: Array<{ title: string; body: string; highlight: string }>
  resumeBullets: string[]
  cardName: string
  cardTitle: string
  presentationHook: string
  presentationTheme?: string
  presentationFontPair?: string
  presentationSlides: Array<{
    layoutType: string
    heading: string
    subheading?: string
    body?: string
    imageQuery?: string
    bullets?: string[]
    stats?: Array<{ value: string; label: string }>
    quote?: string
    attribution?: string
    cards?: Array<{ title: string; body: string }>
  }>
}

// FIX 1: All 48 templates with correct slug + accentColor matching the DB seed
const TEMPLATES = [
  // PORTFOLIO (12)
  { slug: 'the-manifesto',   name: 'Manifesto',  color: '#C9A84C', category: 'portfolio' },
  { slug: 'editorial-dark',  name: 'Editorial',  color: '#C9A84C', category: 'portfolio' },
  { slug: 'signal',          name: 'Signal',     color: '#4CA8C9', category: 'portfolio' },
  { slug: 'founders-page',   name: 'Founder',    color: '#C9A84C', category: 'portfolio' },
  { slug: 'case-study-pro',  name: 'Case Study', color: '#7B68EE', category: 'portfolio' },
  { slug: 'zero-noise',      name: 'Zero',       color: '#F0EAE0', category: 'portfolio' },
  { slug: 'luminary',        name: 'Luminary',   color: '#E2C57A', category: 'portfolio' },
  { slug: 'the-architect',   name: 'Architect',  color: '#9CA3AF', category: 'portfolio' },
  { slug: 'studio-brief',    name: 'Studio',     color: '#C0392B', category: 'portfolio' },
  { slug: 'minimal-canon',   name: 'Canon',      color: '#C9A84C', category: 'portfolio' },
  { slug: 'the-operator',    name: 'Operator',   color: '#2E7D52', category: 'portfolio' },
  { slug: 'deep-work',       name: 'Deep Work',  color: '#A09890', category: 'portfolio' },
  // RESUME (12)
  { slug: 'executive-clean', name: 'Executive',  color: '#C9A84C', category: 'resume' },
  { slug: 'signal-resume',   name: 'Signal',     color: '#4CA8C9', category: 'resume' },
  { slug: 'the-chronicle',   name: 'Chronicle',  color: '#C9A84C', category: 'resume' },
  { slug: 'linear',          name: 'Linear',     color: '#F0EAE0', category: 'resume' },
  { slug: 'command',         name: 'Command',    color: '#1A3A2A', category: 'resume' },
  { slug: 'criterion',       name: 'Criterion',  color: '#C9A84C', category: 'resume' },
  { slug: 'the-ledger',      name: 'Ledger',     color: '#2E7D52', category: 'resume' },
  { slug: 'brief-brilliant', name: 'Brief',      color: '#C9A84C', category: 'resume' },
  { slug: 'structured',      name: 'Structured', color: '#7B68EE', category: 'resume' },
  { slug: 'the-achiever',    name: 'Achiever',   color: '#E2C57A', category: 'resume' },
  { slug: 'systems-thinker', name: 'Systems',    color: '#4CA8C9', category: 'resume' },
  { slug: 'directors-cut',   name: "Director's", color: '#C0392B', category: 'resume' },
  // CARD (12)
  { slug: 'noir-card',       name: 'Noir',       color: '#C9A84C', category: 'card' },
  { slug: 'the-credential',  name: 'Credential', color: '#F0EAE0', category: 'card' },
  { slug: 'obsidian',        name: 'Obsidian',   color: '#C9A84C', category: 'card' },
  { slug: 'minimal-touch',   name: 'Minimal',    color: '#C9A84C', category: 'card' },
  { slug: 'the-signet',      name: 'Signet',     color: '#B8960C', category: 'card' },
  { slug: 'matte-black',     name: 'Matte',      color: '#C9A84C', category: 'card' },
  { slug: 'cipher',          name: 'Cipher',     color: '#4CA8C9', category: 'card' },
  { slug: 'luxe-mono',       name: 'Luxe Mono',  color: '#F0EAE0', category: 'card' },
  { slug: 'the-partner',     name: 'Partner',    color: '#1A2A3A', category: 'card' },
  { slug: 'carbon',          name: 'Carbon',     color: '#9CA3AF', category: 'card' },
  { slug: 'embossed',        name: 'Embossed',   color: '#C9A84C', category: 'card' },
  { slug: 'foundry',         name: 'Foundry',    color: '#B85C2A', category: 'card' },
  // PRESENTATION (12)
  { slug: 'pitch-dark',      name: 'Pitch Dark', color: '#C9A84C', category: 'presentation' },
  { slug: 'the-narrative',   name: 'Narrative',  color: '#7B68EE', category: 'presentation' },
  { slug: 'signal-deck',     name: 'Signal',     color: '#4CA8C9', category: 'presentation' },
  { slug: 'operator-deck',   name: 'Operator',   color: '#2E7D52', category: 'presentation' },
  { slug: 'founder-pitch',   name: 'Founder',    color: '#C9A84C', category: 'presentation' },
  { slug: 'zero-to-one',     name: 'Zero-to-One',color: '#C0392B', category: 'presentation' },
  { slug: 'the-thesis',      name: 'Thesis',     color: '#F0EAE0', category: 'presentation' },
  { slug: 'board-brief',     name: 'Board',      color: '#1A2A3A', category: 'presentation' },
  { slug: 'momentum',        name: 'Momentum',   color: '#2E7D52', category: 'presentation' },
  { slug: 'iron-curtain',    name: 'Iron',       color: '#C0392B', category: 'presentation' },
  { slug: 'the-reveal',      name: 'Reveal',     color: '#C9A84C', category: 'presentation' },
  { slug: 'series-a',        name: 'Series A',   color: '#E2C57A', category: 'presentation' },
]

const TEMPLATE_CATEGORIES = ['portfolio', 'resume', 'card', 'presentation'] as const
const GEN_STEPS = ['Validating', 'Enriching', 'Generating', 'Enhancing', 'Ready']

function GenerateStudio() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'generate' | 'details' | 'style'>('generate')
  // FIX 2: pvTab now includes 'presentation'
  const [pvTab, setPvTab] = useState<'portfolio' | 'card' | 'resume' | 'presentation'>('portfolio')
  // ── BUSINESS MODE ─────────────────────────────────────────────────────────
  const [appMode, setAppMode] = useState<'personal' | 'business'>('personal')
  // MOBILE FIX: separate mobile panel — 'form' or 'preview'
  const [mobilePanel, setMobilePanel] = useState<'form' | 'preview'>('form')
  // Theme switcher visible in preview panel
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false)
  // Resume font picker
  const [resumeFont, setResumeFont] = useState<string>('DM Sans')
  const [outputTypes, setOutputTypes] = useState(['portfolio', 'card', 'resume'])
  const [presentationSlideCount, setPresentationSlideCount] = useState(8)
  const [selectedTemplate, setSelectedTemplate] = useState(searchParams.get('template') || 'noir-card')
  const [loading, setLoading] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [output, setOutput] = useState<BrandOutput | null>(null)
  const [genId, setGenId] = useState<string | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [exportLoading, setExportLoading] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [showToast, setShowToast] = useState(false)
  // FIX 3: Category filter for the picker so all 48 templates are browsable
  const [pickerCategory, setPickerCategory] = useState<string>(() => {
    const slug = searchParams.get('template') || 'noir-card'
    return TEMPLATES.find(t => t.slug === slug)?.category ?? 'card'
  })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [headline, setHeadline] = useState('')
  const [tagline, setTagline] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [tone, setTone] = useState('professional')

  // Load a previous generation if ?from=<id> (remix) or ?from=<id>&preview=1 (view output) is in the URL
  useEffect(() => {
    const fromId  = searchParams.get('from')
    const preview = searchParams.get('preview') === '1'
    if (!fromId) return
    fetch(`/api/generate/load?id=${fromId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        if (data.inputData) {
          const i = data.inputData
          if (i.name)      setName(i.name)
          if (i.headline)  setHeadline(i.headline)
          if (i.tagline)   setTagline(i.tagline)
          if (i.jobTitle)  setJobTitle(i.jobTitle)
          if (i.company)   setCompany(i.company)
          if (i.location)  setLocation(i.location)
          if (i.bio)       setBio(i.bio)
          if (i.skills)                setSkills(i.skills)
          if (i.tone)                  setTone(i.tone)
          if (Array.isArray(i.outputTypes))    setOutputTypes(i.outputTypes)
          if (i.presentationSlideCount)        setPresentationSlideCount(i.presentationSlideCount)
          if (i.templateSlug) {
            setSelectedTemplate(i.templateSlug)
            const tpl = TEMPLATES.find(t => t.slug === i.templateSlug)
            if (tpl) setPickerCategory(tpl.category)
          }
        }
        // Load output too when previewing (not remixing)
        if (preview && data.outputData) {
          setOutput(data.outputData as BrandOutput)
          setGenId(data.id)
          setGenStep(4)
          if (searchParams.get('export') === '1') setShowExport(true)
        } else if (!preview && data.outputData) {
          // Remix: load output too so user can see what they're remixing from
          setOutput(data.outputData as BrandOutput)
          setGenId(data.id)
          setGenStep(4)
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function showMsg(msg: string) {
    setToast(msg); setShowToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setShowToast(false), 3000)
  }

  function toggleOutputType(type: string) {
    setOutputTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  function addSkill(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && skillInput.trim()) {
      setSkills(prev => [...prev, skillInput.trim()])
      setSkillInput('')
    }
  }

  async function handleGenerate() {
    if (!name.trim()) { showMsg('Name is required'); return }
    setLoading(true)
    setOutput(null)
    setGenStep(0)
    const stepInterval = setInterval(() => setGenStep(s => Math.min(s + 1, 3)), 900)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, headline, tagline, jobTitle, company, location, bio, skills, tone, templateSlug: selectedTemplate, outputTypes, presentationSlideCount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      clearInterval(stepInterval)
      setGenStep(4)
      setOutput(data.output)
      setGenId(data.generationId)
      setMobilePanel('preview')   // Auto-show results on mobile
      showMsg('Brand content generated!')
    } catch (err) {
      clearInterval(stepInterval)
      showMsg(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport(format: string) {
    if (!genId) { showMsg('Generate your brand first'); return }
    setExportLoading(format)
    try {
      const endpoint = format === 'pptx'
        ? '/api/export/pptx'
        : format === 'vcard'
        ? '/api/export/vcard'
        : '/api/export/pdf'

      const body = (format === 'pptx' || format === 'vcard')
        ? { generationId: genId }
        : { generationId: genId, format }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Export failed (${res.status})` }))
        throw new Error(err.error || `Export failed (${res.status})`)
      }

      const contentType = res.headers.get('Content-Type') || ''

      // Direct binary stream (Cloudinary fallback) — treat like a blob download
      const isBinary = contentType.includes('application/pdf') ||
        contentType.includes('application/vnd.openxmlformats') ||
        contentType.includes('text/vcard') ||
        contentType.includes('octet-stream')

      if (isBinary) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const ext = format === 'pptx' ? '.pptx' : format === 'vcard' ? '.vcf' : '.pdf'
        const safeName = (output?.cardName || 'brand-syndicate').replace(/\s+/g, '-').toLowerCase()
        a.download = `${safeName}-${format}${ext}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 2000)
        return
      }

      // JSON response with Cloudinary URL
      const data = await res.json()
      if (data.url) {
        const safeName = (output?.cardName || 'brand-syndicate').replace(/\s+/g, '-').toLowerCase()
        const ext = format === 'pptx' ? '.pptx' : format === 'vcard' ? '.vcf' : '.pdf'
        // Fetch the signed URL as blob to guarantee browser triggers download with filename
        try {
          const dlRes = await fetch(data.url)
          if (dlRes.ok) {
            const blob = await dlRes.blob()
            const blobUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = `${safeName}-${format}${ext}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)
            showMsg('Downloaded!')
            return
          }
        } catch {}
        // Final fallback: open in new tab
        window.open(data.url, '_blank')
        showMsg('Opening download…')
      } else {
        throw new Error('No download URL returned')
      }
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExportLoading(null)
    }
  }

  // FIX 4: accent now derived from selectedTemplate color, not hardcoded
  const accent = TEMPLATES.find(t => t.slug === selectedTemplate)?.color ?? '#C9A84C'
  const filteredTemplates = TEMPLATES.filter(t => t.category === pickerCategory)

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }

  function editBtnStyle(active: boolean, accentCol: string): React.CSSProperties {
    return {
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: "'DM Mono', monospace", textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
      background: active ? `${accentCol}18` : 'var(--surface)',
      border: `1px solid ${active ? accentCol : 'var(--border2)'}`,
      color: active ? accentCol : 'var(--muted)',
      borderRadius: 'var(--radius)', cursor: 'pointer', transition: 'all 0.15s',
    }
  }

  // Brand Syndicate is business-only. Always show BusinessGenerateStudio.
  void (appMode) // suppress unused-var
  return <BusinessGenerateStudio onSwitchMode={() => {}} />
}

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

type BizTab = 'logo' | 'banner' | 'flyer' | 'poster' | 'copy' | 'website' | 'presentation'
type BizFormTab = 'generate' | 'details' | 'style' | 'banner-studio'
type BizTone = 'bold' | 'professional' | 'playful' | 'luxury'

const BIZ_STEPS = ['Analysing', 'Concepting', 'Crafting', 'Polishing', 'Ready']

const BIZ_TAB_META: Record<BizTab, { label: string; icon: string }> = {
  logo:         { label: 'Logo Concept',      icon: '◈' },
  banner:       { label: 'Banner',            icon: '▭' },
  flyer:        { label: 'Flyer',             icon: '◻' },
  poster:       { label: 'Poster',            icon: '◼' },
  copy:         { label: 'Copy',              icon: '✦' },
  website:      { label: 'Portfolio Website', icon: '⬡' },
  presentation: { label: 'Presentation',      icon: '⬛' },
}

// ── Logo Concept Preview ───────────────────────────────────────────────────
// ── buildLogoSymbol — generates an abstract SVG mark from the AI's symbolIdea ──
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
    // @ts-ignore — html2canvas loaded at runtime
    const h2c = (await import('html2canvas')).default
    const canvas = await h2c(el, { scale: 2, useCORS: true, backgroundColor: null, logging: false })
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch {
    // Fallback: SVG to PNG via canvas
    alert('Download failed — try right-clicking the preview and saving the image.')
  }
}

function DownloadBar({ title, refEl, accent, extraButtons }: {
  title: string
  refEl: React.RefObject<HTMLDivElement>
  accent: string
  extraButtons?: React.ReactNode
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
        <button className="biz-download-btn primary" onClick={handlePng} disabled={saving}>
          {saving ? '…' : '⬇'} {saving ? 'Saving' : 'PNG'}
        </button>
      </div>
    </div>
  )
}

// ── Logo Preview ──────────────────────────────────────────────────────────────
function BizLogoPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const c1 = data.primaryColors?.[0] ?? accent
  const c2 = data.primaryColors?.[1] ?? '#1a1a1a'
  const c3 = data.primaryColors?.[2] ?? '#333'
  const symbolIdea = data.logoSymbolIdea || ''
  const darkRef  = React.useRef<HTMLDivElement>(null)
  const lightRef = React.useRef<HTMLDivElement>(null)
  const brandRef = React.useRef<HTMLDivElement>(null)
  const wordmarkRef = React.useRef<HTMLDivElement>(null)

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
      <DownloadBar title="Logo Dark" refEl={darkRef} accent={c1}
        extraButtons={
          <>
            <button className="biz-download-btn" onClick={() => downloadElementAsPng(lightRef.current!, 'logo-light.png')}>Light PNG</button>
            <button className="biz-download-btn" onClick={() => downloadElementAsPng(brandRef.current!, 'logo-brand.png')}>Brand PNG</button>
            <button className="biz-download-btn" onClick={() => downloadElementAsPng(wordmarkRef.current!, 'wordmark.png')}>Wordmark PNG</button>
          </>
        }
      />
      <div style={{ padding: 'clamp(16px,4vw,28px)', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Logo 3-variant grid — responsive via CSS class */}
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
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Concept — {data.logoConceptName}</div>
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
    </div>
  )
}

// ── Banner Preview ─────────────────────────────────────────────────────────────
function BizBannerPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const c1 = data.primaryColors?.[0] ?? accent
  const c2 = data.primaryColors?.[1] ?? '#0a0a0a'
  const initials = (data.companyName || 'B').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

  const [heroImg, setHeroImg]     = React.useState<string | null>(null)
  const [squareImg, setSquareImg] = React.useState<string | null>(null)
  const [storyImg, setStoryImg]   = React.useState<string | null>(null)
  const [imgLoading, setImgLoading] = React.useState(true)

  const webBannerRef  = React.useRef<HTMLDivElement>(null)
  const heroBannerRef = React.useRef<HTMLDivElement>(null)
  const squareRef     = React.useRef<HTMLDivElement>(null)
  const storyRef      = React.useRef<HTMLDivElement>(null)
  const brandCardRef  = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const q = `${data.industry || 'business'} ${data.companyName || ''}`.trim()
    setImgLoading(true)
    Promise.all([
      fetch(`/api/image?query=${encodeURIComponent(q + ' office professional')}`).then(r=>r.json()),
      fetch(`/api/image?query=${encodeURIComponent(q + ' lifestyle brand')}`).then(r=>r.json()),
      fetch(`/api/image?query=${encodeURIComponent(q + ' product luxury')}`).then(r=>r.json()),
    ]).then(([h,s,st]) => {
      setHeroImg(h.url ?? null); setSquareImg(s.url ?? null); setStoryImg(st.url ?? null)
    }).catch(()=>{}).finally(()=>setImgLoading(false))
  }, [data.industry, data.companyName])

  return (
    <div>
      <DownloadBar title="Hero Banner" refEl={heroBannerRef} accent={c1}
        extraButtons={
          <>
            <button className="biz-download-btn" onClick={()=>downloadElementAsPng(webBannerRef.current!,'web-banner-728x90.png')}>Web 728×90</button>
            <button className="biz-download-btn" onClick={()=>downloadElementAsPng(squareRef.current!,'ig-square.png')}>IG Square</button>
            <button className="biz-download-btn" onClick={()=>downloadElementAsPng(storyRef.current!,'story-9x16.png')}>Story</button>
            <button className="biz-download-btn" onClick={()=>downloadElementAsPng(brandCardRef.current!,'brand-card.png')}>Brand Card</button>
          </>
        }
      />
      <div style={{ padding: 'clamp(16px,4vw,28px)', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Web banner 728×90 */}
        <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: -8 }}>Web Banner — 728×90</div>
        <div ref={webBannerRef} style={{ background: c2, border: `1px solid ${c1}30`, borderRadius: 3, overflow: 'hidden', height: 72, display: 'flex', alignItems: 'center', position: 'relative' }}>
          {heroImg && <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', backgroundImage: `url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
          <div style={{ position: 'absolute', inset: 0, background: heroImg ? `linear-gradient(90deg, ${c2} 45%, ${c2}90 65%, transparent 100%)` : `linear-gradient(90deg, ${c2}, ${c2}90)` }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: c1, zIndex: 2 }} />
          <div style={{ marginLeft: 20, marginRight: 12, flexShrink: 0, width: 36, height: 36, borderRadius: 6, background: c1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: '#000' }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0, zIndex: 2 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(12px,2vw,16px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.bannerHeadline}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.bannerSubheadline}</div>
          </div>
          <div style={{ margin: '0 12px', flexShrink: 0, padding: '7px 14px', background: c1, color: '#000', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2, whiteSpace: 'nowrap', zIndex: 2 }}>{data.bannerCta}</div>
        </div>

        {/* Hero 16:5 */}
        <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: -8 }}>Hero Banner — 1200×375</div>
        <div ref={heroBannerRef} style={{ background: c2, border: `1px solid ${c1}25`, borderRadius: 6, overflow: 'hidden', aspectRatio: '16 / 5', display: 'flex', alignItems: 'center', padding: '0 clamp(16px,4vw,40px)', position: 'relative', minHeight: 100 }}>
          {heroImg && <img src={heroImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(100deg, ${c2}F0 0%, ${c2}CC 40%, ${c2}60 70%, transparent 100%)` }} />
          <div style={{ position: 'absolute', inset: 0, background: `${c1}14` }} />
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c1, zIndex: 2 }} />
          <div style={{ flex: 1, zIndex: 2 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.2em', color: c1, textTransform: 'uppercase', marginBottom: 6 }}>{data.companyName} · {data.industry}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(15px,2.5vw,26px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 6 }}>{data.bannerHeadline}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 14, lineHeight: 1.5, maxWidth: 480 }}>{data.bannerSubheadline}</div>
            <div style={{ display: 'inline-block', padding: '7px 18px', background: c1, color: '#000', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2 }}>{data.bannerCta} →</div>
          </div>
          {imgLoading && <div style={{ position: 'absolute', inset: 0, background: c2, zIndex: 1 }} />}
        </div>

        {/* Social banners — responsive 3→2→1 col */}
        <div className="biz-banner-socials">
          {/* IG Square */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>IG Square</div>
            <div ref={squareRef} style={{ background: c2, borderRadius: 6, aspectRatio: '1', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 14, position: 'relative', overflow: 'hidden' }}>
              {squareImg && <img src={squareImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${c2}F2 0%, ${c2}99 40%, ${c2}30 70%, transparent 100%)` }} />
              <div style={{ position: 'absolute', top: 12, left: 12, width: 24, height: 24, background: c1, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 10, fontWeight: 700, color: '#000' }}>{initials}</span>
              </div>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(12px,3vw,14px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>{data.bannerHeadline}</div>
                <div style={{ padding: '4px 10px', background: c1, color: '#000', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2, display: 'inline-block' }}>{data.bannerCta}</div>
              </div>
            </div>
          </div>

          {/* Story 9:16 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Story 9:16</div>
            <div ref={storyRef} style={{ background: c2, borderRadius: 6, aspectRatio: '9 / 16', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '14px 12px', position: 'relative', overflow: 'hidden', maxHeight: 280 }}>
              {storyImg && <img src={storyImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${c2}CC 0%, ${c2}40 40%, ${c2}CC 75%, ${c2}F5 100%)` }} />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 18, height: 18, background: c1, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 8, fontWeight: 700, color: '#000' }}>{initials[0]}</span>
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>{data.companyName}</span>
                </div>
              </div>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>{data.bannerHeadline}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: 8 }}>{data.bannerSubheadline}</div>
                <div style={{ padding: '5px 12px', background: c1, color: '#000', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2, display: 'inline-block' }}>{data.bannerCta}</div>
              </div>
            </div>
          </div>

          {/* Brand card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Brand Card</div>
            <div ref={brandCardRef} style={{ background: c1, borderRadius: 6, aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.15)' }} />
              <div style={{ position: 'absolute', top: -20, left: -20, width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,0,0,0.1)' }} />
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(12px,3vw,15px)', fontWeight: 700, color: '#000', lineHeight: 1.2, marginBottom: 6 }}>{data.tagline}</div>
                <div style={{ width: 24, height: 2, background: 'rgba(0,0,0,0.3)', margin: '0 auto 6px' }} />
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.55)', textTransform: 'uppercase' }}>{data.industry}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Visual Direction</div>
          <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{data.bannerTheme}</div>
        </div>
      </div>
    </div>
  )
}

// ── Flyer Preview ──────────────────────────────────────────────────────────────
function BizFlyerPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const c1 = data.primaryColors?.[0] ?? accent
  const c2 = data.primaryColors?.[1] ?? '#111'
  const c3 = data.primaryColors?.[2] ?? '#333'
  const initials = (data.companyName || 'B').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

  const [headerImg, setHeaderImg] = React.useState<string | null>(null)
  const [emailImg,  setEmailImg]  = React.useState<string | null>(null)
  const [imgLoading, setImgLoading] = React.useState(true)

  const flyerRef = React.useRef<HTMLDivElement>(null)
  const emailRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const base = `${data.industry || 'business'} ${data.flyerTitle || ''}`.trim()
    setImgLoading(true)
    Promise.all([
      fetch(`/api/image?query=${encodeURIComponent(base + ' promotional')}`).then(r=>r.json()),
      fetch(`/api/image?query=${encodeURIComponent(base + ' product service')}`).then(r=>r.json()),
    ]).then(([h,e]) => { setHeaderImg(h.url??null); setEmailImg(e.url??null) }).catch(()=>{}).finally(()=>setImgLoading(false))
  }, [data.industry, data.flyerTitle])

  return (
    <div>
      <DownloadBar title="Flyer A5" refEl={flyerRef} accent={c1}
        extraButtons={<button className="biz-download-btn" onClick={()=>downloadElementAsPng(emailRef.current!,'flyer-email.png')}>Email PNG</button>}
      />
      <div style={{ padding: 'clamp(16px,4vw,28px)', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* A5 flyer */}
        <div ref={flyerRef} style={{ background: '#fff', border: `1px solid ${c1}40`, borderRadius: 6, overflow: 'hidden', aspectRatio: '1 / 1.414', maxWidth: 380, margin: '0 auto', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: c2, padding: 0, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <svg width="100%" viewBox="0 0 380 160" preserveAspectRatio="xMidYMid slice" fill="none" style={{ display: 'block' }}>
              <rect width="380" height="160" fill={c2} />
              <circle cx="300" cy="-10" r="130" fill={c1} opacity="0.18" />
              <circle cx="300" cy="-10" r="80" fill={c1} opacity="0.2" />
              <polygon points="0,160 200,40 380,160" fill={c1} opacity="0.07" />
              <polygon points="0,160 100,80 220,160" fill={c1} opacity="0.07" />
              <rect x="0" y="0" width="5" height="160" fill={c1} />
              {[0,1,2,3].map(r=>[0,1,2].map(cc=>(
                <circle key={`${r}-${cc}`} cx={300+cc*20} cy={20+r*20} r="2.5" fill={c1} opacity="0.4" />
              )))}
              <rect x="24" y="20" width="40" height="40" rx="8" fill={c1} />
              <text x="44" y="46" textAnchor="middle" fontFamily="'Playfair Display', serif" fontSize="18" fontWeight="700" fill="#000">{initials}</text>
              <text x="72" y="34" fontFamily="'DM Mono', monospace" fontSize="8" letterSpacing="3" fill={c1} opacity="0.9">{data.companyName.toUpperCase()}</text>
              <text x="72" y="48" fontFamily="'DM Mono', monospace" fontSize="7" letterSpacing="2" fill="rgba(255,255,255,0.5)">{data.industry?.toUpperCase()}</text>
              <text x="24" y="88" fontFamily="'Playfair Display', serif" fontSize="22" fontWeight="700" fill="#FFFFFF">{data.flyerTitle}</text>
              <text x="24" y="112" fontFamily="'DM Sans', sans-serif" fontSize="11" fill="rgba(255,255,255,0.65)">{data.flyerSubtitle}</text>
              <rect x="0" y="155" width="380" height="5" fill={c1} />
            </svg>
            {headerImg && <img src={headerImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', zIndex: -1 }} />}
          </div>
          <div style={{ flex: 1, padding: '20px 24px', background: '#fff' }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: '#333', lineHeight: 1.75, marginBottom: 18 }}>{data.flyerBody}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {(data.flyerHighlights || []).map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, borderLeft: `3px solid ${i===0?c1:i===1?c2:c3}`, paddingLeft: 12 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#444', lineHeight: 1.5 }}>{h}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {[c1,c2].map((col,i)=>(
                <div key={i} style={{ flex: 1, minWidth: 80, padding: '10px 12px', background: `${col}12`, border: `1px solid ${col}30`, borderRadius: 3, textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: col }}>✓</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: '#555', marginTop: 2 }}>{i===0?'Quality assured':'Trusted brand'}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: c1, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, fontWeight: 600, color: '#000', lineHeight: 1.2 }}>{data.tagline}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.1em', color: 'rgba(0,0,0,0.55)', textTransform: 'uppercase', marginTop: 2 }}>{data.companyName}</div>
            </div>
            <div style={{ background: '#000', color: c1, padding: '6px 14px', borderRadius: 2, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{data.flyerCta} →</div>
          </div>
        </div>

        {/* Email version */}
        <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Email / Digital version</div>
        <div ref={emailRef} style={{ background: '#fff', border: `1px solid ${c1}30`, borderRadius: 6, overflow: 'hidden', display: 'flex', flexWrap: 'wrap', maxHeight: 160 }}>
          <div style={{ width: 120, flexShrink: 0, position: 'relative', overflow: 'hidden', background: c2, minHeight: 120 }}>
            {emailImg && <img src={emailImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${c2}D0, ${c2}80)` }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 }}>
              <div style={{ width: 40, height: 40, background: c1, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#000' }}>{initials}</span>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.12em', color: c1, textTransform: 'uppercase', textAlign: 'center' }}>{data.companyName}</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 160 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(13px,3vw,16px)', fontWeight: 700, color: '#1A1A1A', lineHeight: 1.2, marginBottom: 6 }}>{data.flyerTitle}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#555', lineHeight: 1.6 }}>{data.flyerBody?.substring(0,100)}…</div>
            </div>
            <div style={{ display: 'inline-block', padding: '5px 14px', background: c1, color: '#000', fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2, marginTop: 8 }}>{data.flyerCta} →</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Poster Preview ─────────────────────────────────────────────────────────────
function BizPosterPreview({ data, accent }: { data: BusinessOutput; accent: string }) {
  const c1 = data.primaryColors?.[0] ?? accent
  const c2 = data.primaryColors?.[1] ?? '#050505'
  const c3 = data.primaryColors?.[2] ?? '#1a1a1a'
  const initials = (data.companyName || 'B').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

  const [portraitImg,  setPortraitImg]  = React.useState<string | null>(null)
  const [landscapeImg, setLandscapeImg] = React.useState<string | null>(null)
  const [imgLoading,   setImgLoading]   = React.useState(true)

  const portraitRef  = React.useRef<HTMLDivElement>(null)
  const landscapeRef = React.useRef<HTMLDivElement>(null)
  const typogRef     = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const base = `${data.industry || 'business'} ${data.posterHeadline || ''}`.trim()
    setImgLoading(true)
    Promise.all([
      fetch(`/api/image?query=${encodeURIComponent(base + ' atmosphere')}`).then(r=>r.json()),
      fetch(`/api/image?query=${encodeURIComponent(base + ' wide cinematic')}`).then(r=>r.json()),
    ]).then(([p,l])=>{ setPortraitImg(p.url??null); setLandscapeImg(l.url??null) }).catch(()=>{}).finally(()=>setImgLoading(false))
  }, [data.industry, data.posterHeadline])

  return (
    <div>
      <DownloadBar title="Portrait Poster" refEl={portraitRef} accent={c1}
        extraButtons={
          <>
            <button className="biz-download-btn" onClick={()=>downloadElementAsPng(landscapeRef.current!,'poster-landscape.png')}>Landscape PNG</button>
            <button className="biz-download-btn" onClick={()=>downloadElementAsPng(typogRef.current!,'poster-typographic.png')}>Typographic PNG</button>
          </>
        }
      />
      <div style={{ padding: 'clamp(16px,4vw,28px)', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Responsive poster row */}
        <div className="biz-poster-row">
          {/* Portrait poster */}
          <div className="biz-poster-main">
            <div ref={portraitRef} style={{ background: c2, borderRadius: 6, overflow: 'hidden', aspectRatio: '2 / 3', display: 'flex', flexDirection: 'column', position: 'relative', width: '100%' }}>
              {portraitImg && <img src={portraitImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${c2}E0 0%, ${c2}60 30%, ${c2}40 55%, ${c2}CC 80%, ${c2}F0 100%)` }} />
              <div style={{ position: 'absolute', inset: 0, background: `${c1}18` }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c1, zIndex: 2 }} />
              {imgLoading && <div style={{ position: 'absolute', inset: 0, background: c2, zIndex: 3 }} />}
              <div style={{ padding: '18px 18px 0', zIndex: 4, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, background: c1, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 11, fontWeight: 700, color: '#000' }}>{initials}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{data.companyName}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 6, letterSpacing: '0.1em', color: c1, textTransform: 'uppercase', opacity: 0.9 }}>{data.industry}</div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '20px 18px', zIndex: 4, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 2, background: c1 }} />
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.14em', color: c1, textTransform: 'uppercase' }}>{data.industry}</div>
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(18px,4vw,22px)', fontWeight: 700, color: '#fff', lineHeight: 1.05, marginBottom: 10, wordBreak: 'break-word' }}>{data.posterHeadline}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, marginBottom: 16 }}>{data.posterTagline}</div>
                <div style={{ padding: '7px 12px', border: `1px solid ${c1}`, borderRadius: 2, display: 'inline-block', background: `${c1}20`, backdropFilter: 'blur(4px)' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em', color: c1, textTransform: 'uppercase' }}>{data.posterCallout}</div>
                </div>
              </div>
              <div style={{ background: c1, padding: '8px 18px', zIndex: 4, position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.14em', color: '#000', textTransform: 'uppercase', opacity: 0.7 }}>{data.industry}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.1em', color: '#000', opacity: 0.5 }}>{new Date().getFullYear()}</div>
              </div>
            </div>
          </div>

          {/* Secondary variants */}
          <div className="biz-poster-secondary" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Landscape</div>
            <div ref={landscapeRef} style={{ background: c2, borderRadius: 6, overflow: 'hidden', aspectRatio: '4 / 3', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              {landscapeImg && <img src={landscapeImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />}
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${c2}40 0%, ${c2}CC 60%, ${c2}F2 100%)` }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: c1, zIndex: 2 }} />
              <div style={{ position: 'relative', zIndex: 2, padding: '12px 14px' }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(13px,2.5vw,15px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, marginBottom: 4 }}>{data.posterHeadline}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>{data.posterTagline}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 18, height: 18, background: c1, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 8, fontWeight: 700, color: '#000' }}>{initials}</span>
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.12em', color: c1, textTransform: 'uppercase' }}>{data.companyName}</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Typographic</div>
            <div ref={typogRef} style={{ background: c1, borderRadius: 6, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -16, right: -16, width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)' }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, letterSpacing: '0.18em', color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', marginBottom: 6 }}>{data.industry?.toUpperCase()} · {data.companyName?.toUpperCase()}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(15px,3vw,18px)', fontWeight: 700, color: '#000', lineHeight: 1.1, marginBottom: 8 }}>{data.posterHeadline}</div>
              <div style={{ width: 20, height: 2, background: 'rgba(0,0,0,0.4)', marginBottom: 6 }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, letterSpacing: '0.1em', color: 'rgba(0,0,0,0.6)', textTransform: 'uppercase' }}>{data.posterCallout}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 2 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 5 }}>Art Direction</div>
          <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>{data.posterVisualDirection}</div>
        </div>
      </div>
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



// ── Portfolio Website Preview ──────────────────────────────────────────────────
// ── Portfolio Website Preview ──────────────────────────────────────────────────
function BizWebsitePreview({ data, accent, genId }: { data: BusinessOutput; accent: string; genId: string | null }) {
  const c1 = data.primaryColors?.[0] ?? accent
  const c2 = data.primaryColors?.[1] ?? '#0a0a0a'
  const initials = (data.companyName || 'B').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const [publishing, setPublishing] = React.useState(false)
  const [publishedUrl, setPublishedUrl] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [pubErr, setPubErr] = React.useState('')

  // Check if already published for this user
  React.useEffect(() => {
    fetch('/api/portfolio/publish')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.url) setPublishedUrl(d.url) })
      .catch(() => {})
  }, [])

  async function handlePublish() {
    if (!genId) return
    setPublishing(true); setPubErr('')
    try {
      const res = await fetch('/api/portfolio/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: genId, websiteTheme: 'the-manifesto' }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Publish failed')
      if (d.url) setPublishedUrl(d.url)
    } catch (e) {
      setPubErr(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  function copyUrl() {
    if (!publishedUrl) return
    navigator.clipboard.writeText(publishedUrl).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2200)
    })
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
    padding: '8px 18px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
    fontFamily: "'DM Mono', monospace", borderRadius: 'var(--radius)', border: 'none',
    transition: 'all 0.15s',
  }

  return (
    <div style={{ padding: 'clamp(16px,4vw,28px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace" }}>Portfolio Website</div>
        {publishedUrl && (
          <a href={publishedUrl} target="_blank" rel="noreferrer" style={{ padding: '5px 12px', background: `${accent}18`, border: `1px solid ${accent}`, color: accent, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", textDecoration: 'none', borderRadius: 'var(--radius)' }}>
            View Live ↗
          </a>
        )}
      </div>

      {/* Mock website hero */}
      <div style={{ border: `1px solid ${accent}30`, borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ background: c2, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${accent}20` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 4, background: c1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: "'DM Mono', monospace" }}>{initials}</div>
            <span style={{ fontSize: 11, color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{data.companyName || 'Your Company'}</span>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {['About', 'Services', 'Contact'].map(n => (
              <span key={n} style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>{n}</span>
            ))}
          </div>
        </div>
        <div style={{ background: `linear-gradient(135deg, ${c2} 0%, #0d0d0d 100%)`, padding: '36px 24px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>{data.industry || 'Brand'}</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(16px,3vw,22px)', color: 'var(--cream)', lineHeight: 1.25, marginBottom: 8, fontWeight: 400 }}>{data.companyName || 'Your Company Name'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 340, margin: '0 auto 18px', fontFamily: "'DM Sans', sans-serif" }}>{data.tagline || 'Your brand tagline goes here'}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <div style={{ padding: '7px 18px', background: c1, color: '#fff', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2 }}>Get Started</div>
            <div style={{ padding: '7px 18px', border: `1px solid ${c1}`, color: c1, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2 }}>Learn More</div>
          </div>
        </div>
        {data.brandStory && (
          <div style={{ background: 'var(--surface)', padding: '20px', borderTop: `1px solid ${accent}15` }}>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: c1, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Our Story</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{data.brandStory.slice(0, 180)}{data.brandStory.length > 180 ? '…' : ''}</div>
          </div>
        )}
      </div>

      {/* Publish / manage row */}
      <div style={{ background: 'var(--surface)', border: `1px solid ${accent}25`, borderRadius: 8, padding: 20 }}>
        {publishedUrl ? (
          <>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2E7D52', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>✓ Live at</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <code style={{ flex: 1, fontSize: 11, color: 'var(--cream)', background: 'var(--surface2)', padding: '6px 10px', borderRadius: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{publishedUrl}</code>
              <button onClick={copyUrl} style={{ ...btnBase, padding: '6px 12px', background: `${accent}15`, border: `1px solid ${accent}40`, color: accent }}>{copied ? '✓ Copied' : 'Copy'}</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={publishedUrl} target="_blank" rel="noreferrer" style={{ ...btnBase, background: `${accent}18`, border: `1px solid ${accent}`, color: accent, textDecoration: 'none' }}>Open Site ↗</a>
              <a href={`/portfolio?gen=${genId}`} style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', textDecoration: 'none' }}>Edit & Customise</a>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>⬡ Portfolio Website</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>
              Publish a live branded website with your company story, brand voice, and identity — shareable with a public link.
            </div>
            {pubErr && <div style={{ fontSize: 11, color: '#e05', marginBottom: 10 }}>{pubErr}</div>}
            {genId ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handlePublish} disabled={publishing} style={{ ...btnBase, background: publishing ? 'transparent' : `${accent}15`, border: `1px solid ${accent}`, color: accent, opacity: publishing ? 0.6 : 1 }}>
                  {publishing ? '⏳ Publishing…' : '⬡ Publish Live Website'}
                </button>
                <a href={`/portfolio?gen=${genId}`} style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', textDecoration: 'none' }}>Customise First</a>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>Generate your brand first to publish a website.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Presentation Preview — embeds live SlideEditor ─────────────────────────────
function BizPresentationPreview({ data, accent, genId }: { data: BusinessOutput; accent: string; genId: string | null }) {
  const seedSlides: SlideEditorProps['presentationSlides'] = [
    {
      layoutType: 'cover',
      heading: data.companyName || 'Company Name',
      body: data.tagline || '',
      imageQuery: data.industry || 'business brand',
    },
    {
      layoutType: 'content',
      heading: 'Our Story',
      body: data.brandStory || '',
      imageQuery: `${data.industry || 'brand'} story`,
    },
    {
      layoutType: 'content',
      heading: 'Brand Voice',
      body: data.brandVoice || '',
    },
    ...(data.logoConceptName ? [{
      layoutType: 'big-stat' as const,
      heading: data.logoConceptName,
      body: data.logoConceptDescription || '',
    }] : []),
    {
      layoutType: 'bullets',
      heading: 'Why Choose Us',
      bullets: (data.copyHeadlines || []).slice(0, 4),
    },
    {
      layoutType: 'cover',
      heading: "Let's Build Together",
      body: data.tagline || '',
    },
  ]

  return (
    <div style={{ height: '100%', minHeight: 640 }}>
      <SlideEditor
        generationId={genId ?? undefined}
        accentColor={accent}
        presentationHook={data.companyName ? `${data.companyName}: ${data.tagline || ''}` : undefined}
        presentationSlides={seedSlides}
      />
    </div>
  )
}


// ── BannerOutputPreview — renders GPT-4o banner design specs ─────────────────
function BannerOutputPreview({ data, accent, aiModel }: { data: Record<string, unknown>; accent: string; aiModel: string }) {
  const banners = (data.banners || {}) as Record<string, {
    headline?: string; subheadline?: string; cta?: string
    colorScheme?: { background?: string; primary?: string; accent?: string; text?: string }
    layout?: string; visualStyle?: string; imageDirection?: string
    dimensions?: { width?: number; height?: number }
  }>
  const brandVoice = (data.brandVoice || {}) as { tagline?: string; tone?: string; keywords?: string[] }
  const campaign   = (data.campaignStrategy || {}) as { hook?: string; differentiator?: string; animationSuggestion?: string }

  const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" }
  const isGPT = aiModel === 'gpt-4o'

  return (
    <div style={{ padding: 'clamp(16px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* AI engine badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ padding: '4px 12px', background: isGPT ? '#4A90D910' : '#C9A84C10', border: `1px solid ${isGPT ? '#4A90D940' : '#C9A84C40'}`, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isGPT ? '#4A90D9' : '#C9A84C', display: 'block', animation: 'pulse 2s infinite' }} />
          <span style={{ ...mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: isGPT ? '#4A90D9' : '#C9A84C' }}>
            {isGPT ? 'Generated by GPT-4o' : 'Generated by Claude (fallback)'}
          </span>
        </div>
      </div>

      {/* Banner format previews */}
      {Object.entries(banners).map(([formatKey, b]) => {
        const bg  = b.colorScheme?.background || '#0a0a0a'
        const pri = b.colorScheme?.primary    || accent
        const ac  = b.colorScheme?.accent     || '#fff'
        const tx  = b.colorScheme?.text       || '#fff'
        const w   = b.dimensions?.width  || 1200
        const h   = b.dimensions?.height || 628
        const isVert = h > w
        const displayH = isVert ? 200 : 80
        const displayW = isVert ? 120 : '100%'

        return (
          <div key={formatKey}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                {formatKey.charAt(0).toUpperCase() + formatKey.slice(1)} · {w}×{h}
              </div>
              <div style={{ ...mono, fontSize: 8, color: 'var(--muted2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{b.layout}</div>
            </div>

            {/* Live preview mock */}
            <div style={{ background: bg, borderRadius: 6, overflow: 'hidden', border: `1px solid ${pri}30`, display: 'flex', alignItems: isVert ? 'flex-end' : 'center', justifyContent: isVert ? 'center' : 'flex-start', height: displayH, width: displayW, position: 'relative', gap: 16, padding: isVert ? '16px 12px' : '0 16px' }}>
              {/* accent bar */}
              {!isVert && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: pri }} />}
              {isVert  && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: pri }} />}
              <div style={{ marginLeft: isVert ? 0 : 12 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isVert ? 14 : 16, color: tx, lineHeight: 1.2, marginBottom: 4, fontWeight: 600 }}>
                  {b.headline || 'Your Headline Here'}
                </div>
                {!isVert && b.subheadline && (
                  <div style={{ fontSize: 10, color: tx, opacity: 0.7, lineHeight: 1.4, maxWidth: 340 }}>{b.subheadline}</div>
                )}
              </div>
              {b.cta && (
                <div style={{ marginLeft: isVert ? 0 : 'auto', marginTop: isVert ? 10 : 0, padding: isVert ? '6px 14px' : '5px 12px', background: ac, color: bg, fontSize: 9, fontWeight: 700, borderRadius: 3, whiteSpace: 'nowrap', letterSpacing: '0.08em', flexShrink: 0 }}>
                  {b.cta}
                </div>
              )}
            </div>

            {/* Design spec */}
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {b.visualStyle && (
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                  <span style={{ ...mono, fontSize: 9, color: 'var(--muted2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 8 }}>Style</span>
                  {b.visualStyle}
                </div>
              )}
              {b.imageDirection && (
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
                  <span style={{ ...mono, fontSize: 9, color: 'var(--muted2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 8 }}>Imagery</span>
                  {b.imageDirection}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                {Object.entries(b.colorScheme || {}).map(([k, v]) => (
                  <div key={k} title={k} style={{ width: 20, height: 20, borderRadius: 3, background: v as string, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                ))}
              </div>
            </div>
          </div>
        )
      })}

      {/* Brand Voice */}
      {(brandVoice.tagline || brandVoice.keywords?.length) && (
        <div style={{ padding: '14px 16px', background: `${accent}08`, border: `1px solid ${accent}25`, borderRadius: 'var(--radius)' }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, marginBottom: 10 }}>Brand Voice</div>
          {brandVoice.tagline && (
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--cream)', fontStyle: 'italic', marginBottom: 8 }}>"{brandVoice.tagline}"</div>
          )}
          {brandVoice.keywords && brandVoice.keywords.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {brandVoice.keywords.map((k: string) => (
                <span key={k} style={{ padding: '3px 10px', border: `1px solid ${accent}40`, color: accent, fontSize: 10, ...mono, letterSpacing: '0.08em', borderRadius: 'var(--radius)' }}>{k}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Campaign Strategy */}
      {campaign.hook && (
        <div style={{ padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Campaign Strategy</div>
          <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, marginBottom: 8 }}><span style={{ color: accent }}>Hook: </span>{campaign.hook}</div>
          {campaign.differentiator && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 8 }}><span style={{ color: 'var(--text)' }}>Edge: </span>{campaign.differentiator}</div>}
          {campaign.animationSuggestion && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}><span style={{ color: 'var(--text)' }}>Animation: </span>{campaign.animationSuggestion}</div>}
        </div>
      )}
    </div>
  )
}

// ── BusinessGenerateStudio — fully self-contained ──────────────────────────
function BusinessGenerateStudio({ onSwitchMode: _onSwitchMode }: { onSwitchMode: () => void }) {
  const searchParams = useSearchParams()
  const [formTab, setFormTab] = React.useState<BizFormTab>('generate')
  const [pvTab, setPvTab] = React.useState<BizTab>('logo')
  const [mobilePanel, setMobilePanel] = React.useState<'form' | 'preview'>('form')

  // Form state
  const [companyName, setCompanyName] = React.useState('')
  const [industry, setIndustry] = React.useState('')
  const [tagline, setTagline] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [audience, setAudience] = React.useState('')
  const [tone, setTone] = React.useState<BizTone>('professional')
  const [outputTypes, setOutputTypes] = React.useState<BizTab[]>(['logo', 'flyer', 'poster', 'copy', 'website', 'presentation'])

  // Banner Studio — separate ChatGPT-powered generation
  const [bannerCampaignGoal, setBannerCampaignGoal] = React.useState('')
  const [bannerPlatforms, setBannerPlatforms] = React.useState<string[]>(['Instagram', 'LinkedIn'])
  const [bannerLoading, setBannerLoading] = React.useState(false)
  const [bannerOutput, setBannerOutput] = React.useState<Record<string, unknown> | null>(null)
  const [bannerAiModel, setBannerAiModel] = React.useState<string>('gpt-4o')
  const [bannerGenStep, setBannerGenStep] = React.useState(0)

  // Generation state
  const [loading, setLoading] = React.useState(false)
  const [loadingHistory, setLoadingHistory] = React.useState(false)
  const [genStep, setGenStep] = React.useState(0)
  const [output, setOutput] = React.useState<BusinessOutput | null>(null)
  const [bizGenId, setBizGenId] = React.useState<string | null>(null)
  const [toast, setToast] = React.useState('')
  const [showToast, setShowToast] = React.useState(false)
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const accent = '#C9A84C'

  // ── Load from URL: ?gen=<id> (preview/edit) or ?from=<id> (remix/prefill) ─
  React.useEffect(() => {
    const genId  = searchParams.get('gen')   // load output + inputs (preview mode)
    const fromId = searchParams.get('from')  // load inputs only (remix mode)
    const targetId = genId || fromId
    if (!targetId) return

    setLoadingHistory(true)
    fetch(`/api/generate/load-business?id=${targetId}`)
      .then(r => r.ok ? r.json() : null)
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
          if (Array.isArray(i.outputTypes)) setOutputTypes(i.outputTypes as BizTab[])
        }
        // If it's a ?gen= (preview) load, also restore output
        if (genId && data.outputData) {
          setOutput(data.outputData as BusinessOutput)
          setBizGenId(data.id)
          setGenStep(4)
          setMobilePanel('preview')
          // Set preview tab to first available asset type
          if (data.inputData) {
            const types = (data.inputData as Record<string, unknown>).outputTypes
            if (Array.isArray(types) && types.length > 0) setPvTab(types[0] as BizTab)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function showMsg(msg: string) {
    setToast(msg); setShowToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setShowToast(false), 3200)
  }

  function toggleType(t: BizTab) {
    setOutputTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function toggleBannerPlatform(p: string) {
    setBannerPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleGenerateBanner() {
    if (!companyName.trim()) { showMsg('Company name is required — fill it in the Generate tab first'); return }
    setBannerLoading(true); setBannerOutput(null); setBannerGenStep(0)
    const stepInterval = setInterval(() => setBannerGenStep(s => Math.min(s + 1, 3)), 900)
    try {
      const res = await fetch('/api/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName, industry, tagline, description, audience, tone,
          campaignGoal: bannerCampaignGoal,
          platforms: bannerPlatforms,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Banner generation failed')
      clearInterval(stepInterval); setBannerGenStep(4)
      setBannerOutput(data.output)
      setBannerAiModel(data.aiModel || 'gpt-4o')
      setMobilePanel('preview')
      setPvTab('banner')
      showMsg(data.usedFallback ? 'Banners generated (via Claude fallback)' : 'Banners generated by GPT-4o ✦')
    } catch (err) {
      clearInterval(stepInterval)
      showMsg(err instanceof Error ? err.message : 'Banner generation failed')
    } finally {
      setBannerLoading(false)
    }
  }

  async function handleGenerate() {
    if (!companyName.trim()) { showMsg('Company name is required'); return }
    setLoading(true); setOutput(null); setGenStep(0)
    const stepInterval = setInterval(() => setGenStep(s => Math.min(s + 1, 3)), 800)
    try {
      const res = await fetch('/api/generate-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, industry, tagline, description, audience, tone, outputTypes: JSON.stringify(outputTypes) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      clearInterval(stepInterval)
      setGenStep(4)
      setOutput(data.output)
      if (data.generationId) setBizGenId(data.generationId)
      setMobilePanel('preview')
      showMsg('Business assets generated!')
    } catch (err) {
      clearInterval(stepInterval)
      showMsg(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }

  if (loadingHistory) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '1px solid var(--border2)', borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Loading generation…</div>
      </div>
    )
  }

  return (
    <div className="generate-layout">

      {/* ── BUSINESS FORM SIDE ── */}
      <div className={`generate-form-side${mobilePanel === 'preview' ? ' mobile-hidden' : ''}`}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
          <div style={{ width: 20, height: 1, background: accent }} />Brand Growth Studio
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, lineHeight: 1.15, color: 'var(--cream)', marginBottom: 10 }}>
          Grow your<br /><em style={{ color: accent, fontStyle: 'italic' }}>brand identity</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, fontWeight: 300, marginBottom: 36, maxWidth: 440 }}>
          Logo concepts, flyers, posters, marketing copy — plus dedicated AI banner studio powered by GPT-4o.
        </p>

        {/* Form tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {(['generate', 'details', 'style', 'banner-studio'] as const).map(t => (
            <button key={t} onClick={() => setFormTab(t)} style={{ padding: '10px 16px 9px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: formTab === t ? (t === 'banner-studio' ? '#4A90D9' : accent) : 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none', borderBottom: formTab === t ? `2px solid ${t === 'banner-studio' ? '#4A90D9' : accent}` : '2px solid transparent', marginBottom: -1, fontFamily: "'DM Mono', monospace", transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {t === 'banner-studio' ? '▭ Banners' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* GENERATE TAB */}
        {formTab === 'generate' && (
          <>
            {/* Output type toggles */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Output Assets <span style={{ color: 'var(--muted2)', fontSize: 9 }}>(via Claude AI)</span></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(['logo', 'flyer', 'poster', 'copy', 'website', 'presentation'] as BizTab[]).map(type => (
                  <div key={type} onClick={() => toggleType(type)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', border: `1px solid ${outputTypes.includes(type) ? accent : 'var(--border2)'}`, background: outputTypes.includes(type) ? 'var(--gold-dim)' : 'transparent', color: outputTypes.includes(type) ? accent : 'var(--muted)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 'var(--radius)', userSelect: 'none', transition: 'all 0.15s' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{BIZ_TAB_META[type].icon}</span>
                    {BIZ_TAB_META[type].label}
                  </div>
                ))}
                <div onClick={() => setFormTab('banner-studio')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', border: '1px solid #4A90D940', background: '#4A90D910', color: '#4A90D9', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 'var(--radius)', userSelect: 'none', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: 10 }}>▭</span>Banners (GPT-4o)
                </div>
              </div>
            </div>
            {/* Company name prompt */}
            <div style={{ background: 'var(--surface)', border: `1px solid ${accent}45`, borderRadius: 'var(--radius)', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 10px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Company Name *</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2E7D52', fontFamily: "'DM Mono', monospace" }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2E7D52', animation: 'pulse 2s infinite', display: 'block' }} />Business Mode
                </span>
              </div>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Petal & Root (Ayurvedic skincare D2C), Konnekt (HR tech SaaS), Ember & Ash (fine dining, BKC Mumbai)" style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 300, padding: '18px 16px 14px', caretColor: accent }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 16px 12px' }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{companyName.length}/80</span>
              </div>
            </div>
          </>
        )}

        {/* DETAILS TAB */}
        {formTab === 'details' && (
          <div>
            <div className="form-grid-2">
              {[
                { label: 'Industry', val: industry, set: setIndustry, ph: 'e.g. D2C Skincare, HR Tech SaaS, Fine Dining, EdTech' },
                { label: 'Target Audience', val: audience, set: setAudience, ph: 'e.g. Millennial women 24–35 in Tier-1 cities, ingredient-conscious' },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>{f.label}</label>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Tagline</label>
              <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Rooted in ritual. / Where AI meets human onboarding. / Modern India on a plate." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Brand Description <span style={{ color: 'var(--muted2)' }}>{description.length}/400</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 400))} rows={5} placeholder="e.g. We make Ayurvedic skincare for urban millennial women. Our bestseller is a turmeric face serum. Founded 2022, ₹4Cr ARR, stocked in 80 salons across Mumbai and Delhi. Tone: warm luxury — think Tatcha meets India. We want a logo and banners for our upcoming Nykaa launch campaign." style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
          </div>
        )}

        {/* STYLE TAB */}
        {formTab === 'style' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([
              { val: 'bold', label: 'Bold & Disruptive', desc: 'High contrast, commanding, category-defining' },
              { val: 'professional', label: 'Professional', desc: 'Credible, structured, trust-building' },
              { val: 'playful', label: 'Playful & Friendly', desc: 'Warm, approachable, memorable personality' },
              { val: 'luxury', label: 'Luxury & Premium', desc: 'Refined, aspirational, exquisite attention to detail' },
            ] as { val: BizTone; label: string; desc: string }[]).map(t => (
              <div key={t.val} onClick={() => setTone(t.val)} style={{ padding: '12px 16px', border: `1px solid ${tone === t.val ? accent : 'var(--border2)'}`, background: tone === t.val ? 'var(--gold-dim)' : 'transparent', cursor: 'pointer', borderRadius: 'var(--radius)', transition: 'all 0.15s' }}>
                <div style={{ fontSize: 12, color: tone === t.val ? accent : 'var(--text)', marginBottom: 2 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* BANNER STUDIO TAB */}
        {formTab === 'banner-studio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ChatGPT badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#0A1628', border: '1px solid #4A90D940', borderRadius: 'var(--radius)' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#4A90D9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#4A90D9', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Powered by GPT-4o</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Claude is backup — used only if OpenAI is unavailable</div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Campaign Goal</label>
              <input
                value={bannerCampaignGoal}
                onChange={e => setBannerCampaignGoal(e.target.value)}
                placeholder="e.g. Nykaa launch, festive sale, brand awareness, product launch"
                style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)' }}
              />
            </div>

            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Target Platforms</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Instagram', 'LinkedIn', 'Google Display', 'Facebook', 'Twitter/X', 'YouTube'].map(p => (
                  <div key={p} onClick={() => toggleBannerPlatform(p)} style={{ padding: '6px 12px', border: `1px solid ${bannerPlatforms.includes(p) ? '#4A90D9' : 'var(--border2)'}`, background: bannerPlatforms.includes(p) ? '#4A90D910' : 'transparent', color: bannerPlatforms.includes(p) ? '#4A90D9' : 'var(--muted)', fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer', borderRadius: 'var(--radius)', userSelect: 'none', transition: 'all 0.15s' }}>
                    {p}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
              <span style={{ color: accent }}>✦ Tip:</span> Fill in company name, industry and brand description in the Generate + Details tabs first — the AI uses all that context to craft your banners.
            </div>

            {bannerOutput && (
              <div style={{ padding: '10px 14px', background: 'rgba(46,125,82,0.08)', border: '1px solid rgba(46,125,82,0.25)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#2E7D52' }}>✓</span>
                <span style={{ fontSize: 11, color: '#2E7D52' }}>Banners generated via {bannerAiModel}</span>
              </div>
            )}

            <button
              onClick={handleGenerateBanner}
              disabled={bannerLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#4A90D9', border: 'none', color: '#fff', padding: '12px 22px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: bannerLoading ? 'not-allowed' : 'pointer', borderRadius: 'var(--radius)', transition: 'all 0.2s', opacity: bannerLoading ? 0.7 : 1 }}
            >
              {bannerLoading
                ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block' }} />
                : <span style={{ fontSize: 14 }}>▭</span>
              }
              {bannerLoading ? BIZ_STEPS[bannerGenStep] : 'Generate Banners with GPT-4o'}
            </button>
          </div>
        )}

        {/* Generate button — shown on generate/details/style tabs only */}
        {formTab !== 'banner-studio' && (
        <button onClick={handleGenerate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 10, background: accent, border: 'none', color: '#000', padding: '12px 22px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 'var(--radius)', transition: 'all 0.2s', opacity: loading ? 0.7 : 1, marginTop: 28 }}>
          {loading
            ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block' }} />
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 3.5H13L9.5 7.5l1.5 4L7 10l-4 2.5 1.5-4L1 5.5h4.5z" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" /></svg>
          }
          {loading ? BIZ_STEPS[genStep] : 'Generate Brand Assets'}
        </button>
        )}
      </div>

      {/* ── BUSINESS PREVIEW SIDE ── */}
      <div className={`generate-preview-side${mobilePanel === 'form' ? ' mobile-hidden' : ''}`}>

        {/* Preview top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 48, borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 8, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: output ? accent : 'var(--muted2)', display: 'block', transition: 'background 0.3s', flexShrink: 0 }} />
            <span className="preview-status-label" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
              {output ? 'Live' : 'Waiting'}
            </span>
          </div>

          {/* Asset tabs */}
          <div style={{ display: 'flex', height: 48, alignItems: 'stretch', overflowX: 'auto', flex: 1, minWidth: 0, scrollbarWidth: 'none' }}>
            {(outputTypes.length > 0 ? outputTypes : (['logo', 'flyer', 'poster', 'copy', 'website', 'presentation'] as BizTab[])).map(t => (
              <button key={t} onClick={() => setPvTab(t)} style={{ display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4, flexShrink: 0, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: pvTab === t ? accent : 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none', borderBottom: pvTab === t ? `2px solid ${accent}` : '2px solid transparent', fontFamily: "'DM Mono', monospace", transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", marginRight: 2 }}>{BIZ_TAB_META[t].icon}</span>
                {BIZ_TAB_META[t].label}
              </button>
            ))}
            {/* Banner tab — GPT-4o powered, always visible */}
            <button onClick={() => setPvTab('banner')} style={{ display: 'flex', alignItems: 'center', padding: '0 10px', gap: 4, flexShrink: 0, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: pvTab === 'banner' ? '#4A90D9' : 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none', borderBottom: pvTab === 'banner' ? '2px solid #4A90D9' : '2px solid transparent', fontFamily: "'DM Mono', monospace", transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              <span style={{ marginRight: 2 }}>▭</span>
              Banners{bannerOutput ? ' ✦' : ''}
            </button>
          </div>

          {/* Business mode badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, padding: '4px 10px', border: `1px solid ${accent}50`, borderRadius: 'var(--radius)', background: 'var(--gold-dim)' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>✦ Business</span>
          </div>
        </div>

        {/* Edit shortcut bar — shown only after generation */}
        {output && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none', background: 'var(--bg)', alignItems: 'center' }}>
            <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>Edit →</span>
            <a href={bizGenId ? `/business/edit?gen=${bizGenId}` : '/business/edit'} style={{ padding: '4px 12px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, border: `1px solid ${accent}50`, borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace", textDecoration: 'none', flexShrink: 0, background: 'var(--gold-dim)', whiteSpace: 'nowrap' }}>
              Business Assets ✦
            </a>
          </div>
        )}

        {/* Preview viewport */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Banner tab — shows GPT-4o banner output */}
          {pvTab === 'banner' ? (
            bannerLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
                <div style={{ width: 40, height: 40, border: '1px solid #4A90D940', borderTopColor: '#4A90D9', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 20 }} />
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4A90D9', marginBottom: 8 }}>{BIZ_STEPS[bannerGenStep]}</div>
                <div style={{ fontSize: 11, color: 'var(--muted2)' }}>GPT-4o is designing your banners…</div>
              </div>
            ) : bannerOutput ? (
              <BannerOutputPreview data={bannerOutput} accent={accent} aiModel={bannerAiModel} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: '#4A90D910', border: '1px solid #4A90D940', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 20 }}>▭</div>
                <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4A90D9', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Banner Studio · GPT-4o</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--cream)', marginBottom: 8 }}>Ready to design</div>
                <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6, maxWidth: 260, marginBottom: 20 }}>Go to the Banners tab on the left and click Generate Banners with GPT-4o.</div>
                <button onClick={() => { setFormTab('banner-studio'); setMobilePanel('form') }} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #4A90D9', color: '#4A90D9', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Mono', monospace", borderRadius: 'var(--radius)' }}>Open Banner Studio</button>
              </div>
            )
          ) : loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: `1px solid var(--border2)`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 20 }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{BIZ_STEPS[genStep]}</div>
              <div style={{ fontSize: 11, color: 'var(--muted2)' }}>Claude is crafting your brand identity…</div>
            </div>
          ) : output ? (
            <>
              {pvTab === 'logo'         && outputTypes.includes('logo')         && <BizLogoPreview         data={output} accent={accent} />}
              {pvTab === 'flyer'        && outputTypes.includes('flyer')        && <BizFlyerPreview        data={output} accent={accent} />}
              {pvTab === 'poster'       && outputTypes.includes('poster')       && <BizPosterPreview       data={output} accent={accent} />}
              {pvTab === 'copy'         && outputTypes.includes('copy')         && <BizCopyPreview         data={output} accent={accent} />}
              {pvTab === 'website'      && outputTypes.includes('website')      && <BizWebsitePreview      data={output} accent={accent} genId={bizGenId} />}
              {pvTab === 'presentation' && outputTypes.includes('presentation') && <BizPresentationPreview data={output} accent={accent} genId={bizGenId} />}
              {/* Not-selected state — only shown for non-banner Claude assets */}
              {(pvTab === 'logo' || pvTab === 'flyer' || pvTab === 'poster' || pvTab === 'copy' || pvTab === 'website' || pvTab === 'presentation') && !outputTypes.includes(pvTab) && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320, padding: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.5 }}>{BIZ_TAB_META[pvTab].icon}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Not Generated</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--cream)', marginBottom: 16 }}>{BIZ_TAB_META[pvTab].label} wasn&apos;t selected</div>
                  <button onClick={() => { setOutputTypes(p => [...p, pvTab]) }} style={{ padding: '8px 20px', background: 'transparent', border: `1px solid ${accent}`, color: accent, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Mono', monospace", borderRadius: 'var(--radius)' }}>
                    Enable + Re-generate
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty state */
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
                Brand Growth Studio · {outputTypes.length} assets selected
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

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
        <div style={{ width: 32, height: 32, border: '1px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <GenerateStudio />
    </Suspense>
  )
}
