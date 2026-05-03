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

const TEMPLATE_CATEGORIES = ['portfolio', 'resume', 'presentation'] as const
const GEN_STEPS = ['Analyzing prompt…', 'Writing copy…', 'Applying style…', 'Finalizing…', 'Ready']

function GenerateStudio() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'generate' | 'details' | 'style'>('generate')
  // FIX 2: pvTab now includes 'presentation'
  const [pvTab, setPvTab] = useState<'portfolio' | 'resume' | 'presentation'>('portfolio')
  // MOBILE FIX: separate mobile panel — 'form' or 'preview'
  const [mobilePanel, setMobilePanel] = useState<'form' | 'preview'>('form')
  // Theme switcher visible in preview panel
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false)
  // Resume font picker
  const [resumeFont, setResumeFont] = useState<string>('DM Sans')
  const [outputTypes, setOutputTypes] = useState(['portfolio', 'resume'])
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
    return TEMPLATES.find(t => t.slug === slug)?.category ?? 'portfolio'
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

  return (
    <div className="generate-layout">

      {/* ── FORM SIDE ── */}
      <div className={`generate-form-side${mobilePanel === 'preview' ? ' mobile-hidden' : ''}`}>
        {/* ── Mode Toggle ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: 3, width: 'fit-content' }}>
          <button onClick={() => {}} style={{ padding: '5px 14px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 1, fontWeight: 600, transition: 'all 0.15s' }}>Personal</button>
          <button onClick={() => window.location.href = '/generate/business'} style={{ padding: '5px 14px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', background: 'transparent', color: 'var(--muted)', border: 'none', borderRadius: 1, fontWeight: 400, transition: 'all 0.15s' }}>Business ✦</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
          <div style={{ width: 20, height: 1, background: 'var(--gold)' }} />AI Generation Studio
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,3vw,42px)', fontWeight: 400, lineHeight: 1.15, color: 'var(--cream)', marginBottom: 10 }}>
          Your personal brand<br />from one <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>prompt.</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, fontWeight: 300, marginBottom: 36, maxWidth: 440 }}>
          Portfolio, resume, and pitch deck — generated from one prompt.
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
          {(['generate', 'details', 'style'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 18px 9px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: tab === t ? 'var(--gold)' : 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -1, fontFamily: "'DM Mono', monospace", transition: 'all 0.15s',
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {/* GENERATE TAB */}
        {tab === 'generate' && (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Output Type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['portfolio', 'resume', 'presentation'].map(type => (
                  <div key={type} onClick={() => toggleOutputType(type)} style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
                    border: `1px solid ${outputTypes.includes(type) ? 'var(--gold)' : 'var(--border2)'}`,
                    background: outputTypes.includes(type) ? 'var(--gold-dim)' : 'transparent',
                    color: outputTypes.includes(type) ? 'var(--gold)' : 'var(--muted)',
                    fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                    cursor: 'pointer', borderRadius: 'var(--radius)', userSelect: 'none', transition: 'all 0.15s',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', opacity: outputTypes.includes(type) ? 1 : 0.5, flexShrink: 0 }} />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                ))}
              </div>
            </div>

            {/* Slide count picker — only shown when presentation is selected */}
            {outputTypes.includes('presentation') && (
              <div style={{
                marginTop: -10, marginBottom: 28, padding: '10px 12px',
                background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)',
              }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 8, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>
                  Slides
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[5, 8, 12, 15].map(n => (
                    <button
                      key={n}
                      onClick={() => setPresentationSlideCount(n)}
                      style={{
                        padding: '5px 14px', fontSize: 12,
                        background: presentationSlideCount === n ? 'var(--gold-dim)' : 'transparent',
                        border: `1px solid ${presentationSlideCount === n ? 'var(--gold)' : 'var(--border2)'}`,
                        color: presentationSlideCount === n ? 'var(--gold)' : 'var(--muted)',
                        borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Template</div>
                <a href="/templates" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--gold)', textDecoration: 'none', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>View All →</a>
              </div>
              {/* Category filter */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setPickerCategory(cat)} style={{
                    padding: '5px 11px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: pickerCategory === cat ? 'var(--gold)' : 'var(--muted2)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: pickerCategory === cat ? '2px solid var(--gold)' : '2px solid transparent',
                    marginBottom: -1, fontFamily: "'DM Mono', monospace", transition: 'all 0.15s',
                  }}>{cat}</button>
                ))}
              </div>
              {/* Template chips */}
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {filteredTemplates.map(t => (
                  <div key={t.slug} onClick={() => { setSelectedTemplate(t.slug) }} style={{ flexShrink: 0, width: 80, cursor: 'pointer' }}>
                    <div style={{
                      width: 80, height: 56, background: 'var(--surface2)',
                      border: `1px solid ${selectedTemplate === t.slug ? t.color : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', padding: '8px 7px',
                      display: 'flex', flexDirection: 'column', gap: 4, transition: 'all 0.15s',
                      boxShadow: selectedTemplate === t.slug ? `0 0 10px ${t.color}33` : 'none',
                    }}>
                      <div style={{ height: 2, borderRadius: 1, background: t.color, width: '100%' }} />
                      <div style={{ height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.15)', width: '70%' }} />
                      <div style={{ height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.1)', width: '45%' }} />
                    </div>
                    <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: selectedTemplate === t.slug ? t.color : 'var(--muted)', marginTop: 5, textAlign: 'center', fontFamily: "'DM Mono', monospace", lineHeight: 1.3 }}>{t.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt box */}
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 'var(--radius)', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 10px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Your Prompt *</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2E7D52', fontFamily: "'DM Mono', monospace" }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2E7D52', animation: 'pulse 2s infinite', display: 'block' }} />
                  QC Active
                </span>
              </div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Riya Mehta, Senior Product Designer at Stripe — 6 years in fintech, led dashboard redesign that cut support tickets by 40%. Exploring roles at seed-stage startups in Bengaluru."
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 300, padding: '18px 16px 14px', caretColor: 'var(--gold)' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 16px 12px' }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{name.length}/100</span>
              </div>
            </div>
          </>
        )}

        {/* DETAILS TAB */}
        {tab === 'details' && (
          <div>
            <div className="form-grid-2">
              {[
                { label: 'Headline', val: headline, set: setHeadline, ph: 'e.g. Senior Product Designer · Fintech & Design Systems' },
                { label: 'Job Title', val: jobTitle, set: setJobTitle, ph: 'e.g. Growth Marketing Lead, Series A Startup' },
                { label: 'Company', val: company, set: setCompany, ph: 'e.g. Stripe, CRED, Razorpay, Open to Work' },
                { label: 'Location', val: location, set: setLocation, ph: 'e.g. Bengaluru, India · Open to Remote' },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>{f.label}</label>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Tagline</label>
              <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. I turn complex fintech UX into products that millions actually love using." style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Bio <span style={{ color: 'var(--muted2)', fontWeight: 400 }}>{bio.length}/500</span></label>
              <textarea value={bio} onChange={e => setBio(e.target.value.substring(0, 500))} rows={5} placeholder="e.g. 6 years designing fintech products at Stripe. Led the redesign of the merchant dashboard (used by 2M+ businesses) that reduced support tickets by 40%. Before that, 0→1 product design at two YC startups. I specialise in design systems, payments UX, and cross-functional collaboration. Now exploring Head of Design roles at Series A–B fintechs and climate tech startups in India."
                style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
            <div>
              <label style={labelStyle}>Skills — press Enter to add</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {skills.map(s => (
                  <span key={s} onClick={() => setSkills(p => p.filter(x => x !== s))}
                    style={{ padding: '4px 10px', border: '1px solid var(--gold)', background: 'var(--gold-dim)', color: 'var(--gold)', fontSize: 11, cursor: 'pointer', borderRadius: 'var(--radius)' }}>
                    {s} ×
                  </span>
                ))}
              </div>
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill}
                placeholder="e.g. Figma, Design Systems, Payments UX — press Enter after each" style={inputStyle} />
            </div>
          </div>
        )}

        {/* STYLE TAB */}
        {tab === 'style' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { val: 'professional', label: 'Professional', desc: 'Clear, credible, structured' },
              { val: 'creative', label: 'Creative', desc: 'Expressive, bold, distinctive' },
              { val: 'executive', label: 'Executive', desc: 'Authoritative, results-driven' },
            ].map(t => (
              <div key={t.val} onClick={() => setTone(t.val)} style={{
                padding: '12px 16px',
                border: `1px solid ${tone === t.val ? 'var(--gold)' : 'var(--border2)'}`,
                background: tone === t.val ? 'var(--gold-dim)' : 'transparent',
                cursor: 'pointer', borderRadius: 'var(--radius)', transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 12, color: tone === t.val ? 'var(--gold)' : 'var(--text)', marginBottom: 2 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Generate button */}
        <button onClick={handleGenerate} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--gold)', border: 'none', color: '#000',
          padding: '12px 22px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
          fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          borderRadius: 'var(--radius)', transition: 'all 0.2s', opacity: loading ? 0.7 : 1, marginTop: 28,
        }}>
          {loading
            ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block' }} />
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 3.5H13L9.5 7.5l1.5 4L7 10l-4 2.5 1.5-4L1 5.5h4.5z" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" /></svg>
          }
          {loading ? GEN_STEPS[genStep] : 'Generate Brand'}
        </button>
      </div>

      {/* ── PREVIEW SIDE ── */}
      <div className={`generate-preview-side${mobilePanel === 'form' ? ' mobile-hidden' : ''}`}>
        {/* Preview bar — row 1: status + tabs + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 48, borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 8, minWidth: 0 }}>
          {/* Status dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: output ? accent : 'var(--muted2)', display: 'block', transition: 'background 0.3s', flexShrink: 0 }} />
            <span className="preview-status-label" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
              {output ? 'Live' : loading ? GEN_STEPS[genStep] : 'Ready'}
            </span>
          </div>

          {/* Preview tabs — scrollable on mobile */}
          <div style={{ display: 'flex', height: 48, alignItems: 'stretch', overflowX: 'auto', flex: 1, minWidth: 0, scrollbarWidth: 'none' }}>
            {(['portfolio', 'resume', 'presentation'] as const).map(t => (
              <button key={t} onClick={() => setPvTab(t)} style={{
                display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4, flexShrink: 0,
                fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: pvTab === t ? accent : 'var(--muted)',
                cursor: 'pointer', background: 'none', border: 'none',
                borderBottom: pvTab === t ? `2px solid ${accent}` : '2px solid transparent',
                fontFamily: "'DM Mono', monospace", transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.6, flexShrink: 0 }} />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            {/* Theme switcher button — always visible */}
            <button
              onClick={() => setShowThemeSwitcher(s => !s)}
              title="Switch theme"
              style={{
                background: showThemeSwitcher ? `${accent}20` : 'transparent',
                border: `1px solid ${showThemeSwitcher ? accent : 'var(--border2)'}`,
                color: showThemeSwitcher ? accent : 'var(--muted)',
                padding: '3px 8px', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                fontFamily: "'DM Mono', monospace", cursor: 'pointer',
                borderRadius: 'var(--radius)', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              🎨
            </button>
            {output && (
              <>
                <PublishButton generationId={genId} accent={accent} />
                <button onClick={() => setShowExport(true)} style={{ background: 'var(--gold)', border: 'none', color: '#000', padding: '4px 10px', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: 'var(--radius)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  Export
                </button>
              </>
            )}
          </div>
        </div>

        {/* Theme switcher panel — slides down under preview bar */}
        {showThemeSwitcher && (
          <div style={{
            background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            padding: '10px 14px', flexShrink: 0,
          }}>
            <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>
              Template — {TEMPLATES.find(t => t.slug === selectedTemplate)?.name ?? selectedTemplate}
            </div>
            {/* Category filter */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 8, borderBottom: '1px solid var(--border)' }}>
              {TEMPLATE_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setPickerCategory(cat)} style={{
                  padding: '4px 10px', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: pickerCategory === cat ? accent : 'var(--muted2)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: pickerCategory === cat ? `2px solid ${accent}` : '2px solid transparent',
                  marginBottom: -1, fontFamily: "'DM Mono', monospace", transition: 'all 0.15s',
                }}>{cat}</button>
              ))}
            </div>
            {/* Template chips */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {TEMPLATES.filter(t => t.category === pickerCategory).map(t => (
                <div key={t.slug} onClick={() => { setSelectedTemplate(t.slug); setShowThemeSwitcher(false) }} style={{ flexShrink: 0, cursor: 'pointer', width: 56 }}>
                  <div style={{
                    width: 56, height: 38, background: 'var(--surface2)',
                    border: `1px solid ${selectedTemplate === t.slug ? t.color : 'var(--border)'}`,
                    borderRadius: 3, padding: '5px 6px',
                    display: 'flex', flexDirection: 'column', gap: 3, transition: 'all 0.15s',
                    boxShadow: selectedTemplate === t.slug ? `0 0 8px ${t.color}44` : 'none',
                  }}>
                    <div style={{ height: 2, borderRadius: 1, background: t.color, width: '100%' }} />
                    <div style={{ height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.15)', width: '70%' }} />
                    <div style={{ height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.08)', width: '45%' }} />
                  </div>
                  <div style={{ fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: selectedTemplate === t.slug ? t.color : 'var(--muted)', marginTop: 4, textAlign: 'center', fontFamily: "'DM Mono', monospace", lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* After-generation action bar — Edit shortcuts */}
        {output && (
          <div style={{
            display: 'flex', gap: 6, padding: '8px 14px',
            borderBottom: '1px solid var(--border)', flexShrink: 0,
            overflowX: 'auto', scrollbarWidth: 'none', background: 'var(--bg)',
          }}>
            <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", alignSelf: 'center', flexShrink: 0 }}>Edit →</span>
            <a href={genId ? `/portfolio?gen=${genId}` : '/portfolio'} style={editBtnStyle(pvTab === 'portfolio', accent)}>Portfolio</a>
            <a href={genId ? `/resume/edit?gen=${genId}` : '/resume/edit'} style={editBtnStyle(pvTab === 'resume', accent)}>Resume</a>
            <a href="/presentations" style={editBtnStyle(pvTab === 'presentation', accent)}>Slides</a>
          </div>
        )}

        {/* Preview viewport */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '1px solid var(--border2)', borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 28 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
                {[
                  'Analyzing your prompt',
                  'Writing brand copy',
                  'Applying style & layout',
                  'Finalizing assets',
                ].map((step, i) => {
                  const done = genStep > i
                  const active = genStep === i
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: done || active ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${done ? accent : active ? accent : 'var(--border2)'}`, background: done ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                        {done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, animation: 'pulse 1s infinite' }} />}
                      </div>
                      <span style={{ fontSize: 12, color: active ? 'var(--cream)' : done ? accent : 'var(--muted)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em', textAlign: 'left' }}>
                        Step {i + 1}: {step}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : output ? (
            <>
              {/* Only render a vertical if it was selected — otherwise show a friendly empty state */}
              {pvTab === 'portfolio' && (
                outputTypes.includes('portfolio')
                  ? <PortfolioPreview data={output} accent={accent} />
                  : <VerticalNotSelected label="Portfolio" accent={accent} onEnable={() => { setOutputTypes(p => [...p, 'portfolio']); showMsg('Re-generate to include portfolio') }} />
              )}

              {pvTab === 'resume' && (
                outputTypes.includes('resume') ? (
                  <>
                    <ResumePreview data={output} accent={accent} resumeFont={resumeFont} onFontChange={setResumeFont} />
                    <div style={{ padding: '0 0 24px' }}>
                      <ResumeIntelligencePanel
                        resumeData={{
                          name:          output.cardName  || '',
                          headline:      output.headline  || '',
                          bio:           output.bio       || '',
                          skills:        output.skills    || [],
                          resumeBullets: output.resumeBullets || [],
                          cardTitle:     output.cardTitle || '',
                        }}
                        accent={accent}
                      />
                    </div>
                  </>
                ) : <VerticalNotSelected label="Resume" accent={accent} onEnable={() => { setOutputTypes(p => [...p, 'resume']); showMsg('Re-generate to include resume') }} />
              )}
              {pvTab === 'presentation' && (
                outputTypes.includes('presentation')
                  ? <PresentationPreview data={output} accent={accent} genId={genId} />
                  : <VerticalNotSelected label="Presentation" accent={accent} onEnable={() => { setOutputTypes(p => [...p, 'presentation']); showMsg('Re-generate to include presentation') }} />
              )}
            </>
          ) : (
            <TemplateEmptyState accent={accent} selectedTemplate={selectedTemplate} />
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mobile-bottom-nav">
        <button
          onClick={() => setMobilePanel('form')}
          className={`mobile-bottom-btn${mobilePanel === 'form' ? ' active' : ''}`}
          style={{ color: mobilePanel === 'form' ? accent : undefined, borderTop: mobilePanel === 'form' ? `2px solid ${accent}` : '2px solid transparent' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 3h12M2 7h8M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Generate
        </button>
        <button
          onClick={() => setMobilePanel('preview')}
          className={`mobile-bottom-btn${mobilePanel === 'preview' ? ' active' : ''}`}
          style={{ color: mobilePanel === 'preview' ? accent : undefined, borderTop: mobilePanel === 'preview' ? `2px solid ${accent}` : '2px solid transparent' }}
        >
          {output && (
            <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(14px)', width: 6, height: 6, borderRadius: '50%', background: accent, display: 'block' }} />
          )}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="11" rx="1" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M5 14h6M8 12v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          Preview{output ? ' ✦' : ''}
        </button>
      </div>

      {/* Export modal */}
      {showExport && (
        <div
          onClick={() => setShowExport(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="export-modal"
            style={{ background: 'var(--surface)', border: '1px solid var(--border2)', width: '100%', maxWidth: 480, padding: '32px 28px', position: 'relative', animation: 'slideUp 0.2s ease', borderRadius: 'var(--radius)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
          >
            {/* Close */}
            <button
              onClick={() => setShowExport(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 2, fontSize: 16 }}
            >×</button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1v10M5 7l4 4 4-4M1 14v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', fontWeight: 400 }}>Export Brand Assets</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 28, paddingLeft: 28 }}>
              {genId ? 'Download your brand materials in multiple formats.' : '⚠ Generate your brand first to enable exports.'}
            </div>

            {/* Export cards grid */}
            <div className="export-grid-2">
              {[
                {
                  key: 'portfolio',
                  outputType: 'portfolio',
                  name: 'Portfolio PDF',
                  desc: 'Full portfolio document',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="4" y="2" width="16" height="21" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      <path d="M20 18v7M17 22l3 3 3-3" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                },
                {
                  key: 'resume',
                  outputType: 'resume',
                  name: 'Resume PDF',
                  desc: 'Clean resume layout',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="4" y="2" width="16" height="21" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="12" cy="8" r="2.5" stroke={accent} strokeWidth="1.3"/>
                      <path d="M7 14h10M7 17.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      <path d="M20 18v7M17 22l3 3 3-3" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                },
                {
                  key: 'pptx',
                  outputType: 'presentation',
                  name: 'Pitch Deck',
                  desc: 'PowerPoint (.pptx)',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="2" y="5" width="24" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M14 21v4M10 25h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      <rect x="7" y="9" width="6" height="8" rx="1" stroke={accent} strokeWidth="1.3"/>
                      <path d="M16 11h4M16 14h3M16 17h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  ),
                },
                {
                  key: 'vcard',
                  outputType: 'vcard_disabled',
                  name: 'vCard',
                  desc: 'Digital contact card (.vcf)',
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect x="2" y="6" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="9" cy="13" r="3" stroke={accent} strokeWidth="1.3"/>
                      <path d="M15 11h7M15 14h5M15 17h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  ),
                },
              ].filter(opt => outputTypes.includes(opt.outputType)).map(opt => {
                const isLoading = exportLoading === opt.key
                const isDisabled = !genId || isLoading
                return (
                  <div
                    key={opt.key}
                    onClick={() => !isDisabled && handleExport(opt.key)}
                    style={{
                      background: isDisabled ? 'var(--surface2)' : 'var(--surface2)',
                      border: `1px solid ${isLoading ? accent : 'var(--border)'}`,
                      padding: '18px 16px',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      borderRadius: 'var(--radius)',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                      opacity: isDisabled && !isLoading ? 0.45 : 1,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Active glow */}
                    {isLoading && (
                      <div style={{ position: 'absolute', inset: 0, background: `${accent}08`, borderRadius: 'inherit' }} />
                    )}
                    <div style={{ color: isLoading ? accent : 'var(--muted)', marginBottom: 10, display: 'flex', justifyContent: 'center', transition: 'color 0.15s' }}>
                      {isLoading ? (
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                          <circle cx="14" cy="14" r="10" stroke="var(--border2)" strokeWidth="2"/>
                          <path d="M14 4a10 10 0 0110 10" stroke={accent} strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ) : opt.icon}
                    </div>
                    <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text)', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{opt.name}</div>
                    <div style={{ fontSize: 9, color: isLoading ? accent : 'var(--muted)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>
                      {isLoading ? 'Preparing…' : opt.desc}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Show message if no export types selected */}
            {outputTypes.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
                No output types selected. Go back and enable at least one.
              </div>
            )}

            {/* Footer note */}
            <div style={{ marginTop: 20, padding: '12px 16px', background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="7" cy="7" r="6" stroke={accent} strokeWidth="1.3"/>
                <path d="M7 6v4M7 4.5v.5" stroke={accent} strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, fontFamily: "'DM Mono', monospace" }}>
                PDFs and decks are generated server-side and hosted for 72 hours. Files open in a new tab.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        background: 'var(--surface2)', border: '1px solid var(--border2)',
        borderLeft: `3px solid ${accent}`, padding: '12px 20px',
        fontSize: 12, color: 'var(--text)', zIndex: 9998, maxWidth: 280,
        borderRadius: 'var(--radius)', pointerEvents: 'none',
        transform: showToast ? 'translateX(0)' : 'translateX(calc(100% + 32px))',
        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>{toast}</div>
    </div>
  )
}

// ── Preview components ──────────────────────────────────────────────────────

// ── VerticalNotSelected — shown when a user didn't select this output type ──
function VerticalNotSelected({ label, accent, onEnable }: { label: string; accent: string; onEnable: () => void }) {
  const icons: Record<string, string> = {
    'Portfolio': '🌐',
    'Resume': '📄',
    'Presentation': '🎞️',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320, padding: '40px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.6 }}>{icons[label] ?? '—'}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
        Not Generated
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 8 }}>
        {label} wasn't selected
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 300, marginBottom: 24 }}>
        You didn't include <strong style={{ color: 'var(--cream)' }}>{label}</strong> in your output selection before generating. Enable it and re-generate to create this content.
      </div>
      <button
        onClick={onEnable}
        style={{ padding: '9px 22px', background: 'transparent', border: `1px solid ${accent}`, color: accent, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: "'DM Mono', monospace", borderRadius: 'var(--radius)' }}
      >
        Enable {label} + Re-generate
      </button>
    </div>
  )
}

// FIX 8: Shows a live-colored skeleton before generation runs
function TemplateEmptyState({ accent, selectedTemplate }: { accent: string; selectedTemplate: string }) {
  const tpl = TEMPLATES.find(t => t.slug === selectedTemplate)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
      <div style={{
        width: 160, height: 110, background: '#0A0A0A',
        border: `1px solid ${accent}55`, borderRadius: 6,
        padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
        marginBottom: 24, boxShadow: `0 8px 32px ${accent}15`, transition: 'all 0.3s',
      }}>
        <div style={{ height: 2, background: accent, borderRadius: 1, width: '100%' }} />
        <div style={{ height: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 1, width: '78%' }} />
        <div style={{ height: 2, background: 'rgba(255,255,255,0.12)', borderRadius: 1, width: '58%' }} />
        <div style={{ height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 1, width: '40%' }} />
        <div style={{ marginTop: 4, display: 'flex', gap: 5 }}>
          <div style={{ height: 14, width: 44, background: accent, borderRadius: 2, opacity: 0.85 }} />
          <div style={{ height: 14, width: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>
        {tpl?.category ?? 'template'} · {tpl?.name ?? selectedTemplate}
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--cream)', marginBottom: 8 }}>
        Template selected
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6, maxWidth: 220 }}>
        Fill in your details and click Generate to see your brand come to life.
      </div>
    </div>
  )
}

// ── PortfolioWorkImage — fetches real Pexels image for work card ──────────
function PortfolioWorkImage({ query, accent }: { query: string; accent: string }) {
  const [src, setSrc] = React.useState<string | null>(null)
  React.useEffect(() => {
    let cancelled = false
    fetch(`/api/image?query=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d?.url) setSrc(d.url) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [query])
  if (!src) return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(135deg, #131313 0%, #1a1a1a 100%)`,
    }} />
  )
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', filter: 'brightness(0.45) saturate(0.8)',
        transition: 'transform 0.6s ease',
      }} />
    </>
  )
}

// ── PortfolioHeroImage — fetches real Pexels hero background ─────────────
function PortfolioHeroImage({ query }: { query: string }) {
  const [src, setSrc] = React.useState<string | null>(null)
  React.useEffect(() => {
    let cancelled = false
    fetch(`/api/image?query=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d?.url) setSrc(d.url) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [query])
  if (!src) return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, #0d0d10 0%, #14120e 50%, #09090a 100%)',
    }} />
  )
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={src} alt="" style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      objectFit: 'cover', objectPosition: 'center',
      animation: 'imgFadeIn 1.2s ease both',
    }} />
  )
}

function PortfolioPreview({ data, accent }: { data: BrandOutput; accent: string }) {
  const hexToRgb = (hex: string) => {
    const c = hex.replace('#', '')
    if (c.length !== 6) return '201,168,76'
    return `${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)}`
  }
  const aRgb = hexToRgb(accent)
  const initials = (data.cardName || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2)
  const heroQuery = (data as unknown as { heroImageQuery?: string }).heroImageQuery
    || `${data.cardTitle || ''} workspace environment`
  const workQueries = (data as unknown as { workImageQueries?: string[] }).workImageQueries
    || data.portfolioSections.map(s => `${s.title} professional workspace`)

  return (
    <div style={{ background: '#09090A', minHeight: '100%', fontFamily: "'DM Sans', sans-serif", fontSize: '0.92em' }}>
      <style>{`
        @keyframes imgFadeIn { from{opacity:0;transform:scale(1.03)} to{opacity:1;transform:scale(1)} }
        @keyframes pv_ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes pv_fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .pv_wcard:hover .pv_wimg { transform: scale(1.05) !important; filter: brightness(0.3) saturate(0.7) !important; }
        .pv_wcard:hover .pv_accent_line { opacity: 1 !important; }
      `}</style>

      {/* NAV */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: 52,
        background: 'rgba(9,9,10,0.95)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 11, letterSpacing: '0.22em', color: '#F8F4EE', textTransform: 'uppercase' }}>
          {data.cardName} <span style={{ color: accent }}>·</span>
        </div>
        <div className="pv_nav_links" style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          {['Work','About','Contact'].map(l => (
            <span key={l} style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A09890' }}>{l}</span>
          ))}
          <span style={{ background: accent, color: '#000', padding: '5px 12px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", fontWeight: 500, cursor: 'pointer' }}>
            Save Contact
          </span>
        </div>
      </nav>

      {/* HERO — full-bleed image */}
      <div style={{ position: 'relative', minHeight: 360, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
        {/* Background image */}
        <PortfolioHeroImage query={heroQuery} />
        {/* Overlays */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, rgba(9,9,10,1) 0%, rgba(9,9,10,0.75) 40%, rgba(9,9,10,0.3) 100%), linear-gradient(to right, rgba(9,9,10,0.7) 0%, transparent 60%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 80% at 0% 100%, rgba(${aRgb},0.07) 0%, transparent 60%)` }} />

        {/* Floating avatar — top right */}
        <div style={{ position: 'absolute', top: '50%', right: 28, transform: 'translateY(-50%)', zIndex: 2 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
            border: `2px solid rgba(${aRgb},0.35)`,
            boxShadow: `0 0 0 6px rgba(${aRgb},0.06), 0 16px 40px rgba(0,0,0,0.5)`,
            background: `linear-gradient(135deg,#1e1a14,#0d0d0e)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display',serif", fontSize: 24, color: `rgba(${aRgb},0.45)`,
          }}>
            {initials}
          </div>
        </div>

        {/* Hero content */}
        <div className="pv_hero_content" style={{ position: 'relative', zIndex: 1, padding: '32px 28px 28px', maxWidth: 500, animation: 'pv_fadeUp 0.75s ease both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: accent, marginBottom: 14, fontFamily: "'DM Mono',monospace" }}>
            <div style={{ width: 20, height: 1, background: accent }} />
            {data.cardTitle || 'Professional'}
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(20px,3.5vw,34px)', color: '#fff', lineHeight: 1.1, marginBottom: 12, fontWeight: 400, letterSpacing: '-0.01em', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
            {data.headline
              ? data.headline.split('|').map((p: string, i: number) =>
                  i % 2 === 1
                    ? <em key={i} style={{ fontStyle: 'italic', color: accent }}>{p.trim()}</em>
                    : <span key={i}>{p}</span>)
              : data.cardName}
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(248,244,238,0.75)', lineHeight: 1.8, maxWidth: 400, fontWeight: 300, marginBottom: 20, textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            {data.bio}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button style={{ background: accent, color: '#000', border: 'none', padding: '9px 20px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500, borderRadius: 1 }}>
              {data.cta}
            </button>
            <button style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(248,244,238,0.7)', border: '1px solid rgba(255,255,255,0.14)', padding: '9px 20px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 1, backdropFilter: 'blur(8px)' }}>
              View Work
            </button>
          </div>
        </div>
      </div>

      {/* SKILLS TICKER */}
      {data.skills && data.skills.length > 0 && (
        <div className="pv_skills_ticker" style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 0', background: 'rgba(0,0,0,0.2)', position: 'relative' }}>
          <div style={{ display: 'flex', gap: 0, width: 'max-content', animation: 'pv_ticker 20s linear infinite' }}>
            {[...data.skills,...data.skills,...data.skills,...data.skills].map((s: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', whiteSpace: 'nowrap', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A09890', fontFamily: "'DM Mono',monospace" }}>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: `rgba(${aRgb},0.5)`, flexShrink: 0 }} />{s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WORK SECTIONS — image background cards */}
      {data.portfolioSections && data.portfolioSections.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 28, fontFamily: "'DM Mono',monospace" }}>
            <div style={{ width: 20, height: 1, background: accent }} />Selected Work
          </div>
          <div className="pv_work_grid" style={{
            display: 'grid',
            gridTemplateColumns: data.portfolioSections.length > 2 ? 'repeat(auto-fill,minmax(240px,1fr))' : '1fr',
            gap: 3,
          }}>
            {data.portfolioSections.map((sec, i) => (
              <div key={i} className="pv_wcard" style={{ position: 'relative', overflow: 'hidden', minHeight: 220, background: '#111' }}>
                {/* Real Pexels image */}
                <div className="pv_wimg" style={{ position: 'absolute', inset: 0, transition: 'transform 0.6s ease, filter 0.6s ease' }}>
                  <PortfolioWorkImage query={workQueries[i] || `${sec.title} professional`} accent={accent} />
                </div>
                {/* Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,9,10,0.95) 0%, rgba(9,9,10,0.5) 55%, rgba(9,9,10,0.1) 100%)' }} />
                {/* Accent line top */}
                <div className="pv_accent_line" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)`, opacity: 0, transition: 'opacity 0.3s' }} />
                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', minHeight: 220 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, color: 'rgba(255,255,255,0.05)', lineHeight: 1, fontWeight: 700 }}>
                      {String(i+1).padStart(2,'0')}
                    </div>
                  </div>
                  {sec.highlight && (
                    <div style={{ fontSize: 8, color: accent, fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, padding: '2px 8px', border: `1px solid rgba(${aRgb},0.25)`, display: 'inline-block', borderRadius: 1, background: `rgba(${aRgb},0.06)` }}>
                      {sec.highlight}
                    </div>
                  )}
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: '#fff', marginBottom: 8, fontWeight: 400, lineHeight: 1.25, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{sec.title}</h3>
                  <p style={{ fontSize: 11, color: 'rgba(248,244,238,0.65)', lineHeight: 1.75, fontWeight: 300 }}>{sec.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATS BAND */}
      {(data.portfolioSections ?? []).some(s => /\d+[%+x]/.test(s.highlight)) && (
        <div style={{ background: '#111113', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '36px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 100% at 50% 50%, rgba(${aRgb},0.04) 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 24, textAlign: 'center', position: 'relative', zIndex: 1 }}>
            {(data.portfolioSections ?? []).filter(s => /\d+[%+x]/.test(s.highlight)).slice(0,3).map((sec, i) => {
              const m = sec.highlight.match(/(\d+[%+x]?\w*)/)
              const num = m ? m[1] : '—'
              const lbl = sec.highlight.replace(m?.[0]||'','').trim()
              return (
                <div key={i}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, color: '#F8F4EE', fontWeight: 400, lineHeight: 1, marginBottom: 6 }}>
                    <span style={{ color: accent }}>{num}</span>
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A09890', fontFamily: "'DM Mono',monospace" }}>{lbl || sec.title}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CONTACT */}
      <div style={{ padding: '60px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 70% at 50% 50%, rgba(${aRgb},0.05) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: accent, marginBottom: 20, fontFamily: "'DM Mono',monospace" }}>
            <div style={{ width: 20, height: 1, background: accent }} />Get In Touch<div style={{ width: 20, height: 1, background: accent }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(22px,3vw,40px)', color: '#F8F4EE', fontWeight: 400, marginBottom: 10 }}>Let&apos;s Work Together</h2>
          <p style={{ fontSize: 12, color: '#A09890', marginBottom: 24 }}>Save contact or reach out directly.</p>
          <button style={{ background: accent, color: '#000', border: 'none', padding: '11px 28px', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500, borderRadius: 1 }}>
            {data.cta || 'Save Contact'}
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 9, color: '#706860', letterSpacing: '0.1em' }}>
          Powered by <span style={{ color: accent }}>Brand Syndicate</span>
        </div>
        <div style={{ fontSize: 9, color: '#706860', fontFamily: "'DM Mono',monospace" }}>{data.tagline}</div>
      </div>
    </div>
  )
}

function CardPreview({ data, accent }: { data: BrandOutput; accent: string }) {
  const [flipped, setFlipped] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)

  const portfolioUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${encodeURIComponent((data.cardName || 'user').toLowerCase().replace(/\s+/g, '-'))}`
    : `https://www.brandsyndicate.in/p/${(data.cardName || 'user').toLowerCase().replace(/\s+/g, '-')}`

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(portfolioUrl)}&size=160x160&bgcolor=ffffff&color=${accent.replace('#', '')}&format=svg&margin=1`

  const SOCIAL_ICONS: Record<string, string> = {
    linkedin: 'in', twitter: '𝕏', instagram: '⬡', github: '</>',
    youtube: '▶', behance: 'Bē', dribbble: '⬟', website: '⌂',
  }

  const mono = "'DM Mono', monospace"
  const serif = "'Playfair Display', serif"

  const demoSocials = [
    { platform: 'linkedin', label: 'LinkedIn' },
    { platform: 'twitter',  label: 'Twitter' },
    { platform: 'github',   label: 'GitHub' },
  ]

  return (
    <div style={{
      padding: '32px 20px 28px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: '#0A0A0F', minHeight: '100%',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @keyframes cp_ringPulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.07); }
        }
        @keyframes cp_entrance {
          from { opacity: 0; transform: translateY(10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cp-social-btn:hover {
          background: ${accent}28 !important;
          transform: translateY(-2px) !important;
        }
        .cp-skill-tag:hover {
          border-color: ${accent}50 !important;
          color: ${accent} !important;
        }
      `}</style>

      {/* ── Section label ── */}
      <div style={{
        fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
        color: `${accent}90`, fontFamily: mono, marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 20, height: 1, background: `${accent}60`, display: 'inline-block' }} />
        Digital Business Card
        <span style={{ width: 20, height: 1, background: `${accent}60`, display: 'inline-block' }} />
      </div>

      {/* ── 3D Card container ── */}
      <div style={{
        perspective: '1100px',
        width: '100%', maxWidth: 340,
        animation: 'cp_entrance 0.5s cubic-bezier(0.16,1,0.3,1)',
        marginBottom: 16,
      }}>
        {/* Flip wrapper — transition bug fixed: single transition covers both transform + filter */}
        <div
          style={{
            width: '100%', aspectRatio: '1.75 / 1',
            position: 'relative',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transition: 'transform 0.7s cubic-bezier(0.4,0.2,0.2,1), filter 0.4s ease',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            cursor: 'pointer',
            willChange: 'transform',
            filter: hovered
              ? `drop-shadow(0 24px 48px rgba(0,0,0,0.7)) drop-shadow(0 0 24px ${accent}22)`
              : `drop-shadow(0 16px 32px rgba(0,0,0,0.5))`,
          }}
          onClick={() => setFlipped(f => !f)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >

          {/* ════════════════ FRONT ════════════════ */}
          {/* div 1 — face wrapper: handles backface visibility, no overflow clip */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
         transform: 'translateZ(0.01px)',
          }}>
            {/* div 2 — glass shell: visible surface, clips ambient blobs */}
            <div style={{
              width: '100%', height: '100%',
              background: `linear-gradient(135deg, rgba(22,22,26,0.95) 0%, rgba(10,10,14,0.98) 100%)`,
              border: `1px solid ${accent}35`,
              borderRadius: 18,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07)`,
            }}>
              {/* Ambient blobs — clipped by div 2 overflow:hidden */}
              <div style={{
                position: 'absolute', top: -50, right: -50,
                width: 180, height: 180, borderRadius: '50%',
                background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', bottom: -40, left: -40,
                width: 140, height: 140, borderRadius: '50%',
                background: `radial-gradient(circle, ${accent}0A 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
              {/* Top shimmer line */}
              <div style={{
                position: 'absolute', top: 0, left: '8%', right: '8%', height: 1,
                background: `linear-gradient(90deg, transparent, ${accent}70, transparent)`,
              }} />

              {/* div 3 — content layer: sits above decorations via zIndex */}
              <div style={{
                padding: '18px 20px 14px',
                display: 'flex', flexDirection: 'column',
                height: '100%', boxSizing: 'border-box',
                justifyContent: 'space-between',
                position: 'relative', zIndex: 1,
              }}>
                {/* TOP: name + title + avatar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: serif, fontSize: 18,
                      color: '#F8F4EE', lineHeight: 1.15, fontWeight: 400,
                      marginBottom: 4,
                    }}>
                      {data.cardName}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 8.5, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: accent, fontFamily: mono,
                    }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: accent }} />
                      {data.cardTitle}
                    </div>
                  </div>

                  {/* Avatar with pulse ring */}
                  <div style={{ position: 'relative', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{
                      position: 'absolute', inset: -3, borderRadius: '50%',
                      border: `1.5px solid ${accent}45`,
                      animation: 'cp_ringPulse 3s ease-in-out infinite',
                    }} />
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      border: `1.5px solid ${accent}60`,
                      background: `linear-gradient(135deg, #1C1C22, #111116)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, color: `${accent}90`,
                      fontFamily: serif, fontWeight: 400,
                    }}>
                      {data.cardName ? data.cardName[0] : '?'}
                    </div>
                  </div>
                </div>

                {/* MIDDLE: social platform icon row */}
                <div style={{ display: 'flex', gap: 5 }}>
                  {demoSocials.map((s, i) => (
                    <div key={i} style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: `${accent}12`, border: `1px solid ${accent}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 9, color: accent, fontFamily: mono, fontWeight: 700 }}>
                        {SOCIAL_ICONS[s.platform]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* BOTTOM: tagline + mini QR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 8.5, color: 'rgba(255,255,255,0.35)',
                      fontFamily: mono, letterSpacing: '0.03em',
                      lineHeight: 1.4, maxWidth: 160,
                    }}>
                      {data.tagline}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 5,
                      background: '#fff', overflow: 'hidden', padding: 2,
                      border: `1px solid ${accent}30`, opacity: 0.75,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrApiUrl}
                        alt="QR"
                        style={{ width: '100%', height: '100%', display: 'block' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                    <div style={{ fontSize: 6.5, color: `${accent}50`, fontFamily: mono, letterSpacing: '0.08em' }}>
                      flip ↻
                    </div>
                  </div>
                </div>
              </div>{/* end div 3 */}
            </div>{/* end div 2 */}
          </div>{/* end div 1 — FRONT */}

          {/* ════════════════ BACK ════════════════ */}
          {/* div 1 — face wrapper */}
          <div style={{
            position: 'absolute', inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg) translateZ(0.01px)',
          }}>
            {/* div 2 — glass shell */}
            <div style={{
              width: '100%', height: '100%',
              background: `linear-gradient(135deg, rgba(22,22,26,0.95) 0%, rgba(10,10,14,0.98) 100%)`,
              border: `1px solid ${accent}35`,
              borderRadius: 18,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07)`,
            }}>
              {/* Bottom accent line */}
              <div style={{
                position: 'absolute', bottom: 0, left: '5%', right: '5%', height: 1,
                background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
              }} />

              {/* div 3 — content layer */}
              <div style={{
                padding: '14px 16px',
                display: 'flex', gap: 14,
                height: '100%', boxSizing: 'border-box',
                position: 'relative', zIndex: 1,
              }}>
                {/* LEFT: QR code block */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center', marginBottom: 2 }}>
                    <div style={{ fontFamily: serif, fontSize: 10, color: '#F8F4EE' }}>
                      {data.cardName}
                    </div>
                    <div style={{ fontSize: 7, color: accent, fontFamily: mono, letterSpacing: '0.1em' }}>
                      {data.cardTitle}
                    </div>
                  </div>
                  <div style={{
                    width: 80, height: 80,
                    background: '#fff',
                    borderRadius: 8, overflow: 'hidden', padding: 4,
                    border: `1.5px solid ${accent}40`,
                    boxShadow: `0 0 12px ${accent}18`,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrApiUrl}
                      alt="QR Code"
                      style={{ width: '100%', height: '100%', display: 'block' }}
                      onError={e => {
                        const p = (e.target as HTMLImageElement).parentElement
                        if (p) p.innerHTML = `<span style="font-size:7px;color:${accent};font-family:monospace;word-break:break-all;text-align:center;padding:4px;line-height:1.4;display:flex;align-items:center;height:100%;">${portfolioUrl.replace('https://', '')}</span>`
                      }}
                    />
                  </div>
                  <div style={{
                    fontSize: 6.5, color: `${accent}70`,
                    fontFamily: mono, letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    scan me
                  </div>
                </div>

                {/* RIGHT: contact + social */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                  {/* Contact rows */}
                  <div>
                    <div style={{
                      fontSize: 7, color: `${accent}80`, fontFamily: mono,
                      letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 7,
                    }}>
                      Contact
                    </div>
                    {[
                      { icon: '✉', val: `${data.cardName?.toLowerCase().replace(/\s+/g, '.')}@email.com` },
                      { icon: '⌂', val: portfolioUrl.replace('https://', '') },
                    ].map((row, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <span style={{ fontSize: 10, color: `${accent}70`, width: 16, textAlign: 'center' }}>
                          {row.icon}
                        </span>
                        <span style={{
                          fontSize: 8.5, color: '#B0A89E', fontFamily: mono,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {row.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Social pills */}
                  <div>
                    <div style={{
                      fontSize: 7, color: `${accent}80`, fontFamily: mono,
                      letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 5,
                    }}>
                      Connect
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {demoSocials.map((s, i) => (
                        <div key={i} className="cp-social-btn" style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '3px 7px', borderRadius: 20,
                          background: `${accent}10`, border: `1px solid ${accent}28`,
                          fontSize: 8, color: accent, fontFamily: mono,
                          cursor: 'pointer', transition: 'all 0.2s',
                        }}>
                          <span style={{ fontSize: 8 }}>{SOCIAL_ICONS[s.platform]}</span>
                          {s.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>{/* end div 3 */}
            </div>{/* end div 2 */}
          </div>{/* end div 1 — BACK */}

        </div>{/* end flip wrapper */}
      </div>{/* end perspective container */}

      {/* ── Flip indicator dots ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
        <div
          onClick={() => setFlipped(false)}
          style={{
            width: flipped ? 8 : 18, height: 5, borderRadius: 3,
            background: flipped ? `${accent}40` : accent,
            cursor: 'pointer', transition: 'all 0.3s ease',
          }}
        />
        <div
          onClick={() => setFlipped(true)}
          style={{
            width: flipped ? 18 : 8, height: 5, borderRadius: 3,
            background: flipped ? accent : `${accent}40`,
            cursor: 'pointer', transition: 'all 0.3s ease',
          }}
        />
      </div>

      {/* ── Feature badges ── */}
      <div style={{
        width: '100%', maxWidth: 340,
        display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {[
          { icon: '✦', label: 'Glassmorphism design' },
          { icon: '↻', label: 'Click card to flip' },
          { icon: '◎', label: 'QR links to portfolio' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20,
            background: `${accent}0A`, border: `1px solid ${accent}22`,
            fontSize: 9, color: `${accent}90`, fontFamily: mono,
          }}>
            <span style={{ fontSize: 9 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      {/* ── Skills preview ── */}
      {data.skills && data.skills.length > 0 && (
        <div style={{ width: '100%', maxWidth: 340, marginTop: 20 }}>
          <div style={{
            fontSize: 8.5, color: `${accent}70`, fontFamily: mono,
            letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase',
          }}>
            Skills on card back
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {data.skills.slice(0, 8).map((skill, i) => (
              <span key={i} className="cp-skill-tag" style={{
                padding: '3px 9px', borderRadius: 20,
                border: `1px solid ${accent}25`,
                fontSize: 9, color: 'rgba(255,255,255,0.4)',
                fontFamily: mono, letterSpacing: '0.04em',
                transition: 'all 0.2s', cursor: 'default',
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA note ── */}
      <div style={{
        marginTop: 24, width: '100%', maxWidth: 340,
        padding: '14px 16px', borderRadius: 12,
        background: `${accent}08`, border: `1px solid ${accent}20`,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 10, color: accent,
          fontFamily: mono, letterSpacing: '0.1em', marginBottom: 4,
        }}>
          Digital Card Panel
        </div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
          Full editor with photo upload, social links & QR export is in your{' '}
          <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Settings → Digital Card</strong> tab
        </div>
      </div>

    </div>
  )
}

// FIX — accent now passed through and used in ResumePreview
const RESUME_FONTS = [
  { label: 'DM Sans',           value: "'DM Sans', sans-serif",          tag: 'Modern' },
  { label: 'Playfair',          value: "'Playfair Display', serif",       tag: 'Classic' },
  { label: 'Inter',             value: "'Inter', sans-serif",             tag: 'Clean' },
  { label: 'Libre Baskerville', value: "'Libre Baskerville', serif",      tag: 'Editorial' },
  { label: 'Cormorant',         value: "'Cormorant Garamond', serif",     tag: 'Luxe' },
  { label: 'Syne',              value: "'Syne', sans-serif",              tag: 'Bold' },
]

type ResumeLayout = 'classic' | 'sidebar' | 'executive' | 'minimal'
const RESUME_LAYOUTS: Array<{ key: ResumeLayout; label: string; desc: string }> = [
  { key: 'classic',   label: 'Classic',   desc: 'Single column, traditional' },
  { key: 'sidebar',   label: 'Sidebar',   desc: 'Two-column with accent sidebar' },
  { key: 'executive', label: 'Executive', desc: 'Bold header, ruled sections' },
  { key: 'minimal',   label: 'Minimal',   desc: 'Clean lines, generous space' },
]

function ResumePreview({ data, accent, resumeFont, onFontChange }: { data: BrandOutput; accent: string; resumeFont?: string; onFontChange?: (f: string) => void }) {
  const [resumeLayout, setResumeLayout] = React.useState<ResumeLayout>('classic')
  const bodyFont = resumeFont || "'DM Sans', sans-serif"
  const headingFont = (resumeFont || '').includes('serif') ? resumeFont! : "'Playfair Display', serif"
  const extData = data as BrandOutput & { experience?: Array<{ title: string; company: string; duration: string; bullets: string[] }>; education?: Array<{ degree: string; institution: string; year: string }> }

  const isSidebar = resumeLayout === 'sidebar'
  const isExecutive = resumeLayout === 'executive'
  const isMinimal = resumeLayout === 'minimal'

  return (
    <div style={{ background: '#F8F6F2', minHeight: '100%', fontFamily: bodyFont, color: '#1A1A1A' }}>
      {/* Font picker bar */}
      <div style={{ background: '#EEEAE4', borderBottom: '1px solid #DDD8D0', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>Font</span>
        {RESUME_FONTS.map(f => (
          <button
            key={f.value}
            onClick={() => onFontChange?.(f.value)}
            style={{
              padding: '3px 10px', fontSize: 10, cursor: 'pointer', flexShrink: 0,
              border: `1px solid ${bodyFont === f.value ? accent : '#C8C0B8'}`,
              background: bodyFont === f.value ? `${accent}18` : '#F8F6F2',
              color: bodyFont === f.value ? accent : '#555',
              borderRadius: 3, fontFamily: f.value, whiteSpace: 'nowrap',
              transition: 'border-color 0.12s, background 0.12s',
            }}
          >
            {f.label}
            <span style={{ fontSize: 8, color: '#999', marginLeft: 4, fontFamily: "'DM Mono', monospace" }}>{f.tag}</span>
          </button>
        ))}
      </div>
      {/* Layout picker bar */}
      <div style={{ background: '#E8E4DE', borderBottom: '1px solid #DDD8D0', padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>Layout</span>
        {RESUME_LAYOUTS.map(l => (
          <button
            key={l.key}
            onClick={() => setResumeLayout(l.key)}
            title={l.desc}
            style={{
              padding: '3px 12px', fontSize: 10, cursor: 'pointer', flexShrink: 0,
              border: `1px solid ${resumeLayout === l.key ? accent : '#C8C0B8'}`,
              background: resumeLayout === l.key ? `${accent}18` : '#F8F6F2',
              color: resumeLayout === l.key ? accent : '#555',
              borderRadius: 3, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap',
              transition: 'all 0.12s',
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Resume body — layout-aware */}
      {isSidebar ? (
        // SIDEBAR layout: two-column
        <div style={{ display: 'flex', minHeight: 'calc(100% - 72px)' }}>
          {/* Left sidebar */}
          <div style={{ width: 160, background: `${accent}12`, borderRight: `3px solid ${accent}`, padding: '28px 16px', flexShrink: 0 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${accent}25`, border: `2px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 22, fontFamily: headingFont, color: accent }}>
              {(data.cardName || 'U')[0]}
            </div>
            <div style={{ fontFamily: headingFont, fontSize: 14, color: '#0A0A0A', marginBottom: 2 }}>{data.cardName}</div>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>{data.cardTitle}</div>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontFamily: "'DM Mono', monospace", marginBottom: 6, borderBottom: `1px solid ${accent}30`, paddingBottom: 4 }}>Skills</div>
            {(data.skills ?? []).map(s => <div key={s} style={{ fontSize: 9, color: '#666', padding: '2px 0', fontFamily: bodyFont }}>› {s}</div>)}
          </div>
          {/* Right main */}
          <div style={{ flex: 1, padding: '28px 24px' }}>
            <ResumeSection title="Profile" accent={accent} bodyFont={bodyFont}><div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{data.bio}</div></ResumeSection>
            <ResumeSection title="Key Achievements" accent={accent} bodyFont={bodyFont}>{(data.resumeBullets ?? []).map((b, i) => <div key={i} style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 5, paddingLeft: 12, borderLeft: `2px solid ${accent}40` }}>{b}</div>)}</ResumeSection>
            {(extData.experience || []).length > 0 && (
              <ResumeSection title="Experience" accent={accent} bodyFont={bodyFont}>
                {(extData.experience || []).map((exp, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: '#1A1A1A' }}>{exp.title} — <span style={{ color: accent, fontWeight: 400 }}>{exp.company}</span></div>
                    <div style={{ fontSize: 10, color: '#999', fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>{exp.duration}</div>
                    {(exp.bullets || []).filter(Boolean).map((b, bi) => <div key={bi} style={{ fontSize: 11, color: '#666', lineHeight: 1.6, paddingLeft: 10 }}>• {b}</div>)}
                  </div>
                ))}
              </ResumeSection>
            )}
          </div>
        </div>
      ) : isExecutive ? (
        // EXECUTIVE layout: bold header with ruled sections
        <div style={{ padding: '0' }}>
          {/* Bold header band */}
          <div style={{ background: '#1A1A1A', padding: '24px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-30%', right: '-5%', width: '30%', height: '160%', borderRadius: '50%', background: `${accent}20` }} />
            <div style={{ fontFamily: headingFont, fontSize: 26, color: '#FFFFFF', marginBottom: 3 }}>{data.cardName}</div>
            <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace" }}>{data.cardTitle}</div>
          </div>
          <div style={{ padding: '24px 32px' }}>
            <ResumeSection title="Profile" accent={accent} bodyFont={bodyFont}><div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{data.bio}</div></ResumeSection>
            <ResumeSection title="Key Achievements" accent={accent} bodyFont={bodyFont}>{(data.resumeBullets ?? []).map((b, i) => <div key={i} style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 5, paddingLeft: 12, borderLeft: `3px solid ${accent}` }}>{b}</div>)}</ResumeSection>
            <ResumeSection title="Skills" accent={accent} bodyFont={bodyFont}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(data.skills ?? []).map(s => <span key={s} style={{ padding: '4px 12px', background: `${accent}12`, border: `1px solid ${accent}40`, fontSize: 10, color: '#555', borderRadius: 2 }}>{s}</span>)}
              </div>
            </ResumeSection>
          </div>
        </div>
      ) : isMinimal ? (
        // MINIMAL layout: clean, lots of space
        <div style={{ padding: '48px 48px' }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: headingFont, fontSize: 32, color: '#0A0A0A', fontWeight: 300, marginBottom: 6 }}>{data.cardName}</div>
            <div style={{ fontSize: 11, color: '#999', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>{data.cardTitle}</div>
            <div style={{ width: 32, height: 2, background: accent, marginTop: 12 }} />
          </div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 2, marginBottom: 32, fontStyle: 'italic' }}>{data.bio}</div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#BBB', fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>Achievements</div>
            {(data.resumeBullets ?? []).map((b, i) => <div key={i} style={{ fontSize: 12, color: '#555', lineHeight: 1.9, marginBottom: 8 }}>{b}</div>)}
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#BBB', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(data.skills ?? []).map(s => <span key={s} style={{ fontSize: 11, color: '#888', fontFamily: "'DM Mono', monospace" }}>{s}</span>)}
            </div>
          </div>
        </div>
      ) : (
        // CLASSIC layout (default)
        <div style={{ padding: '36px 32px' }}>
          <div style={{ marginBottom: 24, borderBottom: '1px solid #E0D8CE', paddingBottom: 20 }}>
            <div style={{ fontFamily: headingFont, fontSize: 28, color: '#0A0A0A', marginBottom: 4 }}>{data.cardName}</div>
            <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>{data.cardTitle}</div>
            <span style={{ fontSize: 10, color: '#888', fontFamily: "'DM Mono', monospace" }}>portfolio.brandsyndicate.in</span>
          </div>
          <ResumeSection title="Profile" accent={accent} bodyFont={bodyFont}><div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{data.bio}</div></ResumeSection>
          {(extData.experience || []).length > 0 && (
            <ResumeSection title="Work Experience" accent={accent} bodyFont={bodyFont}>
              {(extData.experience || []).map((exp, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A1A', fontFamily: bodyFont }}>{exp.title}</div>
                    <div style={{ fontSize: 10, color: '#999', fontFamily: "'DM Mono', monospace" }}>{exp.duration}</div>
                  </div>
                  <div style={{ fontSize: 11, color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{exp.company}</div>
                  {(exp.bullets || []).filter(Boolean).map((b, bi) => <div key={bi} style={{ fontSize: 11, color: '#666', lineHeight: 1.6, paddingLeft: 12, borderLeft: `2px solid ${accent}30`, marginBottom: 3 }}>{b}</div>)}
                </div>
              ))}
            </ResumeSection>
          )}
          <ResumeSection title="Key Achievements" accent={accent} bodyFont={bodyFont}>{(data.resumeBullets ?? []).map((b, i) => <div key={i} style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 5, paddingLeft: 12, borderLeft: `2px solid ${accent}40` }}>{b}</div>)}</ResumeSection>
          {(extData.education || []).length > 0 && (
            <ResumeSection title="Education" accent={accent} bodyFont={bodyFont}>
              {(extData.education || []).map((edu, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A1A', fontFamily: bodyFont }}>{edu.degree}</div>
                    <div style={{ fontSize: 10, color: '#999', fontFamily: "'DM Mono', monospace" }}>{edu.year}</div>
                  </div>
                  <div style={{ fontSize: 11, color: accent, fontFamily: "'DM Mono', monospace" }}>{edu.institution}</div>
                </div>
              ))}
            </ResumeSection>
          )}
          <ResumeSection title="Skills" accent={accent} bodyFont={bodyFont}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(data.skills ?? []).map(s => <span key={s} style={{ padding: '3px 10px', border: `1px solid ${accent}40`, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', fontFamily: bodyFont }}>{s}</span>)}
            </div>
          </ResumeSection>
          <div style={{ marginTop: 20, padding: '10px 14px', background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: 4, fontSize: 10, color: '#888', fontFamily: "'DM Mono', monospace" }}>
            ✦ Add education, experience, photo &amp; choose format in the <a href="/resume/edit" style={{ color: accent, textDecoration: 'none' }}>Resume Editor →</a>
          </div>
        </div>
      )}
    </div>
  )
}

function ResumeSection({ title, accent, bodyFont, children }: { title: string; accent: string; bodyFont?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 10, borderBottom: '1px solid #E0D8CE', paddingBottom: 6 }}>{title}</div>
      <div style={{ fontFamily: bodyFont || "'DM Sans', sans-serif" }}>{children}</div>
    </div>
  )
}

// ── SlideImageInline — fetches a real Pexels photo ──────────────────────────
function SlideImageInline({
  query, accent, style,
}: {
  query: string
  accent: string
  style?: React.CSSProperties
}) {
  const [src, setSrc] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    let cancelled = false
    setLoading(true); setSrc(null)
    fetch(`/api/image?query=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d?.url) setSrc(d.url) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [query])

  const base: React.CSSProperties = {
    width: '100%', height: '100%', objectFit: 'cover' as const,
    display: 'block', ...style,
  }
  if (loading || !src) {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: `linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        ...style,
      }}>
        <div style={{
          fontSize: 10, color: accent + '60', letterSpacing: '0.12em',
          fontFamily: "'DM Mono', monospace",
          animation: loading ? 'bs_pulse 1.4s ease-in-out infinite' : 'none',
        }}>
          {loading ? '● loading image' : '📷 ' + query}
        </div>
      </div>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={query} style={base} />
}

// ── Shared decorative elements for slide previews ─────────────────────────
function SlideDecorations({ accent, variant = 'corner' }: { accent: string; variant?: 'corner' | 'side' | 'center' | 'minimal' }) {
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
      {/* Medium circle offset */}
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
          {[0,1,2].map(gx => [0,1].map(gy => (
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
          {/* Right edge bar */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: '1.2%',
            background: `${accent}30`,
            pointerEvents: 'none', zIndex: 0,
          }} />
          {/* Horizontal mid band */}
          <div style={{
            position: 'absolute', top: '50%', left: 0, right: 0,
            height: '0.4%',
            background: `${accent}25`,
            pointerEvents: 'none', zIndex: 0,
          }} />
        </>
      )}
    </>
  )
}

// ── Real slide components by layoutType ───────────────────────────────────

interface RealSlideProps {
  slide: BrandOutput['presentationSlides'][number] & { heading?: string; title?: string }
  index: number
  accent: string
  isHook?: boolean
  hookText?: string
  themeBg?: string
  themeText?: string
  themeMuted?: string
}

function RealSlide({ slide, index, accent, isHook, hookText, themeBg = '#0A0A0A', themeText = '#F8F4EE', themeMuted = '#A09890' }: RealSlideProps) {
  const heading = isHook
    ? hookText ?? ''
    : (slide.heading ?? (slide as unknown as { title?: string }).title ?? '')
  const layout = isHook ? 'hook' : (slide.layoutType ?? 'split-left')
  const num = String(index + 1).padStart(2, '0')

  // Shared label pill
  const LabelPill = () => (
    <div style={{
      position: 'absolute', top: 12, left: 12,
      display: 'flex', alignItems: 'center', gap: 6, zIndex: 2,
    }}>
      <span style={{
        fontSize: 9, letterSpacing: '0.18em', color: accent,
        fontFamily: "'DM Mono', monospace", opacity: 0.7,
      }}>{num}</span>
      <span style={{
        fontSize: 8, letterSpacing: '0.12em', color: '#555',
        fontFamily: "'DM Mono', monospace",
        background: accent + '18', padding: '1px 6px', borderRadius: 2,
        textTransform: 'uppercase',
      }}>{layout}</span>
    </div>
  )

  // ── HOOK / TITLE-ONLY ──────────────────────────────────────────────────
  if (layout === 'hook' || layout === 'title-only') {
    return (
      <div style={{
        position: 'relative', width: '100%', paddingTop: '56.25%',
        background: themeBg, overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}30`,
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <SlideDecorations accent={accent} variant="corner" />
        </div>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          zIndex: 2,
        }} />
        {/* Bottom accent line */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
          zIndex: 2,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '10% 12%', textAlign: 'center', zIndex: 1,
        }}>
          <LabelPill />
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(14px, 3.2vw, 28px)',
            color: themeText, lineHeight: 1.3, fontWeight: 400,
          }}>
            {heading}
          </div>
          {slide.subheading && (
            <div style={{
              marginTop: '4%', fontSize: 'clamp(9px, 1.4vw, 13px)',
              color: themeMuted, fontStyle: 'italic', lineHeight: 1.5,
            }}>
              {slide.subheading}
            </div>
          )}
          {/* Bottom accent dot */}
          <div style={{
            position: 'absolute', bottom: '8%',
            width: 24, height: 2, background: accent, borderRadius: 1,
          }} />
        </div>
      </div>
    )
  }

  // ── HERO ──────────────────────────────────────────────────────────────
  if (layout === 'hero') {
    return (
      <div style={{
        position: 'relative', width: '100%', paddingTop: '56.25%',
        background: themeBg, overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}20`,
      }}>
        <LabelPill />
        {/* Decorative elements (shown when no image) */}
        {!slide.imageQuery && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <SlideDecorations accent={accent} variant="corner" />
          </div>
        )}
        {/* Full-bleed image */}
        {slide.imageQuery && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <SlideImageInline query={slide.imageQuery} accent={accent} />
            {/* Dark overlay so text is readable */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)',
            }} />
          </div>
        )}
        {/* Text at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '6% 8%', zIndex: 1,
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(14px, 3vw, 26px)',
            color: themeText, lineHeight: 1.25, fontWeight: 400,
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          }}>
            {heading}
          </div>
          {slide.subheading && (
            <div style={{
              marginTop: '2%', fontSize: 'clamp(9px, 1.3vw, 12px)',
              color: accent, letterSpacing: '0.06em',
              textShadow: '0 1px 6px rgba(0,0,0,0.8)',
            }}>
              {slide.subheading}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── SPLIT-LEFT / SPLIT-RIGHT ──────────────────────────────────────────
  if (layout === 'split-left' || layout === 'split-right') {
    const imgLeft = layout === 'split-left' ? false : true  // image on which side
    const TextCol = () => (
      <div style={{
        flex: '0 0 55%', padding: '8% 6%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <SlideDecorations accent={accent} variant={imgLeft ? 'minimal' : 'corner'} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(12px, 2.2vw, 20px)',
            color: themeText, lineHeight: 1.3, marginBottom: '4%',
          }}>{heading}</div>
          {slide.subheading && (
            <div style={{ fontSize: 'clamp(8px, 1.1vw, 11px)', color: accent, marginBottom: '3%', fontStyle: 'italic' }}>
              {slide.subheading}
            </div>
          )}
          {slide.body && (
            <div style={{ fontSize: 'clamp(8px, 1.1vw, 11px)', color: themeMuted, lineHeight: 1.7 }}>
              {slide.body}
            </div>
          )}
        </div>
      </div>
    )
    const ImgCol = () => (
      <div style={{ flex: '0 0 45%', position: 'relative', overflow: 'hidden' }}>
        {slide.imageQuery
          ? <SlideImageInline query={slide.imageQuery} accent={accent} />
          : (
            <>
              <div style={{ width: '100%', height: '100%', background: `${accent}0A` }} />
              <SlideDecorations accent={accent} variant="side" />
            </>
          )
        }
      </div>
    )
    return (
      <div style={{
        position: 'relative', width: '100%', paddingTop: '56.25%',
        background: themeBg, overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}20`,
      }}>
        <LabelPill />
        {/* Vertical divider line */}
        <div style={{
          position: 'absolute',
          left: imgLeft ? '45%' : '55%', top: 0, bottom: 0,
          width: '0.4%', background: `linear-gradient(to bottom, transparent, ${accent}60, transparent)`,
          zIndex: 2,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: imgLeft ? 'row-reverse' : 'row',
        }}>
          <TextCol />
          <ImgCol />
        </div>
      </div>
    )
  }

  // ── STATS ────────────────────────────────────────────────────────────
  if (layout === 'stats') {
    return (
      <div style={{
        position: 'relative', width: '100%', paddingTop: '56.25%',
        background: themeBg, overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}20`,
      }}>
        <LabelPill />
        <SlideDecorations accent={accent} variant="side" />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '8% 10%', zIndex: 1,
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(12px, 2vw, 18px)',
            color: themeText, marginBottom: '6%', textAlign: 'center',
          }}>{heading}</div>
          {slide.stats && slide.stats.length > 0 && (
            <div style={{ display: 'flex', gap: '4%', width: '100%', justifyContent: 'center' }}>
              {slide.stats.map((stat, j) => (
                <div key={j} style={{
                  flex: 1, background: `${accent}08`,
                  border: `1px solid ${accent}40`, borderRadius: 4,
                  padding: '4% 2%', textAlign: 'center',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Stat card inner circle decoration */}
                  <div style={{
                    position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
                    width: '80%', height: '80%', borderRadius: '50%',
                    background: `${accent}12`, pointerEvents: 'none',
                  }} />
                  <div style={{
                    fontSize: 'clamp(18px, 3.5vw, 36px)',
                    color: accent, fontFamily: "'DM Mono', monospace",
                    lineHeight: 1, position: 'relative', zIndex: 1,
                  }}>{stat.value}</div>
                  <div style={{
                    fontSize: 'clamp(7px, 0.9vw, 10px)',
                    color: themeMuted, letterSpacing: '0.08em', marginTop: '6%',
                    textTransform: 'uppercase', position: 'relative', zIndex: 1,
                  }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── BULLETS ──────────────────────────────────────────────────────────
  if (layout === 'bullets') {
    return (
      <div style={{
        position: 'relative', width: '100%', paddingTop: '56.25%',
        background: themeBg, overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}20`,
      }}>
        <LabelPill />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'row',
        }}>
          {/* Text side */}
          <div style={{
            flex: slide.imageQuery ? '0 0 58%' : '1',
            padding: '8% 6%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(12px, 2vw, 18px)',
              color: themeText, marginBottom: '5%',
            }}>{heading}</div>
            {slide.bullets && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3%' }}>
                {slide.bullets.map((b, j) => (
                  <div key={j} style={{ display: 'flex', gap: '3%', alignItems: 'flex-start' }}>
                    <span style={{ color: accent, flexShrink: 0, fontSize: 'clamp(8px, 1.2vw, 12px)', marginTop: '0.1em' }}>›</span>
                    <span style={{ fontSize: 'clamp(8px, 1.1vw, 11px)', color: themeMuted, lineHeight: 1.6 }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Optional image side */}
          {slide.imageQuery && (
            <div style={{ flex: '0 0 42%', position: 'relative', overflow: 'hidden' }}>
              <SlideImageInline query={slide.imageQuery} accent={accent} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to right, rgba(10,10,10,0.5) 0%, transparent 40%)',
              }} />
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── QUOTE ────────────────────────────────────────────────────────────
  if (layout === 'quote') {
    return (
      <div style={{
        position: 'relative', width: '100%', paddingTop: '56.25%',
        background: `linear-gradient(135deg, ${themeBg} 0%, ${accent}0A 100%)`,
        overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}30`,
      }}>
        <LabelPill />
        <SlideDecorations accent={accent} variant="corner" />
        {/* Big decorative quote mark */}
        <div style={{
          position: 'absolute', top: '10%', left: '8%',
          fontSize: 'clamp(60px, 12vw, 120px)', color: accent, opacity: 0.08,
          fontFamily: "'Playfair Display', serif", lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none', zIndex: 1,
        }}>"</div>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '12% 14%', textAlign: 'center', zIndex: 2,
        }}>
          {heading && heading !== slide.quote && (
            <div style={{
              fontSize: 'clamp(9px, 1.2vw, 12px)', color: accent,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              fontFamily: "'DM Mono', monospace", marginBottom: '4%',
            }}>{heading}</div>
          )}
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(11px, 1.8vw, 17px)',
            color: themeText, lineHeight: 1.6, fontStyle: 'italic',
          }}>
            &ldquo;{slide.quote ?? slide.body}&rdquo;
          </div>
          {slide.attribution && (
            <div style={{
              marginTop: '5%', fontSize: 'clamp(8px, 1vw, 10px)',
              color: accent, letterSpacing: '0.1em',
            }}>— {slide.attribution}</div>
          )}
        </div>
      </div>
    )
  }

  // ── GRID ─────────────────────────────────────────────────────────────
  if (layout === 'grid') {
    return (
      <div style={{
        position: 'relative', width: '100%', paddingTop: '56.25%',
        background: themeBg, overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}20`,
      }}>
        <LabelPill />
        <SlideDecorations accent={accent} variant="corner" />
        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1.2%',
          background: `linear-gradient(90deg, ${accent}, ${accent}40, transparent)`,
          zIndex: 1,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          padding: '8% 6%', display: 'flex', flexDirection: 'column', zIndex: 1,
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(12px, 2vw, 18px)',
            color: themeText, marginBottom: '4%',
          }}>{heading}</div>
          {slide.cards && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(slide.cards.length, 3)}, 1fr)`,
              gap: '3%', flex: 1,
            }}>
              {slide.cards.map((card, j) => (
                <div key={j} style={{
                  background: `${accent}08`, border: `1px solid ${accent}25`,
                  borderRadius: 3, padding: '5% 6%',
                  display: 'flex', flexDirection: 'column',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Card top accent line */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '4%',
                    background: accent, borderRadius: '3px 3px 0 0',
                  }} />
                  <div style={{
                    fontSize: 'clamp(9px, 1.3vw, 12px)',
                    color: themeText, marginBottom: '8%', fontWeight: 500,
                    marginTop: '6%',
                  }}>{card.title}</div>
                  <div style={{
                    fontSize: 'clamp(7px, 1vw, 10px)',
                    color: themeMuted, lineHeight: 1.6, flex: 1,
                  }}>{card.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── FALLBACK (content / unknown layoutType) ───────────────────────────
  return (
    <div style={{
      position: 'relative', width: '100%', paddingTop: '56.25%',
      background: themeBg, overflow: 'hidden', borderRadius: 4,
      border: `1px solid ${accent}20`,
    }}>
      <LabelPill />
      <SlideDecorations accent={accent} variant="corner" />
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '0.8%',
        background: `linear-gradient(to bottom, ${accent}, ${accent}30)`,
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '8% 10%', zIndex: 1,
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(12px, 2.2vw, 20px)',
          color: themeText, lineHeight: 1.35, marginBottom: '4%',
        }}>{heading}</div>
        {slide.subheading && (
          <div style={{ fontSize: 'clamp(9px, 1.2vw, 12px)', color: accent, marginBottom: '3%', fontStyle: 'italic' }}>
            {slide.subheading}
          </div>
        )}
        {slide.body && (
          <div style={{ fontSize: 'clamp(8px, 1.1vw, 11px)', color: themeMuted, lineHeight: 1.7 }}>
            {slide.body}
          </div>
        )}
        {slide.imageQuery && (
          <div style={{ marginTop: '4%', flex: 1, position: 'relative', overflow: 'hidden', borderRadius: 2, maxHeight: '35%' }}>
            <SlideImageInline query={slide.imageQuery} accent={accent} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── PresentationPreview ───────────────────────────────────────────────────
// Renders proper 16:9 slide thumbnails for each slide, with layout-aware
// components. No API/DB dependency — pure client render from BrandOutput.

const PRES_THEMES: Array<{ key: string; label: string; bg: string; accent: string; text: string }> = [
  { key: 'noir',      label: 'Noir',      bg: '#0A0A0B', accent: '#C9A84C', text: '#F8F4EE' },
  { key: 'corporate', label: 'Corporate', bg: '#0D1B2A', accent: '#4A9EFF', text: '#E8F4FD' },
  { key: 'minimal',   label: 'Minimal',   bg: '#FAFAFA', accent: '#1A1A1A', text: '#1A1A1A' },
  { key: 'bold',      label: 'Bold',      bg: '#1A0A2E', accent: '#FF6B35', text: '#FFFFFF' },
  { key: 'warm',      label: 'Warm',      bg: '#2C1810', accent: '#E8A87C', text: '#F5E6D3' },
  { key: 'ocean',     label: 'Ocean',     bg: '#0A1628', accent: '#00C9A7', text: '#E0F7F4' },
]

const PRES_FONTS: Array<{ key: string; label: string; sample: string }> = [
  { key: 'georgia-arial',        label: 'Classic',   sample: 'Gg' },
  { key: 'playfair-lato',        label: 'Editorial', sample: 'Gg' },
  { key: 'montserrat-opensans',  label: 'Modern',    sample: 'Gg' },
  { key: 'dmserif-karla',        label: 'Refined',   sample: 'Gg' },
  { key: 'raleway-mulish',       label: 'Clean',     sample: 'Gg' },
]

function PresentationPreview({ data, accent, genId }: {
  data: BrandOutput; accent: string; genId?: string | null
}) {
  const [creating, setCreating] = React.useState(false)
  const [activeIdx, setActiveIdx] = React.useState(0)
  const [selectedTheme, setSelectedTheme] = React.useState(data.presentationTheme ?? 'noir')
  const [selectedFont, setSelectedFont] = React.useState(data.presentationFontPair ?? 'georgia-arial')

  // Build the flat slides array: hook slide first, then content slides
  const allSlides: Array<{ isHook?: boolean; slide: BrandOutput['presentationSlides'][number]; hookText?: string }> = [
    { isHook: true, slide: {} as BrandOutput['presentationSlides'][number], hookText: data.presentationHook },
    ...(data.presentationSlides ?? []).map(s => ({ slide: s })),
  ]

  const active = allSlides[activeIdx]

  return (
    <div style={{
      background: '#09090A',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @keyframes bs_pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @media (max-width: 640px) {
          .pv-layout { flex-direction: column !important; }
          .pv-filmstrip { flex-direction: row !important; width: 100% !important; min-width: unset !important; max-width: unset !important; overflow-x: auto !important; overflow-y: hidden !important; padding: 8px !important; gap: 8px !important; }
          .pv-filmstrip-thumb { width: 100px !important; flex-shrink: 0 !important; }
          .pv-main-stage { padding: 12px !important; }
        }
      `}</style>

      {/* ── Main layout: filmstrip + stage ───────────────────── */}
      <div className="pv-layout" style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* Filmstrip — vertical thumbnail rail */}
        <div className="pv-filmstrip" style={{
          width: 130, minWidth: 130, maxWidth: 130,
          overflowY: 'auto', overflowX: 'hidden',
          background: '#0f0f0f',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 8px',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {allSlides.map((item, idx) => {
            const isActive = activeIdx === idx
            const thumbHeading = item.isHook
              ? item.hookText ?? ''
              : (item.slide.heading ?? (item.slide as unknown as { title?: string }).title ?? '')
            return (
              <div
                key={idx}
                className="pv-filmstrip-thumb"
                onClick={() => setActiveIdx(idx)}
                style={{
                  cursor: 'pointer',
                  border: `1px solid ${isActive ? accent + '80' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 3, overflow: 'hidden',
                  outline: isActive ? `1px solid ${accent}50` : 'none',
                  outlineOffset: 1,
                  transition: 'border-color 0.15s',
                }}
              >
                {/* Mini 16:9 thumbnail — fixed px so scale transform works */}
                {(() => {
                  const th = PRES_THEMES.find(t => t.key === selectedTheme) ?? PRES_THEMES[0]
                  // Outer container: 100px wide × 56.25px tall (16:9)
                  return (
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden', background: th.bg, borderRadius: 3 }}>
                      {/* Inner fixed-size div that we scale down — 800×450 scaled to ~100×56 = scale 0.125 */}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 800, height: 450, transform: 'scale(0.125)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                          <div style={{ width: 800, height: 450, overflow: 'hidden', position: 'relative' }}>
                            <RealSlide
                              slide={item.slide}
                              index={idx}
                              accent={th.accent}
                              isHook={item.isHook}
                              hookText={item.hookText}
                              themeBg={th.bg}
                              themeText={th.text}
                              themeMuted={th.text + 'AA'}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Active indicator line */}
                      {isActive && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: th.accent, zIndex: 10 }} />
                      )}
                    </div>
                  )
                })()}
                {/* Slide number below thumb */}
                <div style={{
                  background: isActive ? accent + '18' : 'transparent',
                  padding: '2px 5px',
                  fontSize: 7, color: isActive ? accent : '#555',
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: '0.1em', textAlign: 'center',
                  transition: 'background 0.15s',
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Main stage — large active slide */}
        <div className="pv-main-stage" style={{
          flex: 1, overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: 12,
          minWidth: 0,
        }}>
          {/* Slide counter */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: 9, color: '#555', fontFamily: "'DM Mono', monospace",
              letterSpacing: '0.14em',
            }}>
              SLIDE {String(activeIdx + 1).padStart(2, '0')} / {String(allSlides.length).padStart(2, '0')}
            </span>
            {/* Prev / Next */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
                style={{
                  background: 'transparent', border: `1px solid ${accent}40`,
                  color: activeIdx === 0 ? '#333' : accent, borderRadius: 2,
                  width: 22, height: 22, fontSize: 12, cursor: activeIdx === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >‹</button>
              <button
                onClick={() => setActiveIdx(i => Math.min(allSlides.length - 1, i + 1))}
                disabled={activeIdx === allSlides.length - 1}
                style={{
                  background: 'transparent', border: `1px solid ${accent}40`,
                  color: activeIdx === allSlides.length - 1 ? '#333' : accent, borderRadius: 2,
                  width: 22, height: 22, fontSize: 12, cursor: activeIdx === allSlides.length - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >›</button>
            </div>
          </div>

          {/* The active slide rendered at full size — contained wrapper prevents overflow bleeding */}
          {(() => {
            const th = PRES_THEMES.find(t => t.key === selectedTheme) ?? PRES_THEMES[0]
            const hasImage = active.slide?.imageQuery
            return (
              <div style={{ width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 4 }}>
                <RealSlide
                  key={activeIdx + selectedTheme}
                  slide={active.slide}
                  index={activeIdx}
                  accent={th.accent}
                  isHook={active.isHook}
                  hookText={active.hookText}
                  themeBg={th.bg}
                  themeText={th.text}
                  themeMuted={th.text + 'AA'}
                />
                {/* Image change overlay — only for slides with image or that support images */}
                {!active.isHook && (
                  <button
                    onClick={() => {
                      const currentQuery = active.slide?.imageQuery || ''
                      const newQuery = prompt('Change slide image (enter search term):', currentQuery)
                      if (newQuery !== null && newQuery.trim()) {
                        // Update local state
                        const updated = { ...active.slide, imageQuery: newQuery.trim() }
                        if (data.presentationSlides && activeIdx > 0) {
                          data.presentationSlides[activeIdx - 1] = updated as typeof data.presentationSlides[number]
                        }
                        // Force re-render by toggling theme briefly
                        setSelectedTheme(s => s)
                      }
                    }}
                    style={{
                      position: 'absolute', bottom: 8, right: 8,
                      background: 'rgba(0,0,0,0.7)', border: `1px solid ${th.accent}60`,
                      color: th.accent, borderRadius: 4, padding: '4px 10px',
                      fontSize: 9, cursor: 'pointer', letterSpacing: '0.08em',
                      backdropFilter: 'blur(6px)', zIndex: 10,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <rect x="1" y="1" width="8" height="7" rx="1" stroke="currentColor" strokeWidth="1"/>
                      <circle cx="3.5" cy="3.5" r="0.8" fill="currentColor"/>
                      <path d="M1 7l2.5-2.5L5 6l2-2L9 7" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
                    </svg>
                    {hasImage ? 'Change Image' : 'Add Image'}
                  </button>
                )}
              </div>
            )
          })()}

          {/* Keyboard hint */}
          <div style={{
            fontSize: 8, color: '#333', letterSpacing: '0.12em',
            fontFamily: "'DM Mono', monospace", textAlign: 'center',
          }}>
            CLICK THUMBNAIL · USE ‹ › TO NAVIGATE
          </div>
        </div>
      </div>

      {/* ── Theme + Font picker bar ─────────────────────────── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#0c0c0d',
        padding: '10px 16px',
      }}>
        {/* Theme row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 8, color: '#444', letterSpacing: '0.14em', fontFamily: "'DM Mono',monospace", flexShrink: 0, textTransform: 'uppercase' }}>Theme</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {PRES_THEMES.map(t => (
              <button
                key={t.key}
                title={t.label}
                onClick={() => setSelectedTheme(t.key)}
                style={{
                  width: 22, height: 22, borderRadius: 3, border: selectedTheme === t.key ? `2px solid ${t.accent}` : '2px solid transparent',
                  background: t.bg, cursor: 'pointer', position: 'relative', flexShrink: 0,
                  boxShadow: selectedTheme === t.key ? `0 0 6px ${t.accent}60` : 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent, opacity: 0.9 }} />
              </button>
            ))}
            <span style={{ fontSize: 9, color: '#666', fontFamily: "'DM Mono',monospace", alignSelf: 'center', marginLeft: 2 }}>
              {PRES_THEMES.find(t => t.key === selectedTheme)?.label ?? ''}
            </span>
          </div>
        </div>
        {/* Font row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 8, color: '#444', letterSpacing: '0.14em', fontFamily: "'DM Mono',monospace", flexShrink: 0, textTransform: 'uppercase' }}>Font</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {PRES_FONTS.map(f => (
              <button
                key={f.key}
                title={f.label}
                onClick={() => setSelectedFont(f.key)}
                style={{
                  padding: '2px 8px', borderRadius: 2, border: `1px solid ${selectedFont === f.key ? accent : 'rgba(255,255,255,0.1)'}`,
                  background: selectedFont === f.key ? `${accent}18` : 'transparent',
                  color: selectedFont === f.key ? accent : '#555', cursor: 'pointer',
                  fontSize: 8, letterSpacing: '0.08em', fontFamily: "'DM Mono',monospace",
                  textTransform: 'uppercase', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA bar ────────────────────────────────────────────── */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: '#0f0f0f',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#F8F4EE', marginBottom: 2 }}>
            {allSlides.length} slides generated
          </div>
          <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.06em' }}>
            Pick a theme above · export as PPTX in the editor
          </div>
        </div>
        <button
          disabled={creating}
          onClick={async () => {
            const storageKey = genId ? `bs_pres_${genId}` : null
            const existingPid = storageKey ? sessionStorage.getItem(storageKey) : null
            if (existingPid) { window.location.href = `/presentations/${existingPid}`; return }
            setCreating(true)
            try {
              const res = await fetch('/api/presentation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: 'My Presentation',
                  accentColor: accent,
                  generationId: genId ?? undefined,
                  presentationHook: data.presentationHook,
                  presentationTheme: selectedTheme,
                  presentationFontPair: selectedFont,
                  presentationSlides: (data.presentationSlides ?? []).map(s => ({
                    layoutType:  s.layoutType  ?? 'split-left',
                    heading:     s.heading     ?? '',
                    subheading:  s.subheading,
                    body:        s.body,
                    imageQuery:  s.imageQuery  ?? '',
                    bullets:     s.bullets,
                    stats:       s.stats,
                    quote:       s.quote,
                    attribution: s.attribution,
                    cards:       s.cards,
                  })),
                }),
              })
              if (!res.ok) {
                if (res.status === 401) {
                  window.location.href = '/login?callbackUrl=' + encodeURIComponent(window.location.pathname + window.location.search)
                  return
                }
                throw new Error(`HTTP ${res.status}`)
              }
              const created = await res.json()
              const pid = created.presentation?.id
              if (pid) {
                if (storageKey) sessionStorage.setItem(storageKey, pid)
                window.location.href = `/presentations/${pid}`
              }
            } catch (err) {
              console.error('[EditSlides]', err)
              window.location.href = '/presentations'
            } finally {
              setCreating(false)
            }
          }}
          style={{
            padding: '7px 18px', background: creating ? `${accent}70` : accent,
            color: '#000', border: 'none', cursor: creating ? 'wait' : 'pointer',
            fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
            fontFamily: "'DM Mono', monospace", fontWeight: 600, borderRadius: 2,
            whiteSpace: 'nowrap', transition: 'background 0.15s',
          }}
        >
          {creating ? 'Opening…' : 'Edit Slides →'}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// BUSINESS MODE — All types, state, and components are self-contained here.
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
}

type BizTab = 'logo' | 'banner' | 'flyer' | 'poster' | 'copy'
type BizFormTab = 'generate' | 'details' | 'style'
type BizTone = 'bold' | 'professional' | 'playful' | 'luxury'

const BIZ_STEPS = ['Analysing', 'Concepting', 'Crafting', 'Polishing', 'Ready']

const BIZ_TAB_META: Record<BizTab, { label: string; icon: string }> = {
  logo:   { label: 'Logo Concept',  icon: '◈' },
  banner: { label: 'Banner',        icon: '▭' },
  flyer:  { label: 'Flyer',         icon: '◻' },
  poster: { label: 'Poster',        icon: '◼' },
  copy:   { label: 'Copy',          icon: '✦' },
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

// ── BusinessGenerateStudio — fully self-contained ──────────────────────────
function BusinessGenerateStudio({ onSwitchMode }: { onSwitchMode: () => void }) {
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
  const [outputTypes, setOutputTypes] = React.useState<BizTab[]>(['logo', 'banner', 'flyer', 'poster', 'copy'])

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

        {/* Mode toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: 3, width: 'fit-content' }}>
          <button onClick={onSwitchMode} style={{ padding: '5px 14px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', background: 'transparent', color: 'var(--muted)', border: 'none', borderRadius: 1, fontWeight: 400, transition: 'all 0.15s' }}>Personal</button>
          <button style={{ padding: '5px 14px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', background: 'var(--gold)', color: '#000', border: 'none', borderRadius: 1, fontWeight: 600, transition: 'all 0.15s' }}>Business ✦</button>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
          <div style={{ width: 20, height: 1, background: accent }} />Business Studio
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, lineHeight: 1.15, color: 'var(--cream)', marginBottom: 10 }}>
          Build your<br /><em style={{ color: accent, fontStyle: 'italic' }}>brand identity</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, fontWeight: 300, marginBottom: 36, maxWidth: 440 }}>
          Logo concepts, marketing banners, flyers, posters, and copy — all at once.
        </p>

        {/* Form tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
          {(['generate', 'details', 'style'] as const).map(t => (
            <button key={t} onClick={() => setFormTab(t)} style={{ padding: '10px 18px 9px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: formTab === t ? accent : 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none', borderBottom: formTab === t ? `2px solid ${accent}` : '2px solid transparent', marginBottom: -1, fontFamily: "'DM Mono', monospace", transition: 'all 0.15s' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {/* GENERATE TAB */}
        {formTab === 'generate' && (
          <>
            {/* Output type toggles */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Output Assets</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(['logo', 'banner', 'flyer', 'poster', 'copy'] as BizTab[]).map(type => (
                  <div key={type} onClick={() => toggleType(type)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', border: `1px solid ${outputTypes.includes(type) ? accent : 'var(--border2)'}`, background: outputTypes.includes(type) ? 'var(--gold-dim)' : 'transparent', color: outputTypes.includes(type) ? accent : 'var(--muted)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 'var(--radius)', userSelect: 'none', transition: 'all 0.15s' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10 }}>{BIZ_TAB_META[type].icon}</span>
                    {BIZ_TAB_META[type].label}
                  </div>
                ))}
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

        {/* Generate button */}
        <button onClick={handleGenerate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 10, background: accent, border: 'none', color: '#000', padding: '12px 22px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 'var(--radius)', transition: 'all 0.2s', opacity: loading ? 0.7 : 1, marginTop: 28 }}>
          {loading
            ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block' }} />
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 3.5H13L9.5 7.5l1.5 4L7 10l-4 2.5 1.5-4L1 5.5h4.5z" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" /></svg>
          }
          {loading ? BIZ_STEPS[genStep] : 'Generate Brand Assets'}
        </button>
      </div>

      {/* ── BUSINESS PREVIEW SIDE ── */}
      <div className={`generate-preview-side${mobilePanel === 'form' ? ' mobile-hidden' : ''}`}>

        {/* Preview top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 48, borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 8, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: output ? accent : 'var(--muted2)', display: 'block', transition: 'background 0.3s', flexShrink: 0 }} />
            <span className="preview-status-label" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
              {output ? 'Live' : loading ? GEN_STEPS[genStep] : 'Ready'}
            </span>
          </div>

          {/* Asset tabs */}
          <div style={{ display: 'flex', height: 48, alignItems: 'stretch', overflowX: 'auto', flex: 1, minWidth: 0, scrollbarWidth: 'none' }}>
            {(outputTypes.length > 0 ? outputTypes : (['logo', 'banner', 'flyer', 'poster', 'copy'] as BizTab[])).map(t => (
              <button key={t} onClick={() => setPvTab(t)} style={{ display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4, flexShrink: 0, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: pvTab === t ? accent : 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none', borderBottom: pvTab === t ? `2px solid ${accent}` : '2px solid transparent', fontFamily: "'DM Mono', monospace", transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                <span style={{ fontFamily: "'DM Mono', monospace", marginRight: 2 }}>{BIZ_TAB_META[t].icon}</span>
                {BIZ_TAB_META[t].label}
              </button>
            ))}
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
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: `1px solid var(--border2)`, borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 20 }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{BIZ_STEPS[genStep]}</div>
              <div style={{ fontSize: 11, color: 'var(--muted2)' }}>Crafting your brand identity…</div>
            </div>
          ) : output ? (
            <>
              {pvTab === 'logo'   && outputTypes.includes('logo')   && <BizLogoPreview   data={output} accent={accent} />}
              {pvTab === 'banner' && outputTypes.includes('banner') && <BizBannerPreview data={output} accent={accent} />}
              {pvTab === 'flyer'  && outputTypes.includes('flyer')  && <BizFlyerPreview  data={output} accent={accent} />}
              {pvTab === 'poster' && outputTypes.includes('poster') && <BizPosterPreview data={output} accent={accent} />}
              {pvTab === 'copy'   && outputTypes.includes('copy')   && <BizCopyPreview   data={output} accent={accent} />}
              {/* Not-selected state */}
              {!outputTypes.includes(pvTab) && (
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
                Business Mode · {outputTypes.length} assets selected
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
