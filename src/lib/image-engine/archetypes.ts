// src/lib/image-engine/archetypes.ts
// Campaign archetypes defining visual language, copy style, and query boosters.

export interface ArchetypeDef {
  id: string
  label: string
  emotion: string
  bestForIndustries: string[]
  visualLanguage: string
  copyStyle: string
  pexelsQueryBoosters: string[]
  unsplashQueryBoosters: string[]
  preferredEffects: string[]
  typographyMood: string
  recommendedTemplates: string[]
  avoidVisuals: string[]
}

export const ARCHETYPES: Record<string, ArchetypeDef> = {
  premium_luxury: {
    id: 'premium_luxury', label: 'Premium Luxury',
    emotion: 'desire, status, elegance, aspiration',
    bestForIndustries: ['jewellery', 'jewellery_wholesaler', 'fashion', 'boutique', 'hotel', 'resort', 'interior_design', 'spa', 'cosmetics', 'real_estate'],
    visualLanguage: 'Cream/black editorial, elegant serif, product-focused warm lighting, bokeh, silk textures',
    copyStyle: 'Short, evocative, poetic — never salesly. Drop words, not paragraphs.',
    pexelsQueryBoosters: ['luxury', 'elegant', 'premium', 'editorial', 'warm light', 'gold', 'silk'],
    unsplashQueryBoosters: ['luxury editorial', 'elegant minimal', 'premium gold'],
    preferredEffects: ['warmCreamGradient', 'luxuryGoldWash', 'subtleGrain', 'vignette', 'premiumBorder'],
    typographyMood: 'serif-display',
    recommendedTemplates: ['luxury_editorial', 'legacy_story_poster', 'product_hero'],
    avoidVisuals: ['crowd', 'busy market', 'discount banners', 'neon signs'],
  },
  legacy_story: {
    id: 'legacy_story', label: 'Legacy & Story',
    emotion: 'trust, nostalgia, family, heritage, roots',
    bestForIndustries: ['restaurant', 'sweets_shop', 'bakery', 'jewellery', 'local_retail_store', 'agriculture', 'dairy'],
    visualLanguage: 'Vintage Indian warmth, paper grain, old objects, family scenes, warm sepia',
    copyStyle: 'Narrative, storytelling, emotional memory triggers. "Since 1985", "Our grandfather started..."',
    pexelsQueryBoosters: ['heritage', 'vintage', 'old', 'warm light', 'family', 'tradition', 'handmade'],
    unsplashQueryBoosters: ['heritage vintage warm', 'tradition family', 'antique warm'],
    preferredEffects: ['paperTexture', 'heavyGrain', 'sepiaHeritage', 'creamPaperWash', 'vignette'],
    typographyMood: 'serif-story',
    recommendedTemplates: ['legacy_story_poster', 'heritage_city_campaign', 'local_market_story'],
    avoidVisuals: ['ultra-modern', 'neon', 'futuristic', 'abstract tech'],
  },
  local_pride: {
    id: 'local_pride', label: 'Local Pride',
    emotion: 'city pride, roots, belonging, local credibility',
    bestForIndustries: ['restaurant', 'cafe', 'gym', 'coaching_institute', 'local_retail_store', 'real_estate', 'clinic'],
    visualLanguage: 'Street texture, shopfront, bold vernacular confidence, local city landmarks, market texture',
    copyStyle: 'Proud, direct, city-specific. "Kanpur ka apna..." Bold CTAs.',
    pexelsQueryBoosters: ['city street India', 'local market', 'Indian shopfront', 'city people'],
    unsplashQueryBoosters: ['indian city street', 'local market vibrant', 'city pride'],
    preferredEffects: ['localStreetContrast', 'subtleGrain', 'boldTypeTexture', 'vignette'],
    typographyMood: 'condensed-bold',
    recommendedTemplates: ['local_market_story', 'heritage_city_campaign', 'bold_offer_card'],
    avoidVisuals: ['sterile white studio', 'foreign city', 'western-only aesthetic'],
  },
  founder_ambition: {
    id: 'founder_ambition', label: 'Founder Ambition',
    emotion: 'growth, speed, ambition, future, disruption',
    bestForIndustries: ['startup', 'saas', 'app_development', 'marketing_agency', 'consultant', 'coworking_space'],
    visualLanguage: 'Dark workspace, laptop glow, gradient light, cityscape at night, future-facing editorial',
    copyStyle: 'Bold, forward, punchy. Stats. "We built X for Y." Direct founder voice.',
    pexelsQueryBoosters: ['entrepreneur laptop dark', 'startup founder workspace', 'night city ambition', 'dark office glow'],
    unsplashQueryBoosters: ['founder workspace dark', 'startup ambition', 'entrepreneur night'],
    preferredEffects: ['founderBlueGlow', 'darkNoirGradient', 'subtleGrain', 'vignette'],
    typographyMood: 'sans-modern',
    recommendedTemplates: ['founder_ambition', 'dark_agency_noir', 'startup_pitch_visual'],
    avoidVisuals: ['cheesy clipart', 'stock smile faces', 'bright daylight office'],
  },
  care_ritual: {
    id: 'care_ritual', label: 'Care & Ritual',
    emotion: 'safety, comfort, relief, nurturing, trust',
    bestForIndustries: ['doctor', 'clinic', 'hospital', 'dentist', 'pharmacy', 'skincare', 'spa', 'yoga_studio', 'tiffin_service'],
    visualLanguage: 'Soft warm light, clean whites/blues, calm negative space, hands, care gestures',
    copyStyle: 'Gentle, reassuring, empathetic. "We care." "Your wellbeing, our priority."',
    pexelsQueryBoosters: ['soft light', 'clean white', 'calm hands', 'gentle care', 'wellness minimal'],
    unsplashQueryBoosters: ['soft light clean', 'wellness calm', 'care gentle'],
    preferredEffects: ['softWellnessGlow', 'warmCreamGradient', 'subtleGrain'],
    typographyMood: 'serif-calm',
    recommendedTemplates: ['care_wellness', 'minimal_proof_card', 'testimonial_proof'],
    avoidVisuals: ['dark moody', 'aggressive contrast', 'industrial', 'chaotic busy'],
  },
  transformation: {
    id: 'transformation', label: 'Transformation',
    emotion: 'progress, discipline, change, before/after results',
    bestForIndustries: ['gym', 'fitness_coach', 'salon', 'coaching_institute', 'marketing_agency', 'dermatologist'],
    visualLanguage: 'Bold contrast, motion lines, high-energy text, before/after, dynamic posture',
    copyStyle: 'Motivational, results-driven. "Change begins." "In 30 days." Numbers and proof.',
    pexelsQueryBoosters: ['transformation progress', 'before after', 'athlete motion', 'bold contrast', 'energy dynamic'],
    unsplashQueryBoosters: ['transformation dynamic', 'fitness energy', 'change progress'],
    preferredEffects: ['highContrast', 'boldTypeTexture', 'vignette', 'darkNoirGradient'],
    typographyMood: 'condensed-bold',
    recommendedTemplates: ['transformation_offer', 'before_after_story', 'bold_offer_card'],
    avoidVisuals: ['gentle soft', 'pastel light', 'static objects only'],
  },
  craftsmanship: {
    id: 'craftsmanship', label: 'Craftsmanship',
    emotion: 'skill, detail, handmade quality, mastery',
    bestForIndustries: ['jewellery', 'furniture', 'bakery', 'printing_press', 'manufacturer', 'boutique', 'textile'],
    visualLanguage: 'Hands, tools, workshop, macro details, material texture, craft in process',
    copyStyle: 'Detail-proud. "Made by hand." "Every stitch counts." Specifics over generics.',
    pexelsQueryBoosters: ['craft hands detail', 'handmade workshop', 'artisan tools', 'texture macro', 'skill craft close up'],
    unsplashQueryBoosters: ['craftsman hands', 'artisan workshop', 'handmade detail'],
    preferredEffects: ['subtleGrain', 'paperTexture', 'warmCreamGradient', 'vignette'],
    typographyMood: 'serif-display',
    recommendedTemplates: ['craftsmanship_detail', 'product_hero', 'legacy_story_poster'],
    avoidVisuals: ['mass production factory', 'digital abstract', 'generic stock office'],
  },
  bold_offer: {
    id: 'bold_offer', label: 'Bold Offer',
    emotion: 'urgency, action, limited time, value',
    bestForIndustries: ['all'],
    visualLanguage: 'Strong headline dominates, large CTA, high-contrast, readable at a glance',
    copyStyle: 'Direct, urgent. Numbers, offers, deadlines. "50% off." "Call now." "Today only."',
    pexelsQueryBoosters: ['bold minimal clean background', 'flat lay product offer'],
    unsplashQueryBoosters: ['clean minimal bold', 'product flat lay clean'],
    preferredEffects: ['highContrast', 'boldTypeTexture', 'darkNoirGradient'],
    typographyMood: 'condensed-offer',
    recommendedTemplates: ['bold_offer_card', 'clean_typography_offer', 'service_grid_premium'],
    avoidVisuals: ['cluttered busy', 'many small elements', 'low contrast'],
  },
  authority_power: {
    id: 'authority_power', label: 'Authority & Power',
    emotion: 'confidence, dominance, expertise, gravity',
    bestForIndustries: ['branding_agency', 'marketing_agency', 'consultant', 'software_company', 'builder', 'hospital', 'ca_accountant'],
    visualLanguage: 'Dark editorial, single subject, dramatic lighting, architectural lines, powerful negative space',
    copyStyle: 'Declarative, commanding. Short sentences. No softening. "We don\'t explain. We deliver."',
    pexelsQueryBoosters: ['dark portrait dramatic light', 'businessman suit moody', 'authority dark background', 'cinematic portrait shadow', 'power architecture'],
    unsplashQueryBoosters: ['dramatic portrait dark', 'authority business', 'cinematic dark editorial'],
    preferredEffects: ['darkNoirGradient', 'blackWhite', 'highContrast', 'smokeOverlay', 'vignette'],
    typographyMood: 'condensed-dark',
    recommendedTemplates: ['dark_power_campaign', 'dark_agency_noir', 'newspaper_editorial'],
    avoidVisuals: ['soft pastel', 'smiling stock photos', 'bright cheerful'],
  },
  celebration: {
    id: 'celebration', label: 'Celebration & Festival',
    emotion: 'joy, festivity, occasion, togetherness',
    bestForIndustries: ['sweets_shop', 'event_planner', 'wedding_planner', 'flower_shop', 'restaurant', 'hotel', 'travel_agency'],
    visualLanguage: 'Warm festival light, floral, colours, occasion decoration, family/community',
    copyStyle: 'Joyful, warm, festive greetings. Diwali, Eid, Christmas, wedding. "Celebrate with us."',
    pexelsQueryBoosters: ['festival celebration diwali lights', 'wedding flowers joy', 'festive colorful decoration'],
    unsplashQueryBoosters: ['festival lights celebration', 'wedding joy', 'festive decor warm'],
    preferredEffects: ['festivalWarmGlow', 'warmCreamGradient', 'goldAccent', 'subtleGrain'],
    typographyMood: 'serif-festive',
    recommendedTemplates: ['festival_celebration', 'product_hero', 'legacy_story_poster'],
    avoidVisuals: ['dark moody', 'corporate cold', 'industrial'],
  },
  trust_proof: {
    id: 'trust_proof', label: 'Trust & Social Proof',
    emotion: 'credibility, reviews, reassurance, authority through evidence',
    bestForIndustries: ['clinic', 'school', 'coaching_institute', 'pharmacy', 'ca_accountant', 'real_estate', 'consultant'],
    visualLanguage: 'Professional portrait, testimonial layout, clean corporate, results-focused',
    copyStyle: 'Evidence-led. Numbers, testimonials, years. "Trusted by 500+ families." "4.9 stars."',
    pexelsQueryBoosters: ['professional testimonial portrait', 'business trust handshake', 'review stars satisfaction'],
    unsplashQueryBoosters: ['professional business trust', 'customer success', 'handshake professional'],
    preferredEffects: ['warmCreamGradient', 'subtleGrain', 'premiumBorder'],
    typographyMood: 'sans-trust',
    recommendedTemplates: ['testimonial_proof', 'minimal_proof_card', 'clean_brand_audit'],
    avoidVisuals: ['chaotic untrustworthy', 'dark noir', 'aggressive'],
  },
  minimal_editorial: {
    id: 'minimal_editorial', label: 'Minimal Editorial',
    emotion: 'sophistication, restraint, elegance through simplicity',
    bestForIndustries: ['skincare', 'cosmetics', 'architecture', 'interior_design', 'yoga_studio', 'boutique', 'photographer'],
    visualLanguage: 'Lots of white space, single hero element, precise typography, monochromatic or duotone',
    copyStyle: 'Sparse, confident. Less is more. A single line carries everything.',
    pexelsQueryBoosters: ['minimal clean white', 'single product white background', 'editorial minimal'],
    unsplashQueryBoosters: ['minimal clean editorial', 'white space product', 'monochrome elegant'],
    preferredEffects: ['subtleGrain', 'premiumBorder', 'verticalDivider'],
    typographyMood: 'serif-minimal',
    recommendedTemplates: ['clean_brand_audit', 'minimal_proof_card', 'clean_typography_offer'],
    avoidVisuals: ['busy collage', 'many colours', 'crowded text'],
  },
  dark_noir: {
    id: 'dark_noir', label: 'Dark Noir',
    emotion: 'mystery, cinematic, underground authority, cool factor',
    bestForIndustries: ['branding_agency', 'marketing_agency', 'saas', 'app_development', 'fashion', 'gym'],
    visualLanguage: 'Black-and-white, high contrast, smoke/fog, silhouette, editorial depth, shadows',
    copyStyle: 'Cinematic, sparse, cryptic. "Some brands don\'t follow trends. They set them."',
    pexelsQueryBoosters: ['black white portrait dramatic', 'cinematic smoke dark', 'silhouette dramatic', 'moody noir fog'],
    unsplashQueryBoosters: ['dark cinematic noir', 'dramatic black white', 'smoke shadow portrait'],
    preferredEffects: ['blackWhite', 'smokeOverlay', 'darkNoirGradient', 'highContrast', 'vignette'],
    typographyMood: 'condensed-dark',
    recommendedTemplates: ['dark_power_campaign', 'dark_agency_noir', 'newspaper_editorial'],
    avoidVisuals: ['bright happy colours', 'cheerful smiling', 'pastel soft'],
  },
  growth_proof: {
    id: 'growth_proof', label: 'Growth & Proof',
    emotion: 'momentum, results, scaling, pride in numbers',
    bestForIndustries: ['startup', 'saas', 'marketing_agency', 'coaching_institute', 'fitness_coach'],
    visualLanguage: 'Data visualization feel, upward trajectory, charts-as-metaphor, team success',
    copyStyle: 'Metric-driven. "2x growth." "From 0 to 10,000 users." "The numbers don\'t lie."',
    pexelsQueryBoosters: ['growth chart success', 'team celebrating win', 'business growth upward', 'success milestone'],
    unsplashQueryBoosters: ['business growth success', 'data achievement', 'upward momentum'],
    preferredEffects: ['founderBlueGlow', 'subtleGrain', 'vignette'],
    typographyMood: 'sans-modern',
    recommendedTemplates: ['growth_proof', 'case_study_editorial', 'startup_pitch_visual'],
    avoidVisuals: ['static objects', 'no-energy scenes', 'slow aesthetic'],
  },
  community_first: {
    id: 'community_first', label: 'Community First',
    emotion: 'belonging, togetherness, grassroots, shared identity',
    bestForIndustries: ['school', 'coaching_institute', 'yoga_studio', 'pet_care', 'coworking_space', 'grocery', 'NGO'],
    visualLanguage: 'Group scenes, diverse people, community gatherings, warmth, shared spaces',
    copyStyle: 'Inclusive, warm, "we" language. "Our community." "Together we..."',
    pexelsQueryBoosters: ['community group people together', 'diverse team workspace', 'community gathering warm'],
    unsplashQueryBoosters: ['community together diverse', 'group people warm', 'team community'],
    preferredEffects: ['warmCreamGradient', 'softWellnessGlow', 'subtleGrain'],
    typographyMood: 'sans-friendly',
    recommendedTemplates: ['community_first', 'testimonial_proof', 'care_wellness'],
    avoidVisuals: ['solo cold corporate', 'dark moody', 'aggressive'],
  },
  festival_emotion: {
    id: 'festival_emotion', label: 'Festival & Emotion',
    emotion: 'occasion, religious/cultural pride, family, emotional warmth',
    bestForIndustries: ['sweets_shop', 'restaurant', 'flower_shop', 'event_planner', 'jewellery', 'boutique'],
    visualLanguage: 'Diwali diyas, rangoli, marigold garlands, Eid crescent, Christmas star, festive colour',
    copyStyle: 'Heartfelt seasonal messaging. "Wishing you joy, peace, and celebration."',
    pexelsQueryBoosters: ['diwali festival lights decoration', 'indian festival celebration colourful', 'festival family joy'],
    unsplashQueryBoosters: ['diwali celebration', 'festival colourful', 'indian festival joy'],
    preferredEffects: ['festivalWarmGlow', 'goldAccent', 'warmCreamGradient'],
    typographyMood: 'serif-festive',
    recommendedTemplates: ['festival_celebration', 'product_hero', 'bold_offer_card'],
    avoidVisuals: ['dark noir', 'corporate cold', 'minimal white only'],
  },
  heritage_india: {
    id: 'heritage_india', label: 'Heritage India',
    emotion: 'pride, roots, ancient legacy, Indian identity, timelessness',
    bestForIndustries: ['agriculture', 'jewellery', 'restaurant', 'sweets_shop', 'local_retail_store', 'school'],
    visualLanguage: 'Indian heritage buildings, river ghats, old city streets, sepia-compatible, border ornaments',
    copyStyle: 'Pride of origin. Hindi/Urdu/regional touches. "Hamari virasat." Local city name.',
    pexelsQueryBoosters: ['Indian heritage building architecture', 'old city India ghat', 'historic India architecture street', 'Indian river ghat heritage'],
    unsplashQueryBoosters: ['indian heritage', 'old city india', 'historic architecture india'],
    preferredEffects: ['sepiaHeritage', 'paperTexture', 'creamPaperWash', 'agedPosterTexture', 'premiumBorder'],
    typographyMood: 'serif-heritage',
    recommendedTemplates: ['heritage_city_campaign', 'legacy_story_poster', 'local_market_story'],
    avoidVisuals: ['ultra-modern western', 'neon generic', 'futuristic sci-fi'],
  },
  professional_trust: {
    id: 'professional_trust', label: 'Professional Trust',
    emotion: 'reliability, expertise, competence, professional gravity',
    bestForIndustries: ['ca_accountant', 'consultant', 'hospital', 'school', 'software_company', 'architecture'],
    visualLanguage: 'Clean professional portrait or space, corporate palette, authority signals without arrogance',
    copyStyle: 'Measured, assured, factual. Credentials, years, certifications.',
    pexelsQueryBoosters: ['professional portrait confidence', 'corporate clean office', 'business professional desk'],
    unsplashQueryBoosters: ['professional portrait', 'corporate office clean', 'business expert'],
    preferredEffects: ['warmCreamGradient', 'premiumBorder', 'subtleGrain'],
    typographyMood: 'sans-professional',
    recommendedTemplates: ['professional_trust', 'clean_brand_audit', 'service_grid_premium'],
    avoidVisuals: ['dark moody noir', 'aggressive energy', 'casual unpolished'],
  },
  youth_energy: {
    id: 'youth_energy', label: 'Youth Energy',
    emotion: 'vibrance, speed, fun, modern, trend-forward',
    bestForIndustries: ['gym', 'fitness_coach', 'gaming_cafe', 'app_development', 'edtech', 'fashion'],
    visualLanguage: 'Bright saturated, dynamic angles, street culture, neon accents, sports aesthetics',
    copyStyle: 'Short punchy. Slang-adjacent. No corporate stiffness. "Let\'s go." "No excuses."',
    pexelsQueryBoosters: ['youth energy vibrant', 'sport dynamic colorful', 'young people energy'],
    unsplashQueryBoosters: ['youth vibrant energy', 'sport dynamic', 'young modern'],
    preferredEffects: ['highContrast', 'boldTypeTexture', 'redAccent'],
    typographyMood: 'condensed-youth',
    recommendedTemplates: ['transformation_offer', 'bold_offer_card', 'dark_power_campaign'],
    avoidVisuals: ['boring corporate', 'muted sepia', 'formal stiff'],
  },
}

