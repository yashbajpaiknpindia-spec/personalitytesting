// src/components/AdSenseScript.tsx
// Loads the Google AdSense script. Place in RootLayout <head>.
// The script is consent-aware: it initialises ad personalisation
// based on the user's cookie-consent choice (stored in localStorage as 'bs_cookie_consent').
// This satisfies Google's EU User Consent Policy and AdSense requirements.

'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ''

export default function AdSenseScript() {
  const [consentReady, setConsentReady] = useState(false)

  useEffect(() => {
    // Wait until cookie consent decision has been made
    const stored = localStorage.getItem('bs_cookie_consent')
    if (stored) {
      // Set non-personalised ads flag if user declined advertising cookies
      if (stored === 'declined') {
        // @ts-ignore
        window.adsbygoogle = window.adsbygoogle || []
        // @ts-ignore
        window.adsbygoogle.requestNonPersonalizedAds = 1
      }
      setConsentReady(true)
    } else {
      // Poll until consent is given (CookieConsent banner will set it)
      const interval = setInterval(() => {
        const v = localStorage.getItem('bs_cookie_consent')
        if (v) {
          if (v === 'declined') {
            // @ts-ignore
            window.adsbygoogle = window.adsbygoogle || []
            // @ts-ignore
            window.adsbygoogle.requestNonPersonalizedAds = 1
          }
          setConsentReady(true)
          clearInterval(interval)
        }
      }, 500)
      return () => clearInterval(interval)
    }
  }, [])

  if (!ADSENSE_CLIENT || !consentReady) return null

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}
