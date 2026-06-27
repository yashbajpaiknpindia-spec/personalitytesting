// src/lib/geo.ts
// Best-effort approximate location helpers. Never blocks core user flows.

import { db } from '@/lib/db'

function cleanHeaderValue(value: string | null): string | null {
  if (!value) return null
  try {
    return decodeURIComponent(value).replace(/\+/g, ' ').trim() || null
  } catch {
    return value.trim() || null
  }
}

function isPrivateIp(ip: string): boolean {
  const v = ip.trim().replace(/^::ffff:/, '')
  if (!v || v === '127.0.0.1' || v === '::1' || v === 'localhost') return true
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(v)
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('true-client-ip'),
    headers.get('x-render-client-ip'),
    headers.get('fly-client-ip'),
    headers.get('fastly-client-ip'),
    headers.get('x-real-ip'),
    headers.get('x-client-ip'),
    headers.get('x-cluster-client-ip'),
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    headers.get('x-original-forwarded-for')?.split(',')[0]?.trim() ?? null,
    headers.get('x-envoy-external-address'),
    headers.get('forwarded')?.match(/for="?([^;,\s"]+)/i)?.[1] ?? null,
  ]
  for (const ip of candidates) {
    const cleaned = cleanHeaderValue(ip)?.replace(/^"|"$/g, '')
    if (cleaned && !isPrivateIp(cleaned)) return cleaned
  }
  return null
}

export function locationFromEdgeHeaders(headers: Headers): string | null {
  const city = cleanHeaderValue(
    headers.get('x-vercel-ip-city') ||
    headers.get('cf-ipcity') ||
    headers.get('x-appengine-city') ||
    headers.get('x-geo-city') ||
    headers.get('x-client-city')
  )
  const region = cleanHeaderValue(
    headers.get('x-vercel-ip-country-region') ||
    headers.get('cf-region') ||
    headers.get('x-appengine-region') ||
    headers.get('x-geo-region') ||
    headers.get('x-client-region')
  )
  const country = cleanHeaderValue(
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    headers.get('x-appengine-country') ||
    headers.get('x-geo-country') ||
    headers.get('x-client-country')
  )

  if (city && region) return `${city}, ${region}`
  if (city && country) return `${city}, ${country}`
  return city || region || country || null
}

export async function lookupLocationFromIp(ip: string | null): Promise<string | null> {
  if (!ip || isPrivateIp(ip)) return null
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      headers: { 'User-Agent': 'BrandSyndicate/1.0' },
      signal: AbortSignal.timeout(3500),
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json() as { city?: string; region?: string; region_code?: string; country_name?: string; error?: boolean }
      if (!data.error) {
        const city = data.city?.trim()
        const region = (data.region || data.region_code)?.trim()
        const country = data.country_name?.trim()
        if (city && region) return `${city}, ${region}`
        if (city && country) return `${city}, ${country}`
        return city || region || country || null
      }
    }
  } catch {
    // fall through to ip-api fallback
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,city,regionName,country`, {
      signal: AbortSignal.timeout(3500),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json() as { status: string; city?: string; regionName?: string; country?: string }
    if (data.status !== 'success') return null
    const city = data.city?.trim()
    const region = data.regionName?.trim()
    const country = data.country?.trim()
    if (city && region) return `${city}, ${region}`
    if (city && country) return `${city}, ${country}`
    return city || region || country || null
  } catch {
    return null
  }
}

export async function resolveApproxLocation(req: Request): Promise<string | null> {
  return locationFromEdgeHeaders(req.headers) || await lookupLocationFromIp(clientIpFromHeaders(req.headers))
}

export async function updateUserLastLocation(userId: string, req: Request, opts: { force?: boolean } = {}): Promise<string | null> {
  try {
    const headerLocation = locationFromEdgeHeaders(req.headers)
    if (headerLocation) {
      await db.user.update({ where: { id: userId }, data: { location: headerLocation } })
      return headerLocation
    }

    if (!opts.force) {
      const existing = await db.user.findUnique({ where: { id: userId }, select: { location: true } })
      const current = existing?.location?.trim()
      const vague = !current || ['unknown', 'india', 'in'].includes(current.toLowerCase()) || !current.includes(',')
      if (current && !vague) return current
    }

    const location = await lookupLocationFromIp(clientIpFromHeaders(req.headers))
    if (location) await db.user.update({ where: { id: userId }, data: { location } })
    return location
  } catch {
    return null
  }
}
