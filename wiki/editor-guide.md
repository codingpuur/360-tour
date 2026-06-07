# Editor Guide

_Last updated: 2026-06-07 — Phase 3 complete_

## Editor Layout

Three-pane layout in `app/(admin)/editor/[tourId]/`:

```
┌──────────────┬────────────────────────────┐
│ SceneManager │      HotspotTools          │
│  (left 52px) │    (360° canvas + tools)   │
│              │                            │
│  Scene list  │  [View] [+Nav] [+Info]     │
│  Upload btn  │                            │
│  Save btn    │   ← panorama sphere →      │
│              │                            │
└──────────────┴────────────────────────────┘
```

The page (`EditorPage`) is a Server Component that fetches the full tour from DB. It passes data to `EditorClient` (a `'use client'` wrapper) which hydrates the Zustand store.

---

## Zustand Editor Store (`store/editorStore.ts`)

Single source of truth for all editor state. All editor components read from and write to this store.

| State field | Type | Purpose |
|---|---|---|
| `tour` | `TourDoc \| null` | Full tour with all scenes |
| `currentScene` | `SceneDoc \| null` | Scene currently shown in the canvas |
| `hotspots` | `HotspotDoc[]` | Hotspots for current scene (local, unsaved) |
| `mode` | `EditorMode` | Current tool mode |
| `pendingHotspot` | `Partial<HotspotDoc> \| null` | Hotspot being placed (has position, awaiting form fill) |
| `selectedHotspot` | `HotspotDoc \| null` | Hotspot selected for editing |
| `isDirty` | `boolean` | Whether hotspots have unsaved changes |

`EditorMode` values: `'view' | 'place-navigation' | 'place-info' | 'drag-hotspot'`

---

## Click-to-Place Hotspot Flow

1. **User clicks `+ Nav` or `+ Info`** in the toolbar → `setMode('place-navigation')` or `setMode('place-info')`.
2. **A hint** appears: "Click anywhere in the scene to place hotspot".
3. **User clicks the sphere.** Since `editorMode=true`, `PanoSphere` calls `onSphereClick(lonLat)` after verifying the pointer moved less than 5px (not a drag).
4. **`HotspotTools.handleSphereClick(lonLat)`** fires:
   - Calls `setPendingHotspot({ type, position: lonLat, sceneId })`.
   - Opens `<HotspotForm>` modal.
5. **User fills in the form** (label, target scene or info content, color).
6. **On "Add Hotspot":** `addHotspot(newHotspot)` adds to the store, `setPendingHotspot(null)`, `setMode('view')`.
7. **The sprite immediately appears** on the sphere — store update triggers re-render of `HotspotTools` → `PanoSphere` → `Hotspot`.
8. **On "Save Changes"** (green button in SceneManager): `PUT /api/scenes/[id]/hotspots` with all current hotspots. `markSaved()` clears `isDirty`.

---

## Raycast-to-Lon/Lat (click-to-place math)

When the user clicks the sphere:

```
PointerEvent (clientX, clientY)
  → normalize to NDC coordinates for the canvas
  → THREE.Raycaster.setFromCamera(ndc, camera)
  → raycaster.intersectObject(sphere)
  → intersects[0].point  (THREE.Vector3 on sphere surface)
  → vector3ToLonLat(point)  → { lon, lat }
```

`THREE.Raycaster` automatically accounts for the sphere's `scale.x = -1` world matrix — no special handling needed.

---

## SceneManager

- Displays a list of scenes with thumbnail + name + hotspot count.
- Click a scene → `setCurrentScene(scene)` → canvas shows that scene, hotspots list updates.
- "Add Scene" button → file input → `POST /api/tours/[id]/scenes` with FormData.
- "Save Changes" button appears only when `isDirty === true`.

---

## Floorplan Editor (`components/editor/FloorplanEditor.tsx`)

- Upload a floorplan image → `POST /api/upload` with `type=floorplan`.
- Scene chips in a left sidebar can be dragged onto the floorplan image.
- On drop: `x = (e.clientX - rect.left) / rect.width`, `y = (e.clientY - rect.top) / rect.height` — normalized 0–1 coordinates.
- Click an existing marker → removes it.
- Changes are persisted via `PUT /api/tours/[id]` with updated `floorplan.markers`.

---

## Session Protection

`app/(admin)/layout.tsx` is a Server Component that calls `getServerSession(authOptions)`. If no session exists, it calls `redirect('/login')`. This protects all `/admin/*` routes without any client-side logic.
