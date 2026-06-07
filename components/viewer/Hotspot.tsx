'use client'

import { HotspotSprite } from './HotspotSprite'
import type { HotspotDoc } from '@/types'
import * as THREE from 'three'

interface HotspotProps {
  hotspots: HotspotDoc[]
  onHotspotClick: (hotspot: HotspotDoc) => void
  onHotspotPointerDown?: (hotspot: HotspotDoc, event: THREE.Event) => void
}

export function Hotspot({ hotspots, onHotspotClick, onHotspotPointerDown }: HotspotProps) {
  return (
    <>
      {hotspots.map((h) => (
        <HotspotSprite
          key={h._id}
          hotspot={h}
          onClick={onHotspotClick}
          onPointerDown={onHotspotPointerDown}
        />
      ))}
    </>
  )
}
