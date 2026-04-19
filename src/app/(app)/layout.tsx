import { auth } from '@/lib/auth/config'
import AppShell from './AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  // Do NOT redirect guests — AppShell handles null session gracefully
  return <AppShell session={session}>{children}</AppShell>
}
