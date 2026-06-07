'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { SceneDoc } from '@/types'

interface SceneRailProps {
  scenes: SceneDoc[]
  currentSceneId: string
  onSelect: (sceneId: string) => void
}

export function SceneRail({ scenes, currentSceneId, onSelect }: SceneRailProps) {
  const [isOpen, setIsOpen] = useState(true)

  if (scenes.length <= 1) return null

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      {/* Toggle button */}
      <div className="flex justify-center pb-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
        >
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {isOpen && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 bg-gradient-to-t from-black/60 to-transparent">
          {scenes.map((scene) => (
            <button
              key={scene._id}
              onClick={() => onSelect(scene._id)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 group ${
                scene._id === currentSceneId ? 'opacity-100' : 'opacity-60 hover:opacity-90'
              }`}
            >
              <div
                className={`w-16 h-10 rounded overflow-hidden border-2 transition-colors ${
                  scene._id === currentSceneId ? 'border-blue-400' : 'border-transparent'
                }`}
              >
                <img
                  src={scene.preview}
                  alt={scene.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white text-xs max-w-16 truncate">{scene.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
