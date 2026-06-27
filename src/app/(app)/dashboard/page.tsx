'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useDashboardOverview } from '@/hooks/useDashboard'

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono',monospace", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 28, color: 'var(--gold)', fontWeight: 400, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

const quickActions = [
  {
    href: '/generate',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7.5" stroke="var(--gold)" strokeWidth="1.3"/>
        <path d="M9 5.5v7M5.5 9h7" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    label: 'New Generation',
    sub: 'Build your brand kit',
  },
  {
    href: '/my-work',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="11" rx="1.5" stroke="var(--gold)" strokeWidth="1.3"/>
        <path d="M5 4V3.5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 13 3.5V4" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M5.5 9h7M5.5 12h4.5" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    label: 'My Work',
    sub: 'View all generations',
  },
  {
    href: '/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2.5" stroke="var(--gold)" strokeWidth="1.3"/>
        <path d="M9 2v2M9 14v2M2 9h2M14 9h2M3.93 3.93l1.41 1.41M12.66 12.66l1.41 1.41M3.93 14.07l1.41-1.41M12.66 5.34l1.41-1.41" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Settings',
    sub: 'Profile & account',
  },
  {
    href: '/billing',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4.5" width="14" height="9" rx="1.5" stroke="var(--gold)" strokeWidth="1.3"/>
        <path d="M2 8h14" stroke="var(--gold)" strokeWidth="1.3"/>
        <path d="M5.5 11.5h3" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Billing',
    sub: 'Plans & payments',
  },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const { data, loading, error } = useDashboardOverview()

  const user = session?.user as { name?: string; plan?: string; username?: string } | undefined
  const firstName = user?.name?.split(' ')[0] || 'there'
  const plan = user?.plan || 'FREE'
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

  return (
    <div className="page-pad dashboard-page" style={{ maxWidth: 1200 }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="dash-header">
        <div className="page-eyebrow"><span className="page-eyebrow-dot" />Dashboard</div>
        <h1 className="page-h1">Welcome back, <em>{firstName}.</em></h1>
        <div className="dash-plan-row">
          <span className="dash-plan-badge" data-plan={plan === 'FREE' ? 'free' : 'paid'}>
            {plan} Plan
          </span>
          {plan === 'FREE' && (
            <Link href="/billing" className="dash-upgrade-link">
              Upgrade →
            </Link>
          )}
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <div className="dash-actions-grid">
        {quickActions.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="dash-action-card"
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div className="dash-action-icon">{item.icon}</div>
            <div className="dash-action-label">{item.label}</div>
            <div className="dash-action-sub">{item.sub}</div>
          </Link>
        ))}
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="dash-stats-grid" style={{ marginBottom: 40 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px', height: 84 }}>
              <div style={{ width: 56, height: 9, background: 'var(--border)', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ width: 36, height: 24, background: 'var(--border)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : !error && data ? (
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono',monospace", marginBottom: 14 }}>Your Activity</div>
          <div className="dash-stats-grid">
            <Stat label="Website Views"    value={data.stats.totalViews} sub={data.stats.totalViews === 0 ? 'Share your site to get views' : undefined} />
            <Stat label="Leads Captured"  value={data.stats.totalLeads} sub={data.stats.totalLeads === 0 ? 'Add a form to your website' : undefined} />
            <Stat label="Brand Assets"    value={data.stats.totalGenerations} sub="Websites, logos & graphics" />
            <Stat label="Downloads"       value={data.stats.totalExports} sub={data.stats.totalExports === 0 ? 'Download from My Work' : undefined} />
          </div>
        </div>
      ) : null}

      {/* ── Portfolio status ───────────────────────────────────── */}
      {data?.portfolio && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '22px 24px', marginBottom: 24 }}>
          <div className="dash-portfolio-row">
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono',monospace", marginBottom: 6 }}>Live Portfolio</div>
              <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 500, marginBottom: 4 }}>
                {data.portfolio.isPublished ? 'Published & Live' : 'Unpublished Draft'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", wordBreak: 'break-all' }}>
                {APP_URL}/p/{data.portfolio.slug}
              </div>
            </div>
            <div className="dash-portfolio-actions">
              <a
                href={`${APP_URL}/p/${data.portfolio.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(201,168,76,0.4)', color: 'var(--gold)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 'var(--radius)', fontFamily: "'DM Mono',monospace", whiteSpace: 'nowrap' }}
              >
                View Live
              </a>
              <Link
                href="/generate"
                style={{ padding: '8px 16px', background: 'var(--gold)', color: '#0A0A0E', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', borderRadius: 'var(--radius)', fontFamily: "'DM Mono',monospace", fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Edit Brand
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Leads ───────────────────────────────────────── */}
      {data?.recentLeads && data.recentLeads.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '22px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono',monospace" }}>Recent Leads</div>
            <Link href="/analytics" style={{ fontSize: 11, color: 'var(--muted)', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {data.recentLeads.slice(0, 5).map((lead: { name: string; email: string; createdAt: string }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: i < Math.min(data.recentLeads.length, 5) - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", flexShrink: 0 }}>
                  {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick links for active users ───────────────────── */}
      {!loading && data && data.stats.totalGenerations > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          <Link href="/my-work" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textDecoration: 'none', transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="4" width="14" height="11" rx="1.5" stroke="var(--gold)" strokeWidth="1.3"/><path d="M5.5 9h7M5.5 12h4.5" stroke="var(--gold)" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <div>
              <div style={{ fontSize: 12, color: 'var(--cream)', fontWeight: 500 }}>View All Assets</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Websites, logos, graphics</div>
            </div>
          </Link>
          <Link href="/generate" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textDecoration: 'none', transition: 'border-color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7.5" stroke="var(--gold)" strokeWidth="1.3"/><path d="M9 5.5v7M5.5 9h7" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <div>
              <div style={{ fontSize: 12, color: 'var(--cream)', fontWeight: 500 }}>New Generation</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Build another brand kit</div>
            </div>
          </Link>
        </div>
      )}

      {/* ── Empty CTA ──────────────────────────────────────────── */}
      {!loading && !data?.portfolio && data?.stats.totalGenerations === 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 'var(--radius)', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Instrument Serif',serif", fontSize: 22, color: 'var(--text)', marginBottom: 10 }}>Generate your first brand kit</div>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
            Get a complete website, logo, graphics, and brand strategy for your business.
          </p>
          <Link
            href="/generate"
            style={{ display: 'inline-block', padding: '12px 28px', background: 'var(--gold)', color: '#0A0A0E', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700, textDecoration: 'none', borderRadius: 'var(--radius)', fontFamily: "'DM Sans',sans-serif" }}
          >
            Start Generating
          </Link>
        </div>
      )}

      {/* ── Responsive styles ─────────────────────────────────── */}
      <style>{`
        .dashboard-page { width: 100%; box-sizing: border-box; }

        .dash-header { margin-bottom: 32px; }
        .dash-plan-row {
          display: flex; align-items: center; gap: 12; margin-top: 10px; flex-wrap: wrap;
        }
        .dash-plan-badge {
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          font-family: 'DM Mono', monospace;
          padding: 3px 10px; border-radius: 3px; border: 1px solid;
        }
        .dash-plan-badge[data-plan="free"] { color: var(--muted); border-color: var(--border); }
        .dash-plan-badge[data-plan="paid"]  { color: var(--gold); border-color: rgba(201,168,76,0.4); }
        .dash-upgrade-link {
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--gold); font-family: 'DM Mono', monospace; text-decoration: none;
        }

        /* Actions grid – 4 col on desktop, 2 col on tablet, 1 col on mobile */
        .dash-actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 36px;
        }
        .dash-action-card {
          text-decoration: none; display: block;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 18px 18px 16px;
          transition: border-color 0.2s; cursor: pointer;
        }
        .dash-action-icon { margin-bottom: 12px; }
        .dash-action-label { font-size: 13px; color: var(--text); font-weight: 500; margin-bottom: 3px; }
        .dash-action-sub   { font-size: 12px; color: var(--muted); }

        /* Stats grid – 4 col desktop, 2 col tablet/mobile */
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 36px;
        }

        /* Portfolio row */
        .dash-portfolio-row {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px; flex-wrap: wrap;
        }
        .dash-portfolio-actions {
          display: flex; gap: 10px; flex-wrap: wrap; flex-shrink: 0;
        }

        @media (max-width: 900px) {
          .dash-actions-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-stats-grid   { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 540px) {
          .dash-header { margin-bottom: 24px; }
          .dash-actions-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 28px;
          }
          .dash-action-card { padding: 14px 14px 12px; }
          .dash-action-label { font-size: 12px; }
          .dash-action-sub   { font-size: 11px; }
          .dash-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 28px;
          }
          .dash-portfolio-row { flex-direction: column; }
          .dash-portfolio-actions { width: 100%; }
          .dash-portfolio-actions a { flex: 1; text-align: center; }
        }

        @media (max-width: 360px) {
          .dash-actions-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
          .dash-stats-grid   { grid-template-columns: 1fr 1fr; gap: 8px; }
        }
      `}</style>
    </div>
  )
}
