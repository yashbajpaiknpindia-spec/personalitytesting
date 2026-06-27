import { notFound } from 'next/navigation'
import Link from 'next/link'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import PlanFaq from './PlanFaq'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
const WA = 'https://wa.me/917897671348?text='

const PLANS = {
  'free-starter': {
    id: 'free-starter', badge: 'Free Access', name: 'Free Starter', price: '₹0', period: '5 generations', color: '#D4AF54', highlight: false,
    tagline: 'Try Brand Syndicate with 5 free generations for logo, strategy, website and brand images.',
    cta: 'Start Free', ctaHref: '/login?tab=signup&callbackUrl=%2Fgenerate',
    sections: [
      { title: 'Included Generations', icon: '◉', items: [
        { label: '5 free generations', detail: 'Use your first credits to generate a logo, website, strategy or brand image.' },
        { label: 'Logo, strategy, website and images', detail: 'All core Brand Syndicate generation types are available to try.' },
        { label: 'Saved history', detail: 'Outputs stay in My Work so you can return and continue later.' },
      ] },
      { title: 'Starter Access', icon: '✦', items: [
        { label: 'Public templates access', detail: 'Browse and preview industry templates before generating.' },
        { label: 'Preview and download basics', detail: 'Useful for testing ideas before moving to paid generation volume.' },
        { label: 'Upgrade anytime', detail: 'Move to a higher plan when you need more edits, lead capture or domain support.' },
      ] },
    ],
    faq: [['What can I generate for free?', 'You get 5 generations that can be used across logo, strategy, website and brand images.'], ['Can I upgrade later?', 'Yes. Upgrade when you need more credits, custom domain support or priority help.']],
  },
  'ai-creator': {
    id: 'ai-creator', badge: 'Creator Plan', name: 'Creator', price: '₹1,000', period: '50 generations', color: '#D4AF54', highlight: true,
    tagline: 'A practical plan for creators and small businesses who need regular edits and generations.',
    cta: 'Choose Creator', ctaHref: '/billing',
    sections: [
      { title: 'Generation Volume', icon: '◉', items: [
        { label: '50 edits or generations', detail: 'Use credits across logos, websites, brand images, strategy and refinements.' },
        { label: 'Repeat and refine past generations', detail: 'Continue from previous output instead of starting from zero each time.' },
        { label: 'Multi-asset brand work', detail: 'Generate website content, logo concepts, campaign images and business strategy together.' },
      ] },
      { title: 'Launch Essentials', icon: '◈', items: [
        { label: 'Lead capture/contact form integration', detail: 'Generated websites include contact forms built for enquiry capture.' },
        { label: 'Basic SEO', detail: 'Meta copy, structure and search-friendly page basics for generated sites.' },
        { label: 'Speed and mobile optimisation', detail: 'Preview-ready layouts are kept responsive and lighter on mobile.' },
      ] },
    ],
    faq: [['Is this good for testing many ideas?', 'Yes. The 50 credits are meant for repeated edits, regeneration and creative testing.'], ['Does it include lead forms?', 'Yes. Lead capture/contact form integration is included.']],
  },
  'business-pro': {
    id: 'business-pro', badge: 'Business Plan', name: 'Business Pro', price: '₹5,000', period: '100 generations', color: '#D4AF54', highlight: false,
    tagline: 'For businesses that want more generation volume, custom domain support and faster assistance.',
    cta: 'Choose Business Pro', ctaHref: '/billing',
    sections: [
      { title: 'Business Credits', icon: '◉', items: [
        { label: '100 edits or generations', detail: 'Enough volume for a real brand launch, multiple pages, images and strategy rounds.' },
        { label: 'Custom domain support', detail: 'Guidance to connect your own business domain to the website.' },
        { label: 'Priority support', detail: 'Higher priority assistance for publishing and refinement issues.' },
      ] },
      { title: 'Launch Support', icon: '✦', items: [
        { label: 'Lead capture/contact form integration', detail: 'Forms are prepared for capturing enquiries from your generated website.' },
        { label: 'SEO, speed and mobile optimisation', detail: 'Core optimisation work for performance, mobile and search-readiness.' },
        { label: 'Business-ready refinement', detail: 'Better suited for serious launch work and client-facing pages.' },
      ] },
    ],
    faq: [['Does this include custom domain?', 'Yes. Custom domain support starts from Business Pro.'], ['How many generations are included?', 'Business Pro includes 100 edits or generations.']],
  },
  'unlimited-growth': {
    id: 'unlimited-growth', badge: 'Unlimited', name: 'Growth Suite', price: '₹10,000', period: 'fair-use unlimited', color: '#D4AF54', highlight: false,
    tagline: 'High-volume Brand Syndicate access for serious brands, agencies and frequent campaign creation.',
    cta: 'Choose Growth Suite', ctaHref: '/billing',
    sections: [
      { title: 'Fair-use Unlimited', icon: '◉', items: [
        { label: 'Unlimited generations under fair-use policy', detail: 'Unlimited manual business use while the plan is active, subject to system health and account standing.' },
        { label: 'No automated abuse or resale farming', detail: 'Bulk automation, scraping, reselling credits or harming service stability is excluded.' },
        { label: 'Priority support', detail: 'Fastest support tier for generation, publishing and brand output issues.' },
      ] },
      { title: 'Control and Growth', icon: '◈', items: [
        { label: 'Theme modification and style control', detail: 'Adjust visual themes, brand direction and presentation style more freely.' },
        { label: 'Custom domain and lead capture support', detail: 'Built for businesses that need live lead-ready pages and frequent updates.' },
        { label: 'Best for serious brands and agencies', detail: 'Use it for ongoing campaigns, multiple concepts and repeated refinement.' },
      ] },
    ],
    faq: [['What does unlimited mean?', 'It means ongoing manual business use under fair-use. Automated abuse, resale farming and usage that harms service stability are excluded.'], ['Can I modify themes?', 'Yes. This plan is designed for higher control over theme, style and repeated refinement.']],
  },
}

