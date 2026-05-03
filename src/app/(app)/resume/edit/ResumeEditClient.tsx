'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface WorkExperience {
  id: string
  title: string
  company: string
  duration: string
  bullets: string[]
}

interface Education {
  id: string
  degree: string
  institution: string
  year: string
}

interface ResumeData {
  cardName: string
  cardTitle: string
  bio: string
  skills: string[]
  headline: string
  tagline: string
  resumeBullets: string[]
  profileImage?: string
  experience?: WorkExperience[]
  education?: Education[]
  email?: string
  phone?: string
  location?: string
  website?: string
}

const RESUME_FONTS = [
  { label: 'DM Sans',           value: "\'DM Sans\', sans-serif",       tag: 'Modern' },
  { label: 'Playfair',          value: "\'Playfair Display\', serif",    tag: 'Classic' },
  { label: 'Inter',             value: "\'Inter\', sans-serif",          tag: 'Clean' },
  { label: 'Libre Baskerville', value: "\'Libre Baskerville\', serif",   tag: 'Editorial' },
  { label: 'Cormorant',         value: "\'Cormorant Garamond\', serif",  tag: 'Luxe' },
  { label: 'Syne',              value: "\'Syne\', sans-serif",           tag: 'Bold' },
]

const FONT_LOAD_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Syne:wght@400;600;700&display=swap');
`

const RESUME_THEMES = [
  { slug: 'executive-clean', name: 'Executive', color: '#C9A84C' },
  { slug: 'signal-resume',   name: 'Signal',    color: '#4CA8C9' },
  { slug: 'the-chronicle',   name: 'Chronicle', color: '#C9A84C' },
  { slug: 'linear',          name: 'Linear',    color: '#F0EAE0' },
  { slug: 'command',         name: 'Command',   color: '#2E7D52' },
  { slug: 'criterion',       name: 'Criterion', color: '#C9A84C' },
  { slug: 'the-ledger',      name: 'Ledger',    color: '#2E7D52' },
  { slug: 'brief-brilliant', name: 'Brief',     color: '#C9A84C' },
  { slug: 'structured',      name: 'Structured',color: '#7B68EE' },
  { slug: 'the-achiever',    name: 'Achiever',  color: '#E2C57A' },
  { slug: 'systems-thinker', name: 'Systems',   color: '#4CA8C9' },
  { slug: 'directors-cut',   name: "Director's", color: '#C0392B' },
]

type ResumeLayout = 'classic' | 'sidebar' | 'modern' | 'minimal' | 'executive'

const RESUME_LAYOUTS: Array<{ key: ResumeLayout; name: string; desc: string }> = [
  { key: 'classic',   name: 'Classic',   desc: 'Single-column, timeless' },
  { key: 'sidebar',   name: 'Sidebar',   desc: 'Left sidebar + main content' },
  { key: 'modern',    name: 'Modern',    desc: 'Two-column with accent bar' },
  { key: 'minimal',   name: 'Minimal',   desc: 'Ultra-clean whitespace' },
  { key: 'executive', name: 'Executive', desc: 'Photo + professional header' },
]

function uid() { return Math.random().toString(36).slice(2) }

function ResumeExportBtn({ genId, accent }: { genId: string | null; accent: string }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  async function doExport() {
    if (!genId) { setErr('Save your resume first, then export'); setTimeout(() => setErr(null), 3000); return }
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/export/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ generationId: genId, format: 'resume' }) })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Export failed (${res.status})`) }
      const ct = res.headers.get('Content-Type') || ''
      if (ct.includes('application/pdf') || ct.includes('octet-stream')) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'resume.pdf'
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 2000)
      } else {
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        if (data.url) { try { const dlRes = await fetch(data.url); if (dlRes.ok) { const blob = await dlRes.blob(); const blobUrl = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = blobUrl; a.download = 'resume.pdf'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(blobUrl), 2000); return } } catch {}; window.open(data.url, '_blank') } else { throw new Error('No download URL returned') }
      }
    } catch (e) { setErr(e instanceof Error ? e.message : 'Export failed'); setTimeout(() => setErr(null), 4000) }
    finally { setBusy(false) }
  }
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={doExport} disabled={busy} style={{ background: 'transparent', border: `1px solid ${accent}60`, color: accent, padding: '12px 20px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", cursor: busy ? 'not-allowed' : 'pointer', borderRadius: 'var(--radius)', opacity: busy ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        {busy ? '⏳ Exporting…' : '↓ Export PDF'}
      </button>
      {err && <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#1a0808', border: '1px solid #c0392b', color: '#e74c3c', padding: '4px 8px', fontSize: 9, borderRadius: 3, zIndex: 10, textAlign: 'center', whiteSpace: 'nowrap' }}>{err}</div>}
    </div>
  )
}

function ST({ text, accent }: { text: string; accent: string }) {
  return <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 8, borderBottom: '1px solid #E0D8CE', paddingBottom: 6 }}>{text}</div>
}

