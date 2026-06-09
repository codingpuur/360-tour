'use client'

import { HotspotSprite } from './HotspotSprite'
import type { HotspotDoc } from '@/types'
import * as THREE from 'three'

interface HotspotProps {
  hotspots: HotspotDoc[]
  onHotspotClick: (hotspot: HotspotDoc, x: number, y: number) => void
  onHotspotPointerDown?: (hotspot: HotspotDoc, event: THREE.Event) => void
  onHoverEnter?: (hotspot: HotspotDoc, x: number, y: number) => void
  onHoverLeave?: () => void
}

export function Hotspot({ hotspots, onHotspotClick, onHotspotPointerDown, onHoverEnter, onHoverLeave }: HotspotProps) {
  return (
    <>
      {hotspots.map((h) => (
        <HotspotSprite
          key={h._id}
          hotspot={h}
          onClick={onHotspotClick}
          onPointerDown={onHotspotPointerDown}
          onHoverEnter={onHoverEnter}
          onHoverLeave={onHoverLeave}
        />
      ))}
    </>
  )
}
