'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const ROLES = ['Founder / CEO', 'Product Manager', 'Engineer', 'Designer', 'Marketer', 'Consultant', 'Sales', 'Other']
const GOALS = ['Land a new job', 'Grow my personal brand', 'Pitch to investors', 'Win new clients', 'Build credibility', 'Share my work']
const ACCENTS = ['#C9A84C', '#E2C57A', '#4CA8C9', '#7B68EE', '#C0392B', '#2E7D52', '#E8E2D8', '#B85C2A']

export default function OnboardingPage() {
  const router = useRouter()
  const { update } = useSession()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState('')
  const [accent, setAccent] = useState('#C9A84C')
  const [goal, setGoal] = useState('')
  const [saving, setSaving] = useState(false)

  async function finish() {
    setSaving(true)
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accentColor: accent, onboarded: true }),
    })
    await update({ onboarded: true })
    router.push('/generate')
  }

  const steps = [
    {
      label: 'Your Role',
      title: "What's your role?",
      sub: "We'll tailor the AI generation to your specific professional context.",
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              padding: '12px 16px', background: role === r ? 'var(--gold-dim)' : 'var(--surface)',
              border: `1px solid ${role === r ? 'var(--gold)' : 'var(--border)'}`,
              color: role === r ? 'var(--gold)' : 'var(--muted)',
              fontSize: 13, cursor: 'pointer', borderRadius: 'var(--radius)', textAlign: 'left', transition: 'all 0.15s'
            }}>{r}</button>
          ))}
        </div>
      ),
      canNext: !!role,
    },
    {
      label: 'Your Style',
      title: 'Choose your accent color',
      sub: 'This defines the personality of your generated brand materials.',
      content: (
        <div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            {ACCENTS.map(c => (
              <div key={c} onClick={() => setAccent(c)} style={{
                width: 48, height: 48, borderRadius: '50%', background: c, cursor: 'pointer',
                border: accent === c ? '3px solid white' : '3px solid transparent',
                transform: accent === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s'
              }} />
            ))}
          </div>
          <div style={{ padding: '16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: accent }} />
            <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'var(--muted)' }}>{accent}</span>
          </div>
        </div>
      ),
      canNext: true,
    },
    {
      label: 'Your Goal',
      title: "What's your primary goal?",
      sub: 'This helps Claude understand what kind of brand story to tell.',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GOALS.map(g => (
            <button key={g} onClick={() => setGoal(g)} style={{
              padding: '12px 16px', background: goal === g ? 'var(--gold-dim)' : 'var(--surface)',
              border: `1px solid ${goal === g ? 'var(--gold)' : 'var(--border)'}`,
              color: goal === g ? 'var(--gold)' : 'var(--muted)',
              fontSize: 13, cursor: 'pointer', borderRadius: 'var(--radius)', textAlign: 'left', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: goal === g ? 'var(--gold)' : 'var(--muted)', flexShrink: 0 }} />
              {g}
            </button>
          ))}
        </div>
      ),
      canNext: !!goal,
    },
  ]

  if (step >= steps.length) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center' }}>
        <div style={{ maxWidth: 440 }}>
          <div style={{ width: 56, height: 56, border: '1px solid var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 22 }}>✦</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 400, color: 'var(--cream)', marginBottom: 12 }}>You&apos;re all set.</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32, lineHeight: 1.7 }}>Your Brand Syndicate studio is configured. Generate your first brand package in under 30 seconds.</p>
          <button onClick={finish} disabled={saving} style={{ background: 'var(--gold)', border: 'none', color: '#000', padding: '12px 32px', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius)' }}>
            {saving ? 'Setting up…' : 'Enter the Studio →'}
          </button>
        </div>
      </div>
    )
  }

  const current = steps[step]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 40 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: i <= step ? 'var(--gold)' : 'var(--border2)', borderRadius: 1, transition: 'background 0.3s' }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
          <div style={{ width: 20, height: 1, background: 'var(--gold)' }} />
          Step {step + 1} of {steps.length} · {current.label}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: 'var(--cream)', marginBottom: 8 }}>{current.title}</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32, lineHeight: 1.7 }}>{current.sub}</p>

        {current.content}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', padding: '10px 24px', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 'var(--radius)' }}>Back</button>
          ) : <div />}
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!current.canNext}
            style={{ background: current.canNext ? 'var(--gold)' : 'var(--surface2)', border: 'none', color: current.canNext ? '#000' : 'var(--muted)', padding: '10px 28px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, cursor: current.canNext ? 'pointer' : 'not-allowed', borderRadius: 'var(--radius)', transition: 'all 0.2s' }}
          >
            {step === steps.length - 1 ? 'Finish' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  )
}
