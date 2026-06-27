// src/lib/image-engine/creative-director.ts
// Uses Claude Sonnet to produce a campaign JSON brief from user input.
// Falls back to deterministic JSON if Claude fails.

import Anthropic from '@anthropic-ai/sdk'
import { getSizeById, inferSizeFromPlatform, DEFAULT_SIZE_ID } from './sizes'
import { matchIndustryFromText, getIndustryById } from './industries'
import { matchArchetypeFromIndustryAndPrompt, getArchetypeById } from './archetypes'
import { selectTemplate, selectVariation, getTemplateById } from './templates'
import type { CreativeDirectorOutput } from './types'

const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'

const SYSTEM_PROMPT = `You are Brand Syndicate's Creative Director Agent.
Return ONLY valid JSON. No markdown, no preamble, no explanation.

Goal: Convert a user's business prompt into a premium campaign poster design brief.
Never ask the image model to render final text. Text will be rendered by backend code.

Return exactly this JSON shape:
{
  "industry": "",
  "campaignArchetype": "",
  "selectedTemplate": "",
  "selectedSize": "",
  "templateVariation": "A",
  "visualMetaphor": "",
  "sceneDirection": "",
  "imageQueries": [],
  "headline": "",
  "subheadline": "",
  "bodyCopy": "",
  "cta": "",
  "serviceTags": [],
  "colorPalette": { "background": "", "text": "", "accent": "" },
  "typographyMood": "",
  "imageDirection": "",
  "negativeKeywords": [],
  "confidence": 0
}

COPY RULES:
- headline: max 46 chars, premium campaign quality
- subheadline: max 110 chars
- bodyCopy: max 200 chars (empty string if not needed)
- cta: max 30 chars
- serviceTags: max 5 items, each max 20 chars
- Copy must be short, campaign-like, NEVER ask image to render text
- Avoid fake claims like "India's No. 1" unless user clearly stated it
- Avoid celebrity/character/movie references

TEMPLATE VARIATION RULES (IMPORTANT — broken half-panel layouts are disabled):
- "A" = standard editorial layout
- "B" = full-bleed image with safe text lower/more central
- NEVER use "C". The old half-panel focus layout is disabled because it crops subjects and creates inconsistent images.
- Use B for personal-brand, founder, authority, luxury, festival, celebration, or landscape-heavy prompts
- Default to A for clean offers and text-heavy prompts

IMAGE QUERY RULES:
- imageQueries: 5–8 stock-photo-friendly search strings
- Queries must describe SCENES, OBJECTS, TEXTURES — not text or logos
- dark_power_campaign / authority_power: dark businessman portrait, moody suit silhouette, cinematic boardroom shadows
- jewellery / luxury: gold jewellery close up, bridal jewelry warm light, luxury jewelry macro, diamonds bokeh
- heritage / local: Indian heritage street photography, old bazaar India, historical architecture India, river ghat dusk
- clinic / wellness: clean modern clinic interior, doctor consultation warm light, wellness spa calm white
- restaurant / food: restaurant interior bokeh, plated food macro, chef kitchen action, warm dining ambiance
- car / auto: luxury car showroom bokeh, automotive detail chrome, night car lights motion blur
- fitness / gym: athlete training dramatic, gym silhouette motivational, fitness motion blur
- cafe / coffee: cafe interior natural light, coffee pour art, barista bokeh, cosy cafe window

INDUSTRY ROUTING — BE SPECIFIC, DO NOT OVER-ROUTE TO legacy_story_poster:
- "brand syndicate" / "branding agency" / "marketing" / "authority" → industry: branding_agency, template: dark_power_campaign
- "jewellery" / "jewelry" / "gold" / "diamond" / "bridal" → industry: jewellery, template: luxury_editorial
- "clinic" / "doctor" / "hospital" / "health" / "dental" → industry: clinic, template: care_wellness
- "startup" / "saas" / "app" / "tech" / "software" → industry: startup, template: startup_pitch_visual OR founder_ambition
- "restaurant" / "dhaba" / "cafe" / "food" / "catering" → industry: food_beverage, template: bold_offer_card OR local_market_story
- "car" / "automobile" / "showroom" / "vehicle" → industry: automotive, template: dark_power_campaign OR clean_typography_offer
- "gym" / "fitness" / "trainer" / "yoga" → industry: fitness, template: transformation_offer OR bold_offer_card
- "salon" / "beauty" / "spa" / "fashion" → industry: beauty_fashion, template: luxury_editorial OR care_wellness
- "school" / "coaching" / "education" / "institute" → industry: education, template: testimonial_proof OR service_grid_premium
- "local" / "city-name only" (no other qualifier) → template: heritage_city_campaign (NOT legacy_story_poster)
- "heritage" / "family business since" / "decades" / "generation" → industry: traditional_trade, template: legacy_story_poster
- Hindi offer text / discount / "free" / "sale" → template: clean_typography_offer
- "services list" / multiple service categories → template: service_grid_premium
- festival / "diwali" / "eid" / "holi" / celebration → template: festival_celebration
- testimonial / review / "trusted by" → template: testimonial_proof

SIZE ROUTING:
- Default: instagram_post_4x5
- If user mentions story/reel/status → instagram_story_9x16
- If user mentions linkedin → linkedin_post_1_91x1
- If user mentions website/hero → website_hero_16x9
- If user mentions whatsapp → whatsapp_portfolio_3x4
- If user mentions print/flyer → flyer_a5_portrait

COLOR PALETTE RULES — make palettes distinct per template:
- dark_power_campaign: background #0a0a0e, text #ffffff, accent #E11D2E
- luxury_editorial: background #F4EBDD, text #111111, accent #B58A3B
- care_wellness: background #F0F7FF, text #1A2C3D, accent #2E7DB2
- heritage_city_campaign: background #F5EED8, text #1C1008, accent #B8892B
- legacy_story_poster: background #EDE6D3, text #1A0F00, accent #8B5E2E
- clean_typography_offer: background #FAFAF7, text #111111, accent #C9A84C
- service_grid_premium: background #0a0a0e, text #ffffff, accent #E11D2E
- founder_ambition: background #040815, text #ffffff, accent #3B82F6
- startup_pitch_visual: background #050E1F, text #ffffff, accent #6366F1
- dark_agency_noir: background #050505, text #ffffff, accent #ffffff
- bold_offer_card: background #1A0A00, text #ffffff, accent #FF6B00
- transformation_offer: background #0D0D14, text #ffffff, accent #8B5CF6
- festival_celebration: background #1A0800, text #FFE4A0, accent #FFB800
- local_market_story: background #F7F3EC, text #111111, accent #D97706
- testimonial_proof: background #F9F9F6, text #111111, accent #374151

AVAILABLE TEMPLATES: luxury_editorial, dark_power_campaign, legacy_story_poster, heritage_city_campaign, clean_typography_offer, service_grid_premium, care_wellness, product_hero, bold_offer_card, founder_ambition, dark_agency_noir, transformation_offer, festival_celebration, testimonial_proof, minimal_proof_card, local_market_story, website_hero_campaign, craftsmanship_detail, startup_pitch_visual, clean_brand_audit

AVAILABLE ARCHETYPES: premium_luxury, legacy_story, local_pride, founder_ambition, care_ritual, transformation, craftsmanship, bold_offer, authority_power, celebration, trust_proof, minimal_editorial, dark_noir, growth_proof, community_first, festival_emotion, heritage_india, professional_trust, youth_energy

AVAILABLE SIZES: instagram_post_4x5, instagram_square_1x1, instagram_story_9x16, whatsapp_portfolio_3x4, linkedin_post_1_91x1, website_hero_16x9, meta_ad_4x5, youtube_thumbnail_16x9, flyer_a5_portrait

Do not ask questions. Return JSON only.`

