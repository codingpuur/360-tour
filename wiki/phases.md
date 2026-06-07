# Build Phases — Current Status

_Last updated: 2026-06-07_

## Phase 1 — Viewer Core ✅ COMPLETE

- [x] Next.js 14 project scaffolded with TypeScript + Tailwind
- [x] All npm packages installed
- [x] Folder structure created
- [x] `.env.local` template created
- [x] `next.config.mjs` updated (Cloudinary images, embed headers)
- [x] `CLAUDE.md` + wiki system created
- [x] `types/index.ts` — shared TypeScript interfaces (LonLat, HotspotDoc, SceneDoc, TourDoc)
- [x] `lib/three/lonlat.ts` — lon/lat ↔ Vector3 math
- [x] `lib/three/sphere.ts` — inside-out sphere geometry helper
- [x] `lib/three/raycast.ts` — pointer → lon/lat conversion
- [x] `lib/fixtures/demo-tour.json` — static test data (2 scenes, 3 hotspots)
- [x] `components/viewer/PanoSphere.tsx` — r3f sphere with drag/zoom, canvas-level pointer events
- [x] `components/viewer/HotspotSprite.tsx` — single hotspot sprite (canvas-drawn texture, bob animation)
- [x] `components/viewer/Hotspot.tsx` — all hotspots for a scene
- [x] `components/viewer/PanoViewer.tsx` — outer shell with Canvas + DOM overlays + fade transitions
- [x] `components/viewer/SceneRail.tsx` — scene thumbnail strip
- [x] `components/viewer/Floorplan.tsx` — mini-map overlay (DOM, not Three.js)
- [x] `components/viewer/InfoPopup.tsx` — info hotspot popup modal
- [x] `app/tour/[slug]/page.tsx` — public viewer page with OG tags

## Phase 2 — Editor + Hotspots ✅ COMPLETE

- [x] `lib/db.ts` — MongoDB connection singleton
- [x] `lib/auth.ts` — NextAuth config
- [x] `lib/upload.ts` — sharp validation + Cloudinary pipeline
- [x] `models/Tour.ts` — Mongoose schema
- [x] `models/Scene.ts` — Mongoose schema
- [x] `models/Hotspot.ts` — Mongoose schema
- [x] `scripts/create-admin-hash.ts` — bcrypt hash generator
- [x] `app/api/auth/[...nextauth]/route.ts`
- [x] `app/api/tours/route.ts` (GET list, POST create with auto-slug)
- [x] `app/api/tours/[id]/route.ts` (GET, PUT, DELETE with cascade)
- [x] `app/api/tours/[id]/scenes/route.ts` (POST add scene with upload)
- [x] `app/api/scenes/[id]/route.ts` (PUT, DELETE)
- [x] `app/api/scenes/[id]/hotspots/route.ts` (GET, PUT bulk upsert)
- [x] `app/api/upload/route.ts`
- [x] `app/api/public/[slug]/route.ts`
- [x] `app/(admin)/layout.tsx` — session guard (server-side redirect)
- [x] `app/login/page.tsx` — admin login form
- [x] `app/(admin)/dashboard/page.tsx` + `DashboardClient.tsx` — tour list UI

## Phase 3 — Editor UI ✅ COMPLETE

- [x] `store/editorStore.ts` — Zustand editor state
- [x] `components/editor/SceneManager.tsx` — scene list + upload + save
- [x] `components/editor/HotspotTools.tsx` — click-to-place toolbar + canvas
- [x] `components/editor/HotspotForm.tsx` — hotspot details modal
- [x] `app/(admin)/editor/[tourId]/page.tsx` — server component fetches tour
- [x] `app/(admin)/editor/[tourId]/EditorClient.tsx` — hydrates Zustand store

## Phase 4 — Floorplan + Sharing ✅ COMPLETE

- [x] `components/editor/FloorplanEditor.tsx` — drag markers onto plan
- [x] `app/embed/[slug]/page.tsx` — iframe-safe viewer (respects allowEmbed)
- [x] `components/share/EmbedPanel.tsx` — share link + QR + iframe snippet
- [x] OG tags in `app/tour/[slug]/page.tsx` (generateMetadata)

## Phase 5 — Polish (Deferred to Future)

- [ ] Auto-rotate option
- [ ] Compass overlay
- [ ] Keyboard navigation (arrow keys to look around)
- [ ] VR / mobile gyroscope mode
- [ ] View + hotspot-click analytics
- [ ] Multi-resolution tiling for large panoramas

---

## MVP Definition of Done ✅

1. ✅ Create a tour and upload 360° panoramas as scenes.
2. ✅ Click directly in a scene to place navigation points linking scenes with arrival view.
3. ✅ Add info hotspots with text/image/video that open popups.
4. ✅ Upload a floorplan and drag scene markers for map-based navigation.
5. ✅ Publish the tour and share via public link or embed it on another site.
6. ✅ Visitor can open the link and walk through the tour on desktop and mobile.
