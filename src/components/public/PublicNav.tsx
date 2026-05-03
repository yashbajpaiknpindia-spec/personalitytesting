import Link from 'next/link'

export default function PublicNav({ active }: { active?: string }) {
  const links = [
    { label: 'Resources', href: '/resources' },
    { label: 'Guides', href: '/guides' },
    { label: 'About', href: '/about' },
  ]

  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      background: 'var(--bg)',
      zIndex: 100,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 32, height: 32, border: '1px solid var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Playfair Display', serif", fontSize: 10, color: 'var(--gold)',
        }}>BS</div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--cream)' }}>
          Brand <span style={{ color: 'var(--gold)' }}>·</span> Syndicate
        </span>
      </Link>

      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{
            fontSize: 12,
            color: active === l.href ? 'var(--gold)' : 'var(--muted)',
            textDecoration: 'none',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderBottom: active === l.href ? '1px solid var(--gold)' : '1px solid transparent',
            paddingBottom: 2,
          }}>{l.label}</Link>
        ))}
        <Link href="/generate" style={{
          fontSize: 11,
          color: 'var(--gold)',
          textDecoration: 'none',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          border: '1px solid var(--gold)',
          padding: '6px 14px',
        }}>Try Free →</Link>
      </div>
    </nav>
  )
}
