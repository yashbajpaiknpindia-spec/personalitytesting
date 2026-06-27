import type { WebsiteTemplate } from './template-types'

// Stable, hand-picked image pools. The resolver picks deterministically by template id,
// so related websites no longer all reuse the exact same static thumbnail.
const THUMBNAIL_POOLS: Record<string, string[]> = {
  tech: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
    'https://images.unsplash.com/photo-1551434678-e076c223a692',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
  ],
  creative: [
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4',
    'https://images.unsplash.com/photo-1518005020951-eccb494ad742',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
  ],
  agency: [
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf',
    'https://images.unsplash.com/photo-1497366216548-37526070297c',
    'https://images.unsplash.com/photo-1556761175-b413da4baf72',
    'https://images.unsplash.com/photo-1552664730-d307ca884978',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216',
  ],
  education: [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1',
    'https://images.unsplash.com/photo-1580582932707-520aed937b7b',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6',
    'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b',
  ],
  health: [
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528',
    'https://images.unsplash.com/photo-1551076805-e1869033e561',
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95',
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef',
  ],
  fashion: [
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e',
  ],
  food: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    'https://images.unsplash.com/photo-1567521464027-f127ff144326',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
  ],
  real_estate: [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811',
    'https://images.unsplash.com/photo-1487958449943-2429e8be8625',
    'https://images.unsplash.com/photo-1486325212027-8081e485255e',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
  ],
  industry: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
    'https://images.unsplash.com/photo-1565793329688-40b9b4d8f4e5',
    'https://images.unsplash.com/photo-1509391366360-2e959784a276',
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854',
  ],
  auto: [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7',
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a',
    'https://images.unsplash.com/photo-1632823471565-1ecdf5c6da13',
    'https://images.unsplash.com/photo-1558618047-3d7fa4ee24b5',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c',
  ],
  travel: [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
  ],
  finance: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3',
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f',
    'https://images.unsplash.com/photo-1559526324-593bc073d938',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3',
  ],
  legal: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f',
    'https://images.unsplash.com/photo-1505664194779-8beaceb93744',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85',
    'https://images.unsplash.com/photo-1521791055366-0d553872125f',
  ],
  luxury: [
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
    'https://images.unsplash.com/photo-1523170335258-f5ed11844a49',
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3',
  ],
  events: [
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3',
    'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3',
    'https://images.unsplash.com/photo-1519741497674-611481863552',
  ],
  social: [
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c',
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b',
    'https://images.unsplash.com/photo-1509099836639-18ba1795216d',
    'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6',
  ],
}

const CATEGORY_POOL_ALIASES: Record<string, string> = {
  commerce: 'agency',
  business: 'agency',
  healthcare: 'health',
  wellness: 'health',
  hospitality: 'travel',
  hotel: 'travel',
  property: 'real_estate',
  design: 'real_estate',
  agritech: 'industry',
  agriculture: 'industry',
  logistics: 'industry',
  energy: 'industry',
  fintech: 'finance',
  jewellery: 'luxury',
  sports: 'health',
}

