import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { TourDoc } from '@/types'

const PanoViewer = dynamic(
  () => import('@/components/viewer/PanoViewer').then(m => m.PanoViewer),
  { ssr: false, loading: () => <div className="w-full h-full bg-black" /> }
)

async function fetchTour(slug: string): Promise<TourDoc | null> {
  // Phase 1: read from static fixture
  // Phase 2: this will call /api/public/[slug] or query DB directly
  if (slug === 'demo') {
    const fixture = await import('@/lib/fixtures/demo-tour.json')
    return fixture.default as TourDoc
  }

  // In production, fetch from the public API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/public/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tour = await fetchTour(params.slug)
  if (!tour) return { title: 'Tour not found' }
  return {
    title: tour.title,
    description: tour.description,
    openGraph: {
      title: tour.title,
      description: tour.description,
      images: tour.coverImage ? [{ url: tour.coverImage, width: 1200, height: 630 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tour.title,
      description: tour.description,
      images: tour.coverImage ? [tour.coverImage] : [],
    },
  }
}

export default async function TourPage({ params }: Props) {
  const tour = await fetchTour(params.slug)
  if (!tour) notFound()

  return (
    <main className="w-screen h-screen overflow-hidden">
      <PanoViewer tour={tour} />
    </main>
  )
}
