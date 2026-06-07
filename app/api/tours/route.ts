import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import slugify from 'slugify'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Tour } from '@/models/Tour'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const tours = await Tour.find({}).sort({ createdAt: -1 }).lean()
  return NextResponse.json(tours)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await request.json()

  const slug = slugify(body.title ?? 'untitled', { lower: true, strict: true })
  const base = slug
  let candidate = base
  let counter   = 1
  while (await Tour.exists({ slug: candidate })) {
    candidate = `${base}-${counter++}`
  }

  const tour = await Tour.create({ ...body, slug: candidate })
  return NextResponse.json(tour, { status: 201 })
}
