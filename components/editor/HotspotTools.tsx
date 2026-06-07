'use client'

import { useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PanoSphere } from '@/components/viewer/PanoSphere'
import { HotspotForm } from './HotspotForm'
import { useEditorStore } from '@/store/editorStore'
import { Navigation, Info, Eye } from 'lucide-react'
import type { LonLat } from '@/types'

export function HotspotTools() {
  const {
    mode, currentScene, setMode, setPendingHotspot, pendingHotspot,
    hotspots, removeHotspot, setSelectedHotspot,
  } = useEditorStore()

  const [showForm, setShowForm] = useState(false)

  const handleSphereClick = useCallback((lonLat: LonLat) => {
    if (!currentScene) return
    if (mode === 'place-navigation' || mode === 'place-info') {
      setPendingHotspot({
        type:    mode === 'place-navigation' ? 'navigation' : 'info',
        position: lonLat,
        sceneId: currentScene._id,
      })
      setShowForm(true)
    }
  }, [mode, currentScene, setPendingHotspot])

  if (!currentScene) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        Select a scene to edit
      </div>
    )
  }

  const viewSceneWithHotspots = { ...currentScene, hotspots }

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1">
        <button
          onClick={() => setMode('view')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === 'view' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Eye size={12} /> View
        </button>
        <button
          onClick={() => setMode('place-navigation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === 'place-navigation' ? 'bg-blue-500/80 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Navigation size={12} /> + Nav
        </button>
        <button
          onClick={() => setMode('place-info')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            mode === 'place-info' ? 'bg-green-500/80 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Info size={12} /> + Info
        </button>
      </div>

      {/* Mode hint */}
      {(mode === 'place-navigation' || mode === 'place-info') && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
          Click anywhere in the scene to place hotspot
        </div>
      )}

      {/* Canvas */}
      <Canvas
        camera={{ fov: currentScene.initialView.fov, near: 0.1, far: 1100 }}
        style={{ width: '100%', height: '100%' }}
      >
        <PanoSphere
          scene={viewSceneWithHotspots}
          onHotspotClick={(h) => setSelectedHotspot(h)}
          onSphereClick={handleSphereClick}
          editorMode={true}
        />
      </Canvas>

      {/* Hotspot list overlay (bottom-left) */}
      {hotspots.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 bg-black/60 rounded-lg p-2 max-h-40 overflow-y-auto">
          <p className="text-gray-400 text-xs mb-1">{hotspots.length} hotspot{hotspots.length !== 1 ? 's' : ''}</p>
          {hotspots.map(h => (
            <div key={h._id} className="flex items-center justify-between gap-2 py-0.5">
              <span className="text-white text-xs truncate max-w-32">{h.label || h.type}</span>
              <button
                onClick={() => removeHotspot(h._id)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hotspot form modal */}
      {showForm && pendingHotspot && (
        <HotspotForm onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
