'use client'

import { useState } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

const CATEGORIES = [
  {
    title: 'Getting Started',
    items: [
      ['Is the sample really free?', 'Yes, completely free, no credit card required. You get a full brand preview including website copy, logo directions, colour palette, 4 branded graphics, and a business strategy brief. You only pay when you decide to go ahead with the full kit.'],
      ['How do I get started?', 'Generate your free brand preview on the homepage, just type your business name and description. Once you love what you see, connect with our team on WhatsApp and we\'ll take it from there.'],
      ['What types of businesses do you work with?', 'We work with startups, personal brands, coaches, restaurants, salons, gyms, e-commerce brands, real estate agents, creators, and small-to-mid-size businesses across all industries.'],
    ],
  },
  {
    title: 'Plans & Pricing',
    items: [
      ['Do I get the full files for free?', 'The free preview is a sample: it shows you exactly what your brand will look like. Full files, high-resolution graphics, generated logos and your complete website are included in paid plans according to scope.'],
      ['Which paid plan should I choose?', 'Creator gives 50 edits/generations for ₹1,000. Business Pro gives 100 generations, custom domain support and priority help for ₹5,000. Growth Suite gives fair-use unlimited generation for ₹10,000.'],
      ['What payment methods do you accept?', 'UPI, credit/debit cards, net banking, and bank transfer. Razorpay-secured checkout.'],
      ['Do you work with clients outside India?', 'Yes. While we\'re based in India, we work with clients globally. Prices are in INR but we accept international payments.'],
    ],
  },
  {
    title: 'Delivery & Revisions',
    items: [
      ['How long does delivery take?', 'The free preview generates quickly. Paid delivery depends on whether you choose Creator, Business Pro or Growth Suite. Rush delivery is available on request.'],
      ['Can I request changes after delivery?', 'Absolutely. Revision depth depends on your selected plan and project scope. Brand kits and retainers include deeper refinement and ongoing support.'],
      ['Is it all AI or do humans work on it?', 'Both, and that\'s what makes us different. AI generates the initial direction at speed; our trained creative team then reviews, refines, and polishes every output to premium brand standards. You get the intelligence of AI with the craft of a human team.'],
    ],
  },
  {
    title: 'About Brand Syndicate',
    items: [
      ['What makes Brand Syndicate different?', 'Most agencies charge ₹50,000+ for similar work, or sell cheap templates with zero strategy. We combine the speed of AI with real human creative craft, delivering instant AI previews with human creative refinement, Indian-market relevance, and startup-friendly execution.'],
      ['How do I contact your team?', 'Via WhatsApp, email, or through the contact form on our website. WhatsApp is the fastest for quick responses.'],
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid var(--border, rgba(255,255,255,0.08))' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        aria-expanded={open}
      >
        <span style={{ fontSize: 15, color: 'var(--text, #F4EFE5)', fontWeight: 500, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{q}</span>
        <span style={{ fontSize: 18, color: 'var(--gold, #C9A84C)', flexShrink: 0, transition: 'transform 0.25s', transform: open ? 'rotate(45deg)' : 'rotate(0deg)', display: 'block', width: 20, textAlign: 'center', fontWeight: 300 }}>+</span>
      </button>
      {open && (
        <div style={{ fontSize: 14, color: 'var(--muted, #A39B8F)', lineHeight: 1.75, paddingBottom: 18, fontFamily: "'DM Sans', sans-serif" }}>
          {a}
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  return (
    <>
      <PublicNav />
      <main style={{ minHeight: '100vh', background: 'var(--bg, #0A0A0E)', paddingTop: 80, fontFamily: "'DM Sans', sans-serif" }}>

        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '72px 24px 56px', maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold, #C9A84C)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>FAQ</div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(34px, 6vw, 52px)', fontWeight: 400, color: 'var(--text, #F4EFE5)', margin: '0 0 18px', lineHeight: 1.15 }}>
            Common<br /><em>questions.</em>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--muted, #A39B8F)', lineHeight: 1.7, margin: 0 }}>
            Everything you need to know about Brand Syndicate. Can&apos;t find the answer you&apos;re looking for?{' '}
            <Link href="/contact" style={{ color: 'var(--gold, #C9A84C)', textDecoration: 'none' }}>Contact us</Link>.
          </p>
        </section>

        {/* FAQ Categories */}
        <section style={{ padding: '0 24px 96px', maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.title}>
                <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold, #C9A84C)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>{cat.title}</div>
                <div style={{ background: 'var(--surface, #0F0F16)', border: '1px solid var(--border, rgba(255,255,255,0.08))', borderRadius: 12, padding: '0 24px' }}>
                  {cat.items.map(([q, a]) => (
                    <FaqItem key={q} q={q} a={a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Still have questions CTA */}
        <section style={{ textAlign: 'center', padding: '0 24px 96px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', background: 'var(--surface, #0F0F16)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 16, padding: '40px 28px' }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: 'var(--text, #F4EFE5)', marginBottom: 12 }}>Still have questions?</div>
            <p style={{ fontSize: 14, color: 'var(--muted, #A39B8F)', lineHeight: 1.7, marginBottom: 24 }}>
              Our team responds within a few hours on WhatsApp.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="https://wa.me/917897671348" target="_blank" rel="noopener noreferrer"
                style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #E2C57A, #C9A84C 55%, #A07830)', color: '#0A0A0E', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, textDecoration: 'none', borderRadius: 8, fontFamily: "'DM Sans', sans-serif" }}>
                WhatsApp Us
              </a>
              <Link href="/contact"
                style={{ padding: '12px 24px', background: 'transparent', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--muted, #A39B8F)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, textDecoration: 'none', borderRadius: 8, fontFamily: "'DM Sans', sans-serif" }}>
                Contact Form
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
