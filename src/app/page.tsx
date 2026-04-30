import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/config'
import Link from 'next/link'
import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'Brand Syndicate — AI Brand Growth Studio for Businesses | Free to Start',
  description:
    'Build your entire brand identity in 60 seconds with AI. Logo concepts, banners, flyers, poster, brand website, and pitch deck — all from a single prompt. No design skills needed.',
  keywords: [
    'AI brand identity studio', 'AI banner generator', 'brand website generator',
    'professional brand kit AI', 'AI banner designer', 'pitch deck AI builder',
    'brand growth tools 2026', 'brand identity generator', 'AI marketing toolkit', 'brand website creator free',
  ],
  alternates: { canonical: APP_URL },
  openGraph: {
    title: 'Brand Syndicate — Build Your Entire Brand Identity with AI',
    description: 'Logo concepts, marketing banners, flyers, posters, brand website, and pitch deck — generated in seconds. Free to start.',
    url: APP_URL, type: 'website',
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630, alt: 'Brand Syndicate AI Personal Branding Studio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brand Syndicate — Build Your Entire Brand Identity with AI',
    description: 'Logo concepts, marketing banners, flyers, brand website, and pitch deck — generated in seconds.',
    images: [`${APP_URL}/og-default.png`],
  },
}

const homeJsonLd = {
  '@context': 'https://schema.org', '@type': 'WebPage',
  '@id': `${APP_URL}/#webpage`, url: APP_URL,
  name: 'Brand Syndicate — AI Brand Growth Studio',
  description: 'Generate a complete brand identity with AI — logo, banners, flyer, brand website, and pitch deck in under 60 seconds.',
}

