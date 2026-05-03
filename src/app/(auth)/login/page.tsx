'use client'

import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/>
      <circle cx="8" cy="8" r="2"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2l12 12M6.7 6.8a2 2 0 002.5 2.5"/>
      <path d="M4.2 4.3C2.6 5.3 1 8 1 8s2.5 5 7 5c1.4 0 2.7-.4 3.8-1M7 3.1C7.3 3 7.7 3 8 3c4.5 0 7 5 7 5s-.7 1.4-1.9 2.7"/>
    </svg>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()

  // BUG FIX #5: prevent callbackUrl pointing back to /login — causes infinite redirect loop
  const rawCallback = searchParams.get('callbackUrl') || '/generate'
  const callbackUrl =
    rawCallback === '/login' || rawCallback === '/signup' || rawCallback.startsWith('/login?')
      ? '/generate'
      : rawCallback

  const [mode, setMode] = useState<'signin' | 'signup'>(
    searchParams.get('tab') === 'signup' ? 'signup' : 'signin'
  )
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      email, password, redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('Invalid email or password.')
    } else {
      // Admin always goes to /admin; everyone else to callbackUrl
      const dest = email.trim().toLowerCase() === 'yashbajpaiknpindia@gmail.com'
        ? '/admin'
        : callbackUrl
      window.location.href = dest
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return }

      // Wait briefly for DB write to commit before attempting sign-in
      await new Promise(r => setTimeout(r, 300))

      // Auto sign-in after register — retry once on failure
      let signInRes = await signIn('credentials', { email, password, redirect: false })
      if (signInRes?.error) {
        await new Promise(r => setTimeout(r, 600))
        signInRes = await signIn('credentials', { email, password, redirect: false })
      }

      setLoading(false)
      if (signInRes?.error) {
        // Account was created — switch to sign-in tab so user can log in manually
        setMode('signin')
        setPassword('')
        setError('Account created! Please sign in with your new credentials.')
        return
      }
      // BUG FIX #6 (same): hard navigation after signup too
      window.location.href = callbackUrl
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', marginBottom: 12,
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--cream)', fontSize: 13, outline: 'none',
    borderRadius: 'var(--radius)', fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          width: 44, height: 44, border: '1px solid var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Playfair Display', serif", fontSize: 14,
          color: 'var(--gold)', margin: '0 auto 20px', letterSpacing: '0.05em',
        }}>BS</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: 'var(--cream)', fontWeight: 400, marginBottom: 8 }}>
          {mode === 'signin' ? 'Welcome back.' : 'Create your account.'}
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
          AI-powered personal branding studio.
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: 28, padding: 3 }}>
        {(['signin', 'signup'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); setError(''); setShowPassword(false) }} style={{
            flex: 1, padding: '8px 0',
            background: mode === m ? 'var(--gold)' : 'transparent',
            border: 'none', cursor: 'pointer',
            color: mode === m ? '#000' : 'var(--muted)',
            fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
            fontWeight: mode === m ? 500 : 400,
            borderRadius: 1, transition: 'all 0.2s',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {m === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Error / Success */}
      {error && (() => {
        const isSuccess = error.startsWith('Account created')
        return (
          <div style={{
            padding: '10px 14px',
            background: isSuccess ? 'rgba(46,125,82,0.1)' : 'rgba(192,57,43,0.1)',
            border: `1px solid ${isSuccess ? 'rgba(46,125,82,0.4)' : 'rgba(192,57,43,0.3)'}`,
            borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 12,
            color: isSuccess ? '#6FCF97' : '#E57373',
          }}>
            {isSuccess ? '✓ ' : ''}{error}
          </div>
        )
      })()}

      {/* Form */}
      <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
        {mode === 'signup' && (
          <div>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
              Full Name
            </label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your full name" required
              style={inputStyle}
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com" required
            style={inputStyle}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>
              Password
            </label>
            {mode === 'signin' && (
              <Link
                href="/forgot-password"
                style={{ fontSize: 11, color: 'var(--muted2)', textDecoration: 'none', letterSpacing: '0.04em' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted2)')}
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'} required
              minLength={mode === 'signup' ? 8 : undefined}
              style={{ ...inputStyle, marginBottom: 0, paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              title={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted2)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: 4, borderRadius: 2, transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted2)')}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '12px 0',
          background: loading ? 'rgba(201,168,76,0.6)' : 'var(--gold)',
          border: 'none', color: '#000',
          fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
          fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          borderRadius: 'var(--radius)', fontFamily: "'DM Sans', sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'all 0.2s',
        }}>
          {loading && (
            <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block', flexShrink: 0 }} />
          )}
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: 24, fontSize: 11, color: 'var(--muted2)', lineHeight: 1.7, textAlign: 'center' }}>
        By continuing you agree to our{' '}
        <Link href="/terms" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Privacy Policy</Link>.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <Suspense fallback={
        <div style={{ width: 24, height: 24, border: '1px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
