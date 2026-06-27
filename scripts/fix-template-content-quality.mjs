#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const sampleDir = path.join(root, 'public', 'samples')
const files = fs.readdirSync(sampleDir).filter(f => f.endsWith('.html')).sort()

const CONTENT_FIX_STYLE = `<style id="bs-template-content-quality-fix">
/* Brand Syndicate template content quality pass: hero visuals + layout variation + no template wording. */
.hero,.hero-section,[class*="hero"]{position:relative;overflow:hidden;}
.bs-hero-image-bg{position:absolute!important;inset:0!important;z-index:0!important;pointer-events:none!important;overflow:hidden!important;opacity:.32!important;}
.bs-hero-image-bg img{width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:center!important;filter:saturate(.86) contrast(1.04)!important;}
.bs-hero-image-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.88),rgba(0,0,0,.58),rgba(0,0,0,.28));}
.hero>*:not(.bs-hero-image-bg),.hero-section>*:not(.bs-hero-image-bg),[class*="hero"]>*:not(.bs-hero-image-bg){position:relative;z-index:1;}
body.bs-layout-atelier .cards,body.bs-layout-atelier .grid{align-items:stretch;}
body.bs-layout-booking .cards,body.bs-layout-booking .grid{grid-template-columns:minmax(0,1.25fr) minmax(0,.85fr)!important;}
body.bs-layout-commerce .cards,body.bs-layout-commerce .grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;}
body.bs-layout-enterprise .cards,body.bs-layout-enterprise .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
body.bs-layout-local .cards,body.bs-layout-local .grid{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr) minmax(0,.85fr)!important;}
body.bs-layout-magazine .cards,body.bs-layout-magazine .grid{grid-template-columns:minmax(0,1.35fr) minmax(0,.8fr)!important;}
body.bs-layout-signal .cards,body.bs-layout-signal .grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:clamp(12px,2vw,28px)!important;}
body.bs-layout-trust .cards,body.bs-layout-trust .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
body.bs-hero-v0 .hero-grid{grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr)!important;}
body.bs-hero-v1 .hero-grid{grid-template-columns:minmax(0,.88fr) minmax(0,1.12fr)!important;}
body.bs-hero-v2 .hero{align-items:end!important;}
body.bs-hero-v2 .hero .wrap{margin-bottom:clamp(22px,6vw,74px)!important;}
body.bs-hero-v3 .hero{text-align:center!important;}
body.bs-hero-v3 .hero .hero-actions{justify-content:center!important;}
body.bs-hero-v4 .hero{min-height:86vh!important;}
body.bs-hero-v5 .hero{min-height:110vh!important;}
body.bs-density-v0 .section{padding-block:clamp(64px,9vw,112px)!important;}
body.bs-density-v1 .section{padding-block:clamp(48px,7vw,88px)!important;}
body.bs-density-v2 .card,body.bs-density-v2 .feature-card{min-height:260px!important;}
body.bs-density-v3 .card,body.bs-density-v3 .feature-card{padding:clamp(22px,3vw,38px)!important;}
body.bs-density-v4 .section-head{margin-bottom:clamp(22px,5vw,54px)!important;}
body.bs-visual-v0 .cards,body.bs-visual-v0 .features{grid-template-columns:1.2fr .9fr .9fr!important;}
body.bs-visual-v1 .cards,body.bs-visual-v1 .features{grid-template-columns:.9fr 1.2fr .9fr!important;}
body.bs-visual-v2 .cards,body.bs-visual-v2 .features{grid-template-columns:.9fr .9fr 1.2fr!important;}
body.bs-visual-v3 .cards,body.bs-visual-v3 .features{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
body.bs-visual-v4 .cards,body.bs-visual-v4 .features{grid-template-columns:minmax(0,1fr)!important;}
body.bs-visual-v5 .section:nth-of-type(even) .wrap{max-width:min(100% - 40px,980px)!important;}
body.bs-visual-v6 .section:nth-of-type(odd) .wrap{max-width:min(100% - 40px,1320px)!important;}
body.bs-visual-v7 .proof-grid,body.bs-visual-v7 .offer-grid{grid-template-columns:.8fr 1.2fr!important;}
body.bs-visual-v8 .proof-grid,body.bs-visual-v8 .offer-grid{grid-template-columns:1.2fr .8fr!important;}
body.bs-visual-v9 .testimonial-grid{grid-template-columns:1fr!important;}
body.bs-visual-v10 .gallery,[class*="bs-visual-v10"] .gallery{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
body.bs-visual-v11 .section-head{display:block!important;max-width:820px!important;}
body.bs-visual-v12 .section-head{text-align:center!important;margin-inline:auto!important;}
body.bs-visual-v13 .card:nth-child(odd),body.bs-visual-v13 .feature-card:nth-child(odd){transform:translateY(18px);}
body.bs-visual-v14 .card:nth-child(even),body.bs-visual-v14 .feature-card:nth-child(even){transform:translateY(18px);}
body.bs-visual-v15 .showcase,body.bs-visual-v15 .visual-board{border-radius:8px!important;}
body.bs-visual-v16 .showcase,body.bs-visual-v16 .visual-board{border-radius:44px!important;}
body.bs-visual-v17 .hero .wrap{max-width:min(100% - 48px,980px)!important;}
body.bs-visual-v18 .hero .wrap{max-width:min(100% - 48px,1360px)!important;}
body.bs-visual-v19 .metric-grid,.proof-stats{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
body.bs-visual-v20 .metric-grid,.proof-stats{grid-template-columns:repeat(4,minmax(0,1fr))!important;}
body.bs-visual-v21 .hero-actions .btn{border-radius:8px!important;}
body.bs-visual-v22 .hero-actions .btn{border-radius:999px!important;}
body.bs-visual-v23 .card,body.bs-visual-v23 .feature-card{border-left-width:4px!important;}
body[class*="bs-seed-"] .card,body[class*="bs-seed-"] .feature-card,body[class*="bs-seed-"] .panel,body[class*="bs-seed-"] .visual-board,body[class*="bs-seed-"] .showcase{border-radius:var(--bs-radius,26px)!important;}
body[class*="bs-seed-"] .section{padding-block:var(--bs-section-pad,84px)!important;}
body[class*="bs-seed-"] .hero{min-height:var(--bs-hero-min,96vh)!important;}
body[class*="bs-seed-"] .hero .wrap{max-width:var(--bs-wrap-max,1160px)!important;}
body[class*="bs-seed-"] .bs-hero-image-bg{opacity:var(--bs-hero-img-opacity,.32)!important;}
body[class*="bs-seed-"] .hero-bg img,body[class*="bs-seed-"] .bs-hero-image-bg img{object-position:var(--bs-img-pos,center)!important;}
@media(max-width:900px){body[class*="bs-layout-"] .cards,body[class*="bs-layout-"] .grid,body[class*="bs-visual-v"] .cards,body[class*="bs-visual-v"] .features,body[class*="bs-visual-v"] .proof-grid,body[class*="bs-visual-v"] .offer-grid{grid-template-columns:1fr!important}.bs-hero-image-bg{opacity:.25!important}.bs-hero-image-bg::after{background:linear-gradient(180deg,rgba(0,0,0,.62),rgba(0,0,0,.9));}body[class*="bs-visual-v"] .card,body[class*="bs-visual-v"] .feature-card{transform:none!important;}body[class*="bs-hero-v"] .hero{text-align:left!important;min-height:auto!important;}body[class*="bs-hero-v"] .hero .hero-actions{justify-content:flex-start!important;}}
</style>`