function ClassicResume({ resume, accent, bodyFont, headingFont }: { resume: ResumeData; accent: string; bodyFont: string; headingFont: string }) {
  return (
    <div style={{ padding: '36px 32px', fontFamily: bodyFont, color: '#1A1A1A' }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24, borderBottom: '1px solid #E0D8CE', paddingBottom: 20 }}>
        {resume.profileImage
          ? <img src={resume.profileImage} alt="Profile" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}40`, flexShrink: 0 }} />
          : <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${accent}18`, border: `2px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: headingFont, fontSize: 28, color: accent }}>{(resume.cardName||'U')[0]}</div>
        }
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: headingFont, fontSize: 28, color: '#0A0A0A', marginBottom: 4 }}>{resume.cardName || 'Your Name'}</div>
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>{resume.cardTitle}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 10, color: '#999', fontFamily: "'DM Mono', monospace" }}>
            {resume.email && <span>✉ {resume.email}</span>}
            {resume.phone && <span>☏ {resume.phone}</span>}
            {resume.location && <span>◎ {resume.location}</span>}
            {resume.website && <span>⌂ {resume.website}</span>}
          </div>
        </div>
      </div>
      {resume.bio && <div style={{ marginBottom: 20 }}><ST text="Profile" accent={accent} /><div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{resume.bio}</div></div>}
      {(resume.experience||[]).length > 0 && <div style={{ marginBottom: 20 }}><ST text="Work Experience" accent={accent} />{(resume.experience||[]).map(exp => (<div key={exp.id} style={{ marginBottom: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}><div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A1A' }}>{exp.title}</div><div style={{ fontSize: 10, color: '#999', fontFamily: "'DM Mono', monospace" }}>{exp.duration}</div></div><div style={{ fontSize: 11, color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{exp.company}</div>{exp.bullets.filter(Boolean).map((b, bi) => <div key={bi} style={{ fontSize: 11, color: '#666', lineHeight: 1.6, paddingLeft: 12, borderLeft: `2px solid ${accent}30`, marginBottom: 3 }}>{b}</div>)}</div>))}</div>}
      {resume.resumeBullets.length > 0 && <div style={{ marginBottom: 20 }}><ST text="Key Achievements" accent={accent} />{resume.resumeBullets.map((b, i) => <div key={i} style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${accent}40` }}>{b}</div>)}</div>}
      {(resume.education||[]).length > 0 && <div style={{ marginBottom: 20 }}><ST text="Education" accent={accent} />{(resume.education||[]).map(edu => (<div key={edu.id} style={{ marginBottom: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A1A' }}>{edu.degree}</div><div style={{ fontSize: 10, color: '#999', fontFamily: "'DM Mono', monospace" }}>{edu.year}</div></div><div style={{ fontSize: 11, color: accent, fontFamily: "'DM Mono', monospace" }}>{edu.institution}</div></div>))}</div>}
      {resume.skills.length > 0 && <div><ST text="Skills" accent={accent} /><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{resume.skills.map(s => <span key={s} style={{ padding: '3px 10px', border: `1px solid ${accent}40`, fontSize: 10, textTransform: 'uppercase', color: '#888' }}>{s}</span>)}</div></div>}
    </div>
  )
}

function SidebarResume({ resume, accent, bodyFont, headingFont }: { resume: ResumeData; accent: string; bodyFont: string; headingFont: string }) {
  return (
    <div style={{ display: 'flex', fontFamily: bodyFont, color: '#1A1A1A', minHeight: 700 }}>
      <div style={{ width: 200, background: '#1A1A1A', padding: '32px 20px', flexShrink: 0 }}>
        {resume.profileImage ? <img src={resume.profileImage} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}`, marginBottom: 16, display: 'block' }} /> : <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${accent}20`, border: `2px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontFamily: headingFont, fontSize: 28, color: accent }}>{(resume.cardName||'U')[0]}</div>}
        <div style={{ fontFamily: headingFont, fontSize: 16, color: '#F8F4EE', marginBottom: 4 }}>{resume.cardName}</div>
        <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>{resume.cardTitle}</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 16 }} />
        {(resume.email||resume.phone||resume.location||resume.website) && <div style={{ marginBottom: 20 }}><div style={{ fontSize: 8, letterSpacing: '0.16em', color: accent, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 8 }}>Contact</div>{resume.email && <div style={{ fontSize: 9, color: '#AAA', marginBottom: 5, fontFamily: "'DM Mono', monospace", wordBreak: 'break-all' }}>{resume.email}</div>}{resume.phone && <div style={{ fontSize: 9, color: '#AAA', marginBottom: 5, fontFamily: "'DM Mono', monospace" }}>{resume.phone}</div>}{resume.location && <div style={{ fontSize: 9, color: '#AAA', marginBottom: 5, fontFamily: "'DM Mono', monospace" }}>{resume.location}</div>}{resume.website && <div style={{ fontSize: 9, color: accent, marginBottom: 5, fontFamily: "'DM Mono', monospace", wordBreak: 'break-all' }}>{resume.website}</div>}</div>}
        {resume.skills.length > 0 && <div><div style={{ fontSize: 8, letterSpacing: '0.16em', color: accent, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 8 }}>Skills</div>{resume.skills.map(s => <div key={s} style={{ fontSize: 10, color: '#CCC', marginBottom: 5, paddingLeft: 8, borderLeft: `2px solid ${accent}50` }}>{s}</div>)}</div>}
        {(resume.education||[]).length > 0 && <div style={{ marginTop: 20 }}><div style={{ fontSize: 8, letterSpacing: '0.16em', color: accent, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 8 }}>Education</div>{(resume.education||[]).map(edu => <div key={edu.id} style={{ marginBottom: 10 }}><div style={{ fontSize: 10, color: '#EEE', lineHeight: 1.3 }}>{edu.degree}</div><div style={{ fontSize: 9, color: accent, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>{edu.institution}</div><div style={{ fontSize: 8, color: '#777', fontFamily: "'DM Mono', monospace" }}>{edu.year}</div></div>)}</div>}
      </div>
      <div style={{ flex: 1, padding: '32px 28px', background: '#F8F6F2' }}>
        {resume.bio && <div style={{ marginBottom: 20 }}><ST text="Profile" accent={accent} /><div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{resume.bio}</div></div>}
        {(resume.experience||[]).length > 0 && <div style={{ marginBottom: 20 }}><ST text="Work Experience" accent={accent} />{(resume.experience||[]).map(exp => (<div key={exp.id} style={{ marginBottom: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A1A' }}>{exp.title}</div><div style={{ fontSize: 10, color: '#999', fontFamily: "'DM Mono', monospace" }}>{exp.duration}</div></div><div style={{ fontSize: 11, color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{exp.company}</div>{exp.bullets.filter(Boolean).map((b, bi) => <div key={bi} style={{ fontSize: 11, color: '#666', lineHeight: 1.6, paddingLeft: 10, borderLeft: `2px solid ${accent}30`, marginBottom: 3 }}>{b}</div>)}</div>))}</div>}
        {resume.resumeBullets.length > 0 && <div><ST text="Key Achievements" accent={accent} />{resume.resumeBullets.map((b, i) => <div key={i} style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${accent}40` }}>{b}</div>)}</div>}
      </div>
    </div>
  )
}

