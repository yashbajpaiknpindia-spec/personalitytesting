// src/components/AdUnit.tsx
// Reusable AdSense ad unit — place on public content pages (articles, guides, resources, about, blog)
// Requires NEXT_PUBLIC_ADSENSE_CLIENT env var set to your ca-pub-XXXXXXXXXXXXXXXX

'use client'

import { useEffect, useRef } from 'react'

interface AdUnitProps {
  slot: string                                        // Ad slot ID from AdSense dashboard
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  style?: React.CSSProperties
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export default function AdUnit({ slot, format = 'auto', style, className }: AdUnitProps) {
  const ref = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
    if (!client || client === 'ca-pub-XXXXXXXXXXXXXXXX') return

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch (e) {
      console.warn('AdSense push failed', e)
    }
  }, [])

  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  if (!client || client === 'ca-pub-XXXXXXXXXXXXXXXX') return null

  return (
    <div
      className={className}
      style={{
        display: 'block',
        textAlign: 'center',
        margin: '2rem auto',
        maxWidth: '100%',
        ...style,
      }}
    >
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
