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
    // Small delay so it doesn't flash on first paint
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(COOKIE_KEY) as ConsentValue | null
        if (!stored) setVisible(true)
        else setConsent(stored)
      } catch {
        // localStorage unavailable (SSR or blocked) — show banner
        setVisible(true)
      }
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  function save(value: 'accepted' | 'declined') {
    try {
      localStorage.setItem(COOKIE_KEY, value)
    } catch { /* ignore */ }
    setConsent(value)
    setVisible(false)
  }

  if (!visible || consent !== null) return null

  return (
    <>
      {/* Backdrop blur on mobile */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9990,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(2px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
      }} className="cookie-backdrop-mobile" />

      {/* Banner */}
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
          width: 'min(580px, calc(100vw - 32px))',
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: 4,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.08)',
          padding: '20px 24px',
          fontFamily: "'DM Sans', sans-serif",
          animation: 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(16px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          .cookie-backdrop-mobile { display: none; }
          @media (max-width: 600px) {
            .cookie-backdrop-mobile { display: block; }
          }
        `}</style>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Cookie icon */}
            <div style={{
              width: 28, height: 28, border: '1px solid var(--border2)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
            }}>🍪</div>
            <span style={{
              fontSize: 12, fontWeight: 500, color: 'var(--cream)',
              letterSpacing: '0.04em',
            }}>
              We use cookies
            </span>
          </div>

          {/* Gold accent line */}
          <div style={{ width: 24, height: 1, background: 'var(--gold)', marginTop: 14, flexShrink: 0 }} />
        </div>

        {/* Body */}
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 16 }}>
          Brand Syndicate uses cookies to keep you signed in, remember your preferences, and measure how our site is used.
          We also serve ads through Google AdSense, which may set its own cookies on your device.{' '}
          <button
            onClick={() => setShowDetails(d => !d)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--gold)', fontSize: 12, padding: 0,
              textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {showDetails ? 'Show less' : 'Learn more'}
          </button>
        </p>

        {showDetails && (
          <div style={{
            fontSize: 11, color: 'var(--muted2)', lineHeight: 1.8, marginBottom: 16,
            padding: '12px 14px', background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 2,
          }}>
            <strong style={{ color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Cookies we use:</strong>
            <div style={{ display: 'grid', gap: 6 }}>
              <div><span style={{ color: 'var(--cream)' }}>Essential</span> — Session tokens and authentication. Required for the site to work. Cannot be declined.</div>
              <div><span style={{ color: 'var(--cream)' }}>Analytics</span> — Anonymous usage stats (Google Analytics) to improve the product.</div>
              <div><span style={{ color: 'var(--cream)' }}>Advertising</span> — Google AdSense uses cookies to serve relevant ads. Declining disables personalised ads but ads may still appear.</div>
            </div>
            <div style={{ marginTop: 8 }}>
              Read our full{' '}
              <Link href="/privacy" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Privacy Policy</Link>
              {' '}for details.
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => save('accepted')}
            style={{
              flex: '1 1 140px',
              padding: '9px 16px',
              background: 'var(--gold)',
              border: 'none',
              color: '#000',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: 'var(--radius)',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'background 0.2s',
            }}
          >
            Accept All
          </button>
          <button
            onClick={() => save('declined')}
            style={{
              flex: '1 1 120px',
              padding: '9px 16px',
              background: 'transparent',
              border: '1px solid var(--border2)',
              color: 'var(--muted)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: 'var(--radius)',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'border-color 0.2s',
            }}
          >
            Decline Optional
          </button>
          <Link
            href="/privacy"
            style={{
              display: 'flex', alignItems: 'center',
              fontSize: 10, color: 'var(--muted2)', textDecoration: 'none',
              letterSpacing: '0.06em', padding: '9px 4px',
              whiteSpace: 'nowrap',
            }}
          >
            Privacy Policy →
          </Link>
        </div>
      </div>
    </>
  )
}
