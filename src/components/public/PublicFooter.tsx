import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '48px 32px',
      marginTop: 'auto',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--cream)', marginBottom: 12 }}>
            Brand <span style={{ color: 'var(--gold)' }}>·</span> Syndicate
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted2)', maxWidth: 240, lineHeight: 1.7 }}>
            AI-powered personal branding for professionals who mean business.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>Product</div>
            {[
              { label: 'Generate', href: '/generate' },
              { label: 'Templates', href: '/templates' },
              { label: 'Resources', href: '/resources' },
              { label: 'Guides', href: '/guides' },
            ].map(l => (
              <div key={l.href} style={{ marginBottom: 10 }}>
                <Link href={l.href} style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>{l.label}</Link>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 14 }}>Company</div>
            {[
              { label: 'About', href: '/about' },
              { label: 'Contact', href: '/contact' },
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
            ].map(l => (
              <div key={l.href} style={{ marginBottom: 10 }}>
                <Link href={l.href} style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none' }}>{l.label}</Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '32px auto 0', paddingTop: 24, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--muted2)', letterSpacing: '0.06em' }}>
        © {new Date().getFullYear()} Brand Syndicate. All rights reserved.
      </div>
    </footer>
  )
}