export interface CreativeDirectorInput {
  prompt: string
  companyName?: string
  businessName?: string
  industry?: string
  city?: string
  offer?: string
  tone?: string
  platformSize?: string
  mode?: string
  tagline?: string
  primaryColors?: string[]
  brandVoice?: string
}

export async function runCreativeDirector(
  input: CreativeDirectorInput
): Promise<CreativeDirectorOutput> {
  const {
    prompt, companyName, businessName, industry, city, offer,
    tone, platformSize, tagline, primaryColors, brandVoice,
  } = input

  const brandName = companyName ?? businessName ?? 'Brand'

  const userMessage = [
    `Business: ${brandName}`,
    industry ? `Industry hint: ${industry}` : '',
    city ? `City: ${city}` : '',
    offer ? `Offer/campaign: ${offer}` : '',
    tone ? `Tone: ${tone}` : '',
    platformSize ? `Platform/size: ${platformSize}` : '',
    tagline ? `Tagline: ${tagline}` : '',
    primaryColors?.length ? `Brand colors: ${primaryColors.join(', ')}` : '',
    brandVoice ? `Brand voice: ${brandVoice}` : '',
    `\nUser prompt: ${prompt}`,
  ].filter(Boolean).join('\n')

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      // FIX 4: temperature 0.75 for creative diversity (was 0.4 — caused all outputs to collapse into same templates)
      const msg = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 1200,
        temperature: 0.75,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      })

      const rawText = msg.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: 'text'; text: string }).text)
        .join('')
        .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
        .trim()

      const parsed = JSON.parse(rawText) as CreativeDirectorOutput
      // Validate required fields
      if (!parsed.headline || !parsed.selectedTemplate || !parsed.industry) {
        throw new Error('Incomplete creative director output')
      }
      return parsed
    } catch (err) {
      console.warn('[creative-director] Claude failed, using deterministic fallback:', err)
    }
  }

  // ── Deterministic fallback ────────────────────────────────────────────────
  return buildDeterministicFallback(input, brandName)
}

