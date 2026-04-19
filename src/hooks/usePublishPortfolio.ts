// src/hooks/usePublishPortfolio.ts

import { useState } from 'react'

interface PublishResult {
  slug: string
  url: string
  usernameUrl: string | null
}

interface UsePublishPortfolioReturn {
  publish: (generationId: string) => Promise<PublishResult>
  unpublish: () => Promise<void>
  loading: boolean
  error: string | null
  result: PublishResult | null
}

export function usePublishPortfolio(): UsePublishPortfolioReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PublishResult | null>(null)

  async function publish(generationId: string): Promise<PublishResult> {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/portfolio/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Publish failed')
      }
      const data: PublishResult = await res.json()
      setResult(data)
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Publish failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  async function unpublish(): Promise<void> {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/portfolio/publish', { method: 'DELETE' })
      if (!res.ok) throw new Error('Unpublish failed')
      setResult(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unpublish failed'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { publish, unpublish, loading, error, result }
}
