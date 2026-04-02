import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function MyWorkPage() {
  const session = await auth()
  const generations = await db.generation.findMany({
    where: { userId: session!.user.id, status: 'COMPLETE' },
    include: { template: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="page-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
        <div style={{ width: 20, height: 1, background: 'var(--gold)' }} /> My Work
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: 'var(--cream)', marginBottom: 8 }}>Generation History</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 36 }}>All your AI-generated brand assets, versioned and ready to export.</p>

      {generations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'var(--surface3)', marginBottom: 12 }}>No generations yet</div>
          <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 24 }}>Your brand starts with one prompt.</p>
          <Link href="/generate" style={{ background: 'var(--gold)', color: '#000', padding: '10px 24px', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Generate Now</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {generations.map(gen => {
            const output = gen.outputData as unknown as { headline?: string; cardName?: string } | null
            return (
              <div key={gen.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", background: 'var(--gold-dim)', padding: '2px 8px', borderRadius: 1 }}>{gen.template.category}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: "'DM Mono', monospace" }}>v{gen.version}</div>
                </div>
                <div style={{ height: 60, background: 'var(--surface2)', borderRadius: 2, marginBottom: 14, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 14px', gap: 6 }}>
                  <div style={{ height: 2, background: 'var(--gold)', width: '80%', borderRadius: 1 }} />
                  <div style={{ height: 2, background: 'var(--border2)', width: '60%', borderRadius: 1 }} />
                  <div style={{ height: 2, background: 'var(--border2)', width: '40%', borderRadius: 1 }} />
                </div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: 'var(--cream)', marginBottom: 4 }}>
                  {output?.cardName || output?.headline || 'Untitled'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>{gen.template.name} · {new Date(gen.createdAt).toLocaleDateString()}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link href={`/generate?from=${gen.id}`} style={{ flex: 1, textAlign: 'center', padding: '7px', background: 'var(--gold)', color: '#000', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500, textDecoration: 'none', borderRadius: 'var(--radius)' }}>Open</Link>
                  <Link href={`/generate?from=${gen.id}&export=1`} style={{ padding: '7px 14px', background: 'transparent', border: '1px solid var(--border2)', color: 'var(--muted)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 'var(--radius)', textDecoration: 'none', display: 'inline-block' }}>Export</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
