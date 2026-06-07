import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { uploadPanorama, uploadFloorplan, UploadError } from '@/lib/upload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file     = formData.get('file') as File | null
  const type     = (formData.get('type') as string) || 'panorama'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const buffer   = Buffer.from(await file.arrayBuffer())
  const filename = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase()

  try {
    if (type === 'floorplan') {
      const url = await uploadFloorplan(buffer, filename)
      return NextResponse.json({ url })
    }
    const urls = await uploadPanorama(buffer, filename)
    return NextResponse.json(urls)
  } catch (e) {
    if (e instanceof UploadError) {
      return NextResponse.json({ error: e.message }, { status: 422 })
    }
    throw e
  }
}
