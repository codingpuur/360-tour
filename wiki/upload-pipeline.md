# Upload Pipeline

_Last updated: 2026-06-07 — Phase 2 complete_

## Overview

```
Admin browser
  → multipart/form-data POST /api/upload
  → lib/upload.ts
      → sharp: validate 2:1 ratio
      → sharp: generate 1024px JPEG preview
      → Cloudinary: upload full-res + preview in parallel
      → return { panoramaUrl, previewUrl }
  → stored on Scene document
```

---

## Validation: `validateEquirectangular(buffer)`

Reads image dimensions with `sharp(buffer).metadata()`. Checks that `width / height` is between 1.9 and 2.1 (2:1 ratio with 5% tolerance).

If invalid: throws `UploadError` which the API route catches and returns as `422 { error: "..." }`.

---

## Preview Generation

```ts
const previewBuffer = await sharp(buffer)
  .resize({ width: 1024 })
  .jpeg({ quality: 70 })
  .toBuffer()
```

The preview caps at 1024px wide and uses JPEG quality 70. This produces ~50-100KB files suitable for the progressive-loading first paint.

---

## Cloudinary Upload

Both full-res and preview are uploaded via `cloudinary.uploader.upload_stream` (stream API, not file path). The Node.js `Readable.from(buffer).pipe(uploadStream)` pattern is used.

Both uploads happen in `Promise.all` (parallel) to minimize latency.

Folder structure in Cloudinary:
- Panoramas: `360-tour-platform/panoramas/{filename}-full`
- Previews:   `360-tour-platform/panoramas/{filename}-preview`
- Floorplans: `360-tour-platform/floorplans/{filename}`

---

## API Route (`app/api/upload/route.ts`)

Two required exports to enable Node.js runtime (needed for `sharp` and `cloudinary`):
```ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

Uses `request.formData()` — Next.js App Router handles multipart natively, no `multer` needed.

`type` field in FormData: `'panorama'` (default) or `'floorplan'`.

---

## Env Vars Required

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Set in `.env.local` for dev, in Vercel environment variables for production.
