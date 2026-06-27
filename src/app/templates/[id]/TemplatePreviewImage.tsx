'use client'

import { useEffect, useState } from 'react'

export default function TemplatePreviewImage({
  src,
  fallbackSrc,
  alt,
  bg,
  color,
}: {
  src: string
  fallbackSrc: string
  alt: string
  bg: string
  color: string
}) {
  const [current, setCurrent] = useState(src || fallbackSrc)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setCurrent(src || fallbackSrc)
    setFailed(false)
  }, [src, fallbackSrc])

  if (failed) {
    return (
      <div style={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color, background: bg, fontFamily: "'DM Mono', monospace", letterSpacing: '0.18em', textTransform: 'uppercase', textAlign: 'center', padding: 24 }}>
        {alt}
      </div>
    )
  }

  return (
    <img
      src={current}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="eager"
      decoding="async"
      onError={(e) => {
        if (current !== fallbackSrc) {
          setCurrent(fallbackSrc)
          e.currentTarget.src = fallbackSrc
        } else {
          setFailed(true)
        }
      }}
      style={{ width: '100%', height: '100%', minHeight: 360, objectFit: 'cover', display: 'block' }}
    />
  )
}
