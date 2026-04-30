import { v2 as cloudinary } from 'cloudinary'

// FIX: The env vars were set with NEXT_PUBLIC_ prefix (e.g. NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)
// which exposes secrets to the browser bundle AND means server-side code that reads
// CLOUDINARY_CLOUD_NAME (no prefix) gets undefined. We read both so both naming
// conventions work — but you should migrate to the unprefixed names in your Render
// dashboard (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY    ?? process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ?? process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
})

export async function uploadBuffer(
  buffer: Buffer,
  publicId: string,
  resourceType: 'raw' | 'image' = 'raw'
): Promise<{ publicId: string; url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: resourceType, overwrite: true },
      (err, result) => {
        if (err || !result) return reject(err)
        resolve({ publicId: result.public_id, url: result.secure_url })
      }
    )
    stream.end(buffer)
  })
}

export function signedUrl(publicId: string, expiresIn = 72 * 3600): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn
  return cloudinary.url(publicId, {
    sign_url: true,
    expires_at: expiresAt,
    resource_type: 'raw',
    secure: true,
  })
}
