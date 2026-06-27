// src/lib/ai/pexels.ts
// Pexels image fetching for website generation only.
// Called POST-STREAM — zero token cost, zero impact on Claude output size.

const PEXELS_API = 'https://api.pexels.com/v1/search'

export interface PexelsSlot {
  placeholder: string   // token in HTML e.g. PEXELS_HERO
  query: string         // search term
  orientation?: 'landscape' | 'portrait' | 'square'
  size?: 'large' | 'large2x' | 'medium' | 'small'
}

export interface PexelsResult {
  placeholder: string
  url: string | null
  photographer: string
  photographerUrl: string
}

// Per-sector slot definitions — what images to fetch and what to search for
export const SECTOR_SLOTS: Record<string, PexelsSlot[]> = {
  'Technology': [
    { placeholder: 'PEXELS_HERO',      query: 'modern technology office workspace',    orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'software development team collaboration', orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'data center server technology',           orientation: 'landscape', size: 'large' },
  ],
  'Food & Beverage': [
    { placeholder: 'PEXELS_HERO',      query: 'atmospheric restaurant food photography',  orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'gourmet food dish plating',                orientation: 'square',    size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'chef cooking kitchen',                     orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_GALLERY_1', query: 'coffee cafe interior',                     orientation: 'square',    size: 'medium' },
    { placeholder: 'PEXELS_GALLERY_2', query: 'fresh ingredients vegetables',              orientation: 'square',    size: 'medium' },
    { placeholder: 'PEXELS_GALLERY_3', query: 'dessert pastry bakery',                    orientation: 'square',    size: 'medium' },
  ],
  'Health & Wellness': [
    { placeholder: 'PEXELS_HERO',      query: 'wellness spa meditation calm',            orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'yoga fitness healthy lifestyle',          orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'healthy food nutrition',                  orientation: 'landscape', size: 'large' },
  ],
  'Fashion & Lifestyle': [
    { placeholder: 'PEXELS_HERO',      query: 'fashion editorial model studio',          orientation: 'portrait',  size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'luxury fashion clothing detail',          orientation: 'square',    size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'lifestyle minimal aesthetic',             orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_GALLERY_1', query: 'fashion accessories jewelry',             orientation: 'square',    size: 'medium' },
    { placeholder: 'PEXELS_GALLERY_2', query: 'clothing textile fabric texture',         orientation: 'square',    size: 'medium' },
    { placeholder: 'PEXELS_GALLERY_3', query: 'fashion model portrait editorial',        orientation: 'portrait',  size: 'medium' },
  ],
  'Finance': [
    { placeholder: 'PEXELS_HERO',      query: 'modern financial district city skyline',  orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'business meeting boardroom professional', orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'financial charts data analysis',          orientation: 'landscape', size: 'large' },
  ],
  'Real Estate': [
    { placeholder: 'PEXELS_HERO',      query: 'luxury modern house architecture',        orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'modern interior living room design',      orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'apartment building exterior architecture',orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_GALLERY_1', query: 'kitchen modern interior',                 orientation: 'square',    size: 'medium' },
    { placeholder: 'PEXELS_GALLERY_2', query: 'bedroom luxury interior',                 orientation: 'square',    size: 'medium' },
    { placeholder: 'PEXELS_GALLERY_3', query: 'swimming pool outdoor luxury home',       orientation: 'square',    size: 'medium' },
  ],
  'Legal & Professional': [
    { placeholder: 'PEXELS_HERO',      query: 'law firm professional office building',   orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'lawyer professional business meeting',    orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'legal books courthouse justice',          orientation: 'landscape', size: 'large' },
  ],
  'Creative & Media': [
    { placeholder: 'PEXELS_HERO',      query: 'creative studio design workspace',        orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'photography camera creative',             orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'art design creative portfolio',           orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_GALLERY_1', query: 'graphic design illustration',             orientation: 'square',    size: 'medium' },
    { placeholder: 'PEXELS_GALLERY_2', query: 'video production film making',            orientation: 'square',    size: 'medium' },
    { placeholder: 'PEXELS_GALLERY_3', query: 'music recording studio audio',            orientation: 'square',    size: 'medium' },
  ],
  'Education': [
    { placeholder: 'PEXELS_HERO',      query: 'university campus students learning',     orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'classroom education teaching',            orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'library books knowledge study',           orientation: 'landscape', size: 'large' },
  ],
  'Travel & Hospitality': [
    { placeholder: 'PEXELS_HERO',      query: 'luxury hotel resort destination travel',  orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'hotel room interior luxury',              orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'travel destination landscape scenic',     orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_GALLERY_1', query: 'swimming pool resort tropical',           orientation: 'square',    size: 'medium' },
    { placeholder: 'PEXELS_GALLERY_2', query: 'restaurant dining fine hotel',            orientation: 'square',    size: 'medium' },
    { placeholder: 'PEXELS_GALLERY_3', query: 'spa wellness hotel treatment',            orientation: 'square',    size: 'medium' },
  ],
  'Consulting & Services': [
    { placeholder: 'PEXELS_HERO',      query: 'business consulting strategy meeting',    orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'professional team office collaboration',  orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'business growth chart success',           orientation: 'landscape', size: 'large' },
  ],
  'Retail & E-commerce': [
    { placeholder: 'PEXELS_HERO',      query: 'retail store modern shopping',            orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'product photography minimal',             orientation: 'square',    size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'shopping lifestyle consumer',             orientation: 'landscape', size: 'large' },
  ],
  'Industrial & Logistics': [
    { placeholder: 'PEXELS_HERO',      query: 'industrial warehouse logistics factory',  orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'manufacturing production industrial',     orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'logistics shipping transport trucks',     orientation: 'landscape', size: 'large' },
  ],
  'General Business': [
    { placeholder: 'PEXELS_HERO',      query: 'modern business office professional',     orientation: 'landscape', size: 'large2x' },
    { placeholder: 'PEXELS_SECTION_1', query: 'business team collaboration',             orientation: 'landscape', size: 'large' },
    { placeholder: 'PEXELS_SECTION_2', query: 'city skyline corporate building',         orientation: 'landscape', size: 'large' },
  ],
}

// Fetch a single Pexels image for one slot
async function fetchSlot(slot: PexelsSlot, apiKey: string): Promise<PexelsResult> {
  try {
    const params = new URLSearchParams({
      query:       slot.query,
      per_page:    '5',
      orientation: slot.orientation ?? 'landscape',
    })
    const res = await fetch(`${PEXELS_API}?${params}`, {
      headers: { Authorization: apiKey },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return { placeholder: slot.placeholder, url: null, photographer: '', photographerUrl: '' }

    const data = await res.json()
    const photos = data.photos ?? []
    if (!photos.length) return { placeholder: slot.placeholder, url: null, photographer: '', photographerUrl: '' }

    // Pick randomly from top 5 to add variety
    const pick = photos[Math.floor(Math.random() * Math.min(5, photos.length))]
    const sizeKey = slot.size ?? 'large'
    const url = pick.src?.[sizeKey] ?? pick.src?.large ?? pick.src?.original ?? null

    return {
      placeholder:      slot.placeholder,
      url,
      photographer:     pick.photographer ?? '',
      photographerUrl:  pick.photographer_url ?? '',
    }
  } catch {
    return { placeholder: slot.placeholder, url: null, photographer: '', photographerUrl: '' }
  }
}

// Fetch all slots for a sector in parallel
export async function fetchWebsitePexelsImages(sector: string): Promise<PexelsResult[]> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return []

  const slots = SECTOR_SLOTS[sector] ?? SECTOR_SLOTS['General Business']
  const results = await Promise.all(slots.map(slot => fetchSlot(slot, apiKey)))
  return results.filter(r => r.url !== null)
}

// Inject fetched images into generated HTML
// Claude is told to use <img src="PEXELS_HERO" ...> tokens — we replace them here
export function injectPexelsImages(html: string, images: PexelsResult[]): string {
  let result = html
  for (const img of images) {
    if (!img.url) continue
    // Replace all occurrences of the placeholder token (as src value)
    const re = new RegExp(`(src=["'])${img.placeholder}(["'])`, 'g')
    result = result.replace(re, `$1${img.url}$2`)
    // Also replace as CSS background-image url() tokens
    const reCss = new RegExp(`url\\(['"]?${img.placeholder}['"]?\\)`, 'g')
    result = result.replace(reCss, `url('${img.url}')`)
  }
  return result
}
