import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'About Brand Syndicate — AI Meets Human Creativity',
  description:
    'Brand Syndicate is where AI meets human creativity. We build premium websites, cinematic graphics, logos, and launch strategy — fast, refined, and ready to launch.',
  keywords: ['about brand syndicate', 'AI meets human creativity', 'branding studio India', 'intelligent branding', 'refined brand design'],
  alternates: { canonical: `${APP_URL}/about` },
  openGraph: {
    title: 'About Brand Syndicate — AI Meets Human Creativity',
    description: 'Intelligent speed. Human quality. Premium brand launches for startups, creators, and businesses.',
    url: `${APP_URL}/about`,
    type: 'website',
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630, alt: 'About Brand Syndicate' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Brand Syndicate',
    description: 'AI meets human creativity. Premium brand launches built fast.',
    images: [`${APP_URL}/og-default.png`],
  },
}

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${APP_URL}/about#webpage`,
  url: `${APP_URL}/about`,
  name: 'About Brand Syndicate',
  description: 'Brand Syndicate is a premium brand launch studio where AI meets human creativity — building websites, graphics, logos, and marketing strategy for startups and businesses.',
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
        fontFamily: "'DM Sans', sans-serif",
        color: 'var(--cream)',
      }} className="public-page">
        <PublicNav active="/about" />

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
            maxWidth: 720,
          }}>
            Where AI meets<br />
            human creativity.<br />
            <span style={{ color: 'var(--gold)' }}>Your brand, built right.</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.8, maxWidth: 620, marginBottom: 64 }}>
            Brand Syndicate is a premium brand launch studio for startups, creators, and businesses. We combine intelligent creative direction with real human craft, delivering websites, graphics, logos, and marketing strategy that actually moves your business forward.
          </p>
        </div>

        {/* What makes us different */}
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 32px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>The AI Layer</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: 'var(--cream)', marginBottom: 20, lineHeight: 1.3 }}>
                Speed without sacrificing direction.
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.85 }}>
                Our AI generates an instant brand preview: website copy, logo directions, social graphics, and a content strategy, the moment you describe your business. It gives you a real, tangible direction to react to, not a blank page.
              </p>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>The Human Layer</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: 'var(--cream)', marginBottom: 20, lineHeight: 1.3 }}>
                Craft that AI alone can't deliver.
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.85 }}>
                Our trained creative team reviews every AI output, applies brand thinking, refines the details, and polishes the final deliverable to premium standards. The result feels hand-crafted, because it is.
              </p>
            </div>
          </div>
        </div>

        {/* What we deliver */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 32px' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 32 }}>What We Build</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, border: '1px solid var(--border)', background: 'var(--border)' }}>
            {[
              { title: 'Website', desc: 'Custom-built pages, hero sections, service blocks, contact forms and CTAs, designed around your specific audience and offer.' },
              { title: 'Brand Graphics', desc: 'Cinematic campaign visuals, social posts, and branded creatives that stop the scroll and communicate your identity.' },
              { title: 'Logo System', desc: 'Logo concepts, usage direction, colour palette, and typography, a complete visual identity, not just an icon.' },
              { title: 'Content Strategy', desc: 'Positioning, audience breakdown, content pillars, and a 30-day social plan to drive consistent growth.' },
              { title: 'Marketing Copy', desc: 'Headlines, offer blocks, CTAs, and social captions, written to convert, not just to sound good.' },
              { title: 'Brand Guidelines', desc: 'A structured document covering tone of voice, visual rules, and usage examples so your brand stays consistent.' },
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
              Honest. Human. High-craft.
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40 }}>
              {[
                { title: 'Honest About AI', desc: 'We never hide that AI is part of our process. We also never hide the human work that makes it good. Both matter, and we\'re transparent about both.' },
                { title: 'Human Craft First', desc: 'Every deliverable is reviewed, shaped, and refined by real creatives. AI sets the direction; humans make the decisions that count.' },
                { title: 'Accessible Quality', desc: 'Premium-looking brands shouldn\'t require a ₹50,000 agency. We\'ve built a system that brings that quality within reach for startups and small businesses.' },
                { title: 'Client Clarity', desc: 'Every section, graphic, and CTA should make your offer easier to understand and easier to buy. That\'s the standard we build to.' },
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
            See what we can build for you.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 40 }}>
            Generate a free brand preview, no card, no commitment. Our team will take it from there.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/generate" style={{
              display: 'inline-block', padding: '14px 36px',
              background: 'var(--gold)', color: '#000',
              textDecoration: 'none', fontWeight: 600, fontSize: 12,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              borderRadius: 4,
            }}>
              Get Free Preview →
            </Link>
            <Link href="/contact" style={{
              display: 'inline-block', padding: '14px 36px',
              border: '1px solid var(--border2)', color: 'var(--muted)',
              textDecoration: 'none', fontSize: 12,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              borderRadius: 4,
            }}>
              Talk to Our Team
            </Link>
          </div>
          <div style={{ marginTop: 80, paddingTop: 32, borderTop: '1px solid var(--border)', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/privacy" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/terms" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/contact" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Contact</Link>
          </div>
        </div>
        <PublicFooter />
      </div>
    </>
  )
}
