// src/hooks/useDashboard.ts

import { useState, useEffect, useCallback } from 'react'

interface DashboardStats {
  totalViews: number
  portfolioViews: number
  cardViews: number
  totalLeads: number
  totalGenerations: number
  totalExports: number
}

interface PortfolioInfo {
  slug: string
  isPublished: boolean
  viewCount: number
  publishedAt: string
  url: string
}

interface RecentActivity {
  type: string
  createdAt: string
  metadata: Record<string, unknown> | null
}

interface RecentLead {
  name: string
  email: string
  company: string | null
  createdAt: string
}

interface DashboardOverview {
  stats: DashboardStats
  portfolio: PortfolioInfo | null
  recentActivity: RecentActivity[]
  recentLeads: RecentLead[]
}

export function useDashboardOverview() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/overview')
      if (!res.ok) throw new Error('Failed to load dashboard')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])
  return { data, loading, error, refresh }
}

// ── Leads hook ───────────────────────────────────────────────────────────

interface Contact {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  sourceSlug: string | null
  createdAt: string
}

interface LeadsResponse {
  contacts: Contact[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export function useLeads(page = 1) {
  const [data, setData] = useState<LeadsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/leads?page=${page}&limit=20`)
      if (!res.ok) throw new Error('Failed to load leads')
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { refresh() }, [refresh])
  return { data, loading, error, refresh }
}
