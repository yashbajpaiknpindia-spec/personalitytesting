// src/app/api/website-preview/[id]/route.ts
// Serves raw HTML of a user's saved website for the in-app iframe preview.
// Auth-gated: only the owning user (or admin) can preview.
// This avoids the srcDoc/sandbox escape issue — the iframe loads it as a real
// same-origin document so Google Fonts, inline scripts, and CSS all work.
//
// FIX v2 (blank screen): Added server-side body content check.
// If the stored HTML has an empty/missing <body> (truncation at save time),
// return a visible error page instead of serving a blank white iframe.

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const EMPTY_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><style>
  body{margin:0;background:#09090a;display:flex;align-items:center;
  justify-content:center;height:100vh;font-family:'DM Mono',monospace;
  color:rgba(255,255,255,0.25);font-size:11px;letter-spacing:0.08em;}
</style></head>
<body>No content yet.</body></html>`

// FIX: Shown when stored HTML has CSS but empty body (the original blank-screen bug)
const BODY_MISSING_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#09090a;display:flex;align-items:center;justify-content:center;
       height:100vh;font-family:'DM Mono',monospace;text-align:center;padding:32px;}
  .msg{max-width:360px}
  .icon{font-size:36px;margin-bottom:16px;opacity:0.5}
  h2{color:rgba(255,255,255,0.7);font-size:15px;font-weight:500;margin-bottom:10px;letter-spacing:0.05em}
  p{color:rgba(255,255,255,0.3);font-size:11px;line-height:1.7;letter-spacing:0.04em}
  .hint{margin-top:20px;padding:10px 16px;border:1px solid rgba(201,168,76,0.3);
        border-radius:4px;color:rgba(201,168,76,0.7);font-size:10px;letter-spacing:0.08em}
</style>
</head>
<body>
  <div class="msg">
    <div class="icon">⟳</div>
    <h2>Website Content Incomplete</h2>
    <p>The saved HTML has styles but no page content.<br>
       This usually means the generation was cut short.</p>
    <div class="hint">Click <strong>Regenerate</strong> in the Website tab to rebuild this site.</div>
  </div>
</body>
</html>`


function stripTemplateLanguage(html: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/\btemplate\b/gi, 'website'],
    [/\btemplates\b/gi, 'websites'],
    [/\bClaude JSON personalisation\b/gi, 'business personalisation'],
    [/\bClaude JSON\b/gi, 'business content'],
    [/\bBrand Syndicate AI personalisation\b/gi, 'business personalisation'],
    [/\bAI personalisation\b/gi, 'business personalisation'],
    [/\bprompt-based industry matching\b/gi, 'customer-focused messaging'],
    [/\bfree AI preview\b/gi, 'business website'],
    [/\bAI preview\b/gi, 'business website'],
    [/this website is intentionally different from your current \d+ files:?/gi, ''],
    [/the structure is intentionally predictable:?/gi, ''],
    [/your backend can safely replace text while keeping the design intact\.?/gi, ''],
    [/new ID, new label, new section order, industry menu, copy pattern and layout treatment\.?/gi, ''],
    [/Claude JSON personalisation/gi, 'service and content clarity'],
    [/Claude JSON/gi, 'business content'],
    [/Brand Syndicate AI personalisation/gi, 'customer-ready presentation'],
    [/AI personalisation/gi, 'customer-ready presentation'],
    [/prompt-based industry matching/gi, 'category-specific messaging'],
    [/free AI preview/gi, 'business website'],
    [/AI preview/gi, 'business website'],
    [/Live Preview/gi, 'Project Snapshot'],
    [/Preview Quality/gi, 'Website Quality'],
    [/Every section is structured so your AI generator can replace copy, colours and business details without breaking the design\.?/gi, 'Every section explains the offer clearly, builds trust and guides visitors toward enquiry.'],
    [/your backend can safely replace text while keeping the design intact\.?/gi, 'the page stays readable as business details expand.'],
    [/Claude can add these as complete websites, not empty design shells\.?/gi, 'the page feels complete, credible and ready for enquiries.'],
    [/Connect this form to your existing generation history, admin panel, WhatsApp follow-up or CRM\. The layout stays readable even when Claude inserts longer AI content\.?/gi, 'Connect this form to WhatsApp, CRM or direct follow-up. The layout stays readable even with longer customer requirements.'],
    [/generation history, admin panel, WhatsApp follow-up or CRM/gi, 'WhatsApp, CRM or direct follow-up'],
    [/even when Claude inserts longer AI content/gi, 'even with longer customer requirements'],
    [/inside Brand Syndicate\.?/gi, ''],
  ]
  return html.split(/(<[^>]+>)/g).map(part => {
    if (part.startsWith('<')) return part
    let clean = part
    for (const [pattern, replacement] of replacements) clean = clean.replace(pattern, replacement)
    return clean.replace(/\s{2,}/g, ' ')
  }).join('')
}




