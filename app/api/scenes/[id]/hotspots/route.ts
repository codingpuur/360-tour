import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Hotspot } from '@/models/Hotspot'

type Ctx = { params: { id: string } }

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const hotspots = await Hotspot.find({ sceneId: params.id }).lean()
  return NextResponse.json(hotspots)
}

// Bulk replace all hotspots for the scene
export async function PUT(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { hotspots } = await request.json()

  await Hotspot.deleteMany({ sceneId: params.id })

  if (!hotspots?.length) return NextResponse.json([])

  const inserted = await Hotspot.insertMany(
    hotspots.map((h: any) => ({
      ...h,
      _id:     undefined,
      sceneId: params.id,
    }))
  )
  return NextResponse.json(inserted)
}
