'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--cream)',
    fontSize: 14,
    outline: 'none',
    borderRadius: 'var(--radius)',
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: 20,
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    fontFamily: "'DM Mono', monospace",
    marginBottom: 8,
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
    } catch {
      // Submission attempted; show success regardless to avoid exposing internals
    }
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      fontFamily: "'DM Sans', sans-serif",
      color: 'var(--cream)',
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, border: '1px solid var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', serif", fontSize: 10, color: 'var(--gold)',
          }}>BS</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--cream)' }}>
            Brand <span style={{ color: 'var(--gold)' }}>·</span> Syndicate
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/about" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.08em' }}>About</Link>
          <Link href="/generate" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.08em' }}>Try for Free →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 80 }}>

        {/* Left: Info */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
            Contact
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 400, color: 'var(--cream)', marginBottom: 24, lineHeight: 1.2 }}>
            Get in touch.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.85, marginBottom: 48 }}>
            Have a question about Brand Syndicate? Need help with your account or billing? Want to report an issue or share feedback? We&apos;d love to hear from you.
          </p>

          {/* Contact info boxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '18px 20px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Email</div>
              <a href="mailto:hello@brandsyndicate.in" style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>hello@brandsyndicate.in</a>
            </div>

            <div style={{ padding: '18px 20px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Phone</div>
              <a href="tel:+917897671348" style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>+91 78976 71348</a>
            </div>

            <div style={{ padding: '18px 20px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Address</div>
              <address style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'normal', lineHeight: 1.7 }}>
                Kidwai Nagar, Kanpur<br />
                Uttar Pradesh — 208011<br />
                India
              </address>
            </div>
          </div>

          <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--muted2)', lineHeight: 1.8 }}>
            <p>Response time: typically within 1–2 business days.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 20 }}>
              <Link href="/privacy" style={{ color: 'var(--muted2)', textDecoration: 'none' }}>Privacy Policy</Link>
              <Link href="/terms" style={{ color: 'var(--muted2)', textDecoration: 'none' }}>Terms of Service</Link>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div>
          {submitted ? (
            <div style={{
              padding: '48px 32px',
              border: '1px solid rgba(46,125,82,0.3)',
              background: 'rgba(46,125,82,0.05)',
              borderRadius: 'var(--radius)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 400, color: 'var(--cream)', marginBottom: 12 }}>Message sent.</h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.8 }}>
                Thank you for reaching out. We&apos;ll get back to you within 1–2 business days.
              </p>
              <button
                onClick={() => { setSubmitted(false); setName(''); setEmail(''); setSubject(''); setMessage('') }}
                style={{
                  marginTop: 24,
                  padding: '10px 24px',
                  background: 'transparent',
                  border: '1px solid var(--border2)',
                  color: 'var(--muted)',
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <label style={labelStyle}>Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="">Select a topic…</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing & Subscriptions</option>
                <option value="privacy">Privacy or Data Request</option>
                <option value="bug">Report a Bug</option>
                <option value="feedback">Feature Feedback</option>
                <option value="partnership">Partnership Inquiry</option>
                <option value="other">Other</option>
              </select>

              <label style={labelStyle}>Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us how we can help…"
                required
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 0',
                  background: loading ? 'rgba(201,168,76,0.6)' : 'var(--gold)',
                  border: 'none',
                  color: '#000',
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  borderRadius: 'var(--radius)',
                  fontFamily: "'DM Sans', sans-serif",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
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
                {loading ? 'Sending…' : 'Send Message'}
              </button>

              <p style={{ marginTop: 16, fontSize: 11, color: 'var(--muted2)', lineHeight: 1.7 }}>
                By submitting, you agree to our{' '}
                <Link href="/privacy" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Privacy Policy</Link>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
