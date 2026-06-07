# Troubleshooting

_Last updated: 2026-06-07_

## Three.js / Next.js SSR Error

**Symptom:** `ReferenceError: window is not defined` or `WebGL is not available` on the server.

**Cause:** Three.js and `@react-three/fiber` use browser APIs that don't exist in Node.js (SSR).

**Fix:** Import `PanoViewer` (and anything that imports Three.js) via `dynamic` with `ssr: false`:
```ts
import dynamic from 'next/dynamic'
const PanoViewer = dynamic(
  () => import('@/components/viewer/PanoViewer').then(m => m.PanoViewer),
  { ssr: false, loading: () => <div className="w-full h-full bg-black" /> }
)
```

**Rule:** Any file that imports `three`, `@react-three/fiber`, or `@react-three/drei` must either be `'use client'` AND dynamically imported with `ssr:false`, OR be a child component of such a component.

---

## Panorama Appears Inside-Out / Mirrored

**Cause:** The `scale.x = -1` flip is missing, or `side: THREE.BackSide` was used without the flip.

**Fix:** In `PanoSphere.tsx`, the sphere mesh must have:
```ts
mesh.scale.x = -1          // inside-out flip
// Material:
side: THREE.FrontSide      // after flip, front faces point inward
```

Do NOT use `side: THREE.BackSide` — this approach is inconsistent with the rest of the codebase.

---

## Hotspots Appear at Wrong Position

**Cause:** The `+180` offset in the `theta` formula in `lonlat.ts` was changed, or `lon/lat` was passed in the wrong order.

**Verify:** A hotspot at `{lon: 0, lat: 0}` must appear at the exact center of the equirectangular panorama image. Use a test panorama with a clearly identifiable center landmark.

**Fix:** In `lib/three/lonlat.ts`, the formula is:
```ts
const theta = (lon + 180) * DEG  // +180 so lon=0 = image center
```

---

## Mongoose "Cannot Overwrite Model" Error

**Cause:** Next.js dev hot-reload re-runs `mongoose.model('Tour', schema)` when the module is re-imported.

**Fix:** All Mongoose models use:
```ts
export const Tour = mongoose.models.Tour ?? mongoose.model<ITour>('Tour', TourSchema)
```

---

## Multiple MongoDB Connections in Dev

**Cause:** Next.js hot-reload calls `connectDB()` many times, creating a new connection each time.

**Fix:** The `(global as any).__mongooseCache` singleton in `lib/db.ts` ensures only one connection is created.

---

## Canvas Flash When Navigating Scenes

**Cause:** The `<Canvas>` was unmounted and remounted on scene change, destroying and recreating the WebGL context.

**Fix:** Keep one `<Canvas>` mounted for the lifetime of the tour. Only swap the `scene` prop on `PanoSphere`. The fade transition (CSS opacity on a `<div>` over the Canvas) covers the texture swap.

---

## Hotspot Sprites Flickering (Z-Fighting)

**Cause:** Multiple sprites at nearly the same depth in the scene.

**Fix:** 
- Place hotspot sprites at radius 490, sphere at 500 (slight offset inward).
- Set `depthWrite: false` on `SpriteMaterial`.

---

## Upload Fails on Large Panoramas

**Cause:** Next.js default body size limit (4MB). Large panoramas can be 10–30MB.

**Fix:** Add to the upload route file:
```ts
export const config = { api: { bodyParser: { sizeLimit: '50mb' } } }
```
Or in App Router: the `formData()` approach bypasses this limit — the `runtime = 'nodejs'` export handles it.

---

## `next-auth` Session Not Persisting in Dev

**Cause:** `NEXTAUTH_SECRET` is not set in `.env.local`.

**Fix:** Generate a secret and add it: `NEXTAUTH_SECRET=$(openssl rand -base64 32)`
