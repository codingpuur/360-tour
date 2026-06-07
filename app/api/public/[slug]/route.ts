import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Tour } from '@/models/Tour'
import { Scene } from '@/models/Scene'
import { Hotspot } from '@/models/Hotspot'

type Ctx = { params: { slug: string } }

export async function GET(_: Request, { params }: Ctx) {
  await connectDB()

  const tour = await Tour.findOne({ slug: params.slug, isPublished: true }).lean()
  if (!tour) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const scenes   = await Scene.find({ tourId: tour._id }).sort({ order: 1 }).lean()
  const hotspots = await Hotspot.find({
    sceneId: { $in: scenes.map(s => s._id) },
  }).lean()

  const scenesWithHotspots = scenes.map(scene => ({
    ...scene,
    hotspots: hotspots.filter(
      h => h.sceneId.toString() === scene._id.toString()
    ),
  }))

  return NextResponse.json({
    ...tour,
    scenes: scenesWithHotspots,
  })
}
