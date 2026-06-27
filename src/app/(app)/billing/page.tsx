import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
const BillingClient = dynamic(() => import('./BillingClient'), { loading: () => <div style={{padding:40,textAlign:'center',color:'var(--muted)',fontFamily:'DM Mono,monospace',fontSize:11,letterSpacing:'0.1em'}}>Loading billing…</div> })

export default async function BillingPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <BillingClient plan={session.user.plan} />
}
