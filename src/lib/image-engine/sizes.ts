// src/lib/image-engine/sizes.ts
// All supported poster/campaign image sizes with full metadata.

export interface PosterSize {
  id: string
  label: string
  width: number
  height: number
  aspectRatio: string
  platform: string
  useCase: string
  safeMargin: number
  maxHeadlineChars: number
  maxSubheadlineChars: number
  maxBodyChars: number
  recommendedFontScale: number
  priority: number
}

export const POSTER_SIZES: Record<string, PosterSize> = {
  instagram_post_4x5: {
    id: 'instagram_post_4x5', label: 'Instagram Post (4:5)', width: 1080, height: 1350,
    aspectRatio: '4:5', platform: 'instagram', useCase: 'Feed post, Meta ad creative',
    safeMargin: 72, maxHeadlineChars: 46, maxSubheadlineChars: 110, maxBodyChars: 200,
    recommendedFontScale: 1.0, priority: 1,
  },
  instagram_square_1x1: {
    id: 'instagram_square_1x1', label: 'Instagram Square (1:1)', width: 1080, height: 1080,
    aspectRatio: '1:1', platform: 'instagram', useCase: 'Instagram grid, WhatsApp catalogue',
    safeMargin: 64, maxHeadlineChars: 40, maxSubheadlineChars: 90, maxBodyChars: 160,
    recommendedFontScale: 0.95, priority: 2,
  },
  instagram_story_9x16: {
    id: 'instagram_story_9x16', label: 'Instagram Story (9:16)', width: 1080, height: 1920,
    aspectRatio: '9:16', platform: 'instagram', useCase: 'Stories, WhatsApp status, Reels cover',
    safeMargin: 96, maxHeadlineChars: 38, maxSubheadlineChars: 80, maxBodyChars: 140,
    recommendedFontScale: 1.05, priority: 3,
  },
  instagram_reel_cover_9x16: {
    id: 'instagram_reel_cover_9x16', label: 'Reel Cover (9:16)', width: 1080, height: 1920,
    aspectRatio: '9:16', platform: 'instagram', useCase: 'Reel thumbnail cover',
    safeMargin: 96, maxHeadlineChars: 36, maxSubheadlineChars: 70, maxBodyChars: 120,
    recommendedFontScale: 1.1, priority: 4,
  },
  whatsapp_status_9x16: {
    id: 'whatsapp_status_9x16', label: 'WhatsApp Status (9:16)', width: 1080, height: 1920,
    aspectRatio: '9:16', platform: 'whatsapp', useCase: 'WhatsApp status update',
    safeMargin: 88, maxHeadlineChars: 38, maxSubheadlineChars: 80, maxBodyChars: 140,
    recommendedFontScale: 1.0, priority: 5,
  },
  whatsapp_portfolio_3x4: {
    id: 'whatsapp_portfolio_3x4', label: 'WhatsApp Portfolio (3:4)', width: 1200, height: 1600,
    aspectRatio: '3:4', platform: 'whatsapp', useCase: 'WhatsApp Business portfolio image',
    safeMargin: 80, maxHeadlineChars: 44, maxSubheadlineChars: 100, maxBodyChars: 180,
    recommendedFontScale: 1.0, priority: 6,
  },
  linkedin_post_1_91x1: {
    id: 'linkedin_post_1_91x1', label: 'LinkedIn Post (1.91:1)', width: 1200, height: 627,
    aspectRatio: '1.91:1', platform: 'linkedin', useCase: 'LinkedIn feed, website link preview',
    safeMargin: 56, maxHeadlineChars: 50, maxSubheadlineChars: 120, maxBodyChars: 220,
    recommendedFontScale: 0.85, priority: 7,
  },
  linkedin_square: {
    id: 'linkedin_square', label: 'LinkedIn Square (1:1)', width: 1200, height: 1200,
    aspectRatio: '1:1', platform: 'linkedin', useCase: 'LinkedIn square post',
    safeMargin: 72, maxHeadlineChars: 44, maxSubheadlineChars: 100, maxBodyChars: 180,
    recommendedFontScale: 1.0, priority: 8,
  },
  linkedin_banner: {
    id: 'linkedin_banner', label: 'LinkedIn Banner (4:1)', width: 1584, height: 396,
    aspectRatio: '4:1', platform: 'linkedin', useCase: 'LinkedIn company page cover',
    safeMargin: 48, maxHeadlineChars: 55, maxSubheadlineChars: 130, maxBodyChars: 0,
    recommendedFontScale: 0.7, priority: 9,
  },
  website_hero_16x9: {
    id: 'website_hero_16x9', label: 'Website Hero (16:9)', width: 1920, height: 1080,
    aspectRatio: '16:9', platform: 'website', useCase: 'Website hero banner, landing page',
    safeMargin: 96, maxHeadlineChars: 60, maxSubheadlineChars: 140, maxBodyChars: 250,
    recommendedFontScale: 0.72, priority: 10,
  },
  website_banner_wide: {
    id: 'website_banner_wide', label: 'Website Wide Banner', width: 1920, height: 720,
    aspectRatio: '8:3', platform: 'website', useCase: 'Website wide section banner',
    safeMargin: 80, maxHeadlineChars: 55, maxSubheadlineChars: 120, maxBodyChars: 0,
    recommendedFontScale: 0.65, priority: 11,
  },
  meta_ad_4x5: {
    id: 'meta_ad_4x5', label: 'Meta Ad (4:5)', width: 1080, height: 1350,
    aspectRatio: '4:5', platform: 'meta', useCase: 'Facebook/Instagram ad creative',
    safeMargin: 72, maxHeadlineChars: 40, maxSubheadlineChars: 90, maxBodyChars: 160,
    recommendedFontScale: 1.0, priority: 12,
  },
  meta_ad_1x1: {
    id: 'meta_ad_1x1', label: 'Meta Ad Square (1:1)', width: 1080, height: 1080,
    aspectRatio: '1:1', platform: 'meta', useCase: 'Facebook/Instagram square ad',
    safeMargin: 64, maxHeadlineChars: 40, maxSubheadlineChars: 90, maxBodyChars: 160,
    recommendedFontScale: 0.95, priority: 13,
  },
  meta_ad_9x16: {
    id: 'meta_ad_9x16', label: 'Meta Ad Stories (9:16)', width: 1080, height: 1920,
    aspectRatio: '9:16', platform: 'meta', useCase: 'Facebook/Instagram stories ad',
    safeMargin: 96, maxHeadlineChars: 36, maxSubheadlineChars: 80, maxBodyChars: 130,
    recommendedFontScale: 1.05, priority: 14,
  },
  google_display_banner: {
    id: 'google_display_banner', label: 'Google Display (1.91:1)', width: 1200, height: 628,
    aspectRatio: '1.91:1', platform: 'google', useCase: 'Google display network banner',
    safeMargin: 48, maxHeadlineChars: 45, maxSubheadlineChars: 100, maxBodyChars: 180,
    recommendedFontScale: 0.85, priority: 15,
  },
  youtube_thumbnail_16x9: {
    id: 'youtube_thumbnail_16x9', label: 'YouTube Thumbnail (16:9)', width: 1280, height: 720,
    aspectRatio: '16:9', platform: 'youtube', useCase: 'YouTube video thumbnail',
    safeMargin: 64, maxHeadlineChars: 40, maxSubheadlineChars: 80, maxBodyChars: 0,
    recommendedFontScale: 0.95, priority: 16,
  },
  youtube_shorts_cover_9x16: {
    id: 'youtube_shorts_cover_9x16', label: 'YouTube Shorts Cover (9:16)', width: 1080, height: 1920,
    aspectRatio: '9:16', platform: 'youtube', useCase: 'YouTube Shorts cover image',
    safeMargin: 96, maxHeadlineChars: 36, maxSubheadlineChars: 70, maxBodyChars: 120,
    recommendedFontScale: 1.05, priority: 17,
  },
  pinterest_pin_2x3: {
    id: 'pinterest_pin_2x3', label: 'Pinterest Pin (2:3)', width: 1000, height: 1500,
    aspectRatio: '2:3', platform: 'pinterest', useCase: 'Pinterest pin image',
    safeMargin: 72, maxHeadlineChars: 44, maxSubheadlineChars: 100, maxBodyChars: 180,
    recommendedFontScale: 0.95, priority: 18,
  },
  x_twitter_post_16x9: {
    id: 'x_twitter_post_16x9', label: 'X/Twitter Post (16:9)', width: 1600, height: 900,
    aspectRatio: '16:9', platform: 'twitter', useCase: 'X/Twitter image post',
    safeMargin: 64, maxHeadlineChars: 50, maxSubheadlineChars: 110, maxBodyChars: 200,
    recommendedFontScale: 0.80, priority: 19,
  },
  x_twitter_square: {
    id: 'x_twitter_square', label: 'X/Twitter Square (1:1)', width: 1200, height: 1200,
    aspectRatio: '1:1', platform: 'twitter', useCase: 'X/Twitter square post',
    safeMargin: 64, maxHeadlineChars: 44, maxSubheadlineChars: 100, maxBodyChars: 180,
    recommendedFontScale: 0.95, priority: 20,
  },
  print_a4_portrait: {
    id: 'print_a4_portrait', label: 'Print A4 Portrait', width: 2480, height: 3508,
    aspectRatio: 'A4', platform: 'print', useCase: 'A4 print poster portrait',
    safeMargin: 150, maxHeadlineChars: 52, maxSubheadlineChars: 120, maxBodyChars: 280,
    recommendedFontScale: 1.4, priority: 21,
  },
  print_a4_landscape: {
    id: 'print_a4_landscape', label: 'Print A4 Landscape', width: 3508, height: 2480,
    aspectRatio: 'A4L', platform: 'print', useCase: 'A4 print poster landscape',
    safeMargin: 150, maxHeadlineChars: 60, maxSubheadlineChars: 140, maxBodyChars: 260,
    recommendedFontScale: 1.2, priority: 22,
  },
  flyer_a5_portrait: {
    id: 'flyer_a5_portrait', label: 'Flyer A5 Portrait', width: 1748, height: 2480,
    aspectRatio: 'A5', platform: 'print', useCase: 'A5 flyer/handbill',
    safeMargin: 110, maxHeadlineChars: 46, maxSubheadlineChars: 110, maxBodyChars: 230,
    recommendedFontScale: 1.1, priority: 23,
  },
  business_card_landscape: {
    id: 'business_card_landscape', label: 'Business Card (Landscape)', width: 1050, height: 600,
    aspectRatio: '7:4', platform: 'print', useCase: 'Business card landscape',
    safeMargin: 48, maxHeadlineChars: 30, maxSubheadlineChars: 60, maxBodyChars: 100,
    recommendedFontScale: 0.65, priority: 24,
  },
  logo_preview_square: {
    id: 'logo_preview_square', label: 'Logo Preview Square (1:1)', width: 1200, height: 1200,
    aspectRatio: '1:1', platform: 'brand', useCase: 'Logo/brand preview square',
    safeMargin: 80, maxHeadlineChars: 30, maxSubheadlineChars: 60, maxBodyChars: 80,
    recommendedFontScale: 1.0, priority: 25,
  },
}

export const DEFAULT_SIZE_ID = 'instagram_story_9x16'

export function getSizeById(id: string): PosterSize {
  return POSTER_SIZES[id] ?? POSTER_SIZES[DEFAULT_SIZE_ID]
}

export function inferSizeFromPlatform(platform?: string): PosterSize {
  if (!platform) return POSTER_SIZES[DEFAULT_SIZE_ID]
  const map: Record<string, string> = {
    instagram: 'instagram_post_4x5',
    whatsapp:  'whatsapp_portfolio_3x4',
    linkedin:  'linkedin_post_1_91x1',
    website:   'website_hero_16x9',
    ads:       'meta_ad_4x5',
    print:     'print_a4_portrait',
    facebook:  'meta_ad_4x5',
    twitter:   'x_twitter_post_16x9',
    youtube:   'youtube_thumbnail_16x9',
  }
  return POSTER_SIZES[map[platform.toLowerCase()] ?? DEFAULT_SIZE_ID] ?? POSTER_SIZES[DEFAULT_SIZE_ID]
}
