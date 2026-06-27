#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sampleDir = path.join(root, 'public', 'samples')
const files = fs.readdirSync(sampleDir).filter(f => f.endsWith('.html')).sort()

const MOBILE_STYLE = `<style id="bs-template-mobile-fix-v3">
/* Brand Syndicate static sample hardening: mobile, image and nav safety for every template. */
*,*::before,*::after{box-sizing:border-box!important;}
html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;-webkit-text-size-adjust:100%!important;}
body{min-width:0!important;}
img,video,iframe,canvas,svg{max-width:100%!important;}
img{display:block;object-position:center center;background:rgba(255,255,255,.05);}
img[src=""],img:not([src]){display:none!important;}
section,main,footer,header,nav,.container,.wrap,.wrapper,[class*="container"],[class*="wrap"]{max-width:100%!important;min-width:0!important;}
form,input,textarea,select,button{max-width:100%!important;}
input,textarea,select{min-height:44px!important;}
table{max-width:100%!important;}
nav,header,header nav,.nav,.navbar,[class*="navbar"],[class*="nav-inner"],[class*="navInner"]{min-width:0!important;overflow:visible!important;}
nav>*,header>*,header nav>*,.nav>*,.navbar>*{min-width:0!important;}
nav [class*="logo"],nav [class*="brand"],nav [class*="company"],header [class*="logo"],header [class*="brand"],header [class*="company"],.nav [class*="logo"],.nav [class*="brand"],.brand,.logo,nav a:first-child,header a:first-child{
  white-space:nowrap!important;word-break:keep-all!important;overflow-wrap:normal!important;writing-mode:horizontal-tb!important;text-orientation:mixed!important;line-height:1.12!important;display:inline-flex!important;align-items:center!important;gap:.35rem!important;max-width:calc(100vw - 92px)!important;overflow:hidden!important;text-overflow:ellipsis!important;
}
nav [class*="logo"] *,nav [class*="brand"] *,header [class*="logo"] *,header [class*="brand"] *,.brand *,.logo *{white-space:nowrap!important;word-break:keep-all!important;overflow-wrap:normal!important;}
.bs-mobile-menu-toggle{display:none;align-items:center;justify-content:center;flex-direction:column;gap:4px;width:42px;height:42px;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.08);color:inherit;cursor:pointer;z-index:10001;flex:0 0 auto!important;}
.bs-mobile-menu-toggle span{display:block;width:18px;height:2px;background:currentColor;border-radius:2px;}
.bs-mobile-drawer{display:none;position:fixed;left:12px;right:12px;top:72px;z-index:10000;padding:14px;border:1px solid rgba(255,255,255,.16);border-radius:18px;background:rgba(10,10,10,.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 24px 60px rgba(0,0,0,.5);}
.bs-mobile-drawer.open{display:grid!important;gap:8px;}
.bs-mobile-drawer-link{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-height:44px!important;padding:11px 14px!important;border-radius:12px!important;text-decoration:none!important;color:#fff!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.08)!important;font-size:13px!important;letter-spacing:.08em!important;text-transform:uppercase!important;}
@media(max-width:900px){
  body{font-size:16px!important;}
  nav,header nav,.nav,.navbar,[class*="navbar"],[class*="nav-inner"],[class*="navInner"]{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;height:auto!important;min-height:0!important;padding-left:16px!important;padding-right:16px!important;overflow:visible!important;}
  nav [class*="logo"],nav [class*="brand"],header [class*="logo"],header [class*="brand"],.brand,.logo,nav a:first-child,header a:first-child{flex:1 1 auto!important;max-width:calc(100vw - 88px)!important;font-size:clamp(14px,4.8vw,22px)!important;}
  .bs-mobile-nav-ready .bs-mobile-menu-toggle{display:flex!important;margin-left:auto!important;}
  .bs-mobile-nav-ready [class*="links"],.bs-mobile-nav-ready [class*="nav-links"],.bs-mobile-nav-ready [class*="navLinks"],.bs-mobile-nav-ready [class*="menu"]:not(.bs-mobile-menu-toggle),.bs-mobile-nav-ready .bs-mobile-nav-original{display:none!important;}
  nav [class*="actions"],header [class*="actions"],.nav [class*="actions"],nav [class*="desktop"],header [class*="desktop"],nav ul,header nav ul{display:none!important;}
  nav button[aria-label*="menu" i],header button[aria-label*="menu" i],nav [class*="hamb" i],header [class*="hamb" i],nav [class*="toggle" i],header [class*="toggle" i]{display:flex!important;flex:0 0 auto!important;}
  [class*="hero-content"],[class*="hero-left"],[class*="hero-inner"],[class*="hero-copy"],[class*="hero-text"],[class*="showcase"],[class*="card"],[class*="content"],[class*="copy"],.panel,.quote,.price,.lead-form{min-width:0!important;max-width:100%!important;}
  section,.section,[class*="section"]{padding-left:clamp(16px,5vw,28px)!important;padding-right:clamp(16px,5vw,28px)!important;}
  .grid,[class*="grid"],[style*="grid-template-columns"],.features,.services,.pricing,.testimonials,.gallery,.metric-grid,.proof-wall,.contact,.split,.hero-grid{grid-template-columns:1fr!important;}
  [style*="display:flex"],[style*="display: flex"],.row,[class*="row"]{flex-wrap:wrap!important;}
  [style*="min-width"]{min-width:0!important;}
  table{display:block!important;width:100%!important;overflow-x:auto!important;}
  [class*="hero"],.hero,section:first-of-type{height:auto!important;min-height:auto!important;padding-top:clamp(74px,18vw,116px)!important;padding-bottom:clamp(48px,14vw,84px)!important;}
  [class*="hero"],.hero{position:relative!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;justify-content:center!important;}
  .hero-bg,.hero-bg img,[class*="hero-bg"],[class*="hero-bg"] img,[class*="heroBg"],[class*="heroBg"] img,[class*="hero-image"],[class*="hero-image"] img,[class*="hero-visual"],[class*="hero-visual"] img,[class*="hero-media"],[class*="hero-media"] img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center center!important;z-index:-1!important;display:block!important;}
  [class*="hero"]>div,.hero>div,[class*="hero"]>.wrap,.hero>.wrap{position:relative!important;z-index:2!important;}
  img:not([class*="hero"]):not([class*="bg"]):not([class*="cover"]):not([class*="fill"]):not([style*="position:absolute"]):not([style*="position: absolute"]){height:auto!important;max-height:70vh!important;}
  h1{font-size:clamp(2rem,10vw,3.35rem)!important;line-height:1.04!important;max-width:100%!important;word-break:normal!important;overflow-wrap:break-word!important;letter-spacing:-.045em!important;}
  h2{font-size:clamp(1.55rem,7vw,2.35rem)!important;line-height:1.12!important;word-break:normal!important;overflow-wrap:break-word!important;}
  h3,p,li,a,button,span{word-break:normal!important;overflow-wrap:break-word!important;}
  .btn,.button,button,a[class*="btn"],a[class*="button"]{max-width:100%!important;white-space:normal!important;}
}
@media(max-width:430px){
  nav,header nav,.nav,.navbar,[class*="navbar"],[class*="nav-inner"]{padding-left:14px!important;padding-right:14px!important;}
  nav [class*="logo"],nav [class*="brand"],header [class*="logo"],header [class*="brand"],.brand,.logo,nav a:first-child,header a:first-child{max-width:calc(100vw - 76px)!important;}
  .wrap,.container,[class*="container"],[class*="wrap"]{width:min(100% - 24px,1180px)!important;}
  .actions,.cta-strip{flex-direction:column!important;align-items:stretch!important;}
  .actions .btn,.cta-strip .btn,.btn.primary{width:100%!important;}
}
</style>`

