'use client'

import Link from 'next/link'
import { useState, Suspense } from 'react'

function extractTenDigits(raw: string) {
  return raw.replace(/\D/g, '').slice(0, 10)
}

function isValidMobile(digits: string) {
  return /^[6-9]\d{9}$/.test(digits)
}

function ForgotPasswordForm() {
  const [phone, setPhone]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [message, setMessage]   = useState('')
  const [needsSupport, setNeedsSupport] = useState(false)

  const digits = extractTenDigits(phone)
  const valid = isValidMobile(digits)

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setNeedsSupport(false)

    if (!valid) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'Could not send the reset link. Please try again.')
        setNeedsSupport(data.code === 'EMAIL_NOT_LINKED')
        return
      }

      setMessage(data.message || 'Password reset link sent to your linked email.')
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
        .fp-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% 75%, rgba(120, 35, 30, 0.35), transparent 45%),
            radial-gradient(circle at 10% 20%, rgba(130, 95, 35, 0.25), transparent 35%),
            linear-gradient(180deg, #070706 0%, #15100c 45%, #24140f 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
          position: relative; overflow: hidden;
        }
        .fp-page::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
          opacity: 0.4;
        }
        .fp-card {
          position: relative; z-index: 2;
          width: 100%; max-width: 410px;
          background: var(--surface);
          border: 1px solid var(--border2);
          border-radius: 20px;
          padding: 40px 36px;
          box-shadow: var(--shadow-lift);
        }
        .fp-card::before {
          content: '';
          position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity: 0.4; border-radius: 0 0 8px 8px;
        }
        .fp-label {
          display: block; font-size: 11px; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--muted);
          font-family: 'DM Mono', monospace; margin-bottom: 6px;
        }
        .fp-input {
          width: 100%; padding: 13px 16px; margin-bottom: 20px;
          background: var(--surface2); border: 1px solid var(--border2);
          color: var(--text); font-size: 14px; outline: none;
          border-radius: 8px; font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          letter-spacing: 0.08em;
        }
        .fp-input:focus {
          border-color: rgba(201,168,76,0.45);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.06);
        }
        .fp-btn {
          width: 100%; padding: 13px 0;
          border: none; font-size: 12px; letter-spacing: 0.16em;
          text-transform: uppercase; font-weight: 700;
          cursor: pointer; border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: filter 0.2s, transform 0.2s;
        }
        .fp-btn:not(:disabled):hover { filter: brightness(1.08); transform: translateY(-1px); }
        .fp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .fp-note {
          padding: 12px 14px; border-radius: 10px; margin-bottom: 16px;
          font-size: 13px; line-height: 1.65;
        }
      `}</style>

      <div className="fp-page">
        <div className="fp-card">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, var(--gold-light), var(--gold) 60%, var(--gold-deep))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Instrument Serif',serif", fontSize: 16, color: '#0A0A0E', fontWeight: 700, margin: '0 auto 14px', boxShadow: 'var(--shadow-gold)' }}>BS</div>
            </Link>

            <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 25, color: 'var(--text)', fontWeight: 400, marginBottom: 6 }}>
              Reset password
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
              Enter your registered 10-digit mobile number. We’ll send a secure reset link to the email linked with your account.
            </p>
          </div>

          {error && (
            <div className="fp-note" style={{ background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', color: '#E57373' }}>
              {error}
              {needsSupport && (
                <div style={{ marginTop: 12 }}>
                  <Link href="/contact" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 700 }}>
                    Contact support immediately →
                  </Link>
                </div>
              )}
            </div>
          )}

          {message && (
            <div className="fp-note" style={{ background: 'rgba(46,125,82,0.1)', border: '1px solid rgba(46,125,82,0.35)', color: '#6FCF97' }}>
              ✓ {message}
            </div>
          )}

          <form onSubmit={handlePhoneSubmit}>
            <label className="fp-label">Mobile Number</label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              value={digits}
              onChange={e => setPhone(extractTenDigits(e.target.value))}
              placeholder="9876543210"
              required
              autoFocus
              className="fp-input"
            />
            <button type="submit" disabled={loading || !valid} className="fp-btn"
              style={{ background: 'linear-gradient(135deg, var(--gold-light), var(--gold) 55%, var(--gold-deep))', color: '#0A0A0E', boxShadow: 'var(--shadow-gold)' }}>
              {loading && <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block', flexShrink: 0 }} />}
              {loading ? 'Sending…' : 'Send Reset Email'}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
            Remembered it?{' '}
            <Link href="/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>Back to Sign In</Link>
          </p>
        </div>
      </div>
    </>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 75%, rgba(120, 35, 30, 0.35), transparent 45%), linear-gradient(180deg, #070706 0%, #15100c 45%, #24140f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 24, height: 24, border: '1px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}
