import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Scene } from '@/models/Scene'
import { Tour } from '@/models/Tour'
import { uploadPanorama, UploadError } from '@/lib/upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: { id: string } }

export async function POST(request: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()

  const formData = await request.formData()
  const file     = formData.get('file') as File | null
  const name     = (formData.get('name') as string) || 'Scene'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const buffer   = Buffer.from(await file.arrayBuffer())
  const filename = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase()

  let panoramaUrl: string
  let previewUrl:  string
  try {
    const result = await uploadPanorama(buffer, filename)
    panoramaUrl  = result.panoramaUrl
    previewUrl   = result.previewUrl
  } catch (e) {
    if (e instanceof UploadError) {
      return NextResponse.json({ error: e.message }, { status: 422 })
    }
    throw e
  }

  // Count existing scenes to assign order
  const count = await Scene.countDocuments({ tourId: params.id })
  const scene = await Scene.create({
    tourId:   params.id,
    name,
    panorama: panoramaUrl,
    preview:  previewUrl,
    order:    count,
  })

  // Set as startScene if tour has none yet
  await Tour.findByIdAndUpdate(
    params.id,
    { $set: { coverImage: scene.preview } },
    { new: false }
  )
  const tour = await Tour.findById(params.id)
  if (tour && !tour.startSceneId) {
    tour.startSceneId = scene._id
    await tour.save()
  }

  return NextResponse.json(scene, { status: 201 })
}
