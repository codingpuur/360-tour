import * as THREE from 'three'
import { vector3ToLonLat } from './lonlat'
import type { LonLat } from '@/types'

/**
 * Cast a ray from the pointer event through the camera and find where it hits the
 * panorama sphere. Returns lon/lat if it hits, null otherwise.
 *
 * THREE.Raycaster accounts for the object's world matrix (including scale.x=-1 flip)
 * automatically, so no special handling is needed for the inside-out sphere.
 */
export function raycastToLonLat(
  event: MouseEvent | PointerEvent,
  camera: THREE.Camera,
  sphere: THREE.Mesh,
  canvas: HTMLCanvasElement
): LonLat | null {
  const rect = canvas.getBoundingClientRect()
  const ndc  = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width)  * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  )
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(ndc, camera)
  const intersects = raycaster.intersectObject(sphere)
  if (!intersects.length) return null
  return vector3ToLonLat(intersects[0].point)
}

/**
 * Cast a ray against a collection of hotspot sprites/meshes.
 * Returns the first hit object (which carries the hotspot id in userData), or null.
 */
export function raycastHotspots(
  event: MouseEvent | PointerEvent,
  camera: THREE.Camera,
  hotspotObjects: THREE.Object3D[],
  canvas: HTMLCanvasElement
): THREE.Object3D | null {
  const rect = canvas.getBoundingClientRect()
  const ndc  = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width)  * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  )
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(ndc, camera)
  const hits = raycaster.intersectObjects(hotspotObjects, false)
  return hits.length ? hits[0].object : null
}
