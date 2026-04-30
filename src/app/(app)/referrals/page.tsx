import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import ReferralsClient from './ReferralsClient'

export default async function ReferralsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const user = await db.user.findUnique({ where: { id: session.user.id } })
  const referredCount = await db.user.count({ where: { referredBy: user?.referralCode || '' } })

  return (
    <ReferralsClient
      referralCode={user?.referralCode || ''}
      referredCount={referredCount}
      appUrl={process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'}
    />
  )
}
