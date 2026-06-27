'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COOKIE_KEY = 'bs_cookie_consent'

type ConsentValue = 'accepted' | 'declined' | null

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null)
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(COOKIE_KEY) as ConsentValue | null
        if (!stored) setVisible(true)
        else setConsent(stored)
      } catch {
        setVisible(true)
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  function save(value: 'accepted' | 'declined') {
    try { localStorage.setItem(COOKIE_KEY, value) } catch { /* ignore */ }
    setConsent(value)
    setVisible(false)
  }

  if (!visible || consent !== null) return null

  return (
    <>
      {/* Mobile backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9990,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          pointerEvents: 'none',
        }}
        className="cookie-backdrop-mobile"
      />

      <div
        role="dialog"
        aria-label="Cookie consent"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: 'min(560px, calc(100vw - 32px))',
          background: 'var(--surface)',
          border: '1px solid var(--border-glow)',
          borderRadius: 6,
          boxShadow: 'var(--shadow-lift)',
          padding: '22px 24px 20px',
          fontFamily: "'DM Sans', sans-serif",
          animation: 'bsCookieUp 0.4s cubic-bezier(0.16,1,0.3,1)',
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes bsCookieUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          .cookie-backdrop-mobile { display: none; }
          @media (max-width: 600px) { .cookie-backdrop-mobile { display: block; } }
        `}</style>

        {/* Warm amber glow top-left */}
        <div aria-hidden style={{
          position: 'absolute', top: -40, left: -40, width: 180, height: 180,
          background: 'radial-gradient(circle, var(--gold-glow) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        {/* Deep red glow bottom-right */}
        <div aria-hidden style={{
          position: 'absolute', bottom: -50, right: -30, width: 200, height: 160,
          background: 'radial-gradient(circle, var(--crimson-dim) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            {/* BS Logo Mark */}
            <div style={{ flexShrink: 0 }}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="7" fill="url(#bsLogoGrad)"/>
                <defs>
                  <linearGradient id="bsLogoGrad" x1="0" y1="0" x2="36" y2="36">
                    <stop offset="0%" stopColor="#2a1f0f"/>
                    <stop offset="100%" stopColor="#1a1208"/>
                  </linearGradient>
                  <linearGradient id="bsTextGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#E9C97A"/>
                    <stop offset="55%" stopColor="#C9A84C"/>
                    <stop offset="100%" stopColor="#A8842F"/>
                  </linearGradient>
                </defs>
                {/* Outer ring */}
                <rect x="1" y="1" width="34" height="34" rx="6.5" stroke="url(#bsTextGrad)" strokeWidth="0.6" strokeOpacity="0.5"/>
                {/* BS monogram side by side */}
                <text
                  x="18" y="24"
                  fontFamily="'Instrument Serif', Georgia, serif"
                  fontSize="17"
                  fontWeight="400"
                  fill="url(#bsTextGrad)"
                  textAnchor="middle"
                  letterSpacing="1"
                >BS</text>
                {/* Subtle bottom line accent */}
                <rect x="10" y="27.5" width="16" height="0.8" rx="0.4" fill="url(#bsTextGrad)" opacity="0.5"/>
              </svg>
            </div>

            <div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--cream)',
                letterSpacing: '0.02em', lineHeight: 1.2,
              }}>Brand Syndicate</div>
              <div style={{
                fontSize: 9.5, color: 'var(--gold)', letterSpacing: '0.18em',
                textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
                marginTop: 2,
              }}>AI Brand Studio</div>
            </div>
          </div>

          {/* Gold rule */}
          <div style={{ width: 28, height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)', flexShrink: 0 }} />
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 14, position: 'relative' }} />

        {/* Body */}
        <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 14, position: 'relative' }}>
          We use cookies to keep you signed in, personalise your brand experience, and understand how Brand Syndicate is used, so we can keep making it better.{' '}
          <button
            onClick={() => setShowDetails(d => !d)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--gold)', fontSize: 12.5, padding: 0,
              textDecoration: 'underline', textDecorationColor: 'var(--gold-dim)',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {showDetails ? 'Show less' : 'What we collect'}
          </button>
        </p>

        {showDetails && (
          <div style={{
            fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 14,
            padding: '12px 14px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 4, position: 'relative',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <span style={{ color: 'var(--cream)', fontWeight: 500 }}>Essential</span>
                {', '}Session tokens and authentication. Required to keep you signed in. Cannot be declined.
              </div>
              <div>
                <span style={{ color: 'var(--cream)', fontWeight: 500 }}>Analytics</span>
                {', '}Anonymous usage data (Google Analytics) to help us improve the platform.
              </div>
              <div>
                <span style={{ color: 'var(--cream)', fontWeight: 500 }}>Preferences</span>
                {', '}Your brand colour, theme, and generation settings, stored locally.
              </div>
            </div>
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 11 }}>
              Read our{' '}
              <Link href="/privacy" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Privacy Policy</Link>
              {' '}for full details.
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative' }}>
          <button
            onClick={() => save('accepted')}
            style={{
              flex: '1 1 150px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #E9C97A, #C9A84C 55%, #A8842F)',
              border: 'none',
              color: '#09090A',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: 3,
              fontFamily: "'DM Mono', monospace",
              boxShadow: 'var(--shadow-gold)',
              transition: 'filter 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = '' }}
          >
            Accept All
          </button>
          <button
            onClick={() => save('declined')}
            style={{
              flex: '1 1 120px',
              padding: '10px 18px',
              background: 'transparent',
              border: '1px solid var(--border2)',
              color: 'var(--muted)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: 3,
              fontFamily: "'DM Mono', monospace",
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'var(--border-glow)'
              el.style.color = 'var(--cream)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'var(--border2)'
              el.style.color = 'var(--muted)'
            }}
          >
            Essential Only
          </button>
          <Link
            href="/privacy"
            style={{
              display: 'flex', alignItems: 'center',
              fontSize: 10, color: 'var(--gold-deep)', textDecoration: 'none',
              letterSpacing: '0.08em', padding: '10px 4px',
              whiteSpace: 'nowrap', fontFamily: "'DM Mono', monospace",
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--gold)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--gold-deep)' }}
          >
            Privacy →
          </Link>
        </div>
      </div>
    </>
  )
}
