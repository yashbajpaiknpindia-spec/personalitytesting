'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BusinessGen {
  id: string
  createdAt: string
  inputData: {
    companyName?: string
    industry?: string
    outputTypes?: string[]
  } | null
  outputData: Record<string, unknown> | null
}

function ExportBtn({ label, onClick, accent }: { label: string; onClick: () => void; accent: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', fontSize: 9, letterSpacing: '0.1em',
        textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
        background: `${accent}18`, border: `1px solid ${accent}35`,
        color: accent, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accent}32` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${accent}18` }}
    >{label}</button>
  )
}

function BizExportPanel({ gen, accent }: { gen: BusinessGen; accent: string }) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState('')
  const outputTypes: string[] = Array.isArray(gen.inputData?.outputTypes) ? gen.inputData!.outputTypes! : ['logo', 'banner', 'flyer', 'poster', 'copy']
  const out = (gen.outputData ?? {}) as Record<string, unknown>
  const assetActions: Array<{ key: string; label: string; show: boolean }> = [
    { key: 'copyHeadlines',          label: 'Headlines',       show: outputTypes.includes('copy') },
    { key: 'copySocialCaptions',     label: 'Social Captions', show: outputTypes.includes('copy') },
    { key: 'copyEmailBody',          label: 'Email Body',      show: outputTypes.includes('copy') },
    { key: 'copyAdCopy',             label: 'Ad Copy',         show: outputTypes.includes('copy') },
    { key: 'logoConceptDescription', label: 'Logo Brief',      show: outputTypes.includes('logo') },
    { key: 'bannerHeadline',         label: 'Banner Copy',     show: outputTypes.includes('banner') },
    { key: 'flyerBody',              label: 'Flyer Body',      show: outputTypes.includes('flyer') },
    { key: 'posterHeadline',         label: 'Poster Headline', show: outputTypes.includes('poster') },
  ].filter(a => a.show && out[a.key])

  function copyToClipboard(key: string, label: string) {
    const val = out[key]
    if (!val) return
    const text = Array.isArray(val) ? (val as string[]).join('\n') : String(val)
    navigator.clipboard.writeText(text).then(() => { setToast(`${label} copied!`); setTimeout(() => setToast(''), 2000) })
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ id: gen.id, inputData: gen.inputData, outputData: gen.outputData }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `business-brand-${gen.id.slice(-6)}.json`; a.click()
    URL.revokeObjectURL(url)
    setToast('JSON exported!'); setTimeout(() => setToast(''), 2000)
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '10px 4px', background: open ? `${accent}15` : 'transparent', color: open ? accent : 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", border: 'none', cursor: 'pointer', transition: 'color 0.15s,background 0.15s' }}
        onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.color = 'var(--cream)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}}
      >⬇ Export</button>
      {open && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', right: 0, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 6, padding: 14, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 230 }}>
          {assetActions.length > 0 && (
            <>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono',monospace", marginBottom: 8 }}>Copy to Clipboard</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                {assetActions.map(({ key, label }) => (
                  <ExportBtn key={key} label={label} accent={accent} onClick={() => copyToClipboard(key, label)} />
                ))}
              </div>
            </>
          )}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono',monospace", marginBottom: 8 }}>Download</div>
            <ExportBtn label="Full JSON" accent={accent} onClick={exportJSON} />
          </div>
          {toast && <div style={{ fontSize: 10, color: '#27AE60', fontFamily: "'DM Mono',monospace", marginTop: 8 }}>{toast}</div>}
          <button onClick={() => setOpen(false)} style={{ marginTop: 10, width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '5px', fontSize: 9, cursor: 'pointer', borderRadius: 2, fontFamily: "'DM Mono',monospace", letterSpacing: '0.08em' }}>Close</button>
        </div>
      )}
    </div>
  )
}

