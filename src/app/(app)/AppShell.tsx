'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import type { Session } from 'next-auth'

interface Props {
  children: React.ReactNode
  session: Session | null
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const navItems = [
  { href: '/generate',   label: 'Generate',  icon: 'M1 1h5v5H1zM8 1h5v5H8zM1 8h5v5H1zM8 8h5v5H8z' },
  { href: '/templates',  label: 'Templates', icon: 'M1 1h12v9H1zM4 12h6M7 10v2' },
  { href: '/my-work',    label: 'My Work',   icon: 'M2 2h10v10H2zM5 5h4M5 7h4M5 9h2' },
  { href: '/analytics',  label: 'Analytics', icon: 'M1 12V8m3 4V5m3 7V3m3 9V6' },
  { href: '/referrals',  label: 'Referrals', icon: 'M7 1l1.5 3.5H13L9.5 7.5l1.5 4L7 9 3.5 11.5l1.5-4L1 4.5h4.5z' },
]

const settingsItems = [
  { href: '/settings', label: 'Settings', icon: 'M7 1v2M7 11v2M1 7h2M11 7h2M2.5 2.5l1.5 1.5M10 10l1.5 1.5M2.5 11.5L4 10M10 4l1.5-1.5' },
  { href: '/billing',  label: 'Billing',  icon: 'M1 3h12v9H1zM1 6h12' },
]

// Templates is now public — show it to guests too
const guestNavItems = [
  { href: '/generate',  label: 'Generate',  icon: 'M1 1h5v5H1zM8 1h5v5H8zM1 8h5v5H1zM8 8h5v5H8z' },
  { href: '/templates', label: 'Templates', icon: 'M1 1h12v9H1zM4 12h6M7 10v2' },
]

export default function AppShell({ children, session }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close drawer on navigation
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const initials = session
    ? (session.user.name || session.user.email || 'U')
        .split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
    : null

  const visibleNavItems = session ? navItems : guestNavItems
  const topNavLinks = session
    ? [{ href: '/generate', label: 'Generate' }, { href: '/templates', label: 'Templates' }, { href: '/my-work', label: 'My Work' }]
    : [{ href: '/generate', label: 'Generate' }, { href: '/templates', label: 'Templates' }]

  const sidebarContent = (
    <>
      {session && (
        <div style={{ margin: '0 20px 16px', padding: '12px 14px', background: 'var(--gold-dim)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>Plan</span>
            <span style={{ fontSize: 11, letterSpacing: '0.12em', fontFamily: "'DM Mono', monospace", color: 'var(--gold)' }}>{session.user.plan}</span>
          </div>
          <div style={{ height: 2, background: 'var(--border2)', borderRadius: 1, marginBottom: 6 }}>
            <div style={{ height: 2, background: 'var(--gold)', width: session.user.plan === 'FREE' ? '33%' : '80%', borderRadius: 1 }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>
            {session.user.plan === 'FREE' ? '3 generations/month' : 'Unlimited generations'}
          </div>
        </div>
      )}

      <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", padding: '0 20px', marginBottom: 6, marginTop: 8 }}>Navigation</div>

      {visibleNavItems.map(item => (
        <Link key={item.href} href={item.href} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 20px', fontSize: 12, letterSpacing: '0.04em',
          color: pathname === item.href ? 'var(--gold)' : 'var(--muted)',
          textDecoration: 'none', transition: 'all 0.15s',
          borderLeft: pathname === item.href ? '2px solid var(--gold)' : '2px solid transparent',
          marginLeft: -2,
          background: pathname === item.href ? 'var(--gold-dim)' : 'transparent'
        }}>
          <NavIcon d={item.icon} />
          {item.label}
        </Link>
      ))}

      {session && (
        <>
          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
          <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", padding: '0 20px', marginBottom: 6 }}>Account</div>

          {settingsItems.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 20px', fontSize: 12, letterSpacing: '0.04em',
              color: pathname === item.href ? 'var(--gold)' : 'var(--muted)',
              textDecoration: 'none', transition: 'all 0.15s',
              borderLeft: pathname === item.href ? '2px solid var(--gold)' : '2px solid transparent',
              marginLeft: -2,
              background: pathname === item.href ? 'var(--gold-dim)' : 'transparent'
            }}>
              <NavIcon d={item.icon} />
              {item.label}
            </Link>
          ))}

          {session.user.role === 'ADMIN' && (
            <Link href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 20px', fontSize: 12, color: 'var(--red)',
              textDecoration: 'none', marginTop: 8
            }}>⚡ Admin Panel</Link>
          )}

          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 20px', fontSize: 12, letterSpacing: '0.04em',
              color: 'var(--muted)', background: 'transparent', border: 'none',
              cursor: 'pointer', width: '100%', textAlign: 'left',
            }}
          >
            Sign out
          </button>
        </>
      )}

      {!session && (
        <>
          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
          <div style={{ padding: '0 20px' }}>
            <Link href="/login" style={{
              display: 'block', textAlign: 'center',
              background: 'var(--gold)', color: '#000',
              padding: '10px', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', fontWeight: 500,
              textDecoration: 'none', borderRadius: 'var(--radius)'
            }}>Get Started Free</Link>
          </div>
        </>
      )}
    </>
  )

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Mobile backdrop overlay */}
      <div
        className={`sidebar-backdrop${mobileOpen ? ' open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Top Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 'var(--nav-h)',
        background: 'rgba(9,9,10,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 0,
        zIndex: 200
      }}>

        {/* Hamburger (mobile only — shown via CSS) */}
        <button
          className="mobile-only"
          onClick={() => setMobileOpen(v => !v)}
          style={{
            background: 'transparent', border: '1px solid var(--border2)',
            color: 'var(--muted)', width: 34, height: 34, marginRight: 12,
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', borderRadius: 'var(--radius)', flexShrink: 0
          }}
          aria-label="Toggle menu"
        >
          {mobileOpen
            ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          }
        </button>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, border: '1px solid var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', serif", fontSize: 9, color: 'var(--gold)', letterSpacing: '0.05em'
          }}>BS</div>
          <div className="top-nav-logo-text" style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--cream)' }}>
            Brand <span style={{ color: 'var(--gold)' }}>·</span> Syndicate
          </div>
        </Link>

        {/* Desktop: divider + nav links */}
        <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{ width: 1, height: 24, background: 'var(--border2)', margin: '0 20px' }} />
          {topNavLinks.map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'block', padding: '0 14px',
              height: 'var(--nav-h)', lineHeight: 'var(--nav-h)',
              fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: pathname === item.href ? 'var(--gold)' : 'var(--muted)',
              textDecoration: 'none',
              borderBottom: pathname === item.href ? '1px solid var(--gold)' : '1px solid transparent',
              marginBottom: pathname === item.href ? -1 : 0,
              transition: 'color 0.2s'
            }}>{item.label}</Link>
          ))}
        </div>

        {/* Right: auth controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {session ? (
            <>
              <span className="desktop-only" style={{
                fontSize: 9, letterSpacing: '0.12em', fontFamily: "'DM Mono', monospace",
                color: 'var(--gold)', padding: '3px 8px',
                border: '1px solid rgba(201,168,76,0.3)', borderRadius: 1
              }}>{session.user.plan}</span>
              {session.user.plan === 'FREE' && (
                <Link className="desktop-only" href="/billing" style={{
                  background: 'var(--gold)', color: '#000',
                  padding: '7px 16px', fontSize: 11, letterSpacing: '0.12em',
                  textTransform: 'uppercase', fontWeight: 500,
                  borderRadius: 'var(--radius)', textDecoration: 'none'
                }}>Upgrade</Link>
              )}
              <button className="desktop-only" onClick={() => signOut({ callbackUrl: '/login' })} style={{
                background: 'transparent', border: '1px solid var(--border2)',
                color: 'var(--muted)', padding: '7px 14px', fontSize: 11,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', borderRadius: 'var(--radius)'
              }}>Sign out</button>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                border: '1px solid var(--gold)', background: 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: 'var(--gold)', fontFamily: "'DM Mono', monospace",
                flexShrink: 0
              }}>{initials}</div>
            </>
          ) : (
            <>
              <Link className="desktop-only" href="/login" style={{
                background: 'transparent', border: '1px solid var(--border2)',
                color: 'var(--muted)', padding: '7px 14px', fontSize: 11,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                borderRadius: 'var(--radius)', textDecoration: 'none'
              }}>Sign in</Link>
              <Link href="/login" style={{
                background: 'var(--gold)', color: '#000',
                padding: '7px 14px', fontSize: 11, letterSpacing: '0.12em',
                textTransform: 'uppercase', fontWeight: 500,
                borderRadius: 'var(--radius)', textDecoration: 'none', whiteSpace: 'nowrap'
              }}>Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── App body ── */}
      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: 'var(--nav-h)' }}>

        {/* Sidebar */}
        <aside
          className={`app-sidebar${mobileOpen ? ' open' : ''}`}
          style={{
            width: 'var(--sidebar-w)',
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            flexShrink: 0,
            position: 'sticky',
            top: 'var(--nav-h)',
            height: 'calc(100vh - var(--nav-h))',
            overflowY: 'auto',
            display: session ? 'flex' : 'none', /* hide sidebar on desktop for guests */
            flexDirection: 'column',
            padding: '24px 0',
          }}
        >
          {sidebarContent}
        </aside>

        {/* Guest mobile-only drawer */}
        {!session && (
          <aside
            style={{
              width: 'var(--sidebar-w)',
              background: 'var(--surface)',
              borderRight: '1px solid var(--border)',
              position: 'fixed',
              top: 'var(--nav-h)',
              left: 0,
              height: 'calc(100vh - var(--nav-h))',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 0',
              zIndex: 195,
              transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {sidebarContent}
          </aside>
        )}

        {/* Main content */}
        <main className="app-main" style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
