import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import Link from 'next/link'

export default async function Home() {
  const session = await auth()
  if (session) redirect('/generate')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: "'DM Sans', sans-serif",
      color: 'var(--cream)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
        <div style={{
          width: 36, height: 36, border: '1px solid var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Playfair Display', serif", fontSize: 11, color: 'var(--gold)', letterSpacing: '0.05em'
        }}>BS</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--cream)' }}>
          Brand <span style={{ color: 'var(--gold)' }}>·</span> Syndicate
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 640 }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(36px, 6vw, 60px)',
          fontWeight: 400,
          lineHeight: 1.15,
          marginBottom: 24,
          color: 'var(--cream)',
        }}>
          Your Brand.<br />
          <span style={{ color: 'var(--gold)' }}>Crafted by AI.</span>
        </h1>
        <p style={{
          fontSize: 16,
          color: 'var(--muted)',
          lineHeight: 1.7,
          marginBottom: 48,
          maxWidth: 480,
          margin: '0 auto 48px',
        }}>
          Generate a complete personal brand kit — headline, bio, portfolio, business card,
          resume bullets, and presentation slides — in seconds.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/generate" style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: 'var(--gold)',
            color: '#0a0a0b',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Try for Free →
          </Link>
          <Link href="/login" style={{
            display: 'inline-block',
            padding: '14px 32px',
            border: '1px solid var(--border2)',
            color: 'var(--muted)',
            textDecoration: 'none',
            fontSize: 13,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Sign In
          </Link>
        </div>
      </div>

      {/* Feature highlights */}
      <div style={{
        display: 'flex',
        gap: 32,
        marginTop: 80,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 720,
      }}>
        {[
          { label: 'Portfolio Copy', desc: 'Tailored sections for your work' },
          { label: 'Business Card', desc: 'Headline and tagline that land' },
          { label: 'Resume Bullets', desc: 'Achievement-framed, ATS-ready' },
          { label: 'Pitch Slides', desc: 'Presentation hook + slide deck' },
        ].map(f => (
          <div key={f.label} style={{
            flex: '1 1 140px',
            padding: '20px',
            border: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>{f.label}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 64, fontSize: 12, color: 'var(--muted)', opacity: 0.5, letterSpacing: '0.08em' }}>
        No account required to generate · Sign in to save your work
      </p>
    </div>
  )
}
