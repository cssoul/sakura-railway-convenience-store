import * as THREE from 'three'
import { BOUNDS } from './constants'

/** 春日白天光照：柔和阳光 + 天光，樱花树投射大面积柔影 */
export interface SceneLights {
  sun: THREE.DirectionalLight
  hemi: THREE.HemisphereLight
  dispose(): void
}

export function createLights(scene: THREE.Scene): SceneLights {
  const sun = new THREE.DirectionalLight(0xfff3dc, 2.9)
  sun.position.set(18, 26, 15)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  const extentX = 17
  const extentZ = 13
  sun.shadow.camera.left = -extentX
  sun.shadow.camera.right = extentX
  sun.shadow.camera.top = extentZ
  sun.shadow.camera.bottom = -extentZ
  sun.shadow.camera.near = 4
  sun.shadow.camera.far = 72
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.03
  scene.add(sun)
  scene.add(sun.target)
  sun.target.position.set(0, 0, 0)

  const hemi = new THREE.HemisphereLight(0xbfe3ff, 0xd8c9a8, 1.05)
  scene.add(hemi)

  const fill = new THREE.AmbientLight(0xf2ead9, 0.16)
  scene.add(fill)

  return {
    sun,
    hemi,
    dispose() {
      sun.dispose()
      hemi.dispose()
      fill.dispose()
    },
  }
}

export const WORLD_CENTER = new THREE.Vector3(
  (BOUNDS.minX + BOUNDS.maxX) / 2,
  0,
  (BOUNDS.minZ + BOUNDS.maxZ) / 2,
)
