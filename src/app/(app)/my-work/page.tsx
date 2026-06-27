'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface BusinessGen {
  id: string
  createdAt: string
  status?: string
  inputData: {
    companyName?: string
    industry?: string
    outputTypes?: string[]
    tagline?: string
    primaryColors?: string[]
    generationType?: string
    prompt?: string
    duration?: number
  } | null
  outputData: Record<string, unknown> | null
}

interface UserWebsite {
  id: string; name: string; templateId: string | null; templateLabel: string | null
  isGenerated: boolean; isPublished: boolean; slug: string | null
  customDomain: string | null; domainVerified: boolean; createdAt: string; updatedAt: string
}

interface ChatThreadSummary {
  id: string
  title: string
  totalCostInr: number
  totalCostUsd: number
  messageCount: number
  lastMessageAt: string | null
  createdAt: string
  messages?: Array<{ content: string; role?: string; createdAt: string }>
}

interface ChatMessageView {
  id: string
  role: string
  content: string
  createdAt: string
}

const purple = '#9B7FD4'

const accent = '#C9A84C'
const blue = '#4CA8C9'
const green = '#27AE60'

// ── helpers ──────────────────────────────────────────────────────────────────
// Older generations may not have inputData.outputTypes saved. Infer the asset
// types present from the shape of outputData (and any generationType hints in
// inputData) so cards/previews/exports still render correctly for them.
function inferOutputTypes(outputData: Record<string, unknown>, inputData?: Record<string, unknown> | null): string[] {
  const out = outputData ?? {}
  const t: string[] = []

  const hasLogo = Boolean(
    (out as any)._logoImageUri ??
    (out as any).finalLogoUri ??
    (out as any).logoImageUri ??
    (out as any).logoUrl ??
    (out as any).logoConceptDescription ??
    ((out as any).imageGenerated && ((out as any).imageDataUri || (out as any).imageUrl))
  )
  const hasImages = Boolean(
    (Array.isArray((out as any)._persistedImages) && (out as any)._persistedImages.length > 0) ||
    (Array.isArray((out as any)._generatedImages) && (out as any)._generatedImages.length > 0) ||
    (Array.isArray((out as any).graphics) && (out as any).graphics.length > 0) ||
    (Array.isArray((out as any).variations) && (out as any).variations.length > 0) ||
    (out as any).finalPosterUrl || (out as any).imageUrl || (out as any).imageDataUri || (out as any).previewImageUrl
  )
  const hasGraphics = Boolean(
    (Array.isArray((out as any).graphics) && (out as any).graphics.length > 0) ||
    (out as any).bannerHeadline
  )
  const hasStrategy = Boolean((out as any).strategy)
  const hasCalendar = Boolean((out as any).contentCalendar)
  const hasCopy = Boolean(
    (out as any).copyHeadlines ?? (out as any).headlines ??
    (out as any).copySocialCaptions ?? (out as any).copyEmailBody ?? (out as any).copyAdCopy
  )
  const hasWebsite = Boolean((out as any).websiteHtml)

  if (hasLogo) t.push('logo')
  if (hasGraphics) t.push('graphics')
  if (hasImages && !hasGraphics) t.push('images')
  if (hasStrategy) t.push('strategy')
  if (hasCalendar) t.push('calendar')
  if (hasCopy) t.push('copy')
  if (hasWebsite) t.push('website')

  if (t.length === 0) {
    const genType = (inputData?.generationType ?? (out as any).generationType) as string | undefined
    if (genType === 'graphics' || genType === 'poster') t.push('graphics')
    else if (genType === 'website') t.push('website')
    else if (genType === 'logo') t.push('logo')
    else if (genType === 'calendar') t.push('calendar')
    else if (genType === 'strategy') t.push('strategy')
  }

  return t
}

type ImageAsset = { src: string; label: string }

function isImageUrlLike(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const v = value.trim()
  if (!v) return false
  return v.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)(\?|#|$)/i.test(v) ||
    /^https?:\/\/[^\s]+/i.test(v) && /(image|logo|photo|poster|cloudinary|unsplash|pexels|openai|replicate|cdn)/i.test(v)
}

function collectImageAssets(value: unknown, limit = 16): ImageAsset[] {
  const assets: ImageAsset[] = []
  const seen = new Set<string>()
  const preferredKeys = /^(imageDataUri|imageUrl|finalPosterUrl|previewImageUrl|url|logoUrl|logoImageUri|_logoImageUri|finalLogoUri|src)$/i

  function walk(node: unknown, key = 'Image', depth = 0) {
    if (assets.length >= limit || depth > 6 || node == null) return
    if (isImageUrlLike(node)) {
      if (!seen.has(node)) {
        seen.add(node)
        const label = key.replace(/^_+/, '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/uri$/i, '').trim() || 'Image'
        assets.push({ src: node, label: label.charAt(0).toUpperCase() + label.slice(1) })
      }
      return
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `Image ${i + 1}`, depth + 1))
      return
    }
    if (typeof node === 'object') {
      const obj = node as Record<string, unknown>
      Object.keys(obj).sort((a, b) => Number(!preferredKeys.test(a)) - Number(!preferredKeys.test(b))).forEach(k => walk(obj[k], k, depth + 1))
    }
  }

  walk(value)
  return assets
}

function getLogoImageUri(out: Record<string, unknown>): string | undefined {
  const direct = out._logoImageUri ?? out.finalLogoUri ?? out.logoImageUri ?? out.logoUrl ?? out.imageDataUri ?? out.imageUrl ?? out.finalPosterUrl ?? out.previewImageUrl
  if (isImageUrlLike(direct)) return direct
  return collectImageAssets(out, 1)[0]?.src
}

