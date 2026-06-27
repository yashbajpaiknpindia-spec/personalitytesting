// src/lib/image-engine/effects.ts
// Effect presets used by the renderer. Each preset defines CSS/visual instructions.

export interface EffectPreset {
  id: string
  label: string
  cssGradient?: string
  grainOpacity: number
  vignetteStrength: number
  brightnessFilter?: number
  contrastFilter?: number
  saturationFilter?: number
  sepia?: number
  overlayColor?: string
  overlayOpacity?: number
  borderStyle?: string
  description: string
}

export const EFFECTS: Record<string, EffectPreset> = {
  warmCreamGradient: {
    id: 'warmCreamGradient', label: 'Warm Cream Gradient',
    cssGradient: 'linear-gradient(135deg, rgba(244,235,221,0.92) 0%, rgba(244,235,221,0.12) 100%)',
    grainOpacity: 0.14, vignetteStrength: 0.24, contrastFilter: 1.04, saturationFilter: 0.94,
    description: 'Editorial cream overlay, warm grain, gentle vignette',
  },
  darkNoirGradient: {
    id: 'darkNoirGradient', label: 'Dark Noir Gradient',
    cssGradient: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 100%)',
    grainOpacity: 0.18, vignetteStrength: 0.42, contrastFilter: 1.12, saturationFilter: 0.90,
    description: 'Deep dark overlay, cinematic noir, heavy grain',
  },
  blackWhite: {
    id: 'blackWhite', label: 'Black & White',
    saturationFilter: 0, contrastFilter: 1.15, brightnessFilter: 1.05,
    grainOpacity: 0.20, vignetteStrength: 0.35,
    description: 'Full desaturation with boosted contrast for cinematic B&W',
  },
  highContrast: {
    id: 'highContrast', label: 'High Contrast',
    contrastFilter: 1.25, saturationFilter: 1.10, brightnessFilter: 0.95,
    grainOpacity: 0.10, vignetteStrength: 0.28,
    description: 'Punchy high-contrast look for bold offers and energy',
  },
  paperTexture: {
    id: 'paperTexture', label: 'Paper Texture',
    grainOpacity: 0.28, vignetteStrength: 0.30, saturationFilter: 0.85,
    cssGradient: 'linear-gradient(135deg, rgba(245,240,228,0.85) 0%, rgba(245,240,228,0.25) 100%)',
    description: 'Heavy paper-like grain and warm paper overlay',
  },
  heavyGrain: {
    id: 'heavyGrain', label: 'Heavy Grain',
    grainOpacity: 0.32, vignetteStrength: 0.20,
    description: 'Maximum grain for vintage/legacy/printed feel',
  },
  subtleGrain: {
    id: 'subtleGrain', label: 'Subtle Grain',
    grainOpacity: 0.08, vignetteStrength: 0.12,
    description: 'Barely-there grain for premium minimal look',
  },
  vignette: {
    id: 'vignette', label: 'Vignette',
    grainOpacity: 0.05, vignetteStrength: 0.45,
    description: 'Strong edge darkening for focus and depth',
  },
  smokeOverlay: {
    id: 'smokeOverlay', label: 'Smoke Overlay',
    cssGradient: 'radial-gradient(ellipse at 30% 70%, rgba(80,80,90,0.45) 0%, transparent 70%)',
    grainOpacity: 0.22, vignetteStrength: 0.38,
    description: 'Cinematic smoke/fog effect for dark power campaigns',
  },
  blurBehindText: {
    id: 'blurBehindText', label: 'Blur Behind Text Panel',
    grainOpacity: 0.08, vignetteStrength: 0.15,
    description: 'Frosted glass panel behind text zone',
  },
  goldAccent: {
    id: 'goldAccent', label: 'Gold Accent',
    overlayColor: '#C9A84C', overlayOpacity: 0.06,
    grainOpacity: 0.08, vignetteStrength: 0.10,
    description: 'Subtle gold wash for luxury/jewellery',
  },
  redAccent: {
    id: 'redAccent', label: 'Red Accent',
    overlayColor: '#E11D2E', overlayOpacity: 0.05,
    grainOpacity: 0.08, vignetteStrength: 0.10,
    description: 'Subtle red power wash',
  },
  premiumBorder: {
    id: 'premiumBorder', label: 'Premium Border',
    grainOpacity: 0.06, vignetteStrength: 0.08,
    borderStyle: '2px solid rgba(201,168,76,0.6)',
    description: 'Thin gold/premium border inside safe margin',
  },
  verticalDivider: {
    id: 'verticalDivider', label: 'Vertical Divider',
    grainOpacity: 0.06, vignetteStrength: 0.08,
    description: 'Vertical line dividing text and image zones',
  },
  softWellnessGlow: {
    id: 'softWellnessGlow', label: 'Soft Wellness Glow',
    cssGradient: 'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.22) 100%)',
    grainOpacity: 0.05, vignetteStrength: 0.12, saturationFilter: 0.88, contrastFilter: 0.97,
    description: 'Clean soft overlay for healthcare/wellness',
  },
  festivalWarmGlow: {
    id: 'festivalWarmGlow', label: 'Festival Warm Glow',
    cssGradient: 'linear-gradient(135deg, rgba(180,120,20,0.25) 0%, rgba(220,160,40,0.08) 100%)',
    grainOpacity: 0.12, vignetteStrength: 0.18, saturationFilter: 1.12, contrastFilter: 1.05,
    description: 'Warm festive gold glow for celebration occasions',
  },
  luxuryGoldWash: {
    id: 'luxuryGoldWash', label: 'Luxury Gold Wash',
    cssGradient: 'linear-gradient(180deg, rgba(201,168,76,0.15) 0%, rgba(0,0,0,0.55) 100%)',
    grainOpacity: 0.10, vignetteStrength: 0.22,
    description: 'Top gold, bottom dark — editorial luxury gradient',
  },
  localStreetContrast: {
    id: 'localStreetContrast', label: 'Local Street Contrast',
    contrastFilter: 1.18, saturationFilter: 1.06,
    grainOpacity: 0.16, vignetteStrength: 0.30,
    description: 'Vibrant street-photo contrast for local pride',
  },
  founderBlueGlow: {
    id: 'founderBlueGlow', label: 'Founder Blue Glow',
    cssGradient: 'radial-gradient(ellipse at 20% 50%, rgba(30,80,180,0.35) 0%, transparent 65%)',
    grainOpacity: 0.12, vignetteStrength: 0.28,
    description: 'Cool startup blue-glow for founder/tech energy',
  },
  sepiaHeritage: {
    id: 'sepiaHeritage', label: 'Sepia Heritage',
    sepia: 0.65, contrastFilter: 1.05, saturationFilter: 0.75,
    grainOpacity: 0.22, vignetteStrength: 0.28,
    description: 'Vintage sepia for Indian heritage/legacy content',
  },
  creamPaperWash: {
    id: 'creamPaperWash', label: 'Cream Paper Wash',
    cssGradient: 'linear-gradient(180deg, rgba(252,248,240,0.78) 0%, rgba(252,248,240,0.35) 100%)',
    grainOpacity: 0.18, vignetteStrength: 0.20,
    description: 'Newspaper/aged paper tonal overlay',
  },
  agedPosterTexture: {
    id: 'agedPosterTexture', label: 'Aged Poster Texture',
    grainOpacity: 0.30, vignetteStrength: 0.25, saturationFilter: 0.80, contrastFilter: 1.03,
    cssGradient: 'linear-gradient(135deg, rgba(50,30,10,0.50) 0%, rgba(255,220,170,0.10) 100%)',
    description: 'Heavy grain, warm shadows — aged/printed poster look',
  },
  inkPrintTexture: {
    id: 'inkPrintTexture', label: 'Ink Print Texture',
    grainOpacity: 0.25, vignetteStrength: 0.20, saturationFilter: 0.72, contrastFilter: 1.08,
    description: 'Newspaper-print ink-heavy texture effect',
  },
  grittyPaperTexture: {
    id: 'grittyPaperTexture', label: 'Gritty Paper Texture',
    grainOpacity: 0.35, vignetteStrength: 0.18, contrastFilter: 1.10, saturationFilter: 0.82,
    description: 'Maximum grain for raw gritty street / underground feel',
  },
  boldTypeTexture: {
    id: 'boldTypeTexture', label: 'Bold Type Texture',
    grainOpacity: 0.14, vignetteStrength: 0.20, contrastFilter: 1.15,
    description: 'High contrast, slight grain — makes bold typography sing',
  },
}

export function getEffectById(id: string): EffectPreset | null {
  return EFFECTS[id] ?? null
}

export function getEffectsByIds(ids: string[]): EffectPreset[] {
  return ids.map(id => EFFECTS[id]).filter(Boolean) as EffectPreset[]
}
