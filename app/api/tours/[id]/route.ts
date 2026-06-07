import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Tour } from '@/models/Tour'
import { Scene } from '@/models/Scene'
import { Hotspot } from '@/models/Hotspot'

type Ctx = { params: { id: string } }

export async function GET(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const tour = await Tour.findById(params.id).lean()
  if (!tour) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(tour)
}

export async function PUT(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body    = await request.json()
  const updated = await Tour.findByIdAndUpdate(params.id, body, { returnDocument: 'after', strict: false }).lean()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const scenes = await Scene.find({ tourId: params.id }, '_id').lean()
  const sceneIds = scenes.map(s => s._id)
  await Hotspot.deleteMany({ sceneId: { $in: sceneIds } })
  await Scene.deleteMany({ tourId: params.id })
  await Tour.findByIdAndDelete(params.id)
  return NextResponse.json({ ok: true })
}