function stringifyBrief(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(stringifyBrief).filter(Boolean).join('\n')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}: ${stringifyBrief(v)}`)
      .filter(line => !line.endsWith(': '))
      .join('\n')
  }
  return String(value)
}


function editTabForAsset(assetType: string): string {
  const type = String(assetType || '').toLowerCase()
  if (type === 'logo') return 'logo'
  if (type === 'images' || type === 'graphics' || type === 'poster' || type === 'brand-images') return 'images'
  if (type === 'copy' || type === 'content') return 'copy'
  if (type === 'strategy') return 'strategy'
  if (type === 'calendar' || type === 'content-calendar') return 'calendar'
  if (type === 'website') return 'website'
  return 'brand'
}

function buildAssetAIQuestion(gen: BusinessGen, assetType: string, assetLabel: string): string {
  const input = (gen.inputData ?? {}) as Record<string, unknown>
  const out = (gen.outputData ?? {}) as Record<string, unknown>
  const companyName = String(input.companyName || out.companyName || 'this generated asset')
  const industry = String(input.industry || out.industry || 'business')
  const shortPrompt = String(input.prompt || input.tagline || out.tagline || '').slice(0, 280)
  const assetSummary = stringifyBrief({
    type: assetLabel || assetType,
    companyName,
    industry,
    prompt: shortPrompt,
    headline: out.bannerHeadline || out.headline || out.title,
    logoBrief: out.logoConceptDescription || out.logoBrief,
    strategy: out.strategy,
    calendar: out.contentCalendar,
    copy: out.copyHeadlines || out.copySocialCaptions || out.copyAdCopy,
  }).slice(0, 2200)

  return `Analyze this exact saved Brand Syndicate asset and give clear, practical improvement suggestions.

Asset ID: ${gen.id}
Asset type: ${assetLabel || assetType}
Business: ${companyName}
Industry: ${industry}

Saved asset context:
${assetSummary}