function BizGenCard({ gen }: { gen: BusinessGen }) {
  const accent = '#C9A84C'
  const outputTypes: string[] = Array.isArray(gen.inputData?.outputTypes) ? gen.inputData!.outputTypes! : ['logo', 'banner', 'flyer', 'poster', 'copy']
  const bizTypeIcons: Record<string, string> = { logo: '◇', banner: '▭', flyer: '◻', poster: '◼', copy: '✦', website: '⬡', presentation: '⬛' }
  return (
    <div
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'border-color 0.18s,box-shadow 0.18s' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${accent}40`; el.style.boxShadow = `0 6px 24px ${accent}12` }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = '' }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg,${accent},${accent}50,transparent)` }} />
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono',monospace", background: `${accent}15`, border: `1px solid ${accent}30`, padding: '2px 8px', borderRadius: 2 }}>✦ Business</div>
          <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>{new Date(gen.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>
        <div style={{ height: 60, background: 'var(--surface2)', borderRadius: 3, marginBottom: 14, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom,${accent},${accent}30)` }} />
          <div style={{ height: 2, background: accent, width: '78%', borderRadius: 1, opacity: 0.8 }} />
          <div style={{ height: 2, background: 'var(--border2)', width: '56%', borderRadius: 1 }} />
          <div style={{ height: 2, background: 'var(--border2)', width: '38%', borderRadius: 1, opacity: 0.6 }} />
        </div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: 'var(--cream)', marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {gen.inputData?.companyName || 'Untitled Company'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>{gen.inputData?.industry || 'Business Brand'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
          {outputTypes.map(t => (
            <span key={t} style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, background: `${accent}12`, border: `1px solid ${accent}25`, padding: '1px 6px', borderRadius: 2, fontFamily: "'DM Mono',monospace" }}>
              {bizTypeIcons[t] ?? ''} {t}
            </span>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <Link href={`/generate?gen=${gen.id}`}
          style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: `${accent}15`, color: accent, fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'background 0.15s', minWidth: 60 }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${accent}28` }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${accent}15` }}
        >▶ Preview</Link>
        <Link href={`/generate?from=${gen.id}`}
          style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: 'transparent', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'all 0.15s', minWidth: 60 }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--cream)'; el.style.background = 'var(--surface2)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}
        >↺ Remix</Link>
        <Link href={`/business/edit?gen=${gen.id}`}
          style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: 'transparent', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'all 0.15s', minWidth: 60 }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--cream)'; el.style.background = 'var(--surface2)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}
        >✎ Edit</Link>
        <BizExportPanel gen={gen} accent={accent} />
      </div>
    </div>
  )
}

export default function MyWorkPage() {
  const [bizGens, setBizGens] = useState<BusinessGen[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/my-generations?mode=business')
      .then(r => r.ok ? r.json() : { generations: [] })
      .catch(() => ({ generations: [] }))
      .then(bData => setBizGens(Array.isArray(bData?.generations) ? bData.generations : []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono',monospace", marginBottom: 20 }}>
        <div style={{ width: 20, height: 1, background: 'var(--gold)' }} /> My Work
      </div>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(24px,5vw,32px)', fontWeight: 400, color: 'var(--cream)', marginBottom: 8 }}>Generation History</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.65 }}>
        All your AI-generated brand assets. Click <strong style={{ color: 'var(--gold)' }}>Edit</strong> to modify or export any generation.
      </p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ width: 28, height: 28, border: '1px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : bizGens.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: 'var(--surface3)', marginBottom: 12 }}>No generations yet</div>
          <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 24 }}>Generate your first brand identity to get started.</p>
          <Link href="/generate" style={{ background: 'var(--gold)', color: '#000', padding: '10px 24px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Generate Now ✦</Link>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20, fontFamily: "'DM Mono',monospace" }}>
            {bizGens.length} generation{bizGens.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
            {bizGens.map(gen => <BizGenCard key={gen.id} gen={gen} />)}
          </div>
        </>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
