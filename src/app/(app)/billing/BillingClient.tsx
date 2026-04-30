'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Razorpay global type (loaded via CDN script) ────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

// Fallback plans if API is unavailable
const FALLBACK_PLANS = [
  { planId: 'FREE', name: 'Starter', price: '₹0', period: '/month', features: '["3 brand generations per month","Logo concept + flyer + poster","Brand website (public URL)","3 banner designs via GPT-4o","PDF export (watermarked)","Analytics dashboard"]', isVisible: true, highlight: false },
  { planId: 'PRO',  name: 'Growth',  price: '₹1,999', period: '/month', features: '["Unlimited brand generations","All 48 brand templates","Unlimited GPT-4o banners","Presentation decks (PPTX export)","Custom domain for brand website","No watermarks on exports","Priority AI processing","Lead capture & analytics"]', isVisible: true, highlight: true },
  { planId: 'TEAM', name: 'Scale', price: '₹4,999', period: '/month', features: '["Everything in Growth","Up to 5 team members","Shared brand kit library","Multi-brand management","White-label exports","Admin cost dashboard","Dedicated priority support","API access (coming soon)"]', isVisible: true, highlight: false },
]

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

  // Fetch admin-controlled pricing plans
  useEffect(() => {
    fetch('/api/admin/pricing')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.plans?.length) setPlans(d.plans) })
      .catch(() => {})
      .finally(() => setPlansLoading(false))
  }, [])
  async function upgrade(planId: string) {
    setLoading(planId)
    try {
      // Step 1 — create Razorpay order on server
      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (!res.ok) { setLoading(null); return }

      // Step 2 — load Razorpay script and open popup widget
      const loaded = await loadRazorpayScript()
      if (!loaded) { setLoading(null); return }

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
          // Step 3 — verify signature on server and upgrade plan
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
  // ─── END of changed section — everything below is byte-for-byte identical ──

  return (
    <div style={{ padding: '40px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
        <div style={{ width: 20, height: 1, background: 'var(--gold)' }} /> Billing
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: 'var(--cream)', marginBottom: 8 }}>Plans &amp; Billing</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 36 }}>
        Current plan: <span style={{ color: 'var(--gold)', fontFamily: "'DM Mono', monospace" }}>{plan}</span>
      </p>

      {success && (
        <div style={{ padding: '14px 20px', background: 'rgba(46,125,82,0.12)', border: '1px solid rgba(46,125,82,0.3)', borderRadius: 'var(--radius)', marginBottom: 28, fontSize: 13, color: '#2E7D52' }}>
          ✓ Upgrade successful! Welcome to {plan}.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 40 }}>
        {plansLoading ? (
          [1,2,3].map(i => <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, minHeight: 280, opacity: 0.3, animation: 'pulse 1.5s infinite' }} />)
        ) : plans.filter(p => p.isVisible !== false).map(p => {
          const isCurrent = p.planId === plan
          const isUpgrade = p.planId !== 'FREE' && p.planId !== plan
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
                  <button onClick={() => upgrade(p.planId)} disabled={loading === p.planId} style={{ width: '100%', padding: '9px 0', background: 'var(--gold)', border: 'none', color: '#000', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius)', fontFamily: "'DM Sans', sans-serif" }}>
                    {loading === p.planId ? 'Loading…' : `Upgrade to ${p.name}`}
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
