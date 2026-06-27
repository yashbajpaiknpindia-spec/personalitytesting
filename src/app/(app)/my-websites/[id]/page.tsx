'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Website {
  id: string
  name: string
  slug: string | null
  isPublished: boolean
  isGenerated: boolean
  templateId: string | null
  templateLabel: string | null
  customDomain: string | null
  domainVerified: boolean
  createdAt: string
  updatedAt: string
}

interface AnalyticsSummary {
  totalViews: number
  uniqueSessions: number
  avgDurationSec: number
}
interface TrendPoint { date: string; views: number; visitors: number }
interface DeviceBreakdown { name: string; count: number }
interface RecentVisit { createdAt: string; device: string; browser: string }
interface SiteAnalytics {
  summary: AnalyticsSummary
  trend: TrendPoint[]
  devices: DeviceBreakdown[]
  browsers: DeviceBreakdown[]
  recentVisits: RecentVisit[]
  days: number
}

type Tab = 'overview' | 'domain' | 'analytics' | 'seo' | 'usage' | 'leads'

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const BLUE = '#4CA8C9'
const GOLD = '#C9A84C'
const mono: React.CSSProperties = { fontFamily: "'DM Mono', monospace" }

const eyebrow = (color = BLUE): React.CSSProperties => ({
  fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color,
  ...mono, marginBottom: 10,
})

const label: React.CSSProperties = {
  fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
  color: 'var(--muted)', ...mono, marginBottom: 6,
}

function ActionBtn({
  children, onClick, disabled, variant = 'primary', href, target,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'gold'
  href?: string
  target?: string
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 18px', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
    fontFamily: "'DM Mono', monospace", fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 'var(--radius)', transition: 'all 0.15s', border: 'none',
    textDecoration: 'none', opacity: disabled ? 0.5 : 1,
    ...(variant === 'primary'   && { background: BLUE, color: '#000' }),
    ...(variant === 'gold'      && { background: GOLD, color: '#000' }),
    ...(variant === 'secondary' && { background: `${BLUE}15`, border: `1px solid ${BLUE}40`, color: BLUE }),
    ...(variant === 'danger'    && { background: '#c0392b15', border: '1px solid #c0392b40', color: '#e74c3c' }),
  }
  if (href) return <a href={href} target={target} rel="noopener noreferrer" style={base}>{children}</a>
  return <button onClick={onClick} disabled={disabled} style={base}>{children}</button>
}

