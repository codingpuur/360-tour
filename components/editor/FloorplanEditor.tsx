'use client'

import { useRef, useState } from 'react'
import { Upload, Save } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'

export function FloorplanEditor() {
  const { tour, updateTour } = useEditorStore()
  const fileRef   = useRef<HTMLInputElement>(null)
  const imgRef    = useRef<HTMLDivElement>(null)
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [dragging,  setDragging]  = useState<string | null>(null)

  if (!tour) return null

  const floorplan = tour.floorplan

  async function handleUpload(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'floorplan')
    const res  = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (res.ok) {
      updateTour({ floorplan: { image: data.url, markers: floorplan?.markers ?? [] } })
    } else {
      alert(data.error ?? 'Upload failed')
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDropMarker(e: React.DragEvent, sceneId: string) {
    if (!imgRef.current || !floorplan) return
    e.preventDefault()
    const rect = imgRef.current.getBoundingClientRect()
    const x    = (e.clientX - rect.left) / rect.width
    const y    = (e.clientY - rect.top)  / rect.height
    const markers = [...(floorplan.markers ?? []).filter(m => m.sceneId !== sceneId), { sceneId, x, y }]
    updateTour({ floorplan: { ...floorplan, markers } })
  }

  function removeMarker(sceneId: string) {
    if (!floorplan) return
    updateTour({ floorplan: { ...floorplan, markers: floorplan.markers.filter(m => m.sceneId !== sceneId) } })
  }

  async function saveFloorplan() {
    if (!tour) return
    setSaving(true)
    await fetch(`/api/tours/${tour._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ floorplan: tour.floorplan }),
    })
    setSaving(false)
  }

  const placedSceneIds = new Set(floorplan?.markers.map(m => m.sceneId) ?? [])

  return (
    <div className="flex gap-4 p-4">
      {/* Left: scene chips to drag onto plan */}
      <div className="w-40 flex-shrink-0">
        <p className="text-gray-400 text-xs mb-2">Drag scenes onto the map</p>
        <div className="space-y-1">
          {tour.scenes.map(scene => (
            <div
              key={scene._id}
              draggable
              onDragStart={e => { setDragging(scene._id); e.dataTransfer.setData('sceneId', scene._id) }}
              onDragEnd={() => setDragging(null)}
              className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing border transition-colors ${
                placedSceneIds.has(scene._id)
                  ? 'border-green-500/50 bg-green-500/10 text-green-300'
                  : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              <img src={scene.preview} alt={scene.name} className="w-8 h-5 rounded object-cover flex-shrink-0" />
              <span className="truncate">{scene.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: floorplan canvas */}
      <div className="flex-1">
        {!floorplan?.image ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center h-64 cursor-pointer hover:border-white/40 transition-colors"
          >
            <Upload size={24} className="text-gray-500 mb-2" />
            <p className="text-gray-400 text-sm">{uploading ? 'Uploading…' : 'Upload floorplan image'}</p>
          </div>
        ) : (
          <div
            ref={imgRef}
            className="relative rounded-xl overflow-hidden border border-white/10"
            onDragOver={handleDragOver}
            onDrop={e => {
              const sceneId = e.dataTransfer.getData('sceneId')
              if (sceneId) handleDropMarker(e, sceneId)
            }}
          >
            <img
              src={floorplan.image}
              alt="Floorplan"
              className="w-full h-auto object-contain"
              draggable={false}
            />
            {floorplan.markers.map(marker => {
              const scene = tour.scenes.find(s => s._id === marker.sceneId)
              return (
                <button
                  key={marker.sceneId}
                  onClick={() => removeMarker(marker.sceneId)}
                  title={`${scene?.name ?? marker.sceneId} — click to remove`}
                  className="absolute w-4 h-4 rounded-full bg-blue-400 border-2 border-white -translate-x-1/2 -translate-y-1/2 hover:bg-red-400 transition-colors"
                  style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
                />
              )
            })}
          </div>
        )}
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {floorplan?.image ? '↺ Replace floorplan' : ''}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />

      {floorplan?.image && (
        <div className="px-4 pb-4 flex justify-end">
          <button
            onClick={saveFloorplan}
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Map'}
          </button>
        </div>
      )}
    </div>
  )
}
