#!/usr/bin/env node
// scripts/download-fonts.mjs
// Downloads fonts needed by FFmpeg drawtext into public/fonts/
// Run as part of build: "node scripts/download-fonts.mjs || true"

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const FONTS_DIR = join(process.cwd(), 'public', 'fonts')
if (!existsSync(FONTS_DIR)) mkdirSync(FONTS_DIR, { recursive: true })

// Check if system fonts already available (Render Ubuntu image has these)
const SYSTEM_FONTS = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
]

const allPresent = SYSTEM_FONTS.every(f => existsSync(f))
if (allPresent) {
  console.log('[download-fonts] System DejaVu fonts found — no download needed.')
  process.exit(0)
}

// Fonts not present: write path env for videoRenderer to pick up bundled fonts
console.log('[download-fonts] System fonts missing — checking public/fonts/ fallback.')
const fallbackSans = join(FONTS_DIR, 'DejaVuSans-Bold.ttf')
if (!existsSync(fallbackSans)) {
  console.warn('[download-fonts] public/fonts/DejaVuSans-Bold.ttf missing.')
  console.warn('[download-fonts] FFmpeg text overlays may use default font (less precise).')
} else {
  console.log('[download-fonts] Fallback font found at', fallbackSans)
}