function StatCard({ label: l, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 16px 14px' }}>
      <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', ...mono, marginBottom: 6 }}>{l}</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: 'var(--cream)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 9, color: 'var(--muted2)', ...mono, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Mini sparkline chart ──────────────────────────────────────────────────────
function SparkLine({ data, color = BLUE, height = 48 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const w = 300, h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * (h - 6) - 1
    return `${x},${y}`
  }).join(' ')
  const fill = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * (h - 6) - 1
    return `${x},${y}`
  })
  const fillPath = `M0,${h} L${fill[0]} L${fill.join(' L')} L${w},${h} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, color = BLUE }: { data: Array<{ label: string; value: number }>; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {data.map(({ label: l, value }) => (
        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 9, color: 'var(--muted)', ...mono, width: 64, textAlign: 'right', flexShrink: 0, letterSpacing: '0.04em' }}>{l}</div>
          <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontSize: 9, color: 'var(--muted)', ...mono, width: 28, flexShrink: 0 }}>{value}</div>
        </div>
      ))}
    </div>
  )
}

// ── Analytics Panel ───────────────────────────────────────────────────────────
function AnalyticsPanel({ siteId, liveUrl, isPublished, slug }: {
  siteId: string
  liveUrl: string | null
  isPublished: boolean
  slug: string | null
}) {
  const [analytics, setAnalytics] = useState<SiteAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  const loadAnalytics = useCallback(async (d: number) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/user-websites/${siteId}/analytics?days=${d}`)
      if (r.ok) {
        const json = await r.json()
        setAnalytics(json)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [siteId])

  useEffect(() => { loadAnalytics(days) }, [loadAnalytics, days])

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

  function fmtDuration(sec: number) {
    if (sec < 60) return `${sec}s`
    return `${Math.floor(sec / 60)}m ${sec % 60}s`
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={eyebrow()}>Built-in Analytics</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'var(--cream)', marginBottom: 0 }}>Traffic Overview</h2>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{
              padding: '5px 12px', fontSize: 9, ...mono, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: 'pointer', borderRadius: 4,
              border: `1px solid ${days === d ? BLUE : 'var(--border)'}`,
              background: days === d ? `${BLUE}18` : 'transparent',
              color: days === d ? BLUE : 'var(--muted)',
              transition: 'all 0.15s',
            }}>{d}d</button>
          ))}
        </div>
      </div>

      {/* Live URL */}
      {liveUrl && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isPublished ? '#27AE60' : 'var(--muted2)', flexShrink: 0 }} />
          <a href={liveUrl} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: BLUE, ...mono, textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            brandsyndicate.io{liveUrl}
          </a>
          <div style={{ fontSize: 8, color: isPublished ? '#27AE60' : 'var(--muted)', ...mono, textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0 }}>
            {isPublished ? '● Live' : '○ Draft'}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12, color: 'var(--muted)', ...mono, fontSize: 10 }}>
          <div style={{ width: 18, height: 18, border: '1px solid var(--border)', borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Loading analytics…
        </div>
      ) : !analytics ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 12, ...mono }}>
          No analytics data yet. Share your website link to start getting visitors.
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
            <StatCard label="Page Views" value={fmt(analytics.summary.totalViews)} sub={`Last ${days} days`} />
            <StatCard label="Unique Sessions" value={fmt(analytics.summary.uniqueSessions)} sub="Distinct visitors" />
            <StatCard label="Avg. Time" value={fmtDuration(analytics.summary.avgDurationSec)} sub="Per session" />
          </div>

          {/* Trend chart */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ ...label, marginBottom: 12 }}>Daily Views, {days}d trend</div>
            {analytics.trend.every(t => t.views === 0) ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontSize: 11, ...mono }}>No visits yet in this period</div>
            ) : (
              <>
                <SparkLine data={analytics.trend.map(t => t.views)} color={BLUE} height={56} />
                {/* X-axis labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  {[0, Math.floor(analytics.trend.length / 2), analytics.trend.length - 1].map(i => (
                    <span key={i} style={{ fontSize: 8, color: 'var(--muted2)', ...mono }}>
                      {analytics.trend[i]?.date?.slice(5) ?? ''}
                    </span>
                  ))}
                </div>
                {/* Visitor overlay */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ ...label, fontSize: 8, marginBottom: 6 }}>Unique visitors</div>
                  <SparkLine data={analytics.trend.map(t => t.visitors)} color={GOLD} height={32} />
                </div>
              </>
            )}
          </div>

          {/* Devices + Browsers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={label}>Devices</div>
              {analytics.devices.length === 0 ? (
                <div style={{ fontSize: 10, color: 'var(--muted2)', ...mono }}>No data yet</div>
              ) : (
                <BarChart data={analytics.devices.map(d => ({ label: d.name, value: d.count }))} color={BLUE} />
              )}
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={label}>Browsers</div>
              {analytics.browsers.length === 0 ? (
                <div style={{ fontSize: 10, color: 'var(--muted2)', ...mono }}>No data yet</div>
              ) : (
                <BarChart data={analytics.browsers.map(d => ({ label: d.name, value: d.count }))} color={GOLD} />
              )}
            </div>
          </div>

          {/* Recent visits */}
          {analytics.recentVisits.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              <div style={label}>Recent Visitors</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {analytics.recentVisits.map((v, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10, color: 'var(--muted)', ...mono }}>
                    <span style={{ color: BLUE, fontSize: 8, background: `${BLUE}12`, border: `1px solid ${BLUE}25`, padding: '1px 6px', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>{v.device}</span>
                    <span style={{ color: 'var(--muted2)', flexShrink: 0 }}>{v.browser}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 9, flexShrink: 0 }}>
                      {new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function WebsiteDashboardPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()

  const [site, setSite] = useState<Website | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === 'undefined') return 'overview'
    const hash = window.location.hash.replace('#', '') as Tab
    return ['overview', 'domain', 'analytics', 'seo', 'usage', 'leads'].includes(hash) ? hash : 'overview'
  })

  // Domain state
  const [domainInput, setDomainInput] = useState('')
  const [domainStatus, setDomainStatus] = useState<'idle'|'connecting'|'connected'|'error'>('idle')
  const [domainMsg, setDomainMsg] = useState('')

  // Publish state
  const [publishing, setPublishing] = useState(false)

  // SEO state
  const [seoTitle,   setSeoTitle]   = useState('')
  const [seoDesc,    setSeoDesc]    = useState('')
  const [ogTitle,    setOgTitle]    = useState('')
  const [ogDesc,     setOgDesc]     = useState('')
  const [gaId,       setGaId]       = useState('')
  const [gscTag,     setGscTag]     = useState('')
  const [seoSaving,  setSeoSaving]  = useState(false)
  const [seoSaved,   setSeoSaved]   = useState(false)
  const [seoLoaded,  setSeoLoaded]  = useState(false)

  // Delete state
  const [deleting, setDeleting] = useState(false)

  // Rename state
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState('')
  const [renameSaving, setRenameSaving] = useState(false)

  // Toast
  const [toast, setToast] = useState('')

  // Keep management sections directly reachable from /my-websites/:id#seo, #domain, #analytics, etc.
  useEffect(() => {
    const syncTabFromHash = () => {
      const hash = window.location.hash.replace('#', '') as Tab
      if (['overview', 'domain', 'analytics', 'seo', 'usage', 'leads'].includes(hash)) setActiveTab(hash)
    }
    syncTabFromHash()
    window.addEventListener('hashchange', syncTabFromHash)
    return () => window.removeEventListener('hashchange', syncTabFromHash)
  }, [])
  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // Leads
  const [leads, setLeads] = useState<any[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [leadsLoaded, setLeadsLoaded] = useState(false)

  // Overview analytics (page views / unique visitors for overview tab)
  const [overviewViews, setOverviewViews] = useState<number | null>(null)
  const [overviewVisitors, setOverviewVisitors] = useState<number | null>(null)

  // ── Load site ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/user-websites/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.website) {
          const w = d.website
          setSite({
            id: w.id, name: w.name, slug: w.slug,
            isPublished: w.isPublished ?? false,
            isGenerated: w.isGenerated ?? false,
            templateId: w.templateId ?? null,
            templateLabel: w.templateLabel ?? null,
            customDomain: w.customDomain ?? null,
            domainVerified: w.domainVerified ?? false,
            createdAt: w.createdAt, updatedAt: w.updatedAt,
          })
          setDomainInput(w.customDomain || '')
          if (w.customDomain) setDomainStatus('connected')

          // ── Eagerly load overview analytics (all-time views) ──────────────
          fetch(`/api/user-websites/${w.id}/analytics?days=9999`)
            .then(r => r.ok ? r.json() : null)
            .then(a => {
              if (a?.summary) {
                setOverviewViews(a.summary.totalViews ?? 0)
                setOverviewVisitors(a.summary.uniqueSessions ?? 0)
              }
            })
            .catch(() => {})

          // ── Eagerly load leads so overview can show count ─────────────────
          if (w.slug) {
            setLeadsLoading(true)
            fetch(`/api/leads?slug=${w.slug}`)
              .then(r => r.ok ? r.json() : Promise.reject(r.status))
              .then(ld => {
                setLeads(ld.contacts || [])
                setLeadsLoaded(true)
              })
              .catch(() => {
                // Pre-warm failed; leads tab useEffect will retry when opened
                setLeadsLoaded(false)
              })
              .finally(() => setLeadsLoading(false))
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // ── Rename ─────────────────────────────────────────────────────────────────
  async function handleRename() {
    if (!renameVal.trim() || !site) return
    setRenameSaving(true)
    try {
      const r = await fetch(`/api/user-websites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameVal.trim() }),
      })
      if (r.ok) {
        setSite(s => s ? { ...s, name: renameVal.trim() } : s)
        setRenaming(false)
        showToast('✓ Website renamed')
      }
    } catch { showToast('Rename failed') }
    finally { setRenameSaving(false) }
  }

  // ── Publish / Unpublish ────────────────────────────────────────────────────
  async function handleTogglePublish() {
    if (!site) return
    setPublishing(true)
    try {
      const newVal = !site.isPublished
      const r = await fetch(`/api/user-websites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: newVal }),
      })
      if (r.ok) {
        setSite(s => s ? { ...s, isPublished: newVal } : s)
        showToast(newVal ? '✓ Website is now live' : '● Website set to draft')
      }
    } catch { showToast('Action failed, try again') }
    finally { setPublishing(false) }
  }

  // ── Domain connect ─────────────────────────────────────────────────────────
  async function handleDomainConnect() {
    if (!domainInput.trim()) return
    setDomainStatus('connecting'); setDomainMsg('')
    try {
      const r = await fetch(`/api/user-websites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customDomain: domainInput.trim() }),
      })
      if (!r.ok) throw new Error('Failed')
      setDomainStatus('connected')
      setDomainMsg('Point your CNAME to brandsyndicate.io, propagation takes up to 48 hrs.')
      setSite(s => s ? { ...s, customDomain: domainInput.trim() } : s)
    } catch {
      setDomainStatus('error')
      setDomainMsg('Could not connect domain, please try again.')
    }
  }

  // ── Leads load (fires once when leads tab becomes active) ────────────────────
  useEffect(() => {
    if (activeTab !== 'leads' || leadsLoaded || leadsLoading) return
    if (!site?.slug) {
      // No slug yet — mark as loaded so we show the "publish first" message
      setLeadsLoaded(true)
      return
    }
    setLeadsLoading(true)
    fetch(`/api/leads?slug=${site.slug}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        setLeads(d.contacts || [])
        setLeadsLoaded(true)
      })
      .catch(() => {
        // Mark loaded even on error so we don't infinite-spin
        setLeadsLoaded(true)
      })
      .finally(() => setLeadsLoading(false))
  }, [activeTab, leadsLoaded, leadsLoading, site?.slug, site])

  // ── SEO load (fires once when SEO tab becomes active) ───────────────────────
  // useEffect is correct here — not a ref callback, which fires on every render.
  useEffect(() => {
    if (activeTab !== 'seo' || seoLoaded) return
    fetch(`/api/website/${id}/seo`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        if (d.title)          setSeoTitle(d.title)
        if (d.description)    setSeoDesc(d.description)
        if (d.ogTitle)        setOgTitle(d.ogTitle)
        if (d.ogDescription)  setOgDesc(d.ogDescription)
        setSeoLoaded(true)
      })
      .catch(() => {}) // non-fatal; user can still type and save
  }, [activeTab, seoLoaded, id])

  // ── SEO save ───────────────────────────────────────────────────────────────
  async function handleSeoSave() {
    if (!site) return
    const payload: Record<string, string> = {}
    if (seoTitle.trim())  payload.title       = seoTitle.trim()
    if (seoDesc.trim())   payload.description = seoDesc.trim()
    if (ogTitle.trim())   payload.ogTitle     = ogTitle.trim()
    if (ogDesc.trim())    payload.ogDescription = ogDesc.trim()
    if (gaId.trim())      payload.gaId        = gaId.trim()
    if (gscTag.trim())    payload.gscTag      = gscTag.trim()
    if (Object.keys(payload).length === 0) { showToast('Nothing to save — fill in at least one field'); return }
    setSeoSaving(true)
    try {
      const r = await fetch(`/api/website/${id}/seo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (r.ok) { setSeoSaved(true); showToast('✓ SEO tags saved') }
      else showToast('Save failed — try again')
    } catch { showToast('Save failed') }
    finally { setSeoSaving(false) }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirm(`Delete "${site?.name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const r = await fetch(`/api/user-websites/${id}`, { method: 'DELETE' })
      if (r.ok) {
        router.push('/my-work#websites')
      } else {
        showToast('Delete failed — please try again')
        setDeleting(false)
      }
    } catch {
      showToast('Delete failed — please try again')
      setDeleting(false)
    }
  }

  // ── Loading / not found ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
        <div style={{ width: 28, height: 28, border: '1px solid var(--border2)', borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!site) {
    return (
      <div className="page-pad" style={{ textAlign: 'center', padding: '80px 40px' }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: 'var(--cream)', marginBottom: 12 }}>Website not found</div>
        <Link href="/my-work#websites" style={{ color: BLUE, ...mono, fontSize: 11, textDecoration: 'underline' }}>← Back to My Work</Link>
      </div>
    )
  }

  const liveUrl = site.slug ? `/w/${site.slug}` : null
  const publicUrl = site.slug ? `brandsyndicate.io/w/${site.slug}` : null

  const tabs: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
    { key: 'overview',   label: 'Overview',   icon: <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.2"/><rect x="7" y="1" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="7" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.2"/><rect x="7" y="7" width="4" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.2"/></svg> },
    { key: 'domain',     label: 'Domain',     icon: <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 1C6 1 4 3.5 4 6s2 5 2 5M6 1c0 0 2 2.5 2 5s-2 5-2 5M1 6h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    { key: 'analytics',  label: 'Analytics',  icon: <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 10l3-4 2 2 3-5 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { key: 'seo',        label: 'SEO',        icon: <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/><path d="M8 8l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    { key: 'usage',      label: 'Usage',      icon: <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1" y="7" width="2" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2"/><rect x="5" y="4" width="2" height="7" rx="0.5" stroke="currentColor" strokeWidth="1.2"/><rect x="9" y="1" width="2" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.2"/></svg> },
    { key: 'leads', label: 'Leads', icon: <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M10 8c0 1.1-.9 2-2 2H4l-2 2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg> },
  ]

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--bg)' }}>
      <style>{`
        @media (max-width: 600px) {
          .ws-topbar-back { display: none; }
          .ws-topbar-divider { display: none; }
          .ws-view-live-btn { display: none; }
          .ws-tab-label { display: none; }
        }
        .ws-tabs::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 'var(--nav-h)', zIndex: 40 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, height: 52, flexWrap: 'nowrap', overflow: 'hidden' }}>
          <Link
            href="/my-work#websites"
            className="ws-topbar-back"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', ...mono, flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--cream)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M7 1L3 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            My Work
          </Link>
          <div className="ws-topbar-divider" style={{ width: 1, height: 16, background: 'var(--border)' }} />

          {/* Site icon */}
          <div style={{ width: 28, height: 28, borderRadius: 5, background: `linear-gradient(135deg,${BLUE}22,${BLUE}08)`, border: `1px solid ${BLUE}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="9" rx="1.2" stroke={BLUE} strokeWidth="1.3"/><path d="M4 13h6M7 10v3" stroke={BLUE} strokeWidth="1.3" strokeLinecap="round"/></svg>
          </div>

          {/* Name or rename input */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {renaming ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  autoFocus
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(false) }}
                  style={{ background: 'var(--surface2)', border: `1px solid ${BLUE}60`, color: 'var(--cream)', padding: '4px 10px', fontSize: 12, ...mono, borderRadius: 4, outline: 'none', width: '100%', maxWidth: 260 }}
                />
                <button onClick={handleRename} disabled={renameSaving} style={{ padding: '4px 10px', background: BLUE, color: '#000', border: 'none', fontSize: 9, ...mono, cursor: 'pointer', borderRadius: 4, opacity: renameSaving ? 0.6 : 1 }}>
                  {renameSaving ? '…' : '✓'}
                </button>
                <button onClick={() => setRenaming(false)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 9, ...mono, cursor: 'pointer', borderRadius: 4 }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, color: 'var(--cream)', fontFamily: "'Playfair Display',serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{site.name}</div>
                <button
                  onClick={() => { setRenameVal(site.name); setRenaming(true) }}
                  title="Rename website"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px 4px', borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = BLUE }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M8 2l2 2L4 10H2V8L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                </button>
              </div>
            )}
            {publicUrl && !renaming && <div style={{ fontSize: 9, color: BLUE, ...mono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{publicUrl}</div>}
          </div>

          {/* Status pill */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: site.isPublished ? '#27AE6015' : 'var(--surface2)', border: `1px solid ${site.isPublished ? '#27AE6040' : 'var(--border)'}`, fontSize: 8, ...mono, letterSpacing: '0.12em', textTransform: 'uppercase', color: site.isPublished ? '#27AE60' : 'var(--muted)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: site.isPublished ? '#27AE60' : 'var(--muted)', display: 'inline-block', flexShrink: 0 }} />
            {site.isPublished ? 'Live' : 'Draft'}
          </div>

          {/* View Live */}
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="ws-view-live-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: BLUE, color: '#000', border: 'none', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', ...mono, fontWeight: 700, cursor: 'pointer', borderRadius: 'var(--radius)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              View Live
            </a>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div className="ws-tabs" style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 32, marginTop: 24, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' as any }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); if (typeof window !== 'undefined') window.history.replaceState(null, '', `#${t.key}`) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                ...mono, cursor: 'pointer', background: 'none', border: 'none',
                borderBottom: activeTab === t.key ? `2px solid ${BLUE}` : '2px solid transparent',
                marginBottom: -1, color: activeTab === t.key ? BLUE : 'var(--muted)',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (activeTab !== t.key) (e.currentTarget as HTMLElement).style.color = 'var(--cream)' }}
              onMouseLeave={e => { if (activeTab !== t.key) (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
            >
              <span style={{ color: 'currentColor' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Stats */}
            <div>
              <div style={eyebrow()}>Site Overview</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
                <StatCard
                  label="Page Views"
                  value={overviewViews === null ? '…' : String(overviewViews)}
                  sub="All time"
                />
                <StatCard
                  label="Unique Visitors"
                  value={overviewVisitors === null ? '…' : String(overviewVisitors)}
                  sub="All time"
                />
                <StatCard
                  label="Leads"
                  value={leadsLoading ? '…' : String(leads.length)}
                  sub="Contact submissions"
                />
              </div>
            </div>

            {/* Leads panel — specific to this website */}
            <div style={{ background: 'var(--surface)', border: `1px solid ${GOLD}28`, borderRadius: 8, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <div>
                  <div style={eyebrow()}>Website Leads</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: 'var(--cream)', lineHeight: 1.1 }}>
                    {leadsLoading ? 'Loading…' : `${leads.length} lead${leads.length === 1 ? '' : 's'}`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5, lineHeight: 1.5 }}>
                    Contact submissions collected from this website only.
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab('leads'); if (typeof window !== 'undefined') window.history.replaceState(null, '', '#leads') }}
                  style={{ padding: '8px 14px', background: `${GOLD}15`, border: `1px solid ${GOLD}45`, color: GOLD, borderRadius: 6, cursor: 'pointer', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', ...mono, fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  Open Leads →
                </button>
              </div>

              {leadsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--muted)', ...mono }}>
                  <div style={{ width: 13, height: 13, border: '1px solid var(--border)', borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  Loading latest submissions…
                </div>
              ) : leads.length === 0 ? (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 7, padding: '13px 14px', color: 'var(--muted)', fontSize: 11, lineHeight: 1.55 }}>
                  No leads yet for this website. When someone submits the website contact form, it will appear here.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {leads.slice(0, 3).map((lead: any, idx: number) => (
                    <div key={lead.id || idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 7, background: 'rgba(255,255,255,0.018)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--cream)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name || 'Unnamed Lead'}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email || lead.phone || lead.company || 'No contact detail'}</div>
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--muted2)', ...mono, whiteSpace: 'nowrap' }}>
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                      </div>
                    </div>
                  ))}
                  {leads.length > 3 && (
                    <div style={{ fontSize: 10, color: GOLD, ...mono, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      +{leads.length - 3} more in Leads
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Management tools — visible for every website, including existing templates */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
              <div style={eyebrow()}>Website Management</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
                {[
                  { key: 'domain' as Tab, title: 'Domain Connection', desc: site.customDomain ? site.customDomain : 'Connect your own domain', color: GOLD },
                  { key: 'analytics' as Tab, title: 'Analytics', desc: 'Views, visitors and devices', color: BLUE },
                  { key: 'seo' as Tab, title: 'SEO Settings', desc: 'Google title, meta and indexing', color: '#27AE60' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setActiveTab(item.key); if (typeof window !== 'undefined') window.history.replaceState(null, '', `#${item.key}`) }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '14px 16px', background: `${item.color}12`, border: `1px solid ${item.color}35`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', minHeight: 92 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${item.color}20`; (e.currentTarget as HTMLElement).style.borderColor = `${item.color}60` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${item.color}12`; (e.currentTarget as HTMLElement).style.borderColor = `${item.color}35` }}
                  >
                    <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: item.color, ...mono, fontWeight: 700 }}>{item.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--cream)', lineHeight: 1.4 }}>{item.desc}</span>
                    <span style={{ marginTop: 'auto', fontSize: 9, color: item.color, ...mono, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Open →</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Meta info */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={eyebrow()}>Site Details</div>
              </div>
              {[
                { k: 'Type',     v: site.isGenerated ? 'AI Generated' : 'Template' },
                { k: 'Template', v: site.templateLabel || 'Custom AI' },
                { k: 'Domain',   v: site.customDomain || 'Not connected' },
                { k: 'Created',  v: new Date(site.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                { k: 'Updated',  v: new Date(site.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
              ].map((row, i, arr) => (
                <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 11 }}>
                  <span style={{ color: 'var(--muted)', ...mono, fontSize: 10, letterSpacing: '0.05em' }}>{row.k}</span>
                  <span style={{ color: 'var(--cream)', ...mono, fontSize: 10 }}>{row.v}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
              <div style={eyebrow()}>Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Rename */}
                <button
                  onClick={() => { setRenameVal(site.name); setRenaming(true) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: `${BLUE}12`, border: `1px solid ${BLUE}35`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${BLUE}20` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${BLUE}12` }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: `${BLUE}20`, border: `1px solid ${BLUE}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M8 2l2 2L4 10H2V8L8 2z" stroke={BLUE} strokeWidth="1.3" strokeLinejoin="round"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: BLUE, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>Rename Website</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', ...mono, letterSpacing: '0.05em' }}>Change the display name of this website</div>
                  </div>
                </button>

                {/* Publish / Unpublish */}
                <button
                  onClick={handleTogglePublish}
                  disabled={publishing}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: site.isPublished ? '#c0392b12' : '#27AE6012', border: `1px solid ${site.isPublished ? '#c0392b35' : '#27AE6035'}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s', opacity: publishing ? 0.6 : 1 }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: site.isPublished ? '#c0392b20' : '#27AE6020', border: `1px solid ${site.isPublished ? '#c0392b30' : '#27AE6030'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {site.isPublished ? (
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="#e74c3c" strokeWidth="1.3"/><path d="M5 5l4 4M9 5L5 9" stroke="#e74c3c" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="#27AE60" strokeWidth="1.3"/><path d="M5 7l2 2 3-3" stroke="#27AE60" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: site.isPublished ? '#e74c3c' : '#27AE60', fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>
                      {publishing ? 'Updating…' : site.isPublished ? 'Unpublish Website' : 'Publish Website'}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', ...mono, letterSpacing: '0.05em' }}>
                      {site.isPublished ? 'Take offline, URL will return 404' : 'Make visible to the public at your URL'}
                    </div>
                  </div>
                </button>

                {/* View live */}
                {liveUrl && (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: `${BLUE}12`, border: `1px solid ${BLUE}35`, borderRadius: 8, textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${BLUE}20` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${BLUE}12` }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: `${BLUE}20`, border: `1px solid ${BLUE}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M9 1H4M9 1V6" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: BLUE, fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>View Live Site</div>
                      <div style={{ fontSize: 9, color: 'var(--muted)', ...mono, letterSpacing: '0.05em' }}>{publicUrl}</div>
                    </div>
                    <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M9 1H4M9 1V6" stroke={BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>
                )}

                {/* Danger zone */}
                <div style={{ marginTop: 8, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <div style={{ ...label, color: '#e74c3c', marginBottom: 10 }}>Danger Zone</div>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ padding: '9px 18px', background: '#c0392b12', border: '1px solid #c0392b40', color: '#e74c3c', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', ...mono, fontWeight: 600, cursor: 'pointer', borderRadius: 'var(--radius)', opacity: deleting ? 0.6 : 1, transition: 'background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#c0392b22' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#c0392b12' }}
                  >{deleting ? 'Deleting…' : 'Delete Website'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DOMAIN TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'domain' && (
          <div style={{ maxWidth: 600 }}>
            <div style={eyebrow()}>Domain Connection</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: 'var(--cream)', marginBottom: 8 }}>Connect Your Domain</h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28 }}>
              {publicUrl ? <>Your site is live at <span style={{ color: BLUE, ...mono }}>{publicUrl}</span>. Connect a custom domain to brand it as your own.</> : 'Publish your website first to connect a custom domain.'}
            </p>

            {site.slug ? (
              <>
                <div style={{ marginBottom: 8 }}>
                  <div style={label}>Custom Domain</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={domainInput}
                      onChange={e => setDomainInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleDomainConnect() }}
                      placeholder="yourdomain.com"
                      style={{ flex: 1, background: 'var(--surface)', border: `1px solid ${domainStatus === 'connected' ? '#27AE6060' : domainStatus === 'error' ? '#c0392b60' : 'var(--border2)'}`, color: 'var(--cream)', padding: '10px 14px', fontSize: 12, ...mono, borderRadius: 'var(--radius)', outline: 'none' }}
                    />
                    <button
                      onClick={handleDomainConnect}
                      disabled={domainStatus === 'connecting' || !domainInput.trim()}
                      style={{ padding: '10px 18px', background: domainStatus === 'connected' ? '#27AE60' : BLUE, color: '#000', border: 'none', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', ...mono, fontWeight: 700, cursor: 'pointer', borderRadius: 'var(--radius)', whiteSpace: 'nowrap', opacity: domainStatus === 'connecting' ? 0.6 : 1 }}
                    >
                      {domainStatus === 'connecting' ? '…' : domainStatus === 'connected' ? '✓ Connected' : 'Connect'}
                    </button>
                  </div>
                </div>
                {domainMsg && <div style={{ fontSize: 10, color: domainStatus === 'connected' ? '#27AE60' : '#e74c3c', ...mono, lineHeight: 1.5, marginBottom: 16 }}>{domainMsg}</div>}

                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginTop: 20 }}>
                  <div style={{ ...label, marginBottom: 12 }}>DNS Setup Instructions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { type: 'CNAME', name: 'www', value: 'brandsyndicate.io' },
                      { type: 'A',     name: '@',   value: '76.76.21.21' },
                    ].map(row => (
                      <div key={row.type} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 10, ...mono, padding: '8px 0', borderBottom: row.type === 'CNAME' ? '1px solid var(--border)' : 'none' }}>
                        <span style={{ color: BLUE, padding: '2px 7px', background: `${BLUE}15`, borderRadius: 3, fontSize: 9, flexShrink: 0 }}>{row.type}</span>
                        <span style={{ color: 'var(--muted)', width: 30, flexShrink: 0 }}>{row.name}</span>
                        <span style={{ color: 'var(--cream)' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 10, color: 'var(--muted2)', ...mono, lineHeight: 1.7 }}>
                    Add these records in your registrar (GoDaddy, Namecheap, etc.) → DNS Management.<br />
                    Propagation takes 5 min to 48 hours.
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
                <div style={{ fontSize: 12, marginBottom: 16 }}>Publish your website first to connect a domain.</div>
                <a href={`/generate?websiteId=${site.id}`} style={{ color: BLUE, ...mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>Open Editor →</a>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ────────────────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <AnalyticsPanel
            siteId={site.id}
            liveUrl={liveUrl}
            isPublished={site.isPublished}
            slug={site.slug}
          />
        )}

        {/* ── SEO TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'seo' && (
          <div style={{ maxWidth: 620 }}>
            <div style={eyebrow()}>SEO & Indexing</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: 'var(--cream)', marginBottom: 8 }}>Search Engine Optimization</h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28 }}>Control how your website appears in Google search results and on social media.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* ── Page Title ── */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <div style={label}>Page Title <span style={{ color: 'var(--muted2)' }}>— shown in browser tab + Google results</span></div>
                <input
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder="e.g. Adore Jewellery — Handcrafted Gold & Silver Jewellery"
                  maxLength={70}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--cream)', padding: '9px 14px', fontSize: 12, ...mono, borderRadius: 'var(--radius)', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 9, color: 'var(--muted)', ...mono }}>Ideal: 50–60 characters</span>
                  <span style={{ fontSize: 9, color: seoTitle.length > 60 ? '#e74c3c' : 'var(--muted)', ...mono }}>{seoTitle.length}/70</span>
                </div>
              </div>

              {/* ── Meta Description ── */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <div style={label}>Meta Description <span style={{ color: 'var(--muted2)' }}>— shown below title in Google</span></div>
                <textarea
                  value={seoDesc}
                  onChange={e => setSeoDesc(e.target.value)}
                  placeholder="e.g. Shop handcrafted gold, silver and diamond jewellery made for modern women. Free shipping across India."
                  maxLength={160}
                  rows={3}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--cream)', padding: '9px 14px', fontSize: 12, ...mono, borderRadius: 'var(--radius)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  <span style={{ fontSize: 9, color: 'var(--muted)', ...mono }}>Ideal: 120–155 characters</span>
                  <span style={{ fontSize: 9, color: seoDesc.length > 155 ? '#e74c3c' : 'var(--muted)', ...mono }}>{seoDesc.length}/160</span>
                </div>
              </div>

              {/* ── OG / Social Preview ── */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <div style={label}>Social Preview (Open Graph) <span style={{ color: 'var(--muted2)' }}>— WhatsApp, LinkedIn, Twitter shares</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  <input
                    value={ogTitle}
                    onChange={e => setOgTitle(e.target.value)}
                    placeholder="OG Title — leave blank to use Page Title"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--cream)', padding: '9px 14px', fontSize: 12, ...mono, borderRadius: 'var(--radius)', outline: 'none' }}
                  />
                  <textarea
                    value={ogDesc}
                    onChange={e => setOgDesc(e.target.value)}
                    placeholder="OG Description — leave blank to use Meta Description"
                    rows={2}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--cream)', padding: '9px 14px', fontSize: 12, ...mono, borderRadius: 'var(--radius)', outline: 'none', resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>
              </div>

              {/* ── Google Search Console ── */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <div style={label}>Google Search Console Verification</div>
                <input
                  value={gscTag}
                  onChange={e => setGscTag(e.target.value)}
                  placeholder="Paste meta tag content value from Search Console"
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--cream)', padding: '9px 14px', fontSize: 12, ...mono, borderRadius: 'var(--radius)', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: 9, color: 'var(--muted)', ...mono, marginTop: 6 }}>Search Console → Settings → Ownership verification → HTML tag → copy content value only</div>
              </div>

              {/* ── GA4 ── */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                <div style={label}>Google Analytics GA4 <span style={{ color: 'var(--muted2)' }}>— optional, built-in analytics always on</span></div>
                <input
                  value={gaId}
                  onChange={e => setGaId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--cream)', padding: '9px 14px', fontSize: 12, ...mono, borderRadius: 'var(--radius)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* ── Sitemap + URL ── */}
              {site.slug && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                  <div style={label}>Sitemap URL — submit to Google Search Console</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <code style={{ flex: 1, fontSize: 10, color: BLUE, ...mono, background: `${BLUE}10`, padding: '6px 10px', borderRadius: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {typeof window !== 'undefined' ? window.location.origin : 'https://brandsyndicate.in'}/api/website/{site.id}/sitemap
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/api/website/${site.id}/sitemap`); showToast('Sitemap URL copied!') }}
                      style={{ padding: '5px 10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 9, ...mono, cursor: 'pointer', borderRadius: 4, flexShrink: 0 }}
                    >Copy</button>
                  </div>
                  {liveUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code style={{ flex: 1, fontSize: 10, color: GOLD, ...mono, background: `${GOLD}10`, padding: '6px 10px', borderRadius: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {typeof window !== 'undefined' ? window.location.origin : 'https://brandsyndicate.in'}{liveUrl}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${liveUrl}`); showToast('URL copied!') }}
                        style={{ padding: '5px 10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 9, ...mono, cursor: 'pointer', borderRadius: 4, flexShrink: 0 }}
                      >Copy</button>
                    </div>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: BLUE, ...mono, textDecoration: 'underline' }}>
                      Open Google Search Console →
                    </a>
                  </div>
                </div>
              )}

              {/* ── Save button ── */}
              <button
                onClick={handleSeoSave}
                disabled={seoSaving}
                style={{ padding: '11px 24px', background: BLUE, color: '#000', border: 'none', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', ...mono, fontWeight: 700, cursor: seoSaving ? 'not-allowed' : 'pointer', borderRadius: 'var(--radius)', opacity: seoSaving ? 0.6 : 1, alignSelf: 'flex-start' }}
              >
                {seoSaving ? 'Saving…' : seoSaved ? '✓ Saved' : 'Save SEO Settings'}
              </button>

            </div>
          </div>
        )}

        {/* ── USAGE TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'usage' && (
          <div style={{ maxWidth: 600 }}>
            <div style={eyebrow()}>Usage & Limits</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: 'var(--cream)', marginBottom: 24 }}>Plan Usage</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Storage',   used: 1,    total: 1024,  unit: 'MB' },
                { label: 'Bandwidth', used: 0,    total: 10240, unit: 'MB/mo' },
                { label: 'AI Edits',  used: 0,    total: 50,    unit: 'edits/mo' },
              ].map(({ label: l, used, total, unit }) => (
                <div key={l}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', ...mono, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>{l}</span>
                    <span style={{ fontSize: 9, color: 'var(--muted)', ...mono }}>{used} / {total} {unit}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((used / total) * 100, 100)}%`, background: BLUE, borderRadius: 2, transition: 'width 0.4s' }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div style={eyebrow()}>Plan Includes</div>
              {[
                '1 GB file storage per site',
                '10 GB/month bandwidth',
                '50 AI edits/month',
                '500 lead form submissions/month',
                'Free SSL certificate',
                'brandsyndicate.io subdomain',
                'Built-in analytics (no tracking code needed)',
              ].map(f => (
                <div key={f} style={{ fontSize: 10, color: 'var(--muted)', ...mono, marginBottom: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: '#27AE60', flexShrink: 0 }}>✓</span>
                  {f}
                </div>
              ))}
            </div>

            <a
              href="/billing"
              style={{ display: 'block', textAlign: 'center', padding: '11px', background: `${GOLD}15`, border: `1px solid ${GOLD}40`, color: GOLD, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', ...mono, fontWeight: 600, cursor: 'pointer', borderRadius: 'var(--radius)', textDecoration: 'none' }}
            >
              Upgrade to Pro →
            </a>
          </div>
        )}

        {/* ── LEADS TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'leads' && (
          <div style={{ maxWidth: 800 }}>
            <div style={eyebrow()}>Contact Submissions</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: 'var(--cream)', marginBottom: 8 }}>Website Leads</h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Contact form submissions and booking requests from your website, newest first.
            </p>

            {leadsLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--muted)', ...mono, padding: '20px 0' }}>
                <div style={{ width: 14, height: 14, border: '1px solid var(--border)', borderTopColor: BLUE, borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                Loading leads…
              </div>
            )}

            {!leadsLoaded && !leadsLoading && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
                {site?.slug ? 'Could not load leads — click ↺ Refresh to retry.' : 'Publish your website first to start collecting leads.'}
              </div>
            )}

            {leadsLoaded && leads.length === 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
                {site?.slug
                  ? 'No contact submissions yet. Share your website link to start collecting leads.'
                  : 'Publish your website first to start collecting leads.'}
              </div>
            )}

            {leadsLoaded && leads.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>
                    {leads.length} submission{leads.length !== 1 ? 's' : ''}
                  </div>
                  <ActionBtn variant="secondary" onClick={() => {
                    if (!site?.slug) return
                    setLeadsLoaded(false)
                    setLeadsLoading(true)
                    fetch(`/api/leads?slug=${site.slug}`)
                      .then(r => r.ok ? r.json() : Promise.reject(r.status))
                      .then(d => { setLeads(d.contacts || []); setLeadsLoaded(true) })
                      .catch(() => { setLeadsLoaded(true) })
                      .finally(() => setLeadsLoading(false))
                  }}>↺ Refresh</ActionBtn>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {leads.map((lead: any, i: number) => {
                    const isBooking = (lead.sourceSlug || '').startsWith('booking:')
                    return (
                    <div key={lead.id || i} style={{ background: 'var(--surface)', border: `1px solid ${isBooking ? GOLD + '50' : 'var(--border)'}`, borderRadius: 8, padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, alignItems: 'start' }}>
                      <div>
                        <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>
                          {isBooking ? <span style={{ color: GOLD }}>↗ Booking</span> : 'Contact'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--cream)', fontWeight: 500 }}>{lead.name || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Email</div>
                        <a href={`mailto:${lead.email}`} style={{ fontSize: 12, color: BLUE, textDecoration: 'none' }}>{lead.email || '—'}</a>
                      </div>
                      {lead.phone && (
                        <div>
                          <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Phone</div>
                          <a href={`tel:${lead.phone}`} style={{ fontSize: 12, color: '#25D366', textDecoration: 'none' }}>{lead.phone}</a>
                        </div>
                      )}
                      {lead.company && (
                        <div>
                          <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Company</div>
                          <div style={{ fontSize: 12, color: 'var(--cream)' }}>{lead.company}</div>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>Submitted</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>
                          {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                        <a href={`mailto:${lead.email}`} style={{ padding: '5px 12px', background: `${BLUE}15`, border: `1px solid ${BLUE}40`, color: BLUE, fontSize: 9, fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 4, textDecoration: 'none', fontWeight: 600 }}>Reply</a>
                        {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', fontSize: 9, fontFamily: 'DM Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 4, textDecoration: 'none', fontWeight: 600 }}>WhatsApp</a>}
                      </div>
                    </div>
                  )})}
                </div>
                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => {
                      const headers = ['Name', 'Email', 'Phone', 'Company', 'Date']
                      const rows = leads.map((l: any) => [l.name || '', l.email || '', l.phone || '', l.company || '', new Date(l.createdAt).toLocaleDateString('en-IN')])
                      const csv = [headers, ...rows].map(r => r.map((c: string) => `"${c.replace(/"/g,'""')}"`).join(',')).join('\n')
                      const a = document.createElement('a')
                      a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
                      a.download = `leads-${site?.slug || 'website'}.csv`
                      a.click()
                    }}
                    style={{ padding: '8px 18px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 9, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 4 }}>
                    ↓ Export CSV
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ height: 60 }} />
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface2)', border: '1px solid var(--border2)', borderLeft: `3px solid ${BLUE}`, padding: '12px 20px', fontSize: 12, color: 'var(--cream)', zIndex: 9999, borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