function ModernResume({ resume, accent, bodyFont, headingFont }: { resume: ResumeData; accent: string; bodyFont: string; headingFont: string }) {
  return (
    <div style={{ fontFamily: bodyFont, color: '#1A1A1A', background: '#FFFFFF' }}>
      <div style={{ background: accent, padding: '28px 32px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
        {resume.profileImage ? <img src={resume.profileImage} alt="Profile" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.5)', flexShrink: 0 }} /> : <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: headingFont, fontSize: 28, color: '#fff' }}>{(resume.cardName||'U')[0]}</div>}
        <div><div style={{ fontFamily: headingFont, fontSize: 26, color: '#fff', marginBottom: 4 }}>{resume.cardName}</div><div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', fontFamily: "'DM Mono', monospace" }}>{resume.cardTitle}</div></div>
      </div>
      {(resume.email||resume.phone||resume.location||resume.website) && <div style={{ background: '#1A1A1A', padding: '8px 32px', display: 'flex', flexWrap: 'wrap', gap: 20 }}>{resume.email && <span style={{ fontSize: 9, color: '#AAA', fontFamily: "'DM Mono', monospace" }}>✉ {resume.email}</span>}{resume.phone && <span style={{ fontSize: 9, color: '#AAA', fontFamily: "'DM Mono', monospace" }}>☏ {resume.phone}</span>}{resume.location && <span style={{ fontSize: 9, color: '#AAA', fontFamily: "'DM Mono', monospace" }}>◎ {resume.location}</span>}{resume.website && <span style={{ fontSize: 9, color: '#CCC', fontFamily: "'DM Mono', monospace" }}>⌂ {resume.website}</span>}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ padding: '24px 20px 24px 32px', borderRight: '1px solid #EEE' }}>
          {resume.bio && <div style={{ marginBottom: 20 }}><ST text="Profile" accent={accent} /><div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{resume.bio}</div></div>}
          {(resume.experience||[]).length > 0 && <div><ST text="Experience" accent={accent} />{(resume.experience||[]).map(exp => (<div key={exp.id} style={{ marginBottom: 12 }}><div style={{ fontWeight: 600, fontSize: 12, color: '#1A1A1A' }}>{exp.title}</div><div style={{ fontSize: 10, color: accent, fontFamily: "'DM Mono', monospace", margin: '2px 0' }}>{exp.company} · {exp.duration}</div>{exp.bullets.filter(Boolean).map((b, bi) => <div key={bi} style={{ fontSize: 10, color: '#666', lineHeight: 1.5, paddingLeft: 8, borderLeft: `2px solid ${accent}30`, marginBottom: 2 }}>{b}</div>)}</div>))}</div>}
          {resume.resumeBullets.length > 0 && <div style={{ marginTop: 16 }}><ST text="Key Achievements" accent={accent} />{resume.resumeBullets.map((b, i) => <div key={i} style={{ fontSize: 11, color: '#555', lineHeight: 1.7, marginBottom: 5, paddingLeft: 10, borderLeft: `2px solid ${accent}40` }}>{b}</div>)}</div>}
        </div>
        <div style={{ padding: '24px 32px 24px 20px' }}>
          {resume.skills.length > 0 && <div style={{ marginBottom: 20 }}><ST text="Skills" accent={accent} /><div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{resume.skills.map(s => <span key={s} style={{ padding: '3px 9px', background: `${accent}12`, border: `1px solid ${accent}30`, borderRadius: 20, fontSize: 10, color: '#555' }}>{s}</span>)}</div></div>}
          {(resume.education||[]).length > 0 && <div><ST text="Education" accent={accent} />{(resume.education||[]).map(edu => <div key={edu.id} style={{ marginBottom: 10 }}><div style={{ fontWeight: 600, fontSize: 12, color: '#1A1A1A' }}>{edu.degree}</div><div style={{ fontSize: 10, color: accent, fontFamily: "'DM Mono', monospace" }}>{edu.institution}</div><div style={{ fontSize: 9, color: '#999', fontFamily: "'DM Mono', monospace" }}>{edu.year}</div></div>)}</div>}
        </div>
      </div>
    </div>
  )
}

function MinimalResume({ resume, accent, bodyFont, headingFont }: { resume: ResumeData; accent: string; bodyFont: string; headingFont: string }) {
  return (
    <div style={{ padding: '48px 52px', fontFamily: bodyFont, color: '#1A1A1A', background: '#FFFFFF' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: headingFont, fontSize: 32, color: '#0A0A0A', letterSpacing: '-0.02em', marginBottom: 8 }}>{resume.cardName||'Your Name'}</div>
        <div style={{ fontSize: 11, color: '#999', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>{resume.cardTitle}</div>
        {(resume.email||resume.location) && <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 10, color: '#BBB', fontFamily: "'DM Mono', monospace" }}>{resume.email && <span>{resume.email}</span>}{resume.location && <span>{resume.location}</span>}</div>}
        <div style={{ marginTop: 16, width: 40, height: 2, background: accent }} />
      </div>
      {resume.bio && <div style={{ marginBottom: 32 }}><div style={{ fontSize: 8, letterSpacing: '0.24em', color: '#BBB', fontFamily: "'DM Mono', monospace", marginBottom: 12, textTransform: 'uppercase' }}>About</div><div style={{ fontSize: 13, color: '#444', lineHeight: 1.8 }}>{resume.bio}</div></div>}
      {(resume.experience||[]).length > 0 && <div style={{ marginBottom: 32 }}><div style={{ fontSize: 8, letterSpacing: '0.24em', color: '#BBB', fontFamily: "'DM Mono', monospace", marginBottom: 16, textTransform: 'uppercase' }}>Experience</div>{(resume.experience||[]).map(exp => <div key={exp.id} style={{ marginBottom: 20 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>{exp.title} · <span style={{ fontWeight: 400, color: '#777' }}>{exp.company}</span></span><span style={{ fontSize: 10, color: '#BBB', fontFamily: "'DM Mono', monospace" }}>{exp.duration}</span></div>{exp.bullets.filter(Boolean).map((b, bi) => <div key={bi} style={{ fontSize: 11, color: '#777', lineHeight: 1.6, marginBottom: 2, paddingLeft: 12 }}>— {b}</div>)}</div>)}</div>}
      {(resume.education||[]).length > 0 && <div style={{ marginBottom: 32 }}><div style={{ fontSize: 8, letterSpacing: '0.24em', color: '#BBB', fontFamily: "'DM Mono', monospace", marginBottom: 16, textTransform: 'uppercase' }}>Education</div>{(resume.education||[]).map(edu => <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><div><div style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A' }}>{edu.degree}</div><div style={{ fontSize: 10, color: '#999' }}>{edu.institution}</div></div><div style={{ fontSize: 10, color: '#BBB', fontFamily: "'DM Mono', monospace" }}>{edu.year}</div></div>)}</div>}
      {resume.skills.length > 0 && <div><div style={{ fontSize: 8, letterSpacing: '0.24em', color: '#BBB', fontFamily: "'DM Mono', monospace", marginBottom: 12, textTransform: 'uppercase' }}>Skills</div><div style={{ fontSize: 12, color: '#666', lineHeight: 2 }}>{resume.skills.join(' · ')}</div></div>}
    </div>
  )
}

function ExecutiveResume({ resume, accent, bodyFont, headingFont }: { resume: ResumeData; accent: string; bodyFont: string; headingFont: string }) {
  return (
    <div style={{ fontFamily: bodyFont, color: '#1A1A1A', background: '#F8F6F2' }}>
      <div style={{ background: '#1A1A1A', padding: '32px 36px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ flexShrink: 0 }}>{resume.profileImage ? <img src={resume.profileImage} alt="Profile" style={{ width: 88, height: 88, borderRadius: 4, objectFit: 'cover', border: `3px solid ${accent}` }} /> : <div style={{ width: 88, height: 88, borderRadius: 4, background: `${accent}20`, border: `3px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: headingFont, fontSize: 36, color: accent }}>{(resume.cardName||'U')[0]}</div>}</div>
        <div style={{ flex: 1, borderLeft: `3px solid ${accent}`, paddingLeft: 24 }}>
          <div style={{ fontFamily: headingFont, fontSize: 28, color: '#F8F4EE', marginBottom: 6 }}>{resume.cardName||'Your Name'}</div>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>{resume.cardTitle}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {resume.email && <span style={{ fontSize: 9, color: '#AAA', fontFamily: "'DM Mono', monospace" }}>✉ {resume.email}</span>}
            {resume.phone && <span style={{ fontSize: 9, color: '#AAA', fontFamily: "'DM Mono', monospace" }}>☏ {resume.phone}</span>}
            {resume.location && <span style={{ fontSize: 9, color: '#AAA', fontFamily: "'DM Mono', monospace" }}>◎ {resume.location}</span>}
            {resume.website && <span style={{ fontSize: 9, color: accent, fontFamily: "'DM Mono', monospace" }}>⌂ {resume.website}</span>}
          </div>
        </div>
      </div>
      <div style={{ padding: '28px 36px' }}>
        {resume.bio && <div style={{ marginBottom: 20, background: '#fff', padding: '16px 20px', borderLeft: `4px solid ${accent}`, borderRadius: '0 4px 4px 0' }}><div style={{ fontSize: 8, letterSpacing: '0.2em', color: accent, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginBottom: 8 }}>Executive Summary</div><div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{resume.bio}</div></div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
          <div>
            {(resume.experience||[]).length > 0 && <div style={{ marginBottom: 20 }}><ST text="Professional Experience" accent={accent} />{(resume.experience||[]).map(exp => <div key={exp.id} style={{ marginBottom: 16, background: '#fff', padding: '14px 16px', borderRadius: 4 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A1A' }}>{exp.title}</div><div style={{ fontSize: 9, color: '#999', fontFamily: "'DM Mono', monospace" }}>{exp.duration}</div></div><div style={{ fontSize: 10, color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>{exp.company}</div>{exp.bullets.filter(Boolean).map((b, bi) => <div key={bi} style={{ fontSize: 11, color: '#555', lineHeight: 1.6, paddingLeft: 10, borderLeft: `2px solid ${accent}30`, marginBottom: 3 }}>{b}</div>)}</div>)}</div>}
            {resume.resumeBullets.length > 0 && <div><ST text="Key Achievements" accent={accent} />{resume.resumeBullets.map((b, i) => <div key={i} style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${accent}40` }}>{b}</div>)}</div>}
          </div>
          <div>
            {resume.skills.length > 0 && <div style={{ marginBottom: 20 }}><ST text="Core Skills" accent={accent} /><div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{resume.skills.map(s => <div key={s} style={{ fontSize: 11, color: '#555', padding: '4px 0', borderBottom: '1px solid #EEE' }}>◆ {s}</div>)}</div></div>}
            {(resume.education||[]).length > 0 && <div><ST text="Education" accent={accent} />{(resume.education||[]).map(edu => <div key={edu.id} style={{ marginBottom: 10 }}><div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>{edu.degree}</div><div style={{ fontSize: 10, color: accent, fontFamily: "'DM Mono', monospace" }}>{edu.institution}</div><div style={{ fontSize: 9, color: '#999', fontFamily: "'DM Mono', monospace" }}>{edu.year}</div></div>)}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResumePreviewByLayout({ resume, accent, bodyFont, headingFont, layout }: { resume: ResumeData; accent: string; bodyFont: string; headingFont: string; layout: ResumeLayout }) {
  switch (layout) {
    case 'sidebar':   return <SidebarResume resume={resume} accent={accent} bodyFont={bodyFont} headingFont={headingFont} />
    case 'modern':    return <ModernResume resume={resume} accent={accent} bodyFont={bodyFont} headingFont={headingFont} />
    case 'minimal':   return <MinimalResume resume={resume} accent={accent} bodyFont={bodyFont} headingFont={headingFont} />
    case 'executive': return <ExecutiveResume resume={resume} accent={accent} bodyFont={bodyFont} headingFont={headingFont} />
    default:          return <ClassicResume resume={resume} accent={accent} bodyFont={bodyFont} headingFont={headingFont} />
  }
}

function ResumeEditClientInner({ accentColor }: { accentColor: string }) {
  const searchParams = useSearchParams()
  const genId = searchParams.get('gen')
  const accent = accentColor || '#C9A84C'
  const [resume, setResume] = useState<ResumeData>({ cardName: '', cardTitle: '', bio: '', skills: [], headline: '', tagline: '', resumeBullets: [], profileImage: '', email: '', phone: '', location: '', website: '', experience: [], education: [] })
  const [selectedFont, setSelectedFont] = useState("\'DM Sans\', sans-serif")
  const [selectedTheme, setSelectedTheme] = useState('executive-clean')
  const [selectedLayout, setSelectedLayout] = useState<ResumeLayout>('classic')
  const [skillInput, setSkillInput] = useState('')
  const [bulletInput, setBulletInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [activeTab, setActiveTab] = useState<'content'|'experience'|'style'|'preview'>('content')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [generations, setGenerations] = useState<Array<{id:string;createdAt:string;inputData:Record<string,unknown>;outputData:Record<string,unknown>|null}>>([])
  const [showGenPicker, setShowGenPicker] = useState(false)
  const [accentTheme, setAccentTheme] = useState('executive-clean')

  useEffect(() => {
    // Load past generations list for the picker
    fetch('/api/generate/list?limit=20').then(r=>r.ok?r.json():null).then(d=>{
      if(Array.isArray(d?.generations)) setGenerations(d.generations)
      else if(Array.isArray(d)) setGenerations(d)
    }).catch(()=>{})
    const url = genId ? `/api/generate/load?id=${genId}` : '/api/generate/latest'
    fetch(url).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.outputData) {
        const o = data.outputData
        setResume(prev => ({ ...prev, cardName: o.cardName||''  , cardTitle: o.cardTitle||'', bio: o.bio||'', skills: o.skills||[], headline: o.headline||'', tagline: o.tagline||'', resumeBullets: o.resumeBullets||[], experience: o.experience||[], education: o.education||[] }))
        if (data.inputData?.templateSlug) setSelectedTheme(data.inputData.templateSlug)
      }
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [genId])

  function showToast(msg:string) { setToast(msg); setTimeout(()=>setToast(''),3000) }

  function loadGeneration(g: {id:string;inputData:Record<string,unknown>;outputData:Record<string,unknown>|null}) {
    const o = (g.outputData || {}) as Record<string,unknown>
    setResume(prev => ({ ...prev,
      cardName:      (o.cardName as string)      || '',
      cardTitle:     (o.cardTitle as string)     || '',
      bio:           (o.bio as string)           || '',
      skills:        (o.skills as string[])      || [],
      headline:      (o.headline as string)      || '',
      tagline:       (o.tagline as string)       || '',
      resumeBullets: (o.resumeBullets as string[])|| [],
      experience:    (o.experience as WorkExperience[]) || [],
      education:     (o.education as Education[])       || [],
    }))
    const inp = g.inputData as Record<string,unknown>
    if(inp?.templateSlug) setSelectedTheme(inp.templateSlug as string)
    setShowGenPicker(false)
    showToast('✓ Loaded generation ' + g.id.slice(-6))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(genId?`/api/generate/update?id=${genId}`:'/api/generate/latest', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ cardName:resume.cardName, cardTitle:resume.cardTitle, bio:resume.bio, skills:resume.skills, headline:resume.headline, tagline:resume.tagline, resumeBullets:resume.resumeBullets, experience:resume.experience, education:resume.education, profileImage:resume.profileImage, email:resume.email, phone:resume.phone, location:resume.location, website:resume.website }) })
      showToast('✓ Resume saved')
    } catch { showToast('✕ Save failed') } finally { setSaving(false) }
  }

  function addSkill() { const s=skillInput.trim(); if(!s)return; setResume(r=>({...r,skills:[...r.skills,s]})); setSkillInput('') }
  function addBullet() { const b=bulletInput.trim(); if(!b)return; setResume(r=>({...r,resumeBullets:[...r.resumeBullets,b]})); setBulletInput('') }
  function updateBullet(i:number,val:string) { setResume(r=>{const bullets=[...r.resumeBullets]; bullets[i]=val; return{...r,resumeBullets:bullets}}) }
  function removeBullet(i:number) { setResume(r=>({...r,resumeBullets:r.resumeBullets.filter((_,idx)=>idx!==i)})) }

  function addExp() { setResume(r=>({...r,experience:[...(r.experience||[]),{id:uid(),title:'',company:'',duration:'',bullets:['']}]})) }
  function updateExp(id:string,field:keyof WorkExperience,value:string) { setResume(r=>({...r,experience:(r.experience||[]).map(e=>e.id===id?{...e,[field]:value}:e)})) }
  function updateExpBullet(id:string,bi:number,val:string) { setResume(r=>({...r,experience:(r.experience||[]).map(e=>{if(e.id!==id)return e; const bullets=[...e.bullets]; bullets[bi]=val; return{...e,bullets}})})) }
  function addExpBullet(id:string) { setResume(r=>({...r,experience:(r.experience||[]).map(e=>e.id===id?{...e,bullets:[...e.bullets,'']}:e)})) }
  function removeExpBullet(id:string,bi:number) { setResume(r=>({...r,experience:(r.experience||[]).map(e=>e.id===id?{...e,bullets:e.bullets.filter((_,i)=>i!==bi)}:e)})) }
  function removeExp(id:string) { setResume(r=>({...r,experience:(r.experience||[]).filter(e=>e.id!==id)})) }

  function addEdu() { setResume(r=>({...r,education:[...(r.education||[]),{id:uid(),degree:'',institution:'',year:''}]})) }
  function updateEdu(id:string,field:keyof Education,value:string) { setResume(r=>({...r,education:(r.education||[]).map(e=>e.id===id?{...e,[field]:value}:e)})) }
  function removeEdu(id:string) { setResume(r=>({...r,education:(r.education||[]).filter(e=>e.id!==id)})) }

  function handleImageFile(file:File) { const reader=new FileReader(); reader.onload=(e)=>{ const result=e.target?.result as string; setResume(r=>({...r,profileImage:result})) }; reader.readAsDataURL(file) }

  const fieldStyle:React.CSSProperties={width:'100%',background:'var(--surface)',border:'1px solid var(--border)',color:'var(--cream)',fontFamily:"'DM Sans', sans-serif",fontSize:13,padding:'9px 12px',outline:'none',borderRadius:'var(--radius)'}
  const labelSt:React.CSSProperties={fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',fontFamily:"'DM Mono', monospace",marginBottom:6,display:'block'}
  const section:React.CSSProperties={background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:24,marginBottom:20}
  const sHead:React.CSSProperties={fontSize:10,letterSpacing:'0.14em',textTransform:'uppercase',color:accent,fontFamily:"'DM Mono', monospace",marginBottom:16}
  const tabBtn=(active:boolean):React.CSSProperties=>({padding:'10px 14px 9px',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',color:active?accent:'var(--muted)',cursor:'pointer',background:'none',border:'none',borderBottom:active?`2px solid ${accent}`:'2px solid transparent',marginBottom:-1,fontFamily:"'DM Mono', monospace",transition:'border-color 0.12s',whiteSpace:'nowrap'})

  const bodyFont=selectedFont
  const headingFont=(selectedFont.includes('Playfair')||selectedFont.includes('Cormorant')||selectedFont.includes('Baskerville')||selectedFont.includes('Syne'))?selectedFont:"'Playfair Display', serif"

  if(loading) return <div style={{padding:40,textAlign:'center',color:'var(--muted)',fontSize:12}}>Loading resume data…</div>

  return (
    <div className="page-pad" style={{maxWidth:820,margin:'0 auto'}}>
      <style dangerouslySetInnerHTML={{__html:FONT_LOAD_STYLE}}/>
      {toast && <div style={{position:'fixed',bottom:24,right:24,background:'#1a1a1a',border:`1px solid ${accent}60`,borderRadius:6,padding:'10px 18px',fontSize:12,color:'#F0EAE0',zIndex:9999}}>{toast}</div>}

      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:24,flexWrap:'wrap'}}>
        <Link href="/generate" style={{fontSize:11,color:'var(--muted)',textDecoration:'none',fontFamily:"'DM Mono', monospace",letterSpacing:'0.1em',textTransform:'uppercase'}}>← Generate</Link>
        <span style={{color:'var(--muted2)',fontSize:11}}>/</span>
        <span style={{fontSize:11,color:accent,fontFamily:"'DM Mono', monospace",letterSpacing:'0.1em',textTransform:'uppercase'}}>Edit Resume</span>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:8,fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--gold)',fontFamily:"'DM Mono', monospace",marginBottom:12}}>
        <div style={{width:20,height:1,background:'var(--gold)'}} /> Resume Editor
      </div>
      <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:'clamp(24px,3vw,32px)',fontWeight:400,color:'var(--cream)',marginBottom:4}}>Edit Resume</h1>
      <p style={{fontSize:13,color:'var(--muted)',marginBottom:20}}>Add work experience, education, photo, choose your format &amp; font, then preview before saving.</p>

      {/* ── Past Generation Picker ── */}
      <div style={{marginBottom:24}}>
        <button onClick={()=>setShowGenPicker(p=>!p)} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 16px',background:'var(--surface)',border:`1px solid ${showGenPicker?accent:'var(--border)'}`,borderRadius:'var(--radius)',cursor:'pointer',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:"'DM Mono', monospace",color:showGenPicker?accent:'var(--muted)',transition:'border-color 0.12s'}}>
          <span>📋</span>
          {genId ? 'Switch Generation' : 'Choose a Past Generation'}
          <span style={{marginLeft:'auto',fontSize:12}}>{showGenPicker?'▲':'▼'}</span>
        </button>
        {showGenPicker && (
          <div style={{marginTop:8,background:'var(--surface)',border:`1px solid ${accent}40`,borderRadius:'var(--radius)',overflow:'hidden',maxHeight:320,overflowY:'auto'}}>
            {generations.length===0 && (
              <div style={{padding:'20px 16px',textAlign:'center',fontSize:12,color:'var(--muted)',fontFamily:"'DM Mono', monospace"}}>No past generations found. Generate a brand kit first.</div>
            )}
            {generations.map((g,i)=>{
              const o=(g.outputData||{}) as Record<string,unknown>
              const name=(o.cardName as string)||'Unnamed'
              const title=(o.cardTitle as string)||''
              const date=new Date(g.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
              const isActive=g.id===genId
              return (
                <div key={g.id} onClick={()=>loadGeneration(g)} style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',cursor:'pointer',background:isActive?`${accent}10`:'transparent',display:'flex',alignItems:'center',gap:12,transition:'background 0.1s'}}
                  onMouseEnter={e=>(e.currentTarget.style.background=`${accent}08`)}
                  onMouseLeave={e=>(e.currentTarget.style.background=isActive?`${accent}10`:'transparent')}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:`${accent}18`,border:`1px solid ${accent}40`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11,color:accent,fontFamily:"'DM Mono', monospace",fontWeight:600}}>{String(i+1).padStart(2,'0')}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:'var(--cream)',fontWeight:isActive?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</div>
                    <div style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono', monospace",marginTop:2}}>{title} · {date}</div>
                  </div>
                  {isActive && <span style={{fontSize:9,color:accent,fontFamily:"'DM Mono', monospace",letterSpacing:'0.1em',textTransform:'uppercase',flexShrink:0}}>current</span>}
                  <span style={{fontSize:9,color:'var(--muted2)',flexShrink:0,fontFamily:"'DM Mono', monospace"}}>#{g.id.slice(-6)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{display:'flex',borderBottom:'1px solid var(--border)',marginBottom:28,overflowX:'auto',scrollbarWidth:'none'}}>
        <button style={tabBtn(activeTab==='content')} onClick={()=>setActiveTab('content')}>Identity</button>
        <button style={tabBtn(activeTab==='experience')} onClick={()=>setActiveTab('experience')}>Experience &amp; Edu</button>
        <button style={tabBtn(activeTab==='style')} onClick={()=>setActiveTab('style')}>Format &amp; Style</button>
        <button style={tabBtn(activeTab==='preview')} onClick={()=>setActiveTab('preview')}>Preview</button>
      </div>

      {activeTab==='content' && (<>
        <div style={section}>
          <div style={sHead}>Profile Photo</div>
          <div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
            <div style={{flexShrink:0}}>{resume.profileImage?<img src={resume.profileImage} alt="Profile" style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',border:`2px solid ${accent}`}}/>:<div style={{width:80,height:80,borderRadius:'50%',background:`${accent}15`,border:`2px dashed ${accent}60`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,color:`${accent}60`}}>👤</div>}</div>
            <div style={{flex:1,minWidth:200}}>
              <input ref={imageInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleImageFile(f);e.target.value=''}}/>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:10}}>
                <button onClick={()=>imageInputRef.current?.click()} style={{background:accent,color:'#000',border:'none',padding:'8px 16px',fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:"'DM Mono', monospace",cursor:'pointer',borderRadius:'var(--radius)',fontWeight:500}}>Upload Photo</button>
                {resume.profileImage && <button onClick={()=>setResume(r=>({...r,profileImage:''}))} style={{background:'transparent',border:'1px solid var(--border2)',color:'var(--muted)',padding:'8px 14px',fontSize:11,cursor:'pointer',borderRadius:'var(--radius)'}}>Remove</button>}
              </div>
              <label style={labelSt}>Or paste image URL</label>
              <input value={resume.profileImage||''} onChange={e=>setResume(r=>({...r,profileImage:e.target.value}))} placeholder="https://…" style={fieldStyle}/>
              <div style={{fontSize:10,color:'var(--muted2)',marginTop:6}}>Photo shown in Classic, Sidebar, Modern, and Executive layouts.</div>
            </div>
          </div>
        </div>

        <div style={section}>
          <div style={sHead}>Identity</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}} className="form-grid-2">
            <div><label style={labelSt}>Full Name</label><input value={resume.cardName} onChange={e=>setResume(r=>({...r,cardName:e.target.value}))} style={fieldStyle} placeholder="Your Name"/></div>
            <div><label style={labelSt}>Job Title</label><input value={resume.cardTitle} onChange={e=>setResume(r=>({...r,cardTitle:e.target.value}))} style={fieldStyle} placeholder="e.g. Product Designer"/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}} className="form-grid-2">
            <div><label style={labelSt}>Email</label><input value={resume.email||''} onChange={e=>setResume(r=>({...r,email:e.target.value}))} style={fieldStyle} placeholder="you@email.com" type="email"/></div>
            <div><label style={labelSt}>Phone</label><input value={resume.phone||''} onChange={e=>setResume(r=>({...r,phone:e.target.value}))} style={fieldStyle} placeholder="+91 98765 43210"/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}} className="form-grid-2">
            <div><label style={labelSt}>Location</label><input value={resume.location||''} onChange={e=>setResume(r=>({...r,location:e.target.value}))} style={fieldStyle} placeholder="e.g. Mumbai, India"/></div>
            <div><label style={labelSt}>Website / LinkedIn</label><input value={resume.website||''} onChange={e=>setResume(r=>({...r,website:e.target.value}))} style={fieldStyle} placeholder="https://linkedin.com/in/…"/></div>
          </div>
          <div style={{marginBottom:14}}><label style={labelSt}>Headline</label><input value={resume.headline} onChange={e=>setResume(r=>({...r,headline:e.target.value}))} style={fieldStyle} placeholder="Professional headline"/></div>
        </div>

        <div style={section}>
          <div style={sHead}>Profile Summary</div>
          <label style={labelSt}>Bio / Summary</label>
          <textarea value={resume.bio} onChange={e=>setResume(r=>({...r,bio:e.target.value}))} rows={5} style={{...fieldStyle,resize:'vertical'}} placeholder="A compelling professional summary…"/>
        </div>

        <div style={section}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={sHead}>Key Achievements</div>
            <span style={{fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono', monospace"}}>{resume.resumeBullets.length} bullets</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
            {resume.resumeBullets.map((b,i)=>(<div key={i} style={{display:'flex',gap:8,alignItems:'flex-start'}}><span style={{fontSize:12,color:accent,marginTop:10,flexShrink:0,fontFamily:"'DM Mono', monospace"}}>›</span><textarea value={b} onChange={e=>updateBullet(i,e.target.value)} rows={2} style={{...fieldStyle,flex:1,resize:'vertical',fontSize:12}}/><button onClick={()=>removeBullet(i)} style={{background:'none',border:'1px solid var(--border2)',color:'var(--muted)',cursor:'pointer',padding:'4px 8px',borderRadius:3,marginTop:6,flexShrink:0,fontSize:11}}>×</button></div>))}
          </div>
          <div style={{display:'flex',gap:8}}>
            <input value={bulletInput} onChange={e=>setBulletInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addBullet()} style={{...fieldStyle,flex:1}} placeholder="Add an achievement and press Enter"/>
            <button onClick={addBullet} style={{background:accent,color:'#000',border:'none',padding:'9px 16px',fontSize:11,fontWeight:500,cursor:'pointer',borderRadius:'var(--radius)',flexShrink:0}}>Add</button>
          </div>
        </div>

        <div style={section}>
          <div style={sHead}>Skills</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
            {resume.skills.map((s,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',background:`${accent}18`,border:`1px solid ${accent}40`,borderRadius:20,fontSize:11,color:accent}}>{s}<button onClick={()=>setResume(r=>({...r,skills:r.skills.filter((_,idx)=>idx!==i)}))} style={{background:'none',border:'none',color:accent,cursor:'pointer',fontSize:12,lineHeight:1,padding:0}}>×</button></div>))}
          </div>
          <div style={{display:'flex',gap:8}}>
            <input value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()} style={{...fieldStyle,flex:1}} placeholder="Add a skill and press Enter"/>
            <button onClick={addSkill} style={{background:accent,color:'#000',border:'none',padding:'9px 16px',fontSize:11,fontWeight:500,cursor:'pointer',borderRadius:'var(--radius)',flexShrink:0}}>Add</button>
          </div>
        </div>
      </>)}

      {activeTab==='experience' && (<>
        <div style={section}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={sHead}>Work Experience</div>
            <button onClick={addExp} style={{background:accent,color:'#000',border:'none',padding:'7px 14px',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:"'DM Mono', monospace",cursor:'pointer',borderRadius:'var(--radius)',fontWeight:500}}>+ Add Role</button>
          </div>
          {(resume.experience||[]).length===0 && <div style={{textAlign:'center',padding:'24px',color:'var(--muted)',fontSize:12}}>No work experience added yet. Click <strong style={{color:accent}}>+ Add Role</strong> to get started.</div>}
          {(resume.experience||[]).map((exp,ei)=>(
            <div key={exp.id} style={{background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:'var(--radius)',padding:20,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <div style={{fontSize:10,color:accent,fontFamily:"'DM Mono', monospace",letterSpacing:'0.1em'}}>ROLE {String(ei+1).padStart(2,'0')}</div>
                <button onClick={()=>removeExp(exp.id)} style={{background:'none',border:'1px solid rgba(192,57,43,0.4)',color:'#c0392b',cursor:'pointer',padding:'3px 8px',borderRadius:3,fontSize:10}}>Remove</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}} className="form-grid-2">
                <div><label style={labelSt}>Job Title</label><input value={exp.title} onChange={e=>updateExp(exp.id,'title',e.target.value)} style={fieldStyle} placeholder="e.g. Product Manager"/></div>
                <div><label style={labelSt}>Company</label><input value={exp.company} onChange={e=>updateExp(exp.id,'company',e.target.value)} style={fieldStyle} placeholder="e.g. Google"/></div>
              </div>
              <div style={{marginBottom:12}}><label style={labelSt}>Duration</label><input value={exp.duration} onChange={e=>updateExp(exp.id,'duration',e.target.value)} style={fieldStyle} placeholder="e.g. Jan 2022 – Present"/></div>
              <div>
                <label style={labelSt}>Bullet Points</label>
                {exp.bullets.map((b,bi)=>(<div key={bi} style={{display:'flex',gap:6,marginBottom:6}}><span style={{color:accent,marginTop:10,flexShrink:0}}>›</span><input value={b} onChange={e=>updateExpBullet(exp.id,bi,e.target.value)} style={{...fieldStyle,flex:1}} placeholder={`Achievement ${bi+1}…`}/>{exp.bullets.length>1&&<button onClick={()=>removeExpBullet(exp.id,bi)} style={{background:'none',border:'1px solid var(--border2)',color:'var(--muted)',cursor:'pointer',padding:'4px 8px',borderRadius:3,flexShrink:0}}>×</button>}</div>))}
                <button onClick={()=>addExpBullet(exp.id)} style={{fontSize:10,color:accent,background:'none',border:`1px dashed ${accent}40`,padding:'4px 12px',cursor:'pointer',borderRadius:3,marginTop:4,fontFamily:"'DM Mono', monospace"}}>+ Add bullet</button>
              </div>
            </div>
          ))}
        </div>

        <div style={section}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <div style={sHead}>Education</div>
            <button onClick={addEdu} style={{background:accent,color:'#000',border:'none',padding:'7px 14px',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',fontFamily:"'DM Mono', monospace",cursor:'pointer',borderRadius:'var(--radius)',fontWeight:500}}>+ Add Degree</button>
          </div>
          {(resume.education||[]).length===0 && <div style={{textAlign:'center',padding:'24px',color:'var(--muted)',fontSize:12}}>No education added yet. Click <strong style={{color:accent}}>+ Add Degree</strong> to get started.</div>}
          {(resume.education||[]).map((edu,ei)=>(
            <div key={edu.id} style={{background:'var(--surface2)',border:'1px solid var(--border2)',borderRadius:'var(--radius)',padding:20,marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <div style={{fontSize:10,color:accent,fontFamily:"'DM Mono', monospace",letterSpacing:'0.1em'}}>EDU {String(ei+1).padStart(2,'0')}</div>
                <button onClick={()=>removeEdu(edu.id)} style={{background:'none',border:'1px solid rgba(192,57,43,0.4)',color:'#c0392b',cursor:'pointer',padding:'3px 8px',borderRadius:3,fontSize:10}}>Remove</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}} className="form-grid-2">
                <div><label style={labelSt}>Degree / Qualification</label><input value={edu.degree} onChange={e=>updateEdu(edu.id,'degree',e.target.value)} style={fieldStyle} placeholder="e.g. B.Tech Computer Science"/></div>
                <div><label style={labelSt}>Year</label><input value={edu.year} onChange={e=>updateEdu(edu.id,'year',e.target.value)} style={fieldStyle} placeholder="e.g. 2018–2022"/></div>
              </div>
              <div><label style={labelSt}>Institution</label><input value={edu.institution} onChange={e=>updateEdu(edu.id,'institution',e.target.value)} style={fieldStyle} placeholder="e.g. IIT Bombay"/></div>
            </div>
          ))}
        </div>
      </>)}

      {activeTab==='style' && (<>
        <div style={section}>
          <div style={sHead}>Resume Format</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}>
            {RESUME_LAYOUTS.map(l=>(
              <div key={l.key} onClick={()=>setSelectedLayout(l.key)} style={{padding:'14px 14px 12px',cursor:'pointer',border:`2px solid ${selectedLayout===l.key?accent:'var(--border)'}`,background:selectedLayout===l.key?`${accent}12`:'var(--surface2)',borderRadius:'var(--radius)',transition:'border-color 0.12s,background 0.12s',boxShadow:selectedLayout===l.key?`0 0 10px ${accent}30`:'none'}}>
                <div style={{width:'100%',height:48,background:selectedLayout===l.key?`${accent}15`:'var(--surface)',borderRadius:4,marginBottom:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{l.key==='classic'?'📄':l.key==='sidebar'?'📋':l.key==='modern'?'🗂':l.key==='minimal'?'✨':'🏆'}</div>
                <div style={{fontSize:12,color:selectedLayout===l.key?accent:'var(--text)',fontWeight:selectedLayout===l.key?600:400}}>{l.name}</div>
                <div style={{fontSize:9,color:'var(--muted)',marginTop:2}}>{l.desc}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:'8px 12px',background:`${accent}08`,border:`1px solid ${accent}20`,borderRadius:'var(--radius)',fontSize:10,color:'var(--muted)',fontFamily:"'DM Mono', monospace"}}>✦ Format changes apply instantly in the Preview tab</div>
        </div>
        <div style={section}>
          <div style={sHead}>Typography</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
            {RESUME_FONTS.map(f=>(
              <div key={f.value} onClick={()=>setSelectedFont(f.value)} style={{padding:'14px 16px',cursor:'pointer',border:`1px solid ${selectedFont===f.value?accent:'var(--border)'}`,background:selectedFont===f.value?`${accent}12`:'var(--surface2)',borderRadius:'var(--radius)',transition:'border-color 0.12s,background 0.12s'}}>
                <div style={{fontFamily:f.value,fontSize:16,color:'var(--cream)',marginBottom:4}}>Aa</div>
                <div style={{fontSize:11,color:selectedFont===f.value?accent:'var(--text)',fontFamily:f.value}}>{f.label}</div>
                <div style={{fontSize:9,color:'var(--muted)',fontFamily:"'DM Mono', monospace",letterSpacing:'0.1em',marginTop:2,textTransform:'uppercase'}}>{f.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </>)}

      {activeTab==='preview' && (
        <div>
          {/* Accent Theme — live in preview so changes are instant */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:9,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--muted)',fontFamily:"'DM Mono', monospace",marginBottom:8}}>Accent Theme</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {RESUME_THEMES.map(t=>(
                <div key={t.slug} onClick={()=>setSelectedTheme(t.slug)} style={{flexShrink:0,cursor:'pointer',width:64}}>
                  <div style={{width:64,height:40,background:'var(--surface)',border:`2px solid ${selectedTheme===t.slug?t.color:'var(--border)'}`,borderRadius:4,padding:'6px 8px',display:'flex',flexDirection:'column',gap:3,boxShadow:selectedTheme===t.slug?`0 0 8px ${t.color}55`:'none',transition:'border-color 0.12s,box-shadow 0.12s'}}>
                    <div style={{height:2,borderRadius:1,background:t.color}}/>
                    <div style={{height:2,borderRadius:1,background:'rgba(255,255,255,0.15)',width:'70%'}}/>
                    <div style={{height:2,borderRadius:1,background:'rgba(255,255,255,0.08)',width:'45%'}}/>
                  </div>
                  <div style={{fontSize:8,textAlign:'center',marginTop:4,color:selectedTheme===t.slug?t.color:'var(--muted2)',fontFamily:"'DM Mono', monospace",letterSpacing:'0.05em',textTransform:'uppercase',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:6,marginBottom:16,overflowX:'auto',scrollbarWidth:'none',paddingBottom:4}}>
            {RESUME_LAYOUTS.map(l=>(
              <button key={l.key} onClick={()=>setSelectedLayout(l.key)} style={{padding:'6px 14px',fontSize:10,letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:"'DM Mono', monospace",cursor:'pointer',flexShrink:0,border:`1px solid ${selectedLayout===l.key?accent:'var(--border2)'}`,background:selectedLayout===l.key?`${accent}18`:'transparent',color:selectedLayout===l.key?accent:'var(--muted)',borderRadius:'var(--radius)',transition:'border-color 0.12s,background 0.12s'}}>{l.name}</button>
            ))}
          </div>
          <div style={{background:'#EEEAE4',borderBottom:'1px solid #DDD8D0',padding:'8px 20px',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',borderRadius:'6px 6px 0 0'}}>
            <span style={{fontSize:9,letterSpacing:'0.14em',textTransform:'uppercase',color:'#888',fontFamily:"'DM Mono', monospace"}}>Font:</span>
            {RESUME_FONTS.map(f=>(<button key={f.value} onClick={()=>setSelectedFont(f.value)} style={{padding:'3px 10px',fontSize:10,cursor:'pointer',flexShrink:0,border:`1px solid ${bodyFont===f.value?accent:'#C8C0B8'}`,background:bodyFont===f.value?`${accent}18`:'#F8F6F2',color:bodyFont===f.value?accent:'#555',borderRadius:3,fontFamily:f.value,whiteSpace:'nowrap',transition:'border-color 0.12s,background 0.12s'}}>{f.label}</button>))}
          </div>
          <div style={{background:'#F8F6F2',borderRadius:'0 0 6px 6px',overflow:'hidden',border:'1px solid #DDD8D0',borderTop:'none'}}>
            <ResumePreviewByLayout resume={resume} accent={accent} bodyFont={bodyFont} headingFont={headingFont} layout={selectedLayout}/>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:12,marginTop:24,flexWrap:'wrap'}}>
        <button onClick={handleSave} disabled={saving} style={{background:accent,color:'#000',border:'none',padding:'12px 28px',fontSize:11,letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:"'DM Mono', monospace",fontWeight:500,cursor:saving?'not-allowed':'pointer',borderRadius:'var(--radius)',opacity:saving?0.7:1,transition:'all 0.15s'}}>{saving?'Saving…':'Save Resume'}</button>
        <ResumeExportBtn genId={genId} accent={accent}/>
        <button onClick={()=>setActiveTab('preview')} style={{background:'transparent',border:`1px solid ${accent}`,color:accent,padding:'12px 20px',fontSize:11,letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:"'DM Mono', monospace",cursor:'pointer',borderRadius:'var(--radius)'}}>Preview</button>
        <Link href="/generate" style={{display:'inline-flex',alignItems:'center',padding:'12px 20px',fontSize:11,letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:"'DM Mono', monospace",color:'var(--muted)',textDecoration:'none',border:'1px solid var(--border)',borderRadius:'var(--radius)'}}>Back</Link>
      </div>
    </div>
  )
}

export default function ResumeEditClient({ accentColor }: { accentColor: string }) {
  return (
    <Suspense fallback={<div style={{padding:40,textAlign:'center',color:'#A09890',fontSize:12}}>Loading resume…</div>}>
      <ResumeEditClientInner accentColor={accentColor}/>
    </Suspense>
  )
}
