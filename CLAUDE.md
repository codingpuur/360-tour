# CLAUDE.md — Agent Rules for 360-Tour Platform

## MANDATORY: Wiki Update Rule

After EVERY code change — no exceptions — update the corresponding wiki file.

| Changed area | Update this wiki file |
|---|---|
| `models/` | `wiki/data-models.md` |
| `app/api/` | `wiki/api-reference.md` |
| `lib/three/`, `components/viewer/` | `wiki/viewer-engine.md` |
| `components/editor/` | `wiki/editor-guide.md` |
| `lib/upload.ts`, `app/api/upload/` | `wiki/upload-pipeline.md` |
| `lib/auth.ts`, `app/api/auth/` | `wiki/auth.md` |
| New npm package added | `wiki/architecture.md` + `wiki/deployment.md` |
| Phase milestone completed | `wiki/phases.md` |

`wiki/README.md` must always list ALL wiki files with one-line descriptions and current phase status.

**The wiki must reflect the CURRENT state of the codebase at all times. Stale wiki = bug.**

---

## Project Conventions

- Named exports everywhere except Next.js page/layout files (which use `export default`).
- All API routes call `getServerSession(authOptions)` and return 401 before any DB operation.
- All Three.js / r3f code lives in `lib/three/` or `components/viewer/` — never inline in pages.
- Hotspot positions are always stored and passed as `{ lon: number, lat: number }` (degrees). Never pixel coordinates.
- `'use client'` directive on every file that uses React hooks, Three.js, or browser APIs.
- `PanoViewer` must be imported via `dynamic(..., { ssr: false })` — Three.js + WebGL break SSR.
- The panorama sphere uses `scale.x = -1` (inside-out flip) + `side: THREE.FrontSide`. Do not change this.
- Mongoose models use the `mongoose.models.X ?? mongoose.model('X', schema)` pattern to survive Next.js hot-reload.
- MongoDB connection uses the `(global as any).__mongooseCache` singleton pattern — never call `mongoose.connect()` directly in route handlers.
- The `<Canvas>` component is never unmounted during scene navigation (destroys WebGL context). Scene changes swap only the texture.
- Fade transitions are CSS (`transition-opacity`) on a div over the Canvas, not Three.js material opacity.

---

## Folder Map (always current)

```
app/
  (admin)/          ← protected admin routes (layout checks session)
    dashboard/      ← tour list + create/delete
    editor/[tourId] ← scene manager + hotspot canvas + settings
  tour/[slug]/      ← public viewer
  embed/[slug]/     ← iframe-safe viewer (no chrome)
  api/              ← all route handlers (see wiki/api-reference.md)

components/
  viewer/           ← PanoSphere, PanoViewer, Hotspot*, Floorplan, SceneRail
  editor/           ← SceneManager, HotspotTools, HotspotForm, FloorplanEditor
  share/            ← EmbedPanel
  ui/               ← reusable primitives (Button, Modal, Spinner)

lib/
  three/            ← lonlat.ts, sphere.ts, raycast.ts
  db.ts             ← connectDB() singleton
  auth.ts           ← NextAuth authOptions
  upload.ts         ← sharp validation + Cloudinary upload
  fixtures/         ← demo-tour.json (Phase 1 static test data)

models/             ← Tour.ts, Scene.ts, Hotspot.ts (Mongoose)
store/              ← editorStore.ts (Zustand)
types/              ← index.ts (shared TypeScript interfaces)
wiki/               ← always-current codebase documentation
scripts/            ← create-admin-hash.ts
```
