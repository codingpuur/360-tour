import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import type { TourDoc } from '@/types'

const PanoViewer = dynamic(
  () => import('@/components/viewer/PanoViewer').then(m => m.PanoViewer),
  { ssr: false, loading: () => <div className="w-full h-full bg-black" /> }
)

async function fetchTour(slug: string): Promise<TourDoc | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/public/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

interface Props { params: { slug: string } }

export default async function EmbedPage({ params }: Props) {
  const tour = await fetchTour(params.slug)
  if (!tour) notFound()

  if (!tour.settings?.allowEmbed) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <p className="text-white text-sm">Embedding is disabled for this tour.</p>
      </div>
    )
  }

  return (
    <main className="w-screen h-screen overflow-hidden">
      <PanoViewer tour={tour} />
    </main>
  )
}