export default async function Home() {
  const session = await auth()
  if (session) redirect('/generate')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>

        {/* ── NOISE TEXTURE OVERLAY ── */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '160px',
        }} />

        {/* ── RADIAL GOLD GLOW ── */}
        <div style={{ position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '120vw', height: '60vw', background: 'radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: '-10%', right: '-15%', width: '60vw', height: '40vw', background: 'radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* ── HEADER NAV ── */}
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, borderBottom: '1px solid var(--border)', background: 'rgba(9,9,10,0.88)', backdropFilter: 'blur(20px)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontSize: 10, color: 'var(--gold)', letterSpacing: '0.04em', flexShrink: 0 }}>BS</div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--cream)' }}>Brand <span style={{ color: 'var(--gold)' }}>·</span> Syndicate</span>
            </div>

            {/* Nav links — hidden on mobile */}
            <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }} aria-label="Main navigation">
              <style>{`@media(max-width:640px){.land-nav-links{display:none!important}}`}</style>
              <div className="land-nav-links" style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
                {[['/#features','Features'],['/#examples','Examples'],['/#how','How it Works']].map(([href, label]) => (
                  <Link key={href} href={href} style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.06em', transition: 'color 0.15s' }}
                    onMouseOver={undefined}>{label}</Link>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Link href="/login" style={{ padding: '7px 18px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", color: 'var(--muted)', textDecoration: 'none', border: '1px solid var(--border2)', borderRadius: 2, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>Sign In</Link>
                <Link href="/login?tab=signup" style={{ padding: '7px 18px', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", background: 'var(--gold)', color: '#000', textDecoration: 'none', borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap' }}>Get Started</Link>
              </div>
            </nav>
          </div>
        </header>

        {/* ── HERO ── */}
        <section style={{ position: 'relative', zIndex: 1, paddingTop: 140, paddingBottom: 100, paddingLeft: 24, paddingRight: 24, textAlign: 'center' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>

            {/* Pre-badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 999, marginBottom: 32, background: 'rgba(201,168,76,0.07)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace" }}>AI-Powered · Free to Start · No Design Skills Needed</span>
            </div>

            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 400, lineHeight: 1.08, marginBottom: 24, color: 'var(--cream)', letterSpacing: '-0.01em' }}>
              Your Entire Brand,<br />
              <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Crafted in Seconds.</span>
            </h1>

            <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: 'var(--muted)', lineHeight: 1.75, maxWidth: 540, margin: '0 auto 44px' }}>
              One prompt. A complete brand identity — logo concept, marketing banners, flyers, poster, brand website, and pitch deck. Powered by advanced AI for every asset.
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
              <Link href="/login?tab=signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: 'var(--gold)', color: '#000', textDecoration: 'none', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 700, borderRadius: 2, boxShadow: '0 0 40px rgba(201,168,76,0.2)' }}>
                Create Free Account →
              </Link>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', border: '1px solid var(--border2)', color: 'var(--muted)', textDecoration: 'none', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2 }}>
                Sign In
              </Link>
              <Link href="/generate" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', color: 'var(--muted2)', textDecoration: 'none', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2 }}>
                Try Without Account ›
              </Link>
            </div>

            {/* Social proof strip */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              {[
                { num: '60s', label: 'Avg. generation time' },
                { num: '6+', label: 'Assets per generation' },
                { num: '100%', label: 'AI-generated copy' },
                { num: 'Free', label: 'To start, always' },
              ].map(s => (
                <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 1, height: 24, background: 'var(--border2)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: 'var(--gold)', fontWeight: 700 }}>{s.num}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT YOU GET ── */}
        <section id="features" style={{ position: 'relative', zIndex: 1, padding: 'clamp(60px,8vw,100px) 24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>What you get</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,42px)', fontWeight: 400, color: 'var(--cream)', marginBottom: 12 }}>Two Modes. One Platform.</h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 480, margin: '0 auto' }}>Built for brands, startups, and businesses that want to grow fast.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 2, border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              {/* Claude-powered assets */}
              <div style={{ padding: 'clamp(24px,4vw,36px)', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--gold), var(--gold-light), transparent)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace" }}>✦ AI Studio</div>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--cream)', marginBottom: 12, fontWeight: 400 }}>Brand Identity Assets</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>Logo direction, marketing collateral, and copy — consistent with your brand voice.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['◇', 'Logo Brief', 'Symbol concept, colors, typography, keywords'],
                    ['◻', 'Flyers', 'A5 print-ready + email/digital version'],
                    ['◼', 'Posters', 'Portrait, landscape, and typographic variants'],
                    ['✦', 'Ad Copy', 'Headlines, CTAs, email body, social captions'],
                    ['◈', 'Brand Website', 'Live portfolio URL with lead capture'],
                    ['▤', 'Pitch Deck', 'Up to 10 AI-structured slides, PPTX export'],
                  ].map(([icon, name, desc]) => (
                    <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--surface2)', borderRadius: 2 }}>
                      <span style={{ color: 'var(--gold)', fontSize: 11, marginTop: 2, flexShrink: 0 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--cream)', marginBottom: 2, fontWeight: 500 }}>{name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GPT-4o Banner Studio */}
              <div style={{ padding: 'clamp(24px,4vw,36px)', background: 'var(--surface2)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #4A90D9, #6BB5FF, #4A90D9)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4A90D9', fontFamily: "'DM Mono', monospace" }}>▭ Banner Studio</div>
                  <span style={{ fontSize: 8, padding: '2px 6px', background: 'rgba(74,144,217,0.15)', border: '1px solid rgba(74,144,217,0.3)', color: '#4A90D9', borderRadius: 2, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>NEW</span>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--cream)', marginBottom: 12, fontWeight: 400 }}>Marketing Banners</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>Our AI designs your campaign banners with full color palettes, layout specs, and copy.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    ['▭', 'Hero Banner', '1920×1080 — landing pages, digital OOH'],
                    ['◻', 'IG Square', '1080×1080 — Instagram feed posts'],
                    ['▬', 'Story', '1080×1920 — vertical stories format'],
                    ['▰', 'Leaderboard', '728×90 — Google Display, web banners'],
                    ['✦', 'Brand Voice', 'Refined tagline + campaign keywords'],
                    ['◎', 'Campaign Strategy', 'Hook, differentiator, animation brief'],
                  ].map(([icon, name, desc]) => (
                    <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(74,144,217,0.06)', border: '1px solid rgba(74,144,217,0.12)', borderRadius: 2 }}>
                      <span style={{ color: '#4A90D9', fontSize: 11, marginTop: 2, flexShrink: 0 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--cream)', marginBottom: 2, fontWeight: 500 }}>{name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── EXAMPLE PROMPTS ── */}
        <section id="examples" style={{ position: 'relative', zIndex: 1, padding: 'clamp(60px,8vw,100px) 24px', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Example Prompts</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,42px)', fontWeight: 400, color: 'var(--cream)', marginBottom: 12 }}>See What People Create</h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 440, margin: '0 auto' }}>The more detail you give, the more personalised your brand kit. Here's what great prompts look like.</p>
            </div>

            {/* Business examples */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Brand Growth Examples</div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {[
                  {
                    role: 'D2C Skincare Brand — Nykaa Launch',
                    prompt: "Petal & Root — Ayurvedic skincare for urban millennial women. Turmeric face serum is our hero product, ₹4Cr ARR, stocked in 80+ salons. Tone: warm luxury — think Tatcha meets India. We need a logo, hero banners, and flyers for our upcoming Nykaa launch campaign.",
                    tags: ['Logo', 'Banners', 'Flyer'],
                    accent: '#C9A84C',
                  },
                  {
                    role: 'HR Tech SaaS — Series A Pitch',
                    prompt: "Konnekt — AI-powered employee onboarding platform for mid-market companies. We replace 6-week onboarding with a 3-day adaptive learning flow. Targeting CHROs at 200–2000 employee companies. B2B SaaS, ₹1.2Cr MRR, raising Series A. Need a premium, trustworthy brand identity.",
                    tags: ['Logo', 'Pitch Deck', 'Brand Website'],
                    accent: '#4A90D9',
                  },
                  {
                    role: 'Fine Dining — New Restaurant Launch',
                    prompt: "Ember & Ash, BKC Mumbai. Modern Indian fine dining with a 12-course tasting menu inspired by regional Indian cuisines reimagined. Opening March 2026. Target: urban HNI couples, corporate dinners, celebration occasions. Aesthetic: dark, dramatic, jewel-toned. Need banners, posters and campaign copy.",
                    tags: ['Banners', 'Poster', 'Ad Copy'],
                    accent: '#C0392B',
                  },
                ].map(ex => (
                  <div key={ex.role} style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 4, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    <div style={{ height: 2, background: `linear-gradient(90deg, ${ex.accent}, ${ex.accent}50, transparent)` }} />
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: ex.accent, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>{ex.role}</div>
                      <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 14, borderLeft: `2px solid ${ex.accent}40`, paddingLeft: 12, fontStyle: 'italic' }}>
                        &ldquo;{ex.prompt}&rdquo;
                      </p>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {ex.tags.map(t => (
                          <span key={t} style={{ fontSize: 9, padding: '2px 8px', border: `1px solid ${ex.accent}40`, color: ex.accent, borderRadius: 2, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business examples */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>✦ Business Mode Examples</div>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {[
                  {
                    company: 'D2C Skincare Brand',
                    prompt: "Company: Petal & Root. Industry: Natural skincare / D2C. We make Ayurvedic skincare products for urban millennial women in India. Our bestseller is a turmeric face serum. Tagline: 'Rooted in ritual.' Target audience: Women 24–35, Instagram-savvy, ingredient-conscious. Tone: Warm luxury — think Tatcha meets India.",
                    assets: ['Logo Brief', 'IG Banners', 'Flyer', 'Ad Copy'],
                    accent: '#E8A87C',
                  },
                  {
                    company: 'B2B SaaS Startup',
                    prompt: "Company: Konnekt. Industry: HR Tech / SaaS. We help mid-market companies reduce onboarding time by 60% with AI-guided workflows. Founded 2024, 3 enterprise clients. Audience: CHROs and HR Directors at 500–5000 employee companies. Tone: Bold & disruptive — we're reinventing how companies onboard people.",
                    assets: ['Logo', 'Hero Banner', 'Poster', 'Email Copy'],
                    accent: '#7EB8A4',
                  },
                  {
                    company: 'Premium Restaurant',
                    prompt: "Company: Ember & Ash. Fine dining restaurant in BKC, Mumbai. Modern Indian cuisine — reimagining street food classics with fine dining technique and presentation. Covers 40, avg spend ₹4,500. Opening March 2025. Audience: Affluent food enthusiasts, corporate diners. Tone: Luxury with a soulful, Indian heart.",
                    assets: ['Logo Brief', 'Banners', 'Flyer', 'Social Copy'],
                    accent: '#C9A84C',
                  },
                ].map(ex => (
                  <div key={ex.company} style={{ background: 'var(--surface)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: 2, background: `linear-gradient(90deg, ${ex.accent}, ${ex.accent}50, transparent)` }} />
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: ex.accent, fontFamily: "'DM Mono', monospace" }}>✦ {ex.company}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 14, borderLeft: `2px solid ${ex.accent}40`, paddingLeft: 12, fontStyle: 'italic' }}>
                        &ldquo;{ex.prompt}&rdquo;
                      </p>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {ex.assets.map(t => (
                          <span key={t} style={{ fontSize: 9, padding: '2px 8px', border: `1px solid ${ex.accent}40`, color: ex.accent, borderRadius: 2, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how" style={{ position: 'relative', zIndex: 1, padding: 'clamp(60px,8vw,100px) 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>How it works</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,40px)', fontWeight: 400, color: 'var(--cream)' }}>Three Steps to a Complete Brand</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2 }}>
              {[
                { num: '01', title: 'Describe Yourself', desc: "Write a prompt about who you are, what you do, and who you're trying to reach. The more detail, the better." },
                { num: '02', title: 'AI Generates Everything', desc: "In under 60 seconds, get a complete brand kit — copy, layout data, colour palette, and all assets." },
                { num: '03', title: 'Edit, Export & Publish', desc: "Fine-tune any asset in the editor, download PNG/PDF/PPTX, or publish your portfolio to a live URL." },
              ].map(step => (
                <div key={step.num} style={{ padding: 'clamp(24px,4vw,36px)', background: 'var(--surface2)', position: 'relative' }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, color: 'rgba(201,168,76,0.12)', fontWeight: 700, lineHeight: 1, marginBottom: 16, letterSpacing: '-0.02em' }}>{step.num}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--cream)', marginBottom: 10, fontWeight: 400 }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ position: 'relative', zIndex: 1, padding: 'clamp(80px,10vw,120px) 24px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 }}>Ready?</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px,5vw,52px)', fontWeight: 400, color: 'var(--cream)', lineHeight: 1.1, marginBottom: 16 }}>
              Start Building<br /><span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Your Brand Today.</span>
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 40 }}>Free to start. No credit card required. Your brand kit in under 60 seconds.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login?tab=signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', background: 'var(--gold)', color: '#000', textDecoration: 'none', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", fontWeight: 700, borderRadius: 2, boxShadow: '0 0 40px rgba(201,168,76,0.15)' }}>
                Create Free Account →
              </Link>
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', border: '1px solid var(--border2)', color: 'var(--muted)', textDecoration: 'none', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace", borderRadius: 2 }}>
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ position: 'relative', zIndex: 1, padding: '32px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 22, height: 22, border: '1px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontSize: 8, color: 'var(--gold)' }}>BS</div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>Brand Syndicate</span>
            </div>
            <nav style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }} aria-label="Footer navigation">
              {[['/#features', 'Features'], ['/generate', 'Try Free'], ['/login?tab=signup', 'Sign Up'], ['/about', 'About'], ['/contact', 'Contact']].map(([href, label]) => (
                <Link key={href} href={href} style={{ fontSize: 11, color: 'var(--muted2)', textDecoration: 'none', letterSpacing: '0.08em' }}>{label}</Link>
              ))}
            </nav>
            <div style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>© {new Date().getFullYear()} Brand Syndicate</div>
          </div>
        </footer>

      </div>
    </>
  )
}
