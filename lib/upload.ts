import sharp from 'sharp'

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

  if (process.env.STORAGE_PROVIDER === 'cloudinary') {
    const { cloudinaryUploadPanorama } = await import('./storage/cloudinary')
    return cloudinaryUploadPanorama(buffer, filename)
  }

  const { localUploadPanorama } = await import('./storage/local')
  return localUploadPanorama(buffer, filename)
}

export async function uploadFloorplan(buffer: Buffer, filename: string): Promise<string> {
  if (process.env.STORAGE_PROVIDER === 'cloudinary') {
    const { cloudinaryUploadFloorplan } = await import('./storage/cloudinary')
    return cloudinaryUploadFloorplan(buffer, filename)
  }

  const { localUploadFloorplan } = await import('./storage/local')
  return localUploadFloorplan(buffer, filename)
}
