import * as THREE from 'three'
import { Rng } from '../core/rng'
import { snowflakeTexture } from '../materials/textures'

/**
 * 降水系统：雨（细长雨丝，快速下落）与雪（柔和雪花，缓慢飘落）。
 * 由 WeatherSystem 的 rainFactor / snowFactor 控制可见数量，平滑切换。
 */
export class Precipitation {
  readonly rain: THREE.InstancedMesh
  readonly snow: THREE.InstancedMesh

  private readonly rainCount = 320
  private readonly snowCount = 280
  private rainData: { x: number; y: number; z: number; speed: number }[] = []
  private snowData: { x: number; y: number; z: number; speed: number; phase: number; scale: number; spin: number }[] = []
  private rng = new Rng(88221)
  private m4 = new THREE.Matrix4()
  private q = new THREE.Quaternion()
  private e = new THREE.Euler()
  private v = new THREE.Vector3()
  private p = new THREE.Vector3()
  private geometries: THREE.BufferGeometry[] = []
  private materials: THREE.Material[] = []

  constructor() {
    const rainGeo = new THREE.PlaneGeometry(0.022, 0.32)
    const rainMat = new THREE.MeshBasicMaterial({
      color: 0xaac6de,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    this.rain = new THREE.InstancedMesh(rainGeo, rainMat, this.rainCount)
    this.rain.frustumCulled = false
    for (let i = 0; i < this.rainCount; i++) {
      this.rainData.push({
        x: this.rng.range(-11, 11),
        y: this.rng.range(0, 12),
        z: this.rng.range(-8.5, 8.5),
        speed: this.rng.range(9.5, 14),
      })
    }

    const snowGeo = new THREE.PlaneGeometry(0.11, 0.11)
    const snowMat = new THREE.MeshBasicMaterial({
      map: snowflakeTexture(),
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    this.snow = new THREE.InstancedMesh(snowGeo, snowMat, this.snowCount)
    this.snow.frustumCulled = false
    for (let i = 0; i < this.snowCount; i++) {
      this.snowData.push({
        x: this.rng.range(-10, 10),
        y: this.rng.range(0, 10),
        z: this.rng.range(-8, 8),
        speed: this.rng.range(0.7, 1.5),
        phase: this.rng.range(0, Math.PI * 2),
        scale: this.rng.range(0.7, 1.35),
        spin: this.rng.range(0.4, 1.4),
      })
    }

    this.geometries.push(rainGeo, snowGeo)
    this.materials.push(rainMat, snowMat)
    this.rain.count = 0
    this.snow.count = 0
  }

  update(dt: number, elapsed: number): void {
    // 雨
    for (let i = 0; i < this.rain.count; i++) {
      const d = this.rainData[i]
      d.y -= d.speed * dt
      d.x += dt * 0.6
      if (d.y < 0) {
        d.y = this.rng.range(9, 12)
        d.x = this.rng.range(-11, 11)
        d.z = this.rng.range(-8.5, 8.5)
      }
      this.e.set(0, 0, 0.1)
      this.q.setFromEuler(this.e)
      this.v.set(1, 1, 1)
      this.m4.compose(this.p.set(d.x, d.y, d.z), this.q, this.v)
      this.rain.setMatrixAt(i, this.m4)
    }
    if (this.rain.count > 0) this.rain.instanceMatrix.needsUpdate = true

    // 雪
    for (let i = 0; i < this.snow.count; i++) {
      const d = this.snowData[i]
      d.y -= d.speed * dt
      d.x += Math.sin(elapsed * 0.7 + d.phase) * 0.35 * dt
      d.z += Math.cos(elapsed * 0.55 + d.phase * 1.3) * 0.25 * dt
      if (d.y < 0.02) {
        d.y = this.rng.range(8, 10)
        d.x = this.rng.range(-10, 10)
        d.z = this.rng.range(-8, 8)
      }
      this.e.set(elapsed * d.spin + d.phase, elapsed * d.spin * 0.8, 0)
      this.q.setFromEuler(this.e)
      this.v.setScalar(d.scale)
      this.m4.compose(this.p.set(d.x, d.y, d.z), this.q, this.v)
      this.snow.setMatrixAt(i, this.m4)
    }
    if (this.snow.count > 0) this.snow.instanceMatrix.needsUpdate = true
  }

  setRain(f: number): void {
    this.rain.count = Math.floor(this.rainCount * THREE.MathUtils.clamp(f, 0, 1))
  }

  setSnow(f: number): void {
    this.snow.count = Math.floor(this.snowCount * THREE.MathUtils.clamp(f, 0, 1))
  }

  dispose(): void {
    for (const g of this.geometries) g.dispose()
    for (const m of this.materials) m.dispose()
  }
}
