'use client'
// src/components/QRCodePanel.tsx

import { useQRCodeUrl } from '@/hooks/useQR'

export default function QRCodePanel() {
  const { qrSrc, loading, error } = useQRCodeUrl()

  function download() {
    if (!qrSrc) return
    const a = document.createElement('a')
    a.href = qrSrc
    a.download = 'qr-code.png'
    // BUG FIX: Append to DOM before clicking for mobile browser compatibility
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
        Wallet / QR Mode
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 20 }}>
        Your QR Code
      </div>

      {loading && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Generating QR…</div>}
      {error   && <div style={{ fontSize: 12, color: '#E05252'     }}>{error}</div>}

      {qrSrc && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR Code" width={160} height={160} style={{ border: '1px solid var(--border2)', borderRadius: 4 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={download}
              style={{
                background: 'var(--gold)', border: 'none', color: '#000',
                padding: '8px 18px', fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase', fontWeight: 500, cursor: 'pointer',
                borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace",
              }}
            >
              Download PNG
            </button>
            <a
              href="/api/card/wallet-pass"
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--muted)', padding: '8px 18px', fontSize: 10,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                textDecoration: 'none', borderRadius: 'var(--radius)',
                fontFamily: "'DM Mono', monospace", display: 'inline-block',
              }}
            >
              Apple Wallet
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
