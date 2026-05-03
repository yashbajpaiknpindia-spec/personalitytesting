import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PresentationsClient from './PresentationsClient'
import { Suspense } from 'react'

export const metadata = { title: 'My Presentations — Brand Syndicate' }

export default async function PresentationsPage() {
  const session = await auth()
  // BUG FIX: was using session!.user.id which crashes with null — redirect instead
  if (!session?.user?.id) redirect('/login')

  const presentations = await db.presentation.findMany({
    where: { userId: session.user.id },
    include: { slides: { orderBy: { order: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  return (
    <div className="page-pad">
      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 20,
      }}>
        <div style={{ width: 20, height: 1, background: 'var(--gold)' }} />
        Presentations
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: 'var(--cream)', marginBottom: 8 }}>
            Slide Decks
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            All your editable presentations. Click to open the slide editor.
          </p>
        </div>
        <Link
          href="/generate"
          style={{
            background: 'var(--gold)', color: '#000',
            padding: '10px 20px', fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            fontWeight: 500, textDecoration: 'none',
            borderRadius: 'var(--radius)', whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          + New Deck
        </Link>
      </div>

      <Suspense fallback={<div style={{ padding: 40, color: 'var(--muted)', fontSize: 12 }}>Loading…</div>}>
        <PresentationsClient
          initialPresentations={presentations.map((p: { id: string; title: string; slug: string; accentColor: string; slides: unknown[]; updatedAt: Date }) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            accentColor: p.accentColor,
            slideCount: p.slides.length,
            updatedAt: p.updatedAt.toISOString(),
          }))}
        />
      </Suspense>
    </div>
  )
}
