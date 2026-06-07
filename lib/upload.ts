import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

export class UploadError extends Error {}

export async function validateEquirectangular(buffer: Buffer): Promise<sharp.Metadata> {
  const meta = await sharp(buffer).metadata()
  if (!meta.width || !meta.height) throw new UploadError('Cannot read image dimensions')
  const ratio = meta.width / meta.height
  if (ratio < 1.9 || ratio > 2.1) {
    throw new UploadError(
      `Image must be 2:1 aspect ratio (equirectangular). Got ${meta.width}×${meta.height} (ratio ${ratio.toFixed(2)})`
    )
  }
  return meta
}

export async function uploadPanorama(
  buffer: Buffer,
  filename: string
): Promise<{ panoramaUrl: string; previewUrl: string }> {
  await validateEquirectangular(buffer)

  const previewBuffer = await sharp(buffer)
    .resize({ width: 1024 })
    .jpeg({ quality: 70 })
    .toBuffer()

  const folder = '360-tour-platform/panoramas'

  const [panoramaResult, previewResult] = await Promise.all([
    uploadBufferToCloudinary(buffer,        `${filename}-full`,    folder),
    uploadBufferToCloudinary(previewBuffer, `${filename}-preview`, folder),
  ])

  return {
    panoramaUrl: panoramaResult.secure_url,
    previewUrl:  previewResult.secure_url,
  }
}

export async function uploadFloorplan(buffer: Buffer, filename: string): Promise<string> {
  const folder = '360-tour-platform/floorplans'
  const result = await uploadBufferToCloudinary(buffer, filename, folder)
  return result.secure_url
}

async function uploadBufferToCloudinary(
  buffer: Buffer,
  publicId: string,
  folder: string
): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { public_id: publicId, folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) reject(error ?? new Error('No Cloudinary result'))
        else resolve(result)
      }
    )
    Readable.from(buffer).pipe(stream)
  })
}
