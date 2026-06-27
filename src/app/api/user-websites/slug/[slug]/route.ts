// src/app/api/user-websites/slug/[slug]/route.ts
// Public GET – returns the HTML content of a published website by slug.
// Used by the /w/[slug] viewer page.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'



const EXISTING_WEBSITE_SPACE_FIX_STYLE = `
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
const MOBILE_ROOT_HERO_FIX_STYLE = `
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

const EXISTING_WEBSITE_LAYOUT_FIX_SCRIPT = `
<script id="bs-existing-layout-fix-script">
(function(){try{function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn();}
function fix(){var vw=document.documentElement.clientWidth||window.innerWidth;document.querySelectorAll('body *').forEach(function(el){try{var cs=getComputedStyle(el);if(cs.display==='none')return;var r=el.getBoundingClientRect();if((r.right>vw+2||el.scrollWidth>vw+2)&&!el.closest('.bs-mobile-drawer')){el.style.maxWidth='100%';el.style.minWidth='0';el.style.overflowWrap='break-word';if(cs.display.indexOf('grid')!==-1&&vw<1024)el.style.gridTemplateColumns='1fr';if(cs.display.indexOf('flex')!==-1&&vw<1024)el.style.flexWrap='wrap';}if(vw<768&&/H1|H2|H3|P|LI/.test(el.tagName)){el.style.maxWidth='100%';el.style.overflowWrap='break-word';}}catch(e){}});}ready(function(){fix();setTimeout(fix,350);setTimeout(fix,1200);});window.addEventListener('resize',function(){clearTimeout(window.__bsLayoutFixTimer);window.__bsLayoutFixTimer=setTimeout(fix,120);},{passive:true});}catch(e){}})();
</script>
`

