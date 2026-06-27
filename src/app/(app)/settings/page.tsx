'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { useSession } from 'next-auth/react'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [tab, setTab] = useState<'profile' | 'account' | 'help' | 'danger'>('profile')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [usage, setUsage] = useState<{ allowed: boolean; used: number; limit: number | null; period: 'daily' | 'monthly'; resetAt: string } | null>(null)

  // Profile fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')

  // Account / danger
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [helpSubject, setHelpSubject] = useState('')
  const [helpMessage, setHelpMessage] = useState('')
  const [helpSending, setHelpSending] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const u = await res.json()
        setName(u.name || '')
        setEmail(u.email || '')
        setUsername(u.username || '')
        setJobTitle(u.jobTitle || '')
        setCompany(u.company || '')
        setLocation(u.location || '')
        setWebsite(u.website || '')
        setBio(u.bio || '')
        setPhone(u.phone || '')
      }
    }
    load()
    fetch('/api/usage', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUsage(d) })
      .catch(() => {})
  }, [])

  function showMsg(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3500)
  }

  async function save() {
    setSaving(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, username, jobTitle, company, location, website }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      showMsg('Changes saved', 'success')
      await update()
    } else {
      showMsg(data.error || 'Failed to save', 'error')
    }
    setSaving(false)
  }

  async function deleteAccount() {
    if (!username) { showMsg('Please set a username in your profile first', 'error'); return }
    if (deleteConfirm !== username) { showMsg('Username does not match', 'error'); return }
    const res = await fetch('/api/user/delete', { method: 'DELETE' })
    if (res.ok) window.location.href = '/login'
    else showMsg('Deletion failed, please try again', 'error')
  }

  const user = session?.user as { name?: string; plan?: string; email?: string } | undefined
  const initials = (name || user?.name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
  const plan = user?.plan || 'FREE'

  const f: CSSProperties = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    padding: '10px 13px', outline: 'none', borderRadius: 8,
    transition: 'border-color 0.15s',
  }
  const lbl: CSSProperties = {
    display: 'block', fontSize: 10, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: 'var(--muted)',
    fontFamily: "'DM Mono', monospace", marginBottom: 6,
  }
  const section = (title: string, sub?: string) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 13, color: 'var(--cream)', fontFamily: "'Playfair Display', serif", marginBottom: sub ? 4 : 0 }}>{title}</div>
      {sub && <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.65, margin: 0 }}>{sub}</p>}
    </div>
  )

  const TABS = ['profile', 'account', 'help', 'danger'] as const

  return (
    <div className="page-pad settings-desktop-wide" style={{ maxWidth: 1180, width: '100%' }}>
      <div className="page-eyebrow"><span className="page-eyebrow-dot" />Account Settings</div>
      <h1 className="page-h1" style={{ marginBottom: 28 }}>Your <em>profile.</em></h1>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 32, gap: 0 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '9px 16px 8px',
              fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: tab === t ? 'var(--gold)' : 'var(--muted)',
              cursor: 'pointer', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -1, fontFamily: "'DM Mono', monospace",
              transition: 'color 0.15s',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── PROFILE ── */}
      {tab === 'profile' && (
        <div>
          {/* Avatar + identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, padding: '18px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid var(--gold)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--gold)', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 500, marginBottom: 2 }}>{name || 'Your Name'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {phone ? `+${phone}` : user?.email || 'No contact on file'}
              </div>
              <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', padding: '2px 8px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.28)', borderRadius: 4, fontSize: 9, color: 'var(--gold)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {plan} Plan
              </div>
            </div>
          </div>

          {/* Name + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" style={f} />
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@business.com" style={f} />
            </div>
          </div>

          {/* Username */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Username <span style={{ color: 'var(--muted2)', textTransform: 'none', letterSpacing: 0 }}>— public URL</span></label>
            <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="yourname" style={f} />
          </div>

          {/* Job + Company */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Job Title</label>
              <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Founder, Designer…" style={f} />
            </div>
            <div>
              <label style={lbl}>Company</label>
              <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your business name" style={f} />
            </div>
          </div>

          {/* Location + Website */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, State" style={f} />
            </div>
            <div>
              <label style={lbl}>Website</label>
              <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="yourbusiness.com" style={f} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ background: 'var(--gold)', border: 'none', color: '#000', padding: '11px 26px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', borderRadius: 8, opacity: saving ? 0.75 : 1, fontFamily: "'DM Mono', monospace" }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── ACCOUNT ── */}
      {tab === 'account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Identity */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px' }}>
            {section('Your Account')}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>Mobile</span>
                <span style={{ fontSize: 12, color: 'var(--cream)', fontFamily: "'DM Mono', monospace" }}>
                  {phone ? `+${phone}` : 'Not set'}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>Plan</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>{plan}</span>
                  {plan === 'FREE' && (
                    <a href="/billing" style={{ fontSize: 11, color: 'var(--gold)', textDecoration: 'none', opacity: 0.7 }}>Upgrade →</a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Generation quota */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px' }}>
            {section('Generation Limit', 'Your website, logo, image, strategy, calendar, and paid AI chat usage share this quota.')}
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              <div style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Used</div>
                <div style={{ fontSize: 22, color: 'var(--cream)', fontFamily: "'Playfair Display', serif", marginTop: 4 }}>{usage ? usage.used : '—'}</div>
              </div>
              <div style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Limit</div>
                <div style={{ fontSize: 22, color: 'var(--gold)', fontFamily: "'Playfair Display', serif", marginTop: 4 }}>{usage ? (usage.limit === null ? '∞' : usage.limit) : '—'}</div>
              </div>
              <div style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Period</div>
                <div style={{ fontSize: 22, color: 'var(--cream)', fontFamily: "'Playfair Display', serif", marginTop: 4, textTransform: 'capitalize' }}>{usage ? usage.period : '—'}</div>
              </div>
            </div>
            {usage && usage.limit !== null && usage.used >= usage.limit && (
              <a href="/billing" style={{ display: 'inline-flex', marginTop: 14, color: 'var(--gold)', fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>Upgrade plan →</a>
            )}
          </div>

          {/* Password */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px' }}>
            {section('Password', 'Change your password using the reset flow. An email or SMS will be sent to confirm.')}
            <div style={{ marginTop: 16 }}>
              <a
                href="/forgot-password"
                style={{ display: 'inline-block', padding: '9px 20px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 8, fontFamily: "'DM Mono', monospace" }}
              >
                Reset Password
              </a>
            </div>
          </div>

          {/* Notifications placeholder */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px' }}>
            {section('Notifications', 'Email and WhatsApp notifications about your generations, billing, and account activity.')}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Generation complete alerts', enabled: true },
                { label: 'Billing reminders', enabled: true },
                { label: 'Product updates', enabled: false },
              ].map((n, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>{n.label}</span>
                  <div style={{ width: 32, height: 18, borderRadius: 9, background: n.enabled ? 'var(--gold)' : 'var(--surface2)', border: '1px solid var(--border)', position: 'relative', cursor: 'not-allowed', opacity: 0.6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: n.enabled ? 16 : 2, transition: 'left 0.2s' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 10, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>Notification preferences coming soon</div>
          </div>
        </div>
      )}

      {/* ── HELP ── */}
      {tab === 'help' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px' }}>
            {section('Contact Support', 'Having an issue or need help? Describe the problem and our team will respond shortly.')}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Topic</label>
                <select value={helpSubject} onChange={e => setHelpSubject(e.target.value)} style={{ ...f, appearance: 'none' as const }}>
                  <option value="">Select a topic…</option>
                  <option value="billing">Billing / Payments</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="account">Account Issue</option>
                  <option value="generation">Generation / AI Problem</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Message <span style={{ color: 'var(--muted2)', textTransform: 'none', letterSpacing: 0 }}>{helpMessage.length}/1000</span></label>
                <textarea
                  value={helpMessage}
                  onChange={e => setHelpMessage(e.target.value.substring(0, 1000))}
                  rows={5}
                  placeholder="Describe your issue or question in detail…"
                  style={{ ...f, resize: 'vertical' as const }}
                />
              </div>
              <button
                onClick={async () => {
                  if (!helpSubject || !helpMessage.trim()) { showMsg('Please fill in topic and message', 'error'); return }
                  setHelpSending(true)
                  try {
                    const res = await fetch('/api/support', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ subject: helpSubject, message: helpMessage, userEmail: email || user?.email, userName: name }),
                    })
                    if (res.ok) { showMsg('Message sent. We will reply soon.', 'success'); setHelpSubject(''); setHelpMessage('') }
                    else showMsg('Failed to send. Please try again', 'error')
                  } catch { showMsg('Failed to send. Please try again', 'error') }
                  setHelpSending(false)
                }}
                disabled={helpSending}
                style={{ alignSelf: 'flex-start', background: 'var(--gold)', border: 'none', color: '#000', padding: '11px 26px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: helpSending ? 'wait' : 'pointer', borderRadius: 8, opacity: helpSending ? 0.7 : 1, fontFamily: "'DM Mono', monospace" }}
              >
                {helpSending ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>Common Questions</div>
            {[
              { q: 'How do I generate a website?', a: 'Go to Generation, fill in your business details, and hit Generate. Your preview will be ready in seconds.' },
              { q: 'How do I upgrade my plan?', a: 'Visit the Billing page from the nav to view plans and upgrade.' },
              { q: 'Can I edit my generated website?', a: 'Yes. Open any website from My Work and use the AI edit panel to make changes.' },
              { q: 'How do I download or export assets?', a: 'Open any asset from My Work and look for the Download or Export button in the preview.' },
            ].map((item, i, arr) => (
              <div key={i} style={{ marginBottom: i < arr.length - 1 ? 14 : 0, paddingBottom: i < arr.length - 1 ? 14 : 0, borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 12, color: 'var(--cream)', marginBottom: 4, fontWeight: 500 }}>{item.q}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.65 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DANGER ── */}
      {tab === 'danger' && (
        <div>
          <div style={{ padding: '22px', border: '1px solid rgba(192,57,43,0.25)', background: 'rgba(192,57,43,0.05)', borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: '#E05252', marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>Delete Account</div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18, lineHeight: 1.7 }}>
              This is permanent. All your generations, assets, and data will be deleted and cannot be recovered.
            </p>
            {!username ? (
              <div style={{ padding: '10px 14px', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 8, fontSize: 12, color: '#E05252', marginBottom: 12 }}>
                Please set a username in the Profile tab first.
              </div>
            ) : (
              <>
                <label style={{ ...lbl, marginBottom: 8 }}>
                  Type your username to confirm: <strong style={{ color: 'var(--cream)', fontFamily: "'DM Mono', monospace" }}>{username}</strong>
                </label>
                <input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder={username}
                  style={{ ...f, marginBottom: 14, borderColor: 'rgba(192,57,43,0.3)' }}
                />
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirm !== username}
                  style={{ background: deleteConfirm === username ? '#C0392B' : 'transparent', border: '1px solid #C0392B', color: deleteConfirm === username ? '#fff' : '#C0392B', padding: '10px 22px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: deleteConfirm === username ? 'pointer' : 'not-allowed', borderRadius: 8, opacity: deleteConfirm !== username ? 0.5 : 1, fontFamily: "'DM Mono', monospace" }}
                >
                  Delete Permanently
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        background: 'var(--surface2)', border: '1px solid var(--border2)',
        borderLeft: `3px solid ${toastType === 'error' ? '#C0392B' : 'var(--gold)'}`,
        padding: '12px 20px', fontSize: 12, color: 'var(--text)', zIndex: 9998,
        transform: showToast ? 'translateX(0)' : 'translateX(calc(100% + 32px))',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: 280, borderRadius: 8,
      }}>
        {toast}
      </div>
    </div>
  )
}
