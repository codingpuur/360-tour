import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})

const PANO_FOLDER      = '360-tour-platform/panoramas'
const FLOORPLAN_FOLDER = '360-tour-platform/floorplans'

export async function cloudinaryUploadPanorama(
  buffer: Buffer,
  filename: string
): Promise<{ panoramaUrl: string; previewUrl: string }> {
  const previewBuffer = await sharp(buffer)
    .resize({ width: 1024 })
    .jpeg({ quality: 70 })
    .toBuffer()

  const [panoramaResult, previewResult] = await Promise.all([
    uploadBuffer(buffer,        `${filename}-full`,    PANO_FOLDER),
    uploadBuffer(previewBuffer, `${filename}-preview`, PANO_FOLDER),
  ])

  return {
    panoramaUrl: panoramaResult.secure_url,
    previewUrl:  previewResult.secure_url,
  }
}

export async function cloudinaryUploadFloorplan(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const result = await uploadBuffer(buffer, filename, FLOORPLAN_FOLDER)
  return result.secure_url
}

function uploadBuffer(
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
