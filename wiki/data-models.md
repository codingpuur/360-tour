# Data Models

_Last updated: 2026-06-07 — Phase 2 complete_

Three Mongoose collections. All models use `mongoose.models.X ?? mongoose.model('X', schema)` to survive Next.js hot-reload.

---

## Tour (`models/Tour.ts`)

Top-level document. One per virtual tour.

| Field | Type | Description |
|---|---|---|
| `slug` | String (unique, indexed) | URL-safe identifier. Auto-generated from title via `slugify`. Used in `/tour/[slug]` and `/embed/[slug]` |
| `title` | String (required) | Display name |
| `description` | String | Optional description |
| `coverImage` | String | Cloudinary URL. Auto-set to first scene's preview on scene creation |
| `startSceneId` | ObjectId → Scene | Which scene to show first. Auto-set to first scene uploaded |
| `floorplan.image` | String | Cloudinary URL of the floorplan image |
| `floorplan.markers[]` | Array | `{ sceneId, x, y }` — marker positions as fractions (0–1) of floorplan dimensions |
| `isPublished` | Boolean (default: false) | Controls whether `/api/public/[slug]` returns data |
| `settings.autoRotate` | Boolean | Auto-rotate viewer (not yet implemented in Phase 4) |
| `settings.showCompass` | Boolean | Show compass overlay (not yet implemented in Phase 4) |
| `settings.allowEmbed` | Boolean | Whether `/embed/[slug]` serves the tour or returns 403 |
| `createdAt`, `updatedAt` | Date | Auto-managed by Mongoose `timestamps: true` |

---

## Scene (`models/Scene.ts`)

One 360° panorama image. Belongs to a Tour.

| Field | Type | Description |
|---|---|---|
| `tourId` | ObjectId → Tour (indexed) | Parent tour |
| `name` | String (required) | Display name (e.g. "Living Room") |
| `panorama` | String (required) | Cloudinary URL of the full-res equirectangular image |
| `preview` | String | Cloudinary URL of the 1024px JPEG preview. Shown first for fast paint |
| `initialView.lon` | Number (default: 0) | Starting yaw angle (degrees) |
| `initialView.lat` | Number (default: 0) | Starting pitch angle (degrees) |
| `initialView.fov` | Number (default: 75) | Starting field of view (degrees) |
| `order` | Number (default: 0) | Sort order in scene rail |

Hotspots are stored in their own collection (not embedded) to allow bulk replacement without re-saving the full scene document.

---

## Hotspot (`models/Hotspot.ts`)

A single clickable point in a scene. Can be navigation (scene→scene) or info (popup).

| Field | Type | Description |
|---|---|---|
| `sceneId` | ObjectId → Scene (indexed) | Parent scene |
| `type` | 'navigation' \| 'info' | Determines click behaviour |
| `position.lon` | Number (required) | Horizontal angle in the sphere (degrees, -180..180) |
| `position.lat` | Number (required) | Vertical angle in the sphere (degrees, -90..90) |
| `label` | String | Tooltip / accessibility label |
| `targetSceneId` | ObjectId → Scene | *navigation only* — destination scene |
| `targetView.lon/lat` | Number | *navigation only* — arrival camera direction |
| `content.title` | String | *info only* — popup heading |
| `content.text` | String | *info only* — popup body text |
| `content.image` | String | *info only* — popup image URL |
| `content.video` | String | *info only* — video URL (YouTube etc.) |
| `content.link` | String | *info only* — external link |
| `icon` | String (default: 'arrow') | Visual style: 'arrow', 'dot', 'ring', 'info', 'custom' |
| `style.color` | String | CSS hex color for the sprite |
| `style.scale` | Number | Size multiplier (1.0 = default) |

### Hotspot Save Strategy
Hotspots are saved in bulk per scene: `DELETE WHERE sceneId = X` then `INSERT ALL`. This replaces the full set on every save rather than diffing. The editor keeps hotspots in Zustand state and persists only on explicit "Save Changes" click.

---

## Public API Response Shape

`GET /api/public/[slug]` returns a Tour document with scenes and hotspots embedded inline:

```json
{
  "_id": "...",
  "slug": "my-tour",
  "scenes": [
    {
      "_id": "...",
      "name": "Living Room",
      "panorama": "https://res.cloudinary.com/...",
      "preview": "https://res.cloudinary.com/...",
      "initialView": { "lon": 0, "lat": 0, "fov": 75 },
      "hotspots": [
        {
          "_id": "...",
          "type": "navigation",
          "position": { "lon": 45, "lat": -5 },
          "targetSceneId": "...",
          ...
        }
      ]
    }
  ]
}
```
