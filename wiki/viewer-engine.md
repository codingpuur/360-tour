# Viewer Engine

_Last updated: 2026-06-07 — Phase 1 + Phase 4 complete_

## Component Tree

```
PanoViewer          ← outer shell (state, fade, DOM overlays)
  Canvas (r3f)      ← ONE canvas lives for the full tour lifetime
    PanoSphere      ← sphere + camera controls + hotspot sprites
      Hotspot       ← renders all HotspotSprites for current scene
        HotspotSprite × N  ← single THREE.Sprite per hotspot
  Floorplan         ← DOM overlay (not inside Canvas)
  SceneRail         ← DOM overlay (not inside Canvas)
  InfoPopup         ← DOM overlay (not inside Canvas)
```

All DOM overlays use `position: absolute` over the Canvas div. They are NOT rendered inside `<Canvas>`.

---

## Inside-Out Sphere

The panorama sphere uses `scale={[-1, 1, 1]}` (JSX) to flip the sphere inward. The camera sits at the center.

```tsx
<mesh ref={sphereRef} scale={[-1, 1, 1]}>
  <sphereGeometry args={[500, 60, 30]} />
  {/* map prop is set via useState; r3f handles needsUpdate */}
  <meshBasicMaterial map={texture ?? undefined} side={THREE.FrontSide} color={texture ? 'white' : '#1a1a2e'} />
</mesh>
```

`scale.x = -1` reverses the normals so they point inward. `FrontSide` (not `BackSide`) is used because after the flip, the front faces now face inward toward the camera. **Do not change this pattern.**

---

## Coordinate System

Hotspot positions are stored as `{ lon, lat }` in degrees:
- `lon`: -180 to 180, where 0 = center of the equirectangular image (east)
- `lat`: -90 to 90, where 0 = horizon, positive = up

### `lonLatToVector3(lon, lat, radius=500)` → `THREE.Vector3`
```ts
const phi   = (90 - lat)  * DEG
const theta = (lon + 180) * DEG  // +180 so lon=0 maps to image center
return new THREE.Vector3(
  -radius * Math.sin(phi) * Math.cos(theta),
   radius * Math.cos(phi),
   radius * Math.sin(phi) * Math.sin(theta)
)
```

### `vector3ToLonLat(v)` → `{ lon, lat }`
Inverse function. Used to convert a raycast hit point back to storable hotspot position.

### `lonLatToEuler(lon, lat)` → `THREE.Euler`
Converts view angle to camera rotation. Uses `YXZ` order so yaw (lon) and pitch (lat) are independent.

---

## Camera Controls (drag to look)

Drag controls are implemented by attaching native DOM events directly to the canvas element (not r3f element events) to avoid `ThreeEvent` type conflicts:

```ts
canvas.addEventListener('pointerdown', handlePointerDown)
canvas.addEventListener('pointermove', handlePointerMove)
canvas.addEventListener('pointerup',   handlePointerUp)
canvas.addEventListener('wheel', handleWheel, { passive: false })
```

All lon/lat state is stored as **refs**, not React state, for zero-lag camera response. `useFrame` reads the refs and applies the camera rotation each frame.

**Drag-vs-click threshold:** 5px. If the pointer moves less than 5px from `pointerdown` to `pointerup`, it is treated as a click (triggers `onSphereClick` in editor mode). Above 5px = drag = only updates lon/lat.

**Scroll to zoom:** modifies `fovRef.current` clamped between 40° and 110°. Applied to `camera.fov` in `useFrame`.

---

## Hotspot Sprites

Each hotspot is a `THREE.Sprite` with a canvas-drawn texture. Sprites always face the camera without any special matrix work.

- **Position:** `lonLatToVector3(lon, lat, 490)` — radius 490 (slightly inside the sphere at 500) to prevent z-fighting.
- **Material:** `SpriteMaterial({ transparent: true, depthWrite: false })` — `depthWrite: false` prevents z-fighting between sprites.
- **Canvas drawing:** A 128×128 canvas draws a ring + filled circle + icon character (→ for navigation, i for info). Color is read from `hotspot.style.color`.
- **Bob animation:** Navigation hotspots bob up/down via `useFrame` with a random phase offset per sprite.

---

## Texture Loading (Progressive)

Textures are managed via `useState<THREE.Texture | null>` and passed directly as a prop to `<meshBasicMaterial map={texture}>`. r3f handles `needsUpdate` automatically when the prop changes — no manual mutation needed.

Loading sequence: `preview` URL loads first for fast first paint, then `panorama` (full resolution) loads and replaces it. Both use sequential `TextureLoader.load()` calls with individual error handlers:

```ts
const urls = [scene.preview, scene.panorama].filter(Boolean)
// load each in order; on success: setTexture(tex) then loadNext()
// on error: console.error(...) then loadNext()
```

`texture.colorSpace = THREE.SRGBColorSpace` is set on every loaded texture. Without this, colors appear washed out.

**Why not manual `sphereRef.current.material.map = tex`?** The original approach used the mesh ref to access the material indirectly. Silent failures (no `onError` callback + wrong timing) caused the black canvas bug. The `useState` → prop pattern is idiomatic r3f and eliminates this class of issue.

---

## Scene Fade Transitions

The `<Canvas>` is never unmounted during navigation — unmounting destroys the WebGL context.

Fade is implemented via CSS `transition-opacity duration-300` on a wrapper div:

```
State: 'visible' | 'fading-out' | 'fading-in'

goToScene() →
  setFadeState('fading-out')  → opacity-0 (CSS 300ms)
  setTimeout 300ms →
    setCurrentScene(target)
    setFadeState('fading-in') → opacity-100 (CSS 300ms)
  setTimeout 300ms → 'visible'
```

---

## SSR Safety

`PanoViewer` uses Three.js which requires browser APIs (`window`, WebGL). It must be imported via:

```ts
const PanoViewer = dynamic(
  () => import('@/components/viewer/PanoViewer').then(m => m.PanoViewer),
  { ssr: false }
)
```

Both `/tour/[slug]/page.tsx` and `/embed/[slug]/page.tsx` do this. The `(admin)/editor` page uses the same pattern for `HotspotTools`.
