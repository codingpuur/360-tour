import { create } from 'zustand'
import type { TourDoc, SceneDoc, HotspotDoc, LonLat } from '@/types'

export type EditorMode = 'view' | 'place-navigation' | 'place-info' | 'drag-hotspot'

interface EditorStore {
  tour:            TourDoc | null
  currentScene:    SceneDoc | null
  hotspots:        HotspotDoc[]
  mode:            EditorMode
  pendingHotspot:  Partial<HotspotDoc> | null
  selectedHotspot: HotspotDoc | null
  isDirty:         boolean

  setTour:           (tour: TourDoc) => void
  setCurrentScene:   (scene: SceneDoc) => void
  setMode:           (mode: EditorMode) => void
  addHotspot:        (h: HotspotDoc) => void
  updateHotspot:     (id: string, patch: Partial<HotspotDoc>) => void
  removeHotspot:     (id: string) => void
  setPendingHotspot: (h: Partial<HotspotDoc> | null) => void
  setSelectedHotspot:(h: HotspotDoc | null) => void
  markSaved:         () => void
  updateScene:       (patch: Partial<SceneDoc>) => void
  updateTour:        (patch: Partial<TourDoc>) => void
  removeScene:        (sceneId: string) => void
  reorderScenes:      (scenes: SceneDoc[]) => void
  renameScene:        (sceneId: string, name: string) => void
  syncSceneHotspots:  (sceneId: string, hotspots: HotspotDoc[]) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  tour:            null,
  currentScene:    null,
  hotspots:        [],
  mode:            'view',
  pendingHotspot:  null,
  selectedHotspot: null,
  isDirty:         false,

  setTour: (tour) => set({ tour }),

  setCurrentScene: (scene) =>
    set({ currentScene: scene, hotspots: scene.hotspots ?? [], isDirty: false }),

  setMode: (mode) => set({ mode }),

  addHotspot: (h) =>
    set(s => ({ hotspots: [...s.hotspots, h], isDirty: true })),

  updateHotspot: (id, patch) =>
    set(s => ({
      hotspots: s.hotspots.map(h => h._id === id ? { ...h, ...patch } : h),
      isDirty:  true,
    })),

  removeHotspot: (id) =>
    set(s => ({
      hotspots: s.hotspots.filter(h => h._id !== id),
      isDirty:  true,
    })),

  setPendingHotspot:  (h) => set({ pendingHotspot: h }),
  setSelectedHotspot: (h) => set({ selectedHotspot: h }),
  markSaved:          ()  => set({ isDirty: false }),

  updateScene: (patch) =>
    set(s => ({
      currentScene: s.currentScene ? { ...s.currentScene, ...patch } : null,
      isDirty: true,
    })),

  updateTour: (patch) =>
    set(s => ({
      tour: s.tour ? { ...s.tour, ...patch } : null,
      isDirty: true,
    })),

  removeScene: (sceneId) =>
    set(s => {
      const scenes = s.tour ? s.tour.scenes.filter(sc => sc._id !== sceneId) : []
      const currentScene =
        s.currentScene?._id === sceneId ? (scenes[0] ?? null) : s.currentScene
      return {
        tour: s.tour ? { ...s.tour, scenes } : null,
        currentScene,
        hotspots: currentScene?._id === s.currentScene?._id ? s.hotspots : (currentScene?.hotspots ?? []),
      }
    }),

  reorderScenes: (scenes) =>
    set(s => ({
      tour: s.tour ? { ...s.tour, scenes } : null,
    })),

  renameScene: (sceneId, name) =>
    set(s => ({
      tour: s.tour
        ? { ...s.tour, scenes: s.tour.scenes.map(sc => sc._id === sceneId ? { ...sc, name } : sc) }
        : null,
      currentScene: s.currentScene?._id === sceneId
        ? { ...s.currentScene, name }
        : s.currentScene,
    })),

  // Called after bulk-save so switching scenes doesn't lose unsaved state
  syncSceneHotspots: (sceneId, hotspots) =>
    set(s => ({
      hotspots:     s.currentScene?._id === sceneId ? hotspots : s.hotspots,
      tour: s.tour
        ? { ...s.tour, scenes: s.tour.scenes.map(sc => sc._id === sceneId ? { ...sc, hotspots } : sc) }
        : null,
      isDirty: false,
    })),
}))
