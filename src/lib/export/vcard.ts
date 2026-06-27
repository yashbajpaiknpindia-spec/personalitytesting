import type { BrandOutput } from '@/lib/ai/generate'

export function buildVCard(data: BrandOutput, email: string, website?: string): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.cardName}`,
    `TITLE:${data.cardTitle}`,
    `EMAIL:${email}`,
  ]
  if (website) lines.push(`URL:${website}`)
  lines.push(`NOTE:${data.tagline}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}
