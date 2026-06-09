'use client'

import { useCallback, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PanoSphere } from '@/components/viewer/PanoSphere'
import type { PanoSphereHandle } from '@/components/viewer/PanoSphere'
import { HotspotForm } from './HotspotForm'
import { useEditorStore } from '@/store/editorStore'
import { Navigation, Info, Eye, Camera, Check, X, Trash2 } from 'lucide-react'
import type { HotspotDoc, LonLat, SceneDoc } from '@/types'

// ── Nav hotspot floating panel ────────────────────────────────────────────────
function NavPanel({
  hotspot,
  scenes,
  currentSceneId,
  x,
  y,
  onSave,
  onDelete,
  onClose,
}: {
  hotspot: HotspotDoc
  scenes: SceneDoc[]
  currentSceneId: string
  x: number
  y: number
  onSave: (label: string, targetSceneId: string) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [label,    setLabel]    = useState(hotspot.label)
  const [targetId, setTargetId] = useState(hotspot.targetSceneId ?? '')

  // Keep panel inside viewport
  const panelW = 220
  const panelH = 320
  const left   = Math.min(x + 12, window.innerWidth  - panelW - 8)
  const top    = Math.min(y - 40,  window.innerHeight - panelH - 8)

  return (
    <div
      className="fixed z-50 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
      style={{ left, top, width: panelW }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-white text-xs font-semibold">Navigation Point</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X size={13} />
        </button>
      </div>

      {/* Label */}
      <div className="px-3 pt-2 pb-1">
        <label className="text-gray-500 text-xs mb-1 block">Label</label>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          className="w-full bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Scene list */}
      <div className="px-3 pb-1">
        <label className="text-gray-500 text-xs mb-1 block">Select target scene</label>
        <div className="space-y-0.5 max-h-44 overflow-y-auto">
          {scenes
            .filter(s => s._id !== currentSceneId)
            .map(s => (
              <button
                key={s._id}
                onClick={() => setTargetId(s._id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                  targetId === s._id
                    ? 'bg-blue-600/30 border border-blue-500/40'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="w-9 h-6 rounded overflow-hidden flex-shrink-0 bg-gray-800">
                  {s.preview
                    ? <img src={s.preview} alt={s.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gray-700" />
                  }
                </div>
                <span className="text-white text-xs truncate">{s.name}</span>
                {targetId === s._id && <span className="ml-auto text-blue-400 text-xs">✓</span>}
              </button>
            ))
          }
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between">
        <button
          onClick={onDelete}
          className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs transition-colors"
        >
          <Trash2 size={11} /> Delete
        </button>
        <button
          onClick={() => onSave(label, targetId)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  )
}

// ── Main HotspotTools ─────────────────────────────────────────────────────────
export function HotspotTools() {
  const {
    mode, currentScene, setMode, setPendingHotspot, pendingHotspot,
    hotspots, removeHotspot, setSelectedHotspot, updateScene, updateHotspot, tour,
  } = useEditorStore()

  const [showForm,   setShowForm]   = useState(false)
  const [viewSaved,  setViewSaved]  = useState(false)
  const [navPanel,   setNavPanel]   = useState<{ hotspot: HotspotDoc; x: number; y: number } | null>(null)
  const sphereRef = useRef<PanoSphereHandle>(null)

  // ── Set initial view ────────────────────────────────────────────────────────
  async function handleSetInitialView() {
    if (!currentScene || !sphereRef.current) return
    const view = sphereRef.current.getCurrentView()
    await fetch(`/api/scenes/${currentScene._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initialView: view }),
    })
    updateScene({ initialView: view })
    setViewSaved(true)
    setTimeout(() => setViewSaved(false), 2000)
  }

  // ── Place new hotspot on sphere click ───────────────────────────────────────
  const handleSphereClick = useCallback((lonLat: LonLat) => {
    if (!currentScene) return
    if (mode === 'place-navigation' || mode === 'place-info') {
      setPendingHotspot({
        type:     mode === 'place-navigation' ? 'navigation' : 'info',
        position: lonLat,
        sceneId:  currentScene._id,
      })
      setShowForm(true)
    }
  }, [mode, currentScene, setPendingHotspot])

  // ── Hotspot click in editor ─────────────────────────────────────────────────
  const handleHotspotClick = useCallback((hotspot: HotspotDoc, x: number, y: number) => {
    setNavPanel(null)
    if (hotspot.type === 'navigation') {
      setNavPanel({ hotspot, x, y })
    } else {
      // Info hotspot → open form pre-filled for editing
      setPendingHotspot({ ...hotspot })
      setSelectedHotspot(hotspot)
      setShowForm(true)
    }
  }, [setPendingHotspot, setSelectedHotspot])

  // ── Nav panel save ──────────────────────────────────────────────────────────
  function handleNavSave(label: string, targetSceneId: string) {
    if (!navPanel) return
    updateHotspot(navPanel.hotspot._id, { label, targetSceneId: targetSceneId || undefined })
    setNavPanel(null)
  }

  // ── Nav panel delete ────────────────────────────────────────────────────────
  function handleNavDelete() {
    if (!navPanel) return
    removeHotspot(navPanel.hotspot._id)
    setNavPanel(null)
  }

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

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          onClick={handleSetInitialView}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gray-400 hover:text-white transition-colors"
          title="Current view ko initial view set karo"
        >
          {viewSaved
            ? <><Check size={12} className="text-green-400" /><span className="text-green-400">Saved!</span></>
            : <><Camera size={12} /> Set View</>
          }
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
          ref={sphereRef}
          scene={viewSceneWithHotspots}
          onHotspotClick={handleHotspotClick}
          onSphereClick={handleSphereClick}
          editorMode={true}
        />
      </Canvas>

      {/* Nav hotspot floating panel */}
      {navPanel && tour && (
        <NavPanel
          hotspot={navPanel.hotspot}
          scenes={tour.scenes}
          currentSceneId={currentScene._id}
          x={navPanel.x}
          y={navPanel.y}
          onSave={handleNavSave}
          onDelete={handleNavDelete}
          onClose={() => setNavPanel(null)}
        />
      )}

      {/* Hotspot form (add new OR edit info hotspot) */}
      {showForm && pendingHotspot && (
        <HotspotForm onClose={() => { setShowForm(false); setSelectedHotspot(null) }} />
      )}
    </div>
  )
}
