'use client'
import dynamic from 'next/dynamic'

const AnalyticsTabs = dynamic(() => import('./AnalyticsTabs'), {
  loading: () => <div style={{padding:40,textAlign:'center',color:'var(--muted)',fontFamily:'DM Mono,monospace',fontSize:11,letterSpacing:'0.1em'}}>Loading analytics…</div>,
  ssr: false,
})

export default AnalyticsTabs
