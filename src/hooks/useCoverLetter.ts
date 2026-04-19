'use client'

import { useState, useCallback } from 'react'
import type { ResumeData } from './useTailorResume'

export type CoverLetterTone = 'professional' | 'casual' | 'executive' | 'creative'

export interface CoverLetterResult {
  coverLetter: string
  versionId: string
}

export function useCoverLetter() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [result, setResult]   = useState<CoverLetterResult | null>(null)

  const generate = useCallback(async (
    resumeData: ResumeData,
    jobDescription: string,
    tone: CoverLetterTone = 'professional',
    versionId?: string,
  ): Promise<CoverLetterResult | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/resume/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, jobDescription, tone, versionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setResult(data as CoverLetterResult)
      return data as CoverLetterResult
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { generate, loading, error, result, reset }
}
