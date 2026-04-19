'use client'
import { useState } from 'react'
import type { Presentation } from './usePresentation'

interface UpdatePayload {
  title?: string
  accentColor?: string
}

export function useUpdatePresentation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = async (
    id: string,
    payload: UpdatePayload,
  ): Promise<Presentation | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/presentation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return data.presentation as Presentation
    } catch (e) {
      setError((e as Error).message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { update, loading, error }
}
