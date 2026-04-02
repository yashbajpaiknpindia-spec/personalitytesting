import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
  })
}
