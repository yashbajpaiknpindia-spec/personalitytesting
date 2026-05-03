'use client'

import { useState, useRef } from 'react'
import { useTailorResume }    from '@/hooks/useTailorResume'
import { useATSScore }        from '@/hooks/useATSScore'
import { useCoverLetter }     from '@/hooks/useCoverLetter'
import { useLinkedInImport }  from '@/hooks/useLinkedInImport'
import type { ResumeData }    from '@/hooks/useTailorResume'
import type { CoverLetterTone } from '@/hooks/useCoverLetter'

interface Props {
  resumeData: ResumeData
  accent?: string
  onImported?: (data: ResumeData) => void
}

type ActivePanel = 'tailor' | 'ats' | 'cover' | 'import' | null

const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" }

export default function ResumeIntelligencePanel({ resumeData, accent = '#C9A84C', onImported }: Props) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [jobDesc, setJobDesc]         = useState('')
  const [clTone, setClTone]           = useState<CoverLetterTone>('professional')
  const [copied, setCopied]           = useState(false)
  const fileInputRef                  = useRef<HTMLInputElement>(null)

  const tailor  = useTailorResume()
  const ats     = useATSScore()
  const cover   = useCoverLetter()
  const linkedin = useLinkedInImport()

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toggle(panel: ActivePanel) {
    setActivePanel(p => p === panel ? null : panel)
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function scoreColor(n: number) {
    if (n >= 75) return '#2E7D52'
    if (n >= 50) return '#E2C57A'
    return '#C0392B'
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  const panelWrap: React.CSSProperties = {
    background: 'var(--surface)',
    border: `1px solid var(--border2)`,
    borderTop: `2px solid ${accent}`,
    borderRadius: 'var(--radius)',
    marginTop: 24,
    overflow: 'hidden',
  }
  const sectionHead: React.CSSProperties = {
    fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
    color: accent, ...mono, marginBottom: 10,
  }
  const textarea: React.CSSProperties = {
    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', color: 'var(--cream)', fontSize: 12,
    fontFamily: "'DM Sans', sans-serif", padding: '10px 12px',
    resize: 'vertical', outline: 'none', minHeight: 100,
  }
  const btn = (active = false, ghost = false): React.CSSProperties => ({
    padding: '8px 16px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
    ...mono, cursor: 'pointer', borderRadius: 'var(--radius)',
    background: ghost ? 'transparent' : active ? accent : 'var(--surface2)',
    color: ghost ? 'var(--muted)' : active ? '#000' : 'var(--text)',
    border: ghost ? '1px solid var(--border)' : active ? 'none' : '1px solid var(--border)',
    transition: 'all 0.15s',
    fontWeight: active ? 600 : 400,
  })
  const metaLabel: React.CSSProperties = {
    fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
    color: 'var(--muted)', ...mono,
  }

  // ── Top action bar ─────────────────────────────────────────────────────────

  const actions = [
    { id: 'tailor' as ActivePanel, icon: '✦', label: 'Tailor Resume' },
    { id: 'ats'    as ActivePanel, icon: '◎', label: 'ATS Score' },
    { id: 'cover'  as ActivePanel, icon: '✉', label: 'Cover Letter' },
    { id: 'import' as ActivePanel, icon: '↑', label: 'Import LinkedIn' },
  ]

  return (
    <div style={panelWrap}>
      {/* Action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ ...metaLabel, marginRight: 6 }}>Resume Intelligence</div>
        {actions.map(a => (
          <button
            key={a.id}
            onClick={() => toggle(a.id)}
            style={{
              ...btn(activePanel === a.id),
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            }}
          >
            <span style={{ fontSize: 11 }}>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── TAILOR PANEL ──────────────────────────────────────────────────── */}
      {activePanel === 'tailor' && (
        <div style={{ padding: 20 }}>
          <div style={sectionHead}>Tailor Resume to Job Description</div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>
            Paste a job description and AI will rewrite your bullet points, inject keywords, and optimize for ATS — without changing your facts.
          </p>
          <textarea
            style={textarea}
            placeholder="Paste the full job description here…"
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            rows={5}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => tailor.tailor(resumeData, jobDesc)}
              disabled={tailor.loading || !jobDesc.trim()}
              style={{ ...btn(true), opacity: tailor.loading || !jobDesc.trim() ? 0.5 : 1 }}
            >
              {tailor.loading ? '⏳ Tailoring…' : '✦ Tailor Now'}
            </button>
            {tailor.result && (
              <button onClick={tailor.reset} style={btn(false, true)}>Reset</button>
            )}
          </div>

          {tailor.error && (
            <div style={{ marginTop: 12, fontSize: 11, color: '#C0392B', ...mono }}>
              ✕ {tailor.error}
            </div>
          )}

          {tailor.result && (
            <div style={{ marginTop: 20 }}>
              <div style={sectionHead}>Tailored Resume Preview</div>

              {/* Changes log */}
              <div style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 14,
              }}>
                <div style={{ ...metaLabel, marginBottom: 8 }}>Changes Made</div>
                {tailor.result.changes.map((c, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 4 }}>
                    <span style={{ color: accent }}>→ </span>{c}
                  </div>
                ))}
              </div>

              {/* Tailored bullets */}
              {tailor.result.tailoredResume.resumeBullets && (
                <div style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 14px',
                }}>
                  <div style={{ ...metaLabel, marginBottom: 8 }}>Rewritten Bullets</div>
                  {tailor.result.tailoredResume.resumeBullets.map((b, i) => (
                    <div key={i} style={{ fontSize: 11, color: 'var(--cream)', lineHeight: 1.7, marginBottom: 4 }}>
                      <span style={{ color: accent }}>• </span>{b}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 10, ...metaLabel, color: 'var(--muted2)' }}>
                Version saved — ID: {tailor.result.versionId.slice(0, 8)}…
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ATS SCORE PANEL ───────────────────────────────────────────────── */}
      {activePanel === 'ats' && (
        <div style={{ padding: 20 }}>
          <div style={sectionHead}>ATS Score Analyzer</div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>
            Get a detailed ATS compatibility score. Add a job description for keyword analysis.
          </p>
          <textarea
            style={{ ...textarea, minHeight: 72 }}
            placeholder="Paste job description (optional, for keyword matching)…"
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            rows={3}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => ats.analyze(resumeData, jobDesc || undefined)}
              disabled={ats.loading}
              style={{ ...btn(true), opacity: ats.loading ? 0.5 : 1 }}
            >
              {ats.loading ? '⏳ Analyzing…' : '◎ Analyze ATS'}
            </button>
            {ats.result && (
              <button onClick={ats.reset} style={btn(false, true)}>Reset</button>
            )}
          </div>

          {ats.error && (
            <div style={{ marginTop: 12, fontSize: 11, color: '#C0392B', ...mono }}>✕ {ats.error}</div>
          )}

          {ats.result && (
            <div style={{ marginTop: 20 }}>
              {/* Big score */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '16px 20px',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 48, fontWeight: 700, lineHeight: 1,
                    color: scoreColor(ats.result.score), ...mono,
                  }}>
                    {ats.result.score}
                  </div>
                  <div style={{ ...metaLabel, marginTop: 4 }}>/ 100</div>
                </div>
                <div style={{ flex: 1 }}>
                  {/* Score bar */}
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${ats.result.score}%`,
                      background: scoreColor(ats.result.score),
                      borderRadius: 3, transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                    {ats.result.score >= 75
                      ? 'Strong ATS match — well positioned for screening'
                      : ats.result.score >= 50
                      ? 'Moderate match — follow suggestions to improve'
                      : 'Low match — needs optimization before applying'}
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div style={{ ...metaLabel, marginBottom: 10 }}>Score Breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {(Object.entries(ats.result.breakdown) as Array<[string, number]>).map(([key, val]) => (
                  <div key={key} style={{
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '10px 12px',
                  }}>
                    <div style={{ ...metaLabel, marginBottom: 6 }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${val}%`,
                          background: scoreColor(val), borderRadius: 2,
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: scoreColor(val), ...mono, flexShrink: 0 }}>{val}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              <div style={{ ...metaLabel, marginBottom: 10 }}>Recommendations</div>
              <div style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '12px 14px',
              }}>
                {ats.result.suggestions.map((s, i) => (
                  <div key={i} style={{
                    fontSize: 11, color: 'var(--muted)', lineHeight: 1.6,
                    marginBottom: i < ats.result!.suggestions.length - 1 ? 8 : 0,
                    paddingBottom: i < ats.result!.suggestions.length - 1 ? 8 : 0,
                    borderBottom: i < ats.result!.suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ color: '#E2C57A' }}>⚡ </span>{s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── COVER LETTER PANEL ────────────────────────────────────────────── */}
      {activePanel === 'cover' && (
        <div style={{ padding: 20 }}>
          <div style={sectionHead}>Cover Letter Generator</div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>
            AI writes a personalized cover letter that matches the job requirements and highlights your top achievements.
          </p>

          <textarea
            style={textarea}
            placeholder="Paste the job description here…"
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            rows={4}
          />

          {/* Tone selector */}
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <div style={{ ...metaLabel, marginBottom: 8 }}>Tone</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['professional', 'executive', 'casual', 'creative'] as CoverLetterTone[]).map(t => (
                <button
                  key={t}
                  onClick={() => setClTone(t)}
                  style={{
                    ...btn(clTone === t),
                    padding: '5px 12px', fontSize: 9,
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => cover.generate(resumeData, jobDesc, clTone, tailor.result?.versionId)}
              disabled={cover.loading || !jobDesc.trim()}
              style={{ ...btn(true), opacity: cover.loading || !jobDesc.trim() ? 0.5 : 1 }}
            >
              {cover.loading ? '⏳ Writing…' : '✉ Generate Letter'}
            </button>
            {cover.result && (
              <button onClick={cover.reset} style={btn(false, true)}>Reset</button>
            )}
          </div>

          {cover.error && (
            <div style={{ marginTop: 12, fontSize: 11, color: '#C0392B', ...mono }}>✕ {cover.error}</div>
          )}

          {cover.result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={sectionHead}>Generated Cover Letter</div>
                <button
                  onClick={() => copyText(cover.result!.coverLetter)}
                  style={{ ...btn(false, true), padding: '4px 10px', fontSize: 9 }}
                >
                  {copied ? '✓ Copied' : '⎘ Copy'}
                </button>
              </div>
              <div style={{
                background: '#F8F6F2', border: '1px solid #E0D8CE',
                borderRadius: 'var(--radius)', padding: '20px 22px',
                color: '#1A1A1A', fontSize: 12, lineHeight: 1.85,
                fontFamily: "'DM Sans', sans-serif", whiteSpace: 'pre-wrap',
              }}>
                {cover.result.coverLetter}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LINKEDIN IMPORT PANEL ─────────────────────────────────────────── */}
      {activePanel === 'import' && (
        <div style={{ padding: 20 }}>
          <div style={sectionHead}>Import LinkedIn PDF</div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>
            Export your LinkedIn profile as PDF, then upload it here to auto-populate your resume data.
            <br />
            <span style={{ color: accent }}>
              How to export: LinkedIn → Me → View Profile → More → Save to PDF
            </span>
          </p>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) linkedin.importPDF(f)
            }}
            style={{
              border: `2px dashed ${linkedin.loading ? accent : 'var(--border2)'}`,
              borderRadius: 'var(--radius)', padding: '32px 24px',
              textAlign: 'center', cursor: linkedin.loading ? 'default' : 'pointer',
              transition: 'border-color 0.2s', background: 'var(--surface2)',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>
              {linkedin.loading ? '⏳' : '↑'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>
              {linkedin.loading ? linkedin.progress : 'Click or drag your LinkedIn PDF'}
            </div>
            <div style={{ ...metaLabel }}>PDF files only — max 10 MB</div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) linkedin.importPDF(f)
              e.target.value = ''
            }}
          />

          {linkedin.error && (
            <div style={{ marginTop: 12, fontSize: 11, color: '#C0392B', ...mono }}>✕ {linkedin.error}</div>
          )}

          {linkedin.result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ ...sectionHead, marginBottom: 12 }}>Parsed Profile</div>
              <div style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '14px 16px',
              }}>
                {Object.entries(linkedin.result.resumeData)
                  .filter(([, v]) => v && (!Array.isArray(v) || v.length > 0))
                  .map(([key, val]) => (
                    <div key={key} style={{ marginBottom: 8 }}>
                      <div style={{ ...metaLabel, marginBottom: 3 }}>{key}</div>
                      <div style={{ fontSize: 11, color: 'var(--cream)', lineHeight: 1.6 }}>
                        {Array.isArray(val)
                          ? typeof val[0] === 'string'
                            ? (val as string[]).join(' • ')
                            : JSON.stringify(val, null, 2).substring(0, 200)
                          : String(val).substring(0, 200)}
                      </div>
                    </div>
                  ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  onClick={() => {
                    onImported?.(linkedin.result!.resumeData)
                    toggle('import')
                  }}
                  style={btn(true)}
                >
                  ✓ Use This Profile
                </button>
                <button onClick={linkedin.reset} style={btn(false, true)}>Clear</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
