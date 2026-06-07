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

// Load once, shared across all sprite instances
const loader = new THREE.TextureLoader()
const NAV_IMAGE  = '/hotspot.png'
const INFO_IMAGE = '/hotspot.png'

// Tint colors applied over the image (white = no tint)
const NAV_COLOR  = new THREE.Color('#60a5fa')  // blue
const INFO_COLOR = new THREE.Color('#34d399')  // green

export function HotspotSprite({ hotspot, onClick, onPointerDown }: HotspotSpriteProps) {
  const spriteRef  = useRef<THREE.Sprite>(null)
  const matRef     = useRef<THREE.SpriteMaterial>(null)
  const bobOffset  = useRef(Math.random() * Math.PI * 2)

  const position = lonLatToVector3(hotspot.position.lon, hotspot.position.lat, 490)
  const scale    = (hotspot.style?.scale ?? 1.0) * 40

  useEffect(() => {
    if (!matRef.current) return
    const url = hotspot.type === 'navigation' ? NAV_IMAGE : INFO_IMAGE
    loader.load(
      url,
      (tex) => {
        if (!matRef.current) return
        matRef.current.map = tex
        matRef.current.needsUpdate = true
      },
      undefined,
      (err) => console.error('[HotspotSprite] texture load failed:', url, err)
    )
  }, [hotspot.type])

  useFrame(({ clock }) => {
    if (!spriteRef.current || hotspot.type !== 'navigation') return
    spriteRef.current.position.y =
      position.y + Math.sin(clock.elapsedTime * 2 + bobOffset.current) * 4
  })

  const tint = hotspot.style?.color
    ? new THREE.Color(hotspot.style.color)
    : hotspot.type === 'navigation' ? NAV_COLOR : INFO_COLOR

  return (
    <sprite
      ref={spriteRef}
      position={[position.x, position.y, position.z]}
      scale={[scale, scale, 1]}
      userData={{ hotspotId: hotspot._id }}
      onClick={(e) => { e.stopPropagation(); onClick(hotspot) }}
      onPointerDown={(e) => { e.stopPropagation(); onPointerDown?.(hotspot, e) }}
    >
      <spriteMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        color={tint}
        sizeAttenuation
      />
    </sprite>
  )
}
