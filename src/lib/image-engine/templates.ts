// src/lib/image-engine/templates.ts
// Template configs for the campaign poster engine.

export type TemplateVariation = 'A' | 'B' | 'C'

export interface TemplateVariationDef {
  id: TemplateVariation
  label: string
  description: string
  layout: 'image-right-text-left' | 'full-bleed-bottom-panel' | 'text-only' | 'service-grid' | 'before-after'
  textPosition: 'left' | 'right' | 'bottom' | 'center' | 'top-left' | 'top-right'
}

export interface TemplateDef {
  id: string
  name: string
  description: string
  supportedSizes: string[]
  supportedIndustries: string[]
  supportedArchetypes: string[]
  canWorkWithoutImage: boolean
  variations: TemplateVariationDef[]
  effects: string[]
  textLimits: { headline: number; subheadline: number; body: number; tags: number }
  logoPlacement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-center'
  ctaPlacement: 'inline-text' | 'bottom-bar' | 'button-box'
  watermarkPlacement: 'bottom-center' | 'bottom-left' | 'bottom-right'
  imageTreatment: 'full-bleed' | 'right-panel' | 'background-60' | 'none'
  fontStack: string
  defaultColors: { background: string; text: string; accent: string }
}

export const TEMPLATES: Record<string, TemplateDef> = {
  luxury_editorial: {
    id: 'luxury_editorial', name: 'Luxury Editorial',
    description: 'Premium cream-and-gold editorial. Full bleed image, text left/bottom panel.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'whatsapp_portfolio_3x4', 'instagram_story_9x16'],
    supportedIndustries: ['jewellery', 'jewellery_wholesaler', 'hotel', 'resort', 'fashion', 'boutique', 'spa', 'interior_design', 'cosmetics', 'real_estate'],
    supportedArchetypes: ['premium_luxury', 'craftsmanship', 'legacy_story', 'minimal_editorial'],
    canWorkWithoutImage: false,
    variations: [
      { id: 'A', label: 'Text Left / Image Right', description: 'Left cream panel with text, hero product right', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Full Bleed / Bottom Panel', description: 'Full-bleed image with dark bottom text panel', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'C', label: 'Editorial Focus', description: 'Elegant serif headline with safe editorial spacing', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['warmCreamGradient', 'subtleGrain', 'luxuryGoldWash', 'vignette', 'premiumBorder'],
    textLimits: { headline: 46, subheadline: 110, body: 200, tags: 3 },
    logoPlacement: 'top-left', ctaPlacement: 'button-box', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Georgia', 'Times New Roman', serif",
    defaultColors: { background: '#F4EBDD', text: '#111111', accent: '#B58A3B' },
  },
  dark_power_campaign: {
    id: 'dark_power_campaign', name: 'Dark Power Campaign',
    description: 'Cinematic authority. Black-and-white or dark, high-contrast, bold condensed type.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'instagram_story_9x16', 'linkedin_post_1_91x1', 'website_hero_16x9'],
    supportedIndustries: ['marketing_agency', 'branding_agency', 'consultant', 'software_company', 'gym', 'fashion', 'startup'],
    supportedArchetypes: ['authority_power', 'dark_noir', 'founder_ambition', 'youth_energy'],
    canWorkWithoutImage: true,
    variations: [
      { id: 'A', label: 'Portrait Left / Bold Type Right', description: 'Dark portrait left, massive headline right', layout: 'image-right-text-left', textPosition: 'right' },
      { id: 'B', label: 'Full Bleed Dark', description: 'Full-bleed dark-treated image, bottom text slam', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'C', label: 'Dark Editorial Focus', description: 'Cinematic image with headline placed in safe editorial space', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['darkNoirGradient', 'blackWhite', 'highContrast', 'smokeOverlay', 'vignette', 'boldTypeTexture'],
    textLimits: { headline: 40, subheadline: 90, body: 140, tags: 0 },
    logoPlacement: 'top-left', ctaPlacement: 'button-box', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Impact', 'Arial Black', sans-serif",
    defaultColors: { background: '#0a0a0e', text: '#ffffff', accent: '#E11D2E' },
  },
  legacy_story_poster: {
    id: 'legacy_story_poster', name: 'Legacy Story Poster',
    description: 'Vintage warmth, paper grain, heritage India aesthetic.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'whatsapp_portfolio_3x4', 'instagram_story_9x16'],
    supportedIndustries: ['restaurant', 'sweets_shop', 'bakery', 'jewellery', 'local_retail_store', 'agriculture'],
    supportedArchetypes: ['legacy_story', 'heritage_india', 'craftsmanship', 'community_first'],
    canWorkWithoutImage: false,
    variations: [
      { id: 'A', label: 'Left Text / Right Scene', description: 'Warm text panel left, heritage scene right', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Full Bleed Sepia', description: 'Full sepia scene, text bottom with ornament border', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'C', label: 'Vintage Editorial', description: 'Newspaper-style editorial composition with aged texture', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['sepiaHeritage', 'paperTexture', 'heavyGrain', 'creamPaperWash', 'vignette', 'premiumBorder'],
    textLimits: { headline: 46, subheadline: 110, body: 200, tags: 3 },
    logoPlacement: 'top-left', ctaPlacement: 'inline-text', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Georgia', 'Times New Roman', serif",
    defaultColors: { background: '#F5F0E8', text: '#2C1810', accent: '#8B4513' },
  },
  heritage_city_campaign: {
    id: 'heritage_city_campaign', name: 'Heritage City Campaign',
    description: 'Cream paper, serif headline, Indian heritage city photo, gold border.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'linkedin_post_1_91x1', 'whatsapp_portfolio_3x4'],
    supportedIndustries: ['local_retail_store', 'restaurant', 'real_estate', 'jewellery', 'agriculture', 'coaching_institute'],
    supportedArchetypes: ['heritage_india', 'local_pride', 'legacy_story', 'community_first'],
    canWorkWithoutImage: false,
    variations: [
      { id: 'A', label: 'Image Right / Heritage Text Left', description: 'Heritage city image right, cream text left', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Full Bleed Heritage', description: 'Full heritage scene, bottom text on aged paper', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'C', label: 'Heritage Editorial', description: 'Serif headline with city identity and safe image spacing', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['sepiaHeritage', 'agedPosterTexture', 'creamPaperWash', 'premiumBorder', 'vignette'],
    textLimits: { headline: 46, subheadline: 110, body: 180, tags: 3 },
    logoPlacement: 'top-left', ctaPlacement: 'inline-text', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Georgia', 'Times New Roman', serif",
    defaultColors: { background: '#F5EED8', text: '#1C1008', accent: '#B8892B' },
  },
  clean_typography_offer: {
    id: 'clean_typography_offer', name: 'Clean Typography Offer',
    description: 'Text-led, minimal background, massive serif headline. Works without image.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'instagram_story_9x16', 'linkedin_post_1_91x1', 'whatsapp_status_9x16'],
    supportedIndustries: ['all'],
    supportedArchetypes: ['minimal_editorial', 'bold_offer', 'professional_trust', 'authority_power'],
    canWorkWithoutImage: true,
    variations: [
      { id: 'A', label: 'Giant Headline Left / Subtext Right', description: 'Large serif left, details right column', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Full Typography Center', description: 'Centered huge type, clean background', layout: 'text-only', textPosition: 'center' },
      { id: 'C', label: 'Bold Editorial Stack', description: 'Stacked headline, rule lines, minimal', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['subtleGrain', 'premiumBorder', 'warmCreamGradient'],
    textLimits: { headline: 46, subheadline: 110, body: 200, tags: 5 },
    logoPlacement: 'top-left', ctaPlacement: 'button-box', watermarkPlacement: 'bottom-center',
    imageTreatment: 'none', fontStack: "'Georgia', 'Times New Roman', serif",
    defaultColors: { background: '#FAFAF7', text: '#111111', accent: '#C9A84C' },
  },
  service_grid_premium: {
    id: 'service_grid_premium', name: 'Service Grid Premium',
    description: '"Build a Business" style. Large headline, service grid with icons, CTA box.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'instagram_story_9x16', 'linkedin_post_1_91x1', 'website_hero_16x9'],
    supportedIndustries: ['marketing_agency', 'branding_agency', 'consultant', 'software_company', 'ca_accountant', 'coworking_space'],
    supportedArchetypes: ['authority_power', 'professional_trust', 'bold_offer', 'founder_ambition'],
    canWorkWithoutImage: true,
    variations: [
      { id: 'A', label: 'Headline + 4-Grid / CTA Bar', description: 'Top headline, 4-service icon grid, bottom CTA', layout: 'service-grid', textPosition: 'center' },
      { id: 'B', label: 'Dark Service Grid', description: 'Dark background, white icon grid, accent CTA', layout: 'service-grid', textPosition: 'center' },
      { id: 'C', label: 'Service Editorial', description: 'Left headline/CTA, right service list', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['subtleGrain', 'darkNoirGradient', 'boldTypeTexture'],
    textLimits: { headline: 40, subheadline: 90, body: 160, tags: 6 },
    logoPlacement: 'top-left', ctaPlacement: 'bottom-bar', watermarkPlacement: 'bottom-center',
    imageTreatment: 'none', fontStack: "'Arial Black', 'Impact', sans-serif",
    defaultColors: { background: '#0a0a0e', text: '#ffffff', accent: '#E11D2E' },
  },
  care_wellness: {
    id: 'care_wellness', name: 'Care & Wellness',
    description: 'Clean healthcare/wellness poster. Soft whites, serif calm type.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'instagram_story_9x16', 'whatsapp_portfolio_3x4'],
    supportedIndustries: ['doctor', 'clinic', 'hospital', 'dentist', 'pharmacy', 'yoga_studio', 'spa', 'skincare', 'physiotherapy'],
    supportedArchetypes: ['care_ritual', 'trust_proof', 'community_first', 'minimal_editorial'],
    canWorkWithoutImage: true,
    variations: [
      { id: 'A', label: 'Image Right / Soft Text Left', description: 'Soft care image right, clean text left', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Full Bleed Soft', description: 'Soft full bleed image, clean text bottom panel', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'C', label: 'Clean Editorial', description: 'White left panel, image right, minimal type', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['softWellnessGlow', 'subtleGrain', 'premiumBorder'],
    textLimits: { headline: 46, subheadline: 110, body: 200, tags: 3 },
    logoPlacement: 'top-left', ctaPlacement: 'button-box', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Georgia', Arial, sans-serif",
    defaultColors: { background: '#F8FBFF', text: '#1A2C3D', accent: '#2E7DB2' },
  },
  product_hero: {
    id: 'product_hero', name: 'Product Hero',
    description: 'Product-centric. Clean image with gradient overlay, elegant type.',
    supportedSizes: ['instagram_square_1x1', 'instagram_post_4x5', 'whatsapp_portfolio_3x4'],
    supportedIndustries: ['cosmetics', 'skincare', 'furniture', 'home_decor', 'jewellery', 'bakery', 'restaurant', 'flower_shop'],
    supportedArchetypes: ['premium_luxury', 'craftsmanship', 'minimal_editorial', 'bold_offer'],
    canWorkWithoutImage: false,
    variations: [
      { id: 'A', label: 'Product Center / Text Below', description: 'Product hero center, headline bottom', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'B', label: 'Product Right / Brand Left', description: 'Text-brand left, product image right', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'C', label: 'Full Bleed Editorial', description: 'Full product bleed, minimal centered type', layout: 'full-bleed-bottom-panel', textPosition: 'center' },
    ],
    effects: ['warmCreamGradient', 'subtleGrain', 'vignette'],
    textLimits: { headline: 40, subheadline: 90, body: 160, tags: 3 },
    logoPlacement: 'top-left', ctaPlacement: 'inline-text', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Georgia', sans-serif",
    defaultColors: { background: '#FAFAF7', text: '#111111', accent: '#C9A84C' },
  },
  bold_offer_card: {
    id: 'bold_offer_card', name: 'Bold Offer Card',
    description: 'Urgency-driven offer poster. Massive headline, CTA, discount/offer numbers.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'instagram_story_9x16', 'whatsapp_status_9x16'],
    supportedIndustries: ['all'],
    supportedArchetypes: ['bold_offer', 'transformation', 'youth_energy', 'celebration'],
    canWorkWithoutImage: true,
    variations: [
      { id: 'A', label: 'Image Background / Bold Text', description: 'Image BG with powerful headline slam', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'B', label: 'Dark Bold Type Only', description: 'No image, pure dark typography with CTA', layout: 'text-only', textPosition: 'center' },
      { id: 'C', label: 'Split Offer Layout', description: 'Left offer text, right image accent', layout: 'image-right-text-left', textPosition: 'left' },
    ],
    effects: ['highContrast', 'boldTypeTexture', 'darkNoirGradient'],
    textLimits: { headline: 40, subheadline: 90, body: 140, tags: 4 },
    logoPlacement: 'top-left', ctaPlacement: 'bottom-bar', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Impact', 'Arial Black', sans-serif",
    defaultColors: { background: '#111111', text: '#ffffff', accent: '#FFD700' },
  },
  founder_ambition: {
    id: 'founder_ambition', name: 'Founder Ambition',
    description: 'Dark workspace/startup energy. Blue-glow accents, bold ambition type.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'instagram_story_9x16', 'linkedin_post_1_91x1'],
    supportedIndustries: ['startup', 'saas', 'app_development', 'marketing_agency', 'consultant'],
    supportedArchetypes: ['founder_ambition', 'growth_proof', 'youth_energy'],
    canWorkWithoutImage: false,
    variations: [
      { id: 'A', label: 'Image Left / Founder Copy Right', description: 'Workspace image left, bold copy right', layout: 'image-right-text-left', textPosition: 'right' },
      { id: 'B', label: 'Dark Full Bleed', description: 'Dark full-bleed scene, bottom ambition type', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'C', label: 'Startup Editorial', description: 'Split dark/light, metric-forward copy', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['founderBlueGlow', 'darkNoirGradient', 'subtleGrain', 'vignette'],
    textLimits: { headline: 40, subheadline: 90, body: 160, tags: 4 },
    logoPlacement: 'top-left', ctaPlacement: 'button-box', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Arial Black', Arial, sans-serif",
    defaultColors: { background: '#040815', text: '#ffffff', accent: '#3B82F6' },
  },
  dark_agency_noir: {
    id: 'dark_agency_noir', name: 'Dark Agency Noir',
    description: 'Underground agency power. Minimal dark, smoke, cinematic editorial.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'instagram_story_9x16', 'linkedin_post_1_91x1'],
    supportedIndustries: ['branding_agency', 'marketing_agency', 'saas', 'software_company', 'fashion', 'gym'],
    supportedArchetypes: ['dark_noir', 'authority_power', 'founder_ambition', 'minimal_editorial'],
    canWorkWithoutImage: true,
    variations: [
      { id: 'A', label: 'Dark Portrait / Noir Type', description: 'Dark portrait/scene, huge condensed type', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Full Noir Bleed', description: 'B&W full bleed, smoke, bottom type', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'C', label: 'Noir Editorial', description: 'Vertical noir split, editorial typography', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['blackWhite', 'darkNoirGradient', 'smokeOverlay', 'highContrast', 'vignette', 'boldTypeTexture'],
    textLimits: { headline: 40, subheadline: 90, body: 140, tags: 0 },
    logoPlacement: 'top-left', ctaPlacement: 'button-box', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Impact', 'Arial Black', sans-serif",
    defaultColors: { background: '#050505', text: '#ffffff', accent: '#ffffff' },
  },
  transformation_offer: {
    id: 'transformation_offer', name: 'Transformation Offer',
    description: 'Before/after energy. High-contrast, bold results-driven copy.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'instagram_story_9x16'],
    supportedIndustries: ['gym', 'fitness_coach', 'salon', 'coaching_institute', 'dermatologist'],
    supportedArchetypes: ['transformation', 'bold_offer', 'youth_energy'],
    canWorkWithoutImage: false,
    variations: [
      { id: 'A', label: 'Before/After Side', description: 'Strong transformation imagery, results type', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Full Bleed Action', description: 'Action shot full bleed, bold bottom results', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'C', label: 'Energy Editorial', description: 'High-energy split with stat-forward copy', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['highContrast', 'boldTypeTexture', 'vignette', 'darkNoirGradient'],
    textLimits: { headline: 40, subheadline: 90, body: 140, tags: 4 },
    logoPlacement: 'top-left', ctaPlacement: 'bottom-bar', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Arial Black', 'Impact', sans-serif",
    defaultColors: { background: '#111111', text: '#ffffff', accent: '#FFD700' },
  },
  festival_celebration: {
    id: 'festival_celebration', name: 'Festival Celebration',
    description: 'Festive warm glow, floral/occasion visual, gold accents.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'instagram_story_9x16', 'whatsapp_status_9x16'],
    supportedIndustries: ['sweets_shop', 'restaurant', 'event_planner', 'wedding_planner', 'flower_shop', 'jewellery'],
    supportedArchetypes: ['celebration', 'festival_emotion', 'community_first'],
    canWorkWithoutImage: false,
    variations: [
      { id: 'A', label: 'Festival Image / Celebration Text', description: 'Festive scene, warm text panel', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Full Festival Bleed', description: 'Full colourful bleed, ornamental bottom text', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'C', label: 'Gold Occasion Editorial', description: 'Gold border, ornament, festive type', layout: 'full-bleed-bottom-panel', textPosition: 'center' },
    ],
    effects: ['festivalWarmGlow', 'goldAccent', 'subtleGrain', 'warmCreamGradient', 'premiumBorder'],
    textLimits: { headline: 46, subheadline: 110, body: 180, tags: 3 },
    logoPlacement: 'top-left', ctaPlacement: 'inline-text', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Georgia', serif",
    defaultColors: { background: '#1A0A00', text: '#FFF8E7', accent: '#C9A84C' },
  },
  testimonial_proof: {
    id: 'testimonial_proof', name: 'Testimonial & Proof',
    description: 'Review/testimonial layout. Clean, trust-forward, quote as hero.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'instagram_story_9x16'],
    supportedIndustries: ['clinic', 'school', 'coaching_institute', 'salon', 'gym', 'real_estate', 'consultant'],
    supportedArchetypes: ['trust_proof', 'care_ritual', 'community_first'],
    canWorkWithoutImage: true,
    variations: [
      { id: 'A', label: 'Quote Left / Image Right', description: 'Large quote text left, reviewer image right', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Full Bleed Testimonial', description: 'Image BG, centred quote overlay', layout: 'full-bleed-bottom-panel', textPosition: 'center' },
      { id: 'C', label: 'Clean Quote Card', description: 'White card, serif quote, star rating', layout: 'text-only', textPosition: 'center' },
    ],
    effects: ['warmCreamGradient', 'subtleGrain', 'premiumBorder'],
    textLimits: { headline: 80, subheadline: 100, body: 200, tags: 2 },
    logoPlacement: 'top-left', ctaPlacement: 'inline-text', watermarkPlacement: 'bottom-center',
    imageTreatment: 'background-60', fontStack: "'Georgia', serif",
    defaultColors: { background: '#FAFAFA', text: '#1A1A1A', accent: '#C9A84C' },
  },
  minimal_proof_card: {
    id: 'minimal_proof_card', name: 'Minimal Proof Card',
    description: 'Clean minimal, white space, stat-forward or credential-forward.',
    supportedSizes: ['instagram_square_1x1', 'instagram_post_4x5', 'linkedin_post_1_91x1'],
    supportedIndustries: ['skincare', 'spa', 'yoga_studio', 'photographer', 'architecture', 'interior_design'],
    supportedArchetypes: ['minimal_editorial', 'trust_proof', 'professional_trust'],
    canWorkWithoutImage: true,
    variations: [
      { id: 'A', label: 'Image Right / Minimal Left', description: 'Minimal white left panel, clean image right', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Clean Center', description: 'Centered minimal stat/credential, white BG', layout: 'text-only', textPosition: 'center' },
      { id: 'C', label: 'Minimal Editorial', description: 'Vertical line split, restrained serif type', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['subtleGrain', 'premiumBorder', 'verticalDivider'],
    textLimits: { headline: 46, subheadline: 110, body: 200, tags: 3 },
    logoPlacement: 'top-left', ctaPlacement: 'inline-text', watermarkPlacement: 'bottom-center',
    imageTreatment: 'right-panel', fontStack: "'Georgia', serif",
    defaultColors: { background: '#FFFFFF', text: '#111111', accent: '#111111' },
  },
  local_market_story: {
    id: 'local_market_story', name: 'Local Market Story',
    description: 'Street-level local pride. Market texture, city specificity, bold vernacular.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'whatsapp_status_9x16'],
    supportedIndustries: ['local_retail_store', 'restaurant', 'grocery', 'cafe', 'coaching_institute', 'gym'],
    supportedArchetypes: ['local_pride', 'community_first', 'legacy_story'],
    canWorkWithoutImage: false,
    variations: [
      { id: 'A', label: 'Street Image / Local Copy Left', description: 'Local scene right, bold city-proud text left', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Full Local Bleed', description: 'Street scene full bleed, gritty bottom text', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'C', label: 'Vernacular Editorial', description: 'Street texture, bold type, safe editorial composition', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['localStreetContrast', 'grittyPaperTexture', 'vignette', 'boldTypeTexture'],
    textLimits: { headline: 40, subheadline: 90, body: 160, tags: 4 },
    logoPlacement: 'top-left', ctaPlacement: 'bottom-bar', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Arial Black', Arial, sans-serif",
    defaultColors: { background: '#111111', text: '#ffffff', accent: '#FFD700' },
  },
  premium_editorial_layout: {
    id: 'premium_editorial_layout', name: 'Premium Editorial Layout',
    description: 'Premium full-bleed/editorial layout with safe text placement.',
    supportedSizes: ['instagram_square_1x1', 'linkedin_post_1_91x1', 'website_hero_16x9'],
    supportedIndustries: ['real_estate', 'architecture', 'interior_design', 'hotel', 'resort'],
    supportedArchetypes: ['premium_luxury', 'minimal_editorial', 'authority_power'],
    canWorkWithoutImage: false,
    variations: [
      { id: 'A', label: 'Image Right / Type Left', description: 'Left type panel, right full image', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Image Editorial / Type Overlay', description: 'Left full image, right type panel', layout: 'full-bleed-bottom-panel', textPosition: 'right' },
      { id: 'C', label: 'Premium Diagonal Editorial', description: 'Clean editorial typography with protected image space', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['warmCreamGradient', 'subtleGrain', 'premiumBorder', 'verticalDivider'],
    textLimits: { headline: 50, subheadline: 120, body: 200, tags: 3 },
    logoPlacement: 'top-left', ctaPlacement: 'button-box', watermarkPlacement: 'bottom-center',
    imageTreatment: 'right-panel', fontStack: "'Georgia', serif",
    defaultColors: { background: '#F4EBDD', text: '#111111', accent: '#B58A3B' },
  },
  website_hero_campaign: {
    id: 'website_hero_campaign', name: 'Website Hero Campaign',
    description: 'Wide hero for website/LinkedIn. Bold headline, spacious layout.',
    supportedSizes: ['website_hero_16x9', 'linkedin_post_1_91x1', 'linkedin_banner'],
    supportedIndustries: ['hotel', 'resort', 'real_estate', 'startup', 'school', 'hospital', 'software_company'],
    supportedArchetypes: ['premium_luxury', 'authority_power', 'community_first', 'founder_ambition'],
    canWorkWithoutImage: false,
    variations: [
      { id: 'A', label: 'Full Bleed Hero Left Text', description: 'Full bleed image, left-aligned big headline', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
      { id: 'B', label: 'Center Hero Text', description: 'Full bleed, centered hero headline', layout: 'full-bleed-bottom-panel', textPosition: 'center' },
      { id: 'C', label: 'Editorial Banner Hero', description: 'Balanced hero with protected text area and image focus', layout: 'image-right-text-left', textPosition: 'left' },
    ],
    effects: ['darkNoirGradient', 'subtleGrain', 'vignette'],
    textLimits: { headline: 60, subheadline: 140, body: 250, tags: 0 },
    logoPlacement: 'top-left', ctaPlacement: 'button-box', watermarkPlacement: 'bottom-right',
    imageTreatment: 'full-bleed', fontStack: "'Georgia', 'Arial Black', sans-serif",
    defaultColors: { background: '#0a0a0e', text: '#ffffff', accent: '#C9A84C' },
  },
  craftsmanship_detail: {
    id: 'craftsmanship_detail', name: 'Craftsmanship Detail',
    description: 'Artisan close-up focus. Texture, material, hands-and-craft aesthetic.',
    supportedSizes: ['instagram_square_1x1', 'instagram_post_4x5', 'whatsapp_portfolio_3x4'],
    supportedIndustries: ['jewellery', 'furniture', 'bakery', 'boutique', 'leather'],
    supportedArchetypes: ['craftsmanship', 'legacy_story', 'premium_luxury'],
    canWorkWithoutImage: false,
    variations: [
      { id: 'A', label: 'Macro Detail / Craft Copy', description: 'Close-up macro, craft-focused type', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Full Macro Bleed', description: 'Full texture bleed, minimal overlay type', layout: 'full-bleed-bottom-panel', textPosition: 'bottom' },
      { id: 'C', label: 'Artisan Editorial', description: 'Full-bleed craft image with serif detail type', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['warmCreamGradient', 'subtleGrain', 'vignette', 'premiumBorder'],
    textLimits: { headline: 40, subheadline: 90, body: 160, tags: 3 },
    logoPlacement: 'top-left', ctaPlacement: 'inline-text', watermarkPlacement: 'bottom-center',
    imageTreatment: 'full-bleed', fontStack: "'Georgia', serif",
    defaultColors: { background: '#F5F0E8', text: '#2C1810', accent: '#8B4513' },
  },
  startup_pitch_visual: {
    id: 'startup_pitch_visual', name: 'Startup Pitch Visual',
    description: 'Clean metric-forward startup card. Numbers big, type sharp.',
    supportedSizes: ['linkedin_post_1_91x1', 'instagram_post_4x5', 'instagram_square_1x1'],
    supportedIndustries: ['startup', 'saas', 'app_development', 'edtech'],
    supportedArchetypes: ['founder_ambition', 'growth_proof', 'authority_power'],
    canWorkWithoutImage: true,
    variations: [
      { id: 'A', label: 'Metric Hero Left', description: 'Big number left, context right', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'Dark Metric Full', description: 'Dark card, white metric, supporting type', layout: 'text-only', textPosition: 'center' },
      { id: 'C', label: 'Split Pitch', description: 'Full-bleed pitch with key metric', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['founderBlueGlow', 'darkNoirGradient', 'boldTypeTexture'],
    textLimits: { headline: 40, subheadline: 90, body: 160, tags: 4 },
    logoPlacement: 'top-left', ctaPlacement: 'button-box', watermarkPlacement: 'bottom-center',
    imageTreatment: 'none', fontStack: "'Arial Black', Arial, sans-serif",
    defaultColors: { background: '#040815', text: '#ffffff', accent: '#3B82F6' },
  },
  clean_brand_audit: {
    id: 'clean_brand_audit', name: 'Clean Brand Audit',
    description: 'Professional clean card. Whitespace, credential list, trust-forward.',
    supportedSizes: ['instagram_post_4x5', 'instagram_square_1x1', 'linkedin_post_1_91x1'],
    supportedIndustries: ['ca_accountant', 'consultant', 'clinic', 'school'],
    supportedArchetypes: ['professional_trust', 'trust_proof', 'minimal_editorial'],
    canWorkWithoutImage: true,
    variations: [
      { id: 'A', label: 'Clean List / Image Side', description: 'Service/credential list left, image right', layout: 'image-right-text-left', textPosition: 'left' },
      { id: 'B', label: 'White Credential Card', description: 'All white, centred credential proof', layout: 'text-only', textPosition: 'center' },
      { id: 'C', label: 'Split Professional', description: 'Professional blue/white editorial tone', layout: 'full-bleed-bottom-panel', textPosition: 'left' },
    ],
    effects: ['subtleGrain', 'premiumBorder'],
    textLimits: { headline: 46, subheadline: 110, body: 200, tags: 5 },
    logoPlacement: 'top-left', ctaPlacement: 'button-box', watermarkPlacement: 'bottom-center',
    imageTreatment: 'right-panel', fontStack: "Arial, sans-serif",
    defaultColors: { background: '#FFFFFF', text: '#1A2C3D', accent: '#2E7DB2' },
  },
}

export function getTemplateById(id: string): TemplateDef | null {
  return TEMPLATES[id] ?? null
}

// Explicit industry → template routing to prevent over-routing to legacy_story_poster
const INDUSTRY_TEMPLATE_MAP: Record<string, string> = {
  jewellery: 'luxury_editorial',
  jewellery_wholesaler: 'luxury_editorial',
  branding_agency: 'dark_power_campaign',
  marketing_agency: 'dark_power_campaign',
  consultant: 'dark_power_campaign',
  startup: 'startup_pitch_visual',
  software_company: 'startup_pitch_visual',
  clinic: 'care_wellness',
  hospital: 'care_wellness',
  gym: 'transformation_offer',
  fitness: 'transformation_offer',
  restaurant: 'bold_offer_card',
  food_beverage: 'bold_offer_card',
  cafe: 'local_market_story',
  automotive: 'dark_power_campaign',
  hotel: 'luxury_editorial',
  spa: 'care_wellness',
  fashion: 'luxury_editorial',
  boutique: 'luxury_editorial',
  education: 'testimonial_proof',
  traditional_trade: 'legacy_story_poster',
  heritage_brand: 'legacy_story_poster',
}

const ARCHETYPE_TEMPLATE_MAP: Record<string, string> = {
  authority_power: 'dark_power_campaign',
  dark_noir: 'dark_agency_noir',
  premium_luxury: 'luxury_editorial',
  care_ritual: 'care_wellness',
  founder_ambition: 'founder_ambition',
  transformation: 'transformation_offer',
  bold_offer: 'bold_offer_card',
  celebration: 'festival_celebration',
  trust_proof: 'testimonial_proof',
  heritage_india: 'heritage_city_campaign',
  local_pride: 'local_market_story',
  legacy_story: 'legacy_story_poster',
  minimal_editorial: 'minimal_proof_card',
  youth_energy: 'dark_power_campaign',
  community_first: 'local_market_story',
}

export function selectTemplate(industryId: string, archetypeId: string): TemplateDef {
  // 1. Explicit industry priority routing — prevents over-routing to legacy_story_poster
  if (INDUSTRY_TEMPLATE_MAP[industryId]) {
    const t = TEMPLATES[INDUSTRY_TEMPLATE_MAP[industryId]]
    if (t) return t
  }

  // 2. Explicit archetype routing
  if (ARCHETYPE_TEMPLATE_MAP[archetypeId]) {
    const t = TEMPLATES[ARCHETYPE_TEMPLATE_MAP[archetypeId]]
    if (t) return t
  }

  // 3. Find template that supports both industry and archetype
  const candidates = Object.values(TEMPLATES).filter(t => {
    const supportsIndustry = t.supportedIndustries.includes('all') || t.supportedIndustries.includes(industryId)
    const supportsArchetype = t.supportedArchetypes.includes(archetypeId)
    return supportsIndustry && supportsArchetype
  })
  if (candidates.length > 0) return candidates[0]

  // 4. Fallback: just industry match
  const industryMatch = Object.values(TEMPLATES).find(t =>
    t.supportedIndustries.includes('all') || t.supportedIndustries.includes(industryId)
  )
  if (industryMatch) return industryMatch

  return TEMPLATES['clean_typography_offer']
}

export function selectVariation(template: TemplateDef, prompt: string): TemplateVariation {
  const lower = prompt.toLowerCase()

  // Split layouts were damaging subjects/cropping in the renderer.
  // Even when the user asks for split/side-by-side, use a safer full-bleed editorial layout.
  if (['full bleed', 'background image', 'cinematic', 'editorial', 'split', 'half', 'side by side', 'panel'].some(k => lower.includes(k))) return 'B'

  // Template-specific defaults — prefer stable A/B layouts for consistent premium results.
  if (['dark_power_campaign', 'founder_ambition', 'startup_pitch_visual', 'luxury_editorial', 'testimonial_proof'].includes(template.id)) return 'B'
  if (['festival_celebration', 'heritage_city_campaign', 'legacy_story_poster'].includes(template.id)) return 'B'

  return 'A'
}
