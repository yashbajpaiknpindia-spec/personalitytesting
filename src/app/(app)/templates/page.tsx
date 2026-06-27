import { WEBSITE_TEMPLATE_LIBRARY } from '@/lib/website/templates'
import { TEMPLATE_THUMBNAILS } from '@/lib/website/thumbnails'
import { getTemplateFallbackThumbnail, resolveTemplateThumbnail } from '@/lib/website/thumbnail-resolver'
import { auth } from '@/lib/auth/config'
import type { Metadata } from 'next'
import TemplatesClient from './TemplatesClient'

export const metadata: Metadata = {
  title: 'Website Templates — Brand Syndicate',
  description: 'Browse 1,000+ industry website templates in slider and grid view. Choose your sector and generate a fully custom website in minutes.',
}

// Revalidate once per hour — templates don't change on every request
export const revalidate = 3600

export type TemplateItem = {
  id: string
  label: string
  category: string
  color: string
  bg: string
  thumb: string
  fallbackThumb: string
  description: string
}

export default async function TemplatesPage() {
  let isLoggedIn = false
  try {
    const session = await auth()
    isLoggedIn = !!session
  } catch { /* unauthenticated */ }

  // Build the merged list server-side — thumbnail map never reaches the client bundle
  const templates: TemplateItem[] = WEBSITE_TEMPLATE_LIBRARY.map(t => ({
    id:          t.id,
    label:       t.label,
    category:    t.category,
    color:       t.color,
    bg:          t.bg,
    thumb:       resolveTemplateThumbnail(t, TEMPLATE_THUMBNAILS[t.id]),
    fallbackThumb: getTemplateFallbackThumbnail(t),
    description: t.description,
  }))

  return (
    <TemplatesClient
      isLoggedIn={isLoggedIn}
      templates={templates}
    />
  )
}
