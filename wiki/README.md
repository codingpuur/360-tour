# Wiki — 360° Virtual Tour Platform

_This index is always current. Update it whenever a wiki file is added or changed._

## Current Phase Status

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Viewer core (sphere, drag, hotspots from JSON) | ✅ Complete |
| Phase 2 | Editor + hotspots (auth, upload, CRUD, click-to-place) | ✅ Complete |
| Phase 3 | Editor UI (Zustand, HotspotTools, HotspotForm) | ✅ Complete |
| Phase 4 | Floorplan + sharing (embed, QR, OG tags) | ✅ Complete |
| Phase 5 | Polish (auto-rotate, VR, analytics, tiling) | ⬜ Deferred |

## Wiki Files

| File | What it covers | Status |
|---|---|---|
| [architecture.md](architecture.md) | Tech stack, all npm packages, key architectural decisions | ✅ Current |
| [data-models.md](data-models.md) | Mongoose schemas for Tour, Scene, Hotspot with field explanations | ✅ Current |
| [api-reference.md](api-reference.md) | Every route handler: method, path, auth required, request/response | ✅ Current |
| [viewer-engine.md](viewer-engine.md) | Three.js sphere setup, coordinate system, hotspot rendering, fade transitions | ✅ Current |
| [editor-guide.md](editor-guide.md) | Editor UI, Zustand store, click-to-place flow, drag-to-adjust | ✅ Current |
| [upload-pipeline.md](upload-pipeline.md) | sharp validation, Cloudinary upload steps, URL storage | ✅ Current |
| [auth.md](auth.md) | NextAuth setup, session strategy, protected route pattern | ✅ Current |
| [deployment.md](deployment.md) | Env vars, Vercel config, Cloudinary config, admin password setup | ✅ Current |
| [phases.md](phases.md) | Build roadmap with checkbox status for each milestone | ✅ Current |
| [troubleshooting.md](troubleshooting.md) | Known gotchas: Three.js SSR, inside-out sphere, z-fighting, hot-reload | ✅ Current |

## Quick Start for New Conversations

1. Fill in `.env.local` (MongoDB URI, NextAuth secret, admin credentials, Cloudinary keys)
2. Generate admin password hash: `PLAIN_PASSWORD=yourpass npx tsx scripts/create-admin-hash.ts`
3. `npm run dev` → visit `http://localhost:3000` (redirects to `/admin/dashboard`)
4. Log in, create a tour, upload panoramas, place hotspots, publish
5. Demo viewer: `http://localhost:3000/tour/demo` (uses static fixture, no DB needed)

## Key Files at a Glance

| What you're looking for | File |
|---|---|
| The coordinate math | `lib/three/lonlat.ts` |
| The panorama sphere | `components/viewer/PanoSphere.tsx` |
| Hotspot raycast | `lib/three/raycast.ts` |
| Editor global state | `store/editorStore.ts` |
| Click-to-place tool | `components/editor/HotspotTools.tsx` |
| Image upload + validation | `lib/upload.ts` |
| DB connection | `lib/db.ts` |
| Auth config | `lib/auth.ts` |
| Public tour JSON | `app/api/public/[slug]/route.ts` |
