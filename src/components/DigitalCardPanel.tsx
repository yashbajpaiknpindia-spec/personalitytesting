'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface SocialLink {
  platform: string
  url: string
}

interface CardData {
  name: string
  title: string
  email: string
  phone: string
  website: string
  location: string
  tagline: string
  company: string
  photoUrl: string
  accentColor: string
  socialLinks: SocialLink[]
}

/* ── Platform metadata ─────────────────────────────── */
const PLATFORMS: Record<string, { icon: string; label: string; color: string }> = {
  linkedin:   { icon: 'in',   label: 'LinkedIn',   color: '#0A66C2' },
  twitter:    { icon: '𝕏',    label: 'Twitter',    color: '#1DA1F2' },
  instagram:  { icon: '⬡',    label: 'Instagram',  color: '#E1306C' },
  github:     { icon: '</>',  label: 'GitHub',     color: '#6e40c9' },
  youtube:    { icon: '▶',    label: 'YouTube',    color: '#FF0000' },
  behance:    { icon: 'Bē',   label: 'Behance',    color: '#1769FF' },
  dribbble:   { icon: '⬟',    label: 'Dribbble',   color: '#EA4C89' },
  tiktok:     { icon: '♪',    label: 'TikTok',     color: '#010101' },
  website:    { icon: '⌂',    label: 'Website',    color: '#888' },
}

/* ── SVG Icon components ──────────────────────────── */
function SocialIcon({ platform, size = 14 }: { platform: string; size?: number }) {
  const p = platform.toLowerCase()
  const meta = PLATFORMS[p]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.75, fontWeight: 700, letterSpacing: '-0.02em',
      fontFamily: p === 'linkedin' ? 'Georgia, serif' : "'DM Mono', monospace",
      lineHeight: 1,
    }}>
      {meta?.icon ?? '◉'}
    </span>
  )
}

