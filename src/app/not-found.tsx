import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 — Page Not Found · Brand Syndicate',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <>
      <style>{`
        .nf-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 70% 20%, rgba(201,168,76,0.06), transparent 40%),
            radial-gradient(circle at 20% 80%, rgba(120,35,30,0.12), transparent 40%),
            linear-gradient(180deg, #070706 0%, #0f0c09 60%, #15100c 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; text-align: center; font-family: 'DM Sans', sans-serif;
          position: relative; overflow: hidden;
        }
        .nf-page::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 10%, transparent 100%);
        }
        .nf-inner { position: relative; z-index: 2; max-width: 480px; }
        .nf-code {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(96px, 18vw, 140px);
          line-height: 1;
          background: linear-gradient(135deg, var(--gold-light, #E2C57A), var(--gold, #C9A84C) 55%, var(--gold-deep, #A07830));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 8px;
          letter-spacing: -4px;
        }
        .nf-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(22px, 5vw, 30px);
          color: var(--text, #F4EFE5);
          font-weight: 400;
          margin: 0 0 14px;
        }
        .nf-sub {
          font-size: 14px;
          color: var(--muted, #A39B8F);
          line-height: 1.7;
          margin: 0 0 36px;
        }
        .nf-links {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
        }
        .nf-btn-primary {
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--gold-light, #E2C57A), var(--gold, #C9A84C) 55%, var(--gold-deep, #A07830));
          color: #0A0A0E; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
          font-weight: 700; text-decoration: none; border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 20px rgba(201,168,76,0.25);
          transition: filter 0.2s, transform 0.2s;
        }
        .nf-btn-primary:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .nf-btn-outline {
          padding: 12px 24px;
          background: transparent;
          border: 1px solid rgba(201,168,76,0.3);
          color: var(--muted, #A39B8F); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
          font-weight: 600; text-decoration: none; border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, color 0.2s;
        }
        .nf-btn-outline:hover { border-color: var(--gold, #C9A84C); color: var(--gold, #C9A84C); }
        .nf-divider {
          width: 1px; height: 1px;
          border-top: 1px solid rgba(201,168,76,0.2);
          width: 48px; margin: 36px auto;
        }
        .nf-hint {
          font-size: 12px; color: var(--muted, #A39B8F);
          font-family: 'DM Mono', monospace; letter-spacing: 0.08em;
        }
      `}</style>

      <div className="nf-page">
        <div className="nf-inner">
          <div className="nf-code">404</div>
          <h1 className="nf-title">Page not found</h1>
          <p className="nf-sub">
            The page you were looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="nf-links">
            <Link href="/" className="nf-btn-primary">Back to Home</Link>
            <Link href="/generate" className="nf-btn-outline">Generate Now</Link>
          </div>
          <div className="nf-divider" />
          <p className="nf-hint">Need help? <Link href="/contact" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Contact us</Link></p>
        </div>
      </div>
    </>
  )
}
