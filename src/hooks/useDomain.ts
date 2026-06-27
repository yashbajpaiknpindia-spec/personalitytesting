// src/hooks/useDomain.ts
// Connect, verify, and remove custom domains.

import { useState } from 'react'

export interface DomainInstructions {
  step1: string; step2: string; step3: string; step4: string; step5: string
  cname: { type: string; name: string; value: string; ttl: number }
  txt:   { type: string; name: string; value: string; ttl: number }
}

export interface DomainStatus {
  domain: string
  verified: boolean
  instructions?: DomainInstructions
}

export function useDomain() {
  const [status, setStatus]   = useState<DomainStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function connect(domain: string) {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/domain/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Connect failed')
      setStatus({ domain: data.domain, verified: data.verified, instructions: data.instructions })
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg); throw err
    } finally { setLoading(false) }
  }

  async function verify() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/domain/verify', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Verify failed')
      setStatus(s => s ? { ...s, verified: data.verified } : null)
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg); throw err
    } finally { setLoading(false) }
  }

  async function remove() {
    setLoading(true); setError(null)
    try {
      await fetch('/api/domain/connect', { method: 'DELETE' })
      setStatus(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally { setLoading(false) }
  }

  return { status, loading, error, connect, verify, remove }
}
