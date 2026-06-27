import Link from 'next/link'

export default function SupportPage() {
  const cards = [
    { title: 'Website not publishing?', body: 'Check if the website is saved, slug exists, and publish toggle is enabled in My Work.' },
    { title: 'Payment currently not available?', body: 'Payments depend on the Razorpay setup. Contact support or try again after admin enables payment keys.' },
    { title: 'Need a custom edit?', body: 'Share the website name, image, or generation you want changed and the exact text to update.' },
    { title: 'Lead form help', body: 'Published website forms send leads into the website leads panel when name, email or phone is submitted.' },
  ]

  return (
    <div className="page-pad" style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Help & Support</div>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(36px, 6vw, 68px)', fontWeight: 400, color: 'var(--cream)', margin: 0, lineHeight: 1 }}>How can we help?</h1>
        <p style={{ color: 'var(--muted)', maxWidth: 620, lineHeight: 1.7, marginTop: 12 }}>Get help with website publishing, graphics, billing, lead capture and Brand Syndicate generation issues.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        {cards.map(card => (
          <div key={card.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 22 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", color: 'var(--cream)', fontSize: 24, margin: '0 0 10px' }}>{card.title}</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.65, margin: 0 }}>{card.body}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        <Link href="/my-work" style={{ textDecoration: 'none', padding: 18, border: '1px solid rgba(201,168,76,0.45)', borderRadius: 14, background: 'rgba(201,168,76,0.06)', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Open My Work →</Link>
        <a href="mailto:brandsyndicateindia@gmail.com" style={{ textDecoration: 'none', padding: 18, border: '1px solid rgba(201,168,76,0.45)', borderRadius: 14, background: 'linear-gradient(135deg,#F4D57D,#C9A84C 55%,#9B7626)', color: '#080808', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Email Support →</a>
      </div>
    </div>
  )
}
