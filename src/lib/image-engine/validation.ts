// src/lib/image-engine/validation.ts
// Validates creative output and render contract. Returns warnings, never hard-fails.

import type { CreativeDirectorOutput } from './types'

const FAKE_CLAIM_PATTERNS = [
  /india['']?s? no\.?\s*1/i,
  /number\s*1 in india/i,
  /best in india/i,
  /world['']?s? no\.?\s*1/i,
  /certified by/i,
  /government approved/i,
]

const UNSAFE_MEDICAL_LEGAL = [
  /guaranteed cure/i,
  /100% cure/i,
  /legally guaranteed/i,
  /zero risk investment/i,
  /assured returns/i,
]

const CELEBRITY_PATTERNS = [
  /amitabh/i, /shahrukh/i, /virat/i, /sachin/i,
  /modi/i, /rahul gandhi/i, /elon musk/i,
  /narendra/i,
]

export interface ValidationResult {
  warnings: string[]
  modified: Partial<CreativeDirectorOutput>
}

function sanitizeCopy(text: string | undefined | null, brandName: string, type: 'headline' | 'subheadline' | 'cta' | 'bodyCopy'): string {
  const val = (text ?? '').trim()
  if (!val) return ''
  const lower = val.toLowerCase()
  
  // Aggressive list of markers that indicate the AI is echoing generation instructions
  const promptMarkers = [
    'create a', 'generate a', 'design a', 'make a', 'prompt:', 'user prompt:',
    'poster for', 'logo for', 'advertisement for', 'instagram post', 'facebook post',
    'social media post', 'campaign for', 'business brief:', 'company brief:',
    'here is a', 'this is a', 'sure, here', 'i will create', 'the poster should',
    'visual metaphor:', 'scene direction:', 'image queries:', 'headline:', 'subheadline:', 'cta:',
    'graphic for', 'design for', 'brand for', 'selling', 'high quality', 'premium', 'luxury',
    'visual:', 'direction:', 'queries:', 'image:', 'lorem ipsum', 'placeholder', 'your brand', 'company name', 'sample text', 'replace this'
  ]

  // If the text looks like a prompt (contains markers or is just instructions)
  const isPrompt = promptMarkers.some(m => lower.includes(m)) || 
                   lower.startsWith('here is') || 
                   lower.startsWith('sure!') || 
                   lower.startsWith('certainly') ||
                   (lower.includes('brand') && lower.includes('sell')) ||
                   (lower.includes('graphic') && lower.includes('jewellery'))

  if (isPrompt) {
    // For short fields like headline/cta, any match is a leak. 
    // For longer fields, we check if it starts with instructions or is relatively short.
    if (val.length < 120 || promptMarkers.some(m => lower.startsWith(m))) {
      if (type === 'headline') return `${brandName} — Built to Trust`
      if (type === 'subheadline') return `A premium, market-ready campaign for ${brandName}.`
      if (type === 'cta') return 'Explore Now'
      return ''
    }
  }
  return val
}

export function validateCreativeOutput(creative: CreativeDirectorOutput, brandName: string = 'Brand'): ValidationResult {
  const warnings: string[] = []
  const modified: Partial<CreativeDirectorOutput> = {}

  // Sanitize brandName if it's passed as part of the creative output (some AI models might try to override it)
  // Or if we're using it as a source for other fields.
  const cleanBrandName = sanitizeCopy(brandName, 'Brand', 'bodyCopy') || 'Brand'

  // Sanitize for prompt leaks
  const sHeadline = sanitizeCopy(creative.headline, cleanBrandName, 'headline')
  if (sHeadline !== creative.headline) {
    warnings.push('Prompt instructions detected in headline — replaced with fallback')
    modified.headline = sHeadline
  }
  
  const sSub = sanitizeCopy(creative.subheadline, brandName, 'subheadline')
  if (sSub !== creative.subheadline) {
    warnings.push('Prompt instructions detected in subheadline — replaced with fallback')
    modified.subheadline = sSub
  }

  const sCta = sanitizeCopy(creative.cta, brandName, 'cta')
  if (sCta !== creative.cta) {
    warnings.push('Prompt instructions detected in CTA — replaced with fallback')
    modified.cta = sCta
  }

  const allText = [modified.headline ?? creative.headline, modified.subheadline ?? creative.subheadline, creative.bodyCopy, modified.cta ?? creative.cta].join(' ')

  // Check for fake claims
  for (const pattern of FAKE_CLAIM_PATTERNS) {
    if (pattern.test(allText)) {
      warnings.push(`Potential unverified superlative claim removed: "${pattern.source}"`)
    }
  }

  // Check for medical/legal guarantees
  for (const pattern of UNSAFE_MEDICAL_LEGAL) {
    if (pattern.test(allText)) {
      warnings.push(`Potentially unsafe guarantee language detected: "${pattern.source}"`)
    }
  }

  // Check for celebrity references
  for (const pattern of CELEBRITY_PATTERNS) {
    if (pattern.test(allText)) {
      warnings.push(`Celebrity reference detected — please verify usage rights before publishing`)
    }
  }

  // Check copy length limits
  if (creative.headline?.length > 50) {
    warnings.push(`Headline exceeds recommended length (${creative.headline.length} chars). Will be truncated.`)
  }
  if (creative.subheadline?.length > 120) {
    warnings.push(`Subheadline exceeds recommended length. Will be truncated.`)
  }

  // Check for empty required fields
  if (!creative.headline?.trim()) {
    warnings.push('Headline is empty — fallback text will be used')
    modified.headline = `${brandName} — Built to Trust`
  }
  if (!creative.cta?.trim()) {
    warnings.push('CTA is empty — fallback text will be used')
    modified.cta = 'Learn More'
  }

  // Check image queries
  if (!creative.imageQueries?.length) {
    warnings.push('No image queries provided — generic queries will be used')
  }

  return { warnings, modified }
}

export function validateImageAttribution(photographer: string, source: string): string[] {
  const warnings: string[] = []
  if (!photographer) {
    warnings.push(`Image attribution missing photographer name from ${source}`)
  }
  return warnings
}