function injectExistingWebsiteLayoutFixes(html: string): string {
  let clean = html
    .replace(/<style[^>]+id=["']bs-existing-section-spacing-fix["'][\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]+id=["']bs-existing-layout-fix-script["'][\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]+id=["']bs-mobile-root-hero-fix-v[67]["'][\s\S]*?<\/style>/gi, '')
  if (/<\/head>/i.test(clean)) return clean.replace(/<\/head>/i, EXISTING_WEBSITE_SPACE_FIX_STYLE + MOBILE_ROOT_HERO_FIX_STYLE + EXISTING_WEBSITE_LAYOUT_FIX_SCRIPT + '\n</head>')
  return EXISTING_WEBSITE_SPACE_FIX_STYLE + MOBILE_ROOT_HERO_FIX_STYLE + EXISTING_WEBSITE_LAYOUT_FIX_SCRIPT + clean
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

function stripInternalTemplateLanguage(html: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/\bClaude JSON personalisation\b/gi, 'business personalisation'],
    [/\bClaude JSON\b/gi, 'business content'],
    [/\bBrand Syndicate AI personalisation\b/gi, 'business personalisation'],
    [/\bAI personalisation\b/gi, 'business personalisation'],
    [/\bprompt-based industry matching\b/gi, 'customer-focused messaging'],
    [/\bfree AI preview\b/gi, 'business website'],
    [/\bAI preview\b/gi, 'business website'],
    [/\btemplate\b/gi, 'website'],
    [/\btemplates\b/gi, 'websites'],
    [/The structure is intentionally predictable:?/gi, ''],
    [/your backend can safely replace text while keeping the design intact\.?/gi, ''],
    [/inside Brand Syndicate\.?/gi, ''],
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

function injectLeadCapture(html: string, ownerId: string, slug: string): string {
  let clean = removeDeadFormHandlers(stripInternalTemplateLanguage(html))
  if (!/<form\b/i.test(clean)) return clean

  clean = clean.replace(/<script\b[^>]*id=["']bs-lead-capture-script["'][\s\S]*?<\/script>/gi, '')
  clean = clean.replace(/<form\b(?![^>]*data-bs-lead-form)/gi, '<form data-bs-lead-form="true"')

  const script = `
<script id="bs-lead-capture-script">
(function(){
  var OWNER_ID = ${JSON.stringify(ownerId)};
  var SOURCE_SLUG = ${JSON.stringify(`website:${slug}`)};

  function clean(v){ return (v == null ? '' : String(v)).trim(); }
  function formFields(form){ return Array.prototype.slice.call(form.querySelectorAll('input, textarea, select')); }
  function findValue(form, hints){
    var fields = formFields(form);
    for (var i=0;i<fields.length;i++){
      var el = fields[i];
      var hay = [el.getAttribute('name'), el.getAttribute('id'), el.getAttribute('placeholder'), el.getAttribute('aria-label'), el.getAttribute('type')].map(clean).join(' ').toLowerCase();
      for (var j=0;j<hints.length;j++){ if (hay.indexOf(hints[j]) !== -1) return clean(el.value); }
    }
    return '';
  }
  function setStatus(form, text, ok){
    var box = form.querySelector('[data-bs-lead-status]');
    if(!box){
      box = document.createElement('div');
      box.setAttribute('data-bs-lead-status','true');
      box.style.marginTop = '10px';
      box.style.fontSize = '13px';
      box.style.lineHeight = '1.45';
      form.appendChild(box);
    }
    box.style.color = ok ? '#16a34a' : '#dc2626';
    box.textContent = text;
  }
  document.addEventListener('submit', function(event){
    var form = event.target;
    if(!form || !form.matches || !form.matches('form')) return;
    if(form.getAttribute('data-bs-native-submit') === 'true') return;
    event.preventDefault();
    var name = findValue(form, ['name', 'full name', 'your name']) || 'Website Visitor';
    var email = findValue(form, ['email', 'mail']);
    var phone = findValue(form, ['phone', 'mobile', 'whatsapp', 'contact', 'number']);
    var company = findValue(form, ['company', 'business', 'organisation', 'organization', 'brand']);
    var message = findValue(form, ['message', 'requirement', 'details', 'project', 'tell us']);
    if(message && !company) company = message.slice(0, 120);
    if(!email && !phone){ setStatus(form, 'Please enter email or phone so we can contact you.', false); return; }
    var submitBtn = form.querySelector('button[type="submit"], button:not([type]), input[type="submit"]');
    var oldText = submitBtn ? (submitBtn.value || submitBtn.textContent || '') : '';
    if(submitBtn){ submitBtn.disabled = true; if(submitBtn.tagName === 'INPUT') submitBtn.value = 'Sending...'; else submitBtn.textContent = 'Sending...'; }
    fetch('/api/card/capture-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerId: OWNER_ID, sourceSlug: SOURCE_SLUG, name: name, email: email || '', phone: phone || '', company: company || '' }) })
      .then(function(res){ if(!res.ok) throw new Error('Lead capture failed'); setStatus(form, 'Thanks — your enquiry has been sent.', true); try { form.reset(); } catch(e){} })
      .catch(function(){ setStatus(form, 'Could not send right now. Please try again.', false); })
      .finally(function(){ if(submitBtn){ submitBtn.disabled = false; if(submitBtn.tagName === 'INPUT') submitBtn.value = oldText || 'Submit'; else submitBtn.textContent = oldText || 'Submit'; } });
  }, true);
})();
</script>`

  if (/<\/body>/i.test(clean)) return clean.replace(/<\/body>/i, script + '\n</body>')
  return clean + script
}


export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const site = await db.userWebsite.findUnique({
    where: { slug: params.slug },
    select: { htmlContent: true, isPublished: true, name: true, userId: true, slug: true },
  })

  if (!site || !site.isPublished) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ html: injectExistingWebsiteLayoutFixes(injectLeadCapture(site.htmlContent, site.userId, site.slug || params.slug)), name: site.name })
}
