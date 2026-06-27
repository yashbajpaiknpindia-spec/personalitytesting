import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { WEBSITE_TEMPLATE_LIBRARY, getWebsiteTemplateById } from '@/lib/website/templates'
import { TEMPLATE_THUMBNAILS } from '@/lib/website/thumbnails'
import { getTemplateFallbackThumbnail, resolveTemplateThumbnail } from '@/lib/website/thumbnail-resolver'
import TemplatePreviewImage from './TemplatePreviewImage'

export const revalidate = 3600

export function generateStaticParams() {
  return WEBSITE_TEMPLATE_LIBRARY.map(t => ({ id: t.id }))
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const template = getWebsiteTemplateById(params.id)
  if (!template) return { title: 'Template — Brand Syndicate' }
  return {
    title: `${template.label} Website Template — Brand Syndicate`,
    description: template.description || `Preview and use the ${template.label} website template for your business.`,
    alternates: { canonical: `/templates/${template.id}` },
  }
}

export default function TemplateDetailPage({ params }: { params: { id: string } }) {
  const template = getWebsiteTemplateById(params.id)
  if (!template) notFound()
  const thumb = resolveTemplateThumbnail(template, TEMPLATE_THUMBNAILS[template.id])
  const fallbackThumb = getTemplateFallbackThumbnail(template)
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="page-pad" style={{ maxWidth: 1180, margin: '0 auto' }}>
        <style>{`
          .template-detail-grid{display:grid;grid-template-columns:minmax(280px,1fr) minmax(280px,1.1fr);gap:28px;align-items:center;margin-top:26px;}
          .template-detail-preview{border:1px solid var(--border);border-radius:22px;overflow:hidden;min-height:360px;box-shadow:0 24px 80px rgba(0,0,0,.25);}
          @media(max-width:760px){
            .template-detail-grid{grid-template-columns:1fr!important;gap:22px!important;}
            .template-detail-preview{min-height:260px!important;}
            .template-detail-actions{display:grid!important;grid-template-columns:1fr!important;}
            .template-detail-actions a{width:100%;text-align:center;}
          }
        `}</style>
        <Link href="/templates" style={{ color: 'var(--gold)', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>← All templates</Link>
        <div className="template-detail-grid">
          <div>
            <div style={{ fontSize: 10, color: 'var(--gold)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14 }}>{template.category}</div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(42px, 7vw, 86px)', lineHeight: .95, color: 'var(--cream)', margin: 0 }}>{template.label}</h1>
            <p style={{ color: 'var(--muted)', maxWidth: 560, lineHeight: 1.8, marginTop: 18 }}>{template.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '22px 0' }}>
              {template.industries?.slice(0, 8).map(ind => <span key={ind} style={{ padding: '5px 10px', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 999, fontFamily: "'DM Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{ind}</span>)}
            </div>
            <div className="template-detail-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href={`/generate?chip=website&sample=${template.id}`} style={{ padding: '13px 22px', borderRadius: 999, background: 'linear-gradient(135deg,#F7D986,#C9A84C 55%,#8D6B22)', color: '#090909', textDecoration: 'none', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Use Template →</Link>
              <a href={`/samples/${template.id}.html`} target="_blank" rel="noreferrer" style={{ padding: '13px 22px', borderRadius: 999, border: '1px solid rgba(201,168,76,.45)', color: 'var(--gold)', textDecoration: 'none', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Live Preview</a>
            </div>
          </div>
          <div className="template-detail-preview" style={{ background: template.bg }}>
            <TemplatePreviewImage src={thumb} fallbackSrc={fallbackThumb} alt={template.label} bg={template.bg} color={template.color} />
          </div>
        </div>
      </div>
    </div>
  )
}
