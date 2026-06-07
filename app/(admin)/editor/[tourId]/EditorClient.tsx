'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Share2, Map, X, Clapperboard } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { SceneManager } from '@/components/editor/SceneManager'
import { FloorplanEditor } from '@/components/editor/FloorplanEditor'
import type { TourDoc, TransitionType } from '@/types'

const HotspotTools = dynamic(
  () => import('@/components/editor/HotspotTools').then(m => m.HotspotTools),
  { ssr: false, loading: () => <div className="w-full h-full bg-black flex items-center justify-center text-gray-500 text-sm">Loading viewer…</div> }
)

const TRANSITION_OPTIONS: { value: TransitionType; label: string; desc: string }[] = [
  { value: 'crossfade',  label: 'Cross Dissolve', desc: 'Google Street View style' },
  { value: 'fade',       label: 'Fade Black',     desc: 'Black ke through fade' },
  { value: 'fade-white', label: 'Fade White',     desc: 'White ke through fade' },
  { value: 'zoom',       label: 'Zoom In',        desc: 'Zoom + fade effect' },
  { value: 'blur',       label: 'Blur',           desc: 'Blur + fade effect' },
  { value: 'instant',    label: 'Instant',        desc: 'Koi animation nahi' },
]

interface Props { tour: TourDoc }

export function EditorClient({ tour }: Props) {
  const { setTour, setCurrentScene, updateTour, tour: storeTour } = useEditorStore()
  const [showMap,        setShowMap]        = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const [savingTransition, setSavingTransition] = useState(false)

  useEffect(() => {
    setTour(tour)
    if (tour.scenes.length > 0) {
      const start = tour.scenes.find(s => s._id === tour.startSceneId) ?? tour.scenes[0]
      setCurrentScene(start)
    }
  }, [tour._id])

  async function handleTransitionChange(type: TransitionType) {
    updateTour({ settings: { ...( storeTour?.settings ?? tour.settings), transition: type } })
    setSavingTransition(true)
    await fetch(`/api/tours/${tour._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'settings.transition': type }),
    })
    setSavingTransition(false)
  }

  const currentTransition = storeTour?.settings?.transition ?? tour.settings?.transition ?? 'fade'

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
          {/* Transition picker */}
          <div className="relative">
            <button
              onClick={() => setShowTransition(v => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              title="Scene transition type"
            >
              <Clapperboard size={15} />
              <span className="capitalize">{currentTransition.replace('-', ' ')}</span>
            </button>

            {showTransition && (
              <div className="absolute right-0 top-8 z-50 bg-gray-800 border border-white/10 rounded-xl shadow-2xl w-52 overflow-hidden">
                <p className="text-gray-500 text-xs px-3 pt-2 pb-1">Scene Transition</p>
                {TRANSITION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { handleTransitionChange(opt.value); setShowTransition(false) }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-white/5 transition-colors ${
                      currentTransition === opt.value ? 'bg-blue-600/20' : ''
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-medium ${currentTransition === opt.value ? 'text-blue-400' : 'text-white'}`}>
                        {opt.label}
                        {currentTransition === opt.value && ' ✓'}
                      </p>
                      <p className="text-gray-500 text-xs">{opt.desc}</p>
                    </div>
                  </button>
                ))}
                {savingTransition && (
                  <p className="text-center text-gray-500 text-xs py-1">Saving…</p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowMap(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
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
              <button onClick={() => setShowMap(false)} className="text-gray-400 hover:text-white transition-colors">
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
