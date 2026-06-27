'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Session } from 'next-auth'
import ThemeToggle from '@/components/ThemeToggle'

// ── Notification Bell (dropdown) ─────────────────────────────────────────
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

  // Fetch on first mount (unread count badge)
  useEffect(() => {
    if (!session?.user?.id) return
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 60_000)
    return () => clearInterval(interval)
  }, [session?.user?.id, fetchNotifs])

  // Close on outside click (desktop only — mobile uses full-screen dropdown)
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
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: unread }),
    })
    setNotifications(prev => prev.map((n: any) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const handleOpen = () => {
    setOpen(v => {
      const next = !v
      if (next) { setLoading(true); fetchNotifs().finally(() => setLoading(false)) }
      return next
    })
  }

  return (
    <div ref={ref} style={{ position: 'relative' }} className="desktop-notif-dropdown-wrap">
      <button
        onClick={handleOpen}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={open}
        style={{
          position: 'relative', width: 34, height: 34,
          background: 'transparent', border: '1px solid var(--border2)',
          borderRadius: 'var(--radius)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? 'var(--cream)' : 'var(--muted)', flexShrink: 0,
          transition: 'border-color 0.2s, color 0.2s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)' }}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)' } }}
      >
        {/* Clean bell SVG */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            width: 16, height: 16, borderRadius: '50%',
            background: '#C0392B', color: '#fff',
            fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Mono', monospace", fontWeight: 600, lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="app-notif-dropdown">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: 'var(--cream)' }}>Notifications</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ fontSize: 10, color: '#C9A84C', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1, padding: '0 2px' }} aria-label="Close">✕</button>
            </div>
          </div>

          {/* Body */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '28px', textAlign: 'center', color: 'var(--muted)', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>Loading…</div>
            ) : (
              ([
                ...notifications,
                { id: 'auto-welcome', title: 'Welcome to Brand Syndicate', body: 'Your generated websites, graphics and leads will appear in your workspace automatically.', createdAt: new Date().toISOString(), isRead: true, type: 'automated' },
                { id: 'auto-calendar', title: 'Content Calendar is locked', body: 'Calendar generation will be visible here once the feature is unlocked for your plan.', createdAt: new Date().toISOString(), isRead: true, type: 'automated' },
                { id: 'auto-leads', title: 'Lead capture is active', body: 'Published website forms will send enquiries into your website leads panel when visitors submit them.', createdAt: new Date().toISOString(), isRead: true, type: 'automated' },
              ]).map((n: any) => (
                <div key={n.id} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: n.isRead ? 'transparent' : 'rgba(201,168,76,0.04)',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  cursor: 'default',
                }}>
                  {n.imageUrl ? (
                    <img src={n.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(201,168,76,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                      <div style={{ fontSize: 12, color: n.isRead ? 'var(--muted)' : 'var(--cream)', fontWeight: n.isRead ? 400 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>{n.title}</div>
                      {!n.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C', flexShrink: 0, marginTop: 3 }} />}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{n.body}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace" }}>
                      {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
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

function isActive(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  const hrefPath = href.split('?')[0]
  const hrefTab = new URLSearchParams(href.split('?')[1] || '').get('tab')
  if (hrefTab) return pathname.startsWith(hrefPath)
  return pathname === hrefPath || pathname.startsWith(hrefPath + '/')
}

const navItems = [
  { href: '/',             label: 'Home' },
  { href: '/dashboard',    label: 'Dashboard' },
  { href: '/generate',     label: 'Generation' },
  { href: '/templates',    label: 'Website Templates' },
  { href: '/my-work',      label: 'My Work' },
  { href: '/billing',      label: 'Billing' },
]

const mobileNavItems = [
  { href: '/',             label: 'Home' },
  { href: '/dashboard',    label: 'Dashboard' },
  { href: '/generate',     label: 'Generation' },
  { href: '/templates',    label: 'Website Templates' },
  { href: '/my-work',      label: 'My Work' },
]

const guestNavItems = [
  { href: '/',          label: 'Home' },
  { href: '/generate',  label: 'Generation' },
  { href: '/templates', label: 'Website Templates' },
]

const settingsItems = [
  { href: '/settings', label: 'Settings' },
  { href: '/billing',  label: 'Billing' },
  { href: '/support',  label: 'Help & Support' },
]

export default function AppShell({ children, session }: Props) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close desktop user dropdown on outside click only
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (window.innerWidth <= 900) return // mobile handled by backdrop
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { setDrawerOpen(false) }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const initials = session
    ? (session.user.name || session.user.email || 'U')
        .split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase()
    : null

  const topNavLinks = session ? navItems : guestNavItems
  const drawerNavItems = session ? mobileNavItems : guestNavItems

  return (
    <>
      {/* ── Top Nav ── */}
      <nav className={`app-top-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="app-nav-bar">

          {/* Burger (mobile only) */}
          <button
            className={`app-burger${drawerOpen ? ' open' : ''}`}
            onClick={() => setDrawerOpen(v => !v)}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          >
            <span /><span /><span />
          </button>

          {/* Brand */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, marginRight: 24 }}
            className="app-nav-logo-link"
          >
            <div className="app-nav-logo-text" style={{
              fontFamily: "'Instrument Serif', 'Playfair Display', serif",
              fontSize: 16, letterSpacing: '0.05em',
              color: 'var(--cream)', fontWeight: 500, whiteSpace: 'nowrap',
            }}>
              Brand <span style={{ color: 'var(--gold)' }}>·</span> Syndicate
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="app-nav-links" style={{ flex: 1 }}>
            {topNavLinks.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`app-nav-link${isActive(item.href, pathname) ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>



            {/* Theme toggle */}
            <span className="nav-theme-toggle"><ThemeToggle /></span>

            {session ? (
              <>
                {/* Notification bell — visible on all screen sizes */}
                <NotificationBell session={session} />

                {/* Upgrade button */}
                {session.user.plan === 'FREE' && (
                  <span className="nav-upgrade-btn">
                    <Link href="/billing" style={{
                      padding: '6px 14px', fontSize: 9, letterSpacing: '0.18em',
                      textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
                      background: 'transparent', border: '1px solid rgba(212,175,84,0.4)',
                      color: 'var(--gold)', textDecoration: 'none', borderRadius: 3,
                      transition: 'all 0.2s', whiteSpace: 'nowrap', display: 'inline-block',
                    }}>Upgrade</Link>
                  </span>
                )}

                {/* Avatar — desktop dropdown / mobile bottom sheet */}
                <div ref={userMenuRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    title="Account"
                    className="nav-user-btn"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      padding: 0, flexShrink: 0,
                    }}
                  >
                    <span className="nav-user-name" style={{
                      fontSize: 10, color: 'var(--muted)',
                      fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em',
                      maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || ''}
                    </span>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: `1px solid ${userMenuOpen ? 'rgba(201,168,76,0.7)' : 'rgba(201,168,76,0.35)'}`,
                      background: 'var(--surface2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'var(--gold)', fontFamily: "'DM Mono', monospace",
                      flexShrink: 0, transition: 'border-color 0.2s',
                    }}>{initials}</div>
                  </button>

                  {/* Desktop dropdown */}
                  {userMenuOpen && (
                    <div className="desktop-user-dropdown" style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)', minWidth: 190, zIndex: 9000,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px var(--border)', overflow: 'hidden',
                    }}>
                      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, color: 'var(--cream)', fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {session?.user?.name || session?.user?.email || 'My Account'}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--gold)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {session?.user?.plan || 'FREE'}
                        </div>
                      </div>
                      {[
                        { href: '/settings', label: 'Settings' },
                        { href: '/billing',  label: 'Billing' },
                        { href: '/support',  label: 'Help & Support' },
                        { href: '/my-work',  label: 'My Generations' },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)}
                          style={{ display: 'block', padding: '9px 14px', fontSize: 11, color: 'var(--text)', textDecoration: 'none', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; (e.currentTarget as HTMLElement).style.color = 'var(--cream)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                        >{item.label}</Link>
                      ))}
                      {session?.user?.role === 'ADMIN' && (
                        <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                          style={{ display: 'block', padding: '9px 14px', fontSize: 11, color: '#e74c3c', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
                        >Admin Panel</Link>
                      )}
                      <button onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: `${window.location.origin}/login` }) }}
                        style={{ display: 'block', width: '100%', padding: '9px 14px', fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s, color 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(192,57,43,0.1)'; (e.currentTarget as HTMLElement).style.color = '#e74c3c' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                      >Sign out</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  padding: '7px 14px', fontSize: 9, letterSpacing: '0.14em',
                  textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
                  background: 'transparent', border: '1px solid var(--border2)',
                  color: 'var(--muted)', textDecoration: 'none', borderRadius: 3,
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}>Sign In</Link>
                <Link href="/login?tab=signup" style={{
                  padding: '7px 14px', fontSize: 9, letterSpacing: '0.14em',
                  textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
                  background: 'linear-gradient(135deg,#E9C97A,#D4AF54 55%,#A8842F)',
                  color: '#0A0A0E', textDecoration: 'none', borderRadius: 3,
                  fontWeight: 700, whiteSpace: 'nowrap',
                }}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer Backdrop ── */}
      {drawerOpen && (
        <div
          className="app-drawer-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Drawer ── */}
      <div className={`app-drawer${drawerOpen ? ' open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="app-drawer-section">Studio</div>
        {drawerNavItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`app-drawer-link${isActive(item.href, pathname) ? ' active' : ''}`}
            onClick={() => setDrawerOpen(false)}
          >
            {item.label}
          </Link>
        ))}


        {/* Theme toggle row in drawer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 0', borderBottom: '1px solid var(--border)',
        }}>
          <span style={{
            fontSize: 18, letterSpacing: '0.03em',
            color: 'var(--text)',
            fontFamily: "'Instrument Serif', serif",
          }}>
            Appearance
          </span>
          <ThemeToggle />
        </div>

        {session && (
          <>
            <div className="app-drawer-section">Account</div>
            {settingsItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`app-drawer-link${isActive(item.href, pathname) ? ' active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {session.user.role === 'ADMIN' && (
              <Link href="/admin" className="app-drawer-link" style={{ color: 'var(--red)' }} onClick={() => setDrawerOpen(false)}>Admin Panel</Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 18, letterSpacing: '0.03em',
                color: 'var(--muted)', padding: '13px 0',
                borderBottom: '1px solid var(--border)',
                fontFamily: "'Instrument Serif', serif", textAlign: 'left',
                width: '100%',
              }}
            >
              Sign out
            </button>
          </>
        )}

        {!session && (
          <Link href="/generate" className="app-drawer-cta" onClick={() => setDrawerOpen(false)}>
            Generate Now →
          </Link>
        )}
      </div>

      {/* ── Mobile Account Bottom Sheet ── */}
      {session && (
        <>
          <div
            className={`acct-sheet-backdrop${userMenuOpen ? ' open' : ''}`}
            onClick={() => setUserMenuOpen(false)}
          />
          <div className={`acct-sheet${userMenuOpen ? ' open' : ''}`} aria-hidden={!userMenuOpen}>
            <div className="acct-sheet-handle" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px 16px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid var(--border-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--gold)', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session?.user?.name || session?.user?.email || 'My Account'}
                </div>
                <div style={{ fontSize: 9, color: 'var(--gold)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
                  {session?.user?.plan || 'FREE'} Plan
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 8 }} />
            {[
              { href: '/my-work',  icon: 'my-work', label: 'My Generations' },
              { href: '/settings', icon: 'settings', label: 'Settings' },
              { href: '/billing',  icon: 'billing', label: 'Billing' },
              { href: '/support',  icon: 'support', label: 'Help & Support' },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setUserMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', textDecoration: 'none', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
              >
                <span style={{ width: 18, textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon === 'my-work' && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="9" rx="1.2" stroke="var(--gold)" strokeWidth="1.3"/><path d="M4 3V2.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V3" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round"/><path d="M4 7h6M4 10h4" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round"/></svg>}
                  {item.icon === 'settings' && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="var(--gold)" strokeWidth="1.3"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round"/></svg>}
                  {item.icon === 'billing' && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="1.2" stroke="var(--gold)" strokeWidth="1.3"/><path d="M1 6h12" stroke="var(--gold)" strokeWidth="1.3"/><path d="M4 9h2" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round"/></svg>}
                  {item.icon === 'support' && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.2" stroke="var(--gold)" strokeWidth="1.3"/><path d="M5.7 5.4a1.5 1.5 0 1 1 2.3 1.25c-.55.35-1 .68-1 1.35" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round"/><path d="M7 10.5h.01" stroke="var(--gold)" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                </span>
                <span style={{ fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>{item.label}</span>
              </Link>
            ))}
            {session.user.role === 'ADMIN' && (
              <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
              >
                <span style={{ width: 18, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M8 1L2 8h5l-1 5 7-8H8L9 1z" stroke="#e74c3c" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                <span style={{ fontSize: 14, color: '#e74c3c' }}>Admin Panel</span>
              </Link>
            )}
            {session.user.plan === 'FREE' && (
              <Link href="/billing" onClick={() => setUserMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', textDecoration: 'none', background: 'var(--gold-dim)', borderBottom: '1px solid var(--border)' }}
              >
                <span style={{ width: 18, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 11V3M3.5 6.5L7 3l3.5 3.5" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                <span style={{ fontSize: 14, color: 'var(--gold)', fontWeight: 500 }}>Upgrade to Pro</span>
              </Link>
            )}
            <button
              onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: `${window.location.origin}/login` }) }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{ width: 18, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M9 10l3-3-3-3M12 7H5" stroke="var(--muted)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
              <span style={{ fontSize: 14, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>Sign out</span>
            </button>
            <div style={{ height: 8 }} />
          </div>
        </>
      )}

      {/* ── Page body ── */}
      <div style={{ paddingTop: 'var(--nav-h)', minHeight: '100vh' }}>
        <main style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>
    </>
  )
}
