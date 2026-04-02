'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

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
  presentationSlides: Array<{ title: string; body: string; imageQuery: string }>
}

// FIX 1: All 48 templates with correct slug + accentColor matching the DB seed
const TEMPLATES = [
  // PORTFOLIO (12)
  { slug: 'the-manifesto',   name: 'Manifesto',  color: '#C9A84C', category: 'portfolio' },
  { slug: 'editorial-dark',  name: 'Editorial',  color: '#C9A84C', category: 'portfolio' },
  { slug: 'signal',          name: 'Signal',     color: '#4CA8C9', category: 'portfolio' },
  { slug: 'founders-page',   name: 'Founder',    color: '#C9A84C', category: 'portfolio' },
  { slug: 'case-study-pro',  name: 'Case Study', color: '#7B68EE', category: 'portfolio' },
  { slug: 'zero-noise',      name: 'Zero',       color: '#E8E2D8', category: 'portfolio' },
  { slug: 'luminary',        name: 'Luminary',   color: '#E2C57A', category: 'portfolio' },
  { slug: 'the-architect',   name: 'Architect',  color: '#9CA3AF', category: 'portfolio' },
  { slug: 'studio-brief',    name: 'Studio',     color: '#C0392B', category: 'portfolio' },
  { slug: 'minimal-canon',   name: 'Canon',      color: '#C9A84C', category: 'portfolio' },
  { slug: 'the-operator',    name: 'Operator',   color: '#2E7D52', category: 'portfolio' },
  { slug: 'deep-work',       name: 'Deep Work',  color: '#5C564E', category: 'portfolio' },
  // RESUME (12)
  { slug: 'executive-clean', name: 'Executive',  color: '#C9A84C', category: 'resume' },
  { slug: 'signal-resume',   name: 'Signal',     color: '#4CA8C9', category: 'resume' },
  { slug: 'the-chronicle',   name: 'Chronicle',  color: '#C9A84C', category: 'resume' },
  { slug: 'linear',          name: 'Linear',     color: '#E8E2D8', category: 'resume' },
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
  { slug: 'the-credential',  name: 'Credential', color: '#E8E2D8', category: 'card' },
  { slug: 'obsidian',        name: 'Obsidian',   color: '#C9A84C', category: 'card' },
  { slug: 'minimal-touch',   name: 'Minimal',    color: '#C9A84C', category: 'card' },
  { slug: 'the-signet',      name: 'Signet',     color: '#B8960C', category: 'card' },
  { slug: 'matte-black',     name: 'Matte',      color: '#C9A84C', category: 'card' },
  { slug: 'cipher',          name: 'Cipher',     color: '#4CA8C9', category: 'card' },
  { slug: 'luxe-mono',       name: 'Luxe Mono',  color: '#E8E2D8', category: 'card' },
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
  { slug: 'the-thesis',      name: 'Thesis',     color: '#E8E2D8', category: 'presentation' },
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
        Object.assign(document.createElement('a'), { href: url, download: 'contact.vcf' }).click()
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
      <div className="generate-form-side">
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
      <div className="generate-preview-side">
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
            <button onClick={() => setShowExport(true)} style={{ background: 'var(--gold)', border: 'none', color: '#000', padding: '4px 12px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: 'pointer', borderRadius: 'var(--radius)', fontWeight: 500 }}>
              Export
            </button>
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
              {/* FIX 7: PresentationPreview now wired up */}
              {pvTab === 'presentation' && <PresentationPreview data={output} accent={accent} />}
            </>
          ) : (
            // FIX 8: Template-aware skeleton replaces the blank "Preview appears here"
            <TemplateEmptyState accent={accent} selectedTemplate={selectedTemplate} />
          )}
        </div>
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

function PortfolioPreview({ data, accent }: { data: BrandOutput; accent: string }) {
  return (
    <div style={{ background: '#0A0A0A', minHeight: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, letterSpacing: '0.2em', color: '#F0EAE0', textTransform: 'uppercase' }}>
          {data.cardName} <span style={{ color: accent }}>·</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Work', 'About', 'Contact'].map(l => <span key={l} style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C564E' }}>{l}</span>)}
        </div>
      </div>
      <div style={{ padding: '48px 28px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>
          <div style={{ width: 16, height: 1, background: accent }} />{data.cardTitle}
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px,3.5vw,34px)', color: '#F0EAE0', lineHeight: 1.15, marginBottom: 14, fontWeight: 400 }}>{data.headline}</h2>
        <p style={{ fontSize: 12, color: '#5C564E', lineHeight: 1.8, maxWidth: 380, fontWeight: 300, marginBottom: 24 }}>{data.bio}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: accent, color: '#000', border: 'none', padding: '8px 18px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 500 }}>{data.cta}</button>
          <button style={{ background: 'transparent', color: '#5C564E', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 18px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>View Work</button>
        </div>
      </div>
      <div style={{ padding: 28, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Selected Work</div>
        <div className="export-grid-2">
          {data.portfolioSections.slice(0, 4).map((s, i) => (
            <div key={i} style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.06)', padding: 14 }}>
              <div style={{ width: '100%', height: 40, background: '#1A1A1A', marginBottom: 8 }} />
              <div style={{ fontSize: 11, color: '#E8E2D8', marginBottom: 2, fontFamily: "'Playfair Display', serif" }}>{s.title}</div>
              <div style={{ fontSize: 9, color: accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.highlight}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Skills</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {data.skills.map(s => <span key={s} style={{ padding: '4px 10px', border: '1px solid rgba(255,255,255,0.07)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5C564E' }}>{s}</span>)}
        </div>
      </div>
    </div>
  )
}

function CardPreview({ data, accent }: { data: BrandOutput; accent: string }) {
  return (
    <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, background: '#111113', minHeight: '100%' }}>
      <div style={{ width: '100%', maxWidth: 320, aspectRatio: '1.75 / 1', background: '#0A0A0A', border: `1px solid ${accent}4D`, padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#F0EAE0' }}>{data.cardName}</div>
          <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{data.cardTitle}</div>
        </div>
        <div style={{ fontSize: 9, color: '#5C564E', letterSpacing: '0.04em', fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>{data.tagline}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5C564E', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Scan to Connect</div>
        <div style={{ width: 80, height: 80, background: '#0A0A0A', border: '1px solid rgba(255,255,255,0.08)', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 2, padding: 8, borderRadius: 2 }}>
          {Array.from({ length: 36 }).map((_, i) => (
            <span key={i} style={{ background: [0,2,4,6,12,17,18,23,30,32,34].includes(i) ? `${accent}CC` : 'rgba(255,255,255,0.06)', borderRadius: 1 }} />
          ))}
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

// FIX 7: Brand new PresentationPreview component — was completely missing
function PresentationPreview({ data, accent }: { data: BrandOutput; accent: string }) {
  return (
    <div style={{ background: '#0A0A0A', minHeight: '100%', fontFamily: "'DM Sans', sans-serif", padding: '32px 28px' }}>
      {/* Hook slide */}
      <div style={{ border: `1px solid ${accent}40`, borderRadius: 6, padding: '28px 24px', marginBottom: 24, background: '#0f0f0f', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
        <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>
          01 — Hook
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(16px,2vw,24px)', color: '#F0EAE0', lineHeight: 1.35, fontWeight: 400 }}>
          {data.presentationHook}
        </div>
      </div>

      {/* Content slides */}
      <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>
        Slide Deck
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.presentationSlides.map((slide, i) => (
          <div key={i} style={{
            background: '#131313', border: '1px solid rgba(255,255,255,0.06)',
            borderLeft: `3px solid ${accent}`, borderRadius: 4, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 8, letterSpacing: '0.16em', color: accent, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                {String(i + 2).padStart(2, '0')}
              </span>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: '#F0EAE0' }}>{slide.title}</div>
            </div>
            <div style={{ fontSize: 11, color: '#5C564E', lineHeight: 1.7 }}>{slide.body}</div>
            {slide.imageQuery && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, opacity: 0.4 }}>
                <span style={{ fontSize: 9 }}>🖼</span>
                <span style={{ fontSize: 9, color: '#fff', fontFamily: "'DM Mono', monospace" }}>{slide.imageQuery}</span>
              </div>
            )}
          </div>
        ))}
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
