'use client'

import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/generate'

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

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
      router.push(callbackUrl)
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
      // Auto sign-in after register
      const signInRes = await signIn('credentials', { email, password, redirect: false })
      setLoading(false)
      if (signInRes?.error) { setError('Registered but sign-in failed. Please try signing in.'); return }
      router.push(callbackUrl)
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
          <button key={m} onClick={() => { setMode(m); setError('') }} style={{
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

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 12, color: '#E57373' }}>
          {error}
        </div>
      )}

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
          <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'} required
            minLength={mode === 'signup' ? 8 : undefined}
            style={{ ...inputStyle, marginBottom: 20 }}
          />
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
        By continuing you agree to our Terms of Service and Privacy Policy.
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
