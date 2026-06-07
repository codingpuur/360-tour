'use client'

import { useRef, useState } from 'react'
import { Upload, Check } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { SceneDoc } from '@/types'

export function SceneManager() {
  const { tour, currentScene, setCurrentScene, hotspots, setTour, isDirty, markSaved } = useEditorStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading,  setUploading]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [uploadName, setUploadName] = useState('')

  if (!tour) return null

  async function handleUpload(file: File) {
    if (!tour) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', file.name.replace(/\.[^/.]+$/, ''))
    const res = await fetch(`/api/tours/${tour._id}/scenes`, { method: 'POST', body: fd })
    const scene = await res.json()
    setUploading(false)
    if (res.ok) {
      const newScene: SceneDoc = { ...scene, hotspots: [] }
      setTour({ ...tour, scenes: [...tour.scenes, newScene] })
      setCurrentScene(newScene)
    } else {
      alert(scene.error ?? 'Upload failed')
    }
  }

  async function saveHotspots() {
    if (!currentScene) return
    setSaving(true)
    await fetch(`/api/scenes/${currentScene._id}/hotspots`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotspots }),
    })
    setSaving(false)
    markSaved()
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-white/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-white font-semibold text-sm">{tour.title}</h2>
        <p className="text-gray-500 text-xs mt-0.5">{tour.scenes.length} scene{tour.scenes.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Scene list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tour.scenes.map((scene) => (
          <button
            key={scene._id}
            onClick={() => setCurrentScene(scene)}
            className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
              scene._id === currentScene?._id
                ? 'bg-blue-600/30 border border-blue-500/50'
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="w-14 h-9 rounded overflow-hidden flex-shrink-0 bg-gray-800">
              <img src={scene.preview} alt={scene.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{scene.name}</p>
              <p className="text-gray-500 text-xs">
                {scene.hotspots?.length ?? 0} hotspot{(scene.hotspots?.length ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Upload + Save */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors"
        >
          <Upload size={14} />
          {uploading ? 'Uploading…' : 'Add Scene'}
        </button>

        {isDirty && (
          <button
            onClick={saveHotspots}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm py-2 rounded-lg transition-colors"
          >
            <Check size={14} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  )
}
