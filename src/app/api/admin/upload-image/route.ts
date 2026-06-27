import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { uploadBuffer } from '@/lib/storage/cloudinary'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const FALLBACK_DATA_URI_MAX_BYTES = 900 * 1024

function safePart(input: string) {
  return (input || 'upload').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'upload'
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const form = await req.formData()
    const file = form.get('file')
    const purpose = safePart(String(form.get('purpose') || 'admin'))

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are allowed' }, { status: 400 })
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = (file.type.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase()
    const publicId = `brand-syndicate/admin/${purpose}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safePart(file.name).replace(/\.[a-z0-9]+$/i, '')}`

    try {
      const uploaded = await uploadBuffer(buffer, publicId, 'image')
      return NextResponse.json({ ok: true, url: uploaded.url, storage: 'cloudinary' })
    } catch (cloudErr) {
      console.warn('[admin/upload-image] Cloudinary failed; considering small data URI fallback:', cloudErr)
      if (buffer.length > FALLBACK_DATA_URI_MAX_BYTES) {
        return NextResponse.json({ error: 'Cloudinary upload failed. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET env vars, or upload an image under 900KB for temporary fallback.' }, { status: 500 })
      }
      const dataUrl = `data:${file.type || `image/${ext}`};base64,${buffer.toString('base64')}`
      return NextResponse.json({ ok: true, url: dataUrl, storage: 'data-uri' })
    }
  } catch (err) {
    console.error('[admin/upload-image]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
