'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/components/ThemeProvider'
import { usePageTracker } from '@/hooks/usePageTracker'

function GlobalPageTracker() {
  usePageTracker()
  return null
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <GlobalPageTracker />
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
