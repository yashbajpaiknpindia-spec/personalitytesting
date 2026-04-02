import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function AnalyticsPage() {
  const session = await auth()

  if (session!.user.plan === 'FREE') {
    return (
      <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, border: '1px solid var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 20 }}>📊</div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--cream)', marginBottom: 10 }}>Analytics is a Pro feature</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 28, maxWidth: 360 }}>Unlock detailed usage stats, generation history charts, and template performance data.</p>
        <Link href="/billing" style={{ background: 'var(--gold)', color: '#000', padding: '10px 28px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Upgrade to Pro</Link>
      </div>
    )
  }

  const userId = session!.user.id

  const [totalGenerations, totalExports, generations, dbUser] = await Promise.all([
    db.generation.count({ where: { userId, status: 'COMPLETE' } }),
    db.export.count({ where: { userId } }),
    db.generation.findMany({
      where: { userId, status: 'COMPLETE' },
      include: { template: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.user.findUnique({ where: { id: userId }, select: { referralCode: true } }),
  ])

  const totalReferrals = dbUser?.referralCode
    ? await db.user.count({ where: { referredBy: dbUser.referralCode } })
    : 0

  // Last 30 days chart data
  const now = new Date()
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })
  const genByDay = Object.fromEntries(days.map(d => [d, 0]))
  generations.forEach(g => {
    const d = g.createdAt.toISOString().split('T')[0]
    if (genByDay[d] !== undefined) genByDay[d]++
  })
  const chartData = days.map(d => ({ day: d.slice(5), count: genByDay[d] }))
  const maxCount = Math.max(...chartData.map(d => d.count), 1)

  // Top templates
  const templateCounts: Record<string, { name: string; count: number }> = {}
  generations.forEach(g => {
    const id = g.templateId
    if (!templateCounts[id]) templateCounts[id] = { name: g.template.name, count: 0 }
    templateCounts[id].count++
  })
  const topTemplates = Object.values(templateCounts).sort((a, b) => b.count - a.count).slice(0, 5)

  return (
    <div style={{ padding: '40px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
        <div style={{ width: 20, height: 1, background: 'var(--gold)' }} /> Analytics
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: 'var(--cream)', marginBottom: 36 }}>Usage Dashboard</h1>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 40 }}>
        {[
          { val: totalGenerations, label: 'Total Generations' },
          { val: totalExports, label: 'Total Downloads' },
          { val: Object.keys(templateCounts).length, label: 'Templates Used' },
          { val: totalReferrals, label: 'Referrals' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
            <div style={{ fontSize: 32, fontFamily: "'Playfair Display', serif", color: 'var(--cream)', marginBottom: 6 }}>{s.val}</div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>Generations — Last 30 Days</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
          {chartData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', background: d.count > 0 ? 'var(--gold)' : 'var(--surface2)', borderRadius: '1px 1px 0 0', height: `${(d.count / maxCount) * 100}px`, minHeight: d.count > 0 ? 4 : 2, transition: 'height 0.3s', opacity: d.count > 0 ? 1 : 0.3 }} />
              {i % 5 === 0 && <div style={{ fontSize: 8, color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{d.day}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Top templates */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Top Templates</div>
        {topTemplates.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted2)', textAlign: 'center', padding: '20px 0' }}>No data yet</div>
        ) : topTemplates.map((t, i) => (
          <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < topTemplates.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 12, color: 'var(--gold)', fontFamily: "'DM Mono', monospace", width: 20 }}>0{i + 1}</div>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{t.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{t.count} uses</div>
            <div style={{ width: 80, height: 4, background: 'var(--surface2)', borderRadius: 2 }}>
              <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 2, width: `${(t.count / topTemplates[0].count) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
