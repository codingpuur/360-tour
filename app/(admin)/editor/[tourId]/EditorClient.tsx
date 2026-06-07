'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Share2, Map, X } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { SceneManager } from '@/components/editor/SceneManager'
import { FloorplanEditor } from '@/components/editor/FloorplanEditor'
import type { TourDoc } from '@/types'

const HotspotTools = dynamic(
  () => import('@/components/editor/HotspotTools').then(m => m.HotspotTools),
  { ssr: false, loading: () => <div className="w-full h-full bg-black flex items-center justify-center text-gray-500 text-sm">Loading viewer…</div> }
)

interface Props { tour: TourDoc }

export function EditorClient({ tour }: Props) {
  const { setTour, setCurrentScene } = useEditorStore()
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    setTour(tour)
    if (tour.scenes.length > 0) {
      const start = tour.scenes.find(s => s._id === tour.startSceneId) ?? tour.scenes[0]
      setCurrentScene(start)
    }
  }, [tour._id])

  return (
    <div className="h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-white/10 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-white font-medium text-sm">{tour.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMap(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            title="Edit floorplan / map"
          >
            <Map size={15} /> Floorplan
          </button>
          {tour.isPublished && (
            <Link
              href={`/tour/${tour.slug}`}
              target="_blank"
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Share2 size={14} /> View Live
            </Link>
          )}
        </div>
      </header>

      {/* Three-pane layout */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-52 flex-shrink-0">
          <SceneManager />
        </div>
        <div className="flex-1 relative">
          <HotspotTools />
        </div>
      </div>

      {/* Floorplan modal */}
      {showMap && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
          <div className="bg-gray-900 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-white/10">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
              <h2 className="text-white font-medium text-sm">Floorplan / Mini-map</h2>
              <button
                onClick={() => setShowMap(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <FloorplanEditor />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
