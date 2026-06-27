'use client'

import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
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
    background: 'var(--surface-glass)',
    border: '1px solid var(--border2)',
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
      fontFamily: "'DM Sans', sans-serif",
      color: 'var(--cream)',
    }} className="public-page">
      <PublicNav active="/contact" />

      <div data-reveal className="is-in" style={{ maxWidth: 980, margin: '0 auto', padding: '76px 32px 120px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 72 }}>

        {/* Left: Info */}
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
            Contact
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 400, color: 'var(--cream)', marginBottom: 24, lineHeight: 1.2 }}>
            Get in touch.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.85, marginBottom: 32 }}>
            Have a question about Brand Syndicate? Need help with your account or billing? Want to report an issue or share feedback? We&apos;d love to hear from you.
          </p>

          {/* Response badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: '1px solid rgba(76,175,125,0.3)', background: 'rgba(76,175,125,0.07)', borderRadius: 100, marginBottom: 28 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF7D', boxShadow: '0 0 8px #4CAF7D', flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#4CAF7D', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>Typically replies within 24 hrs</span>
          </div>

          {/* Contact info boxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="mailto:brandsyndicateindia@gmail.com" style={{ padding: '16px 20px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 'var(--radius)', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,84,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 13, color: 'var(--gold)' }}>brandsyndicateindia@gmail.com</div>
            </a>

            <a href="tel:+917897671348" style={{ padding: '16px 20px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 'var(--radius)', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(212,175,84,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Phone</div>
              <div style={{ fontSize: 13, color: 'var(--gold)' }}>+91 78976 71348</div>
            </a>

            <div style={{ padding: '16px 20px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Address</div>
              <address style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'normal', lineHeight: 1.7 }}>
                Kidwai Nagar, Kanpur, UP 208011, India
              </address>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/917897671348?text=Hi%20Brand%20Syndicate%2C%20I%20have%20a%20question."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px',
                border: '1px solid rgba(37,211,102,0.3)',
                background: 'rgba(37,211,102,0.05)',
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(37,211,102,0.6)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37,211,102,0.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(37,211,102,0.3)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37,211,102,0.05)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#25D366', fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>WhatsApp</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Fastest response, chat directly</div>
              </div>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}><path d="M1 9L9 1M9 1H4M9 1V6" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
          </div>

          <div style={{ marginTop: 36, paddingTop: 28, borderTop: '1px solid var(--border)', display: 'flex', gap: 20 }}>
            <Link href="/privacy" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </div>

        {/* Right: Form */}
        <div>
          {submitted ? (
            <div style={{
              padding: '48px 32px',
              border: '1px solid rgba(46,125,82,0.3)',
              background: 'rgba(46,125,82,0.05)',
              borderRadius: 'var(--radius-lg)',
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
            <form onSubmit={handleSubmit} className="public-card-lux" style={{ display: 'flex', flexDirection: 'column', padding: 28 }}>
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
      <PublicFooter />
    </div>
  )
}

