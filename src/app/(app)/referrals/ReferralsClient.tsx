'use client'

import { useState } from 'react'

interface Props {
  referralCode: string
  referredCount: number
  appUrl: string
}

export default function ReferralsClient({ referralCode, referredCount, appUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const referralLink = `${appUrl}?ref=${referralCode}`

  function copy() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: '40px 36px', maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
        <div style={{ width: 20, height: 1, background: 'var(--gold)' }} /> Referrals
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: 'var(--cream)', marginBottom: 8 }}>Refer &amp; Earn</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 36, lineHeight: 1.7 }}>Share Brand Syndicate with your network. You earn credits for every person who signs up with your link.</p>

      {/* Referral link */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Your Referral Link</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {referralLink}
          </div>
          <button onClick={copy} style={{ padding: '10px 20px', background: copied ? 'var(--green)' : 'var(--gold)', border: 'none', color: '#000', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius)', flexShrink: 0, transition: 'background 0.2s' }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Code:</div>
          <div style={{ fontSize: 11, color: 'var(--gold)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em' }}>{referralCode}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 40 }}>
        {[
          { val: referredCount, label: 'Referred' },
          { val: Math.floor(referredCount * 0.3), label: 'Converted' },
          { val: referredCount * 5, label: 'Credits Earned' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontFamily: "'Playfair Display', serif", color: 'var(--cream)', marginBottom: 6 }}>{s.val}</div>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>How It Works</div>
        {[
          { step: '01', title: 'Share your link', desc: 'Send your unique referral link to friends and colleagues.' },
          { step: '02', title: 'They sign up', desc: 'When someone creates an account using your link, you get credit.' },
          { step: '03', title: 'Earn credits', desc: 'Receive 5 credits per referral. Credits count toward future upgrades.' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 16, marginBottom: 16, borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 11, color: 'var(--gold)', fontFamily: "'DM Mono', monospace", flexShrink: 0, paddingTop: 2 }}>{s.step}</div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--cream)', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
