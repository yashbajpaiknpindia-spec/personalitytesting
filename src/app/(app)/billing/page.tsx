import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <BillingClient plan={session.user.plan} />
}
