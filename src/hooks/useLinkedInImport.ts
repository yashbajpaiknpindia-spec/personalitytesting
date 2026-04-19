'use client'

import { useState, useCallback } from 'react'
import type { ResumeData } from './useTailorResume'

export interface LinkedInImportResult {
  resumeData: ResumeData
  rawTextLength: number
}

export function useLinkedInImport() {
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [result, setResult]         = useState<LinkedInImportResult | null>(null)
  const [progress, setProgress]     = useState<string>('')

  const importPDF = useCallback(async (
    file: File,
  ): Promise<LinkedInImportResult | null> => {
    setLoading(true)
    setError(null)
    setProgress('Uploading PDF…')
    try {
      const formData = new FormData()
      formData.append('file', file)

      setProgress('Extracting text…')
      const res = await fetch('/api/resume/import-linkedin', {
        method: 'POST',
        body: formData,
      })

      setProgress('Parsing profile with AI…')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')

      setResult(data as LinkedInImportResult)
      setProgress('Done!')
      return data as LinkedInImportResult
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed'
      setError(msg)
      setProgress('')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setProgress('')
  }, [])

  return { importPDF, loading, error, result, progress, reset }
}
