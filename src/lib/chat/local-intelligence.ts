export type LocalChatResult = {
  answer: string
  confidence: number
  contextUsed: string[]
}

const INDUSTRY_HINTS: Record<string, string> = {
  dental: 'Dental clinics usually need Google Search, Google Business Profile, WhatsApp booking, reviews, painless-treatment trust copy, and local SEO service pages.',
  salon: 'Salons usually need Instagram before-after proof, WhatsApp booking, Google Maps visibility, hygiene/trust content, and clear service packages.',
  gym: 'Gyms usually need transformation proof, trainer credibility, Instagram reels, WhatsApp membership follow-up, local SEO, and trial-class offers.',
  restaurant: 'Restaurants usually need Google Maps, Instagram food visuals, menu/booking sections, reviews, ambience storytelling, and WhatsApp/call CTA.',
  cafe: 'Cafes usually need ambience-led Instagram content, Google Maps reviews, signature product highlights, event/community posts, and offers.',
  real: 'Real estate businesses usually need property landing pages, WhatsApp site visit booking, location proof, financing FAQs, and trust-building testimonials.',
  coaching: 'Coaching institutes usually need result proof, faculty credibility, demo-class CTA, parent/student personas, YouTube/Google/WhatsApp funnels.',
  startup: 'Startups usually need positioning, landing page, waitlist/signup CTA, problem-solution proof, founder story, product demo, and LinkedIn/content distribution.',
}

function hasAny(text: string, words: string[]) {
  return words.some(w => text.includes(w))
}

export function answerFromLocalIntelligence(message: string): LocalChatResult {
  const q = message.toLowerCase()
  const context: string[] = []
  for (const [key, value] of Object.entries(INDUSTRY_HINTS)) {
    if (q.includes(key)) context.push(value)
  }

  if (hasAny(q, ['what can you do', 'capabilities', 'features', 'what do you do'])) {
    return {
      confidence: 0.9,
      contextUsed: ['platform_capabilities'],
      answer: `Brand Syndicate can help you plan and generate websites, logos, brand images, business strategy, content calendars, captions, website edits, and growth recommendations. Our AI is trained specifically for business growth so your answers are always relevant to your industry and goals.`,
    }
  }

  if (hasAny(q, ['cost', 'api cost', 'tokens', 'expensive', 'cheap'])) {
    return {
      confidence: 0.86,
      contextUsed: ['cost_control'],
      answer: `Brand Syndicate is designed to be cost efficient. It draws on industry knowledge and your business context to give you focused answers without unnecessary overhead. For deep strategy, website copy, or creative work, it applies the full power of our AI models.`,
    }
  }

  if (hasAny(q, ['whatsapp', 'wati', 'interakt'])) {
    return {
      confidence: 0.82,
      contextUsed: ['whatsapp_automation'],
      answer: `For WhatsApp, Brand Syndicate can create message drafts, templates, lead follow-up flows, and booking sequences. Actual sending still needs Meta WhatsApp Cloud API or a provider such as Interakt, WATI, Gupshup, AiSensy, or Twilio. The system should never fake delivery status; it should show queued, sent, failed, and external message IDs.`,
    }
  }

  if (context.length && hasAny(q, ['strategy', 'website', 'marketing', 'ads', 'leads', 'content', 'seo'])) {
    return {
      confidence: 0.78,
      contextUsed: context,
      answer: `${context.join('\n\n')}\n\nA strong Brand Syndicate flow would be: create a conversion-first website, add WhatsApp lead capture, show proof/reviews, make service/package sections clear, generate 30 days of content, and review weekly analytics to improve the next campaign.`,
    }
  }

  if (hasAny(q, ['social automation', 'instagram posting', 'facebook posting', 'linkedin posting'])) {
    return {
      confidence: 0.88,
      contextUsed: ['social_removed'],
      answer: `Social automation has been removed from this build. The system can still generate captions, graphics, strategy, and calendars, but it should not show real social account connection, scheduling, publishing, or analytics modules until those APIs are intentionally added back.`,
    }
  }

  return {
    confidence: 0.35,
    contextUsed: [],
    answer: `I need more context to give you a specific answer. Could you share a bit more about your business, what you are trying to achieve, or what specific challenge you are facing?`,
  }
}

export function shouldUseExternalApi(message: string, local: LocalChatResult) {
  const q = message.toLowerCase()
  const creativeOrSpecific = hasAny(q, [
    'create', 'write', 'generate', 'make', 'draft', 'plan', 'analyze', 'compare', 'build', 'design', 'script', 'caption', 'strategy for', 'for my', 'my business', 'specific'
  ])
  return local.confidence < 0.8 || creativeOrSpecific
}
