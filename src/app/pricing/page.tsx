import Link from 'next/link'
import type { Metadata } from 'next'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
const WA = 'https://wa.me/917897671348?text='

export const metadata: Metadata = {
  title: 'Pricing — Brand Syndicate · Website, Logo, Strategy & Image Plans',
  description: 'Brand Syndicate plans from free generations to fair-use unlimited branding, websites, logos, strategy, images and growth support.',
  keywords: ['brand syndicate pricing', 'business website price India', 'brand launch kit price', 'app and website package India'],
  alternates: { canonical: `${APP_URL}/pricing` },
  openGraph: {
    title: 'Pricing — Brand Syndicate',
    description: 'Free Starter, ₹1,000 Creator, ₹5,000 Business Pro and ₹10,000 Growth Suite plans.',
    url: `${APP_URL}/pricing`,
    type: 'website',
    images: [{ url: `${APP_URL}/og-default.png`, width: 1200, height: 630 }],
  },
}

const PLANS = [
  {
    badge: 'Free Access',
    name: 'Free Starter',
    price: '₹0',
    note: '5 generations included',
    highlight: false,
    cta: 'Start Free',
    detailHref: '/plans/free-starter',
    whatsapp: `${WA}Hi%20Brand%20Syndicate%2C%20I%20want%20to%20start%20with%20the%20Free%20Starter%20plan.`,
    features: ['5 free generations', 'Generate logo, strategy, website and images', 'Preview and download basic outputs', 'Access public templates', 'Saved generation history', 'Upgrade when more generations are needed'],
  },
  {
    badge: 'Creator Plan',
    name: 'Creator',
    price: '₹1,000',
    note: '50 edits/generations',
    highlight: true,
    cta: 'Choose Creator',
    detailHref: '/plans/ai-creator',
    whatsapp: `${WA}Hi%20Brand%20Syndicate%2C%20I%20want%20the%20Creator%20plan%20for%20%E2%82%B91000.`,
    features: ['50 edits or generations', 'Repeat and refine past generations', 'Logo, website, strategy and image generation', 'Lead capture/contact form integration', 'Basic SEO, speed and mobile optimisation', 'Best for testing multiple brand ideas'],
  },
  {
    badge: 'Business Plan',
    name: 'Business Pro',
    price: '₹5,000',
    note: '100 generations + domain support',
    highlight: false,
    cta: 'Choose Business Pro',
    detailHref: '/plans/business-pro',
    whatsapp: `${WA}Hi%20Brand%20Syndicate%2C%20I%20want%20the%20Business%20Pro%20plan%20for%20%E2%82%B95000.`,
    features: ['100 edits or generations', 'Custom domain support', 'Priority support', 'Lead capture/contact form integration', 'SEO, speed and mobile optimisation', 'Better for real business launch work'],
  },
  {
    badge: 'Scale Plan',
    name: 'Growth Suite',
    price: '₹10,000',
    note: 'Fair-use unlimited generations',
    highlight: false,
    cta: 'Choose Growth Suite',
    detailHref: '/plans/unlimited-growth',
    whatsapp: `${WA}Hi%20Brand%20Syndicate%2C%20I%20want%20the%20Growth%20Suite%20plan%20for%20%E2%82%B910000.`,
    features: ['Fair-use unlimited generations', 'Manual business use while active; automated abuse/reselling excluded', 'Priority support', 'Theme modification and style control', 'Custom domain and lead capture support', 'Best for serious brands and agencies'],
  },
]

const FAQ = [
  ['Which plan should I choose first?', 'Free Starter is for trying the platform, Creator is best for regular edits, Business Pro is best for real launches, and Growth Suite is best when you need frequent generation under fair-use limits.'],
  ['What does fair-use unlimited mean?', 'Growth Suite supports ongoing manual business use while your plan is active. Automated bulk abuse, resale farming, or usage that harms system stability is not included.'],
  ['Does the ₹1,000 plan include lead forms and SEO basics?', 'Yes. It includes lead capture/contact form integration plus basic SEO, speed and mobile optimisation support.'],
  ['Can I use my custom domain?', 'Custom domain support starts from Business Pro.'],
  ['Can pricing change later?', 'Yes. Admin can edit visible plans from the admin panel without changing the application code.'],
]

