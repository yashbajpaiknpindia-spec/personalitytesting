import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import CardEditClient from './CardEditClient'

export const metadata = { title: 'Edit Business Card — Brand Syndicate' }

export default async function CardEditPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { accentColor: true },
  })

  return <CardEditClient accentColor={user?.accentColor ?? '#C9A84C'} />
}
