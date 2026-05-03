'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

const ADMIN_EMAIL = 'yashbajpaiknpindia@gmail.com'
const GOLD = '#C9A84C'
const RED = '#C0392B'
const GREEN = '#27AE60'
const BLUE = '#3498DB'
const MONO = "'DM Mono', monospace"
const SERIF = "'Playfair Display', serif"
const SANS = "'DM Sans', sans-serif"

type Tab = 'overview' | 'costs' | 'users' | 'logs' | 'notifications' | 'analytics' | 'pricing' | 'settings' | 'database'

function fmt(n: number, d = 2) { return n.toFixed(d) }
function fmtInr(n: number) { return `₹${n < 0.01 && n > 0 ? n.toFixed(6) : n < 1 ? n.toFixed(4) : n.toFixed(2)}` }
function fmtUsd(n: number) { return `$${n < 0.001 && n > 0 ? n.toFixed(6) : n.toFixed(4)}` }
function fmtNum(n: number) { return n.toLocaleString('en-IN') }
function fmtDate(d: string) { return new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) }
function fmtDuration(ms: number | null) {
  if (!ms || ms <= 0) return '—'
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function Stat({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '18px 22px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontFamily: SERIF, color: color || 'var(--cream)', fontWeight: 400, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, fontFamily: MONO }}>{sub}</div>}
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ fontSize: 9, padding: '2px 7px', background: `${color}22`, color, borderRadius: 1, fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 16, height: 1, background: GOLD }} />{title}
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
  const [logPage, setLogPage] = useState(1)
  const [toast, setToast] = useState('')
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

  // Notifications
  const [notifications, setNotifications] = useState<Record<string, any>[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifForm, setNotifForm] = useState({ title: '', body: '', imageUrl: '', targetUserId: '' })
  const [notifSending, setNotifSending] = useState(false)
  const [notifPreview, setNotifPreview] = useState(false)

  // Page analytics
  const [pageAnalytics, setPageAnalytics] = useState<Record<string, any> | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsRange, setAnalyticsRange] = useState<'7' | '30' | '90'>('30')
  const [analyticsError, setAnalyticsError] = useState('')

  // Global generation limits (admin-controlled per plan)
  const [globalLimits, setGlobalLimits] = useState({
    free:  { daily: '3',  weekly: '',   monthly: '30' },
    pro:   { daily: '',   weekly: '',   monthly: ''   },
    team:  { daily: '',   weekly: '',   monthly: ''   },
  })
  const [limitsMsg, setLimitsMsg] = useState('')
  const [limitsSaving, setLimitsSaving] = useState(false)

  // Pricing plans
  const [pricingPlans, setPricingPlans] = useState<Record<string, any>[]>([])
  const [pricingLoading, setPricingLoading] = useState(false)

  // Database export/import state
  const [dbExportLoading, setDbExportLoading] = useState(false)
  const [dbExportTables, setDbExportTables] = useState<string[]>([])
  const [dbImportLoading, setDbImportLoading] = useState(false)
  const [dbImportResult, setDbImportResult] = useState<Record<string, any> | null>(null)
  const [dbImportError, setDbImportError] = useState<string | null>(null)
  const dbImportRef = useRef<HTMLInputElement>(null)
  const [editingPlan, setEditingPlan] = useState<Record<string, any> | null>(null)
  const [planFeaturesText, setPlanFeaturesText] = useState('')

  const isAdmin = session?.user?.email === ADMIN_EMAIL || (session?.user as any)?.role === 'ADMIN'
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const loadStats = useCallback(async () => {
    const r = await fetch('/api/admin/stats')
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
    try {
      const r = await fetch(`/api/admin/logs?${params}`)
      if (r.ok) setLogs(await r.json())
      else setLogs({ logs: [], total: 0, page: 1, pages: 1, _error: `Server error ${r.status}` })
    } catch {
      setLogs({ logs: [], total: 0, page: 1, pages: 1, _error: 'Network error' })
    }
  }, [logPage, logService])

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
      const r = await fetch(`/api/admin/page-analytics?days=${analyticsRange}`)
      if (r.ok) {
        const d = await r.json()
        if (d._error) setAnalyticsError(d._error)
        setPageAnalytics(d)
      } else {
        setAnalyticsError(`Server error ${r.status}`)
      }
    } catch (e) {
      setAnalyticsError('Network error — check console')
    }
    setAnalyticsLoading(false)
  }, [analyticsRange])

  const loadPricingPlans = useCallback(async () => {
    setPricingLoading(true)
    const r = await fetch('/api/admin/pricing')
    if (r.ok) { const d = await r.json(); setPricingPlans(d.plans || []) }
    setPricingLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && !isAdmin) router.push('/generate')
  }, [status, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    loadStats().finally(() => setLoading(false))
  }, [isAdmin, loadStats])

  useEffect(() => { if (tab === 'users' && isAdmin) loadUsers() }, [tab, userPage, userSearch, isAdmin, loadUsers])
  useEffect(() => { if (tab === 'logs' && isAdmin) loadLogs() }, [tab, logPage, logService, isAdmin, loadLogs])
  useEffect(() => { if (tab === 'notifications' && isAdmin) loadNotifications() }, [tab, isAdmin, loadNotifications])
  useEffect(() => { if (tab === 'analytics' && isAdmin) loadPageAnalytics() }, [tab, analyticsRange, isAdmin, loadPageAnalytics])
  useEffect(() => { if (tab === 'pricing' && isAdmin) loadPricingPlans() }, [tab, isAdmin, loadPricingPlans])

  const userAction = async (action: string, userId: string, extra: Record<string, unknown> = {}) => {
    const r = await fetch('/api/admin/user', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action, ...extra }) })
    if (r.ok) { showToast('✓ Done'); loadUsers() }
    else { const d = await r.json(); showToast('✗ ' + d.error) }
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

  const saveUserLimits = async () => {
    if (!editUser) return
    await userAction('set_limits', editUser.id, { daily: editLimits.daily || null, monthly: editLimits.monthly || null, yearly: editLimits.yearly || null })
    setEditUser(null)
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

  const savePricingPlan = async () => {
    if (!editingPlan) return
    const features = planFeaturesText.split('\n').map((s: string) => s.trim()).filter(Boolean)
    const payload = { ...editingPlan, features: JSON.stringify(features) }
    const r = await fetch('/api/admin/pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (r.ok) { showToast('✓ Plan updated'); setEditingPlan(null); loadPricingPlans() }
    else showToast('✗ Failed to save plan')
  }

  if (status === 'loading' || loading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 24, height: 24, border: '1px solid var(--border)', borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>
  }
  if (!isAdmin) return null

  const s = stats; const c = s?.claude; const p = s?.pexels

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--cream)', fontSize: 13, borderRadius: 2, fontFamily: SANS }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'costs', label: 'API Costs' }, { id: 'users', label: 'Users' },
    { id: 'logs', label: 'Logs' }, { id: 'notifications', label: 'Notifications' },
    { id: 'analytics', label: 'Page Analytics' }, { id: 'pricing', label: 'Pricing Plans' },
    { id: 'database', label: '🗄 Database' }, { id: 'settings', label: 'Settings' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--cream)' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 1000, background: toast.startsWith('✓') ? '#1a3a2a' : '#3a1a1a', border: `1px solid ${toast.startsWith('✓') ? GREEN : RED}`, padding: '12px 20px', borderRadius: 2, fontSize: 13, fontFamily: MONO, color: toast.startsWith('✓') ? '#6FCF97' : '#E57373', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>{toast}</div>}

      {/* Edit Limits Modal */}
      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 2, padding: 32, width: '100%', maxWidth: 420 }}>
            <div style={{ fontFamily: SERIF, fontSize: 20, color: 'var(--cream)', marginBottom: 4 }}>Generation Limits</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, marginBottom: 24 }}>{editUser.email}</div>
            {(['daily', 'monthly', 'yearly'] as const).map(period => (
              <div key={period} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>{period} Limit <span style={{ color: GOLD }}>(blank = plan default)</span></label>
                <input type="number" min="0" value={editLimits[period]} onChange={e => setEditLimits(l => ({ ...l, [period]: e.target.value }))} placeholder={`Current: ${editUser[period + 'GenLimit'] ?? 'plan default'}`} style={inputStyle} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={saveUserLimits} style={{ flex: 1, padding: '10px 0', background: GOLD, color: '#000', border: 'none', borderRadius: 2, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS }}>Save</button>
              <button onClick={() => setEditUser(null)} style={{ flex: 1, padding: '10px 0', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 2, fontSize: 11, cursor: 'pointer', fontFamily: SANS }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pricing Plan Modal */}
      {editingPlan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 2, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontFamily: SERIF, fontSize: 20, color: 'var(--cream)', marginBottom: 4 }}>Edit Plan — {editingPlan.planId}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO, marginBottom: 24 }}>Changes reflect immediately on billing page</div>
            {([['name', 'Display Name', 'Pro'], ['price', 'Price', '₹1,499'], ['period', 'Period', '/month']] as const).map(([key, label, ph]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>{label}</label>
                <input type="text" value={editingPlan[key] || ''} onChange={e => setEditingPlan((prev: any) => ({ ...prev, [key]: e.target.value }))} placeholder={ph} style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>Features <span style={{ color: GOLD }}>(one per line)</span></label>
              <textarea value={planFeaturesText} onChange={e => setPlanFeaturesText(e.target.value)} rows={7} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={editingPlan.isVisible !== false} onChange={e => setEditingPlan((p: any) => ({ ...p, isVisible: e.target.checked }))} />
                <span style={{ color: 'var(--cream)' }}>Visible on billing page</span>
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

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: RED, fontFamily: MONO, marginBottom: 12 }}><div style={{ width: 20, height: 1, background: RED }} /> Secure Admin · {ADMIN_EMAIL}</div>
            <h1 style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 400, color: 'var(--cream)', margin: 0 }}>BrandSyndicate Admin</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* USD/INR Rate card */}
            <div style={{ textAlign: 'right', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '12px 20px' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 2 }}>USD / INR Rate</div>
              <div style={{ fontSize: 22, fontFamily: SERIF, color: GOLD }}>₹{usdToInr.toFixed(2)}</div>
              <LivePill source={rateSource} />
            </div>
            {/* Theme toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO }}>Theme</div>
              <ThemeToggle />
            </div>
            {/* Back to App */}
            <Link
              href="/generate"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 2, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--muted)', fontFamily: MONO, textDecoration: 'none',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--cream)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              App
            </Link>
            {/* Logout */}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', background: 'transparent', border: `1px solid ${RED}40`,
                borderRadius: 2, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: RED, fontFamily: MONO, cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${RED}15`; (e.currentTarget as HTMLButtonElement).style.borderColor = RED }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = `${RED}40` }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 40, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 16px', background: 'none', border: 'none', borderBottom: tab === t.id ? `2px solid ${GOLD}` : '2px solid transparent', color: tab === t.id ? GOLD : 'var(--muted)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: MONO, marginBottom: -1, whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && s && (
          <>
            <Section title="Platform Overview">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 16 }}>
                <Stat label="Total Users" value={fmtNum(s.overview.totalUsers)} />
                <Stat label="Completed Gens" value={fmtNum(s.overview.totalGenerations)} />
                <Stat label="Failed" value={fmtNum(s.overview.failedGenerations)} color={RED} />
                <Stat label="Flagged" value={fmtNum(s.overview.flaggedGenerations)} color="#E67E22" />
                <Stat label="Pexels Calls" value={fmtNum(p.total)} sub={`${p.today} today`} />
                <Stat label="Claude Calls" value={fmtNum(c.allTime.calls)} sub={`${c.today.calls} today`} />
              </div>
            </Section>
            <Section title="Plan Distribution">
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {s.overview.planCounts.map((pc: any) => (
                  <div key={pc.plan} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '16px 28px', minWidth: 130, textAlign: 'center' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: MONO, marginBottom: 8 }}>{pc.plan}</div>
                    <div style={{ fontSize: 32, fontFamily: SERIF, color: pc.plan !== 'FREE' ? GOLD : 'var(--cream)' }}>{pc._count}</div>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Recent 50 Generations">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['User', 'Model', 'In Tokens', 'Out Tokens', 'Cost USD', 'Cost INR', 'Date'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {s.recentGenerations.map((g: any) => {
                      const costUsd = Number(g.costUsd ?? 0); const costInr = costUsd * usdToInr
                      return (
                        <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--cream)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.user?.email ?? '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO }}>{g.modelUsed ? String(g.modelUsed).replace('claude-', '') : '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{g.inputTokens > 0 ? fmtNum(g.inputTokens) : '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{g.outputTokens > 0 ? fmtNum(g.outputTokens) : '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 11, fontFamily: MONO, color: costUsd > 0 ? '#E67E22' : 'var(--muted)' }}>{costUsd > 0 ? fmtUsd(costUsd) : '—'}</td>
                          <td style={{ padding: '8px 14px', fontSize: 11, fontFamily: MONO, color: costInr > 0 ? GOLD : 'var(--muted)' }}>{costInr > 0 ? fmtInr(costInr) : '—'}</td>
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
            <Section title="Total Spend (Claude API)">
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
                  <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '20px 24px' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 16 }}>{label}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 8px' }}>
                      {[['API Calls', fmtNum(d.calls)], ['Tokens', fmtNum(d.totalTokens)], ['Cost USD', fmtUsd(d.costUsd)], ['Cost INR', fmtInr(d.costInr)]].map(([k, v]) => (
                        <div key={k}><div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: MONO, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{k}</div><div style={{ fontSize: 16, fontFamily: SERIF, color: k === 'Cost INR' ? GOLD : 'var(--cream)' }}>{v}</div></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Cost Breakdown by Model">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Model', 'Calls', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost (USD)', 'Cost (INR)'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {c.modelBreakdown.map((m: any) => (
                      <tr key={m.model} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: GOLD }}>{m.model ?? '—'}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--cream)' }}>{fmtNum(m._count)}</td>
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
            <Section title="Pexels API Usage">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 16 }}>
                <Stat label="Total Calls" value={fmtNum(p.total)} /><Stat label="Today" value={fmtNum(p.today)} /><Stat label="This Month" value={fmtNum(p.thisMonth)} />
                <Stat label="Real API Hits" value={fmtNum(p.real)} sub="chargeable" color="#E67E22" /><Stat label="Cache Hits" value={fmtNum(p.cached)} sub="no charge" color={GREEN} />
                <Stat label="Cache Rate" value={p.total > 0 ? `${fmt((p.cached / p.total) * 100, 1)}%` : '—'} color={GREEN} />
              </div>
            </Section>

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
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Mode', 'Calls', 'Cost (USD)', 'Cost (INR)', '% of Total'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
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
                              <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: isGuest ? '#E67E22' : isBiz ? GOLD : 'var(--cream)' }}>{row.mode}</td>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--cream)' }}>{fmtNum(Math.max(0, row.calls))}</td>
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
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Endpoint', 'Calls', 'Cost (USD)', 'Cost (INR)', 'Total Tokens'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {(s.costSegments.endpointBreakdown || []).map((ep: any) => (
                          <tr key={ep.endpoint ?? 'unknown'} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: MONO, color: (ep.endpoint ?? '').includes('business') ? GOLD : 'var(--cream)' }}>{ep.endpoint ?? '(untagged)'}</td>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--cream)' }}>{fmtNum(ep._count)}</td>
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
          </>
        )}

        {/* ── USERS ── */}
        {tab === 'users' && (
          <Section title="User Management">
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <input placeholder="Search by email or name…" value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1) }} style={{ flex: 1, minWidth: 200, padding: '9px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', fontSize: 13, borderRadius: 2, fontFamily: SANS }} />
              {users && <div style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center', fontFamily: MONO }}>{users.total} users total</div>}
            </div>
            {users ? (
              <>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Email', 'Plan', 'Total Gens', 'Monthly Usage', 'Gen Limits (D/M/Y)', 'Status', 'Joined', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {users.users.map((u: any) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.isSuspended ? 0.55 : 1 }}>
                          <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--cream)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <select value={u.plan} onChange={e => userAction('set_plan', u.id, { plan: e.target.value })} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: u.plan !== 'FREE' ? GOLD : 'var(--muted)', fontSize: 11, fontFamily: MONO, borderRadius: 1, padding: '3px 6px', cursor: 'pointer' }}>
                              {['FREE', 'PRO', 'TEAM'].map(pl => <option key={pl} value={pl}>{pl}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{u._count?.generations ?? 0}</td>
                          <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{u.usageCount ?? 0}</td>
                          <td style={{ padding: '8px 12px', fontSize: 10, color: GOLD, fontFamily: MONO }}>{`${u.dailyGenLimit ?? '—'} / ${u.monthlyGenLimit ?? '—'} / ${u.yearlyGenLimit ?? '—'}`}</td>
                          <td style={{ padding: '8px 12px' }}>{u.isSuspended ? <Badge label="Suspended" color={RED} /> : <Badge label="Active" color={GREEN} />}</td>
                          <td style={{ padding: '8px 12px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
                              <button onClick={() => { setEditUser(u); setEditLimits({ daily: String(u.dailyGenLimit ?? ''), monthly: String(u.monthlyGenLimit ?? ''), yearly: String(u.yearlyGenLimit ?? '') }) }} style={{ padding: '3px 8px', background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, fontSize: 9, cursor: 'pointer', borderRadius: 1, fontFamily: MONO }}>Limits</button>
                              <button onClick={() => userAction('reset_usage', u.id)} style={{ padding: '3px 8px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 9, cursor: 'pointer', borderRadius: 1, fontFamily: MONO }}>Reset</button>
                              <button onClick={() => { setNotifForm(f => ({ ...f, targetUserId: u.id })); setTab('notifications') }} style={{ padding: '3px 8px', background: 'transparent', border: `1px solid ${BLUE}`, color: BLUE, fontSize: 9, cursor: 'pointer', borderRadius: 1, fontFamily: MONO }}>Notify</button>
                              {u.isSuspended ? <button onClick={() => userAction('unsuspend', u.id)} style={{ padding: '3px 8px', background: 'transparent', border: `1px solid ${GREEN}`, color: GREEN, fontSize: 9, cursor: 'pointer', borderRadius: 1, fontFamily: MONO }}>Unsuspend</button> : <button onClick={() => { const r = prompt('Reason for suspension:'); if (r !== null) userAction('suspend', u.id, { reason: r }) }} style={{ padding: '3px 8px', background: 'transparent', border: `1px solid ${RED}`, color: RED, fontSize: 9, cursor: 'pointer', borderRadius: 1, fontFamily: MONO }}>Suspend</button>}
                              {u.email !== ADMIN_EMAIL && <button onClick={() => { if (confirm(`Delete ${u.email}?`)) userAction('delete', u.id) }} style={{ padding: '3px 8px', background: `${RED}22`, border: `1px solid ${RED}`, color: RED, fontSize: 9, cursor: 'pointer', borderRadius: 1, fontFamily: MONO }}>Del</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
                  <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: userPage === 1 ? 'var(--muted)' : 'var(--cream)', fontSize: 11, cursor: userPage === 1 ? 'default' : 'pointer', borderRadius: 1, fontFamily: MONO }}>← Prev</button>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>Page {userPage} of {users.pages}</span>
                  <button onClick={() => setUserPage(p => Math.min(users.pages, p + 1))} disabled={userPage >= users.pages} style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: userPage >= users.pages ? 'var(--muted)' : 'var(--cream)', fontSize: 11, cursor: userPage >= users.pages ? 'default' : 'pointer', borderRadius: 1, fontFamily: MONO }}>Next →</button>
                </div>
              </>
            ) : <div style={{ color: 'var(--muted)', fontSize: 13, fontFamily: MONO }}>Loading users…</div>}
          </Section>
        )}

        {/* ── LOGS ── */}
        {tab === 'logs' && (
          <Section title="API Call Logs">
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <select value={logService} onChange={e => { setLogService(e.target.value); setLogPage(1) }} style={{ padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', fontSize: 12, borderRadius: 2, fontFamily: MONO }}>
                <option value="">All Services</option><option value="claude">Claude Only</option><option value="pexels">Pexels Only</option>
              </select>
              {logs && <div style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center', fontFamily: MONO }}>{fmtNum(logs.total)} total entries</div>}
            </div>
            {logs ? (
              <>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Service', 'User', 'Model / Query', 'In Tokens', 'Out Tokens', 'Cost (INR)', 'Cached', 'Status', 'Time'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {logs.logs.map((l: any) => (
                        <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '7px 12px' }}><Badge label={l.service} color={l.service === 'claude' ? GOLD : BLUE} /></td>
                          <td style={{ padding: '7px 12px', fontSize: 11, color: 'var(--muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.user?.email ?? '—'}</td>
                          <td style={{ padding: '7px 12px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.model ?? l.query ?? '—'}</td>
                          <td style={{ padding: '7px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{l.inputTokens != null ? fmtNum(l.inputTokens) : '—'}</td>
                          <td style={{ padding: '7px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{l.outputTokens != null ? fmtNum(l.outputTokens) : '—'}</td>
                          <td style={{ padding: '7px 12px', fontSize: 11, fontFamily: MONO, color: (l.costInr ?? 0) > 0 ? GOLD : 'var(--muted)' }}>{l.costInr != null ? fmtInr(l.costInr) : '—'}</td>
                          <td style={{ padding: '7px 12px' }}>{l.cached ? <Badge label="cached" color={GREEN} /> : <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO }}>live</span>}</td>
                          <td style={{ padding: '7px 12px' }}>{l.success ? <Badge label="ok" color={GREEN} /> : <Badge label="fail" color={RED} />}</td>
                          <td style={{ padding: '7px 12px', fontSize: 10, color: 'var(--muted)', fontFamily: MONO, whiteSpace: 'nowrap' }}>{fmtDate(l.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
                  <button onClick={() => setLogPage(p => Math.max(1, p - 1))} disabled={logPage === 1} style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: logPage === 1 ? 'var(--muted)' : 'var(--cream)', fontSize: 11, cursor: logPage === 1 ? 'default' : 'pointer', borderRadius: 1, fontFamily: MONO }}>← Prev</button>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>Page {logPage} of {logs.pages}</span>
                  <button onClick={() => setLogPage(p => Math.min(logs.pages, p + 1))} disabled={logPage >= logs.pages} style={{ padding: '6px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: logPage >= logs.pages ? 'var(--muted)' : 'var(--cream)', fontSize: 11, cursor: logPage >= logs.pages ? 'default' : 'pointer', borderRadius: 1, fontFamily: MONO }}>Next →</button>
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
            <Section title="Compose Notification">
              <div style={{ display: 'grid', gridTemplateColumns: notifPreview ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start', maxWidth: notifPreview ? '100%' : 560 }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '24px 28px' }}>
                  <div style={{ fontFamily: SERIF, fontSize: 18, color: 'var(--cream)', marginBottom: 20 }}>New Notification</div>
                  {[['title', 'Title *', 'New feature available 🎉', false], ['body', 'Body *', 'We just launched…', true], ['imageUrl', 'Image URL (optional)', 'https://…', false], ['targetUserId', 'Target User ID (blank = broadcast all)', 'clxxx…', false]].map(([k, lbl, ph, multi]) => (
                    <div key={k as string} style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>{lbl as string}</label>
                      {multi ? (
                        <textarea value={(notifForm as any)[k as string]} onChange={e => setNotifForm(f => ({ ...f, [k as string]: e.target.value }))} rows={3} maxLength={500} placeholder={ph as string} style={{ ...inputStyle, resize: 'vertical' }} />
                      ) : (
                        <input type="text" value={(notifForm as any)[k as string]} onChange={e => setNotifForm(f => ({ ...f, [k as string]: e.target.value }))} placeholder={ph as string} style={inputStyle} />
                      )}
                    </div>
                  ))}
                  <div style={{ fontSize: 10, color: notifForm.targetUserId ? GOLD : BLUE, fontFamily: MONO, marginBottom: 16 }}>
                    {notifForm.targetUserId ? '📌 Targeted — 1 user only' : '📡 Broadcast — all users'}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setNotifPreview(p => !p)} style={{ flex: 1, padding: '10px 0', background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS, borderRadius: 2 }}>{notifPreview ? 'Hide Preview' : 'Preview'}</button>
                    <button onClick={sendNotification} disabled={notifSending || !notifForm.title.trim() || !notifForm.body.trim()} style={{ flex: 2, padding: '10px 0', background: (!notifForm.title.trim() || notifSending) ? 'var(--border)' : GOLD, color: '#000', border: 'none', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: notifSending ? 'default' : 'pointer', fontFamily: SANS, borderRadius: 2, opacity: notifSending ? 0.7 : 1 }}>
                      {notifSending ? 'Sending…' : notifForm.targetUserId ? 'Send to User' : 'Broadcast to All'}
                    </button>
                  </div>
                </div>
                {notifPreview && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 12 }}>Live Preview</div>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                      {notifForm.imageUrl && <div style={{ height: 160, overflow: 'hidden' }}><img src={notifForm.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /></div>}
                      <div style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 6, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>⚡</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: SERIF, fontSize: 15, color: 'var(--cream)', marginBottom: 4 }}>{notifForm.title || 'Notification Title'}</div>
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
            <Section title={`Sent Notifications (${notifications.length})`}>
              {notifLoading ? <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13 }}>Loading…</div> : notifications.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13, padding: '24px 0' }}>No notifications sent yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notifications.map((n: any) => (
                    <div key={n.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {n.imageUrl && <img src={n.imageUrl} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><div style={{ fontFamily: SERIF, fontSize: 14, color: 'var(--cream)' }}>{n.title}</div><Badge label={n.type} color={n.type === 'broadcast' ? BLUE : GOLD} /></div>
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
            <div style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>Range:</span>
              {(['7', '30', '90'] as const).map(d => (
                <button key={d} onClick={() => setAnalyticsRange(d)} style={{ padding: '6px 14px', background: analyticsRange === d ? GOLD : 'var(--surface)', border: `1px solid ${analyticsRange === d ? GOLD : 'var(--border)'}`, color: analyticsRange === d ? '#000' : 'var(--muted)', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: MONO }}>{d}d</button>
              ))}
            </div>
            {analyticsError && <div style={{ color: '#E57373', fontFamily: MONO, fontSize: 11, padding: '10px 14px', background: 'rgba(229,115,115,0.08)', border: '1px solid rgba(229,115,115,0.2)', borderRadius: 2, marginBottom: 16 }}>⚠ {analyticsError}</div>}
                {analyticsLoading ? <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13 }}>Loading analytics…</div> : !pageAnalytics ? (
              <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13, padding: '32px 0' }}>No page visit data yet. Tracking fires automatically as users browse.</div>
            ) : (
              <>
                <Section title="Summary">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 16 }}>
                    <Stat label="Total Page Views" value={fmtNum(pageAnalytics.summary?.totalVisits ?? 0)} />
                    <Stat label="Unique Users" value={fmtNum(pageAnalytics.summary?.uniqueUsers ?? 0)} />
                    <Stat label="Unique Pages" value={fmtNum(pageAnalytics.summary?.uniquePages ?? 0)} />
                    <Stat label="Avg Session Time" value={fmtDuration(pageAnalytics.summary?.avgDuration ?? 0)} color={GOLD} />
                  </div>
                </Section>
                {/* Daily Trend Chart */}
                {(pageAnalytics.dailyTrend || []).length > 0 && (() => {
                  const trend: { date: string; visits: number; uniqueUsers: number }[] = pageAnalytics.dailyTrend
                  const maxVisits = Math.max(...trend.map((d: any) => d.visits), 1)
                  return (
                    <Section title="Daily Traffic Trend">
                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '20px 24px' }}>
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
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Page', 'Visits', 'Unique Users', 'Avg Time on Page', 'Last Visit'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(pageAnalytics.topPages || []).map((row: any) => (
                          <tr key={row.page} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: GOLD, fontFamily: MONO }}>{row.page}</td>
                            <td style={{ padding: '10px 16px', fontSize: 13, fontFamily: SERIF, color: 'var(--cream)' }}>{fmtNum(row.visits)}</td>
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
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['User', 'Pages Visited', 'Total Visits', 'Total Time on Site', 'Avg Session'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(pageAnalytics.activeUsers || []).map((row: any) => (
                          <tr key={row.userId} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--cream)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.email || row.userId}</td>
                            <td style={{ padding: '10px 16px', fontSize: 13, fontFamily: SERIF, color: 'var(--cream)' }}>{fmtNum(row.uniquePages)}</td>
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
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['User', 'Page', 'Duration', 'Time'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {(pageAnalytics.recentVisits || [])
                          // Show only arrival pings (durationMs IS NULL) — these represent
                          // the actual page visit events. Departure-only rows (durationMs set,
                          // no matching null row in this window) are also included.
                          .filter((row: any) => row.durationMs === null || row.durationMs === undefined)
                          .map((row: any) => (
                          <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 14px', fontSize: 11, color: 'var(--muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.email || '—'}</td>
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
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, marginBottom: 24, lineHeight: 1.7 }}>
              Control which plans appear on the billing page, their prices, features, and visibility. Changes take effect immediately — no deployment needed.
            </div>
            {pricingLoading ? <div style={{ color: 'var(--muted)', fontFamily: MONO, fontSize: 13 }}>Loading…</div> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                {pricingPlans.map((plan: any) => {
                  const features: string[] = (() => { try { return JSON.parse(plan.features || '[]') } catch { return [] } })()
                  return (
                    <div key={plan.planId} style={{ background: 'var(--surface)', border: `1px solid ${plan.highlight ? GOLD : 'var(--border)'}`, borderRadius: 2, padding: '20px 22px', position: 'relative', opacity: plan.isVisible ? 1 : 0.45, transition: 'opacity 0.2s' }}>
                      {plan.highlight && <div style={{ position: 'absolute', top: -1, left: 20, background: GOLD, color: '#000', fontSize: 9, padding: '2px 10px', fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Recommended</div>}
                      {!plan.isVisible && <div style={{ position: 'absolute', top: 10, right: 10 }}><Badge label="hidden" color={RED} /></div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontFamily: SERIF, fontSize: 20, color: plan.highlight ? GOLD : 'var(--cream)' }}>{plan.name}</div>
                          <div style={{ fontSize: 22, fontFamily: SERIF, color: 'var(--cream)', marginTop: 2 }}>{plan.price}<span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>{plan.period}</span></div>
                        </div>
                      </div>
                      <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none' }}>
                        {features.slice(0, 4).map((f: string, i: number) => <li key={i} style={{ fontSize: 11, color: 'var(--muted)', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: GREEN, fontSize: 10 }}>✓</span>{f}</li>)}
                        {features.length > 4 && <li style={{ fontSize: 10, color: 'var(--muted)', fontFamily: MONO, marginTop: 2 }}>+{features.length - 4} more</li>}
                      </ul>
                      <button onClick={() => openEditPlan(plan)} style={{ width: '100%', padding: '8px 0', background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: SANS, borderRadius: 2 }}>Edit Plan</button>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>
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
                  showToast(`✓ Import done — ${data.summary?.totalInserted ?? 0} rows written`)
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
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '24px 28px', maxWidth: 680 }}>
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
                      'page_visits', 'pricing_plans',
                    ].map(t => {
                      const sel = dbExportTables.includes(t)
                      return (
                        <div
                          key={t}
                          onClick={() => setDbExportTables(prev =>
                            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                          )}
                          style={{
                            padding: '4px 10px', fontSize: 10, cursor: 'pointer',
                            border: `1px solid ${sel ? GOLD : 'var(--border2)'}`,
                            background: sel ? `${GOLD}18` : 'transparent',
                            color: sel ? GOLD : 'var(--muted)',
                            borderRadius: 2, fontFamily: MONO, letterSpacing: '0.06em',
                            transition: 'all 0.12s', userSelect: 'none',
                          }}
                        >
                          {sel ? '✓ ' : ''}{t}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <button onClick={() => setDbExportTables([])} style={{ fontSize: 10, color: 'var(--muted)', background: 'none', border: '1px solid var(--border2)', padding: '4px 12px', cursor: 'pointer', borderRadius: 2, fontFamily: MONO }}>All tables (default)</button>
                    <span style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: MONO, alignSelf: 'center' }}>
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
                          ? `✓ Export done — ${total} tables (${skippedList.length} skipped: ${skippedList.join(', ')})`
                          : `✓ Export done — all ${total} tables exported`
                      )
                    } catch (err) {
                      showToast(`✕ ${err instanceof Error ? err.message : 'Export failed'}`)
                    } finally {
                      setDbExportLoading(false)
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 28px', background: dbExportLoading ? `${GOLD}80` : GOLD,
                    color: '#000', border: 'none', borderRadius: 2,
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
                    { label: 'Format', val: 'Structured JSON — one key per table, array of rows' },
                    { label: 'Passwords', val: 'Excluded — users will need to reset via forgot-password' },
                    { label: 'Compatibility', val: 'Import back via the Import section below' },
                    { label: 'Size', val: 'Typically 1–50 MB depending on generation volume' },
                  ].map(i => (
                    <div key={i.label} style={{ padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 2 }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 4 }}>{i.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO, lineHeight: 1.6 }}>{i.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Import Database">
              <div style={{ background: 'var(--surface)', border: `1px solid ${RED}33`, borderRadius: 2, padding: '24px 28px', maxWidth: 680 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 20, padding: '12px 16px', background: `${RED}0C`, border: `1px solid ${RED}30`, borderRadius: 2 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                  <div style={{ fontSize: 11, color: '#E57373', fontFamily: MONO, lineHeight: 1.7 }}>
                    Import uses <strong>upsert</strong> — existing rows with matching IDs are updated, new rows are inserted. No rows are deleted. Safe to run on a fresh database or to merge data.
                    <br />Passwords are never overwritten. Users must reset via forgot-password after migrating.
                  </div>
                </div>

                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: MONO, lineHeight: 1.8, marginBottom: 20 }}>
                  Upload a <code style={{ color: GOLD, background: `${GOLD}12`, padding: '1px 6px', borderRadius: 1 }}>.json</code> file exported from this panel. Tables are imported in dependency order (templates → users → generations → …).
                </p>

                <button
                  disabled={dbImportLoading}
                  onClick={() => { setDbImportResult(null); setDbImportError(null); dbImportRef.current?.click() }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 28px', background: 'transparent',
                    color: RED, border: `1px solid ${RED}`, borderRadius: 2,
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
                  <div style={{ marginTop: 16, padding: '12px 16px', background: `${RED}0C`, border: `1px solid ${RED}40`, borderRadius: 2, fontSize: 11, color: '#E57373', fontFamily: MONO, lineHeight: 1.6 }}>
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
                        <div key={s.label} style={{ padding: '10px 18px', background: 'var(--bg)', border: `1px solid ${s.color}40`, borderRadius: 2, textAlign: 'center' }}>
                          <div style={{ fontSize: 22, color: s.color, fontFamily: SERIF, lineHeight: 1 }}>{s.val}</div>
                          <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginTop: 4 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Per-table breakdown */}
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 2, overflowX: 'auto' }}>
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
                              <td style={{ padding: '8px 14px', color: r.errors.length > 0 ? RED : 'var(--muted2)', fontFamily: MONO }}>
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
                      <div style={{ marginTop: 14, padding: '12px 16px', background: `${RED}0A`, border: `1px solid ${RED}30`, borderRadius: 2 }}>
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
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '24px 28px', maxWidth: 680 }}>
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
                    <div key={step.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 2 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${GOLD}18`, border: `1px solid ${GOLD}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, color: GOLD, fontFamily: MONO, fontWeight: 600 }}>{step.n}</div>
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
            <Section title="Exchange Rate (USD → INR)">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '24px 28px', maxWidth: 500 }}>
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

            <Section title="Claude Pricing — Live INR Calculation">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, overflowX: 'auto', maxWidth: 820 }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO }}>Rate: ₹{usdToInr.toFixed(2)}</span>
                    <LivePill source={rateSource} />
                  </div>
                  <button onClick={fetchLiveRates} disabled={liveRatesLoading} style={{ padding: '4px 12px', background: 'transparent', border: `1px solid ${GREEN}`, color: GREEN, fontSize: 9, cursor: 'pointer', borderRadius: 1, fontFamily: MONO }}>{liveRatesLoading ? '…' : '↻ Refresh Rate'}</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Model', 'Input $/M', 'Output $/M', 'Input ₹/M', 'Output ₹/M', 'Role'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, fontWeight: 400, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
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
                          <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--cream)', fontFamily: MONO }}>${pricing.inputPerM}</td>
                          <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--cream)', fontFamily: MONO }}>${pricing.outputPerM}</td>
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
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '24px 28px', maxWidth: 680 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: MONO, marginBottom: 20, lineHeight: 1.7 }}>
                  Set daily / weekly / monthly generation caps per plan. Leave blank for <span style={{ color: GOLD }}>unlimited</span>. Individual user overrides (set in Users tab) take precedence.
                </div>
                {(['free', 'pro', 'team'] as const).map(plan => (
                  <div key={plan} style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, fontFamily: MONO, marginBottom: 14, fontWeight: 600 }}>{plan} plan</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      {(['daily', 'weekly', 'monthly'] as const).map(period => (
                        <div key={period}>
                          <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: MONO, marginBottom: 6 }}>{period}</label>
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

            <Section title="Change Admin Password">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 2, padding: '24px 28px', maxWidth: 440 }}>
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
              <div style={{ background: 'var(--surface)', border: `1px solid ${RED}33`, borderRadius: 2, padding: '20px 24px', maxWidth: 540 }}>
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
