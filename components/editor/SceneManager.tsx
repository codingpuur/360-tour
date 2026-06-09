'use client'

import { useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Upload, Check, Loader2, GripVertical, Trash2, Pencil } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { SceneDoc, HotspotDoc } from '@/types'

// ── EXIF helper ───────────────────────────────────────────────────────────────
async function getFileTimestamp(file: File): Promise<number> {
  try {
    const exifr = (await import('exifr')).default
    const tags  = await exifr.parse(file, ['DateTimeOriginal', 'DateTime'])
    const dt    = tags?.DateTimeOriginal ?? tags?.DateTime
    if (dt instanceof Date && !isNaN(dt.getTime())) return dt.getTime()
  } catch {}
  return file.lastModified
}

// ── Single sortable scene row ─────────────────────────────────────────────────
function SceneRow({
  scene,
  isActive,
  onSelect,
  onDelete,
  onRename,
  deleteConfirmId,
  setDeleteConfirmId,
}: {
  scene: SceneDoc
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (name: string) => void
  deleteConfirmId: string | null
  setDeleteConfirmId: (id: string | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: scene._id })

  const [editing,   setEditing]   = useState(false)
  const [draftName, setDraftName] = useState(scene.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  function startEdit() {
    setDraftName(scene.name)
    setEditing(true)
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 0)
  }

  function commitEdit() {
    const trimmed = draftName.trim()
    if (trimmed && trimmed !== scene.name) onRename(trimmed)
    setEditing(false)
  }

  const confirmingDelete = deleteConfirmId === scene._id

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-1 rounded-lg border transition-colors ${
        isActive ? 'bg-blue-600/30 border-blue-500/50' : 'border-transparent hover:bg-white/5'
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="pl-1.5 py-2 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        tabIndex={-1}
      >
        <GripVertical size={13} />
      </button>

      {/* Thumbnail — click to select */}
      <button onClick={onSelect} className="flex-shrink-0 py-2">
        <div className="w-12 h-8 rounded overflow-hidden bg-gray-800">
          {scene.preview
            ? <img src={scene.preview} alt={scene.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gray-700" />
          }
        </div>
      </button>

      {/* Name (editable) + hotspot count */}
      <div className="flex-1 min-w-0 py-2">
        {editing ? (
          <input
            ref={inputRef}
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
              if (e.key === 'Escape') { setEditing(false) }
            }}
            className="w-full bg-gray-700 text-white text-xs font-medium px-1.5 py-0.5 rounded outline-none focus:ring-1 focus:ring-blue-500 border border-blue-500/50"
          />
        ) : (
          <button onClick={onSelect} className="w-full text-left">
            <p className="text-white text-xs font-medium truncate">{scene.name}</p>
          </button>
        )}
        <p className="text-gray-500 text-xs mt-0.5">
          {scene.hotspots?.length ?? 0} hotspot{(scene.hotspots?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Action icons */}
      <div className="flex-shrink-0 pr-1.5 flex items-center gap-0.5">
        {confirmingDelete ? (
          <>
            <button
              onClick={onDelete}
              className="text-xs text-red-400 hover:text-red-300 font-medium px-1.5 py-0.5 rounded bg-red-500/10"
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="text-xs text-gray-500 hover:text-gray-300 px-1 py-0.5"
            >
              ✕
            </button>
          </>
        ) : (
          <>
            <button
              onClick={startEdit}
              className="text-gray-600 hover:text-gray-300 transition-colors p-1 rounded"
              title="Rename"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={() => setDeleteConfirmId(scene._id)}
              className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main SceneManager ─────────────────────────────────────────────────────────
export function SceneManager() {
  const {
    tour, currentScene, setCurrentScene, hotspots,
    setTour, isDirty, removeScene, reorderScenes, renameScene, syncSceneHotspots,
  } = useEditorStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving,           setSaving]           = useState(false)
  const [progress,         setProgress]         = useState<{ current: number; total: number } | null>(null)
  const [deleteConfirmId,  setDeleteConfirmId]  = useState<string | null>(null)
  const [deletingId,       setDeletingId]       = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 6 },
  }))

  if (!tour) return null

  // ── Upload ──────────────────────────────────────────────────────────────────
  async function uploadOne(file: File, name: string): Promise<SceneDoc | null> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', name)
    const res   = await fetch(`/api/tours/${tour!._id}/scenes`, { method: 'POST', body: fd })
    const scene = await res.json()
    if (!res.ok) { alert(scene.error ?? 'Upload failed'); return null }
    return scene as SceneDoc
  }

  async function handleFiles(fileList: FileList) {
    if (fileList.length === 0) return

    const items = await Promise.all(
      Array.from(fileList).map(async (file) => ({
        file,
        ts: await getFileTimestamp(file),
      }))
    )
    items.sort((a, b) => a.ts - b.ts)

    let lastScene: SceneDoc | null = null

    for (let i = 0; i < items.length; i++) {
      setProgress({ current: i + 1, total: items.length })
      // Always read latest tour state from store (updated after each upload)
      const latestTour = useEditorStore.getState().tour!
      const name  = `Photo ${latestTour.scenes.length + 1}`
      const scene = await uploadOne(items[i].file, name)
      if (scene) {
        const newScene: SceneDoc = { ...scene, hotspots: [] }
        const fresh = useEditorStore.getState().tour!
        setTour({ ...fresh, scenes: [...fresh.scenes, newScene] })
        lastScene = newScene
      }
    }

    setProgress(null)
    if (lastScene) setCurrentScene(lastScene)
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(sceneId: string) {
    setDeleteConfirmId(null)
    setDeletingId(sceneId)
    await fetch(`/api/scenes/${sceneId}`, { method: 'DELETE' })
    removeScene(sceneId)
    setDeletingId(null)
  }

  // ── Drag end ────────────────────────────────────────────────────────────────
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !tour) return

    const oldIndex = tour.scenes.findIndex(s => s._id === active.id)
    const newIndex = tour.scenes.findIndex(s => s._id === over.id)
    const reordered = arrayMove(tour.scenes, oldIndex, newIndex)

    reorderScenes(reordered)

    await fetch(`/api/tours/${tour._id}/scenes/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneIds: reordered.map(s => s._id) }),
    })
  }

  // ── Rename ──────────────────────────────────────────────────────────────────
  async function handleRename(sceneId: string, name: string) {
    renameScene(sceneId, name)
    await fetch(`/api/scenes/${sceneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }

  // ── Save hotspots ───────────────────────────────────────────────────────────
  async function saveHotspots() {
    if (!currentScene) return
    setSaving(true)
    const res  = await fetch(`/api/scenes/${currentScene._id}/hotspots`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotspots }),
    })
    const saved = await res.json()
    // Sync DB-returned hotspots (real IDs) back into store so scene-switching doesn't lose them
    if (Array.isArray(saved)) {
      syncSceneHotspots(currentScene._id, saved as HotspotDoc[])
    }
    setSaving(false)
  }

  const uploading = progress !== null

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-white/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="text-white font-semibold text-sm">{tour.title}</h2>
        <p className="text-gray-500 text-xs mt-0.5">
          {tour.scenes.length} scene{tour.scenes.length !== 1 ? 's' : ''}
          {tour.scenes.length > 1 && (
            <span className="ml-1 text-gray-600">· drag to reorder</span>
          )}
        </p>
      </div>

      {/* Scene list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tour.scenes.map(s => s._id)}
            strategy={verticalListSortingStrategy}
          >
            {tour.scenes.map(scene => (
              <SceneRow
                key={scene._id}
                scene={scene}
                isActive={scene._id === currentScene?._id}
                onSelect={() => setCurrentScene(scene)}
                onDelete={() => handleDelete(scene._id)}
                onRename={(name) => handleRename(scene._id, name)}
                deleteConfirmId={deletingId === scene._id ? null : deleteConfirmId}
                setDeleteConfirmId={setDeleteConfirmId}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Upload + Save */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-60 text-white text-sm py-2 rounded-lg transition-colors"
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Uploading {progress!.current} / {progress!.total}…
            </>
          ) : (
            <>
              <Upload size={14} />
              Add Scenes
            </>
          )}
        </button>

        {uploading && (
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(progress!.current / progress!.total) * 100}%` }}
            />
          </div>
        )}

        {isDirty && !uploading && (
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
