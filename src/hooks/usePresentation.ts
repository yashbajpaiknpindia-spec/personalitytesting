'use client'
import { useState, useEffect, useCallback } from 'react'

export interface SlideContent {
  // Legacy shape (still used by some old slides)
  type?: 'hook' | 'content' | 'cta'
  // Rich shape (new generations)
  layoutType?: 'hero' | 'split-left' | 'split-right' | 'stats' | 'bullets' | 'quote' | 'grid' | 'title-only'
  heading?: string
  subheading?: string
  body?: string
  imageQuery?: string
  bullets?: string[]
  stats?: Array<{ value: string; label: string }>
  quote?: string
  attribution?: string
  cards?: Array<{ title: string; body: string }>
}

export interface Slide {
  id: string
  presentationId: string
  order: number
  content: SlideContent
  createdAt: string
  updatedAt: string
}

export interface Presentation {
  id: string
  userId: string
  title: string
  slug: string
  accentColor: string
  createdAt: string
  updatedAt: string
  slides: Slide[]
}

interface State {
  presentation: Presentation | null
  loading: boolean
  error: string | null
}

export function usePresentation(id: string | null) {
  const [state, setState] = useState<State>({
    presentation: null,
    loading: false,
    error: null,
  })

  const fetch_ = useCallback(async () => {
    if (!id) return
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch(`/api/presentation/${id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setState({ presentation: data.presentation, loading: false, error: null })
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: (e as Error).message }))
    }
  }, [id])

  useEffect(() => { fetch_() }, [fetch_])

  /** Replace presentation in local state (after optimistic updates) */
  const setPresentation = (p: Presentation | null) =>
    setState(s => ({ ...s, presentation: p }))

  return { ...state, refetch: fetch_, setPresentation }
}
