'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { lonLatToVector3 } from '@/lib/three/lonlat'
import type { HotspotDoc, SensorType, SensorStatus } from '@/types'

interface HotspotSpriteProps {
  hotspot: HotspotDoc
  onClick: (hotspot: HotspotDoc) => void
  onPointerDown?: (hotspot: HotspotDoc, event: THREE.Event) => void
}

const loader        = new THREE.TextureLoader()
const NAV_IMAGE     = '/hotspot.png'
const INFO_IMAGE    = '/point.png'
const CHEVRON_IMAGE = '/chevron1.png'

const _screenPos = new THREE.Vector3()

// Sensor type base colors (shown when no status is set)
const SENSOR_TYPE_COLORS: Record<SensorType, string> = {
  temperature: '#f97316',  // orange
  vibration:   '#a855f7',  // purple
  humidity:    '#06b6d4',  // cyan
  pressure:    '#22c55e',  // green
  airquality:  '#84cc16',  // lime
  power:       '#eab308',  // yellow
}

// Status colors override sensor type color
const STATUS_COLORS: Record<SensorStatus, string> = {
  normal: '#22c55e',  // green
  warn:   '#f59e0b',  // amber
  danger: '#ef4444',  // red
}

function getSpriteColor(hotspot: HotspotDoc): string {
  if (hotspot.type === 'info' && hotspot.sensor?.type) {
    if (hotspot.sensor.status) return STATUS_COLORS[hotspot.sensor.status] ?? '#ffffff'
    return SENSOR_TYPE_COLORS[hotspot.sensor.type] ?? '#ffffff'
  }
  return '#ffffff'
}

export function HotspotSprite({ hotspot, onClick, onPointerDown }: HotspotSpriteProps) {
  const baseSpriteRef    = useRef<THREE.Sprite>(null)
  const baseMatRef       = useRef<THREE.SpriteMaterial>(null)
  const chevronSpriteRef = useRef<THREE.Sprite>(null)
  const chevronMatRef    = useRef<THREE.SpriteMaterial>(null)
  const bobOffset        = useRef(Math.random() * Math.PI * 2)

  const position     = lonLatToVector3(hotspot.position.lon, hotspot.position.lat, 490)
  const baseScale    = (hotspot.style?.scale ?? 1.0) * 40
  const chevronScale = (hotspot.style?.scale ?? 1.0) * 55

  // Load base PNG
  useEffect(() => {
    if (!baseMatRef.current) return
    const url = hotspot.type === 'navigation' ? NAV_IMAGE : INFO_IMAGE
    loader.load(url, (tex) => {
      if (!baseMatRef.current) return
      baseMatRef.current.map = tex
      baseMatRef.current.needsUpdate = true
    })
  }, [hotspot.type])

  // Apply sensor/status color tint to info hotspot sprite
  useEffect(() => {
    if (!baseMatRef.current) return
    baseMatRef.current.color.set(getSpriteColor(hotspot))
    baseMatRef.current.needsUpdate = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotspot.type, hotspot.sensor?.type, hotspot.sensor?.status])

  // Load chevron (navigation only)
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

    const bobY = hotspot.type === 'navigation'
      ? position.y + Math.sin(clock.elapsedTime * 2 + bobOffset.current) * 4
      : position.y

    baseSpriteRef.current.position.y = bobY

    // Danger sensors pulse (scale in/out) to draw attention
    if (hotspot.sensor?.status === 'danger') {
      const pulse = 1 + Math.sin(clock.elapsedTime * 6) * 0.15
      baseSpriteRef.current.scale.setScalar(baseScale * pulse)
    }

    if (hotspot.type === 'navigation' && chevronSpriteRef.current && chevronMatRef.current) {
      chevronSpriteRef.current.position.y = bobY

      _screenPos.set(position.x, position.y, position.z)
      _screenPos.project(camera)

      const onScreen =
        _screenPos.z <= 1 &&
        Math.abs(_screenPos.x) <= 1 &&
        Math.abs(_screenPos.y) <= 1

      chevronSpriteRef.current.visible = !onScreen
      chevronMatRef.current.rotation   = Math.atan2(_screenPos.x, _screenPos.y)
    }
  })

  return (
    <>
      <sprite
        ref={baseSpriteRef}
        position={[position.x, position.y, position.z]}
        scale={[baseScale, baseScale, 1]}
        userData={{ hotspotId: hotspot._id }}
        onClick={(e) => { e.stopPropagation(); onClick(hotspot) }}
        onPointerDown={(e) => { e.stopPropagation(); onPointerDown?.(hotspot, e) }}
      >
        <spriteMaterial ref={baseMatRef} transparent depthWrite={false} color={getSpriteColor(hotspot)} sizeAttenuation />
      </sprite>

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
