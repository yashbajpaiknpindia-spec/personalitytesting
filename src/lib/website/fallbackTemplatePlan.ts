// src/lib/website/fallbackTemplatePlan.ts
// Creates a website template plan entirely locally, without any AI call.
// Used when generateTemplatePlan fails, or as a fast path for simple cases.
// SERVER-SAFE (no AI calls, no fs imports).

import {
  findTemplateLocally,
  getFallbackTemplate,
  type WebsiteTemplate,
} from './templates'
import type { WebsiteTemplatePlan, PlanUsage } from './generateTemplatePlan'

// ── Keyword-to-industry inference rules ──────────────────────────────────────

const INDUSTRY_RULES: Array<{ keywords: string[]; industry: string }> = [
  { keywords: ['jewel', 'jewels', 'jewellers', 'jewelry', 'jewellery', 'ornament', 'bridal', 'gold', 'diamond', 'bangle', 'ring', 'necklace'],   industry: 'Jewellery' },
  { keywords: ['cafe', 'restaurant', 'kitchen', 'food', 'dining', 'chef', 'dine', 'eatery', 'biryani', 'dhaba', 'thali', 'bakery', 'bread', 'pastry'], industry: 'Food & Restaurant' },
  { keywords: ['fit', 'gym', 'fitness', 'trainer', 'coach', 'workout', 'fat loss', 'muscle', 'physique', 'nutrition'], industry: 'Fitness & Health' },
  { keywords: ['dental', 'dentist', 'teeth', 'oral', 'orthodontic'], industry: 'Dental Care' },
  { keywords: ['clinic', 'hospital', 'doctor', 'medical', 'health', 'care', 'healthcare', 'patient'], industry: 'Healthcare' },
  { keywords: ['realty', 'real estate', 'property', 'builders', 'flat', 'apartment', 'plot', 'housing'], industry: 'Real Estate' },
  { keywords: ['construction', 'contractor', 'civil', 'infra', 'builder', 'infrastructure'], industry: 'Construction' },
  { keywords: ['academy', 'classes', 'coaching', 'institute', 'tutor', 'course', 'learning', 'school', 'education'], industry: 'Education' },
  { keywords: ['fashion', 'clothing', 'apparel', 'boutique', 'wear', 'garment', 'outfit'], industry: 'Fashion' },
  { keywords: ['salon', 'beauty', 'parlour', 'hair', 'makeover', 'nails', 'spa', 'waxing'], industry: 'Beauty & Wellness' },
  { keywords: ['law', 'legal', 'lawyer', 'advocate', 'solicitor', 'attorney'], industry: 'Legal Services' },
  { keywords: ['solar', 'renewable', 'energy', 'panel', 'green energy'], industry: 'Solar Energy' },
  { keywords: ['logistics', 'shipping', 'freight', 'transport', 'supply chain', 'cargo'], industry: 'Logistics' },
  { keywords: ['automobile', 'car', 'auto', 'vehicle', 'showroom', 'bikes'], industry: 'Automobile' },
  { keywords: ['travel', 'tour', 'trip', 'holiday', 'tourism', 'destination'], industry: 'Travel & Tourism' },
  { keywords: ['photographer', 'photography', 'photo', 'shoot', 'studio', 'wedding photo'], industry: 'Photography' },
  { keywords: ['software', 'saas', 'app', 'platform', 'cloud', 'B2B', 'tech', 'startup'], industry: 'Technology' },
  { keywords: ['hotel', 'resort', 'accommodation', 'stay', 'rooms', 'hospitality'], industry: 'Hotel & Hospitality' },
  { keywords: ['ngo', 'nonprofit', 'charity', 'social', 'foundation', 'donate', 'welfare'], industry: 'NGO / Nonprofit' },
  { keywords: ['yoga', 'meditation', 'wellness', 'mindfulness', 'holistic', 'ayurveda'], industry: 'Yoga & Wellness' },
  { keywords: ['interior', 'decor', 'space', 'furniture', 'home design', 'renovation'], industry: 'Interior Design' },
  { keywords: ['music', 'artist', 'musician', 'band', 'dj', 'singer', 'rapper'], industry: 'Music & Entertainment' },
  { keywords: ['marketing', 'agency', 'branding', 'ads', 'growth', 'digital', 'advertising'], industry: 'Marketing & Agency' },
  { keywords: ['financial', 'finance', 'wealth', 'investment', 'insurance', 'tax', 'fund'], industry: 'Finance & Advisory' },
  { keywords: ['cyber', 'security', 'hacking', 'data protection', 'VAPT', 'firewall'], industry: 'Cybersecurity' },
  { keywords: ['pet', 'dog', 'cat', 'vet', 'animal', 'grooming', 'boarding'], industry: 'Pet Care' },
  { keywords: ['cosmetics', 'makeup', 'skincare', 'serum', 'lipstick', 'foundation', 'glow'], industry: 'Cosmetics & Beauty' },
]

