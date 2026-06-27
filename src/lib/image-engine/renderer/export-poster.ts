// src/lib/image-engine/renderer/export-poster.ts
// Saves a rendered PNG buffer to storage.
// Uses Cloudinary if configured, otherwise writes to public/generated/campaign-images/.

import path from 'path'
import fs from 'fs'
import type { RenderedPoster } from '../types'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated', 'campaign-images')

export async function exportPosterBuffer(
  pngBuffer: Buffer,
  generationId: string
): Promise<RenderedPoster> {
  // Try Cloudinary first if configured
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const cloudKey = process.env.CLOUDINARY_API_KEY ?? process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
  const cloudSecret = process.env.CLOUDINARY_API_SECRET ?? process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET

  if (cloudName && cloudKey && cloudSecret) {
    try {
      const { uploadBuffer } = await import('@/lib/storage/cloudinary')
      const publicId = `campaign-images/${generationId}`
      const result = await uploadBuffer(pngBuffer, publicId, 'image')
      return {
        success: true,
        finalPosterUrl: result.url,
        storageType: 'cloudinary',
        rendererUsed: 'sharp-composite',
      }
    } catch (err) {
      console.warn('[export-poster] Cloudinary upload failed, falling back to local:', err)
    }
  }

  // Write to local public directory (only reliable on persistent filesystems)
  // On ephemeral hosts like Render, fall back to base64 data URI so the image
  // is embedded directly in the response and survives across restarts.
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }
    const filename = `${generationId}.png`
    const filePath = path.join(OUTPUT_DIR, filename)
    fs.writeFileSync(filePath, pngBuffer)
    // Return URL relative to public root
    const url = `/generated/campaign-images/${filename}`
    return {
      success: true,
      finalPosterUrl: url,
      storageType: 'local',
      rendererUsed: 'sharp-composite',
    }
  } catch (writeErr) {
    console.warn('[export-poster] Local write failed (ephemeral FS?), using base64 data URI:', writeErr)
    // Embed PNG directly as data URI — works on Render and any ephemeral host
    try {
      const dataUri = `data:image/png;base64,${pngBuffer.toString('base64')}`
      return {
        success: true,
        finalPosterUrl: dataUri,
        storageType: 'base64',
        rendererUsed: 'sharp-composite',
      }
    } catch (b64Err) {
      return {
        success: false,
        finalPosterUrl: null,
        storageType: 'local',
        rendererUsed: 'sharp-composite',
        failureReason: b64Err instanceof Error ? b64Err.message : 'base64 export failed',
      }
    }
  }
}