const MOBILE_NAV_SCRIPT = `<script id="bs-template-mobile-nav-v3">
(function(){try{function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn);else fn();}ready(function(){(document.querySelectorAll('nav,.nav,header').length?document.querySelectorAll('nav,.nav,header'):[]).forEach(function(nav){if(nav.querySelector('.bs-mobile-menu-toggle')){nav.classList.add('bs-mobile-nav-ready');return;}var existing=Array.prototype.slice.call(nav.querySelectorAll('button,div[role="button"]')).filter(function(el){var cls=((el.className||'')+'').toLowerCase();return /toggle|burger|hamburger|menu-btn|mob|drawer|open/.test(cls)||(el.children.length>=2&&Array.prototype.every.call(el.children,function(c){return c.tagName==='SPAN';}));});if(existing.length>0){nav.classList.add('bs-mobile-nav-ready');Array.prototype.slice.call(nav.querySelectorAll('a,button')).forEach(function(el){if(existing.indexOf(el)!==-1)return;var txt=(el.textContent||'').trim().toLowerCase();var cls=((el.className||'')+'').toLowerCase();var brand=/brand|logo|company/.test(cls)&&txt.length<34;var act=/schedule|consult|collection|service|about|contact|shop|book|pricing|generate|get started|start|portfolio|login|review/.test(txt)||/links|actions|cta|btn|menu/.test(cls);if(!brand&&act)el.classList.add('bs-mobile-nav-original');});return;}var links=Array.prototype.slice.call(nav.querySelectorAll('a,button')).filter(function(el,i){var txt=(el.textContent||'').trim();if(!txt)return false;if(i===0&&txt.length<34)return false;if(el.classList&&(el.classList.contains('bs-mobile-menu-toggle')||el.classList.contains('bs-mobile-drawer-link')))return false;return true;});if(links.length<2)return;links.forEach(function(el){var p=el.parentElement;if(p&&p!==nav&&p.children.length<=Math.max(links.length+1,3))p.classList.add('bs-mobile-nav-original');else el.classList.add('bs-mobile-nav-original');});var b=document.createElement('button');b.type='button';b.className='bs-mobile-menu-toggle';b.setAttribute('aria-label','Open menu');b.setAttribute('aria-expanded','false');b.innerHTML='<span></span><span></span><span></span>';var d=document.createElement('div');d.className='bs-mobile-drawer';links.forEach(function(el){var c=el.cloneNode(true);c.classList.add('bs-mobile-drawer-link');c.removeAttribute('style');c.addEventListener('click',function(){d.classList.remove('open');b.setAttribute('aria-expanded','false');});d.appendChild(c);});function pos(){var r=nav.getBoundingClientRect();d.style.top=(r.bottom+window.scrollY+6)+'px';}b.addEventListener('click',function(){pos();var o=d.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});document.addEventListener('click',function(e){if(!nav.contains(e.target)&&!d.contains(e.target)){d.classList.remove('open');b.setAttribute('aria-expanded','false');}});window.addEventListener('scroll',function(){if(d.classList.contains('open'))pos();},{passive:true});nav.appendChild(b);document.body.appendChild(d);nav.classList.add('bs-mobile-nav-ready');});});}catch(e){}})();
</script>`

