'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

// Generates a stable session ID per browser tab (not stored cross-session)
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('_bs_sid')
  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36)
    sessionStorage.setItem('_bs_sid', id)
  }
  return id
}

export function usePageTracker() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const enterTimeRef = useRef<number>(Date.now())
  const lastPathRef = useRef<string>('')
  const sessionIdRef = useRef<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionIdRef.current = getSessionId()
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return
    if (!pathname) return

    const now = Date.now()
    const prevPath = lastPathRef.current
    const prevEnter = enterTimeRef.current

    // Record duration for the PREVIOUS page when navigating away
    if (prevPath && prevPath !== pathname) {
      const durationMs = now - prevEnter
      // Fire-and-forget — don't await, don't block navigation
      fetch('/api/analytics/page-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: prevPath, durationMs, sessionId: sessionIdRef.current }),
      }).catch(() => {})
    }

    // Record entry for current page (duration = 0, will be updated on next nav)
    fetch('/api/analytics/page-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pathname, durationMs: null, sessionId: sessionIdRef.current }),
    }).catch(() => {})

    // Update refs
    enterTimeRef.current = now
    lastPathRef.current = pathname

    // Also record duration on tab close / unload.
    // sendBeacon must use a Blob with an explicit Content-Type — passing a plain
    // string sends as text/plain, which causes req.json() in the API to fail silently.
    const handleUnload = () => {
      const durationMs = Date.now() - enterTimeRef.current
      const payload = JSON.stringify({ page: pathname, durationMs, sessionId: sessionIdRef.current })
      navigator.sendBeacon?.(
        '/api/analytics/page-visit',
        new Blob([payload], { type: 'application/json' })
      )
    }

    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [pathname, session?.user?.id])
}
