'use client'

// src/components/PublishButton.tsx

import { useState } from 'react'
import { usePublishPortfolio } from '@/hooks/usePublishPortfolio'

interface Props {
  generationId: string | null
  accent: string
  websiteTheme?: string
  onPublished?: (slug: string, url: string) => void
}

export default function PublishButton({ generationId, accent, websiteTheme, onPublished }: Props) {
  const { publish, loading, result } = usePublishPortfolio()
  const [showPanel, setShowPanel]   = useState(false)
  const [copied, setCopied]         = useState(false)

  async function handlePublish() {
    if (!generationId) return
    try {
      const res = await publish(generationId, websiteTheme)
      setShowPanel(true)
      if (res?.slug && res?.url && onPublished) {
        onPublished(res.slug, res.url)
      }
    } catch {
      // error handled by hook
    }
  }

  function copyUrl() {
    if (!result?.url) return
    navigator.clipboard.writeText(result.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'relative' }}>
      {result && showPanel ? (
        <>
          <button
            onClick={() => setShowPanel(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'transparent', border: `1px solid ${accent}`,
              color: accent, padding: '4px 10px', fontSize: 9,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: "'DM Mono', monospace", cursor: 'pointer',
              borderRadius: 'var(--radius)',
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent, display: 'inline-block' }} />
            Live
          </button>

          {showPanel && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 200,
              background: 'var(--surface)', border: '1px solid var(--border2)',
              padding: 16, width: 300, borderRadius: 'var(--radius)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)', marginTop: 4,
            }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>
                Portfolio Live ✓
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  readOnly
                  value={result.url}
                  style={{
                    flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
                    color: 'var(--text)', padding: '6px 10px', fontSize: 11,
                    borderRadius: 2, fontFamily: "'DM Mono', monospace", outline: 'none',
                  }}
                />
                <button
                  onClick={copyUrl}
                  style={{
                    background: accent, color: '#000', border: 'none',
                    padding: '6px 10px', fontSize: 10, cursor: 'pointer',
                    borderRadius: 2, fontWeight: 500, whiteSpace: 'nowrap',
                  }}
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 10, color: accent, textDecoration: 'none', letterSpacing: '0.06em' }}
              >
                Open in new tab →
              </a>
            </div>
          )}
        </>
      ) : (
        <button
          onClick={handlePublish}
          disabled={!generationId || loading}
          style={{
            background: 'transparent',
            border: `1px solid ${generationId ? accent : 'var(--border)'}`,
            color: generationId ? accent : 'var(--muted)',
            padding: '4px 12px', fontSize: 9,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            fontFamily: "'DM Mono', monospace", cursor: generationId ? 'pointer' : 'not-allowed',
            borderRadius: 'var(--radius)', opacity: loading ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {loading ? '…' : 'Publish'}
        </button>
      )}
    </div>
  )
}