function inferIndustry(text: string): { industry: string; confidence: 'high' | 'medium' | 'low' } {
  const lower = text.toLowerCase()
  for (const rule of INDUSTRY_RULES) {
    const match = rule.keywords.filter(k => lower.includes(k))
    if (match.length >= 2) return { industry: rule.industry, confidence: 'high' }
    if (match.length === 1) return { industry: rule.industry, confidence: 'medium' }
  }
  return { industry: 'General Business', confidence: 'low' }
}

// ── Generic copy templates ────────────────────────────────────────────────────

function buildFallbackCopy(companyName: string, industry: string, template: WebsiteTemplate): WebsiteTemplatePlan {
  const name = companyName || 'Your Brand'

  return {
    template_id:   template.id,
    template_label: template.label,
    business_name: name,
    industry,
    industry_confidence: 'low',
    tone: 'professional, premium',
    colors: {
      primary:    template.color,
      background: template.bg,
      secondary:  '#FFFFFF',
    },
    hero: {
      headline:     `Premium ${industry} Services by ${name}`,
      subheadline:  `${name} delivers exceptional quality and results. Trusted by clients across India for professional, reliable service.`,
      cta_primary:  'Get Started',
      cta_secondary: 'Our Services',
    },
    sections: [
      {
        type: 'services' as const,
        title: 'What We Offer',
        items: [
          {
            title: 'Expert Services',
            description: `Professional ${industry.toLowerCase()} services designed to deliver results.`,
          },
          {
            title: 'Premium Quality',
            description: 'Uncompromising quality standards at every stage of engagement.',
          },
          {
            title: 'Proven Track Record',
            description: 'Trusted by clients across India for reliable, consistent performance.',
          },
        ],
      },
      {
        type: 'why_us' as const,
        title: `Why Choose ${name}`,
        items: [
          {
            title: 'Client-First Approach',
            description: 'Every engagement is tailored to your specific needs and goals.',
          },
          {
            title: 'End-to-End Support',
            description: 'From first consultation to final delivery, we are with you at every step.',
          },
        ],
      },
      {
        type: 'contact' as const,
        title: 'Ready to Begin?',
        description: `Share your requirement and our team at ${name} will reach out within 24 hours.`,
      },
    ],
    seo: {
      title:       `${name} — Premium ${industry} Services`,
      description: `${name} provides premium ${industry.toLowerCase()} services in India. Quality, reliability and excellence — powered by Brand Syndicate.`,
    },
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export function createFallbackTemplatePlan(input: {
  companyName?: string
  description?: string
  industry?: string
  sector?: string
}): { plan: WebsiteTemplatePlan; usage: PlanUsage } {
  const searchText = [
    input.description,
    input.companyName,
    input.industry,
    input.sector,
  ]
    .filter(Boolean)
    .join(' ')

  const { industry, confidence } = inferIndustry(searchText)

  const template = findTemplateLocally({
    prompt:      input.description,
    companyName: input.companyName,
    industry:    input.industry ?? industry,
    sector:      input.sector,
  }) ?? getFallbackTemplate()

  const plan = buildFallbackCopy(input.companyName ?? '', industry, template)
  plan.industry_confidence = confidence

  const usage: PlanUsage = {
    inputTokens:  0,
    outputTokens: 0,
    totalTokens:  0,
    model:        'local-fallback',
    costUsd:      0,
    costInr:      0,
  }

  return { plan, usage }
}
