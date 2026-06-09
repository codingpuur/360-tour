import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export async function localUploadPanorama(
  buffer: Buffer,
  filename: string
): Promise<{ panoramaUrl: string; previewUrl: string }> {
  const panoDir    = path.join(UPLOAD_DIR, 'panoramas')
  const previewDir = path.join(UPLOAD_DIR, 'previews')
  await Promise.all([ensureDir(panoDir), ensureDir(previewDir)])

  const [compressedBuffer, previewBuffer] = await Promise.all([
    sharp(buffer).jpeg({ quality: 82 }).toBuffer(),
    sharp(buffer).resize({ width: 1024 }).jpeg({ quality: 70 }).toBuffer(),
  ])

  const ts          = Date.now()
  const panoFile    = `${filename}-${ts}-full.jpg`
  const previewFile = `${filename}-${ts}-preview.jpg`

  await Promise.all([
    fs.writeFile(path.join(panoDir,    panoFile),    compressedBuffer),
    fs.writeFile(path.join(previewDir, previewFile), previewBuffer),
  ])

  return {
    panoramaUrl: `/uploads/panoramas/${panoFile}`,
    previewUrl:  `/uploads/previews/${previewFile}`,
  }
}

export async function localUploadFloorplan(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const dir = path.join(UPLOAD_DIR, 'floorplans')
  await ensureDir(dir)
  const file = `${filename}-${Date.now()}.jpg`
  await fs.writeFile(path.join(dir, file), buffer)
  return `/uploads/floorplans/${file}`
}
