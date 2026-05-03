'use client'

import { useState, useCallback } from 'react'
import type { ResumeData } from './useTailorResume'

export interface ATSBreakdown {
  keywordMatch: number
  readability: number
  formatting: number
  skillsCoverage: number
}

export interface ATSScoreResult {
  score: number
  breakdown: ATSBreakdown
  suggestions: string[]
}

export function useATSScore() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [result, setResult]   = useState<ATSScoreResult | null>(null)

  const analyze = useCallback(async (
    resumeData: ResumeData,
    jobDescription?: string,
  ): Promise<ATSScoreResult | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/resume/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, jobDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scoring failed')
      setResult(data as ATSScoreResult)
      return data as ATSScoreResult
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scoring failed'
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

  return { analyze, loading, error, result, reset }
}
