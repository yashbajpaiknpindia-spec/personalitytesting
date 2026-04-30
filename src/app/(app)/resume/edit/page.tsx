import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import ResumeEditClient from './ResumeEditClient'

export const metadata = { title: 'Edit Resume — Brand Syndicate' }

export default async function ResumeEditPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { accentColor: true },
  })

  return <ResumeEditClient accentColor={user?.accentColor ?? '#C9A84C'} />
}