type PlanSlug = keyof typeof PLANS

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const plan = PLANS[params.slug as PlanSlug]
  if (!plan) return {}
  return {
    title: `${plan.name} Plan, Brand Syndicate`,
    description: `${plan.name} pricing and inclusions for Brand Syndicate.`,
    alternates: { canonical: `${APP_URL}/plans/${plan.id}` },
    openGraph: { title: `${plan.name} Plan, Brand Syndicate`, description: plan.tagline, url: `${APP_URL}/plans/${plan.id}` },
  }
}

export default function PlanPage({ params }: { params: { slug: string } }) {
  const plan = PLANS[params.slug as PlanSlug]
  if (!plan) notFound()
  const allPlans = Object.values(PLANS)

  return (
    <>
      <style>{`
        .pl-hero { min-height: 72vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:88px 40px 72px; background: radial-gradient(circle at 50% 25%, rgba(212,175,84,0.12), transparent 45%), var(--bg); }
        .pl-badge { font-size:10px; letter-spacing:.22em; text-transform:uppercase; font-family:'DM Mono',monospace; color:var(--gold); border:1px solid rgba(212,175,84,.28); padding:7px 14px; border-radius:999px; margin-bottom:24px; }
        .pl-name { font-family:'Instrument Serif',serif; font-size:clamp(44px,8vw,86px); line-height:.92; color:var(--cream); font-weight:400; margin:0 0 16px; }
        .pl-tagline { max-width:640px; color:var(--muted); font-size:17px; line-height:1.75; margin:0 0 28px; }
        .pl-price { font-family:'Instrument Serif',serif; font-size:clamp(36px,6vw,58px); color:var(--gold); }
        .pl-period { color:var(--muted); font-size:14px; margin-left:10px; }
        .pl-cta { display:inline-flex; margin-top:28px; padding:15px 34px; border-radius:6px; background:linear-gradient(135deg,#E2C57A,#C9A84C 55%,#A07830); color:#09090a; text-decoration:none; font-size:11px; letter-spacing:.16em; text-transform:uppercase; font-weight:800; font-family:'DM Sans',sans-serif; }
        .pl-body { max-width:1100px; margin:0 auto; padding:72px 40px 110px; }
        .pl-section { margin-bottom:56px; }
        .pl-section-head { display:flex; align-items:center; gap:12px; margin-bottom:24px; padding-bottom:14px; border-bottom:1px solid var(--border); }
        .pl-section-icon { width:36px; height:36px; border:1px solid rgba(212,175,84,.28); border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--gold); }
        .pl-section-title { font-family:'Instrument Serif',serif; font-size:28px; color:var(--cream); font-weight:400; margin:0; }
        .pl-items { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
        .pl-item { background:var(--surface); border:1px solid var(--border2); border-radius:10px; padding:22px 24px; }
        .pl-item-label { font-size:14px; font-weight:700; color:var(--cream); margin-bottom:8px; }
        .pl-item-detail { font-size:13px; color:var(--muted); line-height:1.7; }
        .pl-compare { background:var(--surface); border-top:1px solid var(--border); padding:76px 40px; }
        .pl-compare-title { font-family:'Instrument Serif',serif; font-size:36px; color:var(--cream); text-align:center; margin:0 0 10px; font-weight:400; }
        .pl-compare-sub { text-align:center; color:var(--muted); font-size:14px; margin-bottom:42px; }
        .pl-plan-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:14px; max-width:1120px; margin:0 auto; }
        .pl-plan-card { border:1px solid var(--border2); border-radius:12px; padding:24px 18px; text-align:center; text-decoration:none; position:relative; }
        .pl-plan-card.current { border-color:rgba(212,175,84,.48); background:rgba(212,175,84,.05); }
        .pl-plan-card-badge { font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:var(--gold); font-family:'DM Mono',monospace; margin-bottom:8px; }
        .pl-plan-card-name { font-family:'Instrument Serif',serif; font-size:21px; color:var(--cream); margin-bottom:6px; }
        .pl-plan-card-price { font-family:'Instrument Serif',serif; font-size:26px; color:var(--gold); margin-bottom:12px; }
        .pl-plan-card-link { font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); font-family:'DM Mono',monospace; }
        .pl-sticky-cta { position:fixed; bottom:0; left:0; right:0; z-index:99; background:rgba(9,9,10,.92); backdrop-filter:blur(20px); border-top:1px solid var(--border); padding:14px 32px; display:flex; align-items:center; justify-content:space-between; gap:20px; }
        .pl-sticky-name { font-family:'Instrument Serif',serif; font-size:18px; color:var(--cream); margin-right:10px; }
        .pl-sticky-price { font-family:'DM Mono',monospace; font-size:16px; color:var(--gold); }
        @media(max-width:768px){ .pl-hero{padding:64px 24px}.pl-body{padding:56px 24px 80px}.pl-compare{padding:58px 24px}.pl-sticky-cta{position:static; flex-direction:column; padding:18px 20px}.pl-cta{width:100%; justify-content:center}.pl-items{grid-template-columns:1fr} }
      `}</style>
      <PublicNav />
      <section className="pl-hero">
        <div className="pl-badge">{plan.badge}</div>
        <h1 className="pl-name">{plan.name}</h1>
        <p className="pl-tagline">{plan.tagline}</p>
        <div><span className="pl-price">{plan.price}</span>{plan.period && <span className="pl-period">{plan.period}</span>}</div>
        <Link href={plan.ctaHref} className="pl-cta">{plan.cta} →</Link>
      </section>
      <div className="pl-body">
        {plan.sections.map((section) => (
          <div key={section.title} className="pl-section">
            <div className="pl-section-head"><div className="pl-section-icon">{section.icon}</div><h2 className="pl-section-title">{section.title}</h2></div>
            <div className="pl-items">
              {section.items.map((item) => <div key={item.label} className="pl-item"><div className="pl-item-label">✓ {item.label}</div><div className="pl-item-detail">{item.detail}</div></div>)}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 70 }}><PlanFaq faq={plan.faq} /></div>
      </div>
      <div className="pl-compare">
        <h2 className="pl-compare-title">Compare all plans</h2>
        <p className="pl-compare-sub">See the full picture before you decide.</p>
        <div className="pl-plan-cards">
          {allPlans.map((p) => (
            <Link key={p.id} href={`/plans/${p.id}`} className={`pl-plan-card${p.id === plan.id ? ' current' : ''}`}>
              <div className="pl-plan-card-badge">{p.badge}</div><div className="pl-plan-card-name">{p.name}</div><div className="pl-plan-card-price">{p.price}</div><div className="pl-plan-card-link">{p.id === plan.id ? 'Current page ↑' : 'View details →'}</div>
            </Link>
          ))}
        </div>
      </div>
      <PublicFooter />
      <div className="pl-sticky-cta"><div><span className="pl-sticky-name">{plan.name}</span><span className="pl-sticky-price">{plan.price}</span></div><Link href={plan.ctaHref} className="pl-cta" style={{ marginTop: 0, padding: '12px 26px' }}>{plan.cta} →</Link></div>
    </>
  )
}
