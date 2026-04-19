'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'

interface PresentationSummary {
  id: string
  title: string
  slug: string
  accentColor: string
  slideCount: number
  updatedAt: string
}

export default function PresentationsClient({
  initialPresentations,
}: {
  initialPresentations: PresentationSummary[]
}) {
  const [items, setItems] = useState(initialPresentations)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this presentation? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/presentation/${id}`, { method: 'DELETE' })
      if (res.ok || res.status === 404) {
        setItems(prev => prev.filter(p => p.id !== id))
      }
    } finally {
      setDeleting(null)
    }
  }, [])

  const handleCopy = useCallback((slug: string, id: string) => {
    const url = `${window.location.origin}/presentation/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }, [])

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 40px' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'var(--surface3)', marginBottom: 12 }}>
          No presentations yet
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 24 }}>
          Generate your brand and open the Presentation tab to create your first deck.
        </p>
        <Link
          href="/generate"
          style={{
            background: 'var(--gold)', color: '#000',
            padding: '10px 24px', fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            fontWeight: 500, textDecoration: 'none',
            borderRadius: 'var(--radius)',
          }}
        >
          Generate Now
        </Link>
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 16,
    }}>
      {items.map(p => (
        <div
          key={p.id}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderTop: `3px solid ${p.accentColor}`,
            borderRadius: 'var(--radius)',
            padding: 20,
            position: 'relative',
            transition: 'border-color 0.15s',
          }}
        >
          {/* Mini slide preview */}
          <div style={{
            height: 64, background: '#09090A',
            borderRadius: 3, marginBottom: 14,
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', padding: '0 14px', gap: 7,
            overflow: 'hidden',
          }}>
            <div style={{ height: 2, background: p.accentColor, width: '70%', borderRadius: 1 }} />
            <div style={{ height: 2, background: 'rgba(255,255,255,0.08)', width: '50%', borderRadius: 1 }} />
            <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', width: '35%', borderRadius: 1 }} />
          </div>

          {/* Title */}
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 15, color: 'var(--cream)',
            marginBottom: 4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {p.title}
          </div>

          {/* Meta */}
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
            {p.slideCount} {p.slideCount === 1 ? 'slide' : 'slides'} ·{' '}
            {new Date(p.updatedAt).toLocaleDateString()}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href={`/presentations/${p.id}`}
              style={{
                flex: 1, textAlign: 'center',
                padding: '7px', background: 'var(--gold)',
                color: '#000', fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                fontWeight: 500, textDecoration: 'none',
                borderRadius: 'var(--radius)',
              }}
            >
              Edit
            </Link>

            <button
              onClick={() => handleCopy(p.slug, p.id)}
              title="Copy share link"
              style={{
                padding: '7px 12px', background: 'transparent',
                border: '1px solid var(--border2)',
                color: copied === p.id ? 'var(--gold)' : 'var(--muted)',
                fontSize: 10, letterSpacing: '0.1em',
                textTransform: 'uppercase', cursor: 'pointer',
                borderRadius: 'var(--radius)', whiteSpace: 'nowrap',
              }}
            >
              {copied === p.id ? '✓' : '⇗'}
            </button>

            <button
              onClick={() => handleDelete(p.id)}
              disabled={deleting === p.id}
              title="Delete presentation"
              style={{
                padding: '7px 12px', background: 'transparent',
                border: '1px solid var(--border2)',
                color: deleting === p.id ? 'var(--muted2)' : '#8b2020',
                fontSize: 10, cursor: deleting === p.id ? 'default' : 'pointer',
                borderRadius: 'var(--radius)',
              }}
            >
              {deleting === p.id ? '…' : '✕'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