export function getArchetypeById(id: string): ArchetypeDef | null {
  return ARCHETYPES[id] ?? null
}

export function matchArchetypeFromIndustryAndPrompt(industryId: string, prompt: string): string {
  const lower = prompt.toLowerCase()
  // Explicit prompt signals override industry
  if (['power', 'authority', 'brand syndicate', 'dominate', 'rule'].some(k => lower.includes(k))) return 'authority_power'
  if (['dark', 'noir', 'cinematic', 'black white', 'moody'].some(k => lower.includes(k))) return 'dark_noir'
  if (['heritage', 'legacy', 'ghat', 'purana', 'history', 'old city'].some(k => lower.includes(k))) return 'heritage_india'
  if (['festival', 'diwali', 'eid', 'christmas', 'holi', 'navratri', 'celebration'].some(k => lower.includes(k))) return 'celebration'
  if (['offer', 'discount', 'sale', 'free', 'limited', 'hurry', 'grab'].some(k => lower.includes(k))) return 'bold_offer'
  if (['trust', 'review', 'rating', 'testimonial', 'proof', 'clients'].some(k => lower.includes(k))) return 'trust_proof'
  if (['minimal', 'clean', 'simple', 'editorial'].some(k => lower.includes(k))) return 'minimal_editorial'
  if (['local', 'city', 'kanpur', 'lucknow', 'mumbai', 'delhi', 'pride'].some(k => lower.includes(k))) return 'local_pride'
  if (['transform', 'before after', 'results', 'change', 'progress'].some(k => lower.includes(k))) return 'transformation'
  if (['craft', 'handmade', 'artisan', 'skill', 'detail'].some(k => lower.includes(k))) return 'craftsmanship'
  if (['founder', 'startup', 'build', 'launch', 'dream', 'ambitious'].some(k => lower.includes(k))) return 'founder_ambition'
  if (['community', 'together', 'join us', 'family', 'people'].some(k => lower.includes(k))) return 'community_first'

  // Fallback to industry defaults
  const industryArchetypeDefaults: Record<string, string> = {
    jewellery: 'premium_luxury', jewellery_wholesaler: 'craftsmanship',
    restaurant: 'legacy_story', cafe: 'local_pride', bakery: 'craftsmanship',
    sweets_shop: 'celebration', gym: 'transformation', fitness_coach: 'transformation',
    yoga_studio: 'care_ritual', doctor: 'care_ritual', clinic: 'care_ritual',
    hospital: 'trust_proof', dentist: 'care_ritual', skincare: 'care_ritual',
    salon: 'transformation', spa: 'premium_luxury', real_estate: 'premium_luxury',
    startup: 'founder_ambition', saas: 'founder_ambition', marketing_agency: 'authority_power',
    branding_agency: 'dark_noir', software_company: 'authority_power',
    coaching_institute: 'transformation', school: 'community_first',
    ca_accountant: 'professional_trust', local_retail_store: 'local_pride',
    agriculture: 'heritage_india', flower_shop: 'celebration', coworking_space: 'community_first',
  }
  return industryArchetypeDefaults[industryId] ?? 'bold_offer'
}
