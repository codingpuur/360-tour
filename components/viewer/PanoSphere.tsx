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
  onHotspotClick: (hotspot: HotspotDoc) => void
  onSphereClick?: (lonLat: LonLat) => void
  editorMode?: boolean
}

const SPHERE_RADIUS = 500
const DRAG_THRESHOLD = 5
const MIN_FOV = 40
const MAX_FOV = 110
const DRAG_SPEED = 0.3

export function PanoSphere({ scene, onHotspotClick, onSphereClick, editorMode = false }: PanoSphereProps) {
  const { camera, gl } = useThree()

  const sphereRef   = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  const lonRef = useRef(scene.initialView.lon)
  const latRef = useRef(scene.initialView.lat)
  const fovRef = useRef(scene.initialView.fov)

  const isDragging  = useRef(false)
  const pointerDown = useRef<{ x: number; y: number } | null>(null)
  const lastMouse   = useRef({ x: 0, y: 0 })

  useEffect(() => {
    let cancelled = false

    lonRef.current = scene.initialView.lon
    latRef.current = scene.initialView.lat
    fovRef.current = scene.initialView.fov

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
          tex.colorSpace = THREE.SRGBColorSpace
          // BackSide sphere: texture appears mirrored horizontally without this fix
          tex.repeat.set(-1, 1)
          tex.offset.set(1, 0)
          tex.wrapS = THREE.RepeatWrapping
          if (materialRef.current) {
            if (materialRef.current.map) materialRef.current.map.dispose()
            materialRef.current.map = tex
            materialRef.current.needsUpdate = true
          }
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

  useFrame(() => {
    latRef.current = Math.max(-85, Math.min(85, latRef.current))
    camera.rotation.copy(lonLatToEuler(lonRef.current, latRef.current))
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fovRef.current
      camera.updateProjectionMatrix()
    }
  })

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
        BackSide renders the sphere's inner surface (no scale flip needed).
        Three.js r141+ removed automatic winding-order compensation for negative scale,
        so the old scale.x=-1 + FrontSide approach broke. BackSide is the correct fix.
        Texture is horizontally flipped via repeat.x=-1 / offset.x=1 to cancel the
        left-right mirror that BackSide introduces.
      */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[SPHERE_RADIUS, 60, 30]} />
        <meshBasicMaterial ref={materialRef} side={THREE.BackSide} />
      </mesh>

      <Hotspot hotspots={scene.hotspots} onHotspotClick={onHotspotClick} />
    </>
  )
}
