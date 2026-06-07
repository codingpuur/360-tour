# API Reference

_Last updated: 2026-06-07 — Phase 2 complete_

All API routes live under `app/api/`. Every protected route calls `getServerSession(authOptions)` and returns `401` before any DB operation.

---

## Auth

### `POST /api/auth/[...nextauth]`
NextAuth.js handler. Handles login, logout, session tokens.
- Login body: `{ email, password }`
- Uses `CredentialsProvider` with bcrypt hash comparison against `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` env vars.
- Session strategy: JWT.
- Sign-in page: `/login`

---

## Tours

### `GET /api/tours`
**Auth required.** Returns all tours sorted by `createdAt` desc. Used by the admin dashboard.

Response: `ITour[]` (lean, no scenes/hotspots embedded)

### `POST /api/tours`
**Auth required.** Create a new tour.

Body: `{ title, description?, coverImage?, settings? }`

Behavior: auto-generates a unique `slug` from `title` using `slugify`. If slug already exists, appends `-1`, `-2`, etc.

Response: `ITour` (201)

### `GET /api/tours/[id]`
**Auth required.** Get a single tour by MongoDB ID.

### `PUT /api/tours/[id]`
**Auth required.** Update tour fields. Body is partial — only provided fields are updated.

Common use: toggle `isPublished`, update `settings`, save `floorplan`.

### `DELETE /api/tours/[id]`
**Auth required.** Delete a tour and cascade-delete all its scenes and hotspots.

---

## Scenes

### `POST /api/tours/[id]/scenes`
**Auth required.** Add a scene to a tour by uploading a panorama image.

Body: `multipart/form-data` with fields:
- `file` — the panorama image (must be ~2:1 aspect ratio)
- `name` — scene display name

Behavior:
1. Validates 2:1 aspect ratio with `sharp`.
2. Uploads full-res + 1024px preview to Cloudinary.
3. Creates `Scene` document.
4. Sets `tour.startSceneId` if the tour has no start scene yet.
5. Sets `tour.coverImage` to the preview URL.

Response: `IScene` (201)

### `PUT /api/scenes/[id]`
**Auth required.** Update scene fields (name, initialView, order, etc.).

### `DELETE /api/scenes/[id]`
**Auth required.** Delete a scene and all its hotspots.

---

## Hotspots

### `GET /api/scenes/[id]/hotspots`
**Auth required.** Get all hotspots for a scene.

### `PUT /api/scenes/[id]/hotspots`
**Auth required.** Bulk replace all hotspots for a scene.

Body: `{ hotspots: HotspotDoc[] }`

Behavior: `deleteMany({ sceneId })` then `insertMany(hotspots)`. Clears and replaces the full set — no diffing.

Response: inserted hotspot array

---

## Upload

### `POST /api/upload`
**Auth required.** General-purpose upload endpoint.

Body: `multipart/form-data` with fields:
- `file` — image file
- `type` — `'panorama'` (default) or `'floorplan'`

For `panorama`: validates 2:1 ratio, uploads full + preview, returns `{ panoramaUrl, previewUrl }`.

For `floorplan`: uploads image as-is, returns `{ url }`.

Errors: `422` with message if aspect ratio validation fails.

Requires `export const runtime = 'nodejs'` (Node.js APIs used by `sharp` and `cloudinary`).

---

## Public (no auth)

### `GET /api/public/[slug]`
**No auth.** Returns full tour JSON for a published tour.

Returns `404` if tour not found or `isPublished: false`.

Response: Tour document with `scenes` array where each scene has its `hotspots` array embedded inline. This is the only response shape consumed by the public viewer and embed viewer.
