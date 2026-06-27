'use client'
// src/components/LeadsExportButtons.tsx

import { useState } from 'react'

export default function LeadsExportButtons() {
  const [csvLoading, setCsvLoading]     = useState(false)
  const [sheetLoading, setSheetLoading] = useState(false)
  const [sheetUrl, setSheetUrl]         = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)

  async function exportCSV() {
    setCsvLoading(true); setError(null)
    try {
      const res = await fetch('/api/leads/export/csv')
      if (!res.ok) throw new Error('CSV export failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
      // BUG FIX #33: Append to DOM for mobile browser compatibility before clicking
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally { setCsvLoading(false) }
  }

  async function exportGoogle() {
    setSheetLoading(true); setError(null); setSheetUrl(null)
    try {
      const res  = await fetch('/api/leads/export/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Google Sheets export failed')
      setSheetUrl(data.spreadsheetUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally { setSheetLoading(false) }
  }

  const btnStyle: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--muted)', padding: '7px 14px', fontSize: 10,
    letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
    borderRadius: 'var(--radius)', fontFamily: "'DM Mono', monospace",
    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <button onClick={exportCSV} disabled={csvLoading} style={btnStyle}>
        {csvLoading ? '⏳' : '⬇'} {csvLoading ? 'Exporting…' : 'Export CSV'}
      </button>
      <button onClick={exportGoogle} disabled={sheetLoading} style={btnStyle}>
        {sheetLoading ? '⏳' : '📊'} {sheetLoading ? 'Exporting…' : 'Export to Google Sheets'}
      </button>
      {sheetUrl && (
        <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, color: 'var(--gold)', textDecoration: 'none', letterSpacing: '0.06em' }}>
          Open Sheet →
        </a>
      )}
      {error && <span style={{ fontSize: 11, color: '#E05252' }}>{error}</span>}
    </div>
  )
}
