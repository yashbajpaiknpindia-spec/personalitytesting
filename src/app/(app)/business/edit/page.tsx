import { Suspense } from 'react'
import BusinessAssetsEditClient from './BusinessAssetsEditClient'

export const metadata = { title: 'Edit Business Assets' }

export default function BusinessEditPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
        <div style={{ width: 32, height: 32, border: '1px solid var(--border2)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <BusinessAssetsEditClient />
    </Suspense>
  )
}