export default function PricingPage() {
  return (
    <>
      <PublicNav active="/pricing" />
      <main className="pricing-page">
        <style>{`
          .pricing-page{min-height:100vh;background:var(--bg,#F3EADB);font-family:'Manrope','DM Sans',system-ui,sans-serif;padding-top:0;}
          .pricing-hero{text-align:center;padding:38px 24px 30px;max-width:760px;margin:0 auto;}
          .pricing-eyebrow{font-size:11px;letter-spacing:.20em;text-transform:uppercase;color:var(--gold,#C9A84C);font-family:'DM Mono',monospace;margin-bottom:14px;font-weight:700;}
          .pricing-title{font-family:'Manrope','DM Sans',system-ui,sans-serif;font-size:clamp(38px,6.4vw,68px);font-weight:850;color:var(--text,#1A1510);line-height:.98;margin:0 0 16px;letter-spacing:-.065em;}
          .pricing-title em{color:var(--gold,#9E7424);font-style:normal;letter-spacing:-.06em;}
          .pricing-sub{font-size:16px;color:var(--muted,#5F574D);line-height:1.7;margin:0;max-width:640px;margin-inline:auto;}
          .pricing-plans{padding:0 24px 72px;max-width:1380px;margin:0 auto;}
          .pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(235px,1fr));gap:18px;}
          .pricing-card{background:var(--surface,#FFF8EC);border:1px solid var(--border,rgba(26,21,16,.10));border-radius:16px;padding:32px 26px;position:relative;box-shadow:0 18px 48px rgba(25,19,12,.06);}
          .pricing-card.recommended{background:linear-gradient(180deg,rgba(201,168,76,.16) 0%,var(--surface,#FFF8EC) 42%,rgba(255,248,236,.72) 100%);border-color:rgba(201,168,76,.42);}
          .pricing-rec{position:absolute;top:0;left:50%;transform:translateX(-50%) translateY(-50%);background:var(--gold,#C9A84C);color:#0A0A0E;font-size:10px;letter-spacing:.16em;text-transform:uppercase;font-family:'DM Mono',monospace;font-weight:800;padding:5px 14px;border-radius:999px;white-space:nowrap;}
          .pricing-badge{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted,#6A5D4E);font-family:'DM Mono',monospace;margin-bottom:8px;font-weight:700;}
          .recommended .pricing-badge{color:var(--gold,#9E7424);}
          .pricing-name{font-family:'Manrope','DM Sans',system-ui,sans-serif;font-size:25px;color:var(--text,#1A1510);font-weight:850;letter-spacing:-.045em;margin-bottom:8px;}
          .pricing-price{font-family:'Manrope','DM Sans',system-ui,sans-serif;font-size:34px;color:var(--text,#1A1510);font-weight:900;letter-spacing:-.055em;margin-bottom:4px;}
          .recommended .pricing-price{color:var(--gold,#9E7424);}
          .pricing-note{font-size:12px;color:var(--muted,#6A5D4E);margin-bottom:22px;}
          .pricing-features{border-top:1px solid var(--border,rgba(26,21,16,.10));padding-top:18px;margin-bottom:22px;}
          .pricing-feature{display:flex;align-items:flex-start;gap:9px;margin-bottom:10px;}
          .pricing-feature span:first-child{color:var(--gold,#C9A84C);font-size:12px;flex-shrink:0;margin-top:2px;}
          .pricing-feature span:last-child{font-size:13px;color:var(--text,#1A1510);line-height:1.5;}
          .pricing-cta{display:block;text-align:center;padding:13px 16px;background:transparent;border:1px solid rgba(201,168,76,.42);color:var(--gold,#9E7424);font-size:10px;letter-spacing:.13em;text-transform:uppercase;font-weight:850;text-decoration:none;border-radius:8px;font-family:'DM Sans',sans-serif;}
          .recommended .pricing-cta{background:linear-gradient(135deg,var(--gold-light,#E2C57A),var(--gold,#C9A84C) 55%,var(--gold-deep,#A07830));border:none;color:#0A0A0E;}
          .pricing-detail{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted,#6A5D4E);text-align:center;text-decoration:none;font-family:'DM Mono',monospace;}
          .pricing-faq{padding:0 24px 96px;max-width:760px;margin:0 auto;}
          .pricing-faq-title{text-align:center;margin-bottom:42px;}
          .pricing-h2{font-family:'Manrope','DM Sans',system-ui,sans-serif;font-size:clamp(26px,4vw,36px);font-weight:850;letter-spacing:-.04em;color:var(--text,#1A1510);margin:0;}
          .pricing-faq-card{background:var(--surface,#FFF8EC);border:1px solid var(--border,rgba(26,21,16,.10));border-radius:10px;padding:20px 24px;}
          .pricing-faq-q{font-size:15px;color:var(--text,#1A1510);font-weight:800;margin-bottom:8px;}
          .pricing-faq-a{font-size:14px;color:var(--muted,#6A5D4E);line-height:1.7;}
          .pricing-bottom{text-align:center;padding:0 24px 96px;}
          .pricing-bottom-card{max-width:580px;margin:0 auto;background:var(--surface,#FFF8EC);border:1px solid rgba(201,168,76,.22);border-radius:16px;padding:48px 32px;}
          .pricing-bottom-title{font-family:'Manrope','DM Sans',system-ui,sans-serif;font-size:28px;font-weight:850;letter-spacing:-.045em;color:var(--text,#1A1510);margin-bottom:12px;}
          .pricing-bottom p{font-size:14px;color:var(--muted,#6A5D4E);line-height:1.7;margin-bottom:28px;}
          .pricing-bottom a{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,var(--gold-light,#E2C57A),var(--gold,#C9A84C) 55%,var(--gold-deep,#A07830));color:#0A0A0E;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:850;text-decoration:none;border-radius:8px;box-shadow:0 4px 20px rgba(201,168,76,.25);font-family:'DM Sans',sans-serif;}
          @media(max-width:760px){
            .pricing-hero{padding:22px 20px 20px;}
            .pricing-title{font-size:clamp(34px,10.5vw,48px);line-height:1.02;letter-spacing:-.06em;margin-bottom:12px;}
            .pricing-sub{font-size:14px;line-height:1.55;}
            .pricing-plans{padding:0 18px 52px;}
            .pricing-grid{grid-template-columns:1fr;gap:14px;}
            .pricing-card{padding:26px 22px;border-radius:18px;}
            .pricing-name{font-size:24px;}
            .pricing-price{font-size:36px;}
            .pricing-faq{padding:0 18px 64px;}
            .pricing-bottom{padding:0 18px 70px;}
            .pricing-bottom-card{padding:34px 22px;}
          }
          @media(max-width:430px){
            .pricing-hero{padding-top:14px;padding-bottom:18px;}
            .pricing-eyebrow{margin-bottom:10px;font-size:10px;letter-spacing:.18em;}
            .pricing-title{font-size:38px;}
            .pricing-sub{font-size:13.5px;line-height:1.52;}
            .pricing-card{padding:24px 20px;}
          }
        `}</style>

        <section className="pricing-hero">
          <div className="pricing-eyebrow">Pricing</div>
          <h1 className="pricing-title">Choose your<br /><em>growth plan.</em></h1>
          <p className="pricing-sub">Start free, then upgrade for more generations, website lead capture, custom domain support and fair-use growth.</p>
        </section>

        <section className="pricing-plans">
          <div className="pricing-grid">
            {PLANS.map(plan => (
              <div key={plan.name} className={`pricing-card${plan.highlight ? ' recommended' : ''}`}>
                {plan.highlight && <div className="pricing-rec">Recommended</div>}
                <div className="pricing-badge">{plan.badge}</div>
                <div className="pricing-name">{plan.name}</div>
                <div className="pricing-price">{plan.price}</div>
                <div className="pricing-note">{plan.note}</div>
                <div className="pricing-features">
                  {plan.features.map(f => (
                    <div key={f} className="pricing-feature">
                      <span>✦</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link href={plan.name === 'Free Starter' ? '/login?tab=signup&callbackUrl=%2Fgenerate' : '/billing'} className="pricing-cta">
                    {plan.cta}
                  </Link>
                  <Link href={plan.detailHref} className="pricing-detail">
                    View full details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pricing-faq">
          <div className="pricing-faq-title">
            <div className="pricing-eyebrow">FAQ</div>
            <h2 className="pricing-h2">Common questions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FAQ.map(([q, a]) => (
              <div key={q} className="pricing-faq-card">
                <div className="pricing-faq-q">{q}</div>
                <div className="pricing-faq-a">{a}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="pricing-bottom">
          <div className="pricing-bottom-card">
            <div className="pricing-bottom-title">Start with a free preview</div>
            <p>Generate the first direction in seconds, then choose the plan that fits your business.</p>
            <Link href="/login?tab=signup&callbackUrl=%2Fgenerate">Generate Free Preview ✦</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  )
}
