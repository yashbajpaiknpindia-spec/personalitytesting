// src/lib/portfolio/slug.ts

import { db } from '@/lib/db'

/** Turn a display name into a URL-safe slug */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48)
}

/** Generate a unique slug for a portfolio, with collision suffix */
export async function generatePortfolioSlug(name: string): Promise<string> {
  const base = toSlug(name) || 'portfolio'
  let candidate = base
  let attempt = 0

  while (true) {
    const existing = await db.portfolio.findUnique({ where: { slug: candidate } })
    if (!existing) return candidate
    attempt++
    candidate = `${base}-${attempt}`
  }
}
