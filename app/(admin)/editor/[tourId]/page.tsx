import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db'
import { Tour } from '@/models/Tour'
import { Scene } from '@/models/Scene'
import { Hotspot } from '@/models/Hotspot'
import { EditorClient } from './EditorClient'
import type { TourDoc } from '@/types'

async function fetchEditorTour(tourId: string): Promise<TourDoc | null> {
  await connectDB()
  const tour = await Tour.findById(tourId).lean()
  if (!tour) return null

  const scenes   = await Scene.find({ tourId }).sort({ order: 1 }).lean()
  const hotspots = await Hotspot.find({
    sceneId: { $in: scenes.map(s => s._id) },
  }).lean()

  const scenesWithHotspots = scenes.map(scene => ({
    _id:         scene._id.toString(),
    tourId:      scene.tourId.toString(),
    name:        scene.name,
    panorama:    scene.panorama,
    preview:     scene.preview,
    initialView: scene.initialView,
    order:       scene.order,
    hotspots:    hotspots
      .filter(h => h.sceneId.toString() === scene._id.toString())
      .map(h => ({
        _id:          h._id.toString(),
        sceneId:      h.sceneId.toString(),
        type:         h.type,
        position:     h.position,
        label:        h.label,
        targetSceneId: h.targetSceneId?.toString(),
        targetView:   h.targetView,
        content:      h.content,
        icon:         (h.icon as 'arrow' | 'dot' | 'ring' | 'info' | 'custom'),
        style:        h.style,
      })),
  }))

  return {
    _id:          tour._id.toString(),
    slug:         tour.slug,
    title:        tour.title,
    description:  tour.description,
    coverImage:   tour.coverImage,
    startSceneId: tour.startSceneId?.toString() ?? '',
    floorplan:    tour.floorplan ? {
      image:   tour.floorplan.image,
      markers: tour.floorplan.markers.map(m => ({
        sceneId: m.sceneId.toString(),
        x: m.x,
        y: m.y,
      })),
    } : undefined,
    isPublished:  tour.isPublished,
    settings: {
      autoRotate:  tour.settings?.autoRotate  ?? false,
      showCompass: tour.settings?.showCompass ?? true,
      allowEmbed:  tour.settings?.allowEmbed  ?? true,
      transition:  (tour.settings?.transition ?? 'fade') as import('@/types').TransitionType,
    },
    scenes:       scenesWithHotspots,
    createdAt:    tour.createdAt.toISOString(),
    updatedAt:    tour.updatedAt.toISOString(),
  }
}

interface Props { params: { tourId: string } }

export default async function EditorPage({ params }: Props) {
  const tour = await fetchEditorTour(params.tourId)
  if (!tour) notFound()

  return <EditorClient tour={tour} />
}
