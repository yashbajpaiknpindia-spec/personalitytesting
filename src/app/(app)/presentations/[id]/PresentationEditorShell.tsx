'use client'
import Link from 'next/link'
import SlideEditor from '@/components/SlideEditor'

interface Props {
  presentationId: string
  accentColor: string
  initialTitle: string
}

export default function PresentationEditorShell({
  presentationId,
  accentColor,
  initialTitle,
}: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#09090A' }}>
      {/* Breadcrumb bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0f0f0f',
      }}>
        <Link
          href="/presentations"
          style={{
            fontSize: 11, letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.3)',
            textDecoration: 'none',
            fontFamily: "'DM Mono', monospace",
            textTransform: 'uppercase',
          }}
        >
          ← Presentations
        </Link>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.1)' }}>/</span>
        <span style={{
          fontSize: 11, letterSpacing: '0.1em',
          color: accentColor,
          fontFamily: "'DM Mono', monospace",
          textTransform: 'uppercase',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {initialTitle}
        </span>
      </div>

      {/* Full-width slide editor */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '8px 0 60px' }}>
        <SlideEditor
          existingPresentationId={presentationId}
          accentColor={accentColor}
        />
      </div>
    </div>
  )
}