function stablePreviewImageForQuery(query: string): string {
  const hay = decodeURIComponent(String(query || '')).replace(/[,+]/g, ' ')
  const options: Array<[RegExp, string]> = [
    [/furniture|sofa|interior|decor|wood|carpenter|kitchen/i, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=75&auto=format&fit=crop'],
    [/school|college|academy|coaching|learning|education|training|student|course/i, 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=75&auto=format&fit=crop'],
    [/clinic|hospital|doctor|medical|dental|ayurveda|wellness|spa|health/i, 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&q=75&auto=format&fit=crop'],
    [/restaurant|cafe|bakery|food|cloud-kitchen|bar|lounge|chef|chocolate/i, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=75&auto=format&fit=crop'],
    [/fashion|boutique|clothing|apparel|beauty|cosmetic|salon/i, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=75&auto=format&fit=crop'],
    [/jewel|diamond|luxury|adore/i, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=75&auto=format&fit=crop'],
    [/real-estate|property|villa|architect|architecture|construction/i, 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=75&auto=format&fit=crop'],
    [/auto|car|bike|vehicle|automobile|mobility|showroom/i, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=75&auto=format&fit=crop'],
    [/sports|fitness|gym|marathon|bat|cricket|club/i, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=75&auto=format&fit=crop'],
    [/farm|agri|crop|organic|dairy|rural/i, 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=75&auto=format&fit=crop'],
    [/finance|accounting|fintech|bank|tax|loan|wealth/i, 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=75&auto=format&fit=crop'],
    [/logistics|warehouse|courier|shipping|transport/i, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=75&auto=format&fit=crop'],
    [/solar|energy|power/i, 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=75&auto=format&fit=crop'],
    [/travel|tour|hotel|resort|stay/i, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=75&auto=format&fit=crop'],
    [/law|legal|advocate/i, 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=75&auto=format&fit=crop'],
    [/tech|saas|software|ai|automation|cyber|blockchain|app|cloud/i, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=75&auto=format&fit=crop'],
  ]
  for (const [pattern, url] of options) if (pattern.test(hay)) return url
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=75&auto=format&fit=crop'
}

function replaceDeprecatedPreviewImages(html: string): string {
  return html.replace(/https:\/\/source\.unsplash\.com\/featured\/(?:\d+x\d+\/)?\?([^"'\s<)]+)/gi, (_match, query: string) => stablePreviewImageForQuery(query))
}

function repairCommonTemplateHtmlIssues(html: string): string {
  return replaceDeprecatedPreviewImages(html)
    .replace(/<img([^>]*?)\/\s+(loading|decoding|style|class|alt|src)=/gi, '<img$1 $2=')
    .replace(/<img([^>]*?)\/\s*>/gi, '<img$1>')
    .replace(/width:\s*100vw/gi, 'width:100%')
    .replace(/min-width:\s*100vw/gi, 'min-width:100%')
}

function ensureEmailFieldInForms(html: string): string {
  const emailInput = '<input type="email" name="email" aria-label="Email" placeholder="Email" autocomplete="email" data-bs-injected-email="true" />'
  return html.replace(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi, (match, attrs, inner) => {
    if (/type=["']email["']|name=["']email["']|aria-label=["']email["']|placeholder=["']email["']/i.test(inner)) return match
    let nextInner = inner
    if (/<textarea\b/i.test(nextInner)) {
      nextInner = nextInner.replace(/<textarea\b/i, `${emailInput}<textarea`)
    } else if (/<button\b/i.test(nextInner)) {
      nextInner = nextInner.replace(/<button\b/i, `${emailInput}<button`)
    } else if (/<input\b/i.test(nextInner)) {
      nextInner = `${nextInner}${emailInput}`
    } else {
      nextInner = `${emailInput}${nextInner}`
    }
    return `<form${attrs}>${nextInner}</form>`
  })
}

function removeDeadFormHandlers(html: string): string {
  return ensureEmailFieldInForms(html)
    .replace(/\s+onsubmit=["']return\s+false;?["']/gi, '')
    .replace(/\s+onsubmit=["']event\.preventDefault\(\);?["']/gi, '')
}

function injectLeadCapture(html: string, ownerId: string, slug: string): string {
  let clean = removeDeadFormHandlers(html)
  if (!/<form\b/i.test(clean)) return clean

  clean = clean.replace(/<script\b[^>]*id=["']bs-lead-capture-script["'][\s\S]*?<\/script>/gi, '')
  clean = clean.replace(/<form\b(?![^>]*data-bs-lead-form)/gi, '<form data-bs-lead-form="true"')

  const script = `
<script id="bs-lead-capture-script">
(function(){
  var OWNER_ID = ${JSON.stringify(ownerId)};
  var SOURCE_SLUG = ${JSON.stringify(`website:${slug}`)};
  function clean(v){ return (v == null ? '' : String(v)).trim(); }
  function fields(form){ return Array.prototype.slice.call(form.querySelectorAll('input, textarea, select')); }
  function findValue(form, hints){
    var all = fields(form);
    for(var i=0;i<all.length;i++){
      var el = all[i];
      var hay = [el.getAttribute('name'), el.getAttribute('id'), el.getAttribute('placeholder'), el.getAttribute('aria-label'), el.getAttribute('type')].map(clean).join(' ').toLowerCase();
      for(var j=0;j<hints.length;j++){ if(hay.indexOf(hints[j]) !== -1) return clean(el.value); }
    }
    return '';
  }
  function status(form, text, ok){
    var box = form.querySelector('[data-bs-lead-status]');
    if(!box){ box = document.createElement('div'); box.setAttribute('data-bs-lead-status','true'); box.style.marginTop='10px'; box.style.fontSize='13px'; box.style.lineHeight='1.45'; form.appendChild(box); }
    box.style.color = ok ? '#16a34a' : '#dc2626';
    box.textContent = text;
  }
  document.addEventListener('submit', function(event){
    var form = event.target;
    if(!form || !form.matches || !form.matches('form')) return;
    if(form.getAttribute('data-bs-native-submit') === 'true') return;
    event.preventDefault();
    var name = findValue(form, ['name','full name','your name']) || 'Website Visitor';
    var email = findValue(form, ['email','mail']);
    var phone = findValue(form, ['phone','mobile','whatsapp','contact','number']);
    var company = findValue(form, ['company','business','organisation','organization','brand']);
    var message = findValue(form, ['message','requirement','details','project','tell us']);
    if(message && !company) company = message.slice(0,120);
    if(!email && !phone){ status(form, 'Please enter email or phone so we can contact you.', false); return; }
    fetch('/api/card/capture-lead', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ownerId: OWNER_ID, sourceSlug: SOURCE_SLUG, name: name, email: email || '', phone: phone || '', company: company || '' }) })
      .then(function(res){ if(!res.ok) throw new Error('Lead capture failed'); status(form, 'Thanks — your enquiry has been sent.', true); try{ form.reset(); }catch(e){} })
      .catch(function(){ status(form, 'Could not send right now. Please try again.', false); });
  }, true);
})();
</script>`

  if (/<\/body>/i.test(clean)) return clean.replace(/<\/body>/i, script + '\n</body>')
  return clean + script
}


function hasBodyContent(html: string): boolean {
  // Check if the body tag exists and contains meaningful markup
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (!bodyMatch) return false
  // Strip comments and whitespace to get actual content
  const bodyContent = bodyMatch[1]
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '') // ignore scripts
    .trim()
  // Need at least ~100 chars of real HTML markup in body
  return bodyContent.length > 100
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const isAdmin = session.user.email === 'yashbajpaiknpindia@gmail.com'

  const site = isAdmin
    ? await db.userWebsite.findUnique({
        where: { id: params.id },
        select: { htmlContent: true, userId: true, slug: true },
      }).catch(() => null)
    : await db.userWebsite.findFirst({
        where: { id: params.id, userId: session.user.id },
        select: { htmlContent: true, userId: true, slug: true },
      }).catch(() => null)

  if (!site) {
    return new Response('Not found', { status: 404 })
  }

  const rawHtml = site.htmlContent?.trim() || ''

  // FIX: Guard against the blank-screen case — stored HTML has <style> but empty <body>
  let html: string
  if (!rawHtml) {
    html = EMPTY_HTML
  } else if (!hasBodyContent(rawHtml)) {
    // HTML exists but body is empty/missing — show the repair prompt instead of blank
    console.warn(`[website-preview] Site ${params.id} has empty body content. Serving repair page.`)
    html = BODY_MISSING_HTML
  } else {
    html = repairCommonTemplateHtmlIssues(injectLeadCapture(stripTemplateLanguage(rawHtml), site.userId, site.slug || params.id))
  }

  html = html.replace(/<style[^>]+id=["']bs-mobile-root-hero-fix-v[67]["'][\s\S]*?<\/style>/gi, '')

  // VISIBILITY SAFETY NET: inject override CSS for any legacy sites that have
  // scroll-reveal hidden elements (opacity:0 / visibility:hidden base styles).
  // This ensures content is always visible regardless of observer firing.
  const responsiveOverride = `
<style id="bs-preview-responsive-fix">
/* Preview safety layer for saved/generated websites: prevents mobile overlap, clipped drawers and vertical brand text. */
*,*::before,*::after{box-sizing:border-box!important;}
html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;-webkit-text-size-adjust:100%!important;}
body{min-width:0!important;}
img,video,iframe,canvas,svg{max-width:100%!important;}
img{display:block;object-position:center center;}
section,main,footer,header,nav,.container,.wrap,.wrapper,[class*="container"],[class*="wrap"]{max-width:100%!important;min-width:0!important;}
form,input,textarea,select,button{max-width:100%!important;}
input,textarea,select{min-height:44px!important;}
table{max-width:100%!important;}

/* nav/logo anti-break layer */
nav,header,header nav,[class*="navbar"],[class*="nav-inner"],[class*="navInner"]{min-width:0!important;overflow:visible!important;}
nav>*,header>*,header nav>*{min-width:0!important;}
nav [class*="logo"],nav [class*="brand"],nav [class*="company"],header [class*="logo"],header [class*="brand"],header [class*="company"],nav a:first-child,header a:first-child{
  white-space:nowrap!important;word-break:keep-all!important;overflow-wrap:normal!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important;line-height:1.12!important;display:inline-flex!important;align-items:center!important;gap:.35rem!important;max-width:calc(100% - 92px)!important;overflow:hidden!important;text-overflow:ellipsis!important;
}
nav [class*="logo"] *,nav [class*="brand"] *,header [class*="logo"] *,header [class*="brand"] *{white-space:nowrap!important;word-break:keep-all!important;overflow-wrap:normal!important;}

@media(max-width:768px){
  body{font-size:16px!important;}
  nav,header nav,[class*="navbar"],[class*="nav-inner"],[class*="navInner"]{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;height:auto!important;min-height:0!important;padding-left:16px!important;padding-right:16px!important;overflow:visible!important;}
  nav [class*="logo"],nav [class*="brand"],header [class*="logo"],header [class*="brand"],nav a:first-child,header a:first-child{flex:1 1 auto!important;max-width:calc(100% - 96px)!important;font-size:clamp(14px,4.8vw,22px)!important;letter-spacing:.04em!important;}
  .bs-mobile-nav-ready [class*="links"],.bs-mobile-nav-ready [class*="nav-links"],.bs-mobile-nav-ready [class*="navLinks"],.bs-mobile-nav-ready [class*="menu"]:not(.bs-mobile-menu-toggle),.bs-mobile-nav-ready .bs-mobile-nav-original{display:none!important;}
  nav > a[class*="cta"],nav > a[class*="btn"],nav > button[class*="cta"],nav > button[class*="btn"],nav [class*="nav-cta"],header [class*="nav-cta"]{display:none!important;}
  nav [class*="actions"],header [class*="actions"],nav [class*="desktop"],header [class*="desktop"],nav ul,header nav ul{display:none!important;}
  nav button[aria-label*="menu" i],header button[aria-label*="menu" i],nav [class*="hamb" i],header [class*="hamb" i],nav [class*="toggle" i],header [class*="toggle" i]{display:flex!important;flex:0 0 auto!important;}
  .bs-mobile-nav-ready > a[class*="cta"],.bs-mobile-nav-ready > a[class*="btn"],.bs-mobile-nav-ready > button[class*="cta"],.bs-mobile-nav-ready > button[class*="btn"]{display:none!important;}
  [class*="hero-content"],[class*="hero-left"],[class*="hero-inner"],[class*="hero-copy"],[class*="hero-text"],[class*="showcase"],[class*="card"],[class*="content"],[class*="copy"],.panel,.quote,.price,.lead-form{min-width:0!important;max-width:100%!important;}
  section,.section,[class*="section"]{padding-left:clamp(16px,5vw,28px)!important;padding-right:clamp(16px,5vw,28px)!important;}
  [class*="metric"],[class*="stat"],[class*="service"],[class*="feature"],[class*="price"],[class*="testimonial"]{min-width:0!important;overflow-wrap:break-word!important;}
  nav a,header a,nav button,header button{flex-shrink:1!important;}
  :not(body)[class*="hero"],.hero,section:first-of-type{height:auto!important;min-height:auto!important;padding-top:clamp(56px,14vw,96px)!important;padding-bottom:clamp(56px,14vw,96px)!important;}
  :not(body)[class*="hero"],.hero{position:relative!important;overflow:hidden!important;min-height:clamp(400px,90vw,700px)!important;display:flex!important;flex-direction:column!important;justify-content:center!important;}
  .hero-bg,.hero-bg img,[class*="hero-bg"],[class*="hero-bg"] img,[class*="heroBg"],[class*="heroBg"] img,[class*="hero-image"],[class*="hero-image"] img,[class*="hero-visual"],[class*="hero-visual"] img,[class*="hero-media"],[class*="hero-media"] img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;z-index:-1!important;display:block!important;}
  :not(body)[class*="hero"]>div,.hero>div,:not(body)[class*="hero"]>.wrap,.hero>.wrap{position:relative!important;z-index:2!important;}
  img:not(:not(body)[class*="hero"]):not([class*="bg"]):not([class*="cover"]):not([class*="fill"]):not([style*="position:absolute"]):not([style*="position: absolute"]){height:auto!important;max-height:70vh!important;}
  h1{font-size:clamp(2rem,10vw,3.4rem)!important;line-height:1.05!important;max-width:100%!important;word-break:normal!important;overflow-wrap:break-word!important;}
  h2{font-size:clamp(1.55rem,7vw,2.4rem)!important;line-height:1.15!important;word-break:normal!important;overflow-wrap:break-word!important;}
  h3,p,li,a,button,span{word-break:normal!important;overflow-wrap:break-word!important;}
  .grid,[class*="grid"],[style*="grid-template-columns"],.features,.services,.pricing,.testimonials,.gallery,.metric-grid,.proof-wall,.contact,.split,.hero-grid{grid-template-columns:1fr!important;}
  [style*="display:flex"],[style*="display: flex"],.row,[class*="row"]{flex-wrap:wrap!important;}
  [style*="min-width"]{min-width:0!important;}
  table{display:block!important;width:100%!important;overflow-x:auto!important;}
}

.bs-mobile-menu-toggle{display:none;align-items:center;justify-content:center;flex-direction:column;gap:4px;width:42px;height:42px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.08);color:inherit;cursor:pointer;z-index:10001;flex:0 0 auto!important;}
.bs-mobile-menu-toggle span{display:block;width:18px;height:2px;background:currentColor;border-radius:2px;}
.bs-mobile-drawer{display:none;position:fixed;left:12px;right:12px;top:72px;z-index:10000;padding:14px;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:rgba(10,10,10,.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 24px 60px rgba(0,0,0,.5);}
.bs-mobile-drawer.open{display:grid!important;gap:8px;}
.bs-mobile-drawer-link{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:42px!important;padding:11px 14px!important;border-radius:12px!important;text-decoration:none!important;color:#fff!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.08)!important;font-size:13px!important;letter-spacing:.08em!important;text-transform:uppercase!important;}
@media(max-width:768px){.bs-mobile-nav-ready{position:relative!important;}.bs-mobile-nav-ready .bs-mobile-menu-toggle{display:flex!important;margin-left:auto!important;}.bs-mobile-nav-ready .bs-mobile-drawer{display:none!important;}.bs-mobile-nav-ready .bs-mobile-drawer.open{display:grid!important;}}
</style>`
  const existingSpaceOverride = `
<style id="bs-existing-section-spacing-fix">
/* Existing saved website smoothness layer: section spacing, mobile text flow, non-cutoff media. */
html{scroll-behavior:smooth!important;}
body{line-height:1.55!important;text-rendering:optimizeLegibility!important;}
body *{min-width:0;}
h1,h2,h3,h4,h5,h6,p,li,a,button,span,small,strong,em{max-width:100%;overflow-wrap:break-word;word-break:normal;}
p,li{line-height:1.65!important;}
a,button,.btn,[class*="btn"],[class*="button"],[class*="cta"]{white-space:normal!important;min-height:44px;align-items:center;justify-content:center;text-align:center;}
section,.section,[class*="section"],main>div,footer{position:relative;max-width:100%;overflow:visible;}
section,.section,[class*="section"]{padding-block:clamp(48px,8vw,112px)!important;}
.container,.wrap,.wrapper,[class*="container"],[class*="wrap"],[class*="inner"]{width:min(100% - clamp(28px,6vw,96px),1200px)!important;margin-inline:auto!important;}
.grid,[class*="grid"],.cards,[class*="cards"],.row,[class*="row"],.features,[class*="features"],.services,[class*="services"],.pricing,[class*="pricing"],.testimonials,[class*="testimonials"],.gallery,[class*="gallery"]{gap:clamp(16px,3vw,40px)!important;}
.card,[class*="card"],.panel,[class*="panel"],.feature,[class*="feature"],.service,[class*="service"],.price,[class*="price"],.testimonial,[class*="testimonial"]{height:auto!important;min-height:0;overflow-wrap:break-word;}
img,picture,video,iframe{max-width:100%!important;}
img,video{height:auto;object-fit:cover;}
:not(body)[class*="hero"],.hero{isolation:isolate;}
:not(body)[class*="hero"]>*,.hero>*{max-width:100%;}
:not(body)[class*="hero"] p,.hero p{max-width:min(100%,68ch)!important;}
@media(max-width:1024px){
  [style*="grid-template-columns"],.grid,[class*="grid"],.cards,[class*="cards"],.features,[class*="features"],.services,[class*="services"],.pricing,[class*="pricing"],.testimonials,[class*="testimonials"],.gallery,[class*="gallery"],.split,[class*="split"]{grid-template-columns:1fr!important;}
  [style*="display:flex"],[style*="display: flex"],.row,[class*="row"],.columns,[class*="columns"]{flex-wrap:wrap!important;}
}
@media(max-width:768px){
  body{font-size:16px!important;}
  section,.section,[class*="section"]{padding-block:clamp(44px,14vw,84px)!important;padding-left:0!important;padding-right:0!important;overflow:visible!important;}
  .container,.wrap,.wrapper,[class*="container"],[class*="wrap"],[class*="inner"]{width:min(100% - 28px,100%)!important;}
  h1{font-size:clamp(32px,11vw,58px)!important;line-height:1.05!important;letter-spacing:max(-.06em,-2px)!important;}
  h2{font-size:clamp(26px,8vw,42px)!important;line-height:1.12!important;}
  h3{font-size:clamp(20px,6vw,30px)!important;line-height:1.18!important;}
  p,li{font-size:clamp(14px,4.2vw,17px)!important;line-height:1.65!important;}
  :not(body)[class*="hero"],.hero{height:auto!important;min-height:clamp(420px,92vw,720px)!important;padding-top:clamp(84px,20vw,128px)!important;padding-bottom:clamp(52px,16vw,92px)!important;display:flex!important;flex-direction:column!important;justify-content:center!important;overflow:hidden!important;}
  :not(body)[class*="hero"] .container,:not(body)[class*="hero"] .wrap,:not(body)[class*="hero"] [class*="inner"],.hero .container,.hero .wrap,.hero [class*="inner"]{display:block!important;}
  [class*="hero-bg"],[class*="hero-bg"] img,[class*="heroBg"],[class*="heroBg"] img,[class*="hero-image"],[class*="hero-image"] img,[class*="hero-visual"],[class*="hero-visual"] img,[class*="hero-media"],[class*="hero-media"] img,.hero-bg,.hero-bg img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;z-index:-1!important;}
  :not(body)[class*="hero"]::after,.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,.78));z-index:-1;pointer-events:none;}
  .card,[class*="card"],.panel,[class*="panel"],.feature,[class*="feature"],.service,[class*="service"],.price,[class*="price"],.testimonial,[class*="testimonial"],form{padding:clamp(18px,5vw,28px)!important;max-width:100%!important;}
  img:not([class*="bg"]):not([style*="position:absolute"]):not([style*="position: absolute"]){max-height:72vh!important;}
}
@media(max-width:430px){
  .container,.wrap,.wrapper,[class*="container"],[class*="wrap"],[class*="inner"]{width:min(100% - 24px,100%)!important;}
  h1{font-size:clamp(30px,12vw,48px)!important;}
}
</style>
`
  const existingLayoutScript = `
<script id="bs-existing-layout-fix-script">
(function(){try{function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn();}
function fix(){var vw=document.documentElement.clientWidth||window.innerWidth;document.querySelectorAll('body *').forEach(function(el){try{var cs=getComputedStyle(el);if(cs.display==='none')return;var r=el.getBoundingClientRect();if((r.right>vw+2||el.scrollWidth>vw+2)&&!el.closest('.bs-mobile-drawer')){el.style.maxWidth='100%';el.style.minWidth='0';el.style.overflowWrap='break-word';if(cs.display.indexOf('grid')!==-1&&vw<1024)el.style.gridTemplateColumns='1fr';if(cs.display.indexOf('flex')!==-1&&vw<1024)el.style.flexWrap='wrap';}if(vw<768&&/H1|H2|H3|P|LI/.test(el.tagName)){el.style.maxWidth='100%';el.style.overflowWrap='break-word';}}catch(e){}});}ready(function(){fix();setTimeout(fix,350);setTimeout(fix,1200);});window.addEventListener('resize',function(){clearTimeout(window.__bsLayoutFixTimer);window.__bsLayoutFixTimer=setTimeout(fix,120);},{passive:true});}catch(e){}})();
</script>
`

  const rootHeroOverride = `
<style id="bs-mobile-root-hero-fix-v7">
/* Final mobile correction: broad hero selectors used to catch body/header/hero-grid on phones. */
@media(max-width:980px){
  body[class*="bs-hero-v"]{display:block!important;position:static!important;padding:0!important;margin:0!important;min-height:100%!important;height:auto!important;overflow-x:hidden!important;}
  body[class*="bs-hero-v"]>nav,body[class*="bs-hero-v"]>.nav,body[class*="bs-hero-v"]>header{position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:10000!important;transform:none!important;}
  body[class*="bs-hero-v"] .hero,body[class*="bs-layout-"] .hero,body[class*="bs-seed-"] .hero,main.hero,section.hero{position:relative!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;justify-content:center!important;min-height:0!important;height:auto!important;}
  body[class*="bs-hero-v"] .hero-grid,body[class*="bs-layout-"] .hero-grid,body[class*="bs-seed-"] .hero-grid,body[class*="bs-hero-v"] .wrap.hero-grid,body[class*="bs-layout-"] .wrap.hero-grid,body[class*="bs-seed-"] .wrap.hero-grid,[class*="hero-grid"]{min-height:0!important;height:auto!important;padding-top:0!important;padding-bottom:0!important;display:grid!important;grid-template-columns:1fr!important;gap:24px!important;align-items:start!important;justify-content:initial!important;overflow:visible!important;width:min(100% - 28px,1180px)!important;margin-inline:auto!important;}
  .hero-bg,[class*="hero-bg"],.bs-hero-image-bg,[class*="hero-image"],[class*="hero-visual"],[class*="hero-media"]{padding:0!important;margin:0!important;min-height:0!important;}
  body[class*="bs-hero-v"] .hero-bg,body[class*="bs-layout-"] .hero-bg,body[class*="bs-seed-"] .hero-bg,body[class*="bs-hero-v"] .bs-hero-image-bg,body[class*="bs-layout-"] .bs-hero-image-bg,body[class*="bs-seed-"] .bs-hero-image-bg,.hero>.hero-bg,.hero>.bs-hero-image-bg,main.hero>.bs-hero-image-bg{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;z-index:0!important;pointer-events:none!important;overflow:hidden!important;}
  body[class*="bs-hero-v"] .hero-bg img,body[class*="bs-layout-"] .hero-bg img,body[class*="bs-seed-"] .hero-bg img,body[class*="bs-hero-v"] .bs-hero-image-bg img,body[class*="bs-layout-"] .bs-hero-image-bg img,body[class*="bs-seed-"] .bs-hero-image-bg img,.hero>.hero-bg img,.hero>.bs-hero-image-bg img,main.hero>.bs-hero-image-bg img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;display:block!important;}
  body[class*="bs-hero-v"][class*="bs-layout-"][class*="bs-seed-"] .hero.hero .hero-bg.hero-bg,body[class*="bs-hero-v"][class*="bs-layout-"][class*="bs-seed-"] .hero.hero .bs-hero-image-bg.bs-hero-image-bg{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;padding:0!important;margin:0!important;z-index:0!important;overflow:hidden!important;}
  body[class*="bs-hero-v"][class*="bs-layout-"][class*="bs-seed-"] .hero.hero .hero-bg.hero-bg img,body[class*="bs-hero-v"][class*="bs-layout-"][class*="bs-seed-"] .hero.hero .bs-hero-image-bg.bs-hero-image-bg img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;display:block!important;}
  .hero>div:not(.hero-bg):not(.bs-hero-image-bg),main.hero>div:not(.hero-bg):not(.bs-hero-image-bg),section.hero>div:not(.hero-bg):not(.bs-hero-image-bg),.hero>.wrap,main.hero>.wrap,section.hero>.wrap{position:relative!important;z-index:2!important;}
  .hero-actions,[class*="hero-actions"],.actions{min-height:0!important;padding-top:0!important;padding-bottom:0!important;display:flex!important;flex-wrap:wrap!important;gap:12px!important;}
  body[class*="bs-hero-v"] .showcase,body[class*="bs-layout-"] .showcase,body[class*="bs-seed-"] .showcase,.hero-card,[class*="hero-card"]{width:100%!important;max-width:100%!important;padding:0!important;display:block!important;overflow:hidden!important;}
}
@media(max-width:560px){
  .hero,.hero-section,main.hero,section.hero{padding-top:clamp(86px,20vw,112px)!important;padding-bottom:clamp(38px,10vw,64px)!important;min-height:0!important;height:auto!important;}
  body[class*="bs-hero-v"] .showcase{min-height:260px!important;}
  .hero-card,[class*="hero-card"]{min-height:220px!important;max-height:320px!important;}
  .hero-card>img,[class*="hero-card"]>img{min-height:220px!important;max-height:320px!important;}
}
</style>
`

  const imageOverride = `
<script id="bs-image-fallback-script">(function(){try{function fb(i){if(!i||i.dataset.bsFallbackApplied==='true')return;i.dataset.bsFallbackApplied='true';i.onerror=null;i.alt=i.alt||'Image unavailable';i.style.background='linear-gradient(135deg,#16110B,#3A2A16)';i.style.minHeight=i.style.minHeight||'180px';i.style.objectFit=i.style.objectFit||'cover';var label=(i.alt||'Image unavailable').replace(/[<>&"]/g,' ').slice(0,80);var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#16110B"/><stop offset="1" stop-color="#6A4A25"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#F5E8D0" font-family="Georgia,serif" font-size="44" letter-spacing="4">'+label+'</text></svg>';i.src='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);}function f(){document.querySelectorAll('img').forEach(function(i){i.loading='eager';i.decoding='async';if(!i.getAttribute('referrerpolicy'))i.setAttribute('referrerpolicy','no-referrer');i.onerror=function(){fb(this)};if(i.complete&&i.naturalWidth===0)fb(i);});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',f);else f();window.addEventListener('load',f);}catch(e){}})();</script>`

  const mobileNavOverride = `
<script id="bs-mobile-nav-script">
(function(){try{function r(f){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',f);else f();}r(function(){(document.querySelectorAll('nav').length?document.querySelectorAll('nav'):document.querySelectorAll('header')).forEach(function(nav){if(nav.querySelector('.bs-mobile-menu-toggle'))return;var et=Array.prototype.slice.call(nav.querySelectorAll('button,div[role="button"]')).filter(function(el){var cls=(el.className||'').toLowerCase();return /toggle|burger|hamburger|menu-btn|mob|drawer|open/.test(cls)||(el.children.length>=2&&Array.prototype.every.call(el.children,function(c){return c.tagName==='SPAN';}));});if(et.length>0){nav.classList.add('bs-mobile-nav-ready');Array.prototype.slice.call(nav.querySelectorAll('a,button')).forEach(function(el){if(et.indexOf(el)!==-1)return;var txt=(el.textContent||'').trim().toLowerCase();var cls=((el.className||'')+'').toLowerCase();var brand=/brand|logo|company/.test(cls)&&txt.length<34;var act=/schedule|consult|collection|service|about|contact|shop|book|pricing|generate|get started|start|portfolio/.test(txt)||/links|actions|cta|btn|menu/.test(cls);if(!brand&&act)el.classList.add('bs-mobile-nav-original');});return;}var links=Array.prototype.slice.call(nav.querySelectorAll('a,button')).filter(function(el,i){var txt=(el.textContent||'').trim();if(!txt)return false;if(i===0&&txt.length<34)return false;if(el.classList&&(el.classList.contains('bs-mobile-menu-toggle')||el.classList.contains('bs-mobile-drawer-link')))return false;return true;});if(links.length<2)return;links.forEach(function(el){var p=el.parentElement;if(p&&p!==nav&&p.children.length<=Math.max(links.length+1,3))p.classList.add('bs-mobile-nav-original');else el.classList.add('bs-mobile-nav-original');});var b=document.createElement('button');b.type='button';b.className='bs-mobile-menu-toggle';b.setAttribute('aria-label','Open menu');b.setAttribute('aria-expanded','false');b.innerHTML='<span></span><span></span><span></span>';var d=document.createElement('div');d.className='bs-mobile-drawer';links.forEach(function(el){var c=el.cloneNode(true);c.classList.add('bs-mobile-drawer-link');c.removeAttribute('style');c.addEventListener('click',function(){d.classList.remove('open');b.setAttribute('aria-expanded','false');});d.appendChild(c);});function pd(){var r=nav.getBoundingClientRect();d.style.top=(r.bottom+6)+'px';}b.addEventListener('click',function(){pd();var o=d.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});document.addEventListener('click',function(e){if(!nav.contains(e.target)&&!d.contains(e.target)){d.classList.remove('open');b.setAttribute('aria-expanded','false');}});nav.appendChild(b);document.body.appendChild(d);nav.classList.add('bs-mobile-nav-ready');});});}catch(e){}})();
</script>`

  const visibilityOverride = `\n<style id="bs-visibility-fix">
[class*="reveal"],[class*="hidden"],[class*="fade"],[class*="slide"],[data-reveal],[data-animate]{opacity:1!important;transform:none!important;visibility:visible!important;}
</style>`
  if (html.includes('</head>')) {
    html = html.replace('</head>', visibilityOverride + responsiveOverride + existingSpaceOverride + rootHeroOverride + existingLayoutScript + imageOverride + mobileNavOverride + '\n</head>')
  }

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      // Allow framing only from same origin (the generate page)
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
