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

  async function handlePublish() {
    if (!generationId) return
    try { await publish(generationId); setShowPanel(true) } catch { /* handled */ }
  }
  function copyUrl() {
    if (!result?.url) return
    navigator.clipboard.writeText(result.url); setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (result && showPanel) {
    return (
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowPanel(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: `1px solid ${accent}`, color: accent, padding: '4px 10px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: 'var(--radius)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent, display: 'inline-block' }} />Live
        </button>
        {showPanel && (
          <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 200, background: 'var(--surface)', border: '1px solid var(--border2)', padding: 16, width: 300, borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', marginTop: 4 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Portfolio Live</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input readOnly value={result.url} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '6px 10px', fontSize: 11, borderRadius: 2, fontFamily: "'DM Mono', monospace", outline: 'none' }} />
              <button onClick={copyUrl} style={{ background: accent, color: '#000', border: 'none', padding: '6px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 2, fontWeight: 500 }}>{copied ? '✓' : 'Copy'}</button>
            </div>
            <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: accent, textDecoration: 'none', letterSpacing: '0.06em' }}>Open →</a>
          </div>
        )}
      </div>
    )
  }
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={handlePublish} disabled={!generationId || loading} style={{ background: 'transparent', border: `1px solid ${generationId ? accent : 'var(--border)'}`, color: generationId ? accent : 'var(--muted)', padding: '4px 12px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: generationId ? 'pointer' : 'not-allowed', borderRadius: 'var(--radius)', opacity: loading ? 0.6 : 1, transition: 'all 0.15s' }}>
        {loading ? '…' : 'Publish'}
      </button>
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
        <div style={{ height: 70, background: '#0A0A0A', border: `1px dashed ${accent}30`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#555', letterSpacing: '0.08em' }}>
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
        {/* Image — fetched via Pexels proxy */}
        {c.imageQuery && <SlideImage query={c.imageQuery} accent={accent} />}
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6, marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
          <MiniBtn onClick={() => onDuplicate(slide.id)}>⧉ Duplicate</MiniBtn>
          <MiniBtn onClick={() => onDelete(slide.id)} danger>✕ Delete</MiniBtn>
        </div>
      </div>
      <div onClick={() => onAdd(slide.order)} style={{ textAlign: 'center', marginTop: 3, cursor: 'pointer', fontSize: 10, color: accent, letterSpacing: '0.12em', opacity: 0, transition: 'opacity 0.15s', padding: '3px 0' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0' }}>+ Add Slide Here</div>
    </div>
  )
}

function SlideEditor({ existingPresentationId, presentationHook, presentationSlides = [], accentColor = '#C9A84C', generationId }: SlideEditorProps) {
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
        const res = await fetch('/api/presentation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'My Presentation', accentColor, generationId, presentationHook, presentationSlides: presentationSlides.map(s => ({
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
  // MOBILE FIX: separate mobile panel — 'form' or 'preview'
  const [mobilePanel, setMobilePanel] = useState<'form' | 'preview'>('form')
  const [outputTypes, setOutputTypes] = useState(['portfolio', 'card', 'resume'])
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

  // Load a previous generation if ?from=<generationId> is in the URL
  useEffect(() => {
    const fromId = searchParams.get('from')
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
          if (i.skills)    setSkills(i.skills)
          if (i.tone)      setTone(i.tone)
          if (i.templateSlug) {
            setSelectedTemplate(i.templateSlug)
            const tpl = TEMPLATES.find(t => t.slug === i.templateSlug)
            if (tpl) setPickerCategory(tpl.category)
          }
        }
        if (data.outputData) {
          setOutput(data.outputData as BrandOutput)
          setGenId(data.id)
          setGenStep(4)
          if (searchParams.get('export') === '1') setShowExport(true)
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
        body: JSON.stringify({ name, headline, tagline, jobTitle, company, location, bio, skills, tone, templateSlug: selectedTemplate, outputTypes }),
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
    if (!genId) return
    setExportLoading(format)
    try {
      const endpoint = format === 'pptx' ? '/api/export/pptx' : format === 'vcard' ? '/api/export/vcard' : '/api/export/pdf'
      const body = format === 'pptx' || format === 'vcard' ? { generationId: genId } : { generationId: genId, format }
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (format === 'vcard') {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        // BUG FIX #29: Append to DOM before clicking for mobile browser compatibility
        const a = document.createElement('a')
        a.href = url
        a.download = 'contact.vcf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else {
        const data = await res.json()
        if (data.url) window.open(data.url, '_blank')
      }
      showMsg('Export ready!')
    } catch { showMsg('Export failed') }
    finally { setExportLoading(null) }
  }

  // FIX 4: accent now derived from selectedTemplate color, not hardcoded
  const accent = TEMPLATES.find(t => t.slug === selectedTemplate)?.color ?? '#C9A84C'
  const filteredTemplates = TEMPLATES.filter(t => t.category === pickerCategory)

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }

  return (
    <div className="generate-layout">

      {/* ── FORM SIDE ── */}
      <div className={`generate-form-side${mobilePanel === 'preview' ? ' mobile-hidden' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
          <div style={{ width: 20, height: 1, background: 'var(--gold)' }} />AI Generation Studio
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,3vw,42px)', fontWeight: 400, lineHeight: 1.15, color: 'var(--cream)', marginBottom: 10 }}>
          Build your brand<br />with one <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>prompt.</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, fontWeight: 300, marginBottom: 36, maxWidth: 440 }}>
          Portfolio, business card, resume, and presentation — generated simultaneously.
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
                {['portfolio', 'card', 'resume', 'presentation'].map(type => (
                  <div key={type} onClick={() => toggleOutputType(type)} style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
                    border: `1px solid ${outputTypes.includes(type) ? 'var(--gold)' : 'var(--border2)'}`,
                    background: outputTypes.includes(type) ? 'var(--gold-dim)' : 'transparent',
                    color: outputTypes.includes(type) ? 'var(--gold)' : 'var(--muted)',
                    fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                    cursor: 'pointer', borderRadius: 'var(--radius)', userSelect: 'none', transition: 'all 0.15s',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', opacity: outputTypes.includes(type) ? 1 : 0.5, flexShrink: 0 }} />
                    {type === 'card' ? 'Biz Card' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                ))}
              </div>
            </div>

            {/* FIX 5: Template picker — categorised tabs + shows all 48, selected state always visible */}
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
                  <div key={t.slug} onClick={() => setSelectedTemplate(t.slug)} style={{ flexShrink: 0, width: 80, cursor: 'pointer' }}>
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
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe, Senior Product Designer at Stripe…"
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
                { label: 'Headline', val: headline, set: setHeadline, ph: 'e.g. Senior Product Designer' },
                { label: 'Job Title', val: jobTitle, set: setJobTitle, ph: 'e.g. VP of Engineering' },
                { label: 'Company', val: company, set: setCompany, ph: 'e.g. Stripe' },
                { label: 'Location', val: location, set: setLocation, ph: 'e.g. San Francisco, CA' },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>{f.label}</label>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Tagline</label>
              <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Your memorable value proposition" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Bio <span style={{ color: 'var(--muted2)', fontWeight: 400 }}>{bio.length}/500</span></label>
              <textarea value={bio} onChange={e => setBio(e.target.value.substring(0, 500))} rows={5} placeholder="Tell us about yourself…"
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
                placeholder="Type a skill and press Enter" style={inputStyle} />
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
        {/* Preview bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 48, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: output ? accent : 'var(--muted2)', display: 'block', transition: 'background 0.3s' }} />
            <span style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
              {output ? 'Live Preview' : 'Awaiting Generation'}
            </span>
          </div>
          {/* FIX 6: All 4 preview tabs including presentation */}
          <div style={{ display: 'flex', height: 48, alignItems: 'stretch' }}>
            {(['portfolio', 'card', 'resume', 'presentation'] as const).map(t => (
              <button key={t} onClick={() => setPvTab(t)} style={{
                display: 'flex', alignItems: 'center', padding: '0 9px', gap: 5,
                fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: pvTab === t ? accent : 'var(--muted)',
                cursor: 'pointer', background: 'none', border: 'none',
                borderBottom: pvTab === t ? `2px solid ${accent}` : '2px solid transparent',
                fontFamily: "'DM Mono', monospace", transition: 'all 0.15s',
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.6, flexShrink: 0 }} />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {output && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PublishButton generationId={genId} accent={accent} />
              <button onClick={() => setShowExport(true)} style={{ background: 'var(--gold)', border: 'none', color: '#000', padding: '4px 12px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: 'var(--radius)', fontWeight: 500 }}>
                Export
              </button>
            </div>
          )}
        </div>

        {/* Preview viewport */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '1px solid var(--border2)', borderTopColor: accent, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 20 }} />
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{GEN_STEPS[genStep]}</div>
              <div style={{ fontSize: 11, color: 'var(--muted2)' }}>QC pipeline running…</div>
            </div>
          ) : output ? (
            <>
              {pvTab === 'portfolio' && <PortfolioPreview data={output} accent={accent} />}
              {pvTab === 'card' && <CardPreview data={output} accent={accent} />}
              {pvTab === 'resume' && <ResumePreview data={output} accent={accent} />}
              {pvTab === 'resume' && (
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
              )}
              {/* Presentation uses PresentationPreview for instant display. SlideEditor
                  requires a live API/DB — only render it when user navigates to the
                  dedicated /presentations page after saving. */}
              {pvTab === 'presentation' && (
                <PresentationPreview data={output} accent={accent} genId={genId} />
              )}
            </>
          ) : (
            // FIX 8: Template-aware skeleton replaces the blank "Preview appears here"
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
        <div onClick={() => setShowExport(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} className="export-modal" style={{ background: 'var(--surface)', border: '1px solid var(--border2)', width: '100%', maxWidth: 440, padding: 32, position: 'relative', animation: 'slideUp 0.2s ease', borderRadius: 'var(--radius)' }}>
            <button onClick={() => setShowExport(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 2 }}>×</button>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--cream)', marginBottom: 6 }}>Export Brand Assets</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>Download your brand materials in multiple formats.</div>
            <div className="export-grid-2">
              {[
                { key: 'portfolio', icon: '📄', name: 'Portfolio PDF', desc: 'Full portfolio document' },
                { key: 'resume', icon: '📋', name: 'Resume PDF', desc: 'Clean resume layout' },
                { key: 'pptx', icon: '📊', name: 'Pitch Deck', desc: 'PowerPoint presentation' },
                { key: 'vcard', icon: '👤', name: 'vCard', desc: 'Digital contact card' },
              ].map(opt => (
                <div key={opt.key} onClick={() => handleExport(opt.key)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: 14, cursor: 'pointer', borderRadius: 'var(--radius)', textAlign: 'center', transition: 'border-color 0.15s' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{exportLoading === opt.key ? '⏳' : opt.icon}</div>
                  <div style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text)', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>{opt.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{opt.desc}</div>
                </div>
              ))}
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
        <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
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
        <div style={{ position: 'relative', zIndex: 1, padding: '32px 28px 28px', maxWidth: 500, animation: 'pv_fadeUp 0.75s ease both' }}>
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
        <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 0', background: 'rgba(0,0,0,0.2)', position: 'relative' }}>
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
          <div style={{
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
      {data.portfolioSections.some(s => /\d+[%+x]/.test(s.highlight)) && (
        <div style={{ background: '#111113', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '36px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 100% at 50% 50%, rgba(${aRgb},0.04) 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 24, textAlign: 'center', position: 'relative', zIndex: 1 }}>
            {data.portfolioSections.filter(s => /\d+[%+x]/.test(s.highlight)).slice(0,3).map((sec, i) => {
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
    : `https://brandsyndicate.co/p/${(data.cardName || 'user').toLowerCase().replace(/\s+/g, '-')}`

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
function ResumePreview({ data, accent }: { data: BrandOutput; accent: string }) {
  return (
    <div style={{ background: '#F8F6F2', minHeight: '100%', fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A', padding: '36px 32px' }}>
      <div style={{ marginBottom: 24, borderBottom: '1px solid #E0D8CE', paddingBottom: 20 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: '#0A0A0A', marginBottom: 4 }}>{data.cardName}</div>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>{data.cardTitle}</div>
        <span style={{ fontSize: 10, color: '#888', fontFamily: "'DM Mono', monospace" }}>portfolio.brandsyndicate.co</span>
      </div>
      <ResumeSection title="Profile" accent={accent}><div style={{ fontSize: 11, color: '#555', lineHeight: 1.7 }}>{data.bio}</div></ResumeSection>
      <ResumeSection title="Key Achievements" accent={accent}>{data.resumeBullets.map((b, i) => <div key={i} style={{ fontSize: 11, color: '#555', lineHeight: 1.7, marginBottom: 5 }}>{b}</div>)}</ResumeSection>
      <ResumeSection title="Skills" accent={accent}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {data.skills.map(s => <span key={s} style={{ padding: '3px 10px', border: `1px solid ${accent}40`, fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888' }}>{s}</span>)}
        </div>
      </ResumeSection>
    </div>
  )
}

function ResumeSection({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 10, borderBottom: '1px solid #E0D8CE', paddingBottom: 6 }}>{title}</div>
      {children}
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

// ── Real slide components by layoutType ───────────────────────────────────

interface RealSlideProps {
  slide: BrandOutput['presentationSlides'][number] & { heading?: string; title?: string }
  index: number
  accent: string
  isHook?: boolean
  hookText?: string
}

function RealSlide({ slide, index, accent, isHook, hookText }: RealSlideProps) {
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
        background: '#0A0A0A', overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}30`,
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          zIndex: 2,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '10% 12%', textAlign: 'center',
        }}>
          <LabelPill />
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(14px, 3.2vw, 28px)',
            color: '#F8F4EE', lineHeight: 1.3, fontWeight: 400,
          }}>
            {heading}
          </div>
          {slide.subheading && (
            <div style={{
              marginTop: '4%', fontSize: 'clamp(9px, 1.4vw, 13px)',
              color: '#C9B99A', fontStyle: 'italic', lineHeight: 1.5,
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
        background: '#0A0A0A', overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}20`,
      }}>
        <LabelPill />
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
          padding: '6% 8%',
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(14px, 3vw, 26px)',
            color: '#F8F4EE', lineHeight: 1.25, fontWeight: 400,
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
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(12px, 2.2vw, 20px)',
          color: '#F8F4EE', lineHeight: 1.3, marginBottom: '4%',
        }}>{heading}</div>
        {slide.subheading && (
          <div style={{ fontSize: 'clamp(8px, 1.1vw, 11px)', color: accent, marginBottom: '3%', fontStyle: 'italic' }}>
            {slide.subheading}
          </div>
        )}
        {slide.body && (
          <div style={{ fontSize: 'clamp(8px, 1.1vw, 11px)', color: '#A09890', lineHeight: 1.7 }}>
            {slide.body}
          </div>
        )}
      </div>
    )
    const ImgCol = () => (
      <div style={{ flex: '0 0 45%', position: 'relative', overflow: 'hidden' }}>
        {slide.imageQuery
          ? <SlideImageInline query={slide.imageQuery} accent={accent} />
          : <div style={{ width: '100%', height: '100%', background: '#111' }} />
        }
      </div>
    )
    return (
      <div style={{
        position: 'relative', width: '100%', paddingTop: '56.25%',
        background: '#0A0A0A', overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}20`,
      }}>
        <LabelPill />
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
        background: '#0A0A0A', overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}20`,
      }}>
        <LabelPill />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '8% 10%',
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(12px, 2vw, 18px)',
            color: '#F8F4EE', marginBottom: '6%', textAlign: 'center',
          }}>{heading}</div>
          {slide.stats && slide.stats.length > 0 && (
            <div style={{ display: 'flex', gap: '4%', width: '100%', justifyContent: 'center' }}>
              {slide.stats.map((stat, j) => (
                <div key={j} style={{
                  flex: 1, background: '#111',
                  border: `1px solid ${accent}40`, borderRadius: 4,
                  padding: '4% 2%', textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 'clamp(18px, 3.5vw, 36px)',
                    color: accent, fontFamily: "'DM Mono', monospace",
                    lineHeight: 1,
                  }}>{stat.value}</div>
                  <div style={{
                    fontSize: 'clamp(7px, 0.9vw, 10px)',
                    color: '#A09890', letterSpacing: '0.08em', marginTop: '6%',
                    textTransform: 'uppercase',
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
        background: '#0A0A0A', overflow: 'hidden', borderRadius: 4,
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
              color: '#F8F4EE', marginBottom: '5%',
            }}>{heading}</div>
            {slide.bullets && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3%' }}>
                {slide.bullets.map((b, j) => (
                  <div key={j} style={{ display: 'flex', gap: '3%', alignItems: 'flex-start' }}>
                    <span style={{ color: accent, flexShrink: 0, fontSize: 'clamp(8px, 1.2vw, 12px)', marginTop: '0.1em' }}>›</span>
                    <span style={{ fontSize: 'clamp(8px, 1.1vw, 11px)', color: '#A09890', lineHeight: 1.6 }}>{b}</span>
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
        background: `linear-gradient(135deg, #0A0A0A 0%, ${accent}0A 100%)`,
        overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}30`,
      }}>
        <LabelPill />
        {/* Big decorative quote mark */}
        <div style={{
          position: 'absolute', top: '10%', left: '8%',
          fontSize: 'clamp(60px, 12vw, 120px)', color: accent, opacity: 0.08,
          fontFamily: "'Playfair Display', serif", lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none',
        }}>"</div>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '12% 14%', textAlign: 'center',
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
            color: '#F8F4EE', lineHeight: 1.6, fontStyle: 'italic',
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
        background: '#0A0A0A', overflow: 'hidden', borderRadius: 4,
        border: `1px solid ${accent}20`,
      }}>
        <LabelPill />
        <div style={{
          position: 'absolute', inset: 0,
          padding: '8% 6%', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(12px, 2vw, 18px)',
            color: '#F8F4EE', marginBottom: '4%',
          }}>{heading}</div>
          {slide.cards && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(slide.cards.length, 3)}, 1fr)`,
              gap: '3%', flex: 1,
            }}>
              {slide.cards.map((card, j) => (
                <div key={j} style={{
                  background: '#111', border: `1px solid ${accent}25`,
                  borderRadius: 3, padding: '5% 6%',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{
                    fontSize: 'clamp(9px, 1.3vw, 12px)',
                    color: '#F8F4EE', marginBottom: '8%', fontWeight: 500,
                  }}>{card.title}</div>
                  <div style={{
                    fontSize: 'clamp(7px, 1vw, 10px)',
                    color: '#A09890', lineHeight: 1.6, flex: 1,
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
      background: '#0A0A0A', overflow: 'hidden', borderRadius: 4,
      border: `1px solid ${accent}20`,
    }}>
      <LabelPill />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '8% 10%',
      }}>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(12px, 2.2vw, 20px)',
          color: '#F8F4EE', lineHeight: 1.35, marginBottom: '4%',
        }}>{heading}</div>
        {slide.subheading && (
          <div style={{ fontSize: 'clamp(9px, 1.2vw, 12px)', color: accent, marginBottom: '3%', fontStyle: 'italic' }}>
            {slide.subheading}
          </div>
        )}
        {slide.body && (
          <div style={{ fontSize: 'clamp(8px, 1.1vw, 11px)', color: '#A09890', lineHeight: 1.7 }}>
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
function PresentationPreview({ data, accent, genId }: {
  data: BrandOutput; accent: string; genId?: string | null
}) {
  const [creating, setCreating] = React.useState(false)
  const [activeIdx, setActiveIdx] = React.useState(0)

  // Build the flat slides array: hook slide first, then content slides
  const allSlides: Array<{ isHook?: boolean; slide: BrandOutput['presentationSlides'][number]; hookText?: string }> = [
    { isHook: true, slide: {} as BrandOutput['presentationSlides'][number], hookText: data.presentationHook },
    ...data.presentationSlides.map(s => ({ slide: s })),
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
                {/* Mini 16:9 preview */}
                <div style={{
                  position: 'relative', width: '100%', paddingTop: '56.25%',
                  background: '#111', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', padding: '8%',
                  }}>
                    <div style={{
                      fontSize: 5.5, color: accent, fontFamily: "'DM Mono', monospace",
                      letterSpacing: '0.1em', marginBottom: 3, opacity: 0.7,
                    }}>
                      {String(idx + 1).padStart(2, '0')} — {item.isHook ? 'HOOK' : (item.slide.layoutType ?? 'CONTENT').toUpperCase()}
                    </div>
                    <div style={{
                      fontSize: 6, color: '#F8F4EE', lineHeight: 1.3,
                      fontFamily: "'Playfair Display', serif",
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical' as const,
                    }}>
                      {thumbHeading}
                    </div>
                  </div>
                  {/* Active indicator line */}
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
                      background: accent,
                    }} />
                  )}
                </div>
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

          {/* The active slide rendered at full size */}
          <RealSlide
            key={activeIdx}
            slide={active.slide}
            index={activeIdx}
            accent={accent}
            isHook={active.isHook}
            hookText={active.hookText}
          />

          {/* Keyboard hint */}
          <div style={{
            fontSize: 8, color: '#333', letterSpacing: '0.12em',
            fontFamily: "'DM Mono', monospace", textAlign: 'center',
          }}>
            CLICK THUMBNAIL · USE ‹ › TO NAVIGATE
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
            Sign in to edit, reorder, and export as PPTX
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
                  presentationSlides: data.presentationSlides.map(s => ({
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
