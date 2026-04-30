'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Session } from 'next-auth'
import { usePageTracker } from '@/hooks/usePageTracker'
import ThemeToggle from '@/components/ThemeToggle'

// ── Notification Bell ─────────────────────────────────────────────────────
function NotificationBell({ session }: { session: Session }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Record<string, any>[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifs = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications')
      if (r.ok) {
        const d = await r.json()
        setNotifications(d.notifications || [])
        setUnreadCount(d.unreadCount || 0)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60_000) // poll every minute
    return () => clearInterval(interval)
  }, [session?.user?.id, fetchNotifs])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    const unread = notifications.filter((n: any) => !n.isRead).map((n: any) => n.id)
    if (!unread.length) return
    await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationIds: unread }) })
    setNotifications(prev => prev.map((n: any) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const handleOpen = () => {
    setOpen(v => {
      if (!v) { setLoading(true); fetchNotifs().finally(() => setLoading(false)) }
      return !v
    })
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        title="Notifications"
        style={{ position: 'relative', width: 34, height: 34, background: 'transparent', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexShrink: 0 }}
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M7.5 1.5a4 4 0 0 1 4 4v2.5l1 2H2.5l1-2V5.5a4 4 0 0 1 4-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 12.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: '50%', background: '#C0392B', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono', monospace", fontWeight: 600, lineHeight: 1 }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: 'var(--cream)' }}>Notifications</div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ fontSize: 10, color: '#C9A84C', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>Mark all read</button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>Loading…</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map((n: any) => (
                <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: n.isRead ? 'transparent' : 'rgba(201,168,76,0.04)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  {n.imageUrl ? (
                    <img src={n.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: '#C9A84C22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>⚡</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                      <div style={{ fontSize: 13, color: n.isRead ? 'var(--muted)' : 'var(--cream)', fontWeight: n.isRead ? 400 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                      {!n.isRead && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A84C', flexShrink: 0, marginTop: 3 }} />}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>{new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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
  { href: '/generate',       label: 'Generate',      icon: 'M1 1h5v5H1zM8 1h5v5H8zM1 8h5v5H1zM8 8h5v5H8z' },
  { href: '/my-work',        label: 'My Work',       icon: 'M2 2h10v10H2zM5 5h4M5 7h4M5 9h2' },
  { href: '/business/edit',  label: 'Brand Assets',  icon: 'M7 1l2 4h4l-3 3 1 4-4-2.5L3 12l1-4L1 5h4z' },
  { href: '/analytics',      label: 'Analytics',     icon: 'M1 12V8m3 4V5m3 7V3m3 9V6' },
  { href: '/referrals',      label: 'Referrals',     icon: 'M7 1l1.5 3.5H13L9.5 7.5l1.5 4L7 9 3.5 11.5l1.5-4L1 4.5h4.5z' },
]

// Business mode nav items — shown when user is on /business/* routes
const businessNavItems = [
  { href: '/generate',       label: '✦ Generate',    icon: 'M1 1h5v5H1zM8 1h5v5H8zM1 8h5v5H1zM8 8h5v5H8z', bizOnly: false },
  { href: '/business/edit',  label: 'Logo',          icon: 'M7 1l2 4h4l-3 3 1 4-4-2.5L3 12l1-4L1 5h4z' },
  { href: '/business/edit?tab=poster', label: 'Poster', icon: 'M2 1h10v12H2zM5 4h4M5 6h4M5 8h2' },
  { href: '/business/edit?tab=flyer',  label: 'Flyer',  icon: 'M1 1h12v4H1zM1 7h12v6H1z' },
  { href: '/business/edit?tab=copy',   label: 'Copy',   icon: 'M3 1h8v2H3zM1 5h12v8H1zM4 8h6M4 10h4' },
  { href: '/business/edit?tab=banner', label: 'Banner', icon: 'M1 3h12v8H1zM4 6h6M4 8h4' },
  { href: '/my-work',        label: 'History',       icon: 'M2 2h10v10H2zM5 5h4M5 7h4M5 9h2' },
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


function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function AppShell({ children, session }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  usePageTracker() // ← tracks page visits + duration for admin analytics

  // Close drawer on navigation
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const initials = session
    ? (session.user.name || session.user.email || 'U')
        .split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
    : null

  // Business mode: user is on /business/* routes
  const isBusinessMode = !!(session && pathname.startsWith('/business'))

  const visibleNavItems = session
    ? (isBusinessMode ? businessNavItems : navItems)
    : guestNavItems

  const topNavLinks = session
    ? isBusinessMode
      ? [
          { href: '/generate', label: 'Generate' },
          { href: '/business/edit', label: 'Logo' },
          { href: '/business/edit?tab=poster', label: 'Poster' },
          { href: '/business/edit?tab=flyer', label: 'Flyer' },
          { href: '/business/edit?tab=copy', label: 'Copy' },
          { href: '/business/edit?tab=banner', label: 'Banner' },
          { href: '/my-work', label: 'History' },
        ]
      : [{ href: '/generate', label: 'Generate' }, { href: '/my-work', label: 'My Work' }, { href: '/business/edit', label: 'Brand Assets' }, { href: '/analytics', label: 'Analytics' }]
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

      {/* Business mode banner in sidebar */}
      {isBusinessMode && session && (
        <div style={{ margin: '0 20px 12px', padding: '10px 14px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C', flexShrink: 0 }} />
            <span style={{ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>Business Mode</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>Logo, poster, flyer, copy & banner assets</div>
        </div>
      )}

      <div style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", padding: '0 20px', marginBottom: 6, marginTop: 8 }}>{isBusinessMode ? 'Business Assets' : 'Navigation'}</div>

      {visibleNavItems.map(item => (
        <Link key={item.href} href={item.href} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 20px', fontSize: 12, letterSpacing: '0.04em',
          color: isActive(item.href, pathname) ? 'var(--gold)' : 'var(--muted)',
          textDecoration: 'none', transition: 'all 0.15s',
          borderLeft: isActive(item.href, pathname) ? '2px solid var(--gold)' : '2px solid transparent',
          marginLeft: -2,
          background: isActive(item.href, pathname) ? 'var(--gold-dim)' : 'transparent'
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
              color: isActive(item.href, pathname) ? 'var(--gold)' : 'var(--muted)',
              textDecoration: 'none', transition: 'all 0.15s',
              borderLeft: isActive(item.href, pathname) ? '2px solid var(--gold)' : '2px solid transparent',
              marginLeft: -2,
              background: isActive(item.href, pathname) ? 'var(--gold-dim)' : 'transparent'
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
           onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
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
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/login?tab=signup" style={{
              display: 'block', textAlign: 'center',
              background: 'var(--gold)', color: '#000',
              padding: '10px', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', fontWeight: 500,
              textDecoration: 'none', borderRadius: 'var(--radius)'
            }}>Get Started Free</Link>
            <Link href="/login" style={{
              display: 'block', textAlign: 'center',
              background: 'transparent', border: '1px solid var(--border2)',
              color: 'var(--muted)', padding: '8px', fontSize: 11,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              textDecoration: 'none', borderRadius: 'var(--radius)'
            }}>Sign In</Link>
          </div>
        </>
      )}

      {/* Legal footer — always visible at bottom of sidebar */}
      <div style={{ marginTop: 'auto', padding: '20px 20px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
          {[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Contact', href: '/contact' },
            { label: 'About', href: '/about' },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{
              fontSize: 10, color: 'var(--muted2)', textDecoration: 'none',
              letterSpacing: '0.06em', transition: 'color 0.15s',
            }}>
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ fontSize: 9, color: 'var(--muted2)', opacity: 0.4, marginTop: 8, letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>
          © {new Date().getFullYear()} Brand Syndicate
        </div>
      </div>
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
      <nav className="top-nav" style={{
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
            cursor: 'pointer', borderRadius: 'var(--radius)', flexShrink: 0,
            // BUG FIX #11: do NOT set display here — let .mobile-only CSS class handle it
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
              color: isActive(item.href, pathname) ? 'var(--gold)' : 'var(--muted)',
              textDecoration: 'none',
              borderBottom: isActive(item.href, pathname) ? '1px solid var(--gold)' : '1px solid transparent',
              marginBottom: isActive(item.href, pathname) ? -1 : 0,
              transition: 'color 0.2s'
            }}>{item.label}</Link>
          ))}
        </div>

        {/* Right: auth controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <ThemeToggle />
          {session ? (
            <>
              <span className="desktop-only plan-badge-desktop" style={{
                fontSize: 9, letterSpacing: '0.12em', fontFamily: "'DM Mono', monospace",
                color: 'var(--gold)', padding: '3px 8px',
                border: '1px solid rgba(201,168,76,0.3)', borderRadius: 1
              }}>{session.user.plan}</span>
              <NotificationBell session={session} />
              {session.user.plan === 'FREE' && (
                <Link className="desktop-only" href="/billing" style={{
                  background: 'var(--gold)', color: '#000',
                  padding: '7px 16px', fontSize: 11, letterSpacing: '0.12em',
                  textTransform: 'uppercase', fontWeight: 500,
                  borderRadius: 'var(--radius)', textDecoration: 'none'
                }}>Upgrade</Link>
              )}
              <button className="desktop-only" onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })} style={{
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
              }}>Sign In</Link>
              <Link href="/login?tab=signup" style={{
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
