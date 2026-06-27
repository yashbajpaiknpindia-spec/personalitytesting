#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = process.cwd()
const sampleDir = path.join(root, 'public', 'samples')
const files = fs.readdirSync(sampleDir).filter(f => f.endsWith('.html')).sort()

function stripInjected(html) {
  return String(html || '')
    .replace(/<style[^>]+id=["']bs-template-mobile-fix-v3["'][\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]+id=["']bs-template-mobile-nav-v3["'][\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]+id=["']bs-template-image-fallback-v3["'][\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]+id=["']bs-native-mobile-fix["'][\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]+id=["']bs-native-mobile-nav-script["'][\s\S]*?<\/script>/gi, '')
}
function visibleText(html) {
  let s = stripInjected(html)
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
       .replace(/<style[\s\S]*?<\/style>/gi, ' ')
       .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
       .replace(/<[^>]+>/g, ' ')
       .replace(/&nbsp;|&#160;/gi, ' ')
       .replace(/&amp;/gi, '&')
       .replace(/\s+/g, ' ')
       .trim()
  return s
}
function textWithHead(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''
  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] ?? ''
  return `${visibleText(html)} ${title} ${desc}`.replace(/\s+/g, ' ').trim()
}
function structuralSignature(html) {
  let s = stripInjected(html)
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '')
       .replace(/<style[\s\S]*?<\/style>/gi, '')
       .replace(/https?:\/\/[^"'\s)]+/gi, 'URL')
       .replace(/#[0-9a-f]{3,8}\b/gi, '#HEX')
       .replace(/\b\d+(\.\d+)?(px|rem|em|vh|vw|%)\b/gi, 'N')
       .replace(/>[\s\S]*?</g, '><')
       .replace(/\s(data-[\w-]+|aria-[\w-]+|href|src|alt|title|content|style)=("[^"]*"|'[^']*')/gi, '')
       .replace(/\s+/g, ' ')
       .trim()
  const sig = crypto.createHash('sha1').update(s).digest('hex').slice(0, 12)
  return sig
}
const templatePatterns = [
  /\btemplate\b/i,
  /\btemplates\b/i,
  /free previews?/i,
  /replace with real/i,
  /client reviews later/i,
  /demo content/i,
  /placeholder/i,
  /your backend/i,
  /structure is intentionally/i,
  /sections explain the offer/i,
  /trust blocks already/i,
  /ready to replace/i,
]
const genericPatterns = [
  /Service (One|Two|Three|Four|Five|Six)/i,
  /Useful for free previews?/i,
  /easy to replace/i,
  /client reviews later/i,
  /Lorem ipsum/i,
  /Founder Review/i,
  /Growth Lead/i,
  /Marketing Team/i,
  /Start Project/i,
  /Explore/i,
]

const rows = []
const layouts = new Map()
for (const f of files) {
  const html = fs.readFileSync(path.join(sampleDir, f), 'utf8')
  const clean = stripInjected(html)
  const text = textWithHead(clean)
  const visible = visibleText(clean)
  const imgTags = clean.match(/<img\b[^>]*>/gi) || []
  const imgs = imgTags.map(tag => tag.match(/\bsrc=["']([^"']*)/i)?.[1] ?? '').filter(Boolean)
  const emptyImgs = imgTags.filter(tag => /\bsrc=["']\s*["']/i.test(tag) || !/\bsrc=/i.test(tag)).length
  const heroBlock = clean.match(/<section[^>]*(?:class=["'][^"']*hero|id=["'][^"']*hero)[\s\S]*?<\/section>/i)?.[0]
    || clean.match(/<header[\s\S]*?<\/header>/i)?.[0]
    || clean.slice(0, 4500)
  const heroHasImage = /<img\b/i.test(heroBlock) || /background(?:-image)?\s*:/i.test(heroBlock)
  const tplMention = templatePatterns.some(p => p.test(text))
  const genericMention = genericPatterns.some(p => p.test(text))
  const sig = structuralSignature(clean)
  if (!layouts.has(sig)) layouts.set(sig, [])
  layouts.get(sig).push(f)
  rows.push({ file:f, imgCount:imgs.length, emptyImgs, heroHasImage, tplMention, genericMention, sig })
}
const duplicateFamilies = [...layouts.entries()].map(([sig, arr]) => ({ sig, count: arr.length, files: arr })).filter(x => x.count > 1).sort((a,b)=>b.count-a.count)
const report = {
  generatedAt: new Date().toISOString(),
  totalTemplates: files.length,
  noImageTags: rows.filter(r => r.imgCount === 0).length,
  oneOrNoImages: rows.filter(r => r.imgCount <= 1).length,
  emptyOrMissingImageSrc: rows.filter(r => r.emptyImgs > 0).length,
  noHeroImageOrBackground: rows.filter(r => !r.heroHasImage).length,
  visibleTemplateLanguage: rows.filter(r => r.tplMention).length,
  genericPlaceholderCopy: rows.filter(r => r.genericMention).length,
  duplicateLayoutFamilies: duplicateFamilies.length,
  templatesInsideDuplicateLayoutFamilies: duplicateFamilies.reduce((n,x)=>n+x.count,0),
  largestDuplicateLayoutFamilies: duplicateFamilies.slice(0,12).map(x => ({ count:x.count, examples:x.files.slice(0,8) })),
  issueExamples: {
    noImageTags: rows.filter(r => r.imgCount === 0).slice(0,30).map(r => r.file),
    noHeroImageOrBackground: rows.filter(r => !r.heroHasImage).slice(0,30).map(r => r.file),
    visibleTemplateLanguage: rows.filter(r => r.tplMention).slice(0,30).map(r => r.file),
    genericPlaceholderCopy: rows.filter(r => r.genericMention).slice(0,30).map(r => r.file),
  }
}
fs.writeFileSync(path.join(root, 'TEMPLATE_CONTENT_QUALITY_AUDIT_BEFORE.json'), JSON.stringify(report, null, 2))
fs.writeFileSync(path.join(root, 'TEMPLATE_CONTENT_QUALITY_AUDIT_BEFORE.md'), `# Template Content Quality Audit — Before Fix\n\n- Static templates checked: ${report.totalTemplates}\n- Files with zero image tags: ${report.noImageTags}\n- Files with one or zero image tags: ${report.oneOrNoImages}\n- Files with empty/missing image src: ${report.emptyOrMissingImageSrc}\n- Files without detectable hero image/background: ${report.noHeroImageOrBackground}\n- Files with visible template/preview/placeholder language: ${report.visibleTemplateLanguage}\n- Files with generic placeholder copy: ${report.genericPlaceholderCopy}\n- Duplicate layout families: ${report.duplicateLayoutFamilies}\n- Templates inside duplicate layout families: ${report.templatesInsideDuplicateLayoutFamilies}\n\n## Largest duplicate layout families\n\n${report.largestDuplicateLayoutFamilies.map((x,i)=>`${i+1}. ${x.count} files — examples: ${x.examples.join(', ')}`).join('\n')}\n`)
console.log(JSON.stringify(report, null, 2))
