'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import SocialLinksEditor from '@/components/SocialLinksEditor'
import QRCodePanel from '@/components/QRCodePanel'
import DigitalCardPanel from '@/components/DigitalCardPanel'
import { useDomain } from '@/hooks/useDomain'

const ACCENT_COLORS = ['#C9A84C', '#E2C57A', '#4CA8C9', '#7B68EE', '#C0392B', '#2E7D52']


// ── Inline Domain Panel component ────────────────────────────────────────
function DomainPanel() {
  const { status, loading, error, connect, verify, remove } = useDomain()
  const [domainInput, setDomainInput] = useState('')
  const [verifyMsg, setVerifyMsg] = useState('')

  const fieldStyle: React.CSSProperties = {
    flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)',
  }

  async function handleConnect() {
    if (!domainInput.trim()) return
    await connect(domainInput.trim())
  }

  async function handleVerify() {
    const result = await verify()
    setVerifyMsg(result?.verified ? '✓ Domain verified!' : (result?.message ?? 'Not verified yet.'))
    setTimeout(() => setVerifyMsg(''), 5000)
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
        Custom Domain
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 8 }}>
        Connect Your Domain
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>
        Point your own domain (e.g. <em>card.yourname.com</em>) to your Brand Syndicate portfolio.
      </p>

      {!status ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={domainInput}
            onChange={e => setDomainInput(e.target.value)}
            placeholder="card.yourname.com"
            style={fieldStyle}
          />
          <button
            onClick={handleConnect}
            disabled={loading || !domainInput.trim()}
            style={{ background: 'var(--gold)', border: 'none', color: '#000', padding: '9px 18px', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius)', whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '…' : 'Connect'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.verified ? '#2E7D52' : '#C9A84C', display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: 'var(--cream)', fontFamily: "'DM Mono', monospace" }}>{status.domain}</span>
            <span style={{ fontSize: 10, color: status.verified ? '#6BBFA0' : 'var(--muted)', letterSpacing: '0.08em' }}>
              {status.verified ? 'Verified' : 'Pending verification'}
            </span>
          </div>

          {status.instructions && !status.verified && (
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 14, fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--muted)', lineHeight: 1.8 }}>
              <div style={{ marginBottom: 6 }}>1. Add CNAME: <span style={{ color: 'var(--cream)' }}>{status.instructions.cname.name}</span> → <span style={{ color: 'var(--gold)' }}>{status.instructions.cname.value}</span></div>
              <div>2. Add TXT: <span style={{ color: 'var(--cream)' }}>{status.instructions.txt.name}</span> = <span style={{ color: 'var(--gold)' }}>{status.instructions.txt.value}</span></div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {!status.verified && (
              <button onClick={handleVerify} disabled={loading} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', padding: '7px 14px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace", opacity: loading ? 0.7 : 1 }}>
                {loading ? '…' : 'Check Verification'}
              </button>
            )}
            <button onClick={remove} disabled={loading} style={{ background: 'transparent', border: '1px solid rgba(192,57,43,0.4)', color: '#E05252', padding: '7px 14px', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace" }}>
              Remove Domain
            </button>
            {verifyMsg && <span style={{ fontSize: 11, color: status.verified ? '#6BBFA0' : 'var(--muted)' }}>{verifyMsg}</span>}
          </div>
        </div>
      )}
      {error && <div style={{ fontSize: 12, color: '#E05252', marginTop: 10 }}>{error}</div>}
    </div>
  )
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [tab, setTab] = useState<'profile' | 'account' | 'card' | 'danger'>('profile')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [showToast, setShowToast] = useState(false)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [bio, setBio] = useState('')
  const [accentColor, setAccentColor] = useState('#C9A84C')
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const u = await res.json()
        setName(u.name || '')
        setUsername(u.username || '')
        setJobTitle(u.jobTitle || '')
        setCompany(u.company || '')
        setLocation(u.location || '')
        setWebsite(u.website || '')
        setLinkedin(u.linkedin || '')
        setBio(u.bio || '')
        setAccentColor(u.accentColor || '#C9A84C')
      }
    }
    load()
  }, [])

  function showMsg(msg: string) {
    setToast(msg); setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  async function save() {
    setSaving(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, jobTitle, company, location, website, linkedin, bio, accentColor }),
    })
    if (res.ok) { showMsg('Settings saved'); await update() }
    else showMsg('Failed to save')
    setSaving(false)
  }

  async function deleteAccount() {
    // BUG FIX #7: When username is not set, fall back to confirming with email
    const confirmTarget = username || session?.user?.email || ''
    if (!confirmTarget) { showMsg('Please set a username in your profile first'); return }
    if (deleteConfirm !== confirmTarget) { showMsg('Value does not match'); return }
    const res = await fetch('/api/user/delete', { method: 'DELETE' })
    if (res.ok) {
      window.location.href = '/login'
    } else {
      showMsg('Deletion failed — please try again')
    }
  }

  const fieldStyle: React.CSSProperties = { width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)' }
  const labelStyle = { display: 'block' as const, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }

  return (
    <div style={{ padding: '40px 36px', maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
        <div style={{ width: 20, height: 1, background: 'var(--gold)' }} /> Settings
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: 'var(--cream)', marginBottom: 36 }}>Account Settings</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 36 }}>
        {(['profile', 'account', 'card', 'danger'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 18px 9px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: tab === t ? 'var(--gold)' : 'var(--muted)', cursor: 'pointer', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent', marginBottom: -1, fontFamily: "'DM Mono', monospace" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div>
          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', border: '1px solid var(--gold)', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--gold)', fontFamily: "'DM Mono', monospace" }}>
              {(name || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--cream)', marginBottom: 4 }}>{name || 'Your Name'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{session?.user?.email}</div>
            </div>
          </div>

          <div className="form-grid-2">
            {[
              { label: 'Full Name', value: name, set: setName },
              { label: 'Username', value: username, set: setUsername },
              { label: 'Job Title', value: jobTitle, set: setJobTitle },
              { label: 'Company', value: company, set: setCompany },
              { label: 'Location', value: location, set: setLocation },
              { label: 'Website', value: website, set: setWebsite },
            ].map(f => (
              <div key={f.label}>
                <label style={labelStyle}>{f.label}</label>
                <input value={f.value} onChange={e => f.set(e.target.value)} style={fieldStyle} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>LinkedIn</label>
            <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/yourname" style={fieldStyle} />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Bio <span style={{ color: 'var(--muted2)' }}>{bio.length}/500</span></label>
            <textarea value={bio} onChange={e => setBio(e.target.value.substring(0, 500))} rows={4} style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>
          <button onClick={save} disabled={saving} style={{ background: 'var(--gold)', border: 'none', color: '#000', padding: '10px 24px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius)' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'account' && (
        <div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Accent Color</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {ACCENT_COLORS.map(c => (
                <div key={c} onClick={() => setAccentColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: accentColor === c ? '2px solid white' : '2px solid transparent', transform: accentColor === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={labelStyle}>Custom Hex</label>
              <input value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ ...fieldStyle, width: 140 }} />
            </div>
          </div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Public Portfolio</div>
            {username && (
              <div style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
                {process.env.NEXT_PUBLIC_APP_URL}/u/{username}
              </div>
            )}
          </div>
          <button onClick={save} disabled={saving} style={{ background: 'var(--gold)', border: 'none', color: '#000', padding: '10px 24px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius)' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'card' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <DigitalCardPanel accent={accentColor} />
          <SocialLinksEditor />
          <DomainPanel />
        </div>
      )}

      {tab === 'danger' && (
        <div>
          <div style={{ padding: 20, border: '1px solid rgba(192,57,43,0.3)', background: 'rgba(192,57,43,0.06)', borderRadius: 'var(--radius)', marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 6, fontFamily: "'Playfair Display', serif" }}>Delete Account</div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.7 }}>This action is permanent and cannot be undone. All your generations and exports will be deleted.</p>
            <label style={labelStyle}>Type {username ? 'your username' : 'your email'} to confirm: <strong style={{ color: 'var(--cream)' }}>{username || session?.user?.email}</strong></label>
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder={username || session?.user?.email || ''} style={{ ...fieldStyle, marginBottom: 12, borderColor: 'rgba(192,57,43,0.3)' }} />
            <button onClick={deleteAccount} disabled={deleteConfirm !== (username || session?.user?.email || '')} style={{ background: deleteConfirm === (username || session?.user?.email || '') ? 'var(--red)' : 'transparent', border: '1px solid var(--red)', color: deleteConfirm === (username || session?.user?.email || '') ? '#fff' : 'var(--red)', padding: '9px 20px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: deleteConfirm === (username || session?.user?.email || '') ? 'pointer' : 'not-allowed', borderRadius: 'var(--radius)', opacity: deleteConfirm !== (username || session?.user?.email || '') ? 0.5 : 1 }}>
              Delete Account Permanently
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface2)', border: '1px solid var(--border2)', borderLeft: '3px solid var(--gold)', padding: '12px 20px', fontSize: 12, color: 'var(--text)', zIndex: 9998, transform: showToast ? 'translateX(0)' : 'translateX(calc(100% + 32px))', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: 280, borderRadius: 'var(--radius)' }}>{toast}</div>
    </div>
  )
}
