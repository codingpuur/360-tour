import * as THREE from 'three'

/**
 * Create the inside-out panorama sphere.
 *
 * scale.x = -1 flips the sphere so normals face inward (the camera is inside).
 * We use FrontSide (not BackSide) because after the scale flip, front faces point inward.
 */
export function createPanoramaSphere(texture: THREE.Texture, radius = 500): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 60, 30)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.FrontSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.scale.x = -1
  return mesh
}
