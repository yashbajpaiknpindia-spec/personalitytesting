'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Gen {
  id: string
  version: number
  createdAt: string
  template: { name: string; category: string; accentColor: string } | null
  inputData: Record<string, unknown> | null
  outputData: Record<string, unknown> | null
}

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

interface Pres {
  id: string
  title: string
  accentColor: string
  updatedAt: string
  slides: { id: string }[]
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

function ExportPanel({ gen, accent }: { gen: Gen; accent: string }) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const selectedTypes: string[] = Array.isArray(gen.inputData?.outputTypes)
    ? gen.inputData!.outputTypes as string[]
    : ['portfolio', 'card', 'resume']

  async function doExport(format: string, type: string) {
    setExporting(`${type}-${format}`)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: gen.id, format, type }),
      })
      if (!res.ok) {
        const d = await res.json()
        setToast(d.error || 'Export failed')
        setTimeout(() => setToast(''), 3000)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = format === 'pptx' ? 'pptx' : format === 'pdf' ? 'pdf' : 'json'
      a.download = `${type}-${gen.id.slice(-6)}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      setToast('Exported!')
      setTimeout(() => setToast(''), 2500)
    } catch {
      setToast('Export failed')
      setTimeout(() => setToast(''), 3000)
    } finally {
      setExporting(null)
    }
  }

  const exportOptions: Array<{ type: string; formats: string[] }> = [
    ...(selectedTypes.includes('portfolio')     ? [{ type: 'portfolio',     formats: ['pdf', 'json'] }] : []),
    ...(selectedTypes.includes('resume')        ? [{ type: 'resume',        formats: ['pdf', 'json'] }] : []),
    ...(selectedTypes.includes('card')          ? [{ type: 'card',          formats: ['pdf', 'json'] }] : []),
    ...(selectedTypes.includes('presentation')  ? [{ type: 'presentation',  formats: ['pptx', 'pdf'] }] : []),
  ]

  if (exportOptions.length === 0) return null

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '10px 4px',
          background: open ? `${accent}15` : 'transparent',
          color: open ? accent : 'var(--muted)',
          fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase',
          fontFamily: "'DM Mono',monospace", border: 'none',
          borderRight: '1px solid var(--border)', cursor: 'pointer',
          transition: 'color 0.15s,background 0.15s',
        }}
        onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.color = 'var(--cream)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' }}}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}}
      >⬇ Export</button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 4px)', right: 0,
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 6, padding: 14, zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 220,
        }}>
          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono',monospace", marginBottom: 10 }}>Export Assets</div>
          {exportOptions.map(({ type, formats }) => (
            <div key={type} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: accent, fontFamily: "'DM Mono',monospace", textTransform: 'capitalize', marginBottom: 6 }}>{type}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {formats.map(fmt => (
                  <ExportBtn key={fmt} label={exporting === `${type}-${fmt}` ? '…' : fmt.toUpperCase()} accent={accent} onClick={() => doExport(fmt, type)} />
                ))}
              </div>
            </div>
          ))}
          {toast && <div style={{ fontSize: 10, color: toast === 'Exported!' ? '#27AE60' : '#E74C3C', fontFamily: "'DM Mono',monospace", marginTop: 8 }}>{toast}</div>}
          <button onClick={() => setOpen(false)} style={{ marginTop: 10, width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '5px', fontSize: 9, cursor: 'pointer', borderRadius: 2, fontFamily: "'DM Mono',monospace", letterSpacing: '0.08em' }}>Close</button>
        </div>
      )}
    </div>
  )
}

function SlideDeckModal({ gens, genId, onClose, accent }: { gens: Pres[]; genId: string; onClose: () => void; accent: string }) {
  const router = useRouter()
  const decks = gens.filter(p => (p as unknown as { generationId?: string }).generationId === genId || true)
  if (decks.length === 0) {
    return (
      <div style={overlay} onClick={onClose}>
        <div style={modal} onClick={e => e.stopPropagation()}>
          <div style={modalHead}>Slide Decks</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>No slide decks for this portfolio yet.</p>
          <Link href={`/presentations?gen=${genId}`} style={btnPrimary(accent)}>Create Slide Deck →</Link>
          <button onClick={onClose} style={btnClose}>Close</button>
        </div>
      </div>
    )
  }
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={modalHead}>Select Slide Deck</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {decks.map(pres => {
            const a = pres.accentColor ?? accent
            return (
              <button key={pres.id} onClick={() => router.push(`/presentations/${pres.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', background: 'var(--surface)', border: `1px solid ${a}30`, borderRadius: 8, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = a; (e.currentTarget as HTMLElement).style.background = `${a}10` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${a}30`; (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
              >
                <div style={{ flexShrink: 0, width: 52, height: 36, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(to bottom,${a},${a}40)` }} />
                  <div style={{ width: '100%' }}>
                    <div style={{ height: 2, background: a, width: '70%', borderRadius: 1, marginBottom: 4, opacity: 0.9 }} />
                    <div style={{ height: 2, background: 'var(--border2)', width: '90%', borderRadius: 1, marginBottom: 3 }} />
                    <div style={{ height: 2, background: 'var(--border2)', width: '55%', borderRadius: 1, opacity: 0.5 }} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{pres.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>{pres.slides.length} slide{pres.slides.length !== 1 ? 's' : ''} · Updated {new Date(pres.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
                <div style={{ fontSize: 14, color: a, flexShrink: 0 }}>▶</div>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href={`/presentations?gen=${genId}`} style={{ ...btnPrimary(accent), flex: 1, textAlign: 'center' as const }}>+ New Deck</Link>
          <button onClick={onClose} style={{ ...btnClose, flex: 1 }}>Close</button>
        </div>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }
const modal: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }
const modalHead: React.CSSProperties = { fontFamily: "'Playfair Display',serif", fontSize: 20, color: 'var(--cream)', marginBottom: 16 }
function btnPrimary(accent: string): React.CSSProperties {
  return { display: 'inline-block', background: accent, color: '#000', border: 'none', padding: '10px 20px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius)', textDecoration: 'none' }
}
const btnClose: React.CSSProperties = { background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '10px 20px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", cursor: 'pointer', borderRadius: 'var(--radius)' }

function NotSelectedBtn({ label, accent, genId }: { label: string; accent: string; genId: string }) {
  const [showTip, setShowTip] = useState(false)
  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <button
        onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}
        onClick={() => { window.location.href = `/generate?from=${genId}` }}
        style={{ width: '100%', padding: '10px 4px', background: 'transparent', color: 'var(--surface3)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer', transition: 'color 0.15s,background 0.15s', textDecoration: 'line-through', opacity: 0.45 }}
      >{label}</button>
      {showTip && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 4, padding: '6px 10px', fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
          Not selected — <span style={{ color: accent }}>Remix to include {label.toLowerCase()}</span>
        </div>
      )}
    </div>
  )
}

function actionTab(color: string, bg: string, border: boolean): React.CSSProperties {
  return { flex: 1, textAlign: 'center', padding: '10px 4px', background: bg, color, fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", textDecoration: 'none', borderRight: border ? '1px solid var(--border)' : 'none', transition: 'color 0.15s,background 0.15s' }
}

// ── Business export: copy text content ───────────────────────────────────────
function BizExportPanel({ gen, accent }: { gen: BusinessGen; accent: string }) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState('')

  const outputTypes: string[] = Array.isArray(gen.inputData?.outputTypes) ? gen.inputData!.outputTypes! : ['logo', 'banner', 'flyer', 'poster', 'copy']
  const out = (gen.outputData ?? {}) as Record<string, unknown>

  const assetActions: Array<{ key: string; label: string; show: boolean }> = [
    { key: 'copyHeadlines',         label: 'Headlines',       show: outputTypes.includes('copy') },
    { key: 'copySocialCaptions',    label: 'Social Captions', show: outputTypes.includes('copy') },
    { key: 'copyEmailBody',         label: 'Email Body',      show: outputTypes.includes('copy') },
    { key: 'copyAdCopy',            label: 'Ad Copy',         show: outputTypes.includes('copy') },
    { key: 'logoConceptDescription',label: 'Logo Brief',      show: outputTypes.includes('logo') },
    { key: 'bannerHeadline',        label: 'Banner Copy',     show: outputTypes.includes('banner') },
    { key: 'flyerBody',             label: 'Flyer Body',      show: outputTypes.includes('flyer') },
    { key: 'posterHeadline',        label: 'Poster Headline', show: outputTypes.includes('poster') },
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

// ── Business history card ─────────────────────────────────────────────────────
function BizGenCard({ gen }: { gen: BusinessGen }) {
  const accent = '#C9A84C'
  const outputTypes: string[] = Array.isArray(gen.inputData?.outputTypes) ? gen.inputData!.outputTypes! : ['logo', 'banner', 'flyer', 'poster', 'copy']
  const bizTypeIcons: Record<string, string> = { logo: '◇', banner: '▭', flyer: '◻', poster: '◼', copy: '✦' }
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'border-color 0.18s,box-shadow 0.18s' }}
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
          title="Preview and edit this generation"
        >▶ Preview</Link>
        <Link href={`/generate?from=${gen.id}`}
          style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: 'transparent', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'all 0.15s', minWidth: 60 }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--cream)'; el.style.background = 'var(--surface2)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}
          title="Re-generate with same inputs"
        >↺ Remix</Link>
        <Link href={`/business/edit?gen=${gen.id}`}
          style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: 'transparent', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'all 0.15s', minWidth: 60 }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--cream)'; el.style.background = 'var(--surface2)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}
          title="Edit assets in full editor"
        >✎ Edit</Link>
        <BizExportPanel gen={gen} accent={accent} />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MyWorkPage() {
  const [tab, setTab] = useState<'personal' | 'business'>('personal')
  const [gens, setGens] = useState<Gen[]>([])
  const [bizGens, setBizGens] = useState<BusinessGen[]>([])
  const [presentations, setPresentations] = useState<Pres[]>([])
  const [loading, setLoading] = useState(true)
  const [slidesFor, setSlidesFor] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/my-generations').then(r => r.ok ? r.json() : { generations: [] }).catch(() => ({ generations: [] })),
      fetch('/api/presentation').then(r => r.ok ? r.json() : { presentations: [] }).catch(() => ({ presentations: [] })),
      fetch('/api/my-generations?mode=business').then(r => r.ok ? r.json() : { generations: [] }).catch(() => ({ generations: [] })),
    ])
      .then(([gData, pData, bData]) => {
        setGens(Array.isArray(gData?.generations) ? gData.generations : [])
        setPresentations(Array.isArray(pData?.presentations) ? pData.presentations : [])
        setBizGens(Array.isArray(bData?.generations) ? bData.generations : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const accent = '#C9A84C'

  return (
    <div className="page-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono',monospace", marginBottom: 20 }}>
        <div style={{ width: 20, height: 1, background: 'var(--gold)' }} /> My Work
      </div>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(24px,5vw,32px)', fontWeight: 400, color: 'var(--cream)', marginBottom: 8 }}>Generation History</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.65 }}>
        All your AI-generated brand assets. Click <strong style={{ color: 'var(--gold)' }}>Edit</strong> to modify or export any generation.
      </p>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
        {(['personal', 'business'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px 9px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', background: 'none', border: 'none', borderBottom: tab === t ? `2px solid ${accent}` : '2px solid transparent', marginBottom: -1, fontFamily: "'DM Mono',monospace", transition: 'all 0.15s', color: tab === t ? accent : 'var(--muted)' }}>
            {t === 'business' ? `✦ Business${!loading && bizGens.length > 0 ? ` (${bizGens.length})` : ''}` : `Personal${!loading && gens.length > 0 ? ` (${gens.length})` : ''}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ width: 28, height: 28, border: '1px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : tab === 'personal' ? (
        gens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: 'var(--surface3)', marginBottom: 12 }}>No generations yet</div>
            <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 24 }}>Your brand starts with one prompt.</p>
            <Link href="/generate" style={{ background: 'var(--gold)', color: '#000', padding: '10px 24px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Generate Now</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
            {gens.map(gen => {
              const accentColor = gen.template?.accentColor ?? 'var(--gold)'
              const label = (gen.outputData?.cardName as string) || (gen.outputData?.headline as string) || (gen.inputData?.headline as string) || (gen.inputData?.name as string) || 'Untitled'
              const selectedTypes: string[] = Array.isArray(gen.inputData?.outputTypes)
                ? gen.inputData!.outputTypes as string[]
                : ['portfolio', 'card', 'resume']
              const hasPresentation = selectedTypes.includes('presentation') && Array.isArray(gen.outputData?.presentationSlides) && ((gen.outputData?.presentationSlides as unknown[])?.length ?? 0) > 0
              const hasPortfolio = selectedTypes.includes('portfolio')
              const hasResume = selectedTypes.includes('resume')
              const hasCard = selectedTypes.includes('card')
              return (
                <div key={gen.id}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative', transition: 'border-color 0.18s,box-shadow 0.18s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${accentColor}40`; el.style.boxShadow = `0 6px 24px ${accentColor}12` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = '' }}
                >
                  <div style={{ height: 3, background: `linear-gradient(90deg,${accentColor},${accentColor}50,transparent)` }} />
                  <div style={{ padding: '18px 18px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: accentColor, fontFamily: "'DM Mono',monospace", background: `${accentColor}15`, border: `1px solid ${accentColor}30`, padding: '2px 8px', borderRadius: 2 }}>{gen.template?.category ?? '—'}</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>v{gen.version} · {new Date(gen.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                    <div style={{ height: 60, background: 'var(--surface2)', borderRadius: 3, marginBottom: 14, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom,${accentColor},${accentColor}30)` }} />
                      <div style={{ height: 2, background: accentColor, width: '78%', borderRadius: 1, opacity: 0.8 }} />
                      <div style={{ height: 2, background: 'var(--border2)', width: '56%', borderRadius: 1 }} />
                      <div style={{ height: 2, background: 'var(--border2)', width: '38%', borderRadius: 1, opacity: 0.6 }} />
                    </div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: 'var(--cream)', marginBottom: 4, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>{gen.template?.name ?? 'Brand Kit'}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                      {selectedTypes.map(t => (
                        <span key={t} style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentColor, background: `${accentColor}12`, border: `1px solid ${accentColor}25`, padding: '1px 6px', borderRadius: 2, fontFamily: "'DM Mono',monospace" }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                    <Link href={`/generate?from=${gen.id}&preview=1`}
                      style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: `${accentColor}12`, color: accentColor, fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'background 0.15s', minWidth: 60 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${accentColor}25` }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${accentColor}12` }}
                      title="Preview this generation's output"
                    >▶ Preview</Link>
                    <Link href={`/generate?from=${gen.id}`} style={actionTab('var(--muted)', 'transparent', true)}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--cream)'; el.style.background = 'var(--surface2)' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}
                    >↺ Remix</Link>
                    {hasPortfolio ? (
                      <Link href={`/portfolio?gen=${gen.id}`} style={actionTab('var(--muted)', 'transparent', true)}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--cream)'; el.style.background = 'var(--surface2)' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}
                      >Portfolio</Link>
                    ) : <NotSelectedBtn label="Portfolio" accent={accentColor} genId={gen.id} />}
                    {hasResume ? (
                      <Link href={`/resume/edit?gen=${gen.id}`} style={actionTab('var(--muted)', 'transparent', true)}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--cream)'; el.style.background = 'var(--surface2)' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}
                      >Resume</Link>
                    ) : <NotSelectedBtn label="Resume" accent={accentColor} genId={gen.id} />}
                    {hasCard ? (
                      <Link href={`/card/edit?gen=${gen.id}`} style={actionTab('var(--muted)', 'transparent', true)}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--cream)'; el.style.background = 'var(--surface2)' }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}
                      >Card</Link>
                    ) : <NotSelectedBtn label="Card" accent={accentColor} genId={gen.id} />}
                    {hasPresentation ? (
                      <button onClick={() => setSlidesFor(gen.id)}
                        style={{ ...actionTab(accentColor, `${accentColor}15`, true) as React.CSSProperties, fontWeight: 500, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}28` }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}15` }}
                      >
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M4 12h6M7 10v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                        Slides
                      </button>
                    ) : <NotSelectedBtn label="Slides" accent={accentColor} genId={gen.id} />}
                    <ExportPanel gen={gen} accent={accentColor} />
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* ── BUSINESS TAB ── */
        bizGens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: 'var(--surface3)', marginBottom: 12 }}>No business generations yet</div>
            <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 24 }}>Switch to Business Mode on the Generate page to create logos, banners, flyers and more.</p>
            <Link href="/generate" style={{ background: 'var(--gold)', color: '#000', padding: '10px 24px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Open Business Studio ✦</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
            {bizGens.map(gen => <BizGenCard key={gen.id} gen={gen} />)}
          </div>
        )
      )}

      {slidesFor && (
        <SlideDeckModal
          gens={presentations}
          genId={slidesFor}
          onClose={() => setSlidesFor(null)}
          accent={gens.find(g => g.id === slidesFor)?.template?.accentColor ?? '#C9A84C'}
        />
      )}
    </div>
  )
}
