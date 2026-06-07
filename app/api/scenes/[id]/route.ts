import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Scene } from '@/models/Scene'
import { Hotspot } from '@/models/Hotspot'

type Ctx = { params: { id: string } }

export async function PUT(request: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body    = await request.json()
  const updated = await Scene.findByIdAndUpdate(params.id, body, { new: true }).lean()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  await Hotspot.deleteMany({ sceneId: params.id })
  await Scene.findByIdAndDelete(params.id)
  return NextResponse.json({ ok: true })
}
