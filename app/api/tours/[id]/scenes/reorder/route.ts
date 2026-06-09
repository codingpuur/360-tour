import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Scene } from '@/models/Scene'

type Ctx = { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Ctx) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sceneIds } = await request.json() as { sceneIds: string[] }
  if (!Array.isArray(sceneIds)) {
    return NextResponse.json({ error: 'sceneIds array required' }, { status: 400 })
  }

  await connectDB()

  await Promise.all(
    sceneIds.map((id, index) =>
      Scene.findByIdAndUpdate(id, { order: index })
    )
  )

  return NextResponse.json({ ok: true })
}
