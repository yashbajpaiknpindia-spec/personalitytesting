// src/hooks/useSocialLinks.ts
// Fetch and update the authenticated user's social links.

import { useState, useEffect, useCallback } from 'react'

export interface SocialLinksData {
  linkedin?:  string | null
  whatsapp?:  string | null
  instagram?: string | null
  website?:   string | null
  portfolio?: string | null
  twitter?:   string | null
  github?:    string | null
}

export function useSocialLinks() {
  const [data, setData]       = useState<SocialLinksData>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [saved, setSaved]     = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/card/social-links')
      if (!res.ok) throw new Error('Failed to load social links')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function save(links: SocialLinksData) {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/card/social-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(links),
      })
      if (!res.ok) throw new Error('Failed to save social links')
      const { links: updated } = await res.json()
      setData(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return { data, loading, saving, saved, error, save, refresh: fetch_ }
}