const KEYWORD_POOLS: Array<[RegExp, string]> = [
  [/furniture|sofa|interior|decor|wood|carpenter|modular-kitchen|architect|construction/i, 'real_estate'],
  [/school|college|academy|coaching|learning|education|training|student|course/i, 'education'],
  [/clinic|hospital|doctor|medical|dental|ayurveda|wellness|spa|health|yoga|pet|veterinary/i, 'health'],
  [/restaurant|cafe|bakery|food|cloud-kitchen|bar|lounge|chef|chocolate|coffee|dairy/i, 'food'],
  [/fashion|boutique|clothing|apparel|beauty|cosmetic|salon|makeup|skincare/i, 'beauty'],
  [/jewel|diamond|luxury|adore|watch/i, 'luxury'],
  [/real-estate|rera|property|villa|housing|lighting-studio/i, 'real_estate'],
  [/auto|car|bike|vehicle|automobile|mobility|showroom/i, 'auto'],
  [/sports|fitness|gym|marathon|bat|cricket|club/i, 'health'],
  [/farm|agri|crop|organic|rural|bamboo/i, 'industry'],
  [/finance|accounting|fintech|bank|tax|loan|wealth|insurance/i, 'finance'],
  [/logistics|warehouse|courier|shipping|transport|supply-chain/i, 'industry'],
  [/solar|energy|power|ev|manufactur|factory|industrial/i, 'industry'],
  [/travel|tour|hotel|resort|villa|stay|hospitality/i, 'travel'],
  [/law|legal|advocate|solicitor/i, 'legal'],
  [/wedding|event|planner|photography|banquet/i, 'events'],
  [/ngo|nonprofit|charity|foundation|social/i, 'social'],
  [/agency|marketing|branding|studio|creative|design|media|film|photo|video|rendering|gallery/i, 'creative'],
  [/tech|saas|software|ai-|automation|cyber|blockchain|app|cloud|iot|data/i, 'tech'],
]

function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h >>> 0)
}

function withImageParams(baseUrl: string, seed: string): string {
  const width = 700 + (hashString(seed) % 5) * 10
  const quality = 68 + (hashString(`${seed}:q`) % 6)
  return `${baseUrl}?w=${width}&q=${quality}&auto=format&fit=crop`
}

function pickFromPool(poolKey: string, seed: string): string {
  const realKey = CATEGORY_POOL_ALIASES[poolKey] ?? poolKey
  const pool = THUMBNAIL_POOLS[realKey] ?? THUMBNAIL_POOLS.agency
  return withImageParams(pool[hashString(seed) % pool.length], seed)
}

function getPoolKey(t: Pick<WebsiteTemplate, 'id' | 'label' | 'category'> & Partial<Pick<WebsiteTemplate, 'industries' | 'keywords'>>): string {
  const hay = `${t.id} ${t.label} ${t.category} ${(t.industries || []).join(' ')} ${(t.keywords || []).join(' ')}`
  for (const [pattern, poolKey] of KEYWORD_POOLS) {
    if (pattern.test(hay)) return poolKey
  }
  const categoryKey = t.category.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return CATEGORY_POOL_ALIASES[categoryKey] ?? categoryKey || 'agency'
}

function safeColour(value: string | undefined, fallback: string): string {
  const v = String(value || '').trim()
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) ? v : fallback
}

export function getTemplateFallbackThumbnail(t: Pick<WebsiteTemplate, 'id' | 'label' | 'category' | 'color' | 'bg'>): string {
  const params = new URLSearchParams({
    id: t.id,
    label: t.label,
    category: t.category,
    color: safeColour(t.color, '#C9A84C'),
    bg: safeColour(t.bg, '#0A0A0E'),
  })
  return `/api/template-thumbnail?${params.toString()}`
}

export function getCuratedTemplateThumbnail(t: Pick<WebsiteTemplate, 'id' | 'label' | 'category'> & Partial<Pick<WebsiteTemplate, 'industries' | 'keywords'>>): string {
  return pickFromPool(getPoolKey(t), `${t.id}:${t.label}:${t.category}`)
}

export function isUnsafeTemplateThumbnail(url: string | undefined): boolean {
  if (!url) return true
  const u = url.toLowerCase()
  return u.includes('source.unsplash.com') || u.includes('placeholder') || u.includes('dummyimage') || u.includes('via.placeholder')
}

export function resolveTemplateThumbnail(t: WebsiteTemplate, mappedUrl?: string): string {
  // BSX families had repeated static images across all variants; force a diversified thumbnail.
  if (t.id.startsWith('bsx-')) return getCuratedTemplateThumbnail(t)
  return isUnsafeTemplateThumbnail(mappedUrl) ? getCuratedTemplateThumbnail(t) : String(mappedUrl)
}
