import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Brand Syndicate — AI Personal Branding Studio'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '60px 80px',
          background: '#09090A',
          position: 'relative',
        }}
      >
        {/* Top gold bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#C9A84C', display: 'flex' }} />
        {/* Bottom gold bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: '#C9A84C', display: 'flex' }} />
        {/* Border */}
        <div style={{
          position: 'absolute', top: 32, left: 32, right: 32, bottom: 32,
          border: '1px solid rgba(201,168,76,0.25)', display: 'flex',
        }} />

        {/* Logo mark */}
        <div style={{
          position: 'absolute', top: 60, left: 80,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 48, height: 48,
            border: '1.5px solid #C9A84C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#C9A84C', fontWeight: 400,
          }}>BS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 14, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#F8F4EE', fontWeight: 400 }}>
              BRAND SYNDICATE
            </div>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#C9A84C', textTransform: 'uppercase' }}>
              AI PERSONAL BRANDING STUDIO
            </div>
          </div>
        </div>

        {/* Main headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48 }}>
          <div style={{ fontSize: 68, fontWeight: 400, color: '#F8F4EE', lineHeight: 1.1 }}>
            Your Brand.
          </div>
          <div style={{ fontSize: 68, fontWeight: 400, color: '#C9A84C', lineHeight: 1.1 }}>
            Crafted by AI.
          </div>
        </div>

        {/* Features row */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 0 }}>
          {['Portfolio', 'Resume', 'Business Card', 'Pitch Deck'].map(f => (
            <div key={f} style={{
              fontSize: 13, color: 'rgba(248,244,238,0.5)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              {f}
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{
          position: 'absolute', bottom: 56, right: 80,
          fontSize: 13, color: 'rgba(201,168,76,0.5)', letterSpacing: '0.1em',
        }}>
          brandsyndicate.in
        </div>
      </div>
    ),
    { ...size }
  )
}
