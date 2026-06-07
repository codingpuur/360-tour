'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { lonLatToEuler } from '@/lib/three/lonlat'
import { raycastToLonLat } from '@/lib/three/raycast'
import { Hotspot } from './Hotspot'
import type { SceneDoc, HotspotDoc, LonLat } from '@/types'

interface PanoSphereProps {
  scene: SceneDoc
  nextScene?: SceneDoc | null
  onCrossfadeDone?: () => void
  onHotspotClick: (hotspot: HotspotDoc) => void
  onSphereClick?: (lonLat: LonLat) => void
  onHoverEnter?: (hotspot: HotspotDoc, x: number, y: number) => void
  onHoverLeave?: () => void
  editorMode?: boolean
}

const SPHERE_RADIUS   = 500
const DRAG_THRESHOLD  = 5
const MIN_FOV         = 40
const MAX_FOV         = 110
const DRAG_SPEED      = 0.3
const CROSSFADE_SPEED = 1.8  // progress units per second ≈ 0.55s duration
const FOV_DIP_DEGREES = 8    // how much FOV narrows at crossfade midpoint

export function PanoSphere({
  scene,
  nextScene,
  onCrossfadeDone,
  onHotspotClick,
  onSphereClick,
  onHoverEnter,
  onHoverLeave,
  editorMode = false,
}: PanoSphereProps) {
  const { camera, gl } = useThree()

  // Primary sphere (current scene)
  const sphereRef   = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  // Secondary sphere (crossfade target)
  const secMeshRef = useRef<THREE.Mesh>(null)
  const secMatRef  = useRef<THREE.MeshBasicMaterial>(null)

  // Camera view
  const lonRef = useRef(scene.initialView.lon)
  const latRef = useRef(scene.initialView.lat)
  const fovRef = useRef(scene.initialView.fov)

  // Drag state
  const isDragging  = useRef(false)
  const pointerDown = useRef<{ x: number; y: number } | null>(null)
  const lastMouse   = useRef({ x: 0, y: 0 })

  // Crossfade animation state
  const cfProgress = useRef(0)
  const cfActive   = useRef(false)
  // ID of next scene currently animating, kept in ref so useFrame can read without closure
  const nextSceneIdRef = useRef<string>('')
  // After crossfade completes, skip re-loading this scene (texture already in secondary sphere)
  const skipLoadIdRef = useRef<string>('')
  // Stable ref to callback so useFrame doesn't go stale
  const onCrossfadeDoneRef = useRef(onCrossfadeDone)
  useEffect(() => { onCrossfadeDoneRef.current = onCrossfadeDone }, [onCrossfadeDone])

  // ── Load primary scene texture ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    lonRef.current = scene.initialView.lon
    latRef.current = scene.initialView.lat
    fovRef.current = scene.initialView.fov

    // Crossfade just finished: secondary sphere already has this texture — transfer it
    if (skipLoadIdRef.current === scene._id && secMatRef.current?.map && materialRef.current) {
      const tex = secMatRef.current.map
      if (materialRef.current.map) materialRef.current.map.dispose()
      materialRef.current.map = tex
      materialRef.current.needsUpdate = true
      secMatRef.current.map = null
      secMatRef.current.opacity = 0
      secMatRef.current.needsUpdate = true
      skipLoadIdRef.current = ''
      return
    }
    skipLoadIdRef.current = ''

    const loader = new THREE.TextureLoader()
    const urls = [scene.preview, scene.panorama].filter(url => !!url)
    if (urls.length === 0) return

    let i = 0
    function loadNext() {
      if (cancelled || i >= urls.length) return
      const url = urls[i++]
      loader.load(
        url,
        (tex) => {
          if (cancelled) { tex.dispose(); return }
          applyPanoramaTexture(tex, materialRef.current)
          loadNext()
        },
        undefined,
        (err) => {
          console.error('[PanoSphere] texture load failed:', url, err)
          loadNext()
        }
      )
    }
    loadNext()
    return () => { cancelled = true }
  }, [scene._id, scene.panorama, scene.preview])

  // ── Load secondary (crossfade target) scene texture ───────────────────────
  useEffect(() => {
    if (!nextScene) {
      cfProgress.current     = 0
      cfActive.current       = false
      nextSceneIdRef.current = ''
      if (secMatRef.current) {
        secMatRef.current.opacity = 0
        secMatRef.current.needsUpdate = true
      }
      return
    }

    cfProgress.current     = 0
    cfActive.current       = false   // wait for texture before animating
    nextSceneIdRef.current = nextScene._id

    const loader = new THREE.TextureLoader()
    const urls   = [nextScene.preview, nextScene.panorama].filter(Boolean) as string[]
    let i = 0
    let cancelled  = false
    let animStarted = false

    function loadNext() {
      if (cancelled || i >= urls.length) return
      const url = urls[i++]
      loader.load(
        url,
        (tex) => {
          if (cancelled) { tex.dispose(); return }
          applyPanoramaTexture(tex, secMatRef.current)
          // Start crossfade only once the first (preview) texture is in the secondary sphere
          if (!animStarted) {
            animStarted      = true
            cfActive.current = true
          }
          loadNext()
        },
        undefined,
        (err) => {
          console.error('[PanoSphere crossfade] texture load failed:', url, err)
          // If preview fails, try to start animation anyway on full-res load
          loadNext()
        }
      )
    }
    loadNext()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextScene?._id])

  // ── Per-frame: camera rotation + crossfade animation ──────────────────────
  useFrame((_, delta) => {
    latRef.current = Math.max(-85, Math.min(85, latRef.current))
    camera.rotation.copy(lonLatToEuler(lonRef.current, latRef.current))

    if (camera instanceof THREE.PerspectiveCamera) {
      if (cfActive.current && nextScene) {
        cfProgress.current = Math.min(cfProgress.current + delta * CROSSFADE_SPEED, 1)

        if (secMatRef.current) {
          secMatRef.current.opacity = cfProgress.current
          secMatRef.current.needsUpdate = true
        }

        // FOV dip: sine curve peaks at midpoint for subtle zoom feel
        const fovDip = Math.sin(cfProgress.current * Math.PI) * FOV_DIP_DEGREES
        camera.fov = fovRef.current - fovDip

        if (cfProgress.current >= 1) {
          cfActive.current       = false
          skipLoadIdRef.current  = nextSceneIdRef.current
          nextSceneIdRef.current = ''
          onCrossfadeDoneRef.current?.()
        }
      } else {
        camera.fov = fovRef.current
      }
      camera.updateProjectionMatrix()
    }
  })

  // ── Pointer handlers ───────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (e.button !== 0) return
    isDragging.current  = false
    pointerDown.current = { x: e.clientX, y: e.clientY }
    lastMouse.current   = { x: e.clientX, y: e.clientY }
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!pointerDown.current) return
    const dx = e.clientX - pointerDown.current.x
    const dy = e.clientY - pointerDown.current.y
    if (!isDragging.current && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      isDragging.current = true
    }
    if (isDragging.current) {
      lonRef.current += (e.clientX - lastMouse.current.x) * DRAG_SPEED
      latRef.current -= (e.clientY - lastMouse.current.y) * DRAG_SPEED
    }
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!pointerDown.current) return
    if (!isDragging.current && editorMode && onSphereClick && sphereRef.current) {
      const lonLat = raycastToLonLat(e, camera, sphereRef.current, gl.domElement)
      if (lonLat) onSphereClick(lonLat)
    }
    pointerDown.current = null
    isDragging.current  = false
  }, [editorMode, onSphereClick, camera, gl])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    fovRef.current = Math.max(MIN_FOV, Math.min(MAX_FOV, fovRef.current + e.deltaY * 0.05))
  }, [])

  useEffect(() => {
    const canvas = gl.domElement
    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup',   handlePointerUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup',   handlePointerUp)
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [gl, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel])

  return (
    <>
      {/*
        Primary sphere: current scene. Always fully opaque.
        BackSide renders the inner surface so the camera (at origin) sees the panorama.
        texture.repeat.x=-1 / offset.x=1 corrects the horizontal mirror BackSide introduces.
      */}
      <mesh ref={sphereRef} renderOrder={1}>
        <sphereGeometry args={[SPHERE_RADIUS, 60, 30]} />
        <meshBasicMaterial ref={materialRef} side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/*
        Secondary sphere: crossfade target. Slightly smaller radius so it wins depth against
        the primary. Opacity animates 0→1 during crossfade, covering the primary gradually.
      */}
      <mesh ref={secMeshRef} renderOrder={2}>
        <sphereGeometry args={[SPHERE_RADIUS - 1, 60, 30]} />
        <meshBasicMaterial ref={secMatRef} side={THREE.BackSide} depthWrite={false} transparent opacity={0} />
      </mesh>

      <Hotspot
        hotspots={scene.hotspots}
        onHotspotClick={onHotspotClick}
        onHoverEnter={onHoverEnter}
        onHoverLeave={onHoverLeave}
      />
    </>
  )
}

// ── Shared texture setup helper ────────────────────────────────────────────────
function applyPanoramaTexture(
  tex: THREE.Texture,
  mat: THREE.MeshBasicMaterial | null
) {
  if (!mat) return
  tex.colorSpace = THREE.SRGBColorSpace
  tex.repeat.set(-1, 1)
  tex.offset.set(1, 0)
  tex.wrapS = THREE.RepeatWrapping
  if (mat.map) mat.map.dispose()
  mat.map = tex
  mat.needsUpdate = true
}
