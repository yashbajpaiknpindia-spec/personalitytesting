'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Razorpay global type (loaded via CDN script) ────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

// Fallback service plans if API is unavailable
const FALLBACK_PLANS = [
  { planId: 'FREE_STARTER', name: 'Free Starter', price: '₹0', period: '5 generations', features: '["5 free generations","Generate logo, strategy, website and images","Preview and download basic outputs","Access public templates","Saved generation history"]', isVisible: true, highlight: false },
  { planId: 'AI_CREATOR_1000', name: 'Creator', price: '₹1,000', period: '50 generations', features: '["50 edits or generations","Repeat and refine past generations","Logo, website, strategy and image generation","Lead capture/contact form integration","Basic SEO, speed and mobile optimisation"]', isVisible: true, highlight: true },
  { planId: 'BUSINESS_PRO_5000', name: 'Business Pro', price: '₹5,000', period: '100 generations', features: '["100 edits or generations","Custom domain support","Priority support","Lead capture/contact form integration","SEO, speed and mobile optimisation"]', isVisible: true, highlight: false },
  { planId: 'UNLIMITED_GROWTH_10000', name: 'Growth Suite', price: '₹10,000', period: 'fair-use unlimited', features: '["Unlimited generations under fair-use policy","Manual business use while active; automated abuse/reselling excluded","Priority support","Theme modification and style control","Custom domain and lead capture support"]', isVisible: true, highlight: false },
]

const SUPPORT_WHATSAPP = 'https://wa.me/917897671348?text=Hi%20Brand%20Syndicate%2C%20I%20need%20help%20with%20payment.'

const PLAN_TO_ACCOUNT_PLAN: Record<string, 'FREE' | 'PRO' | 'TEAM'> = {
  FREE_STARTER: 'FREE',
  FREE: 'FREE',
  AI_CREATOR_1000: 'PRO',
  BUSINESS_PRO_5000: 'TEAM',
  UNLIMITED_GROWTH_10000: 'TEAM',
  PRO: 'PRO',
  TEAM: 'TEAM',
}


function parsePlanFeatures(features: string): string[] {
  try { return JSON.parse(features) } catch { return [] }
}

