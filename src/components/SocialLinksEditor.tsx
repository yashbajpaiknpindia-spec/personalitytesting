'use client'
// src/components/SocialLinksEditor.tsx
// Editable social links panel. Drop into settings/page.tsx or any app page.
// Self-contained: fetches existing links on mount, saves on submit.

import { useState, useEffect } from 'react'
import { useSocialLinks, SocialLinksData } from '@/hooks/useSocialLinks'

const FIELDS: { key: keyof SocialLinksData; label: string; placeholder: string }[] = [
  { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/in/yourname' },
  { key: 'whatsapp',  label: 'WhatsApp',  placeholder: 'https://wa.me/911234567890'       },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/handle'     },
  { key: 'twitter',   label: 'Twitter / X', placeholder: 'https://x.com/handle'           },
  { key: 'github',    label: 'GitHub',    placeholder: 'https://github.com/username'      },
  { key: 'website',   label: 'Website',   placeholder: 'https://yourwebsite.com'          },
  { key: 'portfolio', label: 'Portfolio', placeholder: 'https://portfolio.link'           },
]

export default function SocialLinksEditor() {
  const { data, loading, saving, saved, error, save } = useSocialLinks()
  const [form, setForm] = useState<SocialLinksData>({})

  // Sync fetched data into local form state
  useEffect(() => { if (!loading) setForm(data) }, [loading, data])

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6,
  }

  if (loading) {
    return <div style={{ padding: '20px 0', fontSize: 12, color: 'var(--muted)' }}>Loading social links…</div>
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
        Digital Card
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 20 }}>
        Social Links
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 20 }}>
        {FIELDS.map(f => (
          <div key={f.key}>
            <label style={labelStyle}>{f.label}</label>
            <input
              type="url"
              value={form[f.key] ?? ''}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#E05252', marginBottom: 12 }}>{error}</div>
      )}

      <button
        onClick={() => save(form)}
        disabled={saving}
        style={{
          background: 'var(--gold)', border: 'none', color: '#000',
          padding: '9px 22px', fontSize: 11, letterSpacing: '0.12em',
          textTransform: 'uppercase', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
          borderRadius: 'var(--radius)', opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Links'}
      </button>
    </div>
  )
}
