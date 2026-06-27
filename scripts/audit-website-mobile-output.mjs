#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sampleDir = path.join(root, 'public', 'samples')
const routeFile = path.join(root, 'src', 'app', 'w', '[slug]', 'route.ts')
const smokeDir = path.join(root, 'public', 'generated', 'website-mobile-smoke')

function read(file) { return fs.readFileSync(file, 'utf8') }
function write(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data) }
function extractConst(src, name) {
  const m = src.match(new RegExp('const ' + name + ' = `([\\s\\S]*?)`'))
  return m ? m[1] : ''
}
function repairCommonGeneratedHtmlIssues(html) {
  return String(html || '')
    .replace(/<img([^>]*?)\/\s+(loading|decoding|style|class|alt|src)=/gi, '<img$1 $2=')
    .replace(/<img([^>]*?)\/\s*>/gi, '<img$1>')
    .replace(/min-width\s*:\s*100vw/gi, 'min-width:100%')
    .replace(/width\s*:\s*100vw/gi, 'width:100%')
}
function injectSafety(html, inject) {
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html)
  if (!hasViewport) {
    html = html.replace(/<head[^>]*>/i, m => `${m}\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`)
  }
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${inject}\n</head>`) : `${inject}\n${html}`
}

const routeSrc = read(routeFile)
const previewRouteSrc = read(path.join(root, 'src', 'app', 'api', 'website-preview', '[id]', 'route.ts'))
const rendererSrc = read(path.join(root, 'src', 'lib', 'website', 'renderTemplateHtml.ts'))
const responsiveStyle = extractConst(routeSrc, 'RESPONSIVE_FIX_STYLE')
const imageFixScript = extractConst(routeSrc, 'IMAGE_FIX_SCRIPT')
const mobileNavScript = extractConst(routeSrc, 'MOBILE_NAV_SCRIPT')
const routeHasPublicFix = routeSrc.includes('VISIBILITY_FIX_STYLE + RESPONSIVE_FIX_STYLE') && routeSrc.includes('repairCommonGeneratedHtmlIssues') && routeSrc.includes('IMAGE_FIX_SCRIPT')
const previewHasImageFallback = previewRouteSrc.includes('bs-image-fallback-script') && previewRouteSrc.includes('data:image/svg+xml')
const rendererHasImageFallback = rendererSrc.includes('IMAGE_FALLBACK_SCRIPT') && rendererSrc.includes('bs-image-fallback-script')

const files = fs.readdirSync(sampleDir).filter(f => f.endsWith('.html')).sort()
const issues = {
  malformedImageSlash: [],
  unsafe100vw: [],
  missingViewport: [],
  missingImageFallbackPath: !(imageFixScript.includes('bs-image-fallback-script') && imageFixScript.includes('applyFallback')),
  publicRouteMissingResponsiveInjection: !routeHasPublicFix,
  previewRouteMissingImageFallback: !previewHasImageFallback,
  rendererMissingImageFallback: !rendererHasImageFallback,
}
for (const f of files) {
  const html = read(path.join(sampleDir, f))
  if (/<img[^>]*\/\s+(loading|decoding|style|class|alt|src)=/i.test(html)) issues.malformedImageSlash.push(f)
  if (/(?:min-)?width\s*:\s*100vw/i.test(html)) issues.unsafe100vw.push(f)
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) issues.missingViewport.push(f)
}

const representative = [
  'bsx-premium-furniture-atelier-atelier.html',
  'bsx-farm-to-table-restaurant-atelier.html',
  'bsx-heritage-hotel-palace-atelier.html',
  'bsx-rera-real-estate-advisory-atelier.html',
  'bsx-modular-kitchen-studio-atelier.html',
  'ayurvedic-clinic.html',
].filter(f => fs.existsSync(path.join(sampleDir, f)))

fs.rmSync(smokeDir, { recursive: true, force: true })
fs.mkdirSync(smokeDir, { recursive: true })
const smokeInject = `\n<!-- Brand Syndicate public /w mobile safety injection smoke test -->\n${responsiveStyle}\n${mobileNavScript}\n${imageFixScript}\n`
const smokeFiles = []
for (const f of representative) {
  const raw = read(path.join(sampleDir, f))
  const repaired = injectSafety(repairCommonGeneratedHtmlIssues(raw), smokeInject)
  const out = path.join(smokeDir, f.replace(/\.html$/, '-mobile-smoke.html'))
  write(out, repaired)
  smokeFiles.push(path.relative(root, out))
}

const report = {
  generatedAt: new Date().toISOString(),
  sampleTemplatesChecked: files.length,
  publicRouteUsesResponsiveFix: routeHasPublicFix,
  publicRouteUsesImageFallback: !issues.missingImageFallbackPath,
  previewRouteUsesImageFallback: previewHasImageFallback,
  newGeneratedRendererUsesImageFallback: rendererHasImageFallback,
  smokeHtmlFilesGenerated: smokeFiles,
  issueCounts: {
    malformedImageSlash: issues.malformedImageSlash.length,
    unsafe100vw: issues.unsafe100vw.length,
    missingViewport: issues.missingViewport.length,
    publicRouteMissingResponsiveInjection: issues.publicRouteMissingResponsiveInjection ? 1 : 0,
    publicRouteMissingImageFallback: issues.missingImageFallbackPath ? 1 : 0,
    previewRouteMissingImageFallback: issues.previewRouteMissingImageFallback ? 1 : 0,
    rendererMissingImageFallback: issues.rendererMissingImageFallback ? 1 : 0,
  },
  remainingIssueSamples: {
    malformedImageSlash: issues.malformedImageSlash.slice(0, 20),
    unsafe100vw: issues.unsafe100vw.slice(0, 20),
    missingViewport: issues.missingViewport.slice(0, 20),
  },
}
write(path.join(root, 'WEBSITE_MOBILE_SMOKE_TEST_REPORT.json'), JSON.stringify(report, null, 2))
write(path.join(root, 'WEBSITE_MOBILE_SMOKE_TEST_REPORT.md'), `# Website Mobile Smoke Test Report\n\n- Sample templates checked: ${report.sampleTemplatesChecked}\n- Public /w route injects responsive fix: ${report.publicRouteUsesResponsiveFix ? 'yes' : 'no'}\n- Public /w route injects image fallback: ${report.publicRouteUsesImageFallback ? 'yes' : 'no'}\n- Website preview route injects image fallback: ${report.previewRouteUsesImageFallback ? 'yes' : 'no'}\n- New generated renderer injects image fallback: ${report.newGeneratedRendererUsesImageFallback ? 'yes' : 'no'}\n- Malformed image slash patterns: ${report.issueCounts.malformedImageSlash}\n- Unsafe 100vw patterns: ${report.issueCounts.unsafe100vw}\n- Missing viewport meta tags: ${report.issueCounts.missingViewport}\n\nRepresentative HTML smoke outputs generated in:\n\n${smokeFiles.map(f => `- ${f}`).join('\n')}\n`)

console.log(JSON.stringify(report.issueCounts, null, 2))
