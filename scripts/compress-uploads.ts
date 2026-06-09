import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

async function compressDir(dir: string, quality: number) {
  let files: string[]
  try {
    files = await fs.readdir(dir)
  } catch {
    console.log(`  Skipping ${dir} (not found)`)
    return
  }

  const jpgs = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f))
  if (jpgs.length === 0) { console.log(`  No images found in ${dir}`); return }

  for (const file of jpgs) {
    const filePath = path.join(dir, file)
    const statBefore = await fs.stat(filePath)
    const buffer = await fs.readFile(filePath)

    const compressed = await sharp(buffer)
      .jpeg({ quality })
      .toBuffer()

    if (compressed.length < statBefore.size) {
      await fs.writeFile(filePath, compressed)
      const saved = ((statBefore.size - compressed.length) / 1024).toFixed(0)
      const pct   = (((statBefore.size - compressed.length) / statBefore.size) * 100).toFixed(0)
      console.log(`  ✓ ${file}  ${(statBefore.size/1024/1024).toFixed(1)}MB → ${(compressed.length/1024/1024).toFixed(1)}MB  (-${saved}KB / ${pct}%)`)
    } else {
      console.log(`  – ${file}  already small, skipped`)
    }
  }
}

async function main() {
  console.log('Compressing panoramas (quality 82)…')
  await compressDir(path.join(UPLOADS_DIR, 'panoramas'), 82)

  console.log('\nCompressing previews (quality 70)…')
  await compressDir(path.join(UPLOADS_DIR, 'previews'), 70)

  console.log('\nCompressing floorplans (quality 85)…')
  await compressDir(path.join(UPLOADS_DIR, 'floorplans'), 85)

  console.log('\nDone.')
}

main().catch(console.error)
