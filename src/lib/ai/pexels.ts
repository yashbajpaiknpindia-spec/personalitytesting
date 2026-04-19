const cache = new Map<string, { url: string; expiresAt: number }>()

export async function fetchPexelsImage(query: string): Promise<string | null> {
  const cached = cache.get(query)
  if (cached && Date.now() < cached.expiresAt) return cached.url

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY! } }
    )
    const data = await res.json() as { photos?: Array<{ src: { large: string; large2x: string } }> }
    const url = data.photos?.[0]?.src?.large2x || data.photos?.[0]?.src?.large || null
    if (url) {
      cache.set(query, { url, expiresAt: Date.now() + 3600000 })
    }
    return url
  } catch {
    return null
  }
}
