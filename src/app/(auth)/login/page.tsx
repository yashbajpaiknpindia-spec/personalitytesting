'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const ADMIN_PHONE = '917897671348'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2l12 12M6.7 6.8a2 2 0 002.5 2.5"/><path d="M4.2 4.3C2.6 5.3 1 8 1 8s2.5 5 7 5c1.4 0 2.7-.4 3.8-1M7 3.1C7.3 3 7.7 3 8 3c4.5 0 7 5 7 5s-.7 1.4-1.9 2.7"/>
    </svg>
  )
}

function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return digits
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`
  return null
}

// Extracts the 10-digit local mobile number from raw input, correctly handling
// numbers entered/pasted WITH the country code (e.g. "+91 7897671348",
// "917897671348", "0917897671348"). Without this, a naive `.slice(0, 10)`
// truncation would keep the leading "91" and drop the real trailing digits,
// producing a phone number that never matches any account — causing login
// to silently fail with "Invalid mobile number or password" for anyone
// (including the admin) who types or pastes their number with +91.
function extractLocalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.length > 10) {
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
    else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
    else digits = digits.slice(-10)
  }
  return digits.slice(0, 10)
}

function isValidIndianMobile(digits: string) {
  return /^[6-9]\d{9}$/.test(digits)
}

function LoginForm() {
  const searchParams = useSearchParams()
  const rawCallback  = searchParams.get('callbackUrl') || '/dashboard'
  const callbackUrl  =
    rawCallback === '/login' || rawCallback === '/signup' || rawCallback.startsWith('/login?')
      ? '/dashboard'
      : rawCallback

  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('tab') === 'signup' ? 'signup' : 'signin'
  )
  const [phone, setPhone]               = useState('')
  const [password, setPassword]         = useState('')
  const [name, setName]                 = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)

  const rawDigits  = extractLocalDigits(phone)
  const phoneValid = isValidIndianMobile(rawDigits)
  const phoneError = phoneTouched && rawDigits.length > 0 && !phoneValid

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!phoneValid) { setError('Please enter a valid 10-digit mobile number.'); return }
    setLoading(true); setError('')
    const normalised = normalisePhone(rawDigits)!
    const res = await signIn('credentials', { phone: normalised, password, redirect: false })
    if (res?.error) {
      setLoading(false); setError('Invalid mobile number or password.')
    } else {
      try {
        const session = await getSession()
        const isAdmin = (session?.user as any)?.role === 'ADMIN' || normalised === ADMIN_PHONE
        window.location.href = isAdmin ? '/admin' : callbackUrl
      } catch { window.location.href = callbackUrl }
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!phoneValid) { setError('Please enter a valid 10-digit mobile number.'); return }
    setLoading(true); setError('')
    try {
      const normalised = normalisePhone(rawDigits)!
      const res  = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalised, password, name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return }
      await new Promise(r => setTimeout(r, 300))
      let signInRes = await signIn('credentials', { phone: normalised, password, redirect: false })
      if (signInRes?.error) {
        await new Promise(r => setTimeout(r, 600))
        signInRes = await signIn('credentials', { phone: normalised, password, redirect: false })
      }
      setLoading(false)
      if (signInRes?.error) { setMode('signin'); setPassword(''); setError('Account created! Please sign in.'); return }
      try {
        const session = await getSession()
        const isAdmin = (session?.user as any)?.role === 'ADMIN' || normalised === ADMIN_PHONE
        window.location.href = isAdmin ? '/admin' : callbackUrl
      } catch { window.location.href = callbackUrl }
    } catch { setError('Something went wrong. Please try again.'); setLoading(false) }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', marginBottom: 12,
    background: 'var(--surface2)',
    border: '1px solid var(--border2)',
    color: 'var(--text)', fontSize: 14, outline: 'none',
    borderRadius: 8, fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.25s, box-shadow 0.25s',
    boxSizing: 'border-box',
  }

  return (
    <>
      <style>{`
        @keyframes authDotPulse {
          0%,100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.4); }
        }
        @keyframes spin { to { transform: rotate(360deg) } }

        @media (max-width: 959px) {
          .auth-right { padding-top: 40px; }
        }

        .auth-page-wrap {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% 75%, rgba(120, 35, 30, 0.35), transparent 45%),
            radial-gradient(circle at 10% 20%, rgba(130, 95, 35, 0.25), transparent 35%),
            linear-gradient(180deg, #070706 0%, #15100c 45%, #24140f 100%);
          display: flex;
          position: relative;
          overflow: hidden;
        }
        /* Subtle grid */
        .auth-page-wrap::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
          opacity: 0.5;
        }

        /* Left side panel */
        .auth-left {
          flex: 1; display: none;
          flex-direction: column; justify-content: center;
          padding: 0 64px 0 56px;
          position: relative; z-index: 1;
        }
        @media (min-width: 960px) {
          .auth-left { display: flex; }
          .auth-right { justify-content: flex-end; padding-right: 7%; }
        }

        .auth-right {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative; z-index: 2;
          min-height: 100vh;
        }

        .auth-card {
          width: 100%; max-width: 420px;
          background: var(--surface);
          border: 1px solid var(--border2);
          border-radius: 20px;
          padding: 38px 36px;
          box-shadow: var(--shadow-lift);
          position: relative;
          box-sizing: border-box;
        }
        /* Card top shimmer line */
        .auth-card::before {
          content: '';
          position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity: 0.4; border-radius: 0 0 8px 8px;
        }

        /* Corner brand */
        .auth-brand {
          position: fixed; top: 26px; left: 32px; z-index: 10;
          display: none; align-items: center; gap: 10px; text-decoration: none;
        }
        @media (min-width: 960px) { .auth-brand { display: flex; } }
        .auth-brand-mark {
          width: 34px; height: 34px; border-radius: 9px;
          background: linear-gradient(135deg, #E9C97A, #D4AF54 60%, #A8842F);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Instrument Serif', serif;
          font-size: 13px; color: #0A0A0E; font-weight: 700;
        }
        .auth-brand-name {
          font-family: 'Instrument Serif', serif;
          font-size: 16px; color: var(--text); opacity: 0.7;
        }

        /* Toggle tabs */
        .auth-toggle {
          display: flex; background: var(--surface2);
          border: 1px solid var(--border); border-radius: 8px;
          margin-bottom: 24px; padding: 3px; gap: 2px;
        }
        .auth-toggle-btn {
          flex: 1; padding: 9px 0; border: none; cursor: pointer;
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          font-family: 'DM Sans', sans-serif; border-radius: 6px;
          transition: all 0.2s;
        }
        .auth-toggle-btn.active {
          background: var(--gold); color: #0A0A0E; font-weight: 600;
        }
        .auth-toggle-btn:not(.active) {
          background: transparent; color: var(--muted);
        }

        /* Phone field */
        .phone-wrap { position: relative; margin-bottom: 12px; }
        .phone-prefix {
          position: absolute; left: 0; top: 0; bottom: 0;
          display: flex; align-items: center; padding: 0 13px;
          font-family: 'DM Mono', monospace; font-size: 13px;
          color: var(--gold); border-right: 1px solid var(--border2);
          pointer-events: none; user-select: none;
        }
        .phone-valid-tick {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          width: 18px; height: 18px; border-radius: 50%;
          background: rgba(46,160,100,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: #6FCF97;
        }
        .phone-err-hint {
          font-size: 11px; color: #E57373;
          margin-top: -8px; margin-bottom: 12px;
        }

        /* Submit btn */
        .auth-submit {
          width: 100%; padding: 14px 0;
          border: none; font-size: 11px; letter-spacing: 0.18em;
          text-transform: uppercase; font-weight: 700;
          cursor: pointer; border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: filter 0.2s, transform 0.2s;
        }
        .auth-submit:not(:disabled):hover { filter: brightness(1.08); transform: translateY(-1px); }
        .auth-submit:disabled { cursor: not-allowed; }

        /* Field label */
        .auth-label {
          display: block; font-size: 10px; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--muted);
          font-family: 'DM Mono', monospace; margin-bottom: 6px;
        }

        /* Mobile bottom nav */
        .auth-mobile-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 100;
          background: var(--surface);
          border-top: 1px solid var(--border);
          padding: 8px 0 max(8px, env(safe-area-inset-bottom));
        }
        @media (max-width: 959px) {
          .auth-mobile-nav { display: flex; }
          .auth-right { padding-bottom: 80px; }
        }
        .auth-nav-item {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 4px; text-decoration: none; padding: 6px 4px;
          color: var(--muted); font-family: 'DM Mono', monospace;
          font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
          border: none; background: none; cursor: pointer; transition: color 0.2s;
        }
        .auth-nav-item.active { color: var(--gold); }
        .auth-nav-divider { width: 1px; background: var(--border); margin: 6px 0; flex-shrink: 0; }
      `}</style>

      {/* Corner brand */}
      <Link href="/" className="auth-brand">
        <div className="auth-brand-mark">BS</div>
        <span className="auth-brand-name">Brand <span style={{ color: 'var(--gold)' }}>Syndicate</span></span>
      </Link>

      <div className="auth-page-wrap">


        {/* Left side */}
        <div className="auth-left">
          {/* Brand mark */}
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, var(--gold-light), var(--gold) 60%, var(--gold-deep))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Instrument Serif',serif", fontSize: 20, color: '#0A0A0E', fontWeight: 700, marginBottom: 36, boxShadow: 'var(--shadow-gold)' }}>BS</div>

          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18 }}>AI Brand Studio</div>
          <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 42, lineHeight: 1.12, color: 'var(--text)', marginBottom: 18 }}>
            Your brand,<br /><em style={{ color: 'var(--gold)' }}>built in</em><br />60 seconds.
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.75, maxWidth: 300, fontFamily: "'DM Sans',sans-serif" }}>
            Generate a complete business brand, website, logo, graphics, and launch strategy, from a single prompt.
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 36 }}>
            {[['200+','Brands built'],['60s','Avg. time'],['Free','To start']].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 26, color: 'var(--gold)' }}>{n}</div>
                <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono',monospace", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right, card */}
        <div className="auth-right">
          <div className="auth-card">
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
                <div style={{ width: 50, height: 50, background: 'linear-gradient(135deg, var(--gold-light), var(--gold) 60%, var(--gold-deep))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Instrument Serif',serif", fontSize: 18, color: '#0A0A0E', fontWeight: 700, margin: '0 auto 16px', boxShadow: 'var(--shadow-gold)' }}>BS</div>
              </Link>
              <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 26, color: 'var(--text)', fontWeight: 400, marginBottom: 6, letterSpacing: '-0.01em' }}>
                {mode === 'signin'
                  ? <>Welcome <em style={{ fontStyle:'italic', color:'var(--gold)' }}>back.</em></>
                  : <>Create your <em style={{ fontStyle:'italic', color:'var(--gold)' }}>account.</em></>
                }
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>Business branding powered by AI.</p>
            </div>

            {/* Toggle */}
            <div className="auth-toggle">
              {(['signin','signup'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setShowPassword(false); setPhoneTouched(false) }} className={`auth-toggle-btn${mode === m ? ' active' : ''}`}>
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Error / success */}
            {error && (() => {
              const ok = error.startsWith('Account created')
              return (
                <div style={{ padding:'10px 14px', background: ok ? 'rgba(46,125,82,0.1)' : 'rgba(192,57,43,0.1)', border:`1px solid ${ok ? 'rgba(46,125,82,0.4)' : 'rgba(192,57,43,0.3)'}`, borderRadius:8, marginBottom:16, fontSize:12, color: ok ? '#6FCF97' : '#E57373' }}>
                  {ok ? '✓ ' : ''}{error}
                </div>
              )
            })()}

            <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
              {mode === 'signup' && (
                <div>
                  <label className="auth-label">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required style={inputStyle} />
                </div>
              )}

              <label className="auth-label">Mobile Number</label>
              <div className="phone-wrap">
                <div className="phone-prefix">+91</div>
                <input type="tel" inputMode="numeric" pattern="[0-9]*" value={rawDigits}
                  onChange={e => { const d = extractLocalDigits(e.target.value); setPhone(d); setPhoneTouched(true) }}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="98765 43210" required maxLength={10}
                  style={{ ...inputStyle, paddingLeft: 62, marginBottom: 0, letterSpacing: '0.06em' }}
                />
                {phoneValid && <div className="phone-valid-tick">✓</div>}
              </div>
              {phoneError && <div className="phone-err-hint">Enter a valid 10-digit Indian mobile number (6–9)</div>}

              <div style={{ marginTop: 4 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <label className="auth-label" style={{ marginBottom:0 }}>Password</label>
                  {mode === 'signin' && (
                    <Link href="/forgot-password" style={{ fontSize:11, color:'var(--muted)', textDecoration:'none', letterSpacing:'0.04em' }}
                      onMouseEnter={e => (e.currentTarget.style.color='var(--gold)')}
                      onMouseLeave={e => (e.currentTarget.style.color='var(--muted)')}>
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div style={{ position:'relative', marginBottom:20 }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'} required
                    minLength={mode === 'signup' ? 8 : undefined}
                    style={{ ...inputStyle, marginBottom:0, paddingRight:46 }}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--muted)', display:'flex', alignItems:'center', padding:4, transition:'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color='var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color='var(--muted)')}>
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-submit"
                style={{ background: loading ? 'rgba(212,175,84,0.5)' : 'linear-gradient(135deg, var(--gold-light), var(--gold) 55%, var(--gold-deep))', color:'#0A0A0E', boxShadow: loading ? 'none' : 'var(--shadow-gold)' }}>
                {loading && <span style={{ width:14, height:14, border:'2px solid rgba(0,0,0,0.3)', borderTopColor:'#000', borderRadius:'50%', animation:'spin 1s linear infinite', display:'block', flexShrink:0 }} />}
                {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p style={{ marginTop:20, fontSize:11, color:'var(--muted)', lineHeight:1.7, textAlign:'center' }}>
              By continuing you agree to our{' '}
              <Link href="/terms" style={{ color:'var(--muted)', textDecoration:'underline' }}>Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" style={{ color:'var(--muted)', textDecoration:'underline' }}>Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="auth-mobile-nav">
        <Link href="/" className="auth-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Home
        </Link>
        <div className="auth-nav-divider" />
        <Link href="/#pricing" className="auth-nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Pricing
        </Link>
        <div className="auth-nav-divider" />
        <Link href="/login" className="auth-nav-item active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Account
        </Link>
        <div className="auth-nav-divider" />
        <Link href="/generate" className="auth-nav-item" style={{ color:'var(--gold)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          Generate
        </Link>
      </nav>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:24, height:24, border:'1px solid var(--border2)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
