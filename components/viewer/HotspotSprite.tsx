'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { lonLatToVector3 } from '@/lib/three/lonlat'
import type { HotspotDoc } from '@/types'

interface HotspotSpriteProps {
  hotspot: HotspotDoc
  onClick: (hotspot: HotspotDoc) => void
  onPointerDown?: (hotspot: HotspotDoc, event: THREE.Event) => void
}

const loader        = new THREE.TextureLoader()
const NAV_IMAGE     = '/hotspot.png'   // base marker for navigation
const INFO_IMAGE    = '/point.png'     // dot for info hotspots
const CHEVRON_IMAGE = '/chevron1.png'  // rotating direction arrow (nav only)

const _screenPos = new THREE.Vector3()

export function HotspotSprite({ hotspot, onClick, onPointerDown }: HotspotSpriteProps) {
  const baseSpriteRef    = useRef<THREE.Sprite>(null)
  const baseMatRef       = useRef<THREE.SpriteMaterial>(null)
  const chevronSpriteRef = useRef<THREE.Sprite>(null)
  const chevronMatRef    = useRef<THREE.SpriteMaterial>(null)
  const bobOffset        = useRef(Math.random() * Math.PI * 2)

  const position = lonLatToVector3(hotspot.position.lon, hotspot.position.lat, 490)
  const baseScale    = (hotspot.style?.scale ?? 1.0) * 40
  const chevronScale = (hotspot.style?.scale ?? 1.0) * 55  // slightly larger

  // Load base image (hotspot.png for nav, point.png for info)
  useEffect(() => {
    if (!baseMatRef.current) return
    const url = hotspot.type === 'navigation' ? NAV_IMAGE : INFO_IMAGE
    loader.load(url, (tex) => {
      if (!baseMatRef.current) return
      baseMatRef.current.map = tex
      baseMatRef.current.needsUpdate = true
    })
  }, [hotspot.type])

  // Load chevron image (navigation only)
  useEffect(() => {
    if (!chevronMatRef.current || hotspot.type !== 'navigation') return
    loader.load(CHEVRON_IMAGE, (tex) => {
      if (!chevronMatRef.current) return
      chevronMatRef.current.map = tex
      chevronMatRef.current.needsUpdate = true
    })
  }, [hotspot.type])

  useFrame(({ camera, clock }) => {
    if (!baseSpriteRef.current) return

    // Bob animation
    const bobY = hotspot.type === 'navigation'
      ? position.y + Math.sin(clock.elapsedTime * 2 + bobOffset.current) * 4
      : position.y

    baseSpriteRef.current.position.y = bobY

    if (hotspot.type === 'navigation' && chevronSpriteRef.current && chevronMatRef.current) {
      chevronSpriteRef.current.position.y = bobY

      _screenPos.set(position.x, position.y, position.z)
      _screenPos.project(camera)

      // Hotspot is visible on screen when:
      //   z <= 1  → in front of camera (not behind)
      //   |x| <= 1 && |y| <= 1 → within viewport bounds
      const onScreen =
        _screenPos.z <= 1 &&
        Math.abs(_screenPos.x) <= 1 &&
        Math.abs(_screenPos.y) <= 1

      // Show chevron ONLY when hotspot is off-screen (user can't see it)
      chevronSpriteRef.current.visible = !onScreen

      // Rotate to point towards hotspot direction
      chevronMatRef.current.rotation = Math.atan2(_screenPos.x, _screenPos.y)
    }
  })

  return (
    <>
      {/* Base marker sprite — hotspot.png (nav) or point.png (info) */}
      <sprite
        ref={baseSpriteRef}
        position={[position.x, position.y, position.z]}
        scale={[baseScale, baseScale, 1]}
        userData={{ hotspotId: hotspot._id }}
        onClick={(e) => { e.stopPropagation(); onClick(hotspot) }}
        onPointerDown={(e) => { e.stopPropagation(); onPointerDown?.(hotspot, e) }}
      >
        <spriteMaterial ref={baseMatRef} transparent depthWrite={false} color="#ffffff" sizeAttenuation />
      </sprite>

      {/* Chevron sprite — navigation only, rotates to show direction */}
      {hotspot.type === 'navigation' && (
        <sprite
          ref={chevronSpriteRef}
          position={[position.x, position.y, position.z]}
          scale={[chevronScale, chevronScale, 1]}
        >
          <spriteMaterial ref={chevronMatRef} transparent depthWrite={false} color="#ffffff" sizeAttenuation />
        </sprite>
      )}
    </>
  )
}
