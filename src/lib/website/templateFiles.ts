// src/lib/website/templateFiles.ts
// SERVER-ONLY — uses fs and path.
// Do NOT import this file into client components.

import fs from 'fs/promises'
import path from 'path'
import { WEBSITE_TEMPLATE_LIBRARY } from './templates'

const SAMPLES_DIR = path.join(process.cwd(), 'public', 'samples')

export function getPublicSamplePath(templateId: string): string {
  return path.join(SAMPLES_DIR, `${templateId}.html`)
}

export async function readTemplateHtml(templateId: string): Promise<string | null> {
  try {
    const filePath = getPublicSamplePath(templateId)
    return await fs.readFile(filePath, 'utf8')
  } catch {
    return null
  }
}

export async function validateTemplateLibrary(): Promise<{
  valid: boolean
  missingHtmlFiles: string[]
  orphanHtmlFiles: string[]
}> {
  const libraryIds = new Set(WEBSITE_TEMPLATE_LIBRARY.map(t => t.id))

  // All HTML files on disk
  let diskFiles: string[] = []
  try {
    const entries = await fs.readdir(SAMPLES_DIR)
    diskFiles = entries
      .filter(f => f.endsWith('.html'))
      .map(f => f.replace('.html', ''))
  } catch {
    diskFiles = []
  }

  const diskSet = new Set(diskFiles)

  const missingHtmlFiles: string[] = []
  for (const id of libraryIds) {
    if (!diskSet.has(id)) missingHtmlFiles.push(id)
  }

  const orphanHtmlFiles: string[] = []
  for (const diskId of diskSet) {
    if (!libraryIds.has(diskId)) orphanHtmlFiles.push(diskId)
  }

  return {
    valid: missingHtmlFiles.length === 0,
    missingHtmlFiles,
    orphanHtmlFiles,
  }
}
