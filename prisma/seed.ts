import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const templates = [
  // PORTFOLIO (12)
  { name: 'The Manifesto', slug: 'the-manifesto', category: 'portfolio', tier: 'free', description: 'Bold editorial statement portfolio for visionaries and thought leaders', accentColor: '#C9A84C', sortOrder: 1 },
  { name: 'Editorial Dark', slug: 'editorial-dark', category: 'portfolio', tier: 'free', description: 'Noir-influenced editorial layout with dramatic typography and dark aesthetics', accentColor: '#C9A84C', sortOrder: 2 },
  { name: 'Signal', slug: 'signal', category: 'portfolio', tier: 'pro', description: 'Clean, signal-forward portfolio for engineers and product builders', accentColor: '#4CA8C9', sortOrder: 3 },
  { name: "Founder's Page", slug: 'founders-page', category: 'portfolio', tier: 'pro', description: 'Authoritative founder-focused layout with metrics and vision sections', accentColor: '#C9A84C', sortOrder: 4 },
  { name: 'Case Study Pro', slug: 'case-study-pro', category: 'portfolio', tier: 'pro', description: 'Structured case study presentation format for consultants and designers', accentColor: '#7B68EE', sortOrder: 5 },
  { name: 'Zero Noise', slug: 'zero-noise', category: 'portfolio', tier: 'free', description: 'Radical minimalism — your work speaks, nothing else', accentColor: '#E8E2D8', sortOrder: 6 },
  { name: 'Luminary', slug: 'luminary', category: 'portfolio', tier: 'pro', description: 'Premium spotlight layout for senior executives and keynote speakers', accentColor: '#E2C57A', sortOrder: 7 },
  { name: 'The Architect', slug: 'the-architect', category: 'portfolio', tier: 'pro', description: 'Structural grid system for architects, engineers, and systems thinkers', accentColor: '#9CA3AF', sortOrder: 8 },
  { name: 'Studio Brief', slug: 'studio-brief', category: 'portfolio', tier: 'free', description: 'Creative studio presentation with project grid and services overview', accentColor: '#C0392B', sortOrder: 9 },
  { name: 'Minimal Canon', slug: 'minimal-canon', category: 'portfolio', tier: 'free', description: 'Classic proportions, refined spacing, timeless presentation', accentColor: '#C9A84C', sortOrder: 10 },
  { name: 'The Operator', slug: 'the-operator', category: 'portfolio', tier: 'pro', description: 'Operations-focused portfolio with process documentation and results', accentColor: '#2E7D52', sortOrder: 11 },
  { name: 'Deep Work', slug: 'deep-work', category: 'portfolio', tier: 'pro', description: 'Focused, distraction-free layout for researchers and writers', accentColor: '#5C564E', sortOrder: 12 },

  // RESUME (12)
  { name: 'Executive Clean', slug: 'executive-clean', category: 'resume', tier: 'free', description: 'C-suite ready resume with pristine hierarchy and executive presence', accentColor: '#C9A84C', sortOrder: 13 },
  { name: 'Signal Resume', slug: 'signal-resume', category: 'resume', tier: 'free', description: 'ATS-optimized technical resume for engineers and product managers', accentColor: '#4CA8C9', sortOrder: 14 },
  { name: 'The Chronicle', slug: 'the-chronicle', category: 'resume', tier: 'pro', description: 'Timeline-forward career narrative for experienced professionals', accentColor: '#C9A84C', sortOrder: 15 },
  { name: 'Linear', slug: 'linear', category: 'resume', tier: 'free', description: 'Single-column clarity with sharp section breaks and precise typography', accentColor: '#E8E2D8', sortOrder: 16 },
  { name: 'Command', slug: 'command', category: 'resume', tier: 'pro', description: 'Military-precision formatting for operations and leadership roles', accentColor: '#1A3A2A', sortOrder: 17 },
  { name: 'Criterion', slug: 'criterion', category: 'resume', tier: 'pro', description: 'Criteria-led format emphasizing measurable impact and key achievements', accentColor: '#C9A84C', sortOrder: 18 },
  { name: 'The Ledger', slug: 'the-ledger', category: 'resume', tier: 'pro', description: 'Finance-inspired two-column resume with clean data hierarchy', accentColor: '#2E7D52', sortOrder: 19 },
  { name: 'Brief + Brilliant', slug: 'brief-brilliant', category: 'resume', tier: 'free', description: 'One-page discipline — every word earns its place', accentColor: '#C9A84C', sortOrder: 20 },
  { name: 'Structured', slug: 'structured', category: 'resume', tier: 'free', description: 'Systematic layout for project managers and business analysts', accentColor: '#7B68EE', sortOrder: 21 },
  { name: 'The Achiever', slug: 'the-achiever', category: 'resume', tier: 'pro', description: 'Achievement-forward resume with callout metrics and award highlights', accentColor: '#E2C57A', sortOrder: 22 },
  { name: 'Systems Thinker', slug: 'systems-thinker', category: 'resume', tier: 'pro', description: 'Complex skills visualization for technical architects and CTOs', accentColor: '#4CA8C9', sortOrder: 23 },
  { name: "Director's Cut", slug: 'directors-cut', category: 'resume', tier: 'pro', description: 'Film-industry inspired resume for creative directors and producers', accentColor: '#C0392B', sortOrder: 24 },

  // CARD (12)
  { name: 'Noir Card', slug: 'noir-card', category: 'card', tier: 'free', description: 'The original dark luxury business card — gold on black, signature style', accentColor: '#C9A84C', sortOrder: 25 },
  { name: 'The Credential', slug: 'the-credential', category: 'card', tier: 'free', description: 'Professional credential card with designation and contact hierarchy', accentColor: '#E8E2D8', sortOrder: 26 },
  { name: 'Obsidian', slug: 'obsidian', category: 'card', tier: 'pro', description: 'Ultra-premium matte black with embossed-style letterpress type treatment', accentColor: '#C9A84C', sortOrder: 27 },
  { name: 'Minimal Touch', slug: 'minimal-touch', category: 'card', tier: 'free', description: 'Clean white card with single accent line — timeless restraint', accentColor: '#C9A84C', sortOrder: 28 },
  { name: 'The Signet', slug: 'the-signet', category: 'card', tier: 'pro', description: 'Signet-ring inspired card for attorneys, partners, and senior executives', accentColor: '#B8960C', sortOrder: 29 },
  { name: 'Matte Black', slug: 'matte-black', category: 'card', tier: 'pro', description: 'All-black luxury card with micro-detail typography and negative space', accentColor: '#C9A84C', sortOrder: 30 },
  { name: 'Cipher', slug: 'cipher', category: 'card', tier: 'pro', description: 'Cryptographic grid pattern with encoded contact information layout', accentColor: '#4CA8C9', sortOrder: 31 },
  { name: 'Luxe Mono', slug: 'luxe-mono', category: 'card', tier: 'pro', description: 'Monochrome luxury with bold serif name treatment and minimal detail', accentColor: '#E8E2D8', sortOrder: 32 },
  { name: 'The Partner', slug: 'the-partner', category: 'card', tier: 'pro', description: 'Law firm and consulting partner card with formal hierarchy', accentColor: '#1A2A3A', sortOrder: 33 },
  { name: 'Carbon', slug: 'carbon', category: 'card', tier: 'free', description: 'Carbon fiber texture effect with technical precision typography', accentColor: '#9CA3AF', sortOrder: 34 },
  { name: 'Embossed', slug: 'embossed', category: 'card', tier: 'pro', description: 'Simulated embossing with dimensional type treatment', accentColor: '#C9A84C', sortOrder: 35 },
  { name: 'Foundry', slug: 'foundry', category: 'card', tier: 'free', description: 'Industrial foundry aesthetic for makers, builders, and craftspeople', accentColor: '#B85C2A', sortOrder: 36 },

  // PRESENTATION (12)
  { name: 'Pitch Dark', slug: 'pitch-dark', category: 'presentation', tier: 'free', description: 'VC-ready pitch deck in noir aesthetic — dark, compelling, funded', accentColor: '#C9A84C', sortOrder: 37 },
  { name: 'The Narrative', slug: 'the-narrative', category: 'presentation', tier: 'free', description: 'Story-arc presentation with emotional hooks and narrative flow', accentColor: '#7B68EE', sortOrder: 38 },
  { name: 'Signal Deck', slug: 'signal-deck', category: 'presentation', tier: 'pro', description: 'Product and tech deck with clean data visualization slots', accentColor: '#4CA8C9', sortOrder: 39 },
  { name: 'Operator Deck', slug: 'operator-deck', category: 'presentation', tier: 'pro', description: 'Operations review deck with metrics grids and progress tracking', accentColor: '#2E7D52', sortOrder: 40 },
  { name: 'Founder Pitch', slug: 'founder-pitch', category: 'presentation', tier: 'pro', description: 'Series A/B pitch structure with traction, TAM, and team slides', accentColor: '#C9A84C', sortOrder: 41 },
  { name: 'Zero-to-One', slug: 'zero-to-one', category: 'presentation', tier: 'pro', description: 'Peter Thiel-inspired contrarian pitch format for bold claims', accentColor: '#C0392B', sortOrder: 42 },
  { name: 'The Thesis', slug: 'the-thesis', category: 'presentation', tier: 'pro', description: 'Academic and investment thesis format with rigorous evidence structure', accentColor: '#E8E2D8', sortOrder: 43 },
  { name: 'Board Brief', slug: 'board-brief', category: 'presentation', tier: 'pro', description: 'Board meeting presentation with governance-appropriate formatting', accentColor: '#1A2A3A', sortOrder: 44 },
  { name: 'Momentum', slug: 'momentum', category: 'presentation', tier: 'free', description: 'Growth-forward deck emphasizing momentum metrics and velocity', accentColor: '#2E7D52', sortOrder: 45 },
  { name: 'Iron Curtain', slug: 'iron-curtain', category: 'presentation', tier: 'pro', description: 'Cold war-era graphic design revival — bold, stark, unforgettable', accentColor: '#C0392B', sortOrder: 46 },
  { name: 'The Reveal', slug: 'the-reveal', category: 'presentation', tier: 'pro', description: 'Keynote-style reveal format with dramatic transitions and builds', accentColor: '#C9A84C', sortOrder: 47 },
  { name: 'Series A', slug: 'series-a', category: 'presentation', tier: 'pro', description: 'Series A fundraise deck with Sequoia-style structure and metrics', accentColor: '#E2C57A', sortOrder: 48 },
]

async function main() {
  console.log('Seeding 48 templates...')
  for (const template of templates) {
    await prisma.template.upsert({
      where: { slug: template.slug },
      update: template,
      create: template,
    })
  }
  console.log('Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