const IMAGE_BY_QUERY = [
  [/artist|gallery|art|painter|exhibition|creative/i, 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=1600&q=78&auto=format&fit=crop'],
  [/furniture|sofa|interior|decor|wood|carpenter|kitchen/i, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=78&auto=format&fit=crop'],
  [/school|college|academy|coaching|learning|education|training|student|course/i, 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=78&auto=format&fit=crop'],
  [/clinic|hospital|doctor|medical|dental|ayurveda|wellness|spa|health/i, 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1600&q=78&auto=format&fit=crop'],
  [/restaurant|cafe|bakery|food|cloud-kitchen|bar|lounge|chef|chocolate/i, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=78&auto=format&fit=crop'],
  [/fashion|boutique|clothing|apparel|beauty|cosmetic|salon|tailoring/i, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1600&q=78&auto=format&fit=crop'],
  [/jewel|diamond|luxury|adore/i, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1600&q=78&auto=format&fit=crop'],
  [/real-estate|property|villa|architect|architecture|construction/i, 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=78&auto=format&fit=crop'],
  [/auto|car|bike|vehicle|automobile|mobility|showroom|spare|parts/i, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&q=78&auto=format&fit=crop'],
  [/sports|fitness|gym|marathon|bat|cricket|club/i, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1600&q=78&auto=format&fit=crop'],
  [/farm|agri|crop|organic|dairy|rural|bamboo/i, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&q=78&auto=format&fit=crop'],
  [/finance|accounting|fintech|bank|tax|loan|wealth/i, 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1600&q=78&auto=format&fit=crop'],
  [/logistics|warehouse|courier|shipping|transport/i, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=78&auto=format&fit=crop'],
  [/solar|energy|power/i, 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&q=78&auto=format&fit=crop'],
  [/travel|tour|hotel|resort|stay|palace/i, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1600&q=78&auto=format&fit=crop'],
  [/law|legal|advocate/i, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=78&auto=format&fit=crop'],
  [/video|film|photo|media|production|reel/i, 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1600&q=78&auto=format&fit=crop'],
  [/tech|saas|software|ai|automation|cyber|blockchain|app|cloud/i, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=78&auto=format&fit=crop'],
]
function stableImage(query) {
  const hay = decodeURIComponent(String(query || '')).replace(/[,+_-]/g, ' ')
  for (const [pattern, url] of IMAGE_BY_QUERY) if (pattern.test(hay)) return url
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=78&auto=format&fit=crop'
}
function stripBlock(html, id) {
  return html.replace(new RegExp(`<style[^>]+id=["']${id}["'][\\s\\S]*?<\\/style>`, 'gi'), '')
             .replace(new RegExp(`<script[^>]+id=["']${id}["'][\\s\\S]*?<\\/script>`, 'gi'), '')
}
function cleanText(t) {
  return String(t || '')
    // Remove user-facing generator/template/preview language before broad word replacements.
    .replace(/Lead capture ready for Brand Syndicate\.?/gi, 'Lead capture ready.')
    .replace(/Use this page to collect enquiries and present the offer clearly\.\s*inside Brand Syndicate\.?/gi, 'Use this page to collect enquiries and present the offer clearly.')
    .replace(/inside Brand Syndicate\.?/gi, '')
    .replace(/Connect this form to your existing generation history, admin panel, WhatsApp follow-up or CRM\. The layout stays readable even when Claude inserts longer AI content\.?/gi, 'Connect this form to WhatsApp, CRM or direct follow-up. The layout stays readable even with longer customer requirements.')
    .replace(/generation history, admin panel, WhatsApp follow-up or CRM/gi, 'WhatsApp, CRM or direct follow-up')
    .replace(/even when Claude inserts longer AI content/gi, 'even with longer customer requirements')
    .replace(/AI content/gi, 'customer requirements')
    .replace(/Necessary website elements are included so Claude can add these as complete websites, not empty design shells\.?/gi, 'Essential customer journey elements are included so the page feels complete, credible and ready for enquiries.')
    .replace(/Claude can add these as complete websites, not empty design shells\.?/gi, 'the page feels complete, credible and ready for enquiries.')
    .replace(/not empty design shells/gi, 'not empty layouts')
    .replace(/empty design shells/gi, 'thin layouts')
    .replace(/This website keeps/gi, 'This section keeps')
    .replace(/Hero image and CTA area sized for desktop, tablet and mobile website cards\.?/gi, 'Hero section keeps imagery, messaging and CTA readable across desktop, tablet and mobile.')
    .replace(/Hero image and CTA area sized for desktop, tablet and mobile cards\.?/gi, 'Hero section keeps imagery, messaging and CTA readable across desktop, tablet and mobile.')
    .replace(/Work designed for ([^.]+)\.?/gi, 'Work created for $1 customers.')
    .replace(/Work designed for/gi, 'Work created for')
    .replace(/This website is built around/gi, 'This page presents')
    .replace(/includes a dedicated section for/gi, 'highlights')
    .replace(/Trust blocks already/gi, 'Customer trust')
    .replace(/built into the page/gi, 'built into every section')
    .replace(/Claude JSON personalisation/gi, 'service and content clarity')
    .replace(/Claude JSON/gi, 'business content')
    .replace(/prompt-based industry matching/gi, 'category-specific messaging')
    .replace(/AI personalisation/gi, 'clear customer journey')
    .replace(/business personalisation/gi, 'customer-ready presentation')
    .replace(/enough structure for clear customer journey/gi, 'a clear customer journey')
    .replace(/enough structure for AI personalisation/gi, 'a clear customer journey')
    .replace(/responsive copy wrapping and clear conversion context/gi, 'clear mobile layout and customer-focused detail')
    .replace(/copy wrapping/gi, 'mobile readability')
    .replace(/conversion context/gi, 'customer context')
    .replace(/Works for category-specific messaging/gi, 'Built around category-specific messaging')
    .replace(/Clear sections for service and content clarity/gi, 'Clear sections for services, proof and enquiry')
    .replace(/Useful for free previews and easy to replace with real client reviews later\.?/gi, 'Built for real campaigns with proof, offers and enquiry flow already in place.')
    .replace(/Useful for customer-ready launches and easy to replace with real client reviews later\.?/gi, 'Built for real campaigns with proof, offers and enquiry flow already in place.')
    .replace(/Useful for customer-ready launches and easy to support verified customer proof\.?/gi, 'Built for real campaigns with proof, offers and enquiry flow already in place.')
    .replace(/Every section is structured so your AI generator can replace copy, colours and business details without breaking the design\.?/gi, 'Every section explains the offer clearly, builds trust and guides visitors toward enquiry.')
    .replace(/The structure is intentionally predictable:\s*hero, proof, services, process, testimonials, FAQ and contact\.\s*Your backend can safely replace text while keeping the design intact\.?/gi, 'This page combines hero positioning, proof, services, process, testimonials, FAQ and contact to create a complete customer journey.')
    .replace(/This website is intentionally different from your current \d+ files:?\s*new ID, new label, new section order, industry menu, copy pattern and layout treatment\.?/gi, 'A focused section built around clear services, proof and enquiry flow.')
    .replace(/This website is intentionally different from your current \d+ files:?/gi, 'A focused business section:')
    .replace(/Responsive,\s*premium\s*and\s*ready\s*for\s*Brand Syndicate\s*AI personalisation\.?/gi, 'Responsive, premium and built for serious enquiries.')
    .replace(/Responsive,\s*premium\s*and\s*ready\s*for\s*business personalisation\.?/gi, 'Responsive, premium and built for serious enquiries.')
    .replace(/Live Preview/gi, 'Project Snapshot')
    .replace(/Business Preview/gi, 'Project Snapshot')
    .replace(/Preview Quality/gi, 'Website Quality')
    .replace(/Fast Preview ready/gi, 'Fast enquiry ready')
    .replace(/preview ready/gi, 'enquiry ready')
    .replace(/generated preview/gi, 'customer page')
    .replace(/free AI preview/gi, 'business website')
    .replace(/AI preview/gi, 'business website')
    .replace(/low-cost preview website/gi, 'lean business website')
    .replace(/preview website/gi, 'business website')
    .replace(/\bpreviews\b/gi, 'websites')
    .replace(/\bpreview\b/gi, 'website')
    .replace(/the need for users to regenerate repeatedly/gi, 'the need for repeated rework')
    .replace(/regenerate repeatedly/gi, 'repeat rework')
    .replace(/Can this website be customised for a real ([^?]+)\?/gi, 'Can customers enquire for $1 services?')
    .replace(/Can this be used for a business website\?/gi, 'Can visitors enquire from this page?')
    .replace(/Can this be used for a free business website\?/gi, 'Can visitors enquire from this page?')
    .replace(/Can this be used for a free AI website\?/gi, 'Can visitors enquire from this page?')
    .replace(/What should be refined for paid clients\?/gi, 'What details should customers share before starting?')
    .replace(/Yes\. The text, colours, images, service cards and contact details are designed to be replaced by the Brand Syndicate AI renderer\.?/gi, 'Yes. The offering can be tailored based on customer needs, quantity, timeline and location.')
    .replace(/Yes\. It is built to work as a lean business website while still looking polished and conversion-focused\.?/gi, 'Yes. Visitors can use the enquiry form or contact action to request more information.')
    .replace(/Yes\. It is built to work as a low-cost website while still looking polished and conversion-focused\.?/gi, 'Yes. Visitors can use the enquiry form or contact action to request more information.')
    .replace(/Images, final copy, SEO, domain setup, analytics, forms and brand-specific sections should be refined during paid delivery\.?/gi, 'Customers should share their requirement, quantity, timeline, budget and preferred contact details.')
    .replace(/Use this website as a fast,?\s*premium base for AI-personalised website websites\.?/gi, 'Use this page to collect enquiries and present the offer clearly.')
    .replace(/Use this website as a fast,?\s*premium base for AI-personalised website previews\.?/gi, 'Use this page to collect enquiries and present the offer clearly.')
    .replace(/Turn the website into a real enquiry page\.?/gi, 'Turn interest into a real enquiry.')
    .replace(/Connect this section to your Brand Syndicate lead form, WhatsApp CTA or booking flow when the website is used for a client\.?/gi, 'Use the form, WhatsApp CTA or booking action to capture high-intent enquiries.')
    .replace(/Made for AI edits without breaking the layout\.?/gi, 'Made for real updates without breaking the layout.')
    .replace(/Made for business edits without breaking the layout\.?/gi, 'Made for real updates without breaking the layout.')
    .replace(/Made for business personalisation without breaking the layout\.?/gi, 'Made for real updates without breaking the layout.')
    .replace(/\bAI generator\b/gi, 'business system')
    .replace(/\byour backend\b/gi, 'the team')
    .replace(/\bBrand Syndicate AI renderer\b/gi, 'service team')
    .replace(/\bcopy replacement\b/gi, 'content clarity')
    .replace(/\bcopy, colours and business details\b/gi, 'services, proof and contact details')
    .replace(/Brand Syndicate\s+Template/gi, 'Brand Syndicate')
    .replace(/\bCreative\s+Template\b/gi, 'Creative Studio')
    .replace(/\b([A-Za-z]+)\s+Template\b/g, '$1 Website')
    .replace(/\btemplates\b/gi, 'websites')
    .replace(/\btemplate\b/gi, 'website')
    .replace(/free previews?/gi, 'customer-ready launches')
    .replace(/easy to replace with real client reviews later\.?/gi, 'built around credible customer proof.')
    .replace(/replace with real/gi, 'support verified')
    .replace(/client reviews later/gi, 'customer proof')
    .replace(/trust blocks already built into the page\.?/gi, 'Trust sections guide visitors toward enquiry.')
    .replace(/The sections explain the offer quickly and guide visitors toward enquiry without confusion\.?/gi, 'The page explains the offer clearly and guides visitors toward enquiry without confusion.')
    .replace(/demo content/gi, 'business content')
    .replace(/placeholder/gi, 'content')
    .replace(/Lorem ipsum[^.。<]*/gi, 'Clear business copy built around the offer')
    .replace(/Service One/gi, 'Core Service')
    .replace(/Service Two/gi, 'Priority Offer')
    .replace(/Service Three/gi, 'Customer Support')
    .replace(/Service Four/gi, 'Project Consultation')
    .replace(/Service Five/gi, 'Custom Plan')
    .replace(/Service Six/gi, 'After-Sales Support')
    .replace(/Founder Review/gi, 'Client Review')
    .replace(/Growth Lead/gi, 'Client Success')
    .replace(/Marketing Team/gi, 'Brand Team')
}

function cleanOutsideTags(html) {
  const blocks = []
  let s = html.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/gi, m => {
    const key = `___BS_BLOCK_${blocks.length}___`
    blocks.push(m)
    return key
  })
  s = s.split(/(<[^>]+>)/g).map(part => part.startsWith('<') ? part : cleanText(part)).join('')
  blocks.forEach((b, i) => { s = s.replace(`___BS_BLOCK_${i}___`, b) })
  return s
}
function cleanAttributes(html) {
  return html
    .replace(/(<title[^>]*>)([\s\S]*?)(<\/title>)/gi, (_m, a, b, c) => `${a}${cleanText(b)}${c}`)
    .replace(/(<meta[^>]+name=["']description["'][^>]+content=["'])([^"']*)(["'][^>]*>)/gi, (_m, a, b, c) => `${a}${cleanText(b)}${c}`)
}
function addBodyClass(html, cls) {
  if (/<body\b[^>]*class=["'][^"']*["']/i.test(html)) return html.replace(/<body\b([^>]*class=["'])([^"']*)(["'][^>]*>)/i, (m, a, b, c) => cls.split(/\s+/).every(x => b.split(/\s+/).includes(x)) ? m : `<body${a}${b} ${cls}${c}`)
  return html.replace(/<body\b([^>]*)>/i, `<body class="${cls}"$1>`)
}
function addBodyVars(html, file) {
  const h = crypto.createHash('sha1').update(file).digest()
  const radius = 12 + (h[3] % 28)
  const sectionPad = 62 + (h[4] % 42)
  const heroMin = 84 + (h[5] % 24)
  const wrapMax = 980 + (h[6] % 420)
  const opacity = (24 + (h[7] % 20)) / 100
  const positions = ['center center','left center','right center','center top','center bottom','38% center','62% center']
  const vars = `--bs-radius:${radius}px;--bs-section-pad:${sectionPad}px;--bs-hero-min:${heroMin}vh;--bs-wrap-max:${wrapMax}px;--bs-hero-img-opacity:${opacity};--bs-img-pos:${positions[h[8] % positions.length]};`
  if (/<body\b[^>]*style=["'][^"']*["']/i.test(html)) return html.replace(/<body\b([^>]*style=["'])([^"']*)(["'][^>]*>)/i, (m, a, b, c) => `<body${a}${vars}${b.replace(/--bs-[^;]+;/g,'')}${c}`)
  return html.replace(/<body\b([^>]*)>/i, `<body style="${vars}"$1>`)
}
function suffixFor(file) {
  const m = file.match(/-(atelier|booking|commerce|enterprise|local|magazine|signal|trust)\.html$/)
  return m ? m[1] : 'standard'
}
function variantClassesFor(file) {
  const h = crypto.createHash('sha1').update(file).digest()
  return [`bs-layout-${suffixFor(file)}`, `bs-hero-v${h[0] % 6}`, `bs-visual-v${h[1] % 24}`, `bs-density-v${h[2] % 5}`, `bs-seed-${crypto.createHash('sha1').update(file).digest('hex').slice(0,8)}`].join(' ')
}
function heroBlock(html) {
  return html.match(/<(section|header|div)\b(?=[^>]*(?:class=["'][^"']*hero|id=["'][^"']*hero))[^>]*>[\s\S]*?<\/\1>/i)?.[0] || ''
}
function heroHasMedia(block) {
  return /<img\b|<picture\b|class=["'][^"']*(?:hero-bg|hero-image|hero-visual|hero-media|bs-hero-image-bg)|background-image\s*:/i.test(block)
}
function addHeroImage(html, file) {
  const block = heroBlock(html)
  if (block && heroHasMedia(block)) return html
  const src = stableImage(file.replace(/\.html$/, ''))
  const bg = `<div class="bs-hero-image-bg" aria-hidden="true"><img src="${src}" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer"></div>`
  const heroOpen = /(<(?:section|header|div)\b(?=[^>]*(?:class=["'][^"']*hero|id=["'][^"']*hero))[^>]*>)/i
  if (heroOpen.test(html)) return html.replace(heroOpen, `$1${bg}`)
  return html.replace(/<body\b[^>]*>/i, m => `${m}${bg}`)
}
function stripOldHeroBg(html) {
  return html.replace(/<div\s+class=["']bs-hero-image-bg["'][\s\S]*?<\/div>/gi, '')
}
function visibleText(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
function structuralSignature(html) {
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/https?:\/\/[^"'\s)]+/gi, 'URL')
    .replace(/#[0-9a-f]{3,8}\b/gi, '#HEX')
    .replace(/\b\d+(\.\d+)?(px|rem|em|vh|vw|%)\b/gi, 'N')
    .replace(/>[\s\S]*?</g, '><')
    .replace(/\s(data-[\w-]+|aria-[\w-]+|href|src|alt|title|content|style)=("[^"]*"|'[^']*')/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, 12)
}

let changed = 0
for (const file of files) {
  const p = path.join(sampleDir, file)
  let html = fs.readFileSync(p, 'utf8')
  const before = html
  html = stripBlock(html, 'bs-template-content-quality-fix')
  html = stripOldHeroBg(html)
  html = cleanAttributes(cleanOutsideTags(html))
  html = addBodyClass(html, variantClassesFor(file))
  html = addBodyVars(html, file)
  html = addHeroImage(html, file)
  if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, `${CONTENT_FIX_STYLE}\n</head>`)
  else html = `${CONTENT_FIX_STYLE}\n${html}`
  if (html !== before) { fs.writeFileSync(p, html); changed++ }
}

const templatePatterns = [/\btemplate\b/i,/\bpreview\b/i,/free previews?/i,/free AI preview/i,/replace with real/i,/client reviews later/i,/demo content/i,/placeholder/i,/your backend/i,/AI generator/i,/Brand Syndicate AI renderer/i,/Claude JSON/i,/prompt-based industry matching/i,/AI personalisation/i,/copy wrapping/i,/conversion context/i,/Trust blocks already/i,/Claude/i,/design shells/i,/empty design/i,/This website keeps/i,/generation history/i,/admin panel/i,/AI content/i,/inside Brand Syndicate/i,/Claude/i,/design shells/i,/empty design/i,/This website keeps/i,/generation history/i,/admin panel/i,/AI content/i,/inside Brand Syndicate/i,/structure is intentionally/i,/trust blocks already/i,/intentionally different from your current/i,/regenerate repeatedly/i,/low-cost preview/i]
const genericPatterns = [/Service (One|Two|Three|Four|Five|Six)/i,/Useful for free previews?/i,/easy to replace with real/i,/client reviews later/i,/Lorem ipsum/i,/trust blocks already/i,/AI generator/i,/your backend/i,/Brand Syndicate AI renderer/i,/low-cost preview/i,/free AI preview/i,/What should be refined for paid clients/i,/Claude JSON/i,/prompt-based industry matching/i,/AI personalisation/i,/copy wrapping/i,/conversion context/i,/Trust blocks already/i,/Claude/i,/design shells/i,/empty design/i,/This website keeps/i,/generation history/i,/admin panel/i,/AI content/i,/inside Brand Syndicate/i,/Claude/i,/design shells/i,/empty design/i,/This website keeps/i,/generation history/i,/admin panel/i,/AI content/i,/inside Brand Syndicate/i]
const rows = []
const layouts = new Map()
for (const file of files) {
  const html = fs.readFileSync(path.join(sampleDir, file), 'utf8')
  const text = visibleText(html) + ' ' + (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '') + ' ' + (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? '')
  const imgTags = html.match(/<img\b[^>]*>/gi) || []
  const hero = heroBlock(html) || html.slice(0, 5000)
  const tplMention = templatePatterns.some(p => p.test(text))
  const genericMention = genericPatterns.some(p => p.test(text))
  const sig = structuralSignature(html)
  if (!layouts.has(sig)) layouts.set(sig, [])
  layouts.get(sig).push(file)
  rows.push({ file, imgCount: imgTags.length, heroHasMedia: heroHasMedia(hero), tplMention, genericMention })
}
const duplicateFamilies = [...layouts.values()].filter(x => x.length > 1).sort((a,b)=>b.length-a.length)
const report = {
  generatedAt: new Date().toISOString(),
  filesChanged: changed,
  totalTemplates: files.length,
  noImageTags: rows.filter(r => r.imgCount === 0).length,
  noHeroMedia: rows.filter(r => !r.heroHasMedia).length,
  visibleTemplateLanguage: rows.filter(r => r.tplMention).length,
  genericPlaceholderCopy: rows.filter(r => r.genericMention).length,
  duplicateLayoutFamilies: duplicateFamilies.length,
  templatesInsideDuplicateLayoutFamilies: duplicateFamilies.reduce((n,x)=>n+x.length,0),
  largestDuplicateLayoutFamilies: duplicateFamilies.slice(0,12).map(arr => ({ count: arr.length, examples: arr.slice(0,8) })),
}
fs.writeFileSync(path.join(root, 'TEMPLATE_CONTENT_QUALITY_AUDIT_AFTER.json'), JSON.stringify(report, null, 2))
fs.writeFileSync(path.join(root, 'TEMPLATE_CONTENT_QUALITY_AUDIT_AFTER.md'), `# Template Content Quality Audit — After Fix\n\n- Static templates checked: ${report.totalTemplates}\n- Files changed by content-quality pass: ${report.filesChanged}\n- Files with zero image tags: ${report.noImageTags}\n- Files without detectable hero media: ${report.noHeroMedia}\n- Files with visible template/preview/placeholder language: ${report.visibleTemplateLanguage}\n- Files with generic placeholder copy: ${report.genericPlaceholderCopy}\n- Duplicate layout families by strict structural signature: ${report.duplicateLayoutFamilies}\n- Templates inside strict duplicate layout families: ${report.templatesInsideDuplicateLayoutFamilies}\n\n## Largest remaining strict duplicate families\n\n${report.largestDuplicateLayoutFamilies.map((x,i)=>`${i+1}. ${x.count} files — examples: ${x.examples.join(', ')}`).join('\n')}\n`)
console.log(JSON.stringify(report, null, 2))
