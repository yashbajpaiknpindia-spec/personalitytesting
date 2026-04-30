import Link from 'next/link'
import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'About Brand Syndicate — Mission, Story & Values',
  description:
    'Brand Syndicate is an AI-powered personal branding studio making world-class branding accessible to every professional. Learn how we work, what we build, and why.',
  keywords: ['about brand syndicate', 'AI branding company', 'personal branding platform', 'AI career tools'],
  alternates: { canonical: `${APP_URL}/about` },
  openGraph: {
    title: 'About Brand Syndicate — Mission, Story & Values',
    description: 'Making world-class personal branding accessible to every professional — with the power of AI.',
    url: `${APP_URL}/about`,
    type: 'website',
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630, alt: 'About Brand Syndicate' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Brand Syndicate',
    description: 'Making world-class personal branding accessible to every professional — with AI.',
    images: [`${APP_URL}/og-default.png`],
  },
}

// Single, correct JSON-LD definition (removed duplicate declaration)
const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${APP_URL}/about#webpage`,
  url: `${APP_URL}/about`,
  name: 'About Brand Syndicate',
  description: 'Brand Syndicate is an AI-powered personal branding studio helping professionals craft their identity.',
  isPartOf: { '@id': `${APP_URL}/#website` },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'About', item: `${APP_URL}/about` },
    ],
  },
}

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }} />
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
            <Link href="/generate" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.08em' }}>Try for Free →</Link>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 32px 0' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
            About Us
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 400,
            color: 'var(--cream)',
            lineHeight: 1.15,
            marginBottom: 32,
            maxWidth: 680,
          }}>
            Your brand, built by AI.<br />
            <span style={{ color: 'var(--gold)' }}>In seconds.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.8, maxWidth: 600, marginBottom: 64 }}>
            Brand Syndicate is an AI-powered personal branding studio that helps professionals, freelancers, and entrepreneurs present themselves with clarity and confidence — without hiring a branding agency or a copywriter.
          </p>
        </div>

        {/* Mission */}
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 32px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Our Mission</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: 'var(--cream)', marginBottom: 20, lineHeight: 1.3 }}>
                Making world-class branding accessible to everyone.
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.85 }}>
                Professional branding used to cost thousands of dollars and weeks of back-and-forth with agencies. We believe every professional deserves a compelling, consistent brand — regardless of budget or connections.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>How It Works</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: 'var(--cream)', marginBottom: 20, lineHeight: 1.3 }}>
                Tell us who you are. We do the rest.
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.85 }}>
                You answer a few questions about your work, skills, and goals. Our AI then generates a complete brand kit — headline, bio, portfolio copy, business card taglines, resume bullets, and presentation slides — in under a minute.
              </p>
            </div>
          </div>
        </div>

        {/* What we build */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 32px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 32 }}>What We Generate</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, border: '1px solid var(--border)', background: 'var(--border)' }}>
            {[
              { title: 'Portfolio Copy', desc: 'Hero headline, about section, and project descriptions tailored to your target audience.' },
              { title: 'Business Card', desc: 'Punchy taglines and value propositions that communicate your edge at a glance.' },
              { title: 'Resume Bullets', desc: 'Achievement-focused, ATS-optimized bullet points framed with impact metrics.' },
              { title: 'Pitch Deck Slides', desc: 'Opening hook, narrative arc, and slide structure for investor or client presentations.' },
              { title: 'LinkedIn Bio', desc: 'Summary text that balances keywords with authentic voice for discoverability.' },
              { title: 'Brand Templates', desc: 'Visual layout templates for portfolios, cards, and presentations in your style.' },
            ].map(item => (
              <div key={item.title} style={{ padding: '32px 28px', background: 'var(--surface)' }}>
                <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>{item.title}</div>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.75 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 32px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Our Values</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 400, color: 'var(--cream)', marginBottom: 48, lineHeight: 1.3 }}>
              Built on trust, transparency, and craft.
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40 }}>
              {[
                { title: 'Privacy First', desc: "Your data is used only to power your experience. We don't sell it, share it unnecessarily, or use it to train models without consent." },
                { title: 'Quality Over Speed', desc: "Every AI output is designed to feel human-crafted — thoughtful, specific, and personalized to your actual story." },
                { title: 'Radical Accessibility', desc: "A polished professional brand should not require a six-figure budget. We're leveling the playing field." },
                { title: 'Honest AI', desc: "We're clear about what AI can and can't do. We encourage you to review and personalize everything we generate." },
              ].map(v => (
                <div key={v.title}>
                  <div style={{ width: 32, height: 1, background: 'var(--gold)', marginBottom: 16 }} />
                  <h3 style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 500, marginBottom: 10 }}>{v.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 32px 120px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 400, color: 'var(--cream)', marginBottom: 20 }}>
            Ready to build your brand?
          </h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 40 }}>
            No account required. Start generating in seconds.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/generate" style={{
              display: 'inline-block', padding: '14px 36px',
              background: 'var(--gold)', color: '#000',
              textDecoration: 'none', fontWeight: 600, fontSize: 12,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              Try for Free →
            </Link>
            <Link href="/contact" style={{
              display: 'inline-block', padding: '14px 36px',
              border: '1px solid var(--border2)', color: 'var(--muted)',
              textDecoration: 'none', fontSize: 12,
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              Get in Touch
            </Link>
          </div>
          <div style={{ marginTop: 80, paddingTop: 32, borderTop: '1px solid var(--border)', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/privacy" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/contact" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Contact</Link>
          </div>
        </div>
      </div>
    </>
  )
}