// Load Razorpay checkout.js once
function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function BillingContent({ plan }: { plan: string }) {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const [loading, setLoading] = useState<string | null>(null)
  const [plans, setPlans] = useState(FALLBACK_PLANS)
  const [plansLoading, setPlansLoading] = useState(true)
  const [paymentError, setPaymentError] = useState('')

  // Fetch admin-controlled pricing plans
  useEffect(() => {
    fetch('/api/admin/pricing')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.plans?.length) setPlans(d.plans) })
      .catch(() => {})
      .finally(() => setPlansLoading(false))
  }, [])
  async function upgrade(planId: string) {
    setPaymentError('')
    setLoading(planId)
    try {
      // Step 1, create Razorpay order on server
      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (!res.ok) { setPaymentError(data?.error || 'Payments are currently not available. Please contact support.'); setLoading(null); return }

      // Step 2, load Razorpay script and open popup widget
      const loaded = await loadRazorpayScript()
      if (!loaded) { setPaymentError('Payments are currently not available. Please contact support.'); setLoading(null); return }

      const rzp = new window.Razorpay({
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.orderId,
        name:        'Brand Syndicate',
        description: `${data.planName} Plan`,
        image:       `${window.location.origin}/logo.png`,
        prefill: {
          name:  data.userName,
          email: data.userEmail,
        },
        theme: { color: '#C9A84C' },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          // Step 3, verify signature on server and upgrade plan
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              plan: planId,
            }),
          })
          if (verifyRes.ok) {
            window.location.href = '/billing?success=true'
          }
        },
        modal: {
          ondismiss: () => setLoading(null),
        },
      })
      rzp.open()
    } catch {
      setPaymentError('Payments are currently not available. Please contact support.')
      setLoading(null)
    }
  }

  async function managePortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/razorpay/cancel', { method: 'POST' })
      if (res.ok) window.location.href = '/billing'
    } finally { setLoading(null) }
  }
  // ─── END of changed section, everything below is byte-for-byte identical ──

  return (
    <div className="page-pad">
      <div className="page-eyebrow"><span className="page-eyebrow-dot" />Plans &amp; Billing</div>
      <h1 className="page-h1">Choose your <em>plan.</em></h1>
      <p className="page-sub">
        Current plan: <strong>{plan}</strong>, upgrade anytime, cancel anytime.
      </p>

      {success && (
        <div style={{ padding: '14px 20px', background: 'rgba(46,125,82,0.12)', border: '1px solid rgba(46,125,82,0.3)', borderRadius: 'var(--radius)', marginBottom: 28, fontSize: 13, color: '#2E7D52' }}>
          ✓ Upgrade successful! Welcome to {plan}.
        </div>
      )}

      {paymentError && (
        <div style={{ padding: '14px 20px', background: 'rgba(192,57,43,0.10)', border: '1px solid rgba(192,57,43,0.28)', borderRadius: 'var(--radius)', marginBottom: 28, fontSize: 13, color: '#C0392B' }}>
          {paymentError}{' '}
          <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ color: '#C0392B', textDecoration: 'underline' }}>Contact support</a>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 40 }}>
        {plansLoading ? (
          [1,2,3,4,5].map(i => <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, minHeight: 280, opacity: 0.3, animation: 'pulse 1.5s infinite' }} />)
        ) : plans.filter(p => p.isVisible !== false).map(p => {
          const accountPlan = PLAN_TO_ACCOUNT_PLAN[p.planId] || 'FREE'
          const isFreePlan = accountPlan === 'FREE'
          const isCurrent = accountPlan === plan && (plan !== 'FREE' || isFreePlan)
          const isUpgrade = !isCurrent && !isFreePlan
          const features = parsePlanFeatures(p.features)
          return (
            <div key={p.planId} style={{ background: 'var(--surface)', border: `1px solid ${(p.highlight && !isCurrent) || isCurrent ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: 24, position: 'relative' }}>
              {p.highlight && !isCurrent && <div style={{ position: 'absolute', top: -1, left: 20, fontSize: 8, background: 'var(--gold)', color: '#000', padding: '2px 10px', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>RECOMMENDED</div>}
              {isCurrent && <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 8, background: 'var(--gold)', color: '#000', padding: '2px 7px', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>CURRENT</div>}
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--cream)', marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 28, fontFamily: "'Playfair Display', serif", color: 'var(--gold)', marginBottom: 20 }}>
                {p.price}<span style={{ fontSize: 13, color: 'var(--muted)' }}>{p.period}</span>
              </div>
              {features.map((f: string) => (
                <div key={f} style={{ fontSize: 12, color: 'var(--muted)', padding: '6px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--gold)', fontSize: 10 }}>✦</span> {f}
                </div>
              ))}
              <div style={{ marginTop: 20 }}>
                {isCurrent && plan !== 'FREE' ? (
                  <button onClick={managePortal} disabled={loading === 'portal'} style={{ width: '100%', padding: '9px 0', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Sans', sans-serif" }}>
                    {loading === 'portal' ? 'Loading…' : 'Manage Billing'}
                  </button>
                ) : isUpgrade ? (
                  <button onClick={() => upgrade(p.planId)} disabled={loading === p.planId} style={{ width: '100%', padding: '9px 0', background: 'var(--gold)', border: 'none', color: '#000', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, cursor: loading === p.planId ? 'wait' : 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Sans', sans-serif" }}>
                    {loading === p.planId ? 'Opening Razorpay…' : `Pay ${p.price}`}
                  </button>
                ) : isCurrent && plan === 'FREE' ? (
                  <div style={{ padding: '9px 0', textAlign: 'center', fontSize: 11, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>Your Current Plan</div>
                ) : (
                  <div style={{ padding: '9px 0', textAlign: 'center', fontSize: 11, color: 'var(--muted2)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>Free Forever</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '20px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
          All plans include a 14-day money-back guarantee. Payments are processed securely. Cancel anytime from the billing page.
        </div>
      </div>
    </div>
  )
}

export default function BillingClient({ plan }: { plan: string }) {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading billing…</div>}>
      <BillingContent plan={plan} />
    </Suspense>
  )
}
