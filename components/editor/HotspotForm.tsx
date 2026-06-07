'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { HotspotDoc, SceneDoc } from '@/types'

interface HotspotFormProps {
  onClose: () => void
}

export function HotspotForm({ onClose }: HotspotFormProps) {
  const { pendingHotspot, tour, addHotspot, setPendingHotspot, setMode } = useEditorStore()
  const [label,         setLabel]         = useState('')
  const [targetSceneId, setTargetSceneId] = useState('')
  const [title,         setTitle]         = useState('')
  const [text,          setText]          = useState('')
  const [link,          setLink]          = useState('')
  const [color,         setColor]         = useState('#60a5fa')

  const isNavigation = pendingHotspot?.type === 'navigation'
  const scenes: SceneDoc[] = tour?.scenes ?? []

  useEffect(() => {
    setLabel('');  setTargetSceneId(''); setTitle('');
    setText('');   setLink('');          setColor(isNavigation ? '#60a5fa' : '#34d399')
  }, [pendingHotspot?.type])

  function handleSave() {
    if (!pendingHotspot?.position) return

    const newHotspot: HotspotDoc = {
      _id:      `hs_${Date.now()}`,
      sceneId:  pendingHotspot.sceneId ?? '',
      type:     pendingHotspot.type as 'navigation' | 'info',
      position: pendingHotspot.position,
      label:    label.trim() || (isNavigation ? 'Go here' : 'Info'),
      icon:     isNavigation ? 'arrow' : 'info',
      style:    { color },
      ...(isNavigation ? {
        targetSceneId: targetSceneId || undefined,
        targetView:    { lon: 0, lat: 0 },
      } : {
        content: {
          title: title.trim() || undefined,
          text:  text.trim()  || undefined,
          link:  link.trim()  || undefined,
        },
      }),
    }

    addHotspot(newHotspot)
    setPendingHotspot(null)
    setMode('view')
    onClose()
  }

  if (!pendingHotspot) return null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm">
            {isNavigation ? 'Add Navigation Point' : 'Add Info Hotspot'}
          </h3>
          <button onClick={() => { setPendingHotspot(null); setMode('view'); onClose() }} className="text-white/50 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Label</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={isNavigation ? 'e.g. Enter Kitchen' : 'e.g. Oak Table'}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {isNavigation ? (
            <div>
              <label className="block text-gray-400 text-xs mb-1">Target Scene</label>
              <select
                value={targetSceneId}
                onChange={e => setTargetSceneId(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
              >
                <option value="">— select scene —</option>
                {scenes.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Description</label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Link URL (optional)</label>
                <input
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  type="url"
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-400 text-xs mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-gray-400 text-xs">{color}</span>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-2 justify-end">
          <button
            onClick={() => { setPendingHotspot(null); setMode('view'); onClose() }}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Add Hotspot
          </button>
        </div>
      </div>
    </div>
  )
}
