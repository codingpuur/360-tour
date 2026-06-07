import * as THREE from 'three'

const DEG = Math.PI / 180

/**
 * Convert lon/lat degrees to a THREE.Vector3 on a sphere of given radius.
 *
 * Convention (matches equirectangular panorama layout):
 *   lon: -180..180, 0 = center of image
 *   lat:  -90..90,  0 = horizon, positive = up
 *
 * The +180 offset on theta ensures lon=0 maps to the center of the panorama image.
 */
export function lonLatToVector3(lon: number, lat: number, radius = 500): THREE.Vector3 {
  const phi   = (90 - lat)  * DEG
  const theta = (lon + 180) * DEG
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  )
}

/**
 * Inverse: world-space point on sphere → lon/lat degrees.
 * Used to convert a raycast hit point back to a storable hotspot position.
 */
export function vector3ToLonLat(v: THREE.Vector3): { lon: number; lat: number } {
  const n   = v.clone().normalize()
  const lat = 90 - Math.acos(n.y) / DEG
  let   lon = Math.atan2(n.z, -n.x) / DEG - 180
  if (lon < -180) lon += 360
  return { lon, lat }
}

/**
 * Convert lon/lat + fov to a camera Euler for initial view placement.
 * Uses YXZ order so yaw (lon) and pitch (lat) are independent.
 */
export function lonLatToEuler(lon: number, lat: number): THREE.Euler {
  return new THREE.Euler(lat * DEG, -lon * DEG, 0, 'YXZ')
}
