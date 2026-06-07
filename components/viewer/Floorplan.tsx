'use client'

import { useState } from 'react'
import { Map, X } from 'lucide-react'

interface FloorplanProps {
  floorplan: {
    image: string
    markers: Array<{ sceneId: string; x: number; y: number }>
  }
  currentSceneId: string
  onSceneSelect: (sceneId: string) => void
}

export function Floorplan({ floorplan, currentSceneId, onSceneSelect }: FloorplanProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="absolute bottom-20 right-4 z-10">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black/60 text-white rounded-full p-2 hover:bg-black/80 transition-colors"
          title="Show map"
        >
          <Map size={20} />
        </button>
      ) : (
        <div className="bg-black/60 rounded-lg overflow-hidden border border-white/20 w-44">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-white text-xs font-medium">Map</span>
            <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="relative">
            <img
              src={floorplan.image}
              alt="Floorplan"
              className="w-full h-auto object-contain"
              draggable={false}
            />
            {floorplan.markers.map((marker) => (
              <button
                key={marker.sceneId}
                onClick={() => onSceneSelect(marker.sceneId)}
                title={`Go to scene`}
                className={`absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 border border-white/80 transition-transform hover:scale-125 ${
                  marker.sceneId === currentSceneId
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-white/70'
                }`}
                style={{
                  left: `${marker.x * 100}%`,
                  top:  `${marker.y * 100}%`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
