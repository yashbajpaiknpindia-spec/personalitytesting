'use client'

import Link from 'next/link'
import { useState, Suspense } from 'react'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', marginBottom: 20,
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--cream)', fontSize: 13, outline: 'none',
    borderRadius: 'var(--radius)', fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    // In a real implementation, this would call an API endpoint to send a reset email.
    // For now we simulate the request and always succeed.
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <div style={{
            width: 44, height: 44, border: '1px solid var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', serif", fontSize: 14,
            color: 'var(--gold)', margin: '0 auto 20px', letterSpacing: '0.05em',
          }}>BS</div>
        </Link>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: 'var(--cream)', fontWeight: 400, marginBottom: 8 }}>
          {submitted ? 'Check your inbox.' : 'Forgot your password?'}
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
          {submitted
            ? `We've sent a reset link to ${email}`
            : 'Enter your email and we\'ll send you a link to reset your password.'}
        </p>
      </div>

      {submitted ? (
        <div>
          <div style={{
            padding: '20px 20px',
            background: 'rgba(46,125,82,0.08)',
            border: '1px solid rgba(46,125,82,0.3)',
            borderRadius: 'var(--radius)',
            marginBottom: 24,
            fontSize: 13,
            color: '#6FCF97',
            lineHeight: 1.7,
            textAlign: 'center',
          }}>
            ✓ Reset link sent! Check your spam folder if you don&apos;t see it within a few minutes.
          </div>
          <button
            onClick={() => { setSubmitted(false); setEmail('') }}
            style={{
              width: '100%', padding: '11px 0',
              background: 'transparent',
              border: '1px solid var(--border2)',
              color: 'var(--muted)',
              fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', borderRadius: 'var(--radius)',
              fontFamily: "'DM Sans', sans-serif", marginBottom: 16,
            }}
          >
            Try a different email
          </button>
        </div>
      ) : (
        <>
          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(192,57,43,0.1)',
              border: '1px solid rgba(192,57,43,0.3)',
              borderRadius: 'var(--radius)', marginBottom: 16, fontSize: 12,
              color: '#E57373',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={{
              display: 'block', fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--muted)',
              fontFamily: "'DM Mono', monospace", marginBottom: 6,
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              style={inputStyle}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 0',
                background: loading ? 'rgba(201,168,76,0.6)' : 'var(--gold)',
                border: 'none', color: '#000',
                fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
                fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: 'var(--radius)', fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s',
              }}
            >
              {loading && (
                <span style={{
                  width: 14, height: 14,
                  border: '2px solid rgba(0,0,0,0.3)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  display: 'block',
                  flexShrink: 0,
                }} />
              )}
              {loading ? 'Sending link…' : 'Send Reset Link'}
            </button>
          </form>
        </>
      )}

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--muted2)', textAlign: 'center' }}>
        Remembered it?{' '}
        <Link href="/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
          Back to Sign In
        </Link>
      </p>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <Suspense fallback={
        <div style={{ width: 24, height: 24, border: '1px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      }>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}
