import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { LAYOUT } from '../three/core/constants'

/** 第三视角观察微缩桌面：拖拽旋转 + 滚轮缩放 + 阻尼 + 边界限制 + 视角飞行 */
export interface CameraRig {
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  resize(width: number, height: number): void
  update(dt: number): void
  flyTo(pos: THREE.Vector3, target: THREE.Vector3, duration?: number): void
  dispose(): void
}

interface Flight {
  t: number
  duration: number
  p0: THREE.Vector3
  p1: THREE.Vector3
  q0: THREE.Vector3
  q1: THREE.Vector3
}

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export function createCameraRig(container: HTMLElement): CameraRig {
  const camera = new THREE.PerspectiveCamera(
    LAYOUT.camera.fov,
    container.clientWidth / Math.max(1, container.clientHeight),
    0.5,
    400,
  )
  camera.position.set(...LAYOUT.camera.pos)

  const controls = new OrbitControls(camera, container)
  controls.target.set(...LAYOUT.camera.target)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.enablePan = false
  controls.minDistance = 6
  controls.maxDistance = 42
  controls.minPolarAngle = 0.1
  controls.maxPolarAngle = 1.5
  controls.update()

  let flight: Flight | null = null

  return {
    camera,
    controls,
    resize(width, height) {
      camera.aspect = width / Math.max(1, height)
      camera.updateProjectionMatrix()
    },
    update(dt) {
      if (flight) {
        flight.t = Math.min(flight.t + dt, flight.duration)
        const k = easeInOutCubic(flight.t / flight.duration)
        camera.position.lerpVectors(flight.p0, flight.p1, k)
        controls.target.lerpVectors(flight.q0, flight.q1, k)
        if (flight.t >= flight.duration) {
          flight = null
          controls.enabled = true
        }
      }
      controls.update()
    },
    flyTo(pos, target, duration = 1.5) {
      flight = {
        t: 0,
        duration,
        p0: camera.position.clone(),
        p1: pos.clone(),
        q0: controls.target.clone(),
        q1: target.clone(),
      }
      controls.enabled = false
    },
    dispose() {
      controls.dispose()
    },
  }
}
