'use client'

import { useRouter } from 'next/navigation'

export default function GenerateIntentPage() {
  const router = useRouter()

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '40px 20px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{
          fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--gold)', fontFamily: "'DM Mono', monospace",
          marginBottom: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 10,
        }}>
          <div style={{ width: 24, height: 1, background: 'var(--gold)' }} />
          AI Generation Studio
          <div style={{ width: 24, height: 1, background: 'var(--gold)' }} />
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(28px, 4vw, 48px)',
          fontWeight: 400, color: 'var(--cream)', lineHeight: 1.2, margin: 0,
        }}>
          What are you building today?
        </h1>
      </div>

      <div style={{
        display: 'flex', gap: 24, flexWrap: 'wrap',
        justifyContent: 'center', width: '100%', maxWidth: 760,
      }}>
        {[
          {
            href: '/generate/personal',
            mode: 'Personal',
            title: 'Personal Brand',
            desc: 'Portfolio, resume, and pitch deck —\ngenerated from one prompt.',
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="7" r="4" stroke="var(--gold)" strokeWidth="1.4"/>
                <path d="M2 20c0-4 4-7 9-7s9 3 9 7" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ),
          },
          {
            href: '/generate/business',
            mode: 'Business ✦',
            title: 'Business Identity',
            desc: 'Brand images and copy —\ngenerated from one business prompt.',
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="3" y="8" width="16" height="11" rx="1.5" stroke="var(--gold)" strokeWidth="1.4"/>
                <path d="M8 8V6a3 3 0 0 1 6 0v2" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round"/>
                <path d="M7 13h8M7 16h5" stroke="var(--gold)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            ),
          },
        ].map(card => (
          <button
            key={card.href}
            onClick={() => router.push(card.href)}
            style={{
              flex: '1 1 300px', maxWidth: 360,
              background: 'var(--surface)', border: '1px solid var(--border2)',
              borderRadius: 'var(--radius)', padding: '40px 36px',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.border = '1px solid var(--gold)'
              el.style.background = 'var(--gold-dim)'
              el.style.transform = 'translateY(-2px)'
              el.style.boxShadow = '0 16px 48px rgba(201,168,76,0.12)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.border = '1px solid var(--border2)'
              el.style.background = 'var(--surface)'
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
            }}>
              {card.icon}
            </div>
            <div style={{
              fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 10,
            }}>{card.mode}</div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 24, fontWeight: 400, color: 'var(--cream)',
              marginBottom: 12, lineHeight: 1.2,
            }}>{card.title}</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
              {card.desc}
            </p>
            <div style={{
              marginTop: 28, display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--gold)', fontFamily: "'DM Mono', monospace",
            }}>
              Start building
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        ))}
      </div>

      <p style={{
        marginTop: 40, fontSize: 11, color: 'var(--muted2)',
        fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', textAlign: 'center',
      }}>
        Switch modes at any time from the top navigation
      </p>
    </div>
  )
}