const IMAGE_SCRIPT = `<script id="bs-template-image-fallback-v3">
(function(){try{function fb(img){if(!img||img.dataset.bsFallbackApplied==='true')return;img.dataset.bsFallbackApplied='true';img.onerror=null;var label=(img.alt||document.title||'Website image').replace(/[<>&\"]/g,' ').slice(0,80);var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#100C08"/><stop offset="1" stop-color="#7A5A2A"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#F5E8D0" font-family="Georgia,serif" font-size="44" letter-spacing="4">'+label+'</text></svg>';img.src='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);img.style.objectFit='cover';img.style.minHeight=img.style.minHeight||'180px';}function run(){document.querySelectorAll('img').forEach(function(img){img.loading=img.closest('[class*="hero"],.hero')?'eager':(img.loading||'lazy');img.decoding='async';if(!img.getAttribute('referrerpolicy'))img.setAttribute('referrerpolicy','no-referrer');img.onerror=function(){fb(this)};if(img.complete&&img.naturalWidth===0)fb(img);});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();window.addEventListener('load',run);}catch(e){}})();
</script>`


const STABLE_IMAGE_BY_QUERY = [
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
  [/3d|render|product|creative|agency|marketing|branding|studio|design|media|film|photo/i, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=75&auto=format&fit=crop'],
  [/tech|saas|software|ai|automation|cyber|blockchain|app|cloud/i, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=75&auto=format&fit=crop'],
]
function stableImageForQuery(query) {
  const hay = decodeURIComponent(String(query || '')).replace(/[,+]/g, ' ')
  for (const [pattern, url] of STABLE_IMAGE_BY_QUERY) if (pattern.test(hay)) return url
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=75&auto=format&fit=crop'
}
function replaceDeprecatedUnsplash(html) {
  return html.replace(/https:\/\/source\.unsplash\.com\/featured\/(?:\d+x\d+\/)?\?([^"'\s<)]+)/gi, (_m, query) => stableImageForQuery(query))
}

function stripBlock(html, id) {
  return html
    .replace(new RegExp(`<style[^>]+id=["']${id}["'][\\s\\S]*?<\\/style>`, 'gi'), '')
    .replace(new RegExp(`<script[^>]+id=["']${id}["'][\\s\\S]*?<\\/script>`, 'gi'), '')
}

function repair(html) {
  return String(html || '')
    .replace(/<img([^>]*?)\/\s+(loading|decoding|style|class|alt|src)=/gi, '<img$1 $2=')
    .replace(/<img([^>]*?)\/\s*>/gi, '<img$1>')
    .replace(/min-width\s*:\s*100vw/gi, 'min-width:100%')
    .replace(/width\s*:\s*100vw/gi, 'width:100%')
}

let changed = 0
let imageCount = 0
for (const file of files) {
  const p = path.join(sampleDir, file)
  let html = fs.readFileSync(p, 'utf8')
  const before = html
  html = stripBlock(stripBlock(stripBlock(html, 'bs-template-mobile-fix-v3'), 'bs-template-mobile-nav-v3'), 'bs-template-image-fallback-v3')
  html = replaceDeprecatedUnsplash(repair(html))
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, m => `${m}\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`)
  }
  imageCount += (html.match(/<img\b/gi) || []).length
  const inject = `\n${MOBILE_STYLE}\n${MOBILE_NAV_SCRIPT}\n${IMAGE_SCRIPT}\n`
  if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, `${inject}\n</head>`)
  else html = `${inject}\n${html}`
  if (html !== before) {
    fs.writeFileSync(p, html)
    changed++
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  samplesChecked: files.length,
  filesChanged: changed,
  imageTagsSeen: imageCount,
  allHaveMobileFix: files.every(f => fs.readFileSync(path.join(sampleDir, f), 'utf8').includes('bs-template-mobile-fix-v3')),
  malformedImageSlashRemaining: files.filter(f => /<img[^>]*\/\s+(loading|decoding|style|class|alt|src)=/i.test(fs.readFileSync(path.join(sampleDir, f), 'utf8'))).length,
  unsafe100vwRemaining: files.filter(f => /(^|[;{])\s*(?:min-width|width)\s*:\s*100vw/i.test(fs.readFileSync(path.join(sampleDir, f), 'utf8'))).length,
  emptyImageSrcRemaining: files.filter(f => /<img[^>]+src=["']\s*["']/i.test(fs.readFileSync(path.join(sampleDir, f), 'utf8'))).length,
  sourceUnsplashRemaining: files.filter(f => /source\.unsplash\.com/i.test(fs.readFileSync(path.join(sampleDir, f), 'utf8'))).length,
}
fs.writeFileSync(path.join(root, 'STATIC_TEMPLATE_DEEP_AUDIT_REPORT.json'), JSON.stringify(report, null, 2))
fs.writeFileSync(path.join(root, 'STATIC_TEMPLATE_DEEP_AUDIT_REPORT.md'), `# Static Website Template Deep Audit\n\n- Static sample HTML files checked: ${report.samplesChecked}\n- Files updated with mobile/image/nav hardening: ${report.filesChanged}\n- Image tags protected by fallback loader: ${report.imageTagsSeen}\n- Every sample has mobile fix v3: ${report.allHaveMobileFix ? 'yes' : 'no'}\n- Malformed image tag patterns remaining: ${report.malformedImageSlashRemaining}\n- Unsafe 100vw CSS patterns remaining: ${report.unsafe100vwRemaining}\n- Empty image src patterns remaining: ${report.emptyImageSrcRemaining}\n- Deprecated source.unsplash.com image URLs remaining in static samples: ${report.sourceUnsplashRemaining}\n`)
console.log(JSON.stringify(report, null, 2))
