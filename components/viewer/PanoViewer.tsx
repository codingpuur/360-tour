'use client'

import { useState, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { PanoSphere } from './PanoSphere'
import { SceneRail } from './SceneRail'
import { Floorplan } from './Floorplan'
import { InfoPopup } from './InfoPopup'
import { HoverCard } from './HoverCard'
import type { TourDoc, SceneDoc, HotspotDoc, TransitionType } from '@/types'

interface PanoViewerProps {
  tour: TourDoc
  initialSceneId?: string
}

type FadeState = 'visible' | 'out' | 'in'

// CSS-based transitions (used for all except 'crossfade')
const TRANSITIONS: Record<Exclude<TransitionType, 'crossfade'>, {
  bg: string
  duration: number
  out: string
  in: string
  visible: string
}> = {
  'fade': {
    bg: 'bg-black', duration: 300,
    out: 'opacity-0', in: 'opacity-100', visible: 'opacity-100',
  },
  'fade-white': {
    bg: 'bg-white', duration: 300,
    out: 'opacity-0', in: 'opacity-100', visible: 'opacity-100',
  },
  'zoom': {
    bg: 'bg-black', duration: 350,
    out: 'opacity-0 scale-125', in: 'opacity-100 scale-100', visible: 'opacity-100 scale-100',
  },
  'blur': {
    bg: 'bg-black', duration: 300,
    out: 'opacity-0 blur-xl', in: 'opacity-100 blur-none', visible: 'opacity-100 blur-none',
  },
  'instant': {
    bg: 'bg-black', duration: 0,
    out: 'opacity-100', in: 'opacity-100', visible: 'opacity-100',
  },
}

export function PanoViewer({ tour, initialSceneId }: PanoViewerProps) {
  const startScene = tour.scenes.find(s => s._id === (initialSceneId ?? tour.startSceneId)) ?? tour.scenes[0]

  const [currentScene,   setCurrentScene]   = useState<SceneDoc>(startScene)
  const [fadeState,      setFadeState]       = useState<FadeState>('visible')
  const [crossfadeScene, setCrossfadeScene]  = useState<SceneDoc | null>(null)
  const [activePopup,    setActivePopup]     = useState<HotspotDoc | null>(null)
  const [hoveredHotspot, setHoveredHotspot]  = useState<HotspotDoc | null>(null)
  const [hoverPos,       setHoverPos]        = useState({ x: 0, y: 0 })

  const nextSceneRef    = useRef<SceneDoc | null>(null)
  const isCrossfadeRef  = useRef(false)

  const transitionKey = (tour.settings?.transition ?? 'fade') as TransitionType
  const cssTransition = transitionKey === 'crossfade'
    ? TRANSITIONS['fade']  // fallback, not used for crossfade
    : TRANSITIONS[transitionKey]

  const goToScene = useCallback((sceneId: string) => {
    const target = tour.scenes.find(s => s._id === sceneId)
    if (!target || target._id === currentScene._id) return

    // Crossfade: handled entirely inside WebGL, no CSS transitions
    if (transitionKey === 'crossfade') {
      if (isCrossfadeRef.current) return
      isCrossfadeRef.current = true
      setCrossfadeScene(target)
      return
    }

    if (fadeState !== 'visible') return
    nextSceneRef.current = target

    if (cssTransition.duration === 0) {
      setCurrentScene(target)
      return
    }
    setFadeState('out')
    setTimeout(() => {
      setCurrentScene(nextSceneRef.current!)
      setFadeState('in')
      setTimeout(() => setFadeState('visible'), cssTransition.duration)
    }, cssTransition.duration)
  }, [tour.scenes, currentScene._id, fadeState, transitionKey, cssTransition])

  const handleCrossfadeDone = useCallback(() => {
    setCrossfadeScene(prev => {
      if (prev) {
        setCurrentScene(prev)
        isCrossfadeRef.current = false
      }
      return null
    })
  }, [])

  const handleHotspotClick = useCallback((hotspot: HotspotDoc) => {
    if (hotspot.type === 'navigation' && hotspot.targetSceneId) {
      goToScene(hotspot.targetSceneId)
    } else if (hotspot.type === 'info') {
      setHoveredHotspot(null)
      setActivePopup(hotspot)
    }
  }, [goToScene])

  const handleHoverEnter = useCallback((hotspot: HotspotDoc, x: number, y: number) => {
    if (hotspot.type !== 'info') return
    setHoveredHotspot(hotspot)
    setHoverPos({ x, y })
  }, [])

  const handleHoverLeave = useCallback(() => {
    setHoveredHotspot(null)
  }, [])

  // CSS wrapper classes (only relevant for non-crossfade transitions)
  const stateClasses = transitionKey === 'crossfade'
    ? 'opacity-100'
    : fadeState === 'out'
      ? cssTransition.out
      : fadeState === 'in'
        ? cssTransition.in
        : cssTransition.visible

  const transitionCss = transitionKey !== 'crossfade' && cssTransition.duration > 0
    ? `transition-all duration-[${cssTransition.duration}ms]`
    : ''

  return (
    <div className={`relative w-full h-full select-none overflow-hidden ${transitionKey !== 'crossfade' ? cssTransition.bg : 'bg-black'}`}>
      <div className={`absolute inset-0 z-0 ${transitionCss} ${stateClasses}`}>
        <Canvas
          camera={{ fov: currentScene.initialView.fov, near: 1, far: 1100 }}
          style={{ width: '100%', height: '100%' }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('wheel', (e) => e.preventDefault(), { passive: false })
          }}
        >
          <PanoSphere
            scene={currentScene}
            nextScene={transitionKey === 'crossfade' ? crossfadeScene : null}
            onCrossfadeDone={handleCrossfadeDone}
            onHotspotClick={handleHotspotClick}
            onHoverEnter={handleHoverEnter}
            onHoverLeave={handleHoverLeave}
          />
        </Canvas>
      </div>

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

      {hoveredHotspot && !activePopup && (
        <HoverCard hotspot={hoveredHotspot} x={hoverPos.x} y={hoverPos.y} />
      )}

      {activePopup && (
        <InfoPopup hotspot={activePopup} onClose={() => setActivePopup(null)} />
      )}
    </div>
  )
}
