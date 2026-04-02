import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') redirect('/generate')

  const [totalUsers, totalGenerations, flagged, recentUsers] = await Promise.all([
    db.user.count(),
    db.generation.count(),
    db.generation.findMany({ where: { status: 'FLAGGED' }, include: { user: true }, take: 20, orderBy: { createdAt: 'desc' } }),
    db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
  ])

  return (
    <div style={{ padding: '40px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--red)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
        <div style={{ width: 20, height: 1, background: 'var(--red)' }} /> Admin Panel
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: 'var(--cream)', marginBottom: 36 }}>Admin Dashboard</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 48 }}>
        {[
          { val: totalUsers, label: 'Total Users' },
          { val: totalGenerations, label: 'Total Generations' },
          { val: flagged.length, label: 'Flagged Content' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
            <div style={{ fontSize: 32, fontFamily: "'Playfair Display', serif", color: 'var(--cream)', marginBottom: 6 }}>{s.val}</div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Flagged content */}
      {flagged.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--red)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Flagged Generations ({flagged.length})</div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['User', 'Reason', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flagged.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text)' }}>{g.user.email}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--red)' }}>{g.flagReason}</td>
                    <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{new Date(g.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(192,57,43,0.15)', color: 'var(--red)', borderRadius: 1, fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em' }}>FLAGGED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users table */}
      <div>
        <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Recent Users</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Email', 'Plan', 'Usage', 'Joined'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text)' }}>{u.email}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: 9, padding: '2px 7px', background: u.plan !== 'FREE' ? 'var(--gold-dim)' : 'var(--surface2)', color: u.plan !== 'FREE' ? 'var(--gold)' : 'var(--muted)', borderRadius: 1, fontFamily: "'DM Mono', monospace" }}>{u.plan}</span>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{u.usageCount}</td>
                  <td style={{ padding: '10px 16px', fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
