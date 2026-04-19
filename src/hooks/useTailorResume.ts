'use client'

import { useState, useCallback } from 'react'

export interface ResumeData {
  name?: string
  headline?: string
  bio?: string
  skills?: string[]
  resumeBullets?: string[]
  experience?: Array<{ title: string; company: string; duration: string; bullets: string[] }>
  education?: Array<{ degree: string; institution: string; year: string }>
  [key: string]: unknown
}

export interface TailorResult {
  versionId: string
  tailoredResume: ResumeData
  changes: string[]
}

export function useTailorResume() {
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [result, setResult]     = useState<TailorResult | null>(null)

  const tailor = useCallback(async (
    resumeData: ResumeData,
    jobDescription: string,
  ): Promise<TailorResult | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, jobDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Tailoring failed')
      setResult(data as TailorResult)
      return data as TailorResult
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tailoring failed'
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

  return { tailor, loading, error, result, reset }
}