/* ── Glassmorphism card shell ────────────────────── */
function CardShell({ accent, children, style }: {
  accent: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      position: 'relative',
      background: `linear-gradient(135deg, rgba(20,20,20,0.92) 0%, rgba(10,10,10,0.97) 100%)`,
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: `1px solid ${accent}35`,
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: `
        0 32px 80px rgba(0,0,0,0.7),
        0 0 0 1px ${accent}18,
        inset 0 1px 0 rgba(255,255,255,0.06)
      `,
      ...style,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${accent}14 0%, transparent 70%)`,
      }} />
      {/* Top shimmer line */}
      <div style={{
        position: 'absolute', top: 0, left: '10%', right: '10%', height: 1,
        background: `linear-gradient(90deg, transparent, ${accent}70, transparent)`,
        zIndex: 1,
      }} />
      {children}
    </div>
  )
}

/* ── Chip / pill ──────────────────────────────────── */
function Chip({ label, icon, accent }: { label: string; icon?: string; accent: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 30,
      background: `${accent}14`, border: `1px solid ${accent}35`,
      fontSize: 9.5, letterSpacing: '0.08em', color: accent,
      fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap',
    }}>
      {icon && <span style={{ fontSize: 9 }}>{icon}</span>}
      {label}
    </span>
  )
}

/* ── Contact row ──────────────────────────────────── */
function ContactRow({ icon, value, accent, href }: {
  icon: string; value: string; accent: string; href?: string
}) {
  const Inner = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{
        width: 20, textAlign: 'center', fontSize: 12,
        color: `${accent}80`,
      }}>{icon}</span>
      <span style={{
        fontSize: 11, color: '#C8BFB5', fontFamily: "'DM Mono', monospace",
        letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{value}</span>
    </div>
  )
  if (href) return <a href={href} style={{ textDecoration: 'none', display: 'block' }}>{Inner}</a>
  return <div>{Inner}</div>
}

export default function DigitalCardPanel({ accent = '#C9A84C' }: { accent?: string }) {
  const { data: session } = useSession()
  const [flipped, setFlipped] = useState(false)
  const [card, setCard] = useState<CardData>({
    name: '', title: '', email: '', phone: '',
    website: '', location: '', tagline: '', company: '',
    photoUrl: '', accentColor: accent, socialLinks: [],
  })
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [newPlatform, setNewPlatform] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [hovered, setHovered] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const mono = "'DM Mono', monospace"
  const serif = "'Playfair Display', serif"
  const sans = "'DM Sans', sans-serif"
  const ac = card.accentColor || accent

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setCard(prev => ({
          ...prev,
          name: data.name ?? session.user?.name ?? '',
          title: data.jobTitle ?? '',
          email: session.user?.email ?? '',
          website: data.website ?? '',
          location: data.location ?? '',
          company: data.company ?? '',
          tagline: data.tagline ?? '',
          photoUrl: data.image ?? session.user?.image ?? '',
          accentColor: data.accentColor ?? accent,
          socialLinks: data.socialLinks ?? [],
        }))
        if (data.username) {
          const portfolioUrl = `${window.location.origin}/p/${data.username}`
          const col = (data.accentColor ?? accent).replace('#', '')
          setQrSrc(
            `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(portfolioUrl)}&size=200x200&bgcolor=0A0A0A&color=${col}&format=svg&margin=2`
          )
        }
      })
      .catch(() => {})
  }, [session, accent])

  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET ?? 'brandsyndicate')
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      )
      if (res.ok) {
        const data = await res.json()
        setCard(prev => ({ ...prev, photoUrl: data.secure_url }))
        showToast('✓ Photo uploaded')
      } else showToast('✕ Upload failed')
    } catch { showToast('✕ Upload failed') }
    finally { setUploading(false) }
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: card.name, jobTitle: card.title,
          website: card.website, location: card.location,
          company: card.company, tagline: card.tagline,
          socialLinks: card.socialLinks,
        }),
      })
      if (res.ok) { showToast('✓ Card saved'); setEditMode(false) }
      else showToast('✕ Save failed')
    } catch { showToast('✕ Save failed') }
    finally { setSaving(false) }
  }

  function addSocialLink() {
    if (!newPlatform || !newUrl) return
    setCard(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: newPlatform, url: newUrl }],
    }))
    setNewPlatform(''); setNewUrl('')
  }

  function removeSocialLink(i: number) {
    setCard(prev => ({ ...prev, socialLinks: prev.socialLinks.filter((_, idx) => idx !== i) }))
  }

  function downloadQR() {
    if (!qrSrc) return
    const a = document.createElement('a'); a.href = qrSrc; a.download = 'qr-code.png'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', color: '#F0EAE0',
    fontFamily: sans, fontSize: 12, padding: '8px 11px',
    outline: 'none', borderRadius: 8, marginBottom: 10,
    transition: 'border-color 0.2s',
  }
  const lbl: React.CSSProperties = {
    fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)', fontFamily: mono, marginBottom: 5, display: 'block',
  }

  /* ─────────── CARD FACE — FRONT ─────────────────── */
  const CardFront = () => (
    <div style={{
      position: 'absolute', inset: 0,
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
    }}>
      <CardShell accent={ac} style={{ width: '100%', height: '100%' }}>
        {/* Mesh gradient background decoration */}
        <div style={{
          position: 'absolute', bottom: -60, right: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: `radial-gradient(circle, ${ac}20 0%, transparent 70%)`,
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', top: -30, left: -30,
          width: 140, height: 140, borderRadius: '50%',
          background: `radial-gradient(circle, ${ac}10 0%, transparent 70%)`,
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{
          position: 'relative', zIndex: 2,
          padding: '22px 24px 18px',
          display: 'flex', flexDirection: 'column',
          height: '100%', boxSizing: 'border-box',
          justifyContent: 'space-between',
        }}>
          {/* TOP ROW: Identity + Photo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Company badge */}
              {card.company && (
                <div style={{
                  fontSize: 8.5, letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: `${ac}90`, fontFamily: mono, marginBottom: 6,
                }}>
                  {card.company}
                </div>
              )}
              {/* Name */}
              <div style={{
                fontFamily: serif, fontSize: 'clamp(16px, 4vw, 22px)',
                color: '#F8F4EE', lineHeight: 1.15, fontWeight: 400,
                marginBottom: 4,
              }}>
                {card.name || 'Your Name'}
              </div>
              {/* Title with accent dot */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: ac, fontFamily: mono,
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: ac, flexShrink: 0 }} />
                {card.title || 'Your Title'}
              </div>
            </div>

            {/* Profile photo */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {/* Animated ring */}
              <div style={{
                position: 'absolute', inset: -3,
                borderRadius: '50%',
                border: `2px solid ${ac}50`,
                animation: 'cardRingPulse 3s ease-in-out infinite',
              }} />
              <div style={{
                width: 54, height: 54, borderRadius: '50%',
                border: `2px solid ${ac}70`,
                overflow: 'hidden',
                background: `linear-gradient(135deg, #1a1a1a, #111)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {card.photoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={card.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 22, opacity: 0.2, color: ac }}>◌</span>
                }
              </div>
            </div>
          </div>

          {/* MIDDLE: Social icons strip */}
          {card.socialLinks.length > 0 && (
            <div style={{
              display: 'flex', gap: 6, flexWrap: 'wrap',
              padding: '10px 0',
            }}>
              {card.socialLinks.slice(0, 6).map((sl, i) => {
                const meta = PLATFORMS[sl.platform.toLowerCase()]
                return (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: `${ac}14`,
                    border: `1px solid ${ac}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s, transform 0.2s',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = `${ac}28`
                      ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = `${ac}14`
                      ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                    }}
                    title={meta?.label ?? sl.platform}
                  >
                    <span style={{ fontSize: 10, color: ac, fontFamily: mono, fontWeight: 700 }}>
                      {meta?.icon ?? '◉'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* BOTTOM ROW */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              {/* Tagline */}
              {card.tagline && (
                <div style={{
                  fontSize: 9.5, color: 'rgba(255,255,255,0.4)',
                  fontFamily: mono, letterSpacing: '0.04em',
                  maxWidth: 180, lineHeight: 1.4, marginBottom: 4,
                }}>
                  {card.tagline}
                </div>
              )}
              {/* Email mini */}
              {card.email && !card.tagline && (
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: mono }}>
                  {card.email}
                </div>
              )}
            </div>
            {/* Mini QR + flip hint */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              {qrSrc && (
                <div style={{
                  width: 36, height: 36, borderRadius: 6,
                  overflow: 'hidden', border: `1px solid ${ac}30`,
                  opacity: 0.7,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrSrc} alt="QR" style={{ width: '100%', height: '100%' }} />
                </div>
              )}
              <div style={{
                fontSize: 7.5, color: `${ac}55`, letterSpacing: '0.1em',
                fontFamily: mono, textTransform: 'uppercase',
              }}>
                flip ↻
              </div>
            </div>
          </div>
        </div>
      </CardShell>
    </div>
  )

  /* ─────────── CARD FACE — BACK ───────────────────── */
  const CardBack = () => (
    <div style={{
      position: 'absolute', inset: 0,
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      transform: 'rotateY(180deg)',
    }}>
      <CardShell accent={ac} style={{ width: '100%', height: '100%' }}>
        {/* Decorative corner */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 120, height: 120, borderRadius: '50%',
          border: `1px solid ${ac}20`,
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{
          position: 'relative', zIndex: 2,
          padding: '18px 20px',
          display: 'flex', gap: 16,
          height: '100%', boxSizing: 'border-box',
        }}>
          {/* LEFT: QR code */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Name + title on back */}
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ fontFamily: serif, fontSize: 12, color: '#F8F4EE', lineHeight: 1.2 }}>
                {card.name || 'Your Name'}
              </div>
              <div style={{ fontSize: 7.5, color: ac, fontFamily: mono, letterSpacing: '0.12em', marginTop: 2 }}>
                {card.title}
              </div>
            </div>

            {/* QR */}
            <div style={{
              width: 90, height: 90,
              background: '#fff',
              borderRadius: 10,
              overflow: 'hidden', padding: 5,
              border: `2px solid ${ac}40`,
              boxShadow: `0 0 16px ${ac}20`,
            }}>
              {qrSrc
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={qrSrc} alt="QR Code" style={{ width: '100%', height: '100%', display: 'block' }} />
                : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: '#999', textAlign: 'center', lineHeight: 1.4,
                  }}>
                    Set username<br />to generate
                  </div>
                )
              }
            </div>
            <div style={{ fontSize: 7, color: `${ac}70`, fontFamily: mono, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              scan to connect
            </div>
          </div>

          {/* RIGHT: Contact + Social */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            {/* Contact details */}
            <div>
              <div style={{ fontSize: 8, color: `${ac}80`, fontFamily: mono, letterSpacing: '0.16em', marginBottom: 8, textTransform: 'uppercase' }}>
                Contact
              </div>
              {card.email    && <ContactRow icon="✉" value={card.email} accent={ac} href={`mailto:${card.email}`} />}
              {card.phone    && <ContactRow icon="✆" value={card.phone} accent={ac} href={`tel:${card.phone}`} />}
              {card.website  && <ContactRow icon="⌂" value={card.website.replace(/^https?:\/\//, '')} accent={ac} href={card.website} />}
              {card.location && <ContactRow icon="◎" value={card.location} accent={ac} />}
            </div>

            {/* Social links */}
            {card.socialLinks.length > 0 && (
              <div>
                <div style={{ fontSize: 8, color: `${ac}80`, fontFamily: mono, letterSpacing: '0.16em', marginBottom: 6, marginTop: 8, textTransform: 'uppercase' }}>
                  Connect
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {card.socialLinks.slice(0, 5).map((sl, i) => {
                    const meta = PLATFORMS[sl.platform.toLowerCase()]
                    return (
                      <a key={i} href={sl.url} target="_blank" rel="noopener noreferrer"
                        style={{ textDecoration: 'none' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '3px 7px', borderRadius: 20,
                          background: `${ac}12`, border: `1px solid ${ac}30`,
                          fontSize: 8.5, color: ac, fontFamily: mono,
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}>
                          <span style={{ fontSize: 9 }}>{meta?.icon ?? '◉'}</span>
                          {meta?.label ?? sl.platform}
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom accent line */}
        <div style={{
          position: 'absolute', bottom: 0, left: '5%', right: '5%', height: 1,
          background: `linear-gradient(90deg, transparent, ${ac}60, transparent)`,
        }} />
      </CardShell>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes cardRingPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.06); }
        }
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bs_spin { to { transform: rotate(360deg); } }
        .card-panel-input:focus {
          border-color: ${ac}70 !important;
          box-shadow: 0 0 0 2px ${ac}15 !important;
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#141414', border: `1px solid ${ac}50`,
          borderRadius: 10, padding: '10px 18px',
          fontSize: 12, color: '#F0EAE0', fontFamily: mono,
          boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${ac}20`,
          animation: 'cardEntrance 0.3s ease',
        }}>
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: ac, fontFamily: mono, marginBottom: 4 }}>
            Digital Business Card
          </div>
          <div style={{ fontFamily: serif, fontSize: 22, color: '#F0EAE0' }}>
            Your Card
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setEditMode(e => !e)}
            style={{
              background: editMode ? ac : 'transparent',
              color: editMode ? '#000' : ac,
              border: `1px solid ${ac}50`,
              padding: '7px 16px', fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: 'pointer', borderRadius: 8,
              fontFamily: mono, transition: 'all 0.2s',
            }}
          >
            {editMode ? '✓ Done' : '✎ Edit'}
          </button>
          {editMode && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: ac, color: '#000', border: 'none',
                padding: '7px 16px', fontSize: 10, letterSpacing: '0.1em',
                textTransform: 'uppercase', cursor: saving ? 'default' : 'pointer',
                borderRadius: 8, fontFamily: mono, fontWeight: 600,
                opacity: saving ? 0.7 : 1, transition: 'all 0.2s',
              }}
            >
              {saving ? '…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* ── 3D Flip Card ── */}
      <div style={{
        perspective: '1200px', perspectiveOrigin: 'center',
        width: '100%', maxWidth: 420, margin: '0 auto 32px',
        animation: 'cardEntrance 0.5s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div
          style={{
            width: '100%', aspectRatio: '1.75 / 1',
            position: 'relative',
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
            transition: 'transform 0.7s cubic-bezier(0.4,0.2,0.2,1)',
            WebkitTransition: 'transform 0.7s cubic-bezier(0.4,0.2,0.2,1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            WebkitTransform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            cursor: 'pointer',
          }}
          onClick={() => setFlipped(f => !f)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Hover lift effect */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: -1,
            borderRadius: 20,
            boxShadow: hovered
              ? `0 40px 100px rgba(0,0,0,0.8), 0 0 40px ${ac}20`
              : `0 20px 60px rgba(0,0,0,0.5)`,
            transition: 'box-shadow 0.4s ease',
          }} />

          <CardFront />
          <CardBack />
        </div>

        {/* Flip indicator dots */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12,
        }}>
          <div
            onClick={() => setFlipped(false)}
            style={{
              width: flipped ? 8 : 20, height: 6, borderRadius: 3,
              background: flipped ? `${ac}40` : ac,
              cursor: 'pointer', transition: 'all 0.3s ease',
            }}
          />
          <div
            onClick={() => setFlipped(true)}
            style={{
              width: flipped ? 20 : 8, height: 6, borderRadius: 3,
              background: flipped ? ac : `${ac}40`,
              cursor: 'pointer', transition: 'all 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* ── Edit form ── */}
      {editMode && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: 24, marginBottom: 24,
          animation: 'cardEntrance 0.3s ease',
        }}>
          <div style={{ fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: ac, fontFamily: mono, marginBottom: 20 }}>
            Edit Card Details
          </div>

          {/* Photo upload */}
          <div style={{ marginBottom: 22 }}>
            <label style={lbl}>Profile Photo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Photo preview with upload overlay */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  position: 'relative', width: 64, height: 64, borderRadius: '50%',
                  border: `2px solid ${ac}50`, overflow: 'hidden',
                  background: '#1a1a1a', flexShrink: 0,
                  cursor: uploading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = ac }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = `${ac}50` }}
              >
                {card.photoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={card.photoUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 26, opacity: 0.2, color: ac }}>◌</span>
                }
                {/* Upload overlay on hover */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.55)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                  fontSize: 10, color: '#fff', fontFamily: mono,
                  letterSpacing: '0.06em',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0' }}
                >
                  {uploading
                    ? <div style={{ width: 16, height: 16, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: '#fff', borderRadius: '50%', animation: 'bs_spin 0.8s linear infinite' }} />
                    : '↑'}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  style={{
                    background: 'transparent', border: `1px solid ${ac}50`,
                    color: ac, padding: '7px 14px', fontSize: 10,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: uploading ? 'wait' : 'pointer',
                    borderRadius: 8, fontFamily: mono, opacity: uploading ? 0.6 : 1,
                    marginBottom: 6, transition: 'all 0.2s',
                  }}
                >
                  {uploading ? '↑ Uploading…' : '↑ Upload Photo'}
                </button>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', fontFamily: mono }}>
                  JPG, PNG, WEBP — appears on card & portfolio
                </div>
              </div>
            </div>
            <input
              ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = '' }}
            />
          </div>

          {/* Fields grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {[
              { lbl: 'Full Name', val: card.name, key: 'name', ph: 'Your Name' },
              { lbl: 'Title / Role', val: card.title, key: 'title', ph: 'Product Designer' },
              { lbl: 'Company', val: card.company, key: 'company', ph: 'Acme Inc.' },
              { lbl: 'Email', val: card.email, key: 'email', ph: 'you@example.com' },
              { lbl: 'Phone', val: card.phone, key: 'phone', ph: '+91 98765 43210' },
              { lbl: 'Website', val: card.website, key: 'website', ph: 'https://yoursite.com' },
              { lbl: 'Location', val: card.location, key: 'location', ph: 'City, Country' },
            ].map(f => (
              <div key={f.key} style={{ gridColumn: ['name', 'title'].includes(f.key) ? undefined : undefined }}>
                <label style={lbl}>{f.lbl}</label>
                <input
                  className="card-panel-input"
                  value={f.val}
                  onChange={e => setCard(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.ph}
                  style={fieldStyle}
                  type={f.key === 'email' ? 'email' : f.key === 'phone' ? 'tel' : 'text'}
                />
              </div>
            ))}
          </div>
          <div>
            <label style={lbl}>Tagline (front of card)</label>
            <input
              className="card-panel-input"
              value={card.tagline}
              onChange={e => setCard(p => ({ ...p, tagline: e.target.value }))}
              placeholder="Building the future of…"
              style={{ ...fieldStyle, marginBottom: 0 }}
            />
          </div>

          {/* Social Links Editor */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: ac, fontFamily: mono, marginBottom: 12 }}>
              Social Links
            </div>

            {/* Existing links */}
            {card.socialLinks.map((sl, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: `${ac}14`, border: `1px solid ${ac}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <SocialIcon platform={sl.platform} size={13} />
                </div>
                <div style={{
                  flex: 1, background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 7, padding: '5px 10px',
                  fontSize: 11, color: '#C0B8B0', fontFamily: mono,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  <span style={{ color: ac, marginRight: 4 }}>{sl.platform}</span>
                  {sl.url}
                </div>
                <button
                  onClick={() => removeSocialLink(i)}
                  style={{
                    background: 'transparent', border: '1px solid rgba(192,57,43,0.3)',
                    color: '#c0392b', width: 28, height: 28, borderRadius: 7,
                    fontSize: 12, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Add new link */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <select
                value={newPlatform}
                onChange={e => setNewPlatform(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: newPlatform ? '#F0EAE0' : 'rgba(255,255,255,0.3)',
                  fontFamily: mono, fontSize: 11, padding: '7px 10px',
                  borderRadius: 8, outline: 'none', cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <option value="" disabled>Platform</option>
                {Object.entries(PLATFORMS).map(([key, meta]) => (
                  <option key={key} value={key}>{meta.label}</option>
                ))}
              </select>
              <input
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={e => e.key === 'Enter' && addSocialLink()}
                style={{ ...fieldStyle, marginBottom: 0, flex: 1 }}
              />
              <button
                onClick={addSocialLink}
                disabled={!newPlatform || !newUrl}
                style={{
                  background: ac, color: '#000', border: 'none',
                  padding: '7px 14px', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', borderRadius: 8, fontFamily: mono,
                  opacity: !newPlatform || !newUrl ? 0.4 : 1,
                  flexShrink: 0,
                }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── QR Code section ── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: 22, marginBottom: 18,
      }}>
        <div style={{ fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: ac, fontFamily: mono, marginBottom: 4 }}>
          QR Code
        </div>
        <div style={{ fontFamily: serif, fontSize: 17, color: '#F0EAE0', marginBottom: 16 }}>
          Share Your Card
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {qrSrc ? (
            <div style={{
              width: 120, height: 120, background: '#fff',
              borderRadius: 12, overflow: 'hidden', padding: 6, flexShrink: 0,
              border: `2px solid ${ac}40`,
              boxShadow: `0 0 24px ${ac}18`,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="QR Code" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
          ) : (
            <div style={{
              width: 120, height: 120, background: 'rgba(255,255,255,0.03)',
              border: `1.5px dashed ${ac}30`, borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9.5, color: 'rgba(255,255,255,0.25)', textAlign: 'center',
              lineHeight: 1.5, padding: 10, flexShrink: 0, fontFamily: mono,
            }}>
              Set username to generate QR
            </div>
          )}
          <div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 14 }}>
              Scan to open your portfolio instantly. Perfect for events, email signatures, or printed cards.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={downloadQR}
                disabled={!qrSrc}
                style={{
                  background: ac, border: 'none', color: '#000',
                  padding: '8px 18px', fontSize: 10, letterSpacing: '0.12em',
                  textTransform: 'uppercase', fontWeight: 600,
                  cursor: qrSrc ? 'pointer' : 'not-allowed',
                  borderRadius: 8, fontFamily: mono, opacity: qrSrc ? 1 : 0.35,
                  transition: 'opacity 0.2s',
                }}
              >
                ↓ Download
              </button>
              <a
                href="/api/card/wallet-pass"
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.5)', padding: '8px 18px', fontSize: 10,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  textDecoration: 'none', borderRadius: 8,
                  fontFamily: mono, display: 'inline-block',
                  transition: 'border-color 0.2s',
                }}
              >
                ⊕ Wallet Pass
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Social platforms preview ── */}
      {card.socialLinks.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: 20, marginBottom: 18,
        }}>
          <div style={{ fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: ac, fontFamily: mono, marginBottom: 14 }}>
            Your Networks
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {card.socialLinks.map((sl, i) => {
              const meta = PLATFORMS[sl.platform.toLowerCase()]
              return (
                <a key={i} href={sl.url} target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 14px', borderRadius: 10,
                    background: `${ac}0F`, border: `1px solid ${ac}28`,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = `${ac}1E`
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = `${ac}0F`
                      ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                    }}
                  >
                    <span style={{ fontSize: 12, color: ac, fontFamily: mono, fontWeight: 700 }}>
                      {meta?.icon ?? '◉'}
                    </span>
                    <span style={{ fontSize: 11, color: '#C0B8B0', fontFamily: mono, letterSpacing: '0.04em' }}>
                      {meta?.label ?? sl.platform}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* ── vCard download ── */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#F0EAE0', marginBottom: 2, fontFamily: sans }}>
            Export as vCard (.vcf)
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: mono }}>
            One-tap save to any contacts app
          </div>
        </div>
        <a
          href="/api/export/vcard"
          style={{
            background: 'transparent', border: `1px solid ${ac}50`,
            color: ac, padding: '8px 18px', fontSize: 10,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            textDecoration: 'none', borderRadius: 8, fontFamily: mono,
            transition: 'all 0.2s', display: 'inline-block',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${ac}14` }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          ↓ Download .vcf
        </a>
      </div>

      {/* Chip summary */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
        {card.email    && <Chip label={card.email} icon="✉" accent={ac} />}
        {card.phone    && <Chip label={card.phone} icon="✆" accent={ac} />}
        {card.location && <Chip label={card.location} icon="◎" accent={ac} />}
      </div>
    </>
  )
}
