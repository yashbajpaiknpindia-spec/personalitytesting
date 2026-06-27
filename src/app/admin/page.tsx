'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

const ADMIN_PHONE_ID = '917897671348'
const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'
const GOLD = '#C9A84C'
const RED = '#C0392B'
const GREEN = '#27AE60'
const BLUE = '#3498DB'
const MONO = "'DM Mono', monospace"
const SERIF = "'Playfair Display', serif"
const SANS = "'DM Sans', sans-serif"

type Tab = 'overview' | 'costs' | 'users' | 'admins' | 'articles' | 'payments' | 'logs' | 'notifications' | 'analytics' | 'pricing' | 'settings' | 'database' | 'websites'
type DateRange = '1' | '7' | '30' | '90' | '180' | '365'

function fmt(n: number, d = 2) { return n.toFixed(d) }
function fmtInr(n: number) { return `₹${n < 0.01 && n > 0 ? n.toFixed(6) : n < 1 ? n.toFixed(4) : n.toFixed(2)}` }
function fmtUsd(n: number) { return `$${n < 0.001 && n > 0 ? n.toFixed(6) : n.toFixed(4)}` }
function fmtNum(n: number) { return n.toLocaleString('en-IN') }
function fmtDate(d: string) { return new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) }
function firstImageUrl(gen: any): string | null {
  const out = gen?.outputData || {}
  const pools = [out.graphics, out.variations, out._generatedImages, out._persistedImages].filter(Array.isArray)
  for (const list of pools) {
    for (const item of list) {
      const url = item?.finalPosterUrl || item?.imageDataUri || item?.imageUrl || item?.url || item?.previewImageUrl
      if (typeof url === 'string' && url) return url
    }
  }
  return out.finalPosterUrl || out.imageUrl || out.previewImageUrl || out.url || null
}
function allImageItems(gen: any): Array<{ index: number; url: string; label: string; rendered?: boolean }> {
  const out = gen?.outputData || {}
  const src = Array.isArray(out.graphics) ? out.graphics
    : Array.isArray(out.variations) ? out.variations
      : Array.isArray(out._generatedImages) ? out._generatedImages
        : Array.isArray(out._persistedImages) ? out._persistedImages
          : []
  const items = src.map((item: any, index: number) => {
    const url = item?.finalPosterUrl || item?.imageDataUri || item?.imageUrl || item?.url || item?.previewImageUrl
    return typeof url === 'string' && url ? {
      index,
      url,
      label: item?.variationLabel || item?.description || `Image ${index + 1}`,
      rendered: item?.rendered,
    } : null
  }).filter(Boolean) as Array<{ index: number; url: string; label: string; rendered?: boolean }>
  if (items.length > 0) return items
  const fallback = firstImageUrl(gen)
  return fallback ? [{ index: 0, url: fallback, label: 'Image 1', rendered: undefined }] : []
}
function imageCount(gen: any): number {
  const out = gen?.outputData || {}
  const list = Array.isArray(out.graphics) ? out.graphics
    : Array.isArray(out.variations) ? out.variations
      : Array.isArray(out._generatedImages) ? out._generatedImages
        : Array.isArray(out._persistedImages) ? out._persistedImages
          : []
  return list.length || (firstImageUrl(gen) ? 1 : 0)
}
function fmtDuration(ms: number | null) {
  if (!ms || ms <= 0) return '—'
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function getGenerationPrompt(gen: any): string {
  const inp = gen?.inputData || {}
  const enriched = gen?.enrichedData || {}
  const out = gen?.outputData || {}
  const direct = inp.prompt || inp.brief || inp.userPrompt || inp.description || enriched.userPrompt || out.prompt
  if (typeof direct === 'string' && direct.trim()) return direct.trim()
  const composed = [
    inp.companyName || out.companyName,
    inp.industry || out.industry,
    inp.tagline || out.tagline,
    inp.audience,
    inp.tone,
  ].filter(Boolean).map(String).join(' · ')
  if (composed.trim()) return composed.trim()
  if (typeof enriched.prompt === 'string' && enriched.prompt.trim()) return enriched.prompt.trim()
  if (typeof out.headline === 'string' && out.headline.trim()) return out.headline.trim()
  return 'Prompt not saved for this older generation.'
}

function shortPrompt(text: string, max = 180): string {
  const compact = text.replace(/\s+/g, ' ').trim()
  return compact.length > max ? compact.slice(0, max - 1) + '…' : compact
}

// ── Download helpers ──────────────────────────────────────────────────────────
async function downloadUrl(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch {
    // Fallback: open in new tab if CORS blocks fetch
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

function safeFilename(base: string, ext: string): string {
  return (base || 'file').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 60) + '.' + ext
}

function extFromUrl(url: string): string {
  const m = url.split('?')[0].match(/\.(\w{2,5})$/)
  if (m) return m[1].toLowerCase()
  return 'jpg'
}

function Stat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '20px 22px',
      position: 'relative',
      overflowX: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${color || GOLD}30, transparent)` }} />
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 32, fontFamily: SERIF, color: color || 'var(--text)', fontWeight: 400, lineHeight: 1, letterSpacing: '-0.01em' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, fontFamily: MONO, letterSpacing: '0.04em' }}>{sub}</div>}
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ fontSize: 8, padding: '3px 8px', background: `${color}18`, color, borderRadius: 100, fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase', border: `1px solid ${color}30` }}>{label}</span>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 52 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 3, height: 14, background: GOLD, borderRadius: 8 }} />
        <div style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

function LivePill({ source }: { source: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: source === 'live' ? GREEN : GOLD, display: 'inline-block' }} />
      <span style={{ fontSize: 9, color: source === 'live' ? GREEN : GOLD, fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{source === 'live' ? 'live' : 'manual'}</span>
    </span>
  )
}


const globalAdminStyles = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes adminPulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
  @keyframes logSlideIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
  * { box-sizing: border-box; }
  input, textarea, select { outline: none !important; }
  input:focus, textarea:focus, select:focus { border-color: rgba(201,168,76,0.45) !important; box-shadow: 0 0 0 3px rgba(201,168,76,0.06) !important; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.25); border-radius: 2px; }
  table { border-collapse: collapse; }
  tr:hover td { background: rgba(201,168,76,0.04) !important; }
  th { font-weight: 400 !important; }

  /* ── Light-mode table fix: hardcoded rgba(255,255,255,…) overrides ── */
  [data-theme="light"] tr:hover td { background: rgba(201,168,76,0.07) !important; }

  /* ── Pagination buttons light mode ── */
  [data-theme="light"] button[disabled] { color: rgba(0,0,0,0.25) !important; }

  /* ── Flying pill box ── */
  .admin-flying-pill {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 100vh;
    pointer-events: none;
    z-index: 0;
  }
  .admin-pill-inner {
    position: absolute;
    top: 6%;
    left: 50%;
    transform: translateX(-50%);
    width: 380px;
    max-width: calc(100vw - 32px);
    background: rgba(201,168,76,0.04);
    border: 1px solid rgba(201,168,76,0.09);
    border-radius: 999px;
    padding: 10px 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 9px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(201,168,76,0.4);
    font-family: 'DM Mono', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 0 60px rgba(201,168,76,0.04) inset;
  }
  /* Light mode pill */
  [data-theme="light"] .admin-pill-inner {
    background: rgba(201,168,76,0.07);
    border-color: rgba(201,168,76,0.18);
    color: rgba(120,90,20,0.55);
    box-shadow: 0 2px 16px rgba(201,168,76,0.06) inset;
  }
  .admin-pill-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(201,168,76,0.5);
    flex-shrink: 0;
    animation: adminPulse 2s ease-in-out infinite;
  }
  [data-theme="light"] .admin-pill-dot { background: rgba(160,110,20,0.5); }

  /* ── Log detail row animation ── */
  .admin-log-detail {
    animation: logSlideIn 0.22s ease;
  }

  /* ── Websites grid full-width ── */
  .admin-websites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    width: 100%;
  }

  /* ── User history drawer ── */
  .admin-user-history {
    animation: logSlideIn 0.22s ease;
    border-top: 1px solid rgba(201,168,76,0.12);
    background: rgba(201,168,76,0.02);
  }
  [data-theme="light"] .admin-user-history {
    background: rgba(201,168,76,0.04);
    border-top-color: rgba(201,168,76,0.2);
  }

  /* ── Date range range pill buttons — visible in both themes ── */
  .admin-range-pill {
    padding: 6px 16px;
    border-radius: 100px;
    font-size: 9px;
    cursor: pointer;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.1em;
    transition: all 0.15s;
    border: 1px solid transparent;
  }
  .admin-range-pill.active {
    background: #C9A84C;
    color: #000;
    border-color: #C9A84C;
  }
  .admin-range-pill.inactive {
    background: transparent;
    color: var(--muted);
    border-color: var(--border);
  }
  [data-theme="light"] .admin-range-pill.inactive {
    color: #555;
    border-color: #ccc;
    background: #f5f5f5;
  }

  /* ── Websites search/filter inputs light mode ── */
  [data-theme="light"] .admin-search-input {
    background: #f5f5f5 !important;
    border-color: #d0d0d0 !important;
    color: #1a1a1a !important;
  }
  [data-theme="light"] .admin-filter-btn-inactive {
    color: #555 !important;
    border-color: #ccc !important;
  }
  [data-theme="light"] .admin-filter-btn-active {
    color: #000 !important;
    background: #C9A84C !important;
    border-color: #C9A84C !important;
  }

  /* ── DB export tag pills light mode ── */
  [data-theme="light"] .admin-db-tag-inactive {
    color: #444 !important;
    border-color: #bbb !important;
  }

  /* ── Card background transparency fix ── */
  [data-theme="light"] .admin-card-glass {
    background: rgba(201,168,76,0.05) !important;
    border-color: rgba(201,168,76,0.2) !important;
  }

  @media (max-width: 768px) {
    .admin-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
    .admin-header-right { width: 100%; justify-content: flex-start !important; flex-wrap: wrap; }
    .admin-stats-grid { grid-template-columns: 1fr 1fr !important; }
    .admin-tab-bar { overflow-x: auto; scrollbar-width: thin; padding-bottom: 8px !important; }
    .admin-tab-bar::-webkit-scrollbar { height: 6px; display: block; }
    .admin-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .admin-main-pad { padding: 80px 14px 44px !important; }
    .admin-rate-card { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
    .admin-pill-inner {
      width: calc(100vw - 32px);
      font-size: 8px;
      letter-spacing: 0.14em;
      padding: 8px 14px;
    }
    .admin-websites-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 480px) {
    .admin-pill-inner { font-size: 7px; padding: 6px 10px; gap: 5px; }
  }

  /* ── Flying pill box ── */
  .admin-flying-pill {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 100vh;
    pointer-events: none;
    z-index: 0;
  }
  .admin-pill-inner {
    position: absolute;
    top: 6%;
    left: 50%;
    transform: translateX(-50%);
    width: 380px;
    max-width: calc(100vw - 32px);
    background: rgba(201,168,76,0.04);
    border: 1px solid rgba(201,168,76,0.09);
    border-radius: 999px;
    padding: 10px 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 9px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(201,168,76,0.4);
    font-family: 'DM Mono', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 0 60px rgba(201,168,76,0.04) inset;
  }
  /* Light mode pill */
  [data-theme="light"] .admin-pill-inner {
    background: rgba(201,168,76,0.07);
    border-color: rgba(201,168,76,0.18);
    color: rgba(120,90,20,0.55);
    box-shadow: 0 2px 16px rgba(201,168,76,0.06) inset;
  }
  .admin-pill-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(201,168,76,0.5);
    flex-shrink: 0;
    animation: adminPulse 2s ease-in-out infinite;
  }
  [data-theme="light"] .admin-pill-dot { background: rgba(160,110,20,0.5); }

  /* ── Log detail row animation ── */
  .admin-log-detail {
    animation: logSlideIn 0.22s ease;
  }

  /* ── Websites grid full-width ── */
  .admin-websites-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    width: 100%;
  }

  /* ── User history drawer ── */
  .admin-user-history {
    animation: logSlideIn 0.22s ease;
    border-top: 1px solid rgba(201,168,76,0.12);
    background: rgba(201,168,76,0.02);
  }
  [data-theme="light"] .admin-user-history {
    background: rgba(201,168,76,0.04);
    border-top-color: rgba(201,168,76,0.2);
  }

  @media (max-width: 768px) {
    .admin-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
    .admin-header-right { width: 100%; justify-content: flex-start !important; flex-wrap: wrap; }
    .admin-stats-grid { grid-template-columns: 1fr 1fr !important; }
    .admin-tab-bar { overflow-x: auto; scrollbar-width: thin; padding-bottom: 8px !important; }
    .admin-tab-bar::-webkit-scrollbar { height: 6px; display: block; }
    .admin-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .admin-main-pad { padding: 80px 14px 44px !important; }
    .admin-rate-card { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
    .admin-pill-inner {
      width: calc(100vw - 32px);
      font-size: 8px;
      letter-spacing: 0.14em;
      padding: 8px 14px;
    }
    .admin-websites-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 480px) {
    .admin-pill-inner { font-size: 7px; padding: 6px 10px; gap: 5px; }
  }
`

function ImageGenerationsSection({
  generations, downloadingKey, handleDownloadAll, handleDownload, deleteGeneration, deletingGenerationId,
  canRerender, reRenderBusy, handleReRenderImage, BLUE, RED, GOLD, MONO, SANS, GREEN,
}: {
  generations: any[]; downloadingKey: string | null; handleDownloadAll: (urls: Array<{ url: string; filename: string }>, key: string) => void;
  handleDownload: (url: string, filename: string, key: string) => void; deleteGeneration: (id: string) => void;
  deletingGenerationId: string | null; canRerender: boolean; reRenderBusy: Record<string, boolean>;
  handleReRenderImage: (genId: string, index: number) => void;
  BLUE: string; RED: string; GOLD: string; MONO: string; SANS: string; GREEN: string;
}) {
  const [imgFilter, setImgFilter] = React.useState('')
  const filteredImgGens = generations.filter((gen: any) => {
    if (!imgFilter) return true
    const q = imgFilter.toLowerCase()
    const out = gen.outputData || {}
    const inp = gen.inputData || {}
    const user = gen.user || {}
    return (
      (user.name || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.phone || '').toLowerCase().includes(q) ||
      (inp.prompt || out.headline || out.industry || out.archetype || '').toString().toLowerCase().includes(q)
    )
  })
  const allGenImages = filteredImgGens.flatMap((gen: any) => {
    const out = gen.outputData || {}
    const label = out.genType === 'campaign-image' ? 'Brand' : out.genType === 'logo-image' ? 'Logo' : (gen.enrichedData?.genType || 'img')
    return allImageItems(gen).map((item: any) => ({
      url: item.url,
      filename: safeFilename(`${gen.user?.name || 'user'}_${label}_${item.index + 1}`, extFromUrl(item.url)),
    }))
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filter + bulk download bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={imgFilter}
          onChange={e => setImgFilter(e.target.value)}
          placeholder="Filter by user, email, prompt…"
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 11, borderRadius: 6, fontFamily: MONO }}
        />
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>
          {filteredImgGens.length} generation{filteredImgGens.length !== 1 ? 's' : ''} · {allGenImages.length} image{allGenImages.length !== 1 ? 's' : ''}
        </span>
        {allGenImages.length > 0 && (
          <button
            onClick={() => handleDownloadAll(allGenImages, 'bulk-all-images')}
            disabled={!!downloadingKey}
            style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${BLUE}70`, color: BLUE, borderRadius: 6, fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: downloadingKey ? 'default' : 'pointer', opacity: downloadingKey ? 0.5 : 1, whiteSpace: 'nowrap' }}
          >
            {downloadingKey === 'bulk-all-images' ? 'Saving…' : `↓ Download All ${allGenImages.length} Images`}
          </button>
        )}
      </div>
      {filteredImgGens.length === 0 && imgFilter && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontFamily: MONO, fontSize: 11 }}>
          No images match &ldquo;{imgFilter}&rdquo;
        </div>
      )}
      {filteredImgGens.map((gen: any) => {
        const out = gen.outputData || {}
        const inp = gen.inputData || {}
        const imageItems = allImageItems(gen)
        const label = out.genType === 'campaign-image' ? 'Brand Images' : out.genType === 'logo-image' ? 'Logo' : (gen.enrichedData?.genType || 'Image')
        return (
          <div key={gen.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 7 }}>
                  <Badge label={label} color={GOLD} />
                  <span style={{ color: GOLD, fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{imageItems.length} variation{imageItems.length === 1 ? '' : 's'}</span>
                </div>
                <div style={{ color: 'var(--text)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={gen.user?.email || ''}>
                  {gen.user?.name || gen.user?.phone || gen.user?.email || 'Guest'}
                </div>
                <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 9, lineHeight: 1.5, marginTop: 4, maxWidth: 720 }} title={getGenerationPrompt(gen)}>
                  <span style={{ color: GOLD }}>Prompt:</span> {shortPrompt(getGenerationPrompt(gen), 220)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 9 }}>{fmtDate(gen.createdAt)}</span>
                {imageItems.length > 0 && (
                  <button
                    onClick={() => handleDownloadAll(
                      imageItems.map((item, idx) => ({
                        url: item.url,
                        filename: safeFilename(`${gen.user?.name || 'user'}_${label}_${idx + 1}`, extFromUrl(item.url)),
                      })),
                      `all:${gen.id}`
                    )}
                    disabled={!!downloadingKey}
                    style={{ padding: '6px 10px', background: 'transparent', border: `1px solid ${BLUE}70`, color: BLUE, borderRadius: 6, fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: downloadingKey ? 'default' : 'pointer', opacity: downloadingKey ? 0.5 : 1, whiteSpace: 'nowrap' }}
                    title="Download all images for this generation"
                  >
                    {downloadingKey === `all:${gen.id}` ? 'Saving…' : `↓ All (${imageItems.length})`}
                  </button>
                )}
                <button onClick={() => deleteGeneration(gen.id)} disabled={deletingGenerationId === gen.id} style={{ padding: '6px 10px', background: 'transparent', border: `1px solid ${RED}70`, color: RED, borderRadius: 6, fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: deletingGenerationId === gen.id ? 'default' : 'pointer', opacity: deletingGenerationId === gen.id ? 0.5 : 1 }}>
                  {deletingGenerationId === gen.id ? 'Deleting…' : 'Delete All'}
                </button>
              </div>
            </div>
            {imageItems.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1, background: 'var(--border)' }}>
                {imageItems.map((item) => {
                  const busy = reRenderBusy[`${gen.id}:${item.index}`]
                  return (
                    <div key={item.index} style={{ background: 'var(--bg)', padding: '10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)' }}>
                        <img src={item.url} alt={item.label} loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
                        />
                        {item.rendered && (
                          <div style={{ position: 'absolute', top: 4, right: 4 }}>
                            <Badge label="rendered" color={GREEN} />
                          </div>
                        )}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 9, lineHeight: 1.35, height: 25, overflow: 'hidden' }}>{item.label}</div>
                      <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
                        <button
                          onClick={() => {
                            const fname = safeFilename(`${gen.user?.name || 'user'}_${label}_var${item.index + 1}`, extFromUrl(item.url))
                            handleDownload(item.url, fname, `img:${gen.id}:${item.index}`)
                          }}
                          disabled={!!downloadingKey}
                          style={{ width: '100%', padding: '7px 8px', background: 'transparent', border: `1px solid ${BLUE}55`, color: BLUE, borderRadius: 7, fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: downloadingKey ? 'default' : 'pointer', opacity: downloadingKey && downloadingKey !== `img:${gen.id}:${item.index}` ? 0.4 : 1 }}
                        >
                          {downloadingKey === `img:${gen.id}:${item.index}` ? 'Saving…' : '↓ Download'}
                        </button>
                        {canRerender && (
                          <button
                            onClick={() => handleReRenderImage(gen.id, item.index)}
                            disabled={busy}
                            style={{ width: '100%', padding: '7px 8px', background: busy ? `${GOLD}18` : 'transparent', border: `1px solid ${GOLD}55`, color: GOLD, borderRadius: 7, fontFamily: MONO, fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}
                          >
                            {busy ? 'Re-rendering…' : `Force Re-render ${item.index + 1}`}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Record<string, any> | null>(null)
  const [users, setUsers] = useState<Record<string, any> | null>(null)
  const [logs, setLogs] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [logService, setLogService] = useState('')
  const [logEndpoint, setLogEndpoint] = useState('')
  const [logPage, setLogPage] = useState(1)
  const [toast, setToast] = useState('')
  const [deletingGenerationId, setDeletingGenerationId] = useState<string | null>(null)
  const [rerenderingImageKey, setRerenderingImageKey] = useState<string | null>(null)
  const [usdToInr, setUsdToInr] = useState(84.0)
  const [rateSource, setRateSource] = useState('manual')
  const [editRate, setEditRate] = useState('')
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [editUser, setEditUser] = useState<Record<string, any> | null>(null)
  const [editLimits, setEditLimits] = useState({ daily: '', monthly: '', yearly: '' })
  const [liveRatesLoading, setLiveRatesLoading] = useState(false)
  const [claudePricing, setClaudePricing] = useState<Record<string, { inputPerM: number; outputPerM: number }> | null>(null)

  // Poster edit limit (admin-configurable)
  const [posterEditLimit, setPosterEditLimit] = useState('2')
  const [posterEditLimitMsg, setPosterEditLimitMsg] = useState('')
  const [posterEditLimitSaving, setPosterEditLimitSaving] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState<Record<string, any>[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifForm, setNotifForm] = useState({ title: '', body: '', imageUrl: '', targetUserId: '' })
  const [notifSending, setNotifSending] = useState(false)
  const [notifPreview, setNotifPreview] = useState(false)
  const [notifImageUploading, setNotifImageUploading] = useState(false)

  // Admin access + articles + payment setup
  const [adminUsers, setAdminUsers] = useState<Record<string, any>[]>([])
  const [adminUserSearch, setAdminUserSearch] = useState('')
  const [adminUsersLoading, setAdminUsersLoading] = useState(false)
  const [articles, setArticles] = useState<Record<string, any>[]>([])
  const [articleSaving, setArticleSaving] = useState(false)
  const [articleImageUploading, setArticleImageUploading] = useState(false)
  const [articleForm, setArticleForm] = useState({ title: '', excerpt: '', content: '', coverImageUrl: '', tags: '', published: true })
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ razorpayKeyId: '', razorpayKeySecret: '', razorpayEnabled: true, masked: '' })

  // ── Backfill re-render state ──────────────────────────────────────────────
  const [rerenderScan, setRerenderScan] = useState<{
    needs_backfill: number
    already_rendered: number
    total_campaign_images: number
  } | null>(null)
  const [rerenderLoading, setRerenderLoading] = useState(false)
  const [rerenderResult, setRerenderResult] = useState<{
    processed: number
    succeeded: number
    failed: number
    message: string
    forceAll?: boolean
  } | null>(null)

  async function scanBackfill() {
    setRerenderLoading(true)
    try {
      const r = await fetch('/api/admin/rerender-graphics')
      const d = await r.json()
      setRerenderScan(d)
    } catch { setToast('Scan failed') } finally { setRerenderLoading(false) }
  }

  async function runBackfill(limit = 50, forceAll = false) {
    setRerenderLoading(true)
    setRerenderResult(null)
    try {
      const r = await fetch('/api/admin/rerender-graphics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit, forceAll }),
      })
      const d = await r.json()
      setRerenderResult(d)
      setRerenderScan(null)
      setToast(d.message ?? 'Re-render complete')
    } catch { setToast('Re-render failed') } finally { setRerenderLoading(false) }
  }

  // ── Geo backfill state ────────────────────────────────────────────────────
  const [geoScan, setGeoScan] = useState<{ total: number; withLocation: number; withoutLocation: number } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoResult, setGeoResult] = useState<{ updated: number; location: string; message: string } | null>(null)

  async function scanGeo() {
    setGeoLoading(true)
    try {
      const r = await fetch('/api/admin/geo-backfill')
      setGeoScan(await r.json())
    } catch { showToast('Geo scan failed') } finally { setGeoLoading(false) }
  }

  async function runGeoBackfill(defaultLocation = 'India') {
    setGeoLoading(true)
    try {
      const r = await fetch('/api/admin/geo-backfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultLocation }),
      })
      const d = await r.json()
      setGeoResult(d)
      setGeoScan(null) // will re-scan on next click
      showToast(d.message ?? 'Location backfill complete')
    } catch { showToast('Geo backfill failed') } finally { setGeoLoading(false) }
  }

  // Page analytics
  const [pageAnalytics, setPageAnalytics] = useState<Record<string, any> | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsRange, setAnalyticsRange] = useState<DateRange>('30')
  const [analyticsError, setAnalyticsError] = useState('')

  // Overview date range
  const [overviewRange, setOverviewRange] = useState<DateRange>('30')

  // PDF report generation
  const [pdfReportLoading, setPdfReportLoading] = useState(false)

  // Global generation limits (admin-controlled per plan)
  const [globalLimits, setGlobalLimits] = useState({
    free:  { daily: '3',  weekly: '',   monthly: '30' },
    pro:   { daily: '',   weekly: '',   monthly: ''   },
    team:  { daily: '',   weekly: '',   monthly: ''   },
  })
  const [limitsMsg, setLimitsMsg] = useState('')
  const [limitsSaving, setLimitsSaving] = useState(false)

  // Master generation limit (single cap across ALL users + all generation types)
  const [masterLimit, setMasterLimit] = useState('5')
  const [masterPeriod, setMasterPeriod] = useState<'daily' | 'monthly'>('daily')
  const [masterLimitMsg, setMasterLimitMsg] = useState('')
  const [masterLimitSaving, setMasterLimitSaving] = useState(false)

  // Pricing plans
  const [pricingPlans, setPricingPlans] = useState<Record<string, any>[]>([])
  const [pricingLoading, setPricingLoading] = useState(false)
  // Websites tab
  const [adminWebsites, setAdminWebsites] = useState<Record<string, any>[]>([])
  const [adminWebsitesTotal, setAdminWebsitesTotal] = useState(0)
  const [adminWebsitesPage, setAdminWebsitesPage] = useState(1)
  const [adminWebsitesSearch, setAdminWebsitesSearch] = useState('')
  const [adminWebsitesFilter, setAdminWebsitesFilter] = useState('all')
  const [adminWebsitesLoading, setAdminWebsitesLoading] = useState(false)
  const [adminWebsiteHtml, setAdminWebsiteHtml] = useState('')
  const [adminWebsiteEditId, setAdminWebsiteEditId] = useState<string|null>(null)
  const [adminWebsiteNote, setAdminWebsiteNote] = useState('')
  const [adminWebsiteDomain, setAdminWebsiteDomain] = useState('')

  // Database export/import state
  const [dbExportLoading, setDbExportLoading] = useState(false)
  const [dbExportTables, setDbExportTables] = useState<string[]>([])
  const [dbImportLoading, setDbImportLoading] = useState(false)
  const [dbImportResult, setDbImportResult] = useState<Record<string, any> | null>(null)
  const [dbImportError, setDbImportError] = useState<string | null>(null)
  const dbImportRef = useRef<HTMLInputElement>(null)
  const [editingPlan, setEditingPlan] = useState<Record<string, any> | null>(null)
  const [planFeaturesText, setPlanFeaturesText] = useState('')

  // Expanded log detail (prompt + response viewer)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [logDetail, setLogDetail] = useState<Record<string, string | null>>({})

  // Download tracking
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)

  // User work history drawer
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [userHistory, setUserHistory] = useState<Record<string, any[]>>({})
  const [userHistoryLoading, setUserHistoryLoading] = useState<string | null>(null)

  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  async function handleDownload(url: string, filename: string, key: string) {
    if (downloadingKey) return
    setDownloadingKey(key)
    try { await downloadUrl(url, filename) }
    finally { setDownloadingKey(null) }
  }

  async function handleDownloadAll(urls: Array<{ url: string; filename: string }>, batchKey: string) {
    if (downloadingKey) return
    setDownloadingKey(batchKey)
    try {
      for (let i = 0; i < urls.length; i++) {
        await downloadUrl(urls[i].url, urls[i].filename)
        if (i < urls.length - 1) await new Promise(r => setTimeout(r, 350))
      }
    } finally { setDownloadingKey(null) }
  }

  async function deleteGeneration(id: string) {
    if (!id || deletingGenerationId) return
    const ok = window.confirm('Delete this generated item from admin and user history?')
    if (!ok) return
    setDeletingGenerationId(id)
    try {
      const r = await fetch(`/api/admin/generation/${id}`, { method: 'DELETE' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Delete failed')
      setStats(prev => prev ? {
        ...prev,
        recentGenerations: (prev.recentGenerations || []).filter((g: any) => g.id !== id),
        recentImageGenerations: (prev.recentImageGenerations || []).filter((g: any) => g.id !== id),
      } : prev)
      showToast('✓ Generated item deleted')
    } catch (e: any) {
      showToast(e?.message || 'Delete failed')
    } finally {
      setDeletingGenerationId(null)
    }
  }

  async function rerenderSingleImage(id: string, variationIndex: number) {
    const key = `${id}:${variationIndex}`
    if (!id || rerenderingImageKey) return
    const ok = window.confirm(`Re-render only image ${variationIndex + 1} for this generation? This uses saved renderContract and no AI image API call.`)
    if (!ok) return
    setRerenderingImageKey(key)
    try {
      const r = await fetch('/api/admin/rerender-graphics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: id, variationIndex, forceAll: true, limit: 1 }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || d.failed) throw new Error(d.error || d.message || 'Re-render failed')
      showToast(d.message || `✓ Image ${variationIndex + 1} re-rendered`)
      await loadStats()
    } catch (e: any) {
      showToast(e?.message || 'Re-render failed')
    } finally {
      setRerenderingImageKey(null)
    }
  }

  const loadStats = useCallback(async (days?: number) => {
    const params = new URLSearchParams()
    if (days && days !== 30) params.set('days', String(days))
    const r = await fetch(`/api/admin/stats${params.size ? '?' + params : ''}`)
    if (r.ok) { const d = await r.json(); setStats(d); setUsdToInr(d.usdToInr) }
    // Also load global generation limits
    const rs = await fetch('/api/admin/settings')
    if (rs.ok) {
      const sd = await rs.json()
      if (sd.limits) {
        setGlobalLimits({
          free:  { daily: String(sd.limits.free.daily  ?? ''), weekly: String(sd.limits.free.weekly  ?? ''), monthly: String(sd.limits.free.monthly  ?? '') },
          pro:   { daily: String(sd.limits.pro.daily   ?? ''), weekly: String(sd.limits.pro.weekly   ?? ''), monthly: String(sd.limits.pro.monthly   ?? '') },
          team:  { daily: String(sd.limits.team.daily  ?? ''), weekly: String(sd.limits.team.weekly  ?? ''), monthly: String(sd.limits.team.monthly  ?? '') },
        })
      }
      if (sd.posterEditLimit !== undefined) {
        setPosterEditLimit(String(sd.posterEditLimit))
      }
      if (sd.globalGenLimit !== undefined) {
        setMasterLimit(String(sd.globalGenLimit))
      }
      if (sd.globalLimitPeriod !== undefined) {
        setMasterPeriod(sd.globalLimitPeriod as 'daily' | 'monthly')
      }
    }
  }, [])

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams({ page: String(userPage) })
    if (userSearch) params.set('search', userSearch)
    const r = await fetch(`/api/admin/users?${params}`)
    if (r.ok) setUsers(await r.json())
  }, [userPage, userSearch])

  const loadLogs = useCallback(async () => {
    setLogs(null)
    const params = new URLSearchParams({ page: String(logPage) })
    if (logService) params.set('service', logService)
    if (logEndpoint) params.set('endpoint', logEndpoint)
    try {
      const r = await fetch(`/api/admin/logs?${params}`)
      if (r.ok) setLogs(await r.json())
      else setLogs({ logs: [], total: 0, page: 1, pages: 1, _error: `Server error ${r.status}` })
    } catch {
      setLogs({ logs: [], total: 0, page: 1, pages: 1, _error: 'Network error' })
    }
  }, [logPage, logService, logEndpoint])

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true)
    const r = await fetch('/api/admin/notifications')
    if (r.ok) { const d = await r.json(); setNotifications(d.notifications || []) }
    setNotifLoading(false)
  }, [])

  const loadPageAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    setAnalyticsError('')
    try {
      // Map '1' -> 1, '180' -> 180, '365' -> 365 — API already caps at 365
      const daysMap: Record<DateRange, number> = { '1': 1, '7': 7, '30': 30, '90': 90, '180': 180, '365': 365 }
      const days = daysMap[analyticsRange] ?? 30
      const r = await fetch(`/api/admin/page-analytics?days=${days}`)
      if (r.ok) {
        const d = await r.json()
        if (d._error) setAnalyticsError(d._error)
        setPageAnalytics(d)
      } else {
        setAnalyticsError(`Server error ${r.status}`)
      }
    } catch (e) {
      setAnalyticsError('Network error, check console')
    }
    setAnalyticsLoading(false)
  }, [analyticsRange])

  const loadPricingPlans = useCallback(async () => {
    setPricingLoading(true)
    const r = await fetch('/api/admin/pricing')
    if (r.ok) { const d = await r.json(); setPricingPlans(d.plans || []) }
    setPricingLoading(false)
  }, [])

  const loadAdminUsers = useCallback(async () => {
    setAdminUsersLoading(true)
    const params = new URLSearchParams({ page: '1' })
    if (adminUserSearch) params.set('search', adminUserSearch)
    const r = await fetch(`/api/admin/users?${params}`)
    if (r.ok) { const d = await r.json(); setAdminUsers(d.users || []) }
    setAdminUsersLoading(false)
  }, [adminUserSearch])

  const loadArticles = useCallback(async () => {
    const r = await fetch('/api/admin/articles')
    if (r.ok) { const d = await r.json(); setArticles(d.articles || []) }
  }, [])

  const loadPaymentSettings = useCallback(async () => {
    const r = await fetch('/api/admin/payment-settings')
    if (r.ok) {
      const d = await r.json()
      setPaymentForm(f => ({ ...f, razorpayKeyId: d.razorpayKeyId || '', razorpayKeySecret: '', razorpayEnabled: d.razorpayEnabled !== false, masked: d.razorpayKeySecretMasked || '' }))
    }
  }, [])

  const loadAdminWebsites = useCallback(async (page = adminWebsitesPage, search = adminWebsitesSearch, filter = adminWebsitesFilter) => {
    setAdminWebsitesLoading(true)
    const params = new URLSearchParams({ page: String(page), search, filter })
    const r = await fetch(`/api/admin/websites?${params}`)
    if (r.ok) {
      const d = await r.json()
      setAdminWebsites(d.websites || [])
      setAdminWebsitesTotal(d.total || 0)
    }
    setAdminWebsitesLoading(false)
  }, [adminWebsitesPage, adminWebsitesSearch, adminWebsitesFilter])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && !isAdmin) router.push('/generate')
  }, [status, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    loadStats(Number(overviewRange)).finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, overviewRange])

  useEffect(() => { if (tab === 'users' && isAdmin) loadUsers() }, [tab, userPage, userSearch, isAdmin, loadUsers])
  useEffect(() => { if (tab === 'logs' && isAdmin) loadLogs() }, [tab, logPage, logService, logEndpoint, isAdmin, loadLogs])
  useEffect(() => { if (tab === 'notifications' && isAdmin) loadNotifications() }, [tab, isAdmin, loadNotifications])
  useEffect(() => { if (tab === 'analytics' && isAdmin) loadPageAnalytics() }, [tab, analyticsRange, isAdmin, loadPageAnalytics])
  useEffect(() => { if (tab === 'pricing' && isAdmin) loadPricingPlans() }, [tab, isAdmin, loadPricingPlans])
  useEffect(() => { if (tab === 'admins' && isAdmin) loadAdminUsers() }, [tab, isAdmin, adminUserSearch, loadAdminUsers])
  useEffect(() => { if (tab === 'articles' && isAdmin) loadArticles() }, [tab, isAdmin, loadArticles])
  useEffect(() => { if (tab === 'payments' && isAdmin) loadPaymentSettings() }, [tab, isAdmin, loadPaymentSettings])
  useEffect(() => { if (tab === 'websites' && isAdmin) loadAdminWebsites() }, [tab, isAdmin, adminWebsitesPage, adminWebsitesSearch, adminWebsitesFilter, loadAdminWebsites])

  const userAction = async (action: string, userId: string, extra: Record<string, unknown> = {}) => {
    const r = await fetch('/api/admin/user', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action, ...extra }) })
    if (r.ok) { showToast('✓ Done'); loadUsers(); if (tab === 'admins') loadAdminUsers() }
    else { const d = await r.json(); showToast('✗ ' + d.error) }
  }

  const uploadAdminImage = async (file: File, purpose: 'article' | 'notification') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('purpose', purpose)
    const r = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
    const d = await r.json().catch(() => ({}))
    if (!r.ok || !d.url) throw new Error(d.error || 'Image upload failed')
    return String(d.url)
  }

  const handleArticleImageUpload = async (file?: File | null) => {
    if (!file || articleImageUploading) return
    setArticleImageUploading(true)
    try {
      const url = await uploadAdminImage(file, 'article')
      setArticleForm(f => ({ ...f, coverImageUrl: url }))
      showToast('✓ Article image uploaded')
    } catch (e: any) { showToast('✗ ' + (e?.message || 'Article image upload failed')) }
    finally { setArticleImageUploading(false) }
  }

  const handleNotificationImageUpload = async (file?: File | null) => {
    if (!file || notifImageUploading) return
    setNotifImageUploading(true)
    try {
      const url = await uploadAdminImage(file, 'notification')
      setNotifForm(f => ({ ...f, imageUrl: url }))
      showToast('✓ Notification image uploaded')
    } catch (e: any) { showToast('✗ ' + (e?.message || 'Notification image upload failed')) }
    finally { setNotifImageUploading(false) }
  }

  const saveArticle = async () => {
    if (!articleForm.title.trim() || !articleForm.content.trim()) return showToast('Title and content required')
    setArticleSaving(true)
    try {
      const r = await fetch('/api/admin/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(articleForm) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Article save failed')
      showToast('✓ Article published')
      setArticleForm({ title: '', excerpt: '', content: '', coverImageUrl: '', tags: '', published: true })
      loadArticles()
    } catch (e: any) { showToast('✗ ' + (e?.message || 'Article save failed')) }
    finally { setArticleSaving(false) }
  }

  const savePaymentSettings = async () => {
    setPaymentSaving(true)
    try {
      const r = await fetch('/api/admin/payment-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paymentForm) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Payment setup failed')
      showToast('✓ Razorpay connected')
      setPaymentForm(f => ({ ...f, razorpayKeySecret: '', masked: d.razorpayKeySecretMasked || f.masked }))
    } catch (e: any) { showToast('✗ ' + (e?.message || 'Payment setup failed')) }
    finally { setPaymentSaving(false) }
  }

  const changePassword = async () => {
    if (pwNew !== pwConfirm) { setPwMsg('Passwords do not match'); return }
    if (pwNew.length < 8) { setPwMsg('Min 8 characters required'); return }
    const r = await fetch('/api/admin/user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }) })
    const d = await r.json()
    if (r.ok) { setPwMsg('✓ Password changed successfully'); setPwCurrent(''); setPwNew(''); setPwConfirm('') }
    else setPwMsg('✗ ' + d.error)
  }

  const saveRate = async () => {
    const rate = parseFloat(editRate)
    if (!rate || rate < 1) return
    const r = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usdToInr: rate }) })
    if (r.ok) { setUsdToInr(rate); setRateSource('manual'); setEditRate(''); showToast('✓ Exchange rate updated'); loadStats() }
  }

  const fetchLiveRates = async () => {
    setLiveRatesLoading(true)
    try {
      const r = await fetch('/api/admin/live-rates')
      if (r.ok) {
        const d = await r.json()
        if (d.usdToInr) {
          setUsdToInr(d.usdToInr); setRateSource(d.rateSource)
          showToast(`✓ Live rate: ₹${d.usdToInr} (${d.rateSource})`)
          await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usdToInr: d.usdToInr }) })
        }
        if (d.claudePricing) setClaudePricing(d.claudePricing)
      }
    } catch { showToast('✗ Failed to fetch live rates') }
    setLiveRatesLoading(false)
  }

  const saveGlobalLimits = async () => {
    setLimitsSaving(true)
    setLimitsMsg('')
    const toNum = (s: string) => s.trim() === '' ? null : parseInt(s)
    const r = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limits: {
          free:  { daily: toNum(globalLimits.free.daily),  weekly: toNum(globalLimits.free.weekly),  monthly: toNum(globalLimits.free.monthly)  },
          pro:   { daily: toNum(globalLimits.pro.daily),   weekly: toNum(globalLimits.pro.weekly),   monthly: toNum(globalLimits.pro.monthly)   },
          team:  { daily: toNum(globalLimits.team.daily),  weekly: toNum(globalLimits.team.weekly),  monthly: toNum(globalLimits.team.monthly)  },
        }
      }),
    })
    if (r.ok) { setLimitsMsg('✓ Global limits saved'); showToast('✓ Generation limits updated') }
    else       { setLimitsMsg('✗ Failed to save limits') }
    setLimitsSaving(false)
  }

  const saveMasterLimit = async () => {
    setMasterLimitSaving(true)
    setMasterLimitMsg('')
    const gl = Math.max(0, parseInt(masterLimit) || 5)
    const r = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ globalGenLimit: gl, globalLimitPeriod: masterPeriod }),
    })
    if (r.ok) { setMasterLimitMsg('✓ Saved'); showToast(`✓ Master limit: ${gl} generations/${masterPeriod}`) }
    else       { setMasterLimitMsg('✗ Failed to save') }
    setMasterLimitSaving(false)
  }

  const savePosterEditLimit = async () => {
    const limit = Math.max(0, parseInt(posterEditLimit) || 2)
    setPosterEditLimitSaving(true)
    setPosterEditLimitMsg('')
    const r = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ posterEditLimit: limit }),
    })
    if (r.ok) { setPosterEditLimitMsg('✓ Saved'); showToast(`✓ Poster edit limit set to ${limit}`) }
    else       { setPosterEditLimitMsg('✗ Failed to save') }
    setPosterEditLimitSaving(false)
  }

  const saveUserLimits = async () => {
    if (!editUser) return
    await userAction('set_limits', editUser.id, { daily: editLimits.daily || null, monthly: editLimits.monthly || null, yearly: editLimits.yearly || null })
    setEditUser(null)
  }

  // ── PDF Report Generator ──────────────────────────────────────────────────
  const generatePdfReport = async (reportType: 'overview' | 'users' | 'costs' | 'analytics') => {
    if (!stats) { showToast('✗ Stats not loaded'); return }
    setPdfReportLoading(true)
    try {
      const s = stats
      const c = s?.claude
      const usdToInrVal = s?.usdToInr ?? 84

      // Build HTML content for the report
      let reportTitle = ''
      let reportBody = ''
      const now = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })

      if (reportType === 'overview') {
        reportTitle = 'Platform Overview Report'
        reportBody = `
          <h2>Platform Summary</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Users</td><td>${fmtNum(s.overview?.totalUsers ?? 0)}</td></tr>
            <tr><td>New Users (30d)</td><td>${fmtNum(s.overview?.newUsersLast30 ?? 0)}</td></tr>
            <tr><td>Completed Generations</td><td>${fmtNum(s.overview?.totalGenerations ?? 0)}</td></tr>
            <tr><td>Failed Generations</td><td>${fmtNum(s.overview?.failedGenerations ?? 0)}</td></tr>
            <tr><td>Flagged</td><td>${fmtNum(s.overview?.flaggedGenerations ?? 0)}</td></tr>
          </table>
          <h2>Plan Distribution</h2>
          <table>
            <tr><th>Plan</th><th>Users</th></tr>
            ${(s.overview?.planCounts ?? []).map((pc: any) => `<tr><td>${pc.plan}</td><td>${pc._count}</td></tr>`).join('')}
          </table>
          <h2>Region Breakdown (Top 10)</h2>
          <table>
            <tr><th>Region</th><th>Total Users</th><th>New (30d)</th></tr>
            ${(s.regionBreakdown ?? []).slice(0, 10).map((r: any) => `<tr><td>${r.region}</td><td>${r.total}</td><td>${r.new30d}</td></tr>`).join('')}
          </table>
        `
      } else if (reportType === 'costs') {
        reportTitle = 'API Cost Report'
        reportBody = `
          <h2>Claude API Costs</h2>
          <table>
            <tr><th>Period</th><th>Calls</th><th>Cost (USD)</th><th>Cost (INR)</th></tr>
            <tr><td>Today</td><td>${fmtNum(c?.today?.calls ?? 0)}</td><td>${fmtUsd(c?.today?.costUsd ?? 0)}</td><td>${fmtInr(c?.today?.costInr ?? 0)}</td></tr>
            <tr><td>This Month</td><td>${fmtNum(c?.thisMonth?.calls ?? 0)}</td><td>${fmtUsd(c?.thisMonth?.costUsd ?? 0)}</td><td>${fmtInr(c?.thisMonth?.costInr ?? 0)}</td></tr>
            <tr><td>This Year</td><td>${fmtNum(c?.thisYear?.calls ?? 0)}</td><td>${fmtUsd(c?.thisYear?.costUsd ?? 0)}</td><td>${fmtInr(c?.thisYear?.costInr ?? 0)}</td></tr>
            <tr><td>All Time</td><td>${fmtNum(c?.allTime?.calls ?? 0)}</td><td>${fmtUsd(c?.allTime?.costUsd ?? 0)}</td><td>${fmtInr(c?.allTime?.costInr ?? 0)}</td></tr>
          </table>
          <h2>Cost by Model</h2>
          <table>
            <tr><th>Model</th><th>Calls</th><th>Cost (USD)</th><th>Cost (INR)</th></tr>
            ${(c?.modelBreakdown ?? []).map((m: any) => `<tr><td>${m.model ?? '—'}</td><td>${fmtNum(m._count)}</td><td>${fmtUsd(m._sum?.costUsd ?? 0)}</td><td>${fmtInr((m._sum?.costUsd ?? 0) * usdToInrVal)}</td></tr>`).join('')}
          </table>
          <h2>Top User Costs (All Time)</h2>
          <table>
            <tr><th>User</th><th>Plan</th><th>Region</th><th>API Calls</th><th>Cost (INR)</th></tr>
            ${(s.userCosts ?? []).slice(0, 20).map((u: any) => `<tr><td>${u.email}</td><td>${u.plan}</td><td>${u.region ?? '—'}</td><td>${fmtNum(u.calls)}</td><td>${fmtInr(u.costInr ?? 0)}</td></tr>`).join('')}
          </table>
        `
      } else if (reportType === 'users') {
        reportTitle = 'User Report'
        reportBody = `
          <h2>User Overview</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Users</td><td>${fmtNum(s.overview?.totalUsers ?? 0)}</td></tr>
            <tr><td>New Users (30d)</td><td>${fmtNum(s.overview?.newUsersLast30 ?? 0)}</td></tr>
          </table>
          <h2>Users by Region</h2>
          <table>
            <tr><th>Region</th><th>Total</th><th>New (30d)</th></tr>
            ${(s.regionBreakdown ?? []).map((r: any) => `<tr><td>${r.region}</td><td>${r.total}</td><td>${r.new30d}</td></tr>`).join('')}
          </table>
          <h2>Top Users by API Cost</h2>
          <table>
            <tr><th>Email</th><th>Plan</th><th>Region</th><th>Calls</th><th>Cost (INR)</th><th>Cost (USD)</th></tr>
            ${(s.userCosts ?? []).map((u: any) => `<tr><td>${u.email}</td><td>${u.plan}</td><td>${u.region ?? '—'}</td><td>${fmtNum(u.calls)}</td><td>${fmtInr(u.costInr ?? 0)}</td><td>${fmtUsd(u.costUsd ?? 0)}</td></tr>`).join('')}
          </table>
        `
      } else if (reportType === 'analytics') {
        reportTitle = 'Page Analytics Report'
        if (!pageAnalytics) { showToast('✗ Load analytics tab first'); setPdfReportLoading(false); return }
        reportBody = `
          <h2>Traffic Summary (Last ${analyticsRange} days)</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Page Views</td><td>${fmtNum(pageAnalytics.summary?.totalVisits ?? 0)}</td></tr>
            <tr><td>Unique Users</td><td>${fmtNum(pageAnalytics.summary?.uniqueUsers ?? 0)}</td></tr>
            <tr><td>Unique Pages</td><td>${fmtNum(pageAnalytics.summary?.uniquePages ?? 0)}</td></tr>
            <tr><td>Avg Session Duration</td><td>${fmtDuration(pageAnalytics.summary?.avgDuration ?? 0)}</td></tr>
          </table>
          <h2>Top Pages</h2>
          <table>
            <tr><th>Page</th><th>Visits</th><th>Unique Users</th><th>Avg Time</th></tr>
            ${(pageAnalytics.topPages ?? []).map((p: any) => `<tr><td>${p.page}</td><td>${fmtNum(p.visits)}</td><td>${fmtNum(p.uniqueUsers)}</td><td>${fmtDuration(p.avgDuration)}</td></tr>`).join('')}
          </table>
        `
      }

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Brand Syndicate — ${reportTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #1a1a1a; padding: 40px; }
    .header { border-bottom: 3px solid #C9A84C; padding-bottom: 20px; margin-bottom: 32px; }
    .logo { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: #1a1a1a; }
    .logo span { color: #C9A84C; font-style: italic; }
    .meta { font-size: 11px; color: #666; margin-top: 6px; letter-spacing: 0.05em; text-transform: uppercase; font-family: 'Courier New', monospace; }
    h2 { font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; color: #C9A84C; margin: 28px 0 12px; border-left: 3px solid #C9A84C; padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
    th { background: #f5f0e8; color: #333; font-weight: 600; padding: 8px 12px; text-align: left; border-bottom: 1px solid #e0d8c8; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
    td { padding: 7px 12px; border-bottom: 1px solid #f0ebe0; color: #333; }
    tr:nth-child(even) td { background: #faf7f2; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0d8c8; font-size: 10px; color: #999; font-family: 'Courier New', monospace; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Brand <span>Syndicate</span></div>
    <div class="meta">Admin Report · ${reportTitle} · Generated ${now}</div>
  </div>
  ${reportBody}
  <div class="footer">Brand Syndicate Admin Console · Confidential · ${now}</div>
</body>
</html>`

      // Open in new tab for print-to-PDF
      const blob = new Blob([html], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank')
      if (win) {
        win.onload = () => {
          setTimeout(() => {
            win.print()
            URL.revokeObjectURL(url)
          }, 500)
        }
      }
      showToast('✓ Report opened — use Print → Save as PDF')
    } catch (e) {
      showToast('✗ Report generation failed')
    }
    setPdfReportLoading(false)
  }

  const sendNotification = async () => {
    if (!notifForm.title.trim() || !notifForm.body.trim()) { showToast('✗ Title and body required'); return }
    setNotifSending(true)
    const r = await fetch('/api/admin/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(notifForm) })
    if (r.ok) { showToast('✓ Notification sent'); setNotifForm({ title: '', body: '', imageUrl: '', targetUserId: '' }); setNotifPreview(false); loadNotifications() }
    else showToast('✗ Failed to send')
    setNotifSending(false)
  }

  const deleteNotification = async (id: string) => {
    if (!confirm('Delete this notification?')) return
    const r = await fetch(`/api/admin/notifications?id=${id}`, { method: 'DELETE' })
    if (r.ok) { showToast('✓ Deleted'); loadNotifications() }
  }

  const openEditPlan = (plan: Record<string, any>) => {
    setEditingPlan({ ...plan })
    try { setPlanFeaturesText(JSON.parse(plan.features || '[]').join('\n')) } catch { setPlanFeaturesText('') }
  }

  const createPricingPlan = () => {
    const nextOrder = pricingPlans.length ? Math.max(...pricingPlans.map((p: any) => Number(p.sortOrder || 0))) + 1 : 0
    setEditingPlan({
      planId: `CUSTOM_${Date.now()}`,
      name: 'New Plan',
      price: '₹0',
      period: 'one-time',
      isVisible: true,
      highlight: false,
      sortOrder: nextOrder,
      features: '[]',
      _isNew: true,
    })
    setPlanFeaturesText('Feature 1\nFeature 2\nFeature 3')
  }

  const savePricingPlan = async () => {
    if (!editingPlan) return
    const features = planFeaturesText.split('\n').map((s: string) => s.trim()).filter(Boolean)
    const planId = String(editingPlan.planId || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '_')
    if (!planId) { showToast('✗ Plan ID required'); return }
    const payload = { ...editingPlan, planId, features: JSON.stringify(features), sortOrder: Number(editingPlan.sortOrder || 0) }
    const r = await fetch('/api/admin/pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (r.ok) { showToast(editingPlan._isNew ? '✓ Plan added' : '✓ Plan updated'); setEditingPlan(null); loadPricingPlans() }
    else showToast('✗ Failed to save plan')
  }

  const deletePricingPlan = async (planId: string) => {
    if (!planId) return
    if (!confirm(`Delete pricing plan ${planId}? This removes it from the billing page.`)) return
    const r = await fetch(`/api/admin/pricing?planId=${encodeURIComponent(planId)}`, { method: 'DELETE' })
    if (r.ok) { showToast('✓ Plan deleted'); loadPricingPlans() }
    else showToast('✗ Failed to delete plan')
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 32, height: 32, border: `1px solid var(--border)`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO }}>Loading Admin</div>
      </div>
    )
  }
  if (!isAdmin) return null

  const s = stats; const c = s?.claude; const p = s?.openai; const oi = s?.openai

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, borderRadius: 8, fontFamily: SANS, outline: 'none' }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'costs', label: 'API Costs' }, { id: 'users', label: 'Users' },
    { id: 'admins', label: 'Admins' }, { id: 'articles', label: 'Articles' }, { id: 'payments', label: 'Payments' },
    { id: 'websites', label: '⊕ Websites' }, { id: 'logs', label: 'Logs' }, { id: 'notifications', label: 'Notifications' },
    { id: 'analytics', label: 'Page Analytics' }, { id: 'pricing', label: 'Pricing Plans' },
    { id: 'database', label: 'Database' }, { id: 'settings', label: 'Settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @keyframes adminFloatPill {
          0%, 100% { transform: perspective(1200px) rotateX(10deg) rotateY(-6deg) translateY(0px); }
          33% { transform: perspective(1200px) rotateX(8deg) rotateY(-4deg) translateY(-18px); }
          66% { transform: perspective(1200px) rotateX(12deg) rotateY(-8deg) translateY(-8px); }
        }
        @keyframes adminPillGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes adminDotPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Floating admin pill ── responsive, light+dark ── */}
      <div aria-hidden className="admin-flying-pill">
        {/* Pill glow */}
        <div style={{
          position: 'absolute', top: '8%', left: '50%',
          transform: 'translateX(-50%)',
          width: 480, height: 140, maxWidth: '90vw',
          background: `radial-gradient(ellipse, ${GOLD}12 0%, transparent 70%)`,
          borderRadius: '50%', filter: 'blur(32px)',
          pointerEvents: 'none',
        }} />
        {/* Pill container */}
        <div className="admin-pill-inner">
          <div className="admin-pill-dot" />
          <span>⚡</span>
          <span>Brand Syndicate</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Admin Console</span>
          <div className="admin-pill-dot" />
        </div>
        {/* Ambient gradient wash */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${GOLD}06 0%, transparent 60%)`, pointerEvents: 'none' }} />
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, background: toast.startsWith('✓') ? 'rgba(18,42,28,0.97)' : 'rgba(42,18,18,0.97)', border: `1px solid ${toast.startsWith('✓') ? GREEN : RED}`, padding: '12px 22px', borderRadius: 12, fontSize: 12, fontFamily: MONO, color: toast.startsWith('✓') ? '#6FCF97' : '#E57373', boxShadow: '0 16px 48px rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          {toast}
        </div>
      )}

      {/* Edit Limits Modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 32, width: '100%', maxWidth: 420 }}>
            <div style={{ fontFamily: SERIF, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>Generation Limits</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, marginBottom: 24 }}>{editUser.email}</div>
            {(['daily', 'monthly', 'yearly'] as const).map(period => (
              <div key={period} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>{period} Limit <span style={{ color: GOLD }}>(blank = plan default)</span></label>
                <input type="number" min="0" value={editLimits[period]} onChange={e => setEditLimits(l => ({ ...l, [period]: e.target.value }))} placeholder={`Current: ${editUser[period + 'GenLimit'] ?? 'plan default'}`} style={inputStyle} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: -4, marginBottom: 12 }}>
              {[25, 100].map(n => (
                <button key={`plus-${n}`} onClick={() => setEditLimits(l => ({ ...l, monthly: String((parseInt(l.monthly || String(editUser.monthlyGenLimit ?? 0), 10) || 0) + n) }))} style={{ padding: '8px 0', background: 'transparent', color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 8, fontSize: 10, fontFamily: MONO, cursor: 'pointer' }}>+{n}/mo</button>
              ))}
              {[25, 100].map(n => (
                <button key={`minus-${n}`} onClick={() => setEditLimits(l => ({ ...l, monthly: String(Math.max(0, (parseInt(l.monthly || String(editUser.monthlyGenLimit ?? 0), 10) || 0) - n)) }))} style={{ padding: '8px 0', background: 'transparent', color: RED, border: `1px solid ${RED}55`, borderRadius: 8, fontSize: 10, fontFamily: MONO, cursor: 'pointer' }}>-{n}/mo</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
              <button onClick={() => setEditLimits({ daily: '5', monthly: '5', yearly: '' })} style={{ padding: '8px 0', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 10, fontFamily: MONO, cursor: 'pointer' }}>Set 5</button>
              <button onClick={() => setEditLimits({ daily: '25', monthly: '25', yearly: '' })} style={{ padding: '8px 0', background: 'transparent', color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 8, fontSize: 10, fontFamily: MONO, cursor: 'pointer' }}>Set 25</button>
              <button onClick={() => setEditLimits({ daily: '0', monthly: '0', yearly: '0' })} style={{ padding: '8px 0', background: 'transparent', color: GREEN, border: `1px solid ${GREEN}55`, borderRadius: 8, fontSize: 10, fontFamily: MONO, cursor: 'pointer' }}>Unlimited</button>
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO, marginBottom: 12, lineHeight: 1.5 }}>0 means unlimited for that user. Blank means use the global/default limit.</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={saveUserLimits} style={{ flex: 1, padding: '10px 0', background: GOLD, color: '#000', border: 'none', borderRadius: 2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS }}>Save</button>
              <button onClick={() => setEditUser(null)} style={{ flex: 1, padding: '10px 0', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 2, fontSize: 11, cursor: 'pointer', fontFamily: SANS }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pricing Plan Modal */}
      {editingPlan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: SERIF, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>{editingPlan._isNew ? 'Add Plan' : 'Edit Plan'} · {editingPlan.planId}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO, marginBottom: 24 }}>Changes reflect immediately on billing page</div>
            {([['planId', 'Plan ID', 'CUSTOM_PLAN'], ['name', 'Display Name', 'AI Creator'], ['price', 'Price', '₹1,000'], ['period', 'Period', '50 generations'], ['sortOrder', 'Sort Order', '0']] as const).map(([key, label, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>{label}</label>
                <input type={key === 'sortOrder' ? 'number' : 'text'} value={editingPlan[key] || ''} onChange={e => setEditingPlan((prev: any) => ({ ...prev, [key]: e.target.value }))} placeholder={ph} style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>Features <span style={{ color: GOLD }}>(one per line)</span></label>
              <textarea value={planFeaturesText} onChange={e => setPlanFeaturesText(e.target.value)} rows={7} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={editingPlan.isVisible !== false} onChange={e => setEditingPlan((p: any) => ({ ...p, isVisible: e.target.checked }))} />
                <span style={{ color: 'var(--text)' }}>Visible on billing page</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={!!editingPlan.highlight} onChange={e => setEditingPlan((p: any) => ({ ...p, highlight: e.target.checked }))} />
                <span style={{ color: GOLD }}>Highlight (recommended badge)</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={savePricingPlan} style={{ flex: 1, padding: '10px 0', background: GOLD, color: '#000', border: 'none', borderRadius: 2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS }}>Save Plan</button>
              <button onClick={() => setEditingPlan(null)} style={{ flex: 1, padding: '10px 0', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 2, fontSize: 11, cursor: 'pointer', fontFamily: SANS }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content, positioned above atmospheric bg ── */}
      <div className="admin-main-pad" style={{ position: 'relative', zIndex: 1, maxWidth: 1360, margin: '0 auto', padding: '80px 28px 44px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 44, flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 10 }}>
          <div>
            {/* Eyebrow, matches landing page tag style */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 14 }}>
              <div style={{ width: 20, height: 1, background: GOLD }} />
              Admin Console
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: RED, boxShadow: `0 0 8px ${RED}80` }} />
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(26px,3vw,38px)', fontWeight: 400, color: 'var(--text)', margin: 0, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
              Brand <em style={{ fontStyle: 'italic', color: GOLD }}>Syndicate</em>
            </h1>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: MONO, marginTop: 8 }}>{ADMIN_EMAIL}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Live rate badge, glassmorphism card */}
            <div style={{ background: 'var(--surface)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid var(--border)', borderRadius: 14, padding: '10px 18px', textAlign: 'right' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 3 }}>USD / INR</div>
              <div style={{ fontSize: 20, fontFamily: SERIF, color: GOLD, lineHeight: 1 }}>₹{usdToInr.toFixed(2)}</div>
              <div style={{ marginTop: 4 }}><LivePill source={rateSource} /></div>
            </div>

            {/* Theme */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO }}>Theme</div>
              <ThemeToggle />
            </div>

            {/* App link */}
            <Link href="/generate" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--surface-glass)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text)', fontFamily: MONO, textDecoration: 'none', transition: 'color 0.2s, border-color 0.2s', zIndex: 10, position: 'relative' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = GOLD; (e.currentTarget as HTMLAnchorElement).style.borderColor = GOLD }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Dashboard
            </Link>

            {/* Logout */}
            <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: `${RED}10`, border: `1px solid ${RED}45`, borderRadius: 100, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: RED, fontFamily: MONO, cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${RED}22`; (e.currentTarget as HTMLButtonElement).style.borderColor = RED }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${RED}10`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${RED}45` }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Logout
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="admin-tab-bar" style={{ display: 'flex', marginBottom: 44, gap: 2, overflowX: 'auto', scrollbarWidth: 'thin', padding: '0 0 8px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? `2px solid ${GOLD}` : '2px solid transparent',
              color: tab === t.id ? GOLD : 'var(--muted)',
              fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: MONO,
              whiteSpace: 'nowrap', transition: 'all 0.18s',
              marginBottom: -1,
            }}>
              {t.label}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', paddingBottom: 2 }}>
            <button
              onClick={() => { setLoading(true); loadStats(Number(overviewRange)).finally(() => setLoading(false)) }}
              disabled={loading}
              style={{
                padding: '6px 14px', background: 'transparent',
                border: `1px solid ${loading ? 'var(--border)' : GOLD + '60'}`,
                color: loading ? 'var(--muted)' : GOLD,
                fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: loading ? 'default' : 'pointer', fontFamily: MONO,
                borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.18s',
              }}
            >
              <span style={{ display: 'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && s && (
          <>
            {/* ── Date Range Selector + PDF Report ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO, marginRight: 4 }}>Range:</span>
              {([['1', 'Today'], ['7', '7d'], ['30', '30d'], ['90', '90d'], ['180', '6mo'], ['365', '1yr']] as [DateRange, string][]).map(([val, label]) => (
                <button key={val} className={`admin-range-pill ${overviewRange === val ? 'active' : 'inactive'}`}
                  onClick={() => { setOverviewRange(val); setLoading(true); loadStats(Number(val)).finally(() => setLoading(false)) }}>
                  {label}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {(['overview', 'users', 'costs'] as const).map(rtype => (
                  <button key={rtype} onClick={() => generatePdfReport(rtype)} disabled={pdfReportLoading}
                    style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${GOLD}60`, color: GOLD, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 6, fontFamily: MONO, display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s', opacity: pdfReportLoading ? 0.6 : 1 }}>
                    ↓ {rtype} PDF
                  </button>
                ))}
              </div>
            </div>
            <Section title={`Platform Overview — ${overviewRange === '1' ? 'Today' : overviewRange === '7' ? 'Last 7 Days' : overviewRange === '30' ? 'Last 30 Days' : overviewRange === '90' ? 'Last 90 Days' : overviewRange === '180' ? 'Last 6 Months' : 'Last Year'}`}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 16 }}>
                <Stat label="Total Users" value={fmtNum(s.overview.totalUsers)} />
                <Stat label="Completed Gens" value={fmtNum(s.overview.totalGenerations)} />
                <Stat label="Failed" value={fmtNum(s.overview.failedGenerations)} color={RED} />
                <Stat label="Flagged" value={fmtNum(s.overview.flaggedGenerations)} color="#E67E22" />
                <Stat label="OpenAI Image Calls" value={fmtNum(p?.total ?? 0)} sub={`${p?.today ?? 0} today`} />
                <Stat label="Claude Calls" value={fmtNum(c.allTime.calls)} sub={`${c.today.calls} today`} />
                {oi && <Stat label="OpenAI Image Calls (gpt-image-1)" value={fmtNum(oi.allTime.calls)} sub={fmtInr(oi.allTime.costInr) + ' total'} color={GOLD} />}
                {s.pexelsWebsite && <Stat label="Pexels → Website" value={fmtNum(s.pexelsWebsite.allTime)} sub={`${s.pexelsWebsite.today} today · ${s.pexelsWebsite.thisMonth} this month`} color={BLUE} />}
                {(() => {
                  // Use genByType (Generation records) for accurate counts — falls back to apiCallLog
                  const gt = s.genByType?.find((e: any) => e.genType === 'brand-images')
                  const ep = s.genByEndpoint?.find((e: any) => e.endpoint === 'generate-graphics')
                  const complete = gt?.complete ?? ep?.success ?? 0
                  const failed   = gt?.failed   ?? ep?.failed  ?? 0
                  const today    = gt?.today     ?? 0
                  const subText  = failed > 0 ? `${failed} failed · ${today} today` : `${today} today`
                  if (complete === 0 && failed === 0) return null
                  return <Stat label="Brand Images Generated" value={fmtNum(complete)} sub={subText} color={failed > 0 ? RED : GREEN} />
                })()}
                {(() => {
                  const gt = s.genByType?.find((e: any) => e.genType === 'logo')
                  const ep = s.genByEndpoint?.find((e: any) => e.endpoint === 'generate-logo-image')
                  const complete = gt?.complete ?? ep?.success ?? 0
                  const failed   = gt?.failed   ?? ep?.failed  ?? 0
                  const today    = gt?.today     ?? 0
                  const subText  = failed > 0 ? `${failed} failed · ${today} today` : `${today} today`
                  if (complete === 0 && failed === 0) return null
                  return <Stat label="Logo Images Generated" value={fmtNum(complete)} sub={subText} color={failed > 0 ? RED : GREEN} />
                })()}
                {(() => {
                  const gt = s.genByType?.find((e: any) => e.genType === 'strategy')
                  if (!gt || (gt.complete === 0 && gt.failed === 0)) return null
                  return <Stat label="Strategies Generated" value={fmtNum(gt.complete)} sub={gt.failed > 0 ? `${gt.failed} failed · ${gt.today} today` : `${gt.today} today`} color={gt.failed > 0 ? RED : GREEN} />
                })()}
                {(() => {
                  const gt = s.genByType?.find((e: any) => e.genType === 'calendar')
                  if (!gt || (gt.complete === 0 && gt.failed === 0)) return null
                  return <Stat label="Calendars Generated" value={fmtNum(gt.complete)} sub={gt.failed > 0 ? `${gt.failed} failed · ${gt.today} today` : `${gt.today} today`} color={gt.failed > 0 ? RED : GREEN} />
                })()}
              </div>
            </Section>
            <Section title="Plan Distribution">
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {s.overview.planCounts.map((pc: any) => (
                  <div key={pc.plan} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 28px', minWidth: 130, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: MONO, marginBottom: 8 }}>{pc.plan}</div>
                    <div style={{ fontSize: 32, fontFamily: SERIF, color: pc.plan !== 'FREE' ? GOLD : 'var(--text)' }}>{pc._count}</div>
                  </div>
                ))}
                {/* New users in selected range */}
                  <div style={{ background: `${GREEN}0A`, border: `1px solid ${GREEN}30`, borderRadius: 12, padding: '20px 28px', minWidth: 130, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: MONO, marginBottom: 8 }}>
                    {overviewRange === '1' ? 'New Today' : `New (${overviewRange === '7' ? '7d' : overviewRange === '30' ? '30d' : overviewRange === '90' ? '90d' : overviewRange === '180' ? '6mo' : '1yr'})`}
                  </div>
                  <div style={{ fontSize: 32, fontFamily: SERIF, color: GREEN }}>{fmtNum(s.overview?.newUsersLast30 ?? 0)}</div>
                </div>
              </div>
            </Section>

            {/* ── Region Breakdown ── */}
            {s.regionBreakdown && s.regionBreakdown.length > 0 && (
              <Section title="User Region Breakdown">
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Region / State', 'Total Users', 'New (30d)', '% of Total'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {s.regionBreakdown.map((r: any) => {
                        const pct = s.overview?.totalUsers > 0 ? ((r.total / s.overview.totalUsers) * 100).toFixed(1) + '%' : '—'
                        const barW = s.overview?.totalUsers > 0 ? Math.round((r.total / s.overview.totalUsers) * 100) : 0
                        return (
                          <tr key={r.region} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '9px 16px', fontSize: 12, color: GOLD, fontFamily: MONO }}>{r.region}</td>
                            <td style={{ padding: '9px 16px', fontSize: 12, color: 'var(--text)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontFamily: SERIF, fontSize: 15, minWidth: 30 }}>{fmtNum(r.total)}</span>
                                <div style={{ flex: 1, maxWidth: 120, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                                  <div style={{ width: `${barW}%`, height: '100%', background: GOLD, borderRadius: 2, opacity: 0.7 }} />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '9px 16px', fontSize: 11, fontFamily: MONO, color: r.new30d > 0 ? GREEN : 'var(--muted)' }}>
                              {r.new30d > 0 ? `+${fmtNum(r.new30d)}` : '—'}
                            </td>
                            <td style={{ padding: '9px 16px', fontSize: 11, fontFamily: MONO, color: 'var(--muted)' }}>{pct}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 10, fontSize: 10, color: 'var(--muted)', fontFamily: MONO }}>
                  Region derived from user's location field. Users without location show as Unknown.
                </div>
                {/* ── Geo Backfill ── */}
                <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 10 }}>
                    Location Backfill — set default location for users with no location
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO, marginBottom: 10, lineHeight: 1.6 }}>
                    New registrations are geo-located automatically from IP. For existing users who signed up before this fix, use the buttons below.
                  </div>
                  {geoScan && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                      <Stat label="Total Users" value={String(geoScan.total)} />
                      <Stat label="Have Location" value={String(geoScan.withLocation)} color={GREEN} />
                      <Stat label="Missing Location" value={String(geoScan.withoutLocation)} color={geoScan.withoutLocation > 0 ? RED : GREEN} />
                    </div>
                  )}
                  {geoResult && (
                    <div style={{ padding: '8px 12px', background: 'rgba(46,160,67,0.08)', border: `1px solid ${GREEN}30`, borderRadius: 6, marginBottom: 10, fontSize: 10, color: GREEN, fontFamily: MONO }}>
                      {geoResult.message}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={scanGeo} disabled={geoLoading}
                      style={{ padding: '7px 16px', background: 'transparent', border: `1px solid ${GOLD}60`, color: GOLD, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: geoLoading ? 'default' : 'pointer', fontFamily: MONO, borderRadius: 4, opacity: geoLoading ? 0.5 : 1 }}>
                      {geoLoading ? '…' : '⊡ Scan Missing'}
                    </button>
                    <button onClick={() => runGeoBackfill('India')} disabled={geoLoading}
                      style={{ padding: '7px 16px', background: geoLoading ? 'transparent' : GREEN + '18', border: `1px solid ${GREEN}60`, color: GREEN, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: geoLoading ? 'default' : 'pointer', fontFamily: MONO, borderRadius: 4, opacity: geoLoading ? 0.5 : 1 }}>
                      {geoLoading ? '⟳ Running…' : '▶ Set "India" for all missing'}
                    </button>
                    <button onClick={() => runGeoBackfill('Uttar Pradesh')} disabled={geoLoading}
                      style={{ padding: '7px 16px', background: 'transparent', border: `1px solid var(--border)`, color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: geoLoading ? 'default' : 'pointer', fontFamily: MONO, borderRadius: 4, opacity: geoLoading ? 0.5 : 1 }}>
                      Set "Uttar Pradesh"
                    </button>
                  </div>
                </div>
              </Section>
            )}
            <Section title="Generation Insights — All Types">
              {/* ── Per-endpoint success / failure grid ── */}
              {s.genByEndpoint && s.genByEndpoint.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 12 }}>Calls by Generation Type (all time, success vs fail)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {s.genByEndpoint.map((ep: { endpoint: string; success: number; failed: number; total: number }) => {
                      const label: Record<string, string> = {
                        'generate':                     'Brand Pack (Personal)',
                        'generate-business':            'Business Pack',
                        'generate-business-guest':      'Business Pack (Guest)',
                        'generate-website-stream':      'Website Generation (Full Code)',
                        'generate-website-template-json': 'Website Template AI',
                        'generate-graphics':            'Brand Images (gpt-image-1)',
                        'generate-logo-image':          'Logo Image (gpt-image-1)',
                        'generate-strategy':            'Brand Strategy',
                        'generate-calendar':            'Content Calendar',
                        'website-ai-edit':              'AI Website Edit',
                        'image-route':                  'Image API (/api/image)',
                      }
                      const name = label[ep.endpoint] ?? ep.endpoint
                      const failPct = ep.total > 0 ? Math.round((ep.failed / ep.total) * 100) : 0
                      return (
                        <div key={ep.endpoint} style={{ background: 'var(--surface)', border: `1px solid ${ep.failed > 0 ? RED + '40' : 'var(--border)'}`, borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 8 }}>{name}</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 26, fontFamily: SERIF, color: 'var(--text)', lineHeight: 1 }}>{ep.total}</span>
                            <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: MONO }}>calls</span>
                          </div>
                          <div style={{ display: 'flex', gap: 10, fontSize: 9, fontFamily: MONO }}>
                            <span style={{ color: GREEN }}>✓ {ep.success}</span>
                            {ep.failed > 0 && <span style={{ color: RED }}>✗ {ep.failed} ({failPct}%)</span>}
                          </div>
                          {ep.total > 0 && (
                            <div style={{ marginTop: 8, height: 3, background: 'var(--surface)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', display: 'flex' }}>
                                <div style={{ width: `${100 - failPct}%`, background: GREEN, borderRadius: '2px 0 0 2px' }} />
                                {ep.failed > 0 && <div style={{ flex: 1, background: RED }} />}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── Asset type breakdown from last 50 generations (main generate flow) ── */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 12 }}>Asset Types Selected (last 50 brand-pack gens)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                  {['logo','graphics','copy','website','presentation'].map(t => {
                    const count = s.recentGenerations.filter((g: any) => {
                      try {
                        const types = Array.isArray(g.inputData?.outputTypes)
                          ? g.inputData.outputTypes
                          : typeof g.inputData?.outputTypes === 'string'
                            ? JSON.parse(g.inputData.outputTypes)
                            : []
                        return types.includes(t)
                      } catch { return false }
                    }).length
                    const pct = s.recentGenerations.length > 0 ? Math.round((count / s.recentGenerations.length) * 100) : 0
                    return (
                      <div key={t} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 8 }}>{t}</div>
                        <div style={{ fontSize: 26, fontFamily: SERIF, color: 'var(--text)', marginBottom: 6 }}>{count}</div>
                        <div style={{ height: 3, background: 'var(--surface)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: GOLD, borderRadius: 8 }} />
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: MONO }}>{pct}% of last 50</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Combo breakdown ── */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 12 }}>Asset Combinations (last 50 gens)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(() => {
                    const comboCounts: Record<string, number> = {}
                    s.recentGenerations.forEach((g: any) => {
                      try {
                        const types = Array.isArray(g.inputData?.outputTypes)
                          ? g.inputData.outputTypes
                          : typeof g.inputData?.outputTypes === 'string'
                            ? JSON.parse(g.inputData.outputTypes)
                            : []
                        const key = types.sort().join(' + ') || 'none'
                        comboCounts[key] = (comboCounts[key] || 0) + 1
                      } catch {}
                    })
                    return Object.entries(comboCounts).sort((a,b) => b[1]-a[1]).map(([combo, n]) => (
                      <div key={combo} style={{ padding: '5px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 100, fontSize: 10, color: 'var(--text)', fontFamily: MONO, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: GOLD }}>{n}×</span> {combo}
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </Section>

            {/* ── BACKFILL SECTION — Re-render campaign images ─────────────────── */}
            <Section title="Brand Image Renderer — Backfill Tool">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>
                  Re-render campaign-image generations with the corrected Sharp compositor (contrast engine, layout-aware scrim, unified dark-template detection).
                  Each DB record stores the full <code style={{ background: 'var(--surface)', padding: '1px 5px', borderRadius: 3 }}>renderContract</code> so re-renders need no API calls.
                  <br /><strong style={{ color: GOLD }}>Run Backfill</strong> — fixes generations that fell back to raw stock-photo URLs (no text overlay).
                  <br /><strong style={{ color: 'var(--muted)' }}>Force Re-render All</strong> — re-renders every campaign image, including already-rendered ones, to apply the contrast and scrim fixes.
                </div>

                {rerenderScan && (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <Stat label="Total Campaign Images" value={String(rerenderScan.total_campaign_images)} />
                    <Stat label="Already Rendered" value={String(rerenderScan.already_rendered)} color={GREEN} />
                    <Stat label="Needs Backfill" value={String(rerenderScan.needs_backfill)} color={rerenderScan.needs_backfill > 0 ? RED : GREEN} />
                  </div>
                )}

                {rerenderResult && (
                  <div style={{ padding: '10px 14px', background: rerenderResult.failed > 0 ? 'rgba(220,53,69,0.08)' : 'rgba(46,160,67,0.08)', border: `1px solid ${rerenderResult.failed > 0 ? RED : GREEN}30`, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: rerenderResult.failed > 0 ? RED : GREEN, fontFamily: MONO }}>
                      {rerenderResult.message}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, fontFamily: MONO }}>
                      {rerenderResult.succeeded} succeeded · {rerenderResult.failed} failed · {rerenderResult.processed} processed
                      {rerenderResult.forceAll && <span style={{ color: GOLD, marginLeft: 8 }}>· force-all mode</span>}
                    </div>
                  </div>
                )}

                {/* Row 1 — Scan + normal backfill */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={scanBackfill}
                    disabled={rerenderLoading}
                    style={{ padding: '7px 18px', background: 'transparent', border: `1px solid ${GOLD}60`, color: GOLD, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: rerenderLoading ? 'default' : 'pointer', fontFamily: MONO, borderRadius: 4, opacity: rerenderLoading ? 0.5 : 1 }}
                  >
                    {rerenderLoading ? '…' : '⊡ Scan'}
                  </button>
                  <button
                    onClick={() => runBackfill(50, false)}
                    disabled={rerenderLoading || (rerenderScan !== null && rerenderScan.needs_backfill === 0)}
                    style={{ padding: '7px 18px', background: rerenderLoading ? 'transparent' : GREEN + '18', border: `1px solid ${GREEN}60`, color: GREEN, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: rerenderLoading ? 'default' : 'pointer', fontFamily: MONO, borderRadius: 4, opacity: rerenderLoading ? 0.5 : 1 }}
                  >
                    {rerenderLoading ? '⟳ Running…' : '▶ Run Backfill (50)'}
                  </button>
                  <button
                    onClick={() => runBackfill(200, false)}
                    disabled={rerenderLoading}
                    style={{ padding: '7px 18px', background: 'transparent', border: `1px solid var(--border)`, color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: rerenderLoading ? 'default' : 'pointer', fontFamily: MONO, borderRadius: 4, opacity: rerenderLoading ? 0.5 : 1 }}
                  >
                    Run Backfill (200)
                  </button>
                </div>

                {/* Row 2 — Force re-render all (already-rendered included) */}
                <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO, marginBottom: 8 }}>
                    Force re-render: applies contrast + scrim fixes to ALL existing campaign images, even those already rendered.
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => runBackfill(50, true)}
                      disabled={rerenderLoading}
                      style={{ padding: '7px 18px', background: 'rgba(201,168,76,0.10)', border: `1px solid ${GOLD}80`, color: GOLD, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: rerenderLoading ? 'default' : 'pointer', fontFamily: MONO, borderRadius: 4, opacity: rerenderLoading ? 0.5 : 1 }}
                    >
                      {rerenderLoading ? '⟳ Running…' : '⚡ Force Re-render All (50)'}
                    </button>
                    <button
                      onClick={() => runBackfill(200, true)}
                      disabled={rerenderLoading}
                      style={{ padding: '7px 18px', background: 'rgba(201,168,76,0.06)', border: `1px solid ${GOLD}40`, color: GOLD, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: rerenderLoading ? 'default' : 'pointer', fontFamily: MONO, borderRadius: 4, opacity: rerenderLoading ? 0.5 : 0.7 }}
                    >
                      Force Re-render All (200)
                    </button>
                    <button
                      onClick={() => runBackfill(500, true)}
                      disabled={rerenderLoading}
                      style={{ padding: '7px 18px', background: 'transparent', border: `1px solid var(--border)`, color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: rerenderLoading ? 'default' : 'pointer', fontFamily: MONO, borderRadius: 4, opacity: rerenderLoading ? 0.5 : 0.6 }}
                    >
                      Force Re-render All (500)
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO }}>
                  Re-renders replay the saved renderContract. No extra API costs. Updated poster URL writes back to outputData.finalPosterUrl automatically.
                </div>
              </div>
            </Section>

            <Section title="Generated Images by Users — All Variations + Admin Re-render">
              {(!s?.recentImageGenerations || s.recentImageGenerations.length === 0) ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontFamily: MONO, fontSize: 11 }}>No generated images yet.</div>
              ) : (
                <ImageGenerationsSection
                  generations={s.recentImageGenerations}
                  downloadingKey={downloadingKey}
                  handleDownloadAll={handleDownloadAll}
                  handleDownload={handleDownload}
                  deleteGeneration={deleteGeneration}
                  deletingGenerationId={deletingGenerationId}
                  canRerender={true}
                  reRenderBusy={rerenderingImageKey ? { [rerenderingImageKey]: true } : {}}
                  handleReRenderImage={(genId, index) => rerenderSingleImage(genId, index)}
                  BLUE={BLUE} RED={RED} GOLD={GOLD} MONO={MONO} SANS={SANS} GREEN={GREEN}
                />
              )}
            </Section>

            <Section title="Recent 50 Generations, Detail">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['User', 'Prompt Used', 'Assets Selected', 'Cost INR', 'Cost USD', 'Date'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {s.recentGenerations.map((g: any) => {
                      const costUsd = Number(g.costUsd ?? 0); const costInr = costUsd * usdToInr
                      return (
                        <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {g.user
                              ? <span title={g.user.email ?? ''}>{g.user.name || g.user.email || '—'}</span>
                              : <span style={{ color: '#E67E22', fontFamily: MONO, fontSize: 10 }}>no auth</span>}
                          </td>
                          <td style={{ padding: '8px 14px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, maxWidth: 260, minWidth: 180, whiteSpace: 'normal', lineHeight: 1.45 }} title={getGenerationPrompt(g)}>
                            {shortPrompt(getGenerationPrompt(g), 180)}
                          </td>
                          <td style={{ padding: '8px 14px', fontSize: 10, fontFamily: MONO }}>
                            {(() => {
                              try {
                                // For logo/brand-image gens, use enrichedData.genType
                                const genType = (g.enrichedData as any)?.genType as string | undefined
                                if (genType) {
                                  const label = genType === 'logo' ? 'Logo' : genType === 'brand-images' ? 'Brand Images' : genType
                                  return <span style={{ display: 'inline-block', padding: '2px 7px', background: `${GOLD}18`, border: `1px solid ${GOLD}40`, color: GOLD, borderRadius: 2, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
                                }
                                const types: string[] = Array.isArray(g.inputData?.outputTypes)
                                  ? g.inputData.outputTypes
                                  : typeof g.inputData?.outputTypes === 'string'
                                    ? JSON.parse(g.inputData.outputTypes)
                                    : []
                                return types.filter(t => t !== 'presentation').map(t => (
                                  <span key={t} style={{ display: 'inline-block', padding: '2px 7px', background: `${GOLD}18`, border: `1px solid ${GOLD}40`, color: GOLD, borderRadius: 2, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: 4, marginBottom: 2 }}>{t}</span>
                                ))
                              } catch { return <span style={{ color: 'var(--muted)' }}>—</span> }
                            })()}
                          </td>
                          <td style={{ padding: '8px 14px', fontSize: 11, fontFamily: MONO, color: costInr > 0 ? GOLD : 'var(--muted)' }}>{costInr > 0 ? fmtInr(costInr) : '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 11, fontFamily: MONO, color: costUsd > 0 ? '#E67E22' : 'var(--muted)' }}>{costUsd > 0 ? fmtUsd(costUsd) : '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{fmtDate(g.createdAt)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}

        {/* ── COSTS ── */}
        {tab === 'costs' && s && (
          <>
            <Section title="Overall API Spend (Claude + ChatGPT/OpenAI)">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <Stat label="Overall All Time" value={fmtInr(s.overallSpend?.allTime?.costInr ?? (c.allTime.costInr + (oi?.allTime?.costInr ?? 0)))} sub={fmtUsd(s.overallSpend?.allTime?.costUsd ?? (c.allTime.costUsd + (oi?.allTime?.costUsd ?? 0))) + ' USD'} color={GOLD} />
                <Stat label="Overall Today" value={fmtInr(s.overallSpend?.today?.costInr ?? (c.today.costInr + (oi?.today?.costInr ?? 0)))} sub={fmtUsd(s.overallSpend?.today?.costUsd ?? (c.today.costUsd + (oi?.today?.costUsd ?? 0))) + ' USD'} />
                <Stat label="Overall This Month" value={fmtInr(s.overallSpend?.thisMonth?.costInr ?? (c.thisMonth.costInr + (oi?.thisMonth?.costInr ?? 0)))} sub={fmtUsd(s.overallSpend?.thisMonth?.costUsd ?? (c.thisMonth.costUsd + (oi?.thisMonth?.costUsd ?? 0))) + ' USD'} />
                <Stat label="Overall API Calls" value={fmtNum(s.overallSpend?.allTime?.calls ?? (c.allTime.calls + (oi?.allTime?.calls ?? 0)))} sub="Claude + ChatGPT/OpenAI + other logged APIs" />
              </div>
            </Section>
            <Section title="Claude API Spend">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <Stat label="All Time (INR)" value={fmtInr(c.allTime.costInr)} sub={fmtUsd(c.allTime.costUsd) + ' USD'} color={GOLD} />
                <Stat label="Today (INR)" value={fmtInr(c.today.costInr)} sub={fmtUsd(c.today.costUsd) + ' USD'} />
                <Stat label="This Month (INR)" value={fmtInr(c.thisMonth.costInr)} sub={fmtUsd(c.thisMonth.costUsd) + ' USD'} />
                <Stat label="This Year (INR)" value={fmtInr(c.thisYear.costInr)} sub={fmtUsd(c.thisYear.costUsd) + ' USD'} />
              </div>
            </Section>
            <Section title="Average Per Generation">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <Stat label="Avg Cost / Gen (INR)" value={fmtInr(c.allTime.avgCostInr)} sub={fmtUsd(c.allTime.avgCostUsd) + ' USD avg'} color={GOLD} />
                <Stat label="Avg Tokens / Gen" value={fmtNum(Math.round(c.allTime.avgTokens))} />
                <Stat label="Total Input Tokens" value={fmtNum(c.allTime.inputTokens)} />
                <Stat label="Total Output Tokens" value={fmtNum(c.allTime.outputTokens)} />
                <Stat label="Total Tokens" value={fmtNum(c.allTime.totalTokens)} />
                <Stat label="Total API Calls" value={fmtNum(c.allTime.calls)} />
              </div>
            </Section>
            <Section title="Period Breakdown">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {[{ label: 'Today', d: c.today }, { label: 'This Month', d: c.thisMonth }, { label: 'This Year', d: c.thisYear }, { label: 'All Time', d: c.allTime }].map(({ label, d }) => (
                  <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 16 }}>{label}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 8px' }}>
                      {[['API Calls', fmtNum(d.calls)], ['Tokens', fmtNum(d.totalTokens)], ['Cost USD', fmtUsd(d.costUsd)], ['Cost INR', fmtInr(d.costInr)]].map(([k, v]) => (
                        <div key={k}><div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: MONO, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div><div style={{ fontSize: 16, fontFamily: SERIF, color: k === 'Cost INR' ? GOLD : 'var(--text)' }}>{v}</div></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Cost Breakdown by Model">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Model', 'Calls', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost (USD)', 'Cost (INR)'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {c.modelBreakdown.map((m: any) => (
                      <tr key={m.model} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: GOLD }}>{m.model ?? '—'}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text)' }}>{fmtNum(m._count)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{fmtNum(m._sum?.inputTokens ?? 0)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{fmtNum(m._sum?.outputTokens ?? 0)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{fmtNum(m._sum?.totalTokens ?? 0)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: '#E67E22' }}>{fmtUsd(m._sum?.costUsd ?? 0)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: GOLD }}>{fmtInr((m._sum?.costUsd ?? 0) * usdToInr)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
            <Section title="OpenAI Image API Usage (gpt-image-1)">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 16 }}>
                <Stat label="Total Calls" value={fmtNum(p?.total ?? 0)} /><Stat label="Today" value={fmtNum(p?.today ?? 0)} /><Stat label="This Month" value={fmtNum(p?.thisMonth ?? 0)} />
                <Stat label="API Hits" value={fmtNum(p?.real ?? 0)} sub="chargeable" color="#E67E22" /><Stat label="Cache Hits" value={fmtNum(p?.cached ?? 0)} sub="no charge" color={GREEN} />
                <Stat label="Cache Rate" value={(p?.total ?? 0) > 0 ? `${fmt(((p?.cached ?? 0) / (p?.total ?? 1)) * 100, 1)}%` : '—'} color={GREEN} />
              </div>
            </Section>

            {/* ── PEXELS WEBSITE IMAGES ───────────────────────────────────── */}
            {s.pexelsWebsite && (
              <Section title="Pexels Images — Website Generation">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 16 }}>
                  <Stat label="All-Time Fetches" value={fmtNum(s.pexelsWebsite.allTime)} sub="website photo injections" color={BLUE} />
                  <Stat label="Today" value={fmtNum(s.pexelsWebsite.today)} sub="website gens with photos" />
                  <Stat label="This Month" value={fmtNum(s.pexelsWebsite.thisMonth)} sub="website gens with photos" />
                  <Stat label="Cost" value="₹0" sub="Pexels free tier — no charge" color={GREEN} />
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>
                  Each count = one website generation where Pexels photos were successfully injected. Images are fetched post-stream, zero token cost.
                </div>
              </Section>
            )}

            {/* ── OPENAI IMAGE GENERATION ──────────────────────────────── */}
            {oi && (
              <Section title="OpenAI Image Generation (gpt-image-1) — Detailed Breakdown">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 16, marginBottom: 20 }}>
                  <Stat label="All-Time Images" value={fmtNum(oi.allTime.calls)} sub="@$0.04/image" color={GOLD} />
                  <Stat label="All-Time Cost (INR)" value={fmtInr(oi.allTime.costInr)} sub={fmtUsd(oi.allTime.costUsd) + ' USD'} color={GOLD} />
                  <Stat label="Today Images" value={fmtNum(oi.today.calls)} sub={fmtInr(oi.today.costInr)} />
                  <Stat label="This Month Images" value={fmtNum(oi.thisMonth.calls)} sub={fmtInr(oi.thisMonth.costInr)} />
                  <Stat label="Avg Cost / Image" value={oi.allTime.calls > 0 ? fmtInr(oi.allTime.costInr / oi.allTime.calls) : '—'} sub="INR per image" />
                </div>
                {oi.endpointBreakdown?.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Endpoint', 'Images Generated', 'Cost (USD)', 'Cost (INR)'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {oi.endpointBreakdown.map((ep: any) => (
                          <tr key={ep.endpoint} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: 'var(--text)' }}>{ep.endpoint ?? 'unknown'}</td>
                            <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: 'var(--muted)' }}>{fmtNum(ep._count)}</td>
                            <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: '#E67E22' }}>{fmtUsd(ep._sum?.costUsd ?? 0)}</td>
                            <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: GOLD }}>{fmtInr(ep._sum?.costInr ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            )}

            {/* ── BUSINESS MODE COSTS ───────────────────────────────────── */}
            {s.costSegments && (
              <>
                <Section title="Business Mode Costs">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                    <Stat label="Business All Time" value={fmtInr(s.costSegments.business.allTime.costInr)} sub={fmtUsd(s.costSegments.business.allTime.costUsd) + ' · ' + fmtNum(s.costSegments.business.allTime.calls) + ' calls'} color={GOLD} />
                    <Stat label="Business Today" value={fmtInr(s.costSegments.business.today.costInr)} sub={fmtUsd(s.costSegments.business.today.costUsd) + ' USD'} />
                    <Stat label="Business This Month" value={fmtInr(s.costSegments.business.thisMonth.costInr)} sub={fmtUsd(s.costSegments.business.thisMonth.costUsd) + ' USD'} />
                  </div>
                </Section>

                <Section title="Guest User Costs (No Account)">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                    <Stat label="Guest All Time" value={fmtInr(s.costSegments.guest.allTime.costInr)} sub={fmtUsd(s.costSegments.guest.allTime.costUsd) + ' · ' + fmtNum(s.costSegments.guest.allTime.calls) + ' calls'} color="#E67E22" />
                    <Stat label="Guest Today" value={fmtInr(s.costSegments.guest.today.costInr)} sub={fmtUsd(s.costSegments.guest.today.costUsd) + ' USD'} />
                    <Stat label="Guest This Month" value={fmtInr(s.costSegments.guest.thisMonth.costInr)} sub={fmtUsd(s.costSegments.guest.thisMonth.costUsd) + ' USD'} />
                    <Stat label="Guest Business Mode" value={fmtInr(s.costSegments.guestBusiness.allTime.costInr)} sub={'All-time · ' + fmtUsd(s.costSegments.guestBusiness.allTime.costUsd)} color="#E67E22" />
                    <Stat label="Guest Personal Mode" value={fmtInr((s.costSegments.guest.allTime.costInr) - (s.costSegments.guestBusiness.allTime.costInr))} sub="All-time guest personal" />
                  </div>
                </Section>

                <Section title="Cost by Generation Mode (All Time)">
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Mode', 'Calls', 'Cost (USD)', 'Cost (INR)', '% of Total'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {[
                          { mode: 'Personal (Auth)', calls: s.costSegments.personalAuth.allTime.calls, costUsd: s.costSegments.personalAuth.allTime.costUsd, costInr: s.costSegments.personalAuth.allTime.costInr },
                          { mode: 'Business (Auth)', calls: s.costSegments.business.allTime.calls - s.costSegments.guestBusiness.allTime.calls, costUsd: (s.costSegments.business.allTime.costUsd - s.costSegments.guestBusiness.allTime.costUsd), costInr: (s.costSegments.business.allTime.costInr - s.costSegments.guestBusiness.allTime.costInr) },
                          { mode: 'Guest (Personal)', calls: s.costSegments.guest.allTime.calls - s.costSegments.guestBusiness.allTime.calls, costUsd: s.costSegments.guest.allTime.costUsd - s.costSegments.guestBusiness.allTime.costUsd, costInr: s.costSegments.guest.allTime.costInr - s.costSegments.guestBusiness.allTime.costInr },
                          { mode: 'Guest (Business)', calls: s.costSegments.guestBusiness.allTime.calls, costUsd: s.costSegments.guestBusiness.allTime.costUsd, costInr: s.costSegments.guestBusiness.allTime.costInr },
                        ].map(row => {
                          const totalCostUsd = s.costSegments.personalAuth.allTime.costUsd + s.costSegments.business.allTime.costUsd + s.costSegments.guest.allTime.costUsd
                          const pct = totalCostUsd > 0 ? ((row.costUsd / totalCostUsd) * 100).toFixed(1) + '%' : '—'
                          const isGuest = row.mode.startsWith('Guest')
                          const isBiz = row.mode.includes('Business')
                          return (
                            <tr key={row.mode} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: isGuest ? '#E67E22' : isBiz ? GOLD : 'var(--text)' }}>{row.mode}</td>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text)' }}>{fmtNum(Math.max(0, row.calls))}</td>
                              <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: '#E67E22' }}>{fmtUsd(Math.max(0, row.costUsd))}</td>
                              <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: GOLD }}>{fmtInr(Math.max(0, row.costInr))}</td>
                              <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: 'var(--muted)' }}>{pct}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Section>

                <Section title="Cost by Endpoint">
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Endpoint', 'Calls', 'Cost (USD)', 'Cost (INR)', 'Total Tokens'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {(s.costSegments.endpointBreakdown || []).map((ep: any) => (
                          <tr key={ep.endpoint ?? 'unknown'} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: (ep.endpoint ?? '').includes('business') ? GOLD : 'var(--text)' }}>{ep.endpoint ?? '(untagged)'}</td>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text)' }}>{fmtNum(ep._count)}</td>
                            <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: '#E67E22' }}>{fmtUsd(ep._sum?.costUsd ?? 0)}</td>
                            <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: GOLD }}>{fmtInr((ep._sum?.costInr ?? 0))}</td>
                            <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: 'var(--muted)' }}>{fmtNum(ep._sum?.totalTokens ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              </>
            )}
            {/* ── Per-User API Cost Breakdown ── */}
            {s.userCosts && s.userCosts.length > 0 && (
              <Section title="API Cost per User (All Time)">
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>Top {Math.min(s.userCosts.length, 50)} users by API cost</span>
                  <button onClick={() => generatePdfReport('costs')} disabled={pdfReportLoading}
                    style={{ marginLeft: 'auto', padding: '6px 14px', background: 'transparent', border: `1px solid ${GOLD}60`, color: GOLD, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 6, fontFamily: MONO }}>
                    ↓ Export PDF
                  </button>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['User', 'Plan', 'Region', 'API Calls', 'Tokens Used', 'Cost (INR)', 'Cost (USD)'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {s.userCosts.map((u: any, i: number) => (
                        <tr key={u.userId} style={{ borderBottom: '1px solid var(--border)', opacity: i >= 10 ? 0.85 : 1 }}>
                          <td style={{ padding: '9px 14px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 12, color: 'var(--text)' }}>{u.name || u.email}</div>
                            {u.name && <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: MONO }}>{u.email}</div>}
                          </td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{ fontSize: 9, padding: '2px 7px', background: u.plan !== 'FREE' ? `${GOLD}18` : 'var(--surface)', border: `1px solid ${u.plan !== 'FREE' ? GOLD + '40' : 'var(--border)'}`, color: u.plan !== 'FREE' ? GOLD : 'var(--muted)', borderRadius: 2, fontFamily: MONO, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              {u.plan}
                            </span>
                          </td>
                          <td style={{ padding: '9px 14px', fontSize: 11, fontFamily: MONO, color: u.region && u.region !== 'Unknown' ? BLUE : 'var(--muted)' }}>
                            {u.region || '—'}
                          </td>
                          <td style={{ padding: '9px 14px', fontSize: 12, color: 'var(--text)', fontFamily: MONO }}>{fmtNum(u.calls)}</td>
                          <td style={{ padding: '9px 14px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{fmtNum(u.totalTokens ?? 0)}</td>
                          <td style={{ padding: '9px 14px', fontSize: 12, fontFamily: MONO, color: GOLD, fontWeight: 500 }}>{fmtInr(u.costInr ?? 0)}</td>
                          <td style={{ padding: '9px 14px', fontSize: 11, fontFamily: MONO, color: '#E67E22' }}>{fmtUsd(u.costUsd ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}
          </>
        )}
        {tab === 'users' && (
          <Section title="User Management">
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input placeholder="Search by email or name…" value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1) }} style={{ flex: 1, minWidth: 200, padding: '9px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, borderRadius: 2, fontFamily: SANS }} />
              {users && <div style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center', fontFamily: MONO }}>{users.total} users total</div>}
              <button onClick={() => generatePdfReport('users')} disabled={pdfReportLoading}
                style={{ padding: '8px 14px', background: 'transparent', border: `1px solid ${GOLD}60`, color: GOLD, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 6, fontFamily: MONO }}>
                ↓ PDF Report
              </button>
            </div>
            {users ? (
              <>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Name', 'Phone', 'Email', 'Plan', 'Region', 'Total Gens', 'Monthly Usage', 'Sites / Template', 'Status', 'Joined', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {users.users.map((u: any) => (
                        <React.Fragment key={u.id}>
                          <tr style={{ borderBottom: expandedUserId === u.id ? 'none' : '1px solid var(--border)', opacity: u.isSuspended ? 0.55 : 1 }}>
                            <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>—</span>}</td>
                            <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>
                              {u.phone ? (
                                <a href={`https://wa.me/${u.phone}`} target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', fontFamily: MONO, fontSize: 11 }}>+{u.phone}</a>
                              ) : <span style={{ color: 'var(--muted)', opacity: 0.4 }}>—</span>}
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <select value={u.plan} onChange={e => userAction('set_plan', u.id, { plan: e.target.value })} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: u.plan !== 'FREE' ? GOLD : 'var(--muted)', fontSize: 11, fontFamily: MONO, borderRadius: 1, padding: '3px 6px', cursor: 'pointer' }}>
                                {['FREE', 'PRO', 'TEAM'].map(pl => <option key={pl} value={pl}>{pl}</option>)}
                              </select>
                            </td>
                            {/* ── Region column ── */}
                            <td style={{ padding: '8px 12px', fontSize: 10, fontFamily: MONO, color: u.location ? BLUE : 'var(--muted)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.location ? String(u.location).split(',')[0].trim() : <span style={{ opacity: 0.4 }}>—</span>}
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{u._count?.generations ?? 0}</td>
                            <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{u.usageCount ?? 0}</td>
                            <td style={{ padding: '8px 12px' }}>
                              {/* Websites count + template badge */}
                              <span style={{ fontSize: 11, color: '#4CA8C9', fontFamily: MONO, marginRight: 4 }}>{u._count?.userWebsites ?? 0} sites</span>
                              {u.lastTemplate && (
                                <span style={{ fontSize: 8, background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30`, borderRadius: 2, padding: '1px 5px', fontFamily: MONO, letterSpacing: '0.08em' }}>
                                  {String(u.lastTemplate).replace(/-/g,' ').toUpperCase()}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px' }}>{u.isSuspended ? <Badge label="Suspended" color={RED} /> : <Badge label="Active" color={GREEN} />}</td>
                            <td style={{ padding: '8px 12px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
                                <button onClick={async () => {
                                  if (expandedUserId === u.id) { setExpandedUserId(null); return }
                                  setExpandedUserId(u.id)
                                  if (!userHistory[u.id]) {
                                    setUserHistoryLoading(u.id)
                                    try {
                                      const r = await fetch(`/api/admin/users?userId=${u.id}&history=1`)
                                      if (r.ok) { const d = await r.json(); setUserHistory(h => ({ ...h, [u.id]: d.history || [] })) }
                                    } finally { setUserHistoryLoading(null) }
                                  }
                                }} style={{ padding: '3px 8px', background: expandedUserId === u.id ? `${GOLD}20` : 'transparent', border: `1px solid ${GOLD}`, color: GOLD, fontSize: 9, cursor: 'pointer', borderRadius: 6, fontFamily: MONO }}>
                                  {expandedUserId === u.id ? '▲ History' : '▼ History'}
                                </button>
                                <button onClick={() => { setEditUser(u); setEditLimits({ daily: String(u.dailyGenLimit ?? ''), monthly: String(u.monthlyGenLimit ?? ''), yearly: String(u.yearlyGenLimit ?? '') }) }} style={{ padding: '3px 8px', background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, fontSize: 9, cursor: 'pointer', borderRadius: 6, fontFamily: MONO }}>Limits</button>
                                <button onClick={() => userAction('reset_usage', u.id)} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 9, cursor: 'pointer', borderRadius: 6, fontFamily: MONO }}>Reset</button>
                                <button onClick={() => { setNotifForm(f => ({ ...f, targetUserId: u.id })); setTab('notifications') }} style={{ padding: '3px 8px', background: 'transparent', border: `1px solid ${BLUE}`, color: BLUE, fontSize: 9, cursor: 'pointer', borderRadius: 6, fontFamily: MONO }}>Notify</button>
                                {u.isSuspended ? <button onClick={() => userAction('unsuspend', u.id)} style={{ padding: '3px 8px', background: 'transparent', border: `1px solid ${GREEN}`, color: GREEN, fontSize: 9, cursor: 'pointer', borderRadius: 6, fontFamily: MONO }}>Unsuspend</button> : <button onClick={() => { const r = prompt('Reason for suspension:'); if (r !== null) userAction('suspend', u.id, { reason: r }) }} style={{ padding: '3px 8px', background: 'transparent', border: `1px solid ${RED}`, color: RED, fontSize: 9, cursor: 'pointer', borderRadius: 6, fontFamily: MONO }}>Suspend</button>}
                                {u.phone !== ADMIN_PHONE_ID && <button onClick={() => { if (confirm(`Delete ${u.email}?`)) userAction('delete', u.id) }} style={{ padding: '3px 8px', background: `${RED}22`, border: `1px solid ${RED}`, color: RED, fontSize: 9, cursor: 'pointer', borderRadius: 6, fontFamily: MONO }}>Del</button>}
                              </div>
                            </td>
                          </tr>
                          {/* ── Work History Drawer ── */}
                          {expandedUserId === u.id && (
                            <tr>
                              <td colSpan={11} className="admin-user-history" style={{ padding: '12px 16px 16px' }}>
                                <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 10 }}>
                                  ▼ Work History — {u.name || u.email}
                                </div>
                                {userHistoryLoading === u.id ? (
                                  <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: MONO }}>Loading…</div>
                                ) : (userHistory[u.id] || []).length === 0 ? (
                                  <div style={{ color: 'var(--muted)', fontSize: 11, fontFamily: MONO }}>No generations yet.</div>
                                ) : (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
                                    {(userHistory[u.id] || []).map((gen: any) => {
                                      const histImgItems = gen.outputData ? allImageItems({ outputData: gen.outputData }) : []
                                      const typeColor = gen.type === 'website' ? '#4CA8C9' : gen.type === 'logo' ? '#C9A84C' : gen.type === 'brand-images' ? '#A84CC9' : gen.type === 'strategy' ? '#4CC98C' : gen.type === 'calendar' ? '#C94C4C' : GOLD
                                      const typeLabel = gen.type === 'brand-images' ? 'Brand Images' : gen.type === 'strategy' ? 'Strategy' : gen.type === 'calendar' ? 'Calendar' : gen.type === 'logo' ? 'Logo' : gen.type === 'website' ? 'Website' : gen.type || 'gen'
                                      return (
                                        <div key={gen.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', overflow: 'hidden' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: 9, color: typeColor, fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase', background: `${typeColor}15`, border: `1px solid ${typeColor}30`, padding: '1px 6px', borderRadius: 2 }}>
                                              {typeLabel}
                                            </span>
                                            <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: MONO }}>{fmtDate(gen.createdAt)}</span>
                                          </div>
                                          {gen.templateId && (
                                            <div style={{ fontSize: 10, color: GOLD, fontFamily: MONO, marginBottom: 2 }}>Template: {gen.templateId}</div>
                                          )}
                                          {gen.businessName && (
                                            <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, marginBottom: 2 }}>{gen.businessName}</div>
                                          )}
                                          {gen.mode && (
                                            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO }}>Mode: {gen.mode}</div>
                                          )}
                                          <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: MONO, marginTop: 4, marginBottom: histImgItems.length > 0 ? 8 : 0 }}>
                                            {gen.status === 'COMPLETE' || gen.status === 'published' || gen.status === 'draft' ? <span style={{ color: GREEN }}>✓ {gen.status === 'published' ? 'Published' : gen.status === 'draft' ? 'Draft' : 'Success'}</span> : gen.status === 'FAILED' ? <span style={{ color: RED }}>✗ Failed</span> : <span style={{ color: RED }}>✗ {gen.status}</span>}
                                          </div>
                                          {/* Image thumbnails with download */}
                                          {histImgItems.length > 0 && (
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                                              {histImgItems.slice(0, 4).map((item: any) => (
                                                <div key={item.index} style={{ position: 'relative', width: 56, height: 56, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.025)', flexShrink: 0 }}>
                                                  <img src={item.url} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                  <button
                                                    onClick={() => handleDownload(item.url, safeFilename(`${u.name || 'user'}_${typeLabel}_${item.index + 1}`, extFromUrl(item.url)), `hist:${gen.id}:${item.index}`)}
                                                    disabled={!!downloadingKey}
                                                    style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', opacity: 0, transition: 'opacity 0.15s', cursor: 'pointer', border: 'none', color: '#fff', fontSize: 14 }}
                                                    title={`Download ${item.label}`}
                                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                                                  >
                                                    {downloadingKey === `hist:${gen.id}:${item.index}` ? '…' : '↓'}
                                                  </button>
                                                </div>
                                              ))}
                                              {histImgItems.length > 4 && (
                                                <div style={{ width: 56, height: 56, borderRadius: 4, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, flexShrink: 0 }}>
                                                  +{histImgItems.length - 4}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          {histImgItems.length > 0 && (
                                            <button
                                              onClick={() => handleDownloadAll(
                                                histImgItems.map((item: any) => ({ url: item.url, filename: safeFilename(`${u.name || 'user'}_${typeLabel}_${item.index + 1}`, extFromUrl(item.url)) })),
                                                `hist-all:${gen.id}`
                                              )}
                                              disabled={!!downloadingKey}
                                              style={{ padding: '4px 10px', background: 'transparent', border: `1px solid ${BLUE}55`, color: BLUE, borderRadius: 4, fontFamily: MONO, fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: downloadingKey ? 'default' : 'pointer', opacity: downloadingKey ? 0.5 : 1, width: '100%', marginTop: 2 }}
                                            >
                                              {downloadingKey === `hist-all:${gen.id}` ? 'Saving…' : `↓ Download All (${histImgItems.length})`}
                                            </button>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
                  <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: userPage === 1 ? 'var(--muted)' : 'var(--text)', fontSize: 11, cursor: userPage === 1 ? 'default' : 'pointer', borderRadius: 1, fontFamily: MONO, opacity: userPage === 1 ? 0.4 : 1 }}>← Prev</button>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>Page {userPage} of {users.pages}</span>
                  <button onClick={() => setUserPage(p => Math.min(users.pages, p + 1))} disabled={userPage >= users.pages} style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: userPage >= users.pages ? 'var(--muted)' : 'var(--text)', fontSize: 11, cursor: userPage >= users.pages ? 'default' : 'pointer', borderRadius: 1, fontFamily: MONO, opacity: userPage >= users.pages ? 0.4 : 1 }}>Next →</button>
                </div>
              </>
            ) : <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: MONO }}>Loading users…</div>}
          </Section>
        )}

        {/* ── ADMIN ACCESS ── */}
        {tab === 'admins' && (
          <Section title="Admin Access Control">
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) auto', gap: 12, marginBottom: 18, alignItems: 'center' }}>
              <input value={adminUserSearch} onChange={e => setAdminUserSearch(e.target.value)} placeholder="Search user by name, email, or phone…" style={inputStyle} />
              <button onClick={loadAdminUsers} style={{ padding: '10px 18px', borderRadius: 10, border: `1px solid ${GOLD}80`, background: 'linear-gradient(135deg,#F4D57D,#C9A84C 55%,#9B7626)', color: '#090909', fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 12px 32px rgba(201,168,76,0.18)' }}>Search</button>
            </div>
            <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 11, marginBottom: 14 }}>Make trusted users admin or remove admin access. The primary admin phone cannot be demoted.</div>
            {adminUsersLoading ? <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13 }}>Loading users…</div> : (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['User', 'Phone', 'Role', 'Plan', 'Joined', 'Action'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {adminUsers.map((u: any) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 14px' }}><div style={{ color: 'var(--text)', fontSize: 12 }}>{u.name || u.email || 'Unnamed user'}</div><div style={{ color: 'var(--muted)', fontSize: 10, fontFamily: MONO }}>{u.email || '—'}</div></td>
                        <td style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 11, fontFamily: MONO }}>{u.phone ? `+${u.phone}` : '—'}</td>
                        <td style={{ padding: '10px 14px' }}><Badge label={u.role || 'USER'} color={u.role === 'ADMIN' ? GOLD : BLUE} /></td>
                        <td style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 11, fontFamily: MONO }}>{u.plan}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 10, fontFamily: MONO }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {u.role === 'ADMIN' ? (
                            <button onClick={() => userAction('set_role', u.id, { role: 'USER' })} disabled={u.phone === ADMIN_PHONE_ID} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${u.phone === ADMIN_PHONE_ID ? 'var(--border)' : RED}`, background: 'transparent', color: u.phone === ADMIN_PHONE_ID ? 'var(--muted)' : RED, fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: u.phone === ADMIN_PHONE_ID ? 'not-allowed' : 'pointer' }}>Remove Admin</button>
                          ) : (
                            <button onClick={() => userAction('set_role', u.id, { role: 'ADMIN' })} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${GOLD}80`, background: 'linear-gradient(135deg,#F4D57D,#C9A84C 55%,#9B7626)', color: '#090909', fontFamily: MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Make Admin</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        )}

        {/* ── ARTICLE PUBLISHER ── */}
        {tab === 'articles' && (
          <>
            <Section title="Website Article Publisher">
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Title</label>
                  <input value={articleForm.title} onChange={e => setArticleForm(f => ({ ...f, title: e.target.value }))} placeholder="Article title" style={{ ...inputStyle, marginBottom: 12 }} />
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Excerpt</label>
                  <textarea value={articleForm.excerpt} onChange={e => setArticleForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Short SEO summary" rows={3} style={{ ...inputStyle, resize: 'vertical', marginBottom: 12 }} />
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Cover image</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
                    <input value={articleForm.coverImageUrl} onChange={e => setArticleForm(f => ({ ...f, coverImageUrl: e.target.value }))} placeholder="https://… or upload directly" style={inputStyle} />
                    <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', border: `1px solid ${GOLD}70`, color: GOLD, borderRadius: 8, fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', cursor: articleImageUploading ? 'default' : 'pointer', opacity: articleImageUploading ? 0.6 : 1 }}>
                      {articleImageUploading ? 'Uploading…' : 'Upload'}
                      <input type="file" accept="image/*" hidden onChange={e => handleArticleImageUpload(e.target.files?.[0])} />
                    </label>
                  </div>
                  {articleForm.coverImageUrl && <div style={{ marginBottom: 12, height: 84, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}><img src={articleForm.coverImageUrl} alt="Article cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /></div>}
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Tags</label>
                  <input value={articleForm.tags} onChange={e => setArticleForm(f => ({ ...f, tags: e.target.value }))} placeholder="marketing, websites, ai" style={{ ...inputStyle, marginBottom: 12 }} />
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)', fontFamily: MONO, fontSize: 11, marginBottom: 14 }}><input type="checkbox" checked={articleForm.published} onChange={e => setArticleForm(f => ({ ...f, published: e.target.checked }))} /> Publish immediately</label>
                  <button onClick={saveArticle} disabled={articleSaving} style={{ width: '100%', padding: '11px 18px', borderRadius: 10, border: `1px solid ${GOLD}80`, background: 'linear-gradient(135deg,#F4D57D,#C9A84C 55%,#9B7626)', color: '#090909', fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: articleSaving ? 'default' : 'pointer', opacity: articleSaving ? 0.65 : 1, boxShadow: '0 12px 32px rgba(201,168,76,0.18)' }}>{articleSaving ? 'Saving…' : 'Publish Article'}</button>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Article body</label>
                  <textarea value={articleForm.content} onChange={e => setArticleForm(f => ({ ...f, content: e.target.value }))} placeholder="Write article content here…" rows={17} style={{ ...inputStyle, resize: 'vertical', fontFamily: SANS, lineHeight: 1.6 }} />
                </div>
              </div>
            </Section>
            <Section title={`Published Articles (${articles.length})`}>
              {articles.length === 0 ? <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13 }}>No articles published yet.</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  {articles.map((a: any) => (
                    <div key={a.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                      <div style={{ fontFamily: SERIF, color: 'var(--text)', fontSize: 17, marginBottom: 5 }}>{a.title}</div>
                      <div style={{ fontFamily: MONO, color: GOLD, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{a.published ? 'Published' : 'Draft'} · {a.readingMinutes || 1} min</div>
                      <div style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.5 }}>{a.excerpt || 'No excerpt'}</div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}

        {/* ── PAYMENT SETUP ── */}
        {tab === 'payments' && (
          <Section title="Razorpay Payment Setup">
            <div style={{ maxWidth: 720, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24 }}>
              <div style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.7, marginBottom: 18 }}>Enter your Razorpay Key ID and Secret. If payment creation fails or keys are missing, users will see “Payments are currently not available. Please contact support.”</div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Razorpay Key ID</label>
              <input value={paymentForm.razorpayKeyId} onChange={e => setPaymentForm(f => ({ ...f, razorpayKeyId: e.target.value }))} placeholder="rzp_live_…" style={{ ...inputStyle, marginBottom: 12 }} />
              <label style={{ display: 'block', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Razorpay Key Secret {paymentForm.masked ? `(saved: ${paymentForm.masked})` : ''}</label>
              <input value={paymentForm.razorpayKeySecret} onChange={e => setPaymentForm(f => ({ ...f, razorpayKeySecret: e.target.value }))} placeholder="Enter secret again to update" type="password" style={{ ...inputStyle, marginBottom: 12 }} />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)', fontFamily: MONO, fontSize: 11, marginBottom: 16 }}><input type="checkbox" checked={paymentForm.razorpayEnabled} onChange={e => setPaymentForm(f => ({ ...f, razorpayEnabled: e.target.checked }))} /> Enable Razorpay payments</label>
              <button onClick={savePaymentSettings} disabled={paymentSaving} style={{ padding: '11px 20px', borderRadius: 10, border: `1px solid ${GOLD}80`, background: 'linear-gradient(135deg,#F4D57D,#C9A84C 55%,#9B7626)', color: '#090909', fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: paymentSaving ? 'default' : 'pointer', opacity: paymentSaving ? 0.65 : 1, boxShadow: '0 12px 32px rgba(201,168,76,0.18)' }}>{paymentSaving ? 'Saving…' : 'Save Payment Keys'}</button>
            </div>
          </Section>
        )}

        {/* ── LOGS ── */}
        {tab === 'logs' && (
          <Section title="API Call Logs">
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <select value={logService} onChange={e => { setLogService(e.target.value); setLogPage(1) }} style={{ padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, borderRadius: 2, fontFamily: MONO }}>
                <option value="">All Services</option><option value="claude">Claude Only</option><option value="openai">OpenAI Only</option>
              </select>
              <select value={logEndpoint} onChange={e => { setLogEndpoint(e.target.value); setLogPage(1) }} style={{ padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, borderRadius: 2, fontFamily: MONO }}>
                <option value="">All Endpoints</option>
                <option value="generate-website-template-json">Website Template AI (cheap)</option>
                <option value="generate-website-stream">Website Gen (Full Code)</option>
                <option value="generate-graphics">Brand Images (gpt-image-1)</option>
                <option value="generate-logo-image">Logo Image (gpt-image-1)</option>
                <option value="generate-strategy">Strategy</option>
                <option value="generate-calendar">Content Calendar</option>
                <option value="generate-business">Business Pack</option>
                <option value="website-ai-edit">AI Website Edit</option>
              </select>
              {logs && <div style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center', fontFamily: MONO }}>{fmtNum(logs.total)} total entries</div>}
            </div>
            {logs ? (
              <>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Service', 'Endpoint', 'User', 'Model / Query', 'In Tokens', 'Out Tokens', 'Cost (INR)', 'Status', 'Time'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {logs.logs.map((l: any) => (
                        <React.Fragment key={l.id}>
                          <tr style={{ borderBottom: expandedLogId === l.id ? 'none' : '1px solid var(--border)', cursor: 'pointer' }}
                              onClick={() => setExpandedLogId(expandedLogId === l.id ? null : l.id)}>
                            <td style={{ padding: '7px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ fontSize: 9, color: expandedLogId === l.id ? GOLD : 'var(--muted)', fontFamily: MONO }}>{expandedLogId === l.id ? '▼' : '▶'}</span>
                                <Badge label={l.service === 'openai' ? 'chatgpt' : l.service} color={l.service === 'claude' ? GOLD : l.service === 'openai' ? '#10a37f' : BLUE} />
                              </div>
                            </td>
                            <td style={{ padding: '7px 12px', fontSize: 9, color: 'var(--muted)', fontFamily: MONO, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {l.endpoint === 'generate-logo-image'
                                ? <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <span style={{ color: '#C9A84C', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                                      LOGO · ChatGPT Image
                                    </span>
                                    <span style={{ color: 'var(--muted)' }}>{l.endpoint}</span>
                                  </span>
                                : l.endpoint === 'generate-graphics'
                                  ? <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      <span style={{ color: '#A84CC9', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase' }}>BRAND IMAGE · GPT-IMAGE-1</span>
                                      <span style={{ color: 'var(--muted)' }}>{l.endpoint}</span>
                                    </span>
                                  : l.endpoint ?? '—'}
                            </td>
                            <td style={{ padding: '7px 12px', fontSize: 11, color: 'var(--muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {l.user
                                ? <span title={[l.user.name, l.user.email, l.user.phone].filter(Boolean).join(' · ')}>{l.user.name || l.user.email || l.user.phone || '—'}</span>
                                : <span style={{ color: '#E67E22', fontFamily: MONO, fontSize: 10 }}>no auth</span>}
                            </td>
                            <td style={{ padding: '7px 12px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.model ?? l.query ?? '—'}</td>
                            <td style={{ padding: '7px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{l.inputTokens != null ? fmtNum(l.inputTokens) : '—'}</td>
                            <td style={{ padding: '7px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{l.outputTokens != null ? fmtNum(l.outputTokens) : '—'}</td>
                            <td style={{ padding: '7px 12px', fontSize: 11, fontFamily: MONO, color: (l.costInr ?? 0) > 0 ? GOLD : 'var(--muted)' }}>{l.costInr != null ? fmtInr(l.costInr) : '—'}</td>
                            <td style={{ padding: '7px 12px' }}>{l.cached ? <Badge label="cached" color={GREEN} /> : <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO }}>live</span>}</td>
                            <td style={{ padding: '7px 12px' }}>{l.success ? <Badge label="ok" color={GREEN} /> : <Badge label="fail" color={RED} />}</td>
                            <td style={{ padding: '7px 12px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{fmtDate(l.createdAt)}</td>
                          </tr>
                          {/* ── Expanded Prompt / Response detail ── */}
                          {expandedLogId === l.id && (
                            <tr>
                              <td colSpan={9} className="admin-log-detail" style={{ padding: '12px 16px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(201,168,76,0.02)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                  {/* Left: Metadata */}
                                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 8 }}>Call Details</div>
                                    {[
                                      ['Endpoint', l.endpoint],
                                      ['Model', l.model],
                                      ['User', l.user ? [l.user.name, l.user.email, l.user.phone ? `+${l.user.phone}` : null].filter(Boolean).join(' · ') : l.userId ? 'no user record' : 'not authenticated'],
                                      ['User ID', l.userId],
                                      ['Total Tokens', l.totalTokens != null ? fmtNum(l.totalTokens) : null],
                                      ['Cost USD', l.costUsd != null ? fmtUsd(l.costUsd) : null],
                                      ['Cost INR', l.costInr != null ? fmtInr(l.costInr) : null],
                                      ['Duration', l.durationMs != null ? fmtDuration(l.durationMs) : null],
                                      ['Cached', l.cached ? 'Yes' : 'No'],
                                      ['Success', l.success ? '✓ Yes' : '✗ No'],
                                      ['Log ID', l.id],
                                    ].filter(([,v]) => v != null).map(([k, v]) => (
                                      <div key={String(k)} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: MONO, minWidth: 80, letterSpacing: '0.06em' }}>{String(k)}</span>
                                        <span style={{ fontSize: 10, color: 'var(--text)', fontFamily: MONO, wordBreak: 'break-all' }}>{String(v)}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Right: Generation input/output if linked */}
                                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px' }}>
                                    <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 8 }}>User Prompt / AI Output</div>
                                    {l.generationId ? (
                                      logDetail[l.id] === undefined ? (
                                        <button onClick={async (e) => {
                                          e.stopPropagation()
                                          setLogDetail(d => ({ ...d, [l.id]: 'loading' }))
                                          try {
                                            const r = await fetch(`/api/admin/users?generationId=${l.generationId}`)
                                            if (r.ok) {
                                              const d = await r.json()
                                              const gen = d.generation
                                              const inp = gen?.inputData ? JSON.stringify(gen.inputData, null, 2) : null
                                              const out = gen?.outputData ? JSON.stringify(gen.outputData, null, 2) : null
                                              const combined = [inp && `── INPUT ──\n${inp}`, out && `── OUTPUT ──\n${out}`].filter(Boolean).join('\n\n')
                                              setLogDetail(d2 => ({ ...d2, [l.id]: combined || 'No prompt/output data stored.' }))
                                            } else {
                                              setLogDetail(d2 => ({ ...d2, [l.id]: 'Could not load generation data.' }))
                                            }
                                          } catch {
                                            setLogDetail(d2 => ({ ...d2, [l.id]: 'Network error loading generation.' }))
                                          }
                                        }} style={{ padding: '6px 14px', background: GOLD, color: '#000', border: 'none', fontSize: 9, fontFamily: MONO, fontWeight: 700, cursor: 'pointer', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                          Load Prompt & Output
                                        </button>
                                      ) : logDetail[l.id] === 'loading' ? (
                                        <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 11 }}>Loading…</div>
                                      ) : (
                                        <pre style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 220, overflowY: 'auto', margin: 0, lineHeight: 1.6 }}>
                                          {logDetail[l.id]}
                                        </pre>
                                      )
                                    ) : (
                                      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO }}>
                                        No generation linked to this call.
                                        {l.endpoint && <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 9 }}>Internal action: {String(l.endpoint).replace(/-/g, ' ')}</div>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
                  <button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1} style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: logPage === 1 ? 'var(--muted)' : 'var(--text)', fontSize: 11, cursor: logPage === 1 ? 'default' : 'pointer', borderRadius: 1, fontFamily: MONO, opacity: logPage === 1 ? 0.4 : 1 }}>← Prev</button>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>Page {logPage} of {logs.pages}</span>
                  <button onClick={() => setLogPage(p => Math.min(logs.pages, p + 1))} disabled={logPage >= logs.pages} style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: logPage >= logs.pages ? 'var(--muted)' : 'var(--text)', fontSize: 11, cursor: logPage >= logs.pages ? 'default' : 'pointer', borderRadius: 1, fontFamily: MONO, opacity: logPage >= logs.pages ? 0.4 : 1 }}>Next →</button>
                </div>
              </>
            ) : (logs as any)?._error
              ? <div style={{ color: RED, fontSize: 13, fontFamily: MONO }}>⚠ {(logs as any)._error}</div>
              : <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: MONO }}>Loading logs…</div>}
          </Section>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === 'notifications' && (
          <>
            {(() => {
              const supportMessages = notifications.filter((n: any) => n.type === 'support')
              return (
                <Section title={`Support Messages (${supportMessages.length})`}>
                  {notifLoading ? <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13 }}>Loading support messages…</div> : supportMessages.length === 0 ? (
                    <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13, padding: '18px 0' }}>No support/contact messages yet. Messages from Settings → Help and the public Contact page appear here and are also emailed to brandsyndicateindia@gmail.com.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {supportMessages.map((n: any) => (
                        <div key={`support-${n.id}`} style={{ background: 'var(--surface)', border: `1px solid ${GOLD}30`, borderLeft: `3px solid ${GOLD}`, borderRadius: 10, padding: '16px 20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                            <div style={{ fontFamily: SERIF, fontSize: 15, color: 'var(--text)' }}>{n.title}</div>
                            <button onClick={() => deleteNotification(n.id)} style={{ padding: '4px 10px', background: 'transparent', border: `1px solid ${RED}`, color: RED, fontSize: 9, cursor: 'pointer', borderRadius: 4, fontFamily: MONO, flexShrink: 0 }}>Delete</button>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{n.body}</div>
                          <div style={{ marginTop: 10, fontSize: 10, color: 'var(--muted)', fontFamily: MONO, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            <span>{fmtDate(n.createdAt)}</span>
                            <span>from: {n.sentBy || 'unknown'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )
            })()}
            <Section title="Compose Notification">
              <div style={{ display: 'grid', gridTemplateColumns: notifPreview ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start', maxWidth: notifPreview ? '100%' : 560 }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px' }}>
                  <div style={{ fontFamily: SERIF, fontSize: 18, color: 'var(--text)', marginBottom: 20 }}>New Notification</div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>Title *</label>
                    <input type="text" value={notifForm.title} onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))} placeholder="New feature available 🎉" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>Body *</label>
                    <textarea value={notifForm.body} onChange={e => setNotifForm(f => ({ ...f, body: e.target.value }))} rows={3} maxLength={500} placeholder="We just launched…" style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>Image</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                      <input type="text" value={notifForm.imageUrl} onChange={e => setNotifForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://… or upload directly" style={inputStyle} />
                      <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', border: `1px solid ${GOLD}70`, color: GOLD, borderRadius: 8, fontFamily: MONO, fontSize: 9, letterSpacing: '0.1em', cursor: notifImageUploading ? 'default' : 'pointer', opacity: notifImageUploading ? 0.6 : 1 }}>
                        {notifImageUploading ? 'Uploading…' : 'Upload'}
                        <input type="file" accept="image/*" hidden onChange={e => handleNotificationImageUpload(e.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>Target User ID <span style={{ color: GOLD }}>(blank = broadcast all)</span></label>
                    <input type="text" value={notifForm.targetUserId} onChange={e => setNotifForm(f => ({ ...f, targetUserId: e.target.value }))} placeholder="clxxx…" style={inputStyle} />
                  </div>
                  <div style={{ fontSize: 10, color: notifForm.targetUserId ? GOLD : BLUE, fontFamily: MONO, marginBottom: 16 }}>
                    {notifForm.targetUserId ? '📌 Targeted, 1 user only' : '📡 Broadcast, all users'}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setNotifPreview(p => !p)} style={{ flex: 1, padding: '10px 0', background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS, borderRadius: 8 }}>{notifPreview ? 'Hide Preview' : 'Preview'}</button>
                    <button onClick={sendNotification} disabled={notifSending || !notifForm.title.trim() || !notifForm.body.trim()} style={{ flex: 2, padding: '10px 0', background: (!notifForm.title.trim() || notifSending) ? 'var(--surface)' : GOLD, color: '#000', border: 'none', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: notifSending ? 'default' : 'pointer', fontFamily: SANS, borderRadius: 2, opacity: notifSending ? 0.7 : 1 }}>
                      {notifSending ? 'Sending…' : notifForm.targetUserId ? 'Send to User' : 'Broadcast to All'}
                    </button>
                  </div>
                </div>
                {notifPreview && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 12 }}>Live Preview</div>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', maxWidth: 360, boxShadow: '0 12px 48px rgba(0,0,0,0.3)' }}>
                      {notifForm.imageUrl && <div style={{ height: 160, overflow: 'hidden' }}><img src={notifForm.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /></div>}
                      <div style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 6, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>⚡</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: SERIF, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{notifForm.title || 'Notification Title'}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{notifForm.body || 'Body text appears here…'}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO, marginTop: 8 }}>Just now</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Section>
            <Section title={`Sent Notifications (${notifications.filter((n: any) => n.type !== 'support').length})`}>
              {notifLoading ? <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13 }}>Loading…</div> : notifications.filter((n: any) => n.type !== 'support').length === 0 ? (
                <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13, padding: '24px 0' }}>No broadcast notifications sent yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notifications.filter((n: any) => n.type !== 'support').map((n: any) => (
                    <div key={n.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {n.imageUrl && <img src={n.imageUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><div style={{ fontFamily: SERIF, fontSize: 14, color: 'var(--text)' }}>{n.title}</div><Badge label={n.type} color={n.type === 'broadcast' ? BLUE : GOLD} /></div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO, display: 'flex', gap: 16 }}>
                          <span>{fmtDate(n.createdAt)}</span>
                          <span style={{ color: GREEN }}>{Number(n.readCount ?? 0)} reads</span>
                          {n.targetUserId && <span style={{ color: GOLD }}>targeted</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteNotification(n.id)} style={{ padding: '4px 10px', background: 'transparent', border: `1px solid ${RED}`, color: RED, fontSize: 9, cursor: 'pointer', borderRadius: 1, fontFamily: MONO, flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}

        {/* ── PAGE ANALYTICS ── */}
        {tab === 'analytics' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>Range:</span>
              {([['1', 'Today'], ['7', '7d'], ['30', '30d'], ['90', '90d'], ['180', '6mo'], ['365', '1yr']] as [DateRange, string][]).map(([val, label]) => (
                <button key={val} className={`admin-range-pill ${analyticsRange === val ? 'active' : 'inactive'}`}
                  onClick={() => setAnalyticsRange(val)}>
                  {label}
                </button>
              ))}
              <button onClick={() => generatePdfReport('analytics')} disabled={pdfReportLoading}
                style={{ marginLeft: 'auto', padding: '6px 14px', background: 'transparent', border: `1px solid ${GOLD}60`, color: GOLD, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 6, fontFamily: MONO }}>
                ↓ PDF Report
              </button>
            </div>
            {analyticsError && <div style={{ color: '#E57373', fontFamily: MONO, fontSize: 11, padding: '12px 16px', background: 'rgba(229,115,115,0.08)', border: '1px solid rgba(229,115,115,0.2)', borderRadius: 10, marginBottom: 16 }}>⚠ {analyticsError}</div>}
                {analyticsLoading ? <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13 }}>Loading analytics…</div> : !pageAnalytics ? (
              <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13, padding: '32px 0' }}>No page visit data yet. Tracking fires automatically as users browse.</div>
            ) : (
              <>
                <Section title="Summary">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 16 }}>
                    <Stat label="Total Page Views" value={fmtNum(pageAnalytics.summary?.totalVisits ?? 0)} />
                    <Stat label="Signups" value={fmtNum(pageAnalytics.summary?.signups ?? 0)} sub={`${(pageAnalytics.summary?.signupRate ?? 0).toFixed(2)}% visit → signup`} color={GREEN} />
                    <Stat label="Logged-in Users" value={fmtNum(pageAnalytics.summary?.uniqueUsers ?? 0)} />
                    <Stat label="Unique Pages" value={fmtNum(pageAnalytics.summary?.uniquePages ?? 0)} />
                    <Stat label="Avg Session Time" value={fmtDuration(pageAnalytics.summary?.avgDuration ?? 0)} color={GOLD} />
                  </div>
                </Section>
                {/* Daily Trend Chart */}
                {(pageAnalytics.dailyTrend || []).length > 0 && (() => {
                  const trend: { date: string; visits: number; uniqueUsers: number }[] = pageAnalytics.dailyTrend
                  const maxVisits = Math.max(...trend.map((d: any) => d.visits), 1)
                  return (
                    <Section title="Daily Traffic + Signup Trend">
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100, marginBottom: 8 }}>
                          {trend.map((d: any) => (
                            <div key={d.date} title={`${d.date}: ${d.visits} visits`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                              <div style={{ width: '100%', background: GOLD, borderRadius: '2px 2px 0 0', height: `${Math.max((d.visits / maxVisits) * 100, 2)}px`, opacity: 0.85, transition: 'height 0.3s' }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: MONO }}>{trend[0]?.date}</span>
                          <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: MONO }}>{trend[trend.length - 1]?.date}</span>
                        </div>
                      </div>
                    </Section>
                  )
                })()}
                <Section title="Top Pages by Visits">
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Page', 'Visits', 'Unique Users', 'Avg Time on Page', 'Last Visit'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(pageAnalytics.topPages || []).map((row: any) => (
                          <tr key={row.page} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: GOLD, fontFamily: MONO }}>{row.page}</td>
                            <td style={{ padding: '10px 16px', fontSize: 13, fontFamily: SERIF, color: 'var(--text)' }}>{fmtNum(row.visits)}</td>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--muted)', fontFamily: MONO }}>{fmtNum(row.uniqueUsers)}</td>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--muted)', fontFamily: MONO }}>{fmtDuration(row.avgDuration)}</td>
                            <td style={{ padding: '10px 16px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{row.lastVisit ? fmtDate(row.lastVisit) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
                <Section title="Most Active Users">
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['User', 'Phone', 'Plan', 'Pages Visited', 'Total Visits', 'Total Time on Site', 'Avg Session'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(pageAnalytics.activeUsers || []).map((row: any) => (
                          <tr key={row.userId} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <div style={{ color: 'var(--text)' }}>{row.name || row.email || row.userId}</div>
                              {row.email && <div style={{ color: 'var(--muted)', fontSize: 9, fontFamily: MONO }}>{row.email}</div>}
                            </td>
                            <td style={{ padding: '10px 16px', fontSize: 11, color: row.phone ? '#25D366' : 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{row.phone ? `+${row.phone}` : '—'}</td>
                            <td style={{ padding: '10px 16px', fontSize: 11, color: row.plan !== 'FREE' ? GOLD : 'var(--muted)', fontFamily: MONO }}>{row.plan || '—'}</td>
                            <td style={{ padding: '10px 16px', fontSize: 13, fontFamily: SERIF, color: 'var(--text)' }}>{fmtNum(row.uniquePages)}</td>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--muted)', fontFamily: MONO }}>{fmtNum(row.totalVisits)}</td>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: GOLD, fontFamily: MONO }}>{fmtDuration(row.totalDuration)}</td>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--muted)', fontFamily: MONO }}>{fmtDuration(row.avgDuration)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
                <Section title="Recent Page Visits">
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['User', 'Phone', 'Location', 'Page', 'Duration', 'Time'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(pageAnalytics.recentVisits || [])
                          // Show only arrival pings (durationMs IS NULL), these represent
                          // the actual page visit events. Departure-only rows (durationMs set,
                          // no matching null row in this window) are also included.
                          .filter((row: any) => row.durationMs === null || row.durationMs === undefined)
                          .map((row: any) => (
                          <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 14px', fontSize: 11, color: 'var(--text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <div>{row.name || row.email || '—'}</div>
                              {row.email && <div style={{ color: 'var(--muted)', fontSize: 9, fontFamily: MONO }}>{row.email}</div>}
                            </td>
                            <td style={{ padding: '8px 14px', fontSize: 10, color: row.phone ? '#25D366' : 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{row.phone ? `+${row.phone}` : '—'}</td>
                            <td style={{ padding: '8px 14px', fontSize: 10, color: row.location ? BLUE : 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{row.location || '—'}</td>
                            <td style={{ padding: '8px 14px', fontSize: 11, color: GOLD, fontFamily: MONO }}>{row.page}</td>
                            <td style={{ padding: '8px 14px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{fmtDuration(row.durationMs)}</td>
                            <td style={{ padding: '8px 14px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{fmtDate(row.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              </>
            )}
          </>
        )}

        {/* ── PRICING PLANS ── */}
        {tab === 'pricing' && (
          <Section title="Billing Page Plan Control">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, lineHeight: 1.7, maxWidth: 720 }}>
                Control which plans appear on the billing page, their prices, features, visibility, and order. Changes take effect immediately, no deployment needed.
              </div>
              <button onClick={createPricingPlan} style={{ padding: '9px 16px', background: GOLD, color: '#000', border: 'none', borderRadius: 8, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: MONO, fontWeight: 700, whiteSpace: 'nowrap' }}>
                + Add Pricing Plan
              </button>
            </div>
            {pricingLoading ? <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13 }}>Loading…</div> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {pricingPlans.map((plan: any) => {
                  const features: string[] = (() => { try { return JSON.parse(plan.features || '[]') } catch { return [] } })()
                  return (
                    <div key={plan.planId} style={{ background: 'var(--surface)', border: `1px solid ${plan.highlight ? GOLD : 'var(--surface)'}`, borderRadius: 12, padding: '20px 22px', position: 'relative', opacity: plan.isVisible ? 1 : 0.45, transition: 'opacity 0.2s' }}>
                      {plan.highlight && <div style={{ position: 'absolute', top: -1, left: 20, background: GOLD, color: '#000', fontSize: 8, padding: '3px 12px', fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '0 0 8px 8px' }}>Recommended</div>}
                      {!plan.isVisible && <div style={{ position: 'absolute', top: 10, right: 10 }}><Badge label="hidden" color={RED} /></div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontFamily: SERIF, fontSize: 20, color: plan.highlight ? GOLD : 'var(--text)' }}>{plan.name}</div>
                          <div style={{ fontSize: 22, fontFamily: SERIF, color: 'var(--text)', marginTop: 2 }}>{plan.price}<span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{plan.period}</span></div>
                        </div>
                      </div>
                      <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none' }}>
                        {features.slice(0, 4).map((f: string, i: number) => <li key={i} style={{ fontSize: 11, color: 'var(--muted)', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: GREEN, fontSize: 10 }}>✓</span>{f}</li>)}
                        {features.length > 4 && <li style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO, marginTop: 2 }}>+{features.length - 4} more</li>}
                      </ul>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button onClick={() => openEditPlan(plan)} style={{ width: '100%', padding: '8px 0', background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS, borderRadius: 8 }}>Edit</button>
                        <button onClick={() => deletePricingPlan(plan.planId)} style={{ width: '100%', padding: '8px 0', background: 'transparent', border: `1px solid ${RED}70`, color: RED, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS, borderRadius: 8 }}>Delete</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
        )}


        {/* ── WEBSITES ── */}
        {tab === 'websites' && (
          <>
            <Section title="User Websites">
              {/* Filters row */}
              <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
                <input
                  value={adminWebsitesSearch}
                  onChange={e => { setAdminWebsitesSearch(e.target.value); setAdminWebsitesPage(1) }}
                  placeholder="Search by name, user, domain, prompt…"
                  className="admin-search-input"
                  style={{ flex:1, minWidth:200, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px 12px', fontSize:11, borderRadius:4, fontFamily:MONO }}
                />
                <button onClick={() => loadAdminWebsites(1, adminWebsitesSearch, adminWebsitesFilter)}
                  style={{ padding:'8px 16px', background:GOLD, color:'#000', border:'none', fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:MONO, fontWeight:700, cursor:'pointer', borderRadius:4 }}>
                  Search
                </button>
                {(['all','published','unpublished','generated','sample'] as const).map(f => (
                  <button key={f} onClick={() => { setAdminWebsitesFilter(f); setAdminWebsitesPage(1); loadAdminWebsites(1, adminWebsitesSearch, f) }}
                    className={adminWebsitesFilter===f ? 'admin-filter-btn-active' : 'admin-filter-btn-inactive'}
                    style={{ padding:'6px 12px', background:adminWebsitesFilter===f?GOLD:'transparent', color:adminWebsitesFilter===f?'#000':'var(--muted)', border:`1px solid ${adminWebsitesFilter===f?GOLD:'var(--border)'}`, fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:MONO, cursor:'pointer', borderRadius:3 }}>
                    {f}
                  </button>
                ))}
                <span style={{ fontSize:10, color:'var(--muted)', fontFamily:MONO, marginLeft:'auto' }}>
                  {adminWebsitesTotal} total
                </span>
              </div>

              {adminWebsitesLoading ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)', fontSize:12 }}>Loading…</div>
              ) : adminWebsites.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)', fontSize:12 }}>No websites found.</div>
              ) : (
                <div className="admin-websites-grid">
                  {adminWebsites.map((site: Record<string,any>) => (
                    <div key={site.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
                      {/* Card header stripe */}
                      <div style={{ height:3, background:`linear-gradient(90deg,#4CA8C9,transparent)` }}/>

                      {/* Iframe preview strip */}
                      {site.slug && (
                        <div style={{ height:130, background:'var(--bg)', overflow:'hidden', position:'relative', borderBottom:'1px solid var(--border)' }}>
                          <iframe
                            src={`/w/${site.slug}`}
                            style={{ width:'200%', height:'200%', transform:'scale(0.5)', transformOrigin:'top left', border:'none', pointerEvents:'none' }}
                            title={site.name}
                            loading="lazy"
                            sandbox="allow-scripts allow-same-origin"
                          />
                          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 60%, var(--surface) 100%)' }} />
                          <div style={{ position:'absolute', top:6, right:8, fontSize:8, fontFamily:MONO, letterSpacing:'0.1em', textTransform:'uppercase', background:site.isGenerated?`${GOLD}18`:'rgba(76,168,201,0.15)', color:site.isGenerated?GOLD:'#4CA8C9', border:`1px solid ${site.isGenerated?GOLD+'40':'#4CA8C940'}`, borderRadius:3, padding:'2px 6px' }}>
                            {site.isGenerated ? '⚡ AI' : '⊕ Template'}
                          </div>
                        </div>
                      )}

                      <div style={{ padding:'14px 16px 0' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                          {!site.slug && (
                            <div style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'#4CA8C9', fontFamily:MONO, background:'#4CA8C915', border:'1px solid #4CA8C930', padding:'2px 8px', borderRadius:2 }}>
                              {site.isGenerated ? '⚡ AI' : '⊕ Sample'} {site.isPublished ? '· ✓ Published' : '· Draft'}
                            </div>
                          )}
                          <div style={{ fontSize:9, color:'var(--muted)', fontFamily:MONO, marginLeft:'auto' }}>{fmtDate(site.createdAt)}</div>
                        </div>
                        <div style={{ fontFamily:SERIF, fontSize:15, color:'var(--text)', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{site.name}</div>
                        <div style={{ fontSize:11, color:'var(--muted)', marginBottom:6 }}>
                          {site.templateLabel || site.templateId || 'Custom AI Website'}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, fontSize:10, color:'var(--muted)', fontFamily:MONO }}>
                          <span>user:</span>
                          <span style={{ color:'var(--text)' }}>{site.user?.name || site.user?.email || '—'}</span>
                          <span style={{ color:site.user?.plan==='PRO'?GOLD:'var(--muted)', fontSize:8, border:`1px solid ${site.user?.plan==='PRO'?GOLD:'var(--border)'}`, padding:'1px 5px', borderRadius:2 }}>{site.user?.plan||'FREE'}</span>
                        </div>
                        <div style={{ fontSize:10, color:'var(--muted)', fontFamily:MONO, lineHeight:1.45, marginBottom:8, background:'rgba(201,168,76,0.05)', border:`1px solid ${GOLD}20`, borderRadius:3, padding:'5px 8px' }} title={site.prompt || ''}>
                          <span style={{ color:GOLD }}>Prompt:</span> {site.prompt ? shortPrompt(String(site.prompt), 150) : 'Not saved for older website'}
                        </div>
                        {site.customDomain && (
                          <div style={{ fontSize:10, fontFamily:MONO, color:site.domainVerified?GREEN:'var(--muted)', marginBottom:6 }}>
                            {site.domainVerified?'✓':'⋯'} {site.customDomain}
                          </div>
                        )}
                        {site.adminNote && (
                          <div style={{ fontSize:10, color:GOLD, background:`${GOLD}10`, border:`1px solid ${GOLD}25`, borderRadius:3, padding:'4px 8px', marginBottom:8, fontFamily:MONO }}>
                            📝 {site.adminNote}
                          </div>
                        )}
                        {/* Website stats */}
                        <div style={{ display:'flex', gap:16, padding:'6px 0', marginBottom:6 }}>
                          <div>
                            <div style={{ fontSize:8, color:'var(--muted)', fontFamily:MONO, letterSpacing:'0.1em', textTransform:'uppercase' }}>Template</div>
                            <div style={{ fontSize:11, color:'var(--text)', fontFamily:MONO }}>{site.templateId || '—'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize:8, color:'var(--muted)', fontFamily:MONO, letterSpacing:'0.1em', textTransform:'uppercase' }}>Published</div>
                            <div style={{ fontSize:11, color: site.isPublished ? GREEN : 'var(--muted)', fontFamily:MONO }}>{site.isPublished ? '✓ Yes' : '✗ No'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize:8, color:'var(--muted)', fontFamily:MONO, letterSpacing:'0.1em', textTransform:'uppercase' }}>AI Generated</div>
                            <div style={{ fontSize:11, color: site.isGenerated ? GOLD : 'var(--muted)', fontFamily:MONO }}>{site.isGenerated ? '⚡ Yes' : '⊕ No'}</div>
                          </div>
                        </div>
                        {site.slug && (
                          <div style={{ fontSize:10, color:'var(--muted)', fontFamily:MONO, marginBottom:6 }}>
                            🔗 /w/{site.slug}
                          </div>
                        )}
                      </div>

                      {/* Expanded editor */}
                      {adminWebsiteEditId === site.id && (
                        <div style={{ margin:'10px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, padding:14 }}>
                          <div style={{ fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:GOLD, fontFamily:MONO, marginBottom:10 }}>✦ Admin Edit Panel</div>

                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontSize:10, color:'var(--muted)', fontFamily:MONO, marginBottom:5 }}>Custom Domain</div>
                            <div style={{ display:'flex', gap:6 }}>
                              <input value={adminWebsiteDomain} onChange={e => setAdminWebsiteDomain(e.target.value)}
                                placeholder="mybusiness.com"
                                style={{ flex:1, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', padding:'6px 10px', fontSize:11, borderRadius:3, fontFamily:MONO }}/>
                              <button onClick={async () => {
                                const r = await fetch(`/api/user-websites/${site.id}`, {
                                  method:'PATCH', headers:{'Content-Type':'application/json'},
                                  body: JSON.stringify({ customDomain: adminWebsiteDomain, domainVerified: true }),
                                })
                                if (r.ok) { showToast('✓ Domain connected'); loadAdminWebsites() }
                                else showToast('✗ Failed')
                              }} style={{ padding:'6px 12px', background:GOLD, color:'#000', border:'none', fontSize:9, fontFamily:MONO, fontWeight:700, cursor:'pointer', borderRadius:3 }}>
                                Connect
                              </button>
                            </div>
                          </div>

                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontSize:10, color:'var(--muted)', fontFamily:MONO, marginBottom:5 }}>Admin Note</div>
                            <div style={{ display:'flex', gap:6 }}>
                              <input value={adminWebsiteNote} onChange={e => setAdminWebsiteNote(e.target.value)}
                                placeholder="Internal note visible only to admin…"
                                style={{ flex:1, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', padding:'6px 10px', fontSize:11, borderRadius:3, fontFamily:MONO }}/>
                              <button onClick={async () => {
                                const r = await fetch(`/api/user-websites/${site.id}`, {
                                  method:'PATCH', headers:{'Content-Type':'application/json'},
                                  body: JSON.stringify({ adminNote: adminWebsiteNote }),
                                })
                                if (r.ok) { showToast('✓ Note saved'); loadAdminWebsites() }
                              }} style={{ padding:'6px 12px', background:'var(--surface)', color:'var(--text)', border:'1px solid var(--border)', fontSize:9, fontFamily:MONO, cursor:'pointer', borderRadius:3 }}>
                                Save
                              </button>
                            </div>
                          </div>

                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontSize:10, color:'var(--muted)', fontFamily:MONO, marginBottom:5 }}>HTML Editor</div>
                            <textarea
                              value={adminWebsiteHtml}
                              onChange={e => setAdminWebsiteHtml(e.target.value)}
                              placeholder="Paste updated HTML here…"
                              style={{ width:'100%', height:200, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px 10px', fontSize:10, fontFamily:MONO, borderRadius:3, resize:'vertical', boxSizing:'border-box' }}
                            />
                            <button onClick={async () => {
                              if (!adminWebsiteHtml.trim()) { showToast('No HTML to save'); return }
                              const r = await fetch(`/api/user-websites/${site.id}`, {
                                method:'PATCH', headers:{'Content-Type':'application/json'},
                                body: JSON.stringify({ htmlContent: adminWebsiteHtml }),
                              })
                              if (r.ok) { showToast('✓ HTML saved') } else showToast('✗ Save failed')
                            }} style={{ marginTop:8, padding:'7px 16px', background:GOLD, color:'#000', border:'none', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:MONO, fontWeight:700, cursor:'pointer', borderRadius:3 }}>
                              Save HTML
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Card actions */}
                      <div style={{ display:'flex', borderTop:'1px solid var(--border)', flexWrap:'wrap', marginTop:10 }}>
                        <button onClick={async () => {
                          if (adminWebsiteEditId === site.id) { setAdminWebsiteEditId(null); return }
                          setAdminWebsiteEditId(site.id)
                          setAdminWebsiteDomain(site.customDomain || '')
                          setAdminWebsiteNote(site.adminNote || '')
                          // Load current HTML
                          const r = await fetch(`/api/user-websites/${site.id}`)
                          if (r.ok) { const d = await r.json(); setAdminWebsiteHtml(d.website?.htmlContent || '') }
                        }} style={{ flex:1, padding:'8px 4px', background:adminWebsiteEditId===site.id?`${GOLD}20`:'transparent', color:GOLD, border:'none', borderRight:'1px solid var(--border)', fontSize:9, letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:MONO, cursor:'pointer', minWidth:50, transition:'all 0.15s' }}>
                          ✎ Edit
                        </button>

                        {site.slug && (
                          <a href={`/w/${site.slug}`} target="_blank" rel="noreferrer"
                            style={{ flex:1, padding:'8px 4px', textAlign:'center', background:'transparent', color:'var(--muted)', borderRight:'1px solid var(--border)', fontSize:9, letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:MONO, textDecoration:'none', minWidth:50, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            ▶ View
                          </a>
                        )}
                        <button onClick={async () => {
                          if (!confirm(`Delete website "${site.name}"?`)) return
                          const r = await fetch(`/api/user-websites/${site.id}`, { method:'DELETE' })
                          if (r.ok) { showToast('Deleted'); loadAdminWebsites() }
                        }} style={{ flex:1, padding:'8px 4px', background:'transparent', color:'var(--muted)', border:'none', fontSize:9, letterSpacing:'0.06em', textTransform:'uppercase', fontFamily:MONO, cursor:'pointer', minWidth:50, transition:'all 0.15s' }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color=RED; el.style.background=`${RED}12` }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color='var(--muted)'; el.style.background='transparent' }}>
                          ✕ Del
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {adminWebsitesTotal > 24 && (
                <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:24 }}>
                  <button disabled={adminWebsitesPage<=1} onClick={() => { setAdminWebsitesPage(p => p-1); loadAdminWebsites(adminWebsitesPage-1) }}
                    style={{ padding:'6px 14px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', fontSize:10, cursor:adminWebsitesPage<=1?'default':'pointer', borderRadius:3, fontFamily:MONO, opacity:adminWebsitesPage<=1?0.4:1 }}>← Prev</button>
                  <span style={{ padding:'6px 14px', fontSize:10, color:'var(--muted)', fontFamily:MONO }}>Page {adminWebsitesPage} of {Math.ceil(adminWebsitesTotal/24)}</span>
                  <button disabled={adminWebsitesPage>=Math.ceil(adminWebsitesTotal/24)} onClick={() => { setAdminWebsitesPage(p => p+1); loadAdminWebsites(adminWebsitesPage+1) }}
                    style={{ padding:'6px 14px', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', fontSize:10, cursor:adminWebsitesPage>=Math.ceil(adminWebsitesTotal/24)?'default':'pointer', borderRadius:3, fontFamily:MONO, opacity:adminWebsitesPage>=Math.ceil(adminWebsitesTotal/24)?0.4:1 }}>Next →</button>
                </div>
              )}
            </Section>
          </>
        )}

        {/* ── DATABASE ── */}
        {tab === 'database' && (
          <>
            {/* Hidden file input for import */}
            <input
              ref={dbImportRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                e.target.value = ''
                setDbImportLoading(true)
                setDbImportResult(null)
                setDbImportError(null)
                try {
                  const text = await file.text()
                  let parsed: Record<string, any>
                  try { parsed = JSON.parse(text) } catch { throw new Error('File is not valid JSON') }
                  const res = await fetch('/api/admin/db-import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parsed),
                  })
                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || `Import failed (${res.status})`)
                  setDbImportResult(data)
                  showToast(`✓ Import done, ${data.summary?.totalInserted ?? 0} rows written`)
                } catch (err) {
                  const msg = err instanceof Error ? err.message : String(err)
                  setDbImportError(msg)
                  showToast('✕ Import failed')
                } finally {
                  setDbImportLoading(false)
                }
              }}
            />

            <Section title="Export Database">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px', maxWidth: 680 }}>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, lineHeight: 1.8, marginBottom: 20 }}>
                  Downloads a complete JSON snapshot of every table. Passwords are <span style={{ color: GOLD }}>excluded</span> for security. Suitable for migrations, backups, and restoring on a fresh Render PostgreSQL instance.
                </p>

                {/* Table filter */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 10 }}>Tables to include</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      'users', 'templates', 'generations', 'exports', 'portfolios', 'contacts',
                      'cardviews', 'analytics_events', 'sociallinks', 'domains', 'projects',
                      'seo_settings', 'blog_posts', 'presentations', 'slides', 'resume_versions',
                      'api_call_logs', 'admin_settings', 'notifications', 'notification_reads',
                      'page_visits', 'pricing_plans', 'user_websites',
                    ].map(t => {
                      const sel = dbExportTables.includes(t)
                      return (
                        <div
                          key={t}
                          onClick={() => setDbExportTables(prev =>
                            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                          )}
                          className={sel ? '' : 'admin-db-tag-inactive'}
                          style={{
                            padding: '4px 10px', fontSize: 10, cursor: 'pointer',
                            border: `1px solid ${sel ? GOLD : 'var(--border)'}`,
                            background: sel ? `${GOLD}18` : 'transparent',
                            color: sel ? GOLD : 'var(--muted)',
                            borderRadius: 6, fontFamily: MONO, letterSpacing: '0.06em',
                            transition: 'all 0.12s', userSelect: 'none',
                          }}
                        >
                          {sel ? '✓ ' : ''}{t}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <button onClick={() => setDbExportTables([])} style={{ fontSize: 10, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', padding: '4px 12px', cursor: 'pointer', borderRadius: 2, fontFamily: MONO }}>All tables (default)</button>
                    <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO, alignSelf: 'center' }}>
                      {dbExportTables.length === 0 ? 'Exporting all 22 tables' : `Exporting ${dbExportTables.length} selected table${dbExportTables.length !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>

                <button
                  disabled={dbExportLoading}
                  onClick={async () => {
                    setDbExportLoading(true)
                    try {
                      const qs = dbExportTables.length > 0 ? `?tables=${dbExportTables.join(',')}` : ''
                      const res = await fetch(`/api/admin/db-export${qs}`)
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({ error: 'Export failed' }))
                        throw new Error(err.error || `HTTP ${res.status}`)
                      }
                      const blob = await res.blob()
                      const disp = res.headers.get('Content-Disposition') ?? ''
                      const match = disp.match(/filename="([^"]+)"/)
                      const filename = match?.[1] ?? 'brandsyndicate-db-export.json'
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url; a.download = filename
                      document.body.appendChild(a); a.click(); document.body.removeChild(a)
                      setTimeout(() => URL.revokeObjectURL(url), 3000)
                      const total   = res.headers.get('X-Export-Total')
                      const skipped = res.headers.get('X-Export-Skipped')
                      const skippedList = skipped ? skipped.split(',').map(s => s.trim()).filter(Boolean) : []
                      showToast(
                        skippedList.length > 0
                          ? `✓ Export done, ${total} tables (${skippedList.length} skipped: ${skippedList.join(', ')})`
                          : `✓ Export done, all ${total} tables exported`
                      )
                    } catch (err) {
                      showToast(`✕ ${err instanceof Error ? err.message : 'Export failed'}`)
                    } finally {
                      setDbExportLoading(false)
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 28px', background: dbExportLoading ? `${GOLD}80` : GOLD,
                    color: '#000', border: 'none', borderRadius: 8,
                    fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: dbExportLoading ? 'not-allowed' : 'pointer', fontFamily: SANS, fontWeight: 500,
                  }}
                >
                  {dbExportLoading
                    ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Exporting…</>
                    : <>↓ Export to JSON</>
                  }
                </button>

                {/* Info boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                  {[
                    { label: 'Format', val: 'Structured JSON, one key per table, array of rows' },
                    { label: 'Passwords', val: 'Excluded, users will need to reset via forgot-password' },
                    { label: 'Compatibility', val: 'Import back via the Import section below' },
                    { label: 'Size', val: 'Typically 1–50 MB depending on generation volume' },
                  ].map(i => (
                    <div key={i.label} style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 4 }}>{i.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO, lineHeight: 1.6 }}>{i.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Import Database">
              <div style={{ background: 'var(--surface)', border: `1px solid ${RED}33`, borderRadius: 12, padding: '24px 28px', maxWidth: 680 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20, padding: '14px 18px', background: `${RED}0C`, border: `1px solid ${RED}30`, borderRadius: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                  <div style={{ fontSize: 11, color: '#E57373', fontFamily: MONO, lineHeight: 1.7 }}>
                    Import uses <strong>upsert</strong>, existing rows with matching IDs are updated, new rows are inserted. No rows are deleted. Safe to run on a fresh database or to merge data.
                    <br />Passwords are never overwritten. Users must reset via forgot-password after migrating.
                  </div>
                </div>

                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, lineHeight: 1.8, marginBottom: 20 }}>
                  Upload a <code style={{ color: GOLD, background: `${GOLD}12`, padding: '1px 6px', borderRadius: 6 }}>.json</code> file exported from this panel. Tables are imported in dependency order (templates → users → generations → …).
                </p>

                <button
                  disabled={dbImportLoading}
                  onClick={() => { setDbImportResult(null); setDbImportError(null); dbImportRef.current?.click() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 28px', background: 'transparent',
                    color: RED, border: `1px solid ${RED}`, borderRadius: 8,
                    fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: dbImportLoading ? 'not-allowed' : 'pointer', fontFamily: SANS,
                    opacity: dbImportLoading ? 0.7 : 1,
                  }}
                >
                  {dbImportLoading
                    ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid ${RED}40`, borderTopColor: RED, borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Importing…</>
                    : <>↑ Choose JSON File to Import</>
                  }
                </button>

                {/* Error */}
                {dbImportError && (
                  <div style={{ marginTop: 16, padding: '14px 18px', background: `${RED}0C`, border: `1px solid ${RED}40`, borderRadius: 10, fontSize: 11, color: '#E57373', fontFamily: MONO, lineHeight: 1.6 }}>
                    ✕ {dbImportError}
                  </div>
                )}

                {/* Result */}
                {dbImportResult && (
                  <div style={{ marginTop: 20 }}>
                    {/* Summary chips */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Rows Written',  val: dbImportResult.summary?.totalInserted ?? 0, color: GREEN },
                        { label: 'Rows Skipped',  val: dbImportResult.summary?.totalSkipped  ?? 0, color: GOLD },
                        { label: 'Errors',        val: dbImportResult.summary?.errorCount    ?? 0, color: dbImportResult.summary?.errorCount > 0 ? RED : 'var(--muted)' },
                      ].map(s => (
                        <div key={s.label} style={{ padding: '14px 20px', background: 'var(--surface)', border: `1px solid ${s.color}40`, borderRadius: 12, textAlign: 'center' }}>
                          <div style={{ fontSize: 22, color: s.color, fontFamily: SERIF, lineHeight: 1 }}>{s.val}</div>
                          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginTop: 4 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Per-table breakdown */}
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Table', 'Attempted', 'Written', 'Skipped', 'Errors'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(dbImportResult.results as Array<{ table: string; attempted: number; inserted: number; skipped: number; errors: string[] }>).map((r) => (
                            <tr key={r.table} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '8px 14px', color: GOLD, fontFamily: MONO }}>{r.table}</td>
                              <td style={{ padding: '8px 14px', color: 'var(--muted)', fontFamily: MONO }}>{r.attempted}</td>
                              <td style={{ padding: '8px 14px', color: GREEN, fontFamily: MONO }}>{r.inserted}</td>
                              <td style={{ padding: '8px 14px', color: GOLD, fontFamily: MONO }}>{r.skipped}</td>
                              <td style={{ padding: '8px 14px', color: r.errors.length > 0 ? RED : 'var(--muted)', fontFamily: MONO }}>
                                {r.errors.length > 0
                                  ? <span title={r.errors.join('\n')} style={{ cursor: 'help', borderBottom: `1px dashed ${RED}` }}>{r.errors.length} (hover)</span>
                                  : '—'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Actual error messages if any */}
                    {(dbImportResult.errors as string[]).length > 0 && (
                      <div style={{ marginTop: 14, padding: '12px 16px', background: `${RED}0A`, border: `1px solid ${RED}30`, borderRadius: 8 }}>
                        <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: RED, fontFamily: MONO, marginBottom: 8 }}>Error details</div>
                        {(dbImportResult.errors as string[]).slice(0, 20).map((err, i) => (
                          <div key={i} style={{ fontSize: 10, color: '#E57373', fontFamily: MONO, lineHeight: 1.6, marginBottom: 4 }}>• {err}</div>
                        ))}
                        {(dbImportResult.errors as string[]).length > 20 && (
                          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO }}>…and {(dbImportResult.errors as string[]).length - 20} more</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Section>

            <Section title="Migration Checklist">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px', maxWidth: 680 }}>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, lineHeight: 1.8, marginBottom: 16 }}>
                  Follow these steps when moving to a fresh Render PostgreSQL instance:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { n: '1', text: 'Export the database from this panel on the OLD deployment', done: false },
                    { n: '2', text: 'On the NEW Render service, set DATABASE_URL to the new PostgreSQL connection string', done: false },
                    { n: '3', text: 'Run `npx prisma migrate deploy` to apply all schema migrations', done: false },
                    { n: '4', text: 'Run `node scripts/seed-admin.mjs` to re-create the admin account', done: false },
                    { n: '5', text: 'Go to Admin → Database → Import and upload the exported JSON', done: false },
                    { n: '6', text: 'Verify user count and generation count in Overview tab', done: false },
                    { n: '7', text: 'Notify users to reset password via Forgot Password (passwords excluded from export)', done: false },
                    { n: '8', text: 'Update Cloudinary, Razorpay, Anthropic API keys in Render env vars', done: false },
                  ].map(step => (
                    <div key={step.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${GOLD}18`, border: `1px solid ${GOLD}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: GOLD, fontFamily: MONO, fontWeight: 600 }}>{step.n}</div>
                      <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: MONO, lineHeight: 1.6 }}>{step.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <>
            {/* ── MASTER GENERATION LIMIT ── */}
            <Section title="Master Generation Limit">
              <div style={{ background: 'var(--surface)', border: `1px solid ${GOLD}40`, borderRadius: 14, padding: '28px 32px', maxWidth: 560 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${GOLD}18`, border: `1px solid ${GOLD}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>⚡</div>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontFamily: SANS, fontWeight: 600, marginBottom: 4 }}>Overall cap for every user</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO, lineHeight: 1.7 }}>
                      This single limit applies to <span style={{ color: GOLD }}>all generation types</span> (website, logo, graphics, strategy, calendar, edits, and external AI chat) for every user. It overrides per-plan limits. Users see their quota on the generate page.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>
                      Generations Allowed
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={masterLimit}
                      onChange={e => setMasterLimit(e.target.value)}
                      placeholder="5"
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 14, color: 'var(--text)', fontFamily: MONO }}
                    />
                    <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: MONO, marginTop: 4 }}>0 = unlimited</div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>
                      Reset Period
                    </label>
                    <select
                      value={masterPeriod}
                      onChange={e => setMasterPeriod(e.target.value as 'daily' | 'monthly')}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, color: 'var(--text)', fontFamily: MONO, cursor: 'pointer' }}
                    >
                      <option value="daily">Daily (resets at midnight UTC)</option>
                      <option value="monthly">Monthly (resets 1st of month)</option>
                    </select>
                  </div>
                </div>

                <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20`, borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 11, color: 'var(--muted)', fontFamily: MONO, lineHeight: 1.6 }}>
                  Current setting: <span style={{ color: GOLD, fontWeight: 600 }}>{masterLimit || '5'} generations / {masterPeriod}</span>
                  {' '}· Users see this as a quota badge on the generate page.
                </div>

                {masterLimitMsg && (
                  <div style={{ fontSize: 12, color: masterLimitMsg.startsWith('✓') ? '#6FCF97' : '#E57373', fontFamily: MONO, marginBottom: 12 }}>
                    {masterLimitMsg}
                  </div>
                )}
                <button
                  onClick={saveMasterLimit}
                  disabled={masterLimitSaving}
                  style={{ padding: '10px 28px', background: GOLD, color: '#000', border: 'none', borderRadius: 2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: masterLimitSaving ? 'default' : 'pointer', fontFamily: SANS, opacity: masterLimitSaving ? 0.7 : 1 }}
                >
                  {masterLimitSaving ? 'Saving…' : 'Save Master Limit'}
                </button>
              </div>
            </Section>

            <Section title="Exchange Rate (USD → INR)">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px', maxWidth: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO }}>Current: <span style={{ color: GOLD }}>1 USD = ₹{usdToInr.toFixed(2)}</span></div>
                  <LivePill source={rateSource} />
                </div>
                <button onClick={fetchLiveRates} disabled={liveRatesLoading} style={{ width: '100%', padding: '10px 0', background: GREEN, color: '#fff', border: 'none', borderRadius: 2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: liveRatesLoading ? 'default' : 'pointer', fontFamily: SANS, marginBottom: 16, opacity: liveRatesLoading ? 0.7 : 1 }}>
                  {liveRatesLoading ? '⟳ Fetching live rate…' : '⟳ Fetch Live Rate (auto-saves)'}
                </button>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO, marginBottom: 16, textAlign: 'center' }}>— or override manually —</div>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>Manual Rate</label>
                <input type="number" step="0.01" value={editRate} onChange={e => setEditRate(e.target.value)} placeholder={`e.g. ${usdToInr.toFixed(2)}`} style={{ ...inputStyle, marginBottom: 14 }} />
                <button onClick={saveRate} style={{ padding: '10px 24px', background: GOLD, color: '#000', border: 'none', borderRadius: 2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS }}>Set Manual Rate</button>
              </div>
            </Section>

            <Section title="Claude Pricing, Live INR Calculation">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflowX: 'auto', maxWidth: 820 }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>Rate: ₹{usdToInr.toFixed(2)}</span>
                    <LivePill source={rateSource} />
                  </div>
                  <button onClick={fetchLiveRates} disabled={liveRatesLoading} style={{ padding: '4px 12px', background: 'transparent', border: `1px solid ${GREEN}`, color: GREEN, fontSize: 9, cursor: 'pointer', borderRadius: 1, fontFamily: MONO }}>{liveRatesLoading ? '…' : '↻ Refresh Rate'}</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Model', 'Input $/M', 'Output $/M', 'Input ₹/M', 'Output ₹/M', 'Role'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {(claudePricing ? Object.entries(claudePricing) : [
                      ['claude-sonnet-4-5', { inputPerM: 3.0, outputPerM: 15.0 }] as [string, { inputPerM: number; outputPerM: number }],
                      ['claude-haiku-4-5-20251001', { inputPerM: 0.80, outputPerM: 4.0 }] as [string, { inputPerM: number; outputPerM: number }],
                      ['claude-sonnet-4-6', { inputPerM: 3.0, outputPerM: 15.0 }] as [string, { inputPerM: number; outputPerM: number }],
                      ['claude-opus-4-6', { inputPerM: 15.0, outputPerM: 75.0 }] as [string, { inputPerM: number; outputPerM: number }],
                    ] as [string, { inputPerM: number; outputPerM: number }][]).map(([model, pricing]) => {
                      const roles: Record<string, string> = { 'claude-sonnet-4-5': 'primary', 'claude-haiku-4-5-20251001': 'fallback', 'claude-sonnet-4-6': 'latest', 'claude-opus-4-6': 'premium' }
                      return (
                        <tr key={model} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: GOLD }}>{model}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text)', fontFamily: MONO }}>${pricing.inputPerM}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text)', fontFamily: MONO }}>${pricing.outputPerM}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12, color: GOLD, fontFamily: MONO }}>₹{(pricing.inputPerM * usdToInr).toFixed(0)}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12, color: GOLD, fontFamily: MONO }}>₹{(pricing.outputPerM * usdToInr).toFixed(0)}</td>
                          <td style={{ padding: '10px 16px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO }}>{roles[model] || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO, marginTop: 10 }}>INR values recalculate live when you refresh the exchange rate.</div>
            </Section>

            <Section title="Global Generation Limits">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px', maxWidth: 680 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO, marginBottom: 20, lineHeight: 1.7 }}>
                  Set daily / weekly / monthly generation caps per plan. Leave blank for <span style={{ color: GOLD }}>unlimited</span>. Individual user overrides (set in Users tab) take precedence.
                </div>
                {(['free', 'pro', 'team'] as const).map(plan => (
                  <div key={plan} style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 14, fontWeight: 600 }}>{plan} plan</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      {(['daily', 'weekly', 'monthly'] as const).map(period => (
                        <div key={period}>
                          <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>{period}</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="∞ unlimited"
                            value={globalLimits[plan][period]}
                            onChange={e => setGlobalLimits(prev => ({ ...prev, [plan]: { ...prev[plan], [period]: e.target.value } }))}
                            style={{ ...inputStyle, width: '100%' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {limitsMsg && <div style={{ fontSize: 12, color: limitsMsg.startsWith('✓') ? '#6FCF97' : '#E57373', fontFamily: MONO, marginBottom: 12 }}>{limitsMsg}</div>}
                <button onClick={saveGlobalLimits} disabled={limitsSaving} style={{ padding: '10px 28px', background: GOLD, color: '#000', border: 'none', borderRadius: 2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: limitsSaving ? 'default' : 'pointer', fontFamily: SANS, opacity: limitsSaving ? 0.7 : 1 }}>
                  {limitsSaving ? 'Saving…' : 'Save Global Limits'}
                </button>
              </div>
            </Section>

            {/* ── Poster Edit Controls ──────────────────────────────── */}
            <Section title="Poster &amp; Image Edit Controls">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px', maxWidth: 480 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, marginBottom: 20, lineHeight: 1.7 }}>
                  Maximum number of AI-powered edits a user can apply to each generated poster or brand image.
                  Each edit uses Claude Haiku to modify headline, subheadline, CTA, and colours.
                  <br /><span style={{ color: GOLD }}>Set to 0 to disable editing for all users.</span>
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 8 }}>
                    Edits Per Poster
                  </label>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={posterEditLimit}
                      onChange={e => setPosterEditLimit(e.target.value)}
                      style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>
                      {posterEditLimit === '0' ? 'Editing disabled' : `${posterEditLimit} edit${posterEditLimit === '1' ? '' : 's'} per poster`}
                    </span>
                  </div>
                </div>
                {posterEditLimitMsg && (
                  <div style={{ fontSize: 12, color: posterEditLimitMsg.startsWith('✓') ? '#6FCF97' : '#E57373', fontFamily: MONO, marginBottom: 12 }}>
                    {posterEditLimitMsg}
                  </div>
                )}
                <button
                  onClick={savePosterEditLimit}
                  disabled={posterEditLimitSaving}
                  style={{ padding: '10px 28px', background: GOLD, color: '#000', border: 'none', borderRadius: 2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: posterEditLimitSaving ? 'default' : 'pointer', fontFamily: SANS, opacity: posterEditLimitSaving ? 0.7 : 1 }}
                >
                  {posterEditLimitSaving ? 'Saving…' : 'Save Edit Limit'}
                </button>
              </div>
            </Section>

            <Section title="Change Admin Password">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px', maxWidth: 440 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, marginBottom: 18 }}>Admin: <span style={{ color: GOLD }}>{ADMIN_EMAIL}</span></div>
                {([['Current Password', pwCurrent, setPwCurrent], ['New Password (min 8)', pwNew, setPwNew], ['Confirm New Password', pwConfirm, setPwConfirm]] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>{label}</label>
                    <input type="password" value={val} onChange={e => setter(e.target.value)} placeholder="••••••••" style={inputStyle} />
                  </div>
                ))}
                {pwMsg && <div style={{ fontSize: 12, color: pwMsg.startsWith('✓') ? '#6FCF97' : '#E57373', fontFamily: MONO, marginBottom: 12 }}>{pwMsg}</div>}
                <button onClick={changePassword} style={{ padding: '10px 24px', background: GOLD, color: '#000', border: 'none', borderRadius: 2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS }}>Change Password</button>
              </div>
            </Section>

            <Section title="Seed Admin Account">
              <div style={{ background: 'var(--surface)', border: `1px solid ${RED}33`, borderRadius: 12, padding: '20px 24px', maxWidth: 540 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, lineHeight: 1.8 }}>
                  Run on new deployment:<br />
                  <code style={{ color: GOLD, background: 'rgba(201,168,76,0.08)', padding: '4px 10px', borderRadius: 1, display: 'inline-block', marginTop: 8, fontSize: 12 }}>node scripts/seed-admin.mjs</code>
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
