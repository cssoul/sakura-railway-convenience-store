import * as THREE from 'three'
import { LAYOUT, PALETTE } from '../core/constants'
import { toon } from '../core/toon'
import { Rng } from '../core/rng'
import { petalTexture } from '../materials/textures'

/**
 * 樱花花瓣：100~300 片缓慢飘落，带横向风与每片独立的相位/速度/翻滚。
 * 地面另有花瓣自然堆积（树冠下最密，铁轨道砟与路缘散布）。
 */

const TREE = LAYOUT.tree

export class FallingPetals {
  readonly mesh: THREE.InstancedMesh
  private n: number
  private data: { pos: THREE.Vector3; phase: number; speed: number; scale: number; spin: number }[]
  private factor = 1
  private rng = new Rng(99173)
  private m4 = new THREE.Matrix4()
  private q = new THREE.Quaternion()
  private e = new THREE.Euler()
  private v = new THREE.Vector3()

  constructor(count = 240) {
    this.n = count
    const geo = new THREE.PlaneGeometry(0.15, 0.12)
    const mat = toon(0xffffff, {
      map: petalTexture(),
      alphaTest: 0.4,
      side: THREE.DoubleSide,
    })
    this.mesh = new THREE.InstancedMesh(geo, mat, count)
    this.mesh.frustumCulled = false
    this.mesh.castShadow = false

    this.data = []
    const col = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const nearTree = this.rng.chance(0.55)
      const pos = nearTree
        ? new THREE.Vector3(
            TREE.x + this.rng.gauss(0, 1.8),
            this.rng.range(0.2, 9.5),
            TREE.z + this.rng.gauss(0, 1.8),
          )
        : new THREE.Vector3(this.rng.range(-7.5, 7.5), this.rng.range(0.2, 9.5), this.rng.range(-5.5, 5.5))
      this.data.push({
        pos,
        phase: this.rng.range(0, Math.PI * 2),
        speed: this.rng.range(0.45, 0.95),
        scale: this.rng.range(0.7, 1.3),
        spin: this.rng.range(0.6, 2.2),
      })
      col.setHex(this.rng.pick(PALETTE.petals)).offsetHSL(0, 0, this.rng.range(-0.04, 0.05))
      this.mesh.setColorAt(i, col)
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
  }

  /** blossomIntensity → 控制可见花瓣数量 */
  setFactor(f: number): void {
    this.factor = THREE.MathUtils.clamp(f, 0, 1)
    this.mesh.count = Math.max(0, Math.floor(this.n * this.factor))
  }

  update(dt: number, elapsed: number, wind: number): void {
    const { m4, q, e, v } = this
    for (let i = 0; i < this.mesh.count; i++) {
      const p = this.data[i]
      p.pos.y -= p.speed * dt
      p.pos.x += (Math.sin(elapsed * 0.85 + p.phase) * 0.42 + wind * 0.5) * dt
      p.pos.z += Math.cos(elapsed * 0.7 + p.phase * 1.7) * 0.3 * dt

      if (p.pos.y < 0.04) {
        const nearTree = this.rng.chance(0.55)
        if (nearTree) {
          p.pos.set(TREE.x + this.rng.gauss(0, 1.8), this.rng.range(5.5, 9.5), TREE.z + this.rng.gauss(0, 1.8))
        } else {
          p.pos.set(this.rng.range(-7.5, 7.5), this.rng.range(5.5, 9.5), this.rng.range(-5.5, 5.5))
        }
      }
      // 限制在场景上方，避免花瓣飘出微缩世界
      p.pos.x = THREE.MathUtils.clamp(p.pos.x, -8.5, 8.5)
      p.pos.z = THREE.MathUtils.clamp(p.pos.z, -6, 6.5)

      e.set(
        elapsed * p.spin + p.phase,
        elapsed * p.spin * 0.7 + p.phase * 2.0,
        Math.sin(elapsed * 0.9 + p.phase) * 0.8,
      )
      q.setFromEuler(e)
      v.setScalar(p.scale)
      this.m4.compose(p.pos, q, v)
      this.mesh.setMatrixAt(i, this.m4)
    }
    this.mesh.instanceMatrix.needsUpdate = true
  }
}

/** 地面堆积花瓣（静态，出生时一次成型） */
export function createGroundPetals(): THREE.InstancedMesh {
  const rng = new Rng(51711)
  const geo = new THREE.PlaneGeometry(0.13, 0.105)
  const mat = toon(0xffffff, {
    map: petalTexture(),
    alphaTest: 0.4,
    side: THREE.DoubleSide,
  })
  const COUNT = 380
  const mesh = new THREE.InstancedMesh(geo, mat, COUNT)
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const scl = new THREE.Vector3()
  const pos = new THREE.Vector3()
  const col = new THREE.Color()

  for (let i = 0; i < COUNT; i++) {
    const roll = rng.next()
    if (roll < 0.55) {
      // 树冠下堆积
      pos.set(TREE.x + rng.gauss(0, 1.9), 0.02, TREE.z + rng.gauss(0, 1.9))
    } else if (roll < 0.72) {
      // 铁轨道砟上
      pos.set(rng.range(-11.5, 11.5), LAYOUT.ballastHeight + 0.06, LAYOUT.railwayZ + rng.range(-1.3, 1.3))
    } else if (roll < 0.86) {
      // 人行道 / 店前
      pos.set(rng.range(-11, 11), 0.09, rng.chance(0.5) ? rng.range(3.45, 4.35) : rng.range(-0.75, 0.15))
    } else {
      // 草地散落
      pos.set(rng.range(-11.5, 11.5), 0.03, rng.chance(0.6) ? rng.range(-8.5, -1) : rng.range(4.5, 8.6))
    }

    e.set(
      -Math.PI / 2 + rng.range(-0.3, 0.3),
      0,
      rng.range(-0.3, 0.3),
    )
    // 先翻转躺平再随机水平朝向
    q.setFromEuler(new THREE.Euler(rng.range(-0.28, 0.28), rng.range(0, Math.PI * 2), rng.range(-0.28, 0.28), 'YXZ'))
    void e
    const s = rng.range(0.75, 1.45)
    scl.set(s, s, s)
    m4.compose(pos, q, scl)
    mesh.setMatrixAt(i, m4)
    col.setHex(rng.pick(PALETTE.petals)).offsetHSL(0, 0, rng.range(-0.06, 0.03))
    mesh.setColorAt(i, col)
  }
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  mesh.receiveShadow = true
  return mesh
}
