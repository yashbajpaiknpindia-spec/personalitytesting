'use client'
import { useState, CSSProperties, ReactNode } from 'react'

interface HoverCardProps {
  baseStyle?: CSSProperties
  hoverStyle?: CSSProperties
  children: ReactNode
  className?: string
}

export function HoverCard({ baseStyle = {}, hoverStyle = {}, children, className }: HoverCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ ...baseStyle, ...(hovered ? hoverStyle : {}) }}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  )
}

interface HoverArticleProps {
  baseStyle?: CSSProperties
  hoverStyle?: CSSProperties
  children: ReactNode
}

export function HoverArticle({ baseStyle = {}, hoverStyle = {}, children }: HoverArticleProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <article
      style={{ ...baseStyle, ...(hovered ? hoverStyle : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </article>
  )
}