Tell me what is working, what can be improved, and the best next edit to make. Do not give generic advice; focus on this saved asset.`
}

// ── Export panel ──────────────────────────────────────────────────────────────
function ExportPanel({ gen }: { gen: BusinessGen }) {
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState('')
  const out = (gen.outputData ?? {}) as Record<string, unknown>
  const outputTypes: string[] = Array.isArray(gen.inputData?.outputTypes) && gen.inputData!.outputTypes!.length > 0
    ? gen.inputData!.outputTypes! : inferOutputTypes(out, gen.inputData as Record<string, unknown> | null)

  const actions = [
    { key: 'copyHeadlines', label: 'Headlines', show: outputTypes.includes('copy') },
    { key: 'copySocialCaptions', label: 'Social Captions', show: outputTypes.includes('copy') },
    { key: 'copyEmailBody', label: 'Email Body', show: outputTypes.includes('copy') },
    { key: 'copyAdCopy', label: 'Ad Copy', show: outputTypes.includes('copy') },
    { key: 'logoConceptDescription', label: 'Logo Brief', show: outputTypes.includes('logo') },
    { key: 'bannerHeadline', label: 'Graphics Copy', show: outputTypes.includes('graphics') },
    { key: 'websiteHtml', label: 'Website HTML', show: outputTypes.includes('website') },
  ].filter(a => a.show && out[a.key])

  function copy(key: string, label: string) {
    const val = out[key]
    if (!val) return
    const text = Array.isArray(val) ? (val as string[]).join('\n') : String(val)
    navigator.clipboard.writeText(text).then(() => { setToast(`${label} copied!`); setTimeout(() => setToast(''), 2000) })
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify({ id: gen.id, inputData: gen.inputData, outputData: gen.outputData }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `brand-${gen.id.slice(-6)}.json`; a.click()
    URL.revokeObjectURL(url)
    setToast('JSON exported!'); setTimeout(() => setToast(''), 2000)
  }

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', minWidth: 0 }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%', padding: '10px 8px', background: open ? `${accent}15` : 'transparent', color: open ? accent : 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s', boxSizing: 'border-box' }}
        onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.color = 'var(--cream)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface2)' } }}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' } }}>
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3 5l3 4 3-4M2 11h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Export
      </button>
      {open && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 8, padding: 16, zIndex: 200, boxShadow: '0 12px 40px rgba(0,0,0,0.6)', minWidth: 220 }}>
          {actions.length > 0 && (
            <>
              <div style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono',monospace", marginBottom: 7 }}>Copy to Clipboard</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                {actions.map(({ key, label }) => (
                  <button key={key} onClick={() => copy(key, label)} style={{ padding: '5px 10px', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", background: `${accent}14`, border: `1px solid ${accent}30`, color: accent, borderRadius: 3, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accent}28` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${accent}14` }}>{label}</button>
                ))}
              </div>
            </>
          )}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <button onClick={exportJSON} style={{ padding: '5px 10px', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", background: `${accent}14`, border: `1px solid ${accent}30`, color: accent, borderRadius: 3, cursor: 'pointer', width: '100%', textAlign: 'left' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accent}28` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${accent}14` }}>Full JSON</button>
          </div>
          {toast && <div style={{ fontSize: 9, color: green, fontFamily: "'DM Mono',monospace", marginTop: 8 }}>{toast}</div>}
          <button onClick={() => setOpen(false)} style={{ marginTop: 10, width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '4px', fontSize: 9, cursor: 'pointer', borderRadius: 3, fontFamily: "'DM Mono',monospace" }}>Close</button>
        </div>
      )}
    </div>
  )
}

// ── Chat history: card + viewer modal ───────────────────────────────────────
function formatChatPreview(raw: string): string {
  if (!raw) return ''
  return raw.replace(/\s+/g, ' ').replace(/^#{1,6}\s*/g, '').replace(/\*\*(.*?)\*\*/g, '$1').trim()
}

function ChatViewerModal({ threadId, title, onClose }: { threadId: string; title: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessageView[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    fetch(`/api/chat/threads/${threadId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { if (isMounted) setMessages(data.thread?.messages || []) })
      .catch(() => { if (isMounted) setError('Could not load this chat.') })
    return () => { isMounted = false }
  }, [threadId])

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 12, width: '100%', maxWidth: 640, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error ? (
            <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: '30px 0' }}>{error}</div>
          ) : messages === null ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
              <div style={{ width: 22, height: 22, border: '1px solid var(--border2)', borderTopColor: purple, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: '30px 0' }}>No messages in this chat.</div>
          ) : (
            messages.map(m => {
              const isUser = m.role === 'user'
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: 8, color: 'var(--muted2)', fontFamily: "'DM Mono',monospace", letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{isUser ? 'You' : 'Brand Syndicate AI'}</div>
                  <div style={{ maxWidth: '85%', padding: '10px 13px', borderRadius: 10, fontSize: 12.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', background: isUser ? `${accent}14` : 'var(--surface2)', border: `1px solid ${isUser ? accent + '30' : 'var(--border)'}`, color: 'var(--cream)' }}>
                    {m.content}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function ChatCard({ thread, onDelete }: { thread: ChatThreadSummary; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const [viewing, setViewing] = useState(false)
  const dateStr = thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  async function handleDelete() {
    if (!confirm(`Delete chat "${thread.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/chat/threads/${thread.id}`, { method: 'DELETE' })
      if (r.ok) onDelete(thread.id)
      else setDeleting(false)
    } catch { setDeleting(false) }
  }

  return (
    <>
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s', display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${purple}50`; el.style.boxShadow = `0 8px 32px ${purple}14, 0 2px 8px rgba(0,0,0,0.3)`; el.style.transform = 'translateY(-2px)' }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = ''; el.style.transform = '' }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, ${purple}, ${purple}50, transparent)`, flexShrink: 0 }} />
        <div style={{ padding: '16px 16px 14px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${purple}18`, border: `1px solid ${purple}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H6l-3 3v-3H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke={purple} strokeWidth="1.2" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 14.5, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{thread.title}</div>
              <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", marginTop: 3 }}>{dateStr}</div>
            </div>
          </div>
          {thread.messages?.[0]?.content && (
            <div style={{ fontSize: 10.5, color: 'var(--muted2)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, marginBottom: 10 }}>
              {formatChatPreview(thread.messages[0].content)}
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, fontSize: 9, color: 'var(--muted2)', fontFamily: "'DM Mono',monospace" }}>
            <span>{thread.messageCount} messages</span>
            {thread.totalCostInr > 0 && <span>₹{thread.totalCostInr.toFixed(2)} used</span>}
          </div>
        </div>
        <div className="my-work-actions" style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setViewing(true)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 8px', background: `${purple}10`, color: purple, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s', fontWeight: 600 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${purple}20` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${purple}10` }}>
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 6h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            View
          </button>
          <a href={`/generate?chip=chat&threadId=${thread.id}`}
            style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 8px', background: `${accent}12`, color: accent, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'background 0.15s', fontWeight: 600 }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${accent}24` }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${accent}12` }}>
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Continue
          </a>
          <button onClick={handleDelete} disabled={deleting}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px 8px', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e74c3c'; (e.currentTarget as HTMLElement).style.background = '#c0392b10' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            {deleting ? '…' : <><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 2h2M4.5 3v7M7.5 3v7M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>Del</>}
          </button>
        </div>
      </div>
      {viewing && <ChatViewerModal threadId={thread.id} title={thread.title} onClose={() => setViewing(false)} />}
    </>
  )
}

// ── Per-type visual previews ──────────────────────────────────────────────────

function LogoPreview({ out, palette, companyName }: { out: Record<string, unknown>; palette: string[]; companyName: string }) {
  const logoUri = getLogoImageUri(out)
  const c1 = palette[0] ?? accent
  return (
    <div style={{ height: 130, background: `linear-gradient(135deg, ${c1}18 0%, var(--surface2) 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${c1}08 1px, transparent 1px), linear-gradient(90deg, ${c1}08 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
      {logoUri ? (
        <img src={logoUri} alt="logo" loading="lazy" decoding="async" style={{ maxWidth: '80%', maxHeight: 90, objectFit: 'contain', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${c1}30, ${c1}10)`, border: `1px solid ${c1}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontFamily: "'Playfair Display',serif", color: c1, fontWeight: 700 }}>{companyName.charAt(0).toUpperCase()}</div>
          <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Logo Generated</div>
        </div>
      )}
      {palette.length > 0 && (
        <div style={{ position: 'absolute', bottom: 10, right: 12, display: 'flex', gap: 4 }}>
          {palette.slice(0, 5).map((c, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c, border: '1px solid rgba(255,255,255,0.15)' }} />)}
        </div>
      )}
    </div>
  )
}

function ImagesPreview({ out }: { out: Record<string, unknown> }) {
  const assets = collectImageAssets(out, 12)

  if (assets.length > 0) {
    const src = assets[0].src
    return (
      <div style={{ height: 130, background: '#0a0a0e', overflow: 'hidden', position: 'relative' }}>
        <img src={src} alt="generated asset" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
        {assets.length > 1 && (
          <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 8, fontFamily: "'DM Mono',monospace", color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.5)', padding: '2px 7px', borderRadius: 20 }}>+{assets.length - 1} more</div>
        )}
      </div>
    )
  }
  return (
    <div style={{ height: 130, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      {[0, 1, 2].map(i => <div key={i} style={{ width: 38, height: 48, borderRadius: 4, background: `${accent}${12 + i * 8}`, border: `1px solid ${accent}25` }} />)}
    </div>
  )
}

function StrategyPreview({ out }: { out: Record<string, unknown> }) {
  const strat = out.strategy as Record<string, unknown> | null
  const lines = strat ? [
    strat.executiveSummary as string || strat.summary as string || '',
    strat.targetAudience as string || strat.audience as string || '',
    strat.brandPositioning as string || strat.positioning as string || '',
    strat.uniqueSellingProposition as string || strat.usp as string || '',
    strat.coreValues as string || '',
  ].filter(Boolean).slice(0, 4) : []
  const labels = ['Summary', 'Audience', 'Positioning', 'USP']

  return (
    <div style={{ height: 130, background: 'var(--surface2)', padding: '12px 14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {lines.length > 0 ? lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 7, color: accent, fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0, paddingTop: 1, minWidth: 56 }}>{labels[i] ?? ''}</span>
          <span style={{ fontSize: 9, color: 'var(--cream)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{String(line)}</span>
        </div>
      )) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
          {['Executive Summary', 'Target Audience', 'Brand Positioning', 'USP'].map((l, i) => (
            <div key={i} style={{ height: 7, background: `${accent}${20 - i * 4}`, borderRadius: 2, width: `${80 - i * 12}%` }} />
          ))}
        </div>
      )}
    </div>
  )
}

function CalendarPreview({ out }: { out: Record<string, unknown> }) {
  const cal = out.contentCalendar as Record<string, unknown> | null
  const posts = (cal?.posts ?? cal?.items ?? cal?.schedule) as unknown[] | undefined
  const count = Array.isArray(posts) ? posts.length : (cal ? 30 : 0)
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const filled = Math.min(count, 28)
  return (
    <div style={{ height: 130, background: 'var(--surface2)', padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        {days.map((d, i) => <span key={i} style={{ fontSize: 7, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", width: 14, textAlign: 'center' }}>{d}</span>)}
      </div>
      {[0, 1, 2, 3].map(row => (
        <div key={row} style={{ display: 'flex', justifyContent: 'space-between' }}>
          {days.map((_, col) => {
            const idx = row * 7 + col
            const active = idx < filled
            return (
              <div key={col} style={{ width: 14, height: 14, borderRadius: '50%', background: active ? (blue + (idx % 3 === 0 ? 'ff' : idx % 3 === 1 ? 'cc' : '88')) : 'var(--border)', transition: 'background 0.1s' }} />
            )
          })}
        </div>
      ))}
      {count > 0 && <div style={{ fontSize: 8, color: accent, fontFamily: "'DM Mono',monospace", marginTop: 2 }}>{count} posts planned</div>}
    </div>
  )
}

function CopyPreview({ out }: { out: Record<string, unknown> }) {
  const headlines = (out.copyHeadlines ?? out.headlines) as string[] | undefined
  const h = Array.isArray(headlines) ? headlines.slice(0, 3) : []
  return (
    <div style={{ height: 130, background: 'var(--surface2)', padding: '12px 14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 7 }}>
      {h.length > 0 ? h.map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 10, color: accent, flexShrink: 0 }}>{i === 0 ? '❝' : '—'}</span>
          <span style={{ fontSize: 10, color: i === 0 ? 'var(--cream)' : 'var(--muted)', lineHeight: 1.35, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontStyle: i === 0 ? 'italic' : 'normal' }}>{line}</span>
        </div>
      )) : (
        [80, 60, 45].map((w, i) => <div key={i} style={{ height: 7, background: `${accent}${22 - i * 6}`, borderRadius: 2, width: `${w}%` }} />)
      )}
    </div>
  )
}

function WebsiteThumbPreview({ out, palette, companyName }: { out: Record<string, unknown>; palette: string[]; companyName: string }) {
  const c1 = palette[0] ?? accent
  const c2 = palette[1] ?? '#1a1a2e'
  return (
    <div style={{ height: 130, background: c2, overflow: 'hidden', position: 'relative' }}>
      <div style={{ background: `linear-gradient(135deg, ${c1}30, ${c2})`, height: 52, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: `1px solid ${c1}20` }}>
        <div style={{ width: 20, height: 20, borderRadius: 4, background: c1 + '40', border: `1px solid ${c1}60`, flexShrink: 0 }} />
        <div style={{ height: 6, background: c1 + '80', borderRadius: 2, width: 60 }} />
        <div style={{ flex: 1 }} />
        {[40, 30, 35].map((w, i) => <div key={i} style={{ height: 5, background: `${c1}40`, borderRadius: 2, width: w }} />)}
      </div>
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ height: 8, background: c1 + '60', borderRadius: 2, width: '55%' }} />
        <div style={{ height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 2, width: '80%' }} />
        <div style={{ height: 5, background: 'rgba(255,255,255,0.10)', borderRadius: 2, width: '65%' }} />
        <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
          <div style={{ height: 14, width: 44, background: c1 + '90', borderRadius: 3 }} />
          <div style={{ height: 14, width: 36, background: 'rgba(255,255,255,0.1)', borderRadius: 3, border: `1px solid ${c1}30` }} />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 6, right: 10, fontSize: 7, color: c1 + '80', fontFamily: "'DM Mono',monospace", letterSpacing: '0.06em', textTransform: 'uppercase' }}>{companyName.slice(0, 18)}</div>
    </div>
  )
}

function GenerationViewerModal({ gen, onClose }: { gen: BusinessGen; onClose: () => void }) {
  const out = (gen.outputData ?? {}) as Record<string, unknown>
  const input = (gen.inputData ?? {}) as Record<string, unknown>
  const outputTypes = Array.isArray(gen.inputData?.outputTypes) && gen.inputData!.outputTypes!.length > 0
    ? gen.inputData!.outputTypes! : inferOutputTypes(out, input)
  const companyName = gen.inputData?.companyName || 'Generated Work'
  const industry = gen.inputData?.industry || 'Business Brand'
  const imageAssets = collectImageAssets(out, 24)
  const logoUri = getLogoImageUri(out)
  const mainImage = logoUri ? { src: logoUri, label: 'Logo' } : imageAssets[0]
  const textBlocks = [
    ['Logo Brief', out.logoConceptDescription ?? out.logoBrief ?? out.symbolIdea],
    ['Headline', out.bannerHeadline ?? out.headline ?? out.title],
    ['Strategy', out.strategy],
    ['Content Calendar', out.contentCalendar],
    ['Copy', out.copyHeadlines ?? out.headlines ?? out.copySocialCaptions ?? out.copyAdCopy ?? out.copyEmailBody],
  ].map(([label, value]) => [label, stringifyBrief(value)] as const).filter(([, value]) => value)
  const websiteHtml = typeof out.websiteHtml === 'string' ? out.websiteHtml : ''

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(980px, 100%)', maxHeight: '88vh', overflow: 'auto', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 18, boxShadow: '0 30px 90px rgba(0,0,0,0.55)' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 9, color: 'var(--gold)', fontFamily: "'DM Mono',monospace", letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>{outputTypes.join(' + ') || 'Generated asset'}</div>
            <div style={{ fontFamily: "'Manrope','DM Sans',sans-serif", fontSize: 20, color: 'var(--cream)', fontWeight: 800, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{companyName}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{industry}</div>
          </div>
          <button onClick={onClose} aria-label="Close preview" style={{ width: 38, height: 38, borderRadius: 999, border: '1px solid var(--border)', background: 'transparent', color: 'var(--cream)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mainImage || websiteHtml ? 'minmax(0, 1.05fr) minmax(280px, .95fr)' : '1fr', gap: 18, padding: 18 }}>
          {(mainImage || websiteHtml) && (
            <div style={{ minWidth: 0 }}>
              {mainImage ? (
                <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,.10), var(--surface2))', border: '1px solid var(--border)', borderRadius: 14, padding: 16, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={mainImage.src} alt={mainImage.label} style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 10 }} />
                </div>
              ) : (
                <iframe srcDoc={websiteHtml} title="Generated website preview" style={{ width: '100%', height: 420, border: '1px solid var(--border)', borderRadius: 14, background: '#fff' }} />
              )}
              {imageAssets.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(76px,1fr))', gap: 8, marginTop: 12 }}>
                  {imageAssets.slice(0, 12).map((img, i) => (
                    <a key={`${img.src}-${i}`} href={img.src} target="_blank" rel="noopener noreferrer" style={{ display: 'block', height: 72, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface2)' }}>
                      <img src={img.src} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </a>
                  ))}
                </div>
              )}
              {mainImage && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  <a href={mainImage.src} target="_blank" rel="noopener noreferrer" style={{ padding: '9px 13px', border: '1px solid rgba(201,168,76,.35)', color: 'var(--gold)', borderRadius: 999, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'DM Mono',monospace" }}>Open Full</a>
                  {mainImage.src.startsWith('data:image/') && <a href={mainImage.src} download={`${String(companyName).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-asset.png`} style={{ padding: '9px 13px', background: 'var(--gold)', color: '#0A0A0E', borderRadius: 999, fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'DM Mono',monospace", fontWeight: 800 }}>Download</a>}
                </div>
              )}
            </div>
          )}

          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {textBlocks.length > 0 ? textBlocks.map(([label, value]) => (
              <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--surface2)' }}>
                <div style={{ fontSize: 9, color: 'var(--gold)', fontFamily: "'DM Mono',monospace", letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, color: 'var(--cream)', fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.65 }}>{value}</pre>
              </div>
            )) : (
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--surface2)', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>Generated content is saved. Open the editor to refine this exact asset.</div>
            )}
            <details style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'transparent' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 10, letterSpacing: '.13em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace" }}>Full saved data</summary>
              <pre style={{ marginTop: 12, maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>{JSON.stringify({ inputData: gen.inputData, outputData: gen.outputData }, null, 2)}</pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── BizGenCard ────────────────────────────────────────────────────────────────
function BizGenCard({ gen, onDelete }: { gen: BusinessGen; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const out = (gen.outputData ?? {}) as Record<string, unknown>
  const outputTypes: string[] = Array.isArray(gen.inputData?.outputTypes) && gen.inputData!.outputTypes!.length > 0
    ? gen.inputData!.outputTypes! : inferOutputTypes(out, gen.inputData as Record<string, unknown> | null)

  const palette: string[] = (
    Array.isArray((out as any).primaryColors) ? (out as any).primaryColors :
    Array.isArray(gen.inputData?.primaryColors) ? gen.inputData!.primaryColors! : []
  ).slice(0, 5)

  const companyName = gen.inputData?.companyName || 'Untitled Brand'
  const industry = gen.inputData?.industry || 'Business Brand'
  const tagline: string = (out as any).tagline || gen.inputData?.tagline || ''
  const dateStr = new Date(gen.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const primaryType = outputTypes[0] ?? 'logo'
  const typeLabel: Record<string, string> = { logo: 'Logo Design', images: 'Brand Images', strategy: 'Brand Strategy', calendar: 'Content Calendar', copy: 'Brand Copy', website: 'Website', graphics: 'Graphics' }
  const typeColor: Record<string, string> = { logo: accent, images: '#7FC9A8', strategy: accent, calendar: blue, copy: '#A87FC9', website: blue, graphics: '#C97F7F' }
  const cardAccent = typeColor[primaryType] ?? accent

  async function handleDelete() {
    if (!confirm(`Delete "${companyName}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/generation/${gen.id}`, { method: 'DELETE' })
      if (r.ok) onDelete(gen.id)
      else setDeleting(false)
    } catch { setDeleting(false) }
  }

  if (deleting) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, opacity: 0.5 }}>
        <div style={{ width: 20, height: 20, border: '1.5px solid var(--border2)', borderTopColor: '#e74c3c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <>
    <div
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s', display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${cardAccent}50`; el.style.boxShadow = `0 8px 32px ${cardAccent}14, 0 2px 8px rgba(0,0,0,0.3)`; el.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = ''; el.style.transform = '' }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg, ${cardAccent}, ${cardAccent}50, transparent)`, flexShrink: 0 }} />

      <div style={{ position: 'relative', flexShrink: 0 }}>
        {primaryType === 'logo' && <LogoPreview out={out} palette={palette} companyName={companyName} />}
        {primaryType === 'images' && <ImagesPreview out={out} />}
        {primaryType === 'strategy' && <StrategyPreview out={out} />}
        {primaryType === 'calendar' && <CalendarPreview out={out} />}
        {primaryType === 'copy' && <CopyPreview out={out} />}
        {primaryType === 'website' && <WebsiteThumbPreview out={out} palette={palette} companyName={companyName} />}
        {primaryType === 'graphics' && <ImagesPreview out={out} />}
        <div style={{ position: 'absolute', top: 8, left: 10, fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: cardAccent, fontFamily: "'DM Mono',monospace", background: 'var(--surface)', border: `1px solid ${cardAccent}40`, padding: '2px 7px', borderRadius: 20 }}>{typeLabel[primaryType] ?? 'Brand Asset'}</div>
        <div style={{ position: 'absolute', top: 8, right: 10, fontSize: 7, color: 'var(--muted)', fontFamily: "'DM Mono',monospace" }}>{dateStr}</div>
      </div>

      <div style={{ padding: '13px 16px', flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{companyName}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Sans',sans-serif", marginBottom: tagline ? 4 : 0 }}>{industry}</div>
        {tagline && <div style={{ fontSize: 9, color: cardAccent, fontFamily: "'DM Mono',monospace", fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{tagline}"</div>}

        {outputTypes.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
            {outputTypes.filter(t => t !== primaryType).map(t => {
              const c = typeColor[t] ?? accent
              return (
                <span key={t} style={{ fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: c, background: `${c}10`, border: `1px solid ${c}28`, padding: '2px 7px', borderRadius: 20, fontFamily: "'DM Mono',monospace" }}>+ {typeLabel[t] ?? t}</span>
              )
            })}
          </div>
        )}
      </div>

      <div className="my-work-actions my-work-actions--gen" style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
        <Link href={`/generate?gen=${gen.id}&tab=${editTabForAsset(primaryType)}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 8px', background: `${cardAccent}15`, color: cardAccent, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'background 0.15s', fontWeight: 600, cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${cardAccent}28` }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${cardAccent}15` }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="6" cy="6" r="1.8" fill="currentColor"/></svg>
          View
        </Link>
        <Link href={`/generate?from=${gen.id}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 8px', background: 'transparent', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'all 0.15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--cream)'; el.style.background = 'var(--surface2)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6a4 4 0 0 1 6.9-2.7M10 6a4 4 0 0 1-6.9 2.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M8.7 1v2.3H11M1 8.7h2.3V11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Remix
        </Link>
        <Link href={`/generate?chip=chat&prompt=${encodeURIComponent(buildAssetAIQuestion(gen, primaryType, typeLabel[primaryType] ?? primaryType))}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 8px', background: 'transparent', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'all 0.15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = '#27AE60'; el.style.background = 'rgba(39,174,96,0.10)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Ask AI
        </Link>
        <Link href={`/generate?gen=${gen.id}&tab=${editTabForAsset(primaryType)}&aiEdit=1`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 8px', background: 'transparent', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'all 0.15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--cream)'; el.style.background = 'var(--surface2)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M9 2l1 1L4 9H3V8L9 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
          AI Edit
        </Link>
        <button onClick={handleDelete}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px 8px', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", cursor: 'pointer', transition: 'all 0.15s', boxSizing: 'border-box' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e74c3c'; (e.currentTarget as HTMLElement).style.background = '#c0392b10' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 2h2M4.5 3v7M7.5 3v7M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
    </>
  )
}

// ── WebsiteCard ───────────────────────────────────────────────────────────────
function WebsiteCard({ site, onDelete }: { site: UserWebsite; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false)
  const [generatingSlug, setGeneratingSlug] = useState(false)
  const [slug, setSlug] = useState(site.slug)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const THUMB_DESIGN_WIDTH = 390 // render at mobile width so it fills the card properly without clipping
  const THUMB_HEIGHT = 200
  const [scale, setScale] = useState(0)

  // Measure the actual rendered width of the thumbnail container and compute
  // the scale factor needed to fit the fixed-width iframe inside it. This
  // replaces the old `width:300%/scale(0.333)` trick, which assumed the
  // container was always exactly 1/3 of the iframe's natural width — any
  // other card width caused the site to render at the wrong breakpoint and
  // show a cropped/broken slice instead of the real homepage.
  useEffect(() => {
    const el = thumbRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / THUMB_DESIGN_WIDTH)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  async function handleViewLive() {
    if (slug) { window.open(`/w/${slug}`, '_blank', 'noopener,noreferrer'); return }
    setGeneratingSlug(true)
    try {
      const base = site.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-site'
      const r = await fetch(`/api/user-websites/${site.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: `${base}-${site.id.slice(-4)}` }) })
      if (r.ok) { const { website } = await r.json(); setSlug(website.slug); window.open(`/w/${website.slug}`, '_blank', 'noopener,noreferrer') }
    } catch { /* silent */ }
    finally { setGeneratingSlug(false) }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${site.name}"? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/user-websites/${site.id}`, { method: 'DELETE' })
    onDelete(site.id)
  }

  const dateStr = new Date(site.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const isLive = site.isPublished

  return (
    <div
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s', display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${blue}50`; el.style.boxShadow = `0 8px 32px ${blue}14, 0 2px 8px rgba(0,0,0,0.3)`; el.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = ''; el.style.transform = '' }}
    >
      <div style={{ height: 3, background: `linear-gradient(90deg, ${blue}, ${blue}50, transparent)`, flexShrink: 0 }} />

      <div ref={thumbRef} style={{ height: THUMB_HEIGHT, background: '#09090a', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
        {scale > 0 && (
          <iframe
            ref={iframeRef}
            src={`/api/website-preview/${site.id}`}
            title={site.name}
            scrolling="no"
            style={{
              width: THUMB_DESIGN_WIDTH,
              height: THUMB_HEIGHT / scale,
              border: 'none',
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
              display: 'block',
            }}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
          />
        )}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: 8, left: 10, zIndex: 2, display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 20, background: isLive ? 'rgba(39,174,96,0.15)' : 'rgba(0,0,0,0.5)', border: `1px solid ${isLive ? 'rgba(39,174,96,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: isLive ? green : 'rgba(255,255,255,0.3)', display: 'inline-block', animation: isLive ? 'pulse 2s ease-in-out infinite' : undefined }} />
          <span style={{ fontSize: 7, color: isLive ? green : 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{isLive ? 'Live' : 'Draft'}</span>
        </div>
      </div>

      <div style={{ padding: '13px 16px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{site.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 8, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", display: 'flex', alignItems: 'center', gap: 4 }}>
                {site.isGenerated
                  ? <><svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M7 1L2 7h4.5L5 11 10 5H5.5L7 1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>AI Generated</>
                  : <><svg width="8" height="8" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>Template</>}
              </span>
              {site.templateLabel && <span style={{ fontSize: 7, color: blue, fontFamily: "'DM Mono',monospace", background: `${blue}10`, border: `1px solid ${blue}25`, padding: '1px 6px', borderRadius: 20, letterSpacing: '0.06em' }}>{site.templateLabel}</span>}
            </div>
          </div>
          <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>{dateStr}</div>
        </div>
      </div>

      <div className="my-work-actions" style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
        <a href={`/generate?websiteId=${site.id}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 8px', background: `${accent}10`, color: accent, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'background 0.15s', fontWeight: 600 }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${accent}20` }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${accent}10` }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M8 1l3 3L4.5 10.5H1.5v-3L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
          Edit
        </a>
        <Link href={`/my-websites/${site.id}`}
          style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 8px', background: `${blue}15`, color: blue, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", textDecoration: 'none', borderRight: '1px solid var(--border)', transition: 'background 0.15s', fontWeight: 600 }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${blue}28` }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${blue}15` }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 3.5v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Manage
        </Link>
        <button onClick={handleViewLive} disabled={generatingSlug}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px 8px', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", cursor: 'pointer', borderRight: '1px solid var(--border)', transition: 'all 0.15s' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = green; el.style.background = `${green}10` }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--muted)'; el.style.background = 'transparent' }}>
          {generatingSlug ? '…' : <><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>View</>}
        </button>
        <button onClick={handleDelete} disabled={deleting}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px 8px', background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e74c3c'; (e.currentTarget as HTMLElement).style.background = '#c0392b10' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
          {deleting ? '…' : <><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 2h2M4.5 3v7M7.5 3v7M3 3l.5 7h5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>Del</>}
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MyWorkPage() {
  const [bizGens, setBizGens] = useState<BusinessGen[]>([])
  const [websites, setWebsites] = useState<UserWebsite[]>([])
  const [chats, setChats] = useState<ChatThreadSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'business' | 'websites' | 'chats'>('business')
  const [bizTotal, setBizTotal] = useState(0)
  const [bizPage, setBizPage] = useState(0)
  const [bizHasMore, setBizHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const PAGE_SIZE = 20

  async function fetchBiz(page: number, append = false) {
    const r = await fetch(`/api/my-generations?mode=business&page=${page}&limit=${PAGE_SIZE}`)
    const data = r.ok ? await r.json() : { generations: [], total: 0, hasMore: false }
    const gens = Array.isArray(data?.generations) ? data.generations : []
    setBizGens(prev => append ? [...prev, ...gens] : gens)
    setBizTotal(data.total ?? gens.length)
    setBizHasMore(data.hasMore ?? false)
    setBizPage(page)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#websites') setActiveSection('websites')
      else if (window.location.hash === '#chats') setActiveSection('chats')
    }

    let isMounted = true

    const loadData = async () => {
      try {
        await fetchBiz(0)

        const wRes = await fetch('/api/user-websites')
        const wData = wRes.ok ? await wRes.json() : { websites: [] }
        if (isMounted) setWebsites(Array.isArray(wData?.websites) ? wData.websites : [])

        const cRes = await fetch('/api/chat/threads?limit=100')
        const cData = cRes.ok ? await cRes.json() : { threads: [] }
        if (isMounted) setChats(Array.isArray(cData?.threads) ? cData.threads : [])
      } catch (err) {
        console.error('Failed to load work history:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [])

  async function handleLoadMore() {
    setLoadingMore(true)
    try {
      await fetchBiz(bizPage + 1, true)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="page-pad">
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes mwFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div className="page-eyebrow"><span className="page-eyebrow-dot" />Generation History</div>
      <h1 className="page-h1">My <em>work.</em></h1>
      <p className="page-sub">All your brand assets, websites, and chats.</p>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28, overflowX: 'auto', scrollbarWidth: 'none' as const, WebkitOverflowScrolling: 'touch' as any, flexWrap: 'nowrap' }}>
        {([
          { key: 'business' as const, label: !loading && bizTotal > 0 ? `Brand Assets (${bizTotal})` : 'Brand Assets' },
          { key: 'websites' as const, label: !loading && websites.length > 0 ? `Websites (${websites.length})` : 'Websites' },
          { key: 'chats' as const, label: !loading && chats.length > 0 ? `Chats (${chats.length})` : 'Chats' },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setActiveSection(key)}
            style={{ padding: '10px 14px 9px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', background: 'none', border: 'none', borderBottom: activeSection === key ? `2px solid ${accent}` : '2px solid transparent', marginBottom: -1, fontFamily: "'DM Mono',monospace", transition: 'all 0.15s', color: activeSection === key ? accent : 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}
          >{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ width: 28, height: 28, border: '1px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : activeSection === 'business' ? (
        bizGens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: 'var(--surface3)', marginBottom: 12 }}>No brand assets yet</div>
            <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 24 }}>Generate logos, brand images, copy, strategy, and more from the homepage.</p>
            <Link href="/" style={{ background: 'var(--gold)', color: '#000', padding: '10px 24px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Start on Homepage</Link>
          </div>
        ) : (
          <div>
            <div className="my-work-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 20 }}>
              {bizGens.map((gen, i) => (
                <div key={gen.id} style={{ animation: `mwFadeIn 0.3s ease both`, animationDelay: `${Math.min(i, 8) * 30}ms`, minWidth: 0, maxWidth: '100%' }}>
                  <BizGenCard gen={gen} onDelete={id => { setBizGens(prev => prev.filter(g => g.id !== id)); setBizTotal(t => t - 1) }} />
                </div>
              ))}
            </div>
            {bizHasMore && (
              <div style={{ textAlign: 'center', marginTop: 32 }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{ padding: '11px 28px', background: 'transparent', border: `1px solid ${accent}40`, color: accent, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", cursor: loadingMore ? 'wait' : 'pointer', borderRadius: 100, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accent}12`; (e.currentTarget as HTMLElement).style.borderColor = accent }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = `${accent}40` }}
                >
                  {loadingMore
                    ? <><span style={{ width: 12, height: 12, border: `1.5px solid ${accent}40`, borderTopColor: accent, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Loading…</>
                    : <>Load More</>
                  }
                </button>
                <div style={{ fontSize: 9, color: 'var(--muted2)', fontFamily: "'DM Mono',monospace", marginTop: 8 }}>
                  Showing {bizGens.length} of {bizTotal}
                </div>
              </div>
            )}
          </div>
        )
      ) : activeSection === 'websites' ? (
        websites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: 'var(--surface3)', marginBottom: 12 }}>No websites saved yet</div>
            <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 24, lineHeight: 1.7 }}>Generate a custom website from the homepage.</p>
            <Link href="/?chip=Website" style={{ background: 'var(--gold)', color: '#000', padding: '10px 24px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Build a Website</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{websites.length} {websites.length === 1 ? 'website' : 'websites'}</div>
              <Link href="/?chip=Website" style={{ padding: '7px 16px', background: `${blue}18`, border: `1px solid ${blue}40`, color: blue, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", fontWeight: 600, textDecoration: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>New Website
              </Link>
            </div>
            <div className="my-work-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
              {websites.map(site => <WebsiteCard key={site.id} site={site} onDelete={id => setWebsites(prev => prev.filter(w => w.id !== id))} />)}
            </div>
          </div>
        )
      ) : (
        chats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px' }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: 'var(--surface3)', marginBottom: 12 }}>No chats yet</div>
            <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 24, lineHeight: 1.7 }}>Ask Brand Syndicate AI about your website, strategy, graphics, offers, or next steps.</p>
            <Link href="/generate?chip=chat" style={{ background: 'var(--gold)', color: '#000', padding: '10px 24px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Start a Chat</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>{chats.length} {chats.length === 1 ? 'chat' : 'chats'}</div>
              <Link href="/generate?chip=chat" style={{ padding: '7px 16px', background: `${purple}18`, border: `1px solid ${purple}40`, color: purple, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono',monospace", fontWeight: 600, textDecoration: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>New Chat
              </Link>
            </div>
            <div className="my-work-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
              {chats.map(thread => <ChatCard key={thread.id} thread={thread} onDelete={id => setChats(prev => prev.filter(c => c.id !== id))} />)}
            </div>
          </div>
        )
      )}
    </div>
  )
}
