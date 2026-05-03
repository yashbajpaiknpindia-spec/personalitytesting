'use client'

// All dependencies inlined — no external @/hooks or @/components imports needed.

import { useState, useCallback, useEffect, ReactNode } from 'react'
import Link from 'next/link'

// ── Inlined: useDashboard ─────────────────────────────────────────────────

interface DashboardStats {
  totalViews: number; portfolioViews: number; cardViews: number
  totalLeads: number; totalGenerations: number; totalExports: number
}
interface PortfolioInfo {
  slug: string; isPublished: boolean; viewCount: number; publishedAt: string; url: string
}
interface RecentActivity { type: string; createdAt: string; metadata: Record<string, unknown> | null }
interface DashboardOverview {
  stats: DashboardStats; portfolio: PortfolioInfo | null
  recentActivity: RecentActivity[]; recentLeads: unknown[]
}

function useDashboardOverview() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/dashboard/overview')
      if (!res.ok) throw new Error('Failed to load dashboard')
      setData(await res.json())
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { refresh() }, [refresh])
  return { data, loading, error, refresh }
}

interface Contact {
  id: string; name: string; email: string; phone: string | null
  company: string | null; sourceSlug: string | null; createdAt: string
}
interface LeadsResponse {
  contacts: Contact[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

function useLeads(page = 1) {
  const [data, setData] = useState<LeadsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/dashboard/leads?page=${page}&limit=20`)
      if (!res.ok) throw new Error('Failed to load leads')
      setData(await res.json())
    } catch (err) { setError(err instanceof Error ? err.message : 'Unknown error') }
    finally { setLoading(false) }
  }, [page])
  useEffect(() => { refresh() }, [refresh])
  return { data, loading, error, refresh }
}

// ── Inlined: LeadsExportButtons ───────────────────────────────────────────

function LeadsExportButtons() {
  const [csvLoading, setCsvLoading] = useState(false)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetUrl, setSheetUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function exportCSV() {
    setCsvLoading(true); setError(null)
    try {
      const res = await fetch('/api/leads/export/csv')
      if (!res.ok) throw new Error('CSV export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
      // BUG FIX #33: Append to DOM for mobile browser compatibility
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) { setError(err instanceof Error ? err.message : 'Export failed') }
    finally { setCsvLoading(false) }
  }

  async function exportGoogle() {
    setSheetLoading(true); setError(null); setSheetUrl(null)
    try {
      const res = await fetch('/api/leads/export/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Google Sheets export failed')
      setSheetUrl(data.spreadsheetUrl)
    } catch (err) { setError(err instanceof Error ? err.message : 'Export failed') }
    finally { setSheetLoading(false) }
  }

  const btn: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)',
    padding: '7px 14px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
    cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace",
    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <button onClick={exportCSV} disabled={csvLoading} style={btn}>{csvLoading ? '⏳' : '⬇'} {csvLoading ? 'Exporting…' : 'Export CSV'}</button>
      <button onClick={exportGoogle} disabled={sheetLoading} style={btn}>{sheetLoading ? '⏳' : '📊'} {sheetLoading ? 'Exporting…' : 'Export to Google Sheets'}</button>
      {sheetUrl && <a href={sheetUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.06em' }}>Open Sheet →</a>}
      {error && <span style={{ fontSize: 11, color: '#E05252' }}>{error}</span>}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

const EVENT_LABELS: Record<string, string> = {
  PORTFOLIO_VIEW: 'Portfolio view', CARD_VIEW: 'Card view',
  RESUME_DOWNLOAD: 'Resume download', PRESENTATION_VIEW: 'Presentation view', LEAD_CAPTURED: 'New lead captured',
}

// ── Leads tab ─────────────────────────────────────────────────────────────

function LeadsTab() {
  const [page, setPage] = useState(1)
  const { data, loading, error } = useLeads(page)
  if (loading) return <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>Loading leads…</div>
  if (error) return <div style={{ padding: '60px 0', textAlign: 'center', color: '#E05252', fontSize: 12 }}>{error}</div>
  const contacts = data?.contacts ?? []
  const pagination = data?.pagination
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: 'var(--cream)' }}>Leads ({pagination?.total ?? 0})</h2>
        <LeadsExportButtons />
      </div>
      {contacts.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📬</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--cream)', marginBottom: 8 }}>No leads yet</div>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Publish your portfolio and share your digital card to start capturing leads.</p>
        </div>
      ) : (
        <>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 100px', borderBottom: '1px solid var(--border)', padding: '10px 20px', background: 'var(--surface2)' }}>
              {['Name', 'Email', 'Company', 'Source', 'Date'].map(h => (
                <div key={h} style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{h}</div>
              ))}
            </div>
            {contacts.map((c, i) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 100px', padding: '12px 20px', borderBottom: i < contacts.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{c.email}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.company || '—'}</div>
                <div style={{ fontSize: 11, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>{c.sourceSlug || '—'}</div>
                <div style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>{timeAgo(c.createdAt)}</div>
              </div>
            ))}
          </div>
          {pagination && pagination.pages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 14px', fontSize: 11, cursor: page === 1 ? 'not-allowed' : 'pointer', borderRadius: 2, opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>{page} / {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', padding: '6px 14px', fontSize: 11, cursor: page === pagination.pages ? 'not-allowed' : 'pointer', borderRadius: 2, opacity: page === pagination.pages ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Brand tab ─────────────────────────────────────────────────────────────

function BrandTab() {
  const { data, loading, error } = useDashboardOverview()
  const [copied, setCopied] = useState(false)
  function copyUrl() {
    if (!data?.portfolio?.url) return
    navigator.clipboard.writeText(data.portfolio.url)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  if (loading) return <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>Loading…</div>
  if (error) return <div style={{ padding: '60px 0', textAlign: 'center', color: '#E05252', fontSize: 12 }}>{error}</div>
  const stats = data?.stats; const portfolio = data?.portfolio
  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: 'var(--cream)', marginBottom: 24 }}>Brand Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[{ val: stats?.totalViews ?? 0, label: 'Total Views' }, { val: stats?.totalLeads ?? 0, label: 'Total Leads' }, { val: stats?.totalGenerations ?? 0, label: 'Assets Generated' }, { val: stats?.totalExports ?? 0, label: 'Downloads' }].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
            <div style={{ fontSize: 32, fontFamily: "'Playfair Display', serif", color: 'var(--cream)', marginBottom: 6 }}>{s.val}</div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>Live Portfolio</div>
        {portfolio ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: portfolio.isPublished ? '#2E7D52' : '#A09890', display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: portfolio.isPublished ? '#6BBFA0' : 'var(--muted)' }}>{portfolio.isPublished ? 'Published' : 'Unpublished'}</span>
              <span style={{ fontSize: 11, color: 'var(--muted2)', marginLeft: 8 }}>{portfolio.viewCount} total views</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input readOnly value={portfolio.url} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', padding: '8px 12px', fontSize: 12, borderRadius: 2, fontFamily: "'DM Mono', monospace", outline: 'none' }} />
              <button onClick={copyUrl} style={{ background: 'var(--gold)', color: '#000', border: 'none', padding: '8px 14px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2, fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>{copied ? '✓' : 'Copy'}</button>
              <a href={portfolio.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontSize: 12, textDecoration: 'none' }}>→</a>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>No portfolio published yet.</div>
            <Link href="/generate" style={{ background: 'var(--gold)', color: '#000', padding: '8px 20px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)', display: 'inline-block' }}>Generate &amp; Publish</Link>
          </div>
        )}
      </div>
      {(data?.recentActivity ?? []).length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>Recent Activity</div>
          {(data?.recentActivity ?? []).map((ev, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < (data?.recentActivity.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--text)' }}>{EVENT_LABELS[ev.type] ?? ev.type}</div>
              <div style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>{timeAgo(ev.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab shell ─────────────────────────────────────────────────────────────

const TABS = [{ key: 'usage', label: 'Usage' }, { key: 'leads', label: 'Leads' }, { key: 'brand', label: 'Brand' }] as const
type TabKey = typeof TABS[number]['key']
interface Props { usageContent: ReactNode; isPro?: boolean }

export default function AnalyticsTabs({ usageContent, isPro = false }: Props) {
  const [tab, setTab] = useState<TabKey>('usage')
  return (
    <>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 32, marginTop: -12 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ background: 'none', border: 'none', padding: '10px 20px', fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', color: tab === t.key ? 'var(--gold)' : 'var(--muted)', borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent', marginBottom: -1, fontFamily: "'DM Mono', monospace", transition: 'all 0.15s' }}>{t.label}</button>
        ))}
      </div>
      {tab === 'usage' && <>{usageContent}</>}
      {tab === 'leads' && (
        isPro ? <LeadsTab /> : (
          <div style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--cream)', marginBottom: 10 }}>Leads — Pro Feature</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Upgrade to Pro to view and export your captured leads.</p>
            <a href="/billing" style={{ display: 'inline-block', background: 'var(--gold)', color: '#000', padding: '9px 24px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Upgrade to Pro</a>
          </div>
        )
      )}
      {tab === 'brand' && <BrandTab />}
    </>
  )
}