function buildDeterministicFallback(
  input: CreativeDirectorInput,
  brandName: string
): CreativeDirectorOutput {
  const promptLower = (input.prompt ?? '').toLowerCase()

  // Detect industry
  const inferredIndustryId = input.industry
    ? (input.industry.toLowerCase().replace(/\s+/g, '_'))
    : matchIndustryFromText(input.prompt ?? '')

  const industryDef = getIndustryById(inferredIndustryId)

  // Detect archetype
  const archetypeId = matchArchetypeFromIndustryAndPrompt(inferredIndustryId, input.prompt ?? '')
  const archetypeDef = getArchetypeById(archetypeId)

  // Detect size
  const sizeId = input.platformSize
    ? (inferSizeFromPlatform(input.platformSize)?.id ?? DEFAULT_SIZE_ID)
    : DEFAULT_SIZE_ID
  const size = getSizeById(sizeId)

  // Detect template
  const template = selectTemplate(inferredIndustryId, archetypeId)
  const variation = selectVariation(template, input.prompt ?? '')

  // Build image queries from industry + archetype
  const imageQueries = [
    ...(industryDef?.pexelsKeywords ?? []),
    ...(archetypeDef?.pexelsQueryBoosters ?? []),
  ].slice(0, 7)

  // Generate copy based on archetype
  const copyMap: Record<string, { headline: string; subheadline: string; cta: string }> = {
    premium_luxury: {
      headline: `${brandName} — Crafted for the finest.`,
      subheadline: 'Where elegance meets legacy. Discover our premium collection.',
      cta: 'Explore Now',
    },
    legacy_story: {
      headline: `${brandName}. A story worth wearing.`,
      subheadline: 'Decades of trust. Crafted with love, delivered with pride.',
      cta: 'Our Story',
    },
    local_pride: {
      headline: `${brandName} — ${input.city ?? 'Your city'}'s own.`,
      subheadline: 'Rooted in this city. Built for every home.',
      cta: 'Visit Us',
    },
    authority_power: {
      headline: `${brandName}. We don't follow. We lead.`,
      subheadline: 'Strategy. Identity. Domination. This is Brand Syndicate.',
      cta: 'Work With Us',
    },
    care_ritual: {
      headline: `${brandName} — Your health, our calling.`,
      subheadline: 'Compassionate care, modern expertise. Trusted by thousands.',
      cta: 'Book Appointment',
    },
    founder_ambition: {
      headline: `${brandName}. Built different.`,
      subheadline: 'We move fast. We build real. We don\'t stop.',
      cta: 'See Our Work',
    },
    transformation: {
      headline: `${brandName}. Change starts here.`,
      subheadline: 'Real results. Real people. Your transformation, guaranteed.',
      cta: 'Start Today',
    },
    bold_offer: {
      headline: input.offer ?? `${brandName} — Special Offer`,
      subheadline: 'Limited time. Unlimited value. Grab it before it\'s gone.',
      cta: 'Claim Now',
    },
    dark_noir: {
      headline: `${brandName}. Some brands speak. We act.`,
      subheadline: 'No noise. No fluff. Just results that cut through.',
      cta: 'Engage Us',
    },
    celebration: {
      headline: `${brandName} wishes you joy.`,
      subheadline: 'Celebrating every precious moment with you and yours.',
      cta: 'Celebrate With Us',
    },
    minimal_editorial: {
      headline: `${brandName}.`,
      subheadline: 'Crafted with intention. Less is everything.',
      cta: 'Discover',
    },
    heritage_india: {
      headline: `${brandName} — Hamari Virasat.`,
      subheadline: `Rooted in ${input.city ?? 'India'}. Crafted for the world.`,
      cta: 'Explore Heritage',
    },
    craftsmanship: {
      headline: `${brandName}. Made by hand, made to last.`,
      subheadline: 'Every detail deliberate. Every product a promise.',
      cta: 'See Our Craft',
    },
    trust_proof: {
      headline: `${brandName}. Trusted by thousands.`,
      subheadline: '4.9 stars. 500+ happy clients. Your trust, our responsibility.',
      cta: 'Read Reviews',
    },
    community_first: {
      headline: `${brandName} — For our people.`,
      subheadline: 'Built on community. Grown by trust. Here for every one of you.',
      cta: 'Join Us',
    },
    professional_trust: {
      headline: `${brandName}. Expert guidance, guaranteed.`,
      subheadline: 'Years of expertise. Proven results. Your success, our mission.',
      cta: 'Consult Now',
    },
  }

  const copy = copyMap[archetypeId] ?? copyMap['bold_offer']

  // Ensure headline fits size limit
  let headline = copy.headline
  if (headline.length > size.maxHeadlineChars) {
    headline = headline.slice(0, size.maxHeadlineChars - 1).trimEnd() + '.'
  }

  // Service tags for service-grid templates
  const serviceTags = promptLower.includes('strategy') || promptLower.includes('build') || template.id === 'service_grid_premium'
    ? ['Strategy', 'Branding', 'Digital', 'Marketing', 'Growth']
    : []

  // Color palette — each template gets a distinct visual signature
  const paletteMap: Record<string, { background: string; text: string; accent: string }> = {
    dark_power_campaign: { background: '#0a0a0e', text: '#ffffff', accent: '#E11D2E' },
    luxury_editorial: { background: '#F4EBDD', text: '#111111', accent: '#B58A3B' },
    care_wellness: { background: '#F0F7FF', text: '#1A2C3D', accent: '#2E7DB2' },
    heritage_city_campaign: { background: '#F5EED8', text: '#1C1008', accent: '#B8892B' },
    legacy_story_poster: { background: '#EDE6D3', text: '#1A0F00', accent: '#8B5E2E' },
    clean_typography_offer: { background: '#FAFAF7', text: '#111111', accent: '#C9A84C' },
    service_grid_premium: { background: '#0a0a0e', text: '#ffffff', accent: '#E11D2E' },
    founder_ambition: { background: '#040815', text: '#ffffff', accent: '#3B82F6' },
    startup_pitch_visual: { background: '#050E1F', text: '#ffffff', accent: '#6366F1' },
    dark_agency_noir: { background: '#050505', text: '#ffffff', accent: '#ffffff' },
    bold_offer_card: { background: '#1A0A00', text: '#ffffff', accent: '#FF6B00' },
    transformation_offer: { background: '#0D0D14', text: '#ffffff', accent: '#8B5CF6' },
    festival_celebration: { background: '#1A0800', text: '#FFE4A0', accent: '#FFB800' },
    local_market_story: { background: '#F7F3EC', text: '#111111', accent: '#D97706' },
    testimonial_proof: { background: '#F9F9F6', text: '#111111', accent: '#374151' },
    minimal_proof_card: { background: '#FAFAFA', text: '#111111', accent: '#9CA3AF' },
  }
  const colorPalette = paletteMap[template.id] ?? template.defaultColors

  return {
    industry: inferredIndustryId,
    campaignArchetype: archetypeId,
    selectedTemplate: template.id,
    selectedSize: sizeId,
    templateVariation: variation,
    visualMetaphor: `${archetypeDef?.visualLanguage ?? 'premium scene'} for ${brandName}`,
    sceneDirection: `Find a ${imageQueries[0] ?? 'professional business scene'} that feels ${archetypeDef?.emotion ?? 'premium'}`,
    imageQueries,
    headline,
    subheadline: copy.subheadline.slice(0, size.maxSubheadlineChars),
    bodyCopy: '',
    cta: copy.cta,
    serviceTags,
    colorPalette,
    typographyMood: template.fontStack,
    imageDirection: archetypeDef?.visualLanguage ?? 'premium, aspirational scene',
    negativeKeywords: industryDef?.avoidKeywords ?? [],
    confidence: 70,
  }
}
