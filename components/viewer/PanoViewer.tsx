'use client'

import { useState, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { PanoSphere } from './PanoSphere'
import { SceneRail } from './SceneRail'
import { Floorplan } from './Floorplan'
import { InfoPopup } from './InfoPopup'
import type { TourDoc, SceneDoc, HotspotDoc, LonLat } from '@/types'

interface PanoViewerProps {
  tour: TourDoc
  initialSceneId?: string
}

type FadeState = 'visible' | 'fading-out' | 'fading-in'

export function PanoViewer({ tour, initialSceneId }: PanoViewerProps) {
  const startScene  = tour.scenes.find(s => s._id === (initialSceneId ?? tour.startSceneId)) ?? tour.scenes[0]
  const [currentScene, setCurrentScene] = useState<SceneDoc>(startScene)
  const [fadeState,    setFadeState]    = useState<FadeState>('visible')
  const [activePopup,  setActivePopup]  = useState<HotspotDoc | null>(null)
  const nextSceneRef = useRef<SceneDoc | null>(null)

  const goToScene = useCallback((sceneId: string, _arrivalView?: LonLat) => {
    const target = tour.scenes.find(s => s._id === sceneId)
    if (!target || target._id === currentScene._id) return
    if (fadeState !== 'visible') return

    nextSceneRef.current = target
    setFadeState('fading-out')

    setTimeout(() => {
      setCurrentScene(nextSceneRef.current!)
      setFadeState('fading-in')
      setTimeout(() => setFadeState('visible'), 300)
    }, 300)
  }, [tour.scenes, currentScene._id, fadeState])

  const handleHotspotClick = useCallback((hotspot: HotspotDoc) => {
    if (hotspot.type === 'navigation' && hotspot.targetSceneId) {
      goToScene(hotspot.targetSceneId, hotspot.targetView)
    } else if (hotspot.type === 'info') {
      setActivePopup(hotspot)
    }
  }, [goToScene])

  const opacity = fadeState === 'fading-out' ? 'opacity-0' : 'opacity-100'

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden">
      {/* Fade overlay */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-300 ${opacity}`}>
        {/* One Canvas lives for the entire tour — never unmounted */}
        <Canvas
          camera={{ fov: currentScene.initialView.fov, near: 1, far: 1100 }}
          style={{ width: '100%', height: '100%' }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('wheel', (e) => e.preventDefault(), { passive: false })
          }}
        >
          <PanoSphere
            scene={currentScene}
            onHotspotClick={handleHotspotClick}
          />
        </Canvas>
      </div>

      {/* DOM overlays (outside Canvas) */}
      {tour.floorplan?.image && (
        <Floorplan
          floorplan={tour.floorplan}
          currentSceneId={currentScene._id}
          onSceneSelect={goToScene}
        />
      )}

      <SceneRail
        scenes={tour.scenes}
        currentSceneId={currentScene._id}
        onSelect={goToScene}
      />

      {activePopup && (
        <InfoPopup hotspot={activePopup} onClose={() => setActivePopup(null)} />
      )}
    </div>
  )
}
