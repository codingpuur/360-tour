# Architecture

_Last updated: 2026-06-07 — Phase 1 (project setup)_

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router) | One repo for editor, public viewer, and API routes |
| 3D viewer | **Three.js + @react-three/fiber@8** | From-scratch sphere engine wrapped in clean React |
| 3D helpers | **@react-three/drei@9** | Camera controls, loaders, useful utilities |
| State (editor) | **Zustand** | Lightweight, no Redux overhead |
| State (viewer) | React `useState` / refs | Simple enough; no global store needed |
| Styling | **Tailwind CSS** | Utility-first, matches workflow |
| Backend | **Next.js API routes** | No separate server needed at single-admin scale |
| Database | **MongoDB + Mongoose** | Tour/scene/hotspot JSON maps naturally to documents |
| Image storage | **Cloudinary** | Auto transforms, CDN, easy upload via stream |
| Image processing | **sharp** | Validate 2:1 aspect ratio, generate low-res previews |
| Auth | **next-auth@4** (Credentials) | Single admin — no OAuth/SAML complexity needed |
| Deploy | **Vercel** | Fits existing workflow |

## npm Package List

### Production
| Package | Version | Purpose |
|---|---|---|
| `next` | 14.x | Framework |
| `react`, `react-dom` | 18.x | UI |
| `three` | latest | 3D math + WebGL |
| `@react-three/fiber` | 8.x | React renderer for Three.js |
| `@react-three/drei` | 9.x | Three.js helpers (loaders, controls) |
| `zustand` | latest | Editor state management |
| `mongoose` | latest | MongoDB ODM |
| `next-auth` | 4.x | Authentication |
| `bcryptjs` | latest | Admin password hashing |
| `sharp` | latest | Image processing / panorama validation |
| `cloudinary` | latest | Image storage + CDN |
| `qrcode` | latest | QR code generation for share panel |
| `lucide-react` | latest | Icon set |
| `clsx` | latest | Conditional class names |
| `slugify` | latest | Auto-generate tour slugs from titles |

### Dev
| Package | Purpose |
|---|---|
| `typescript` | Type checking |
| `@types/three` | Three.js types |
| `@types/bcryptjs` | bcryptjs types |
| `@types/qrcode` | qrcode types |
| `tailwindcss`, `postcss` | Styling |
| `eslint`, `eslint-config-next` | Linting |

## Key Architectural Decisions

### Single admin, no multi-tenancy
Auth is a single `ADMIN_EMAIL` + bcrypt hash in `.env.local`. No user table, no roles. Public visitors need no auth.

### One Canvas for the tour lifetime
The `<Canvas>` (WebGL context) is never unmounted during scene navigation — unmounting destroys the GPU context causing a visible flash. Scene changes only swap the sphere texture.

### Hotspot positions as lon/lat degrees
Stored as `{ lon: number, lat: number }` — not pixel coordinates. This makes them viewport-resolution-independent and directly usable as sphere angles.

### Inside-out sphere technique
The panorama sphere uses `scale.x = -1` to flip inward. `MeshBasicMaterial` with `side: THREE.FrontSide` — after the flip, front faces point inward. This is simpler than `BackSide` for debugging in Three.js community resources.

### Progressive image loading
Each scene has a low-res `preview` URL (1024px wide JPEG, ~50KB) and a full `panorama` URL. The viewer loads preview first for instant first paint, then swaps to full res when it loads.

### Bulk hotspot save
Hotspots are saved in bulk per scene (`deleteMany` + `insertMany`) to avoid many tiny writes while the editor is open. The editor keeps local state (Zustand) and only persists on explicit Save.
