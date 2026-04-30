import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import PresentationEditorShell from './PresentationEditorShell'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await auth()
  if (!session?.user?.id) return { title: 'Presentation Editor' }
  const p = await db.presentation.findUnique({
    where: { id: params.id },
    select: { title: true, userId: true },
  })
  if (!p || p.userId !== session.user.id) return { title: 'Presentation Editor' }
  return { title: `${p.title} — Brand Syndicate` }
}

export default async function PresentationEditorPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const presentation = await db.presentation.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, accentColor: true, title: true },
  })

  if (!presentation) notFound()
  if (presentation.userId !== session.user.id) notFound()

  return (
    <PresentationEditorShell
      presentationId={presentation.id}
      accentColor={presentation.accentColor}
      initialTitle={presentation.title}
    />
  )
}
