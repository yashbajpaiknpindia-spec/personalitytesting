// src/hooks/useQR.ts
// Fetches the QR code image URL for the current user's card.

import { useState, useEffect } from 'react'

export function useQRCodeUrl(customUrl?: string) {
  const [qrSrc, setQrSrc]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    const params = customUrl ? `?url=${encodeURIComponent(customUrl)}` : ''

    fetch(`/api/card/qr${params}`)
      .then(res => {
        if (!res.ok) throw new Error('QR fetch failed')
        return res.blob()
      })
      .then(blob => {
        objectUrl = URL.createObjectURL(blob)
        setQrSrc(objectUrl)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

    // Cleanup: revoke the object URL when component unmounts or customUrl changes
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [customUrl])

  return { qrSrc, loading, error }
}
