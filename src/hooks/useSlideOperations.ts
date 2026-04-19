'use client'
import { useState, useCallback } from 'react'
import type { Slide, SlideContent } from './usePresentation'

interface Ops {
  loading: boolean
  error: string | null
  addSlide: (presentationId: string, afterOrder?: number) => Promise<Slide | null>
  updateSlide: (slideId: string, content: SlideContent) => Promise<Slide | null>
  deleteSlide: (slideId: string) => Promise<boolean>
  duplicateSlide: (slideId: string) => Promise<Slide | null>
  reorderSlides: (presentationId: string, orderedIds: string[]) => Promise<Slide[] | null>
}

export function useSlideOperations(): Ops {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      setError((e as Error).message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const addSlide = useCallback(
    (presentationId: string, afterOrder?: number) =>
      run(async () => {
        const res = await fetch('/api/presentation/slide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ presentationId, afterOrder }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const d = await res.json()
        return d.slide as Slide
      }),
    [run],
  )

  const updateSlide = useCallback(
    (slideId: string, content: SlideContent) =>
      run(async () => {
        const res = await fetch(`/api/presentation/slide/${slideId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const d = await res.json()
        return d.slide as Slide
      }),
    [run],
  )

  const deleteSlide = useCallback(
    (slideId: string) =>
      run(async () => {
        const res = await fetch(`/api/presentation/slide/${slideId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return true
      }).then(v => v ?? false),
    [run],
  )

  const duplicateSlide = useCallback(
    (slideId: string) =>
      run(async () => {
        const res = await fetch('/api/presentation/slide/duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slideId }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const d = await res.json()
        return d.slide as Slide
      }),
    [run],
  )

  const reorderSlides = useCallback(
    (presentationId: string, orderedIds: string[]) =>
      run(async () => {
        const res = await fetch('/api/presentation/slide/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ presentationId, orderedIds }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const d = await res.json()
        return d.slides as Slide[]
      }),
    [run],
  )

  return { loading, error, addSlide, updateSlide, deleteSlide, duplicateSlide, reorderSlides }
}
