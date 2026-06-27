'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('This reset link is missing or invalid.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Could not reset password. Please request a fresh link.')
        return
      }
      setDone(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .rp-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% 75%, rgba(120, 35, 30, 0.35), transparent 45%),
            radial-gradient(circle at 10% 20%, rgba(130, 95, 35, 0.25), transparent 35%),
            linear-gradient(180deg, #070706 0%, #15100c 45%, #24140f 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative; overflow: hidden;
        }
        .rp-page::before {
          content: ''; position: fixed; inset: 0; pointer-events: none;
          background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
          opacity: 0.4;
        }
        .rp-card {
          position: relative; z-index: 2; width: 100%; max-width: 410px;
          background: var(--surface); border: 1px solid var(--border2);
          border-radius: 20px; padding: 40px 36px; box-shadow: var(--shadow-lift);
        }
        .rp-card::before {
          content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity: 0.4; border-radius: 0 0 8px 8px;
        }
        .rp-label { display: block; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); font-family: 'DM Mono', monospace; margin-bottom: 6px; }
        .rp-input { width: 100%; padding: 13px 16px; background: var(--surface2); border: 1px solid var(--border2); color: var(--text); font-size: 14px; outline: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        .rp-input:focus { border-color: rgba(201,168,76,0.45); box-shadow: 0 0 0 3px rgba(201,168,76,0.06); }
        .rp-wrap { position: relative; margin-bottom: 18px; }
        .rp-wrap .rp-input { padding-right: 44px; }
        .rp-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--muted); cursor: pointer; font-size: 12px; padding: 4px; }
        .rp-btn { width: 100%; padding: 13px 0; border: none; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; cursor: pointer; border-radius: 8px; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .rp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="rp-page">
        <div className="rp-card">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, var(--gold-light), var(--gold) 60%, var(--gold-deep))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Instrument Serif',serif", fontSize: 16, color: '#0A0A0E', fontWeight: 700, margin: '0 auto 14px', boxShadow: 'var(--shadow-gold)' }}>BS</div>
            </Link>
            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 25, color: 'var(--text)', fontWeight: 400, marginBottom: 6 }}>
              {done ? 'Password updated' : 'Create new password'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
              {done ? 'You can now sign in with your new password.' : 'Choose a strong password for your Brand Syndicate account.'}
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#E57373' }}>
              {error}
            </div>
          )}

          {done ? (
            <div>
              <div style={{ padding: '18px 20px', background: 'rgba(46,125,82,0.08)', border: '1px solid rgba(46,125,82,0.25)', borderRadius: 10, marginBottom: 24, fontSize: 13, color: '#6FCF97', lineHeight: 1.7, textAlign: 'center' }}>
                ✓ Password updated successfully.
              </div>
              <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 0', background: 'linear-gradient(135deg, var(--gold-light), var(--gold) 55%, var(--gold-deep))', color: '#0A0A0E', fontFamily: "'DM Sans',sans-serif", fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, textDecoration: 'none', borderRadius: 8, boxShadow: 'var(--shadow-gold)' }}>
                Sign In Now →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="rp-label">New Password</label>
              <div className="rp-wrap">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" required autoFocus className="rp-input" />
                <button type="button" className="rp-toggle" onClick={() => setShowPass(p => !p)}>{showPass ? '🙈' : '👁'}</button>
              </div>
              <label className="rp-label">Confirm Password</label>
              <div className="rp-wrap">
                <input type={showPass ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" required className="rp-input" />
              </div>
              <button type="submit" disabled={loading || !token} className="rp-btn" style={{ background: 'linear-gradient(135deg, var(--gold-light), var(--gold) 55%, var(--gold-deep))', color: '#0A0A0E', boxShadow: 'var(--shadow-gold)' }}>
                {loading && <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block', flexShrink: 0 }} />}
                {loading ? 'Updating…' : 'Reset Password'}
              </button>
              {!token && <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginTop: 14 }}>This reset link is missing. Please request a fresh link.</p>}
            </form>
          )}
        </div>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
