'use client'

import { useEffect, useRef } from 'react'

type Props = React.HTMLAttributes<HTMLDivElement> & {
  delay?: number
}

export default function MotionReveal({ delay = 0, children, style, ...props }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      el.style.filter = 'none'
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1), filter 0.7s cubic-bezier(0.16,1,0.3,1)'
            el.style.opacity = '1'
            el.style.transform = 'none'
            el.style.filter = 'none'
          }, delay * 1000)
          io.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '-80px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: 'translateY(26px)',
        filter: 'blur(8px)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
