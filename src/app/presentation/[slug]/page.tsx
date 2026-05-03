import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import PublicPresentationClient from './PublicPresentationClient'

interface SlideContent {
  type?: 'hook' | 'content' | 'cta'
  layoutType?: string
  heading?: string
  subheading?: string
  body?: string
  imageQuery?: string
  bullets?: string[]
  stats?: Array<{ value: string; label: string }>
  quote?: string
  attribution?: string
  cards?: Array<{ title: string; body: string }>
}

async function getPresentation(slug: string) {
  return db.presentation.findUnique({
    where: { slug },
    include: {
      slides: { orderBy: { order: 'asc' } },
      user: { select: { name: true, jobTitle: true, image: true } },
    },
  })
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPresentation(params.slug)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'
  if (!p) return { title: 'Presentation Not Found | Brand Syndicate' }

  const description = p.user?.name
    ? `${p.title} — a presentation by ${p.user.name}. Created with Brand Syndicate AI.`
    : `${p.title} — AI-generated presentation, powered by Brand Syndicate.`

  const canonicalUrl = `${APP_URL}/presentation/${params.slug}`

  return {
    title: `${p.title} | Brand Syndicate`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: p.title,
      description,
      url: canonicalUrl,
      type: 'article',
      siteName: 'Brand Syndicate',
    },
    twitter: {
      card: 'summary_large_image',
      title: p.title,
      description,
    },
    robots: { index: true, follow: true },
  }
}

export default async function PublicPresentationPage({ params }: { params: { slug: string } }) {
  const p = await getPresentation(params.slug)
  if (!p) notFound()
  if (!p) return null

  const sorted = [...p.slides].sort((a, b) => a.order - b.order)
  const accent = p.accentColor ?? '#C9A84C'

  const slides = sorted.map(slide => ({
    id: slide.id,
    content: slide.content as SlideContent,
  }))

  return (
    <PublicPresentationClient
      title={p.title}
      accent={accent}
      slides={slides}
      user={p.user ?? null}
    />
  )
}
