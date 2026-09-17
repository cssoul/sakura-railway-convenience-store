import * as THREE from 'three'
import { PALETTE } from '../core/constants'
import { toon } from '../core/toon'
import { box, crossPlanesGeometry } from '../core/geometry'
import { Rng } from '../core/rng'
import { grassBladeTexture } from '../materials/textures'
import { LAYOUT } from '../core/constants'

/** 绿化：灌木 / 草丛 / 花丛 / 盆栽 / 绿篱——点缀生活感，绝不抢樱花树的主角位 */
export function createPlants(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'plants'
  const rng = new Rng(70021)

  const bushA = toon(PALETTE.bush)
  const bushB = toon(PALETTE.bushDark)
  const sph = new THREE.SphereGeometry(1, 10, 8)

  const addBush = (x: number, z: number, s: number, y = 0): void => {
    const b = new THREE.Group()
    const n = rng.int(2, 3)
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(sph, rng.chance(0.5) ? bushA : bushB)
      m.position.set(rng.range(-0.25, 0.25) * s, rng.range(0, 0.18) * s, rng.range(-0.25, 0.25) * s)
      const bs = s * rng.range(0.55, 0.85)
      m.scale.set(bs, bs * rng.range(0.7, 0.95), bs)
      m.castShadow = true
      m.receiveShadow = true
      b.add(m)
    }
    b.position.set(x, y, z)
    g.add(b)
  }

  // 樱花树根周围
  addBush(-6.0, -0.4, 0.85)
  addBush(-3.3, -0.35, 0.7)
  addBush(-5.9, -2.5, 0.8)
  // 便利店门前两侧
  addBush(6.6, -0.75, 0.5, 0)
  addBush(-1.65, -0.85, 0.45)
  // 住宅门廊
  addBush(5.6, -5.35, 0.6)
  addBush(10.2, -5.3, 0.55)
  addBush(-6.3, -5.15, 0.6)
  addBush(-9.4, -5.2, 0.5)
  addBush(1.9, -6.85, 0.5)
  // 电线杆脚
  addBush(-9.2, 4.9, 0.35)
  addBush(9.6, 4.9, 0.35)

  // ---- 绿篱（围墙边） ----
  const hedgeMat = toon(PALETTE.hedge)
  for (const [x, z, w] of [
    [7.9, -4.72, 1.7],
    [-7.7, -4.52, 1.6],
    [4.3, -1.0, 1.2],
  ] as const) {
    const h = box(w, 0.55, 0.42, hedgeMat, x, 0.34, z)
    h.add(box(w * 0.96, 0.16, 0.36, toon(PALETTE.grassDark), 0, 0.34, 0))
    g.add(h)
  }

  // ---- 草丛（InstancedMesh，全区散布） ----
  const bladeTex = grassBladeTexture()
  const tuftGeo = crossPlanesGeometry(0.4, 0.34)
  const tuftMat = toon(0xffffff, { map: bladeTex, alphaTest: 0.4, side: THREE.DoubleSide })
  const COUNT = 240
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, COUNT)
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const scl = new THREE.Vector3()
  const pos = new THREE.Vector3()
  const col = new THREE.Color()

  // 采样区域（避开道路/店铺/铁轨主体）
  function samplePos(out: THREE.Vector3): void {
    for (let tries = 0; tries < 12; tries++) {
      const x = rng.range(-11.6, 11.6)
      const z = rng.range(-8.6, 8.6)
      // 道路与人行道
      if (z > -0.8 && z < 4.4) continue
      // 铁轨道砟区
      if (z > LAYOUT.railwayZ - 1.6 && z < LAYOUT.railwayZ + 1.6) continue
      // 店铺范围
      if (x > -1.6 && x < 6.6 && z > -6.4 && z < -0.8) continue
      // 房屋范围（粗略）
      let inHouse = false
      for (const h of LAYOUT.houses) {
        if (Math.abs(x - h.x) < h.w / 2 + 0.4 && Math.abs(z - h.z) < h.d / 2 + 0.4) inHouse = true
      }
      if (inHouse) continue
      out.set(x, 0.02, z)
      return
    }
    out.set(rng.range(-11, 11), 0.02, rng.range(-8.5, 4.3))
  }

  for (let i = 0; i < COUNT; i++) {
    if (i < COUNT * 0.3) {
      // 樱花树周围更密
      pos.set(LAYOUT.tree.x + rng.gauss(0, 2.2), 0.02, LAYOUT.tree.z + rng.gauss(0, 2.2))
    } else {
      samplePos(pos)
    }
    e.set(0, rng.range(0, Math.PI), 0)
    q.setFromEuler(e)
    const s = rng.range(0.6, 1.35)
    scl.set(s, s * rng.range(0.75, 1.3), s)
    m4.compose(pos, q, scl)
    tufts.setMatrixAt(i, m4)
    col.setHex(rng.chance(0.5) ? PALETTE.grassLight : PALETTE.grass)
    tufts.setColorAt(i, col)
  }
  tufts.instanceMatrix.needsUpdate = true
  if (tufts.instanceColor) tufts.instanceColor.needsUpdate = true
  tufts.castShadow = true
  g.add(tufts)

  // ---- 花丛小点（红/白/粉） ----
  const flowerGeo = new THREE.SphereGeometry(0.045, 6, 5)
  const flowerMat = toon(0xffffff)
  const FLOWERS = 90
  const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, FLOWERS)
  const spots: [number, number][] = [
    [6.2, -0.55],
    [-2.4, -0.6],
    [4.9, -4.75],
    [-8.2, -4.55],
    [-10.9, -0.5],
    [10.9, -0.5],
  ]
  const fColors = [0xe05548, 0xffffff, 0xf6b8cf, 0xf2c53d]
  for (let i = 0; i < FLOWERS; i++) {
    const [sx, sz] = spots[i % spots.length]
    pos.set(sx + rng.gauss(0, 0.5), 0.16 + rng.range(0, 0.1), sz + rng.gauss(0, 0.35))
    e.set(0, rng.range(0, Math.PI), 0)
    q.setFromEuler(e)
    const s = rng.range(0.7, 1.3)
    scl.set(s, s, s)
    m4.compose(pos, q, scl)
    flowers.setMatrixAt(i, m4)
    col.setHex(fColors[i % fColors.length])
    flowers.setColorAt(i, col)
  }
  flowers.instanceMatrix.needsUpdate = true
  if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true
  g.add(flowers)

  // 花丛茎叶
  const stemMat = toon(PALETTE.grassDark)
  for (const [sx, sz] of spots) {
    g.add(box(0.9, 0.14, 0.6, stemMat, sx, 0.07, sz))
  }

  // ---- 盆栽 ----
  const potMat = toon(0xa86848)
  const leafMat = toon(PALETTE.leafPot)
  const mkPot = (x: number, z: number, s = 1): void => {
    const p = new THREE.Group()
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.15 * s, 0.11 * s, 0.24 * s, 10), potMat)
    pot.position.y = 0.12 * s
    pot.castShadow = true
    p.add(pot)
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(sph, leafMat)
      leaf.position.set(rng.range(-0.06, 0.06) * s, 0.3 * s + rng.range(0, 0.14) * s, rng.range(-0.06, 0.06) * s)
      const ls = rng.range(0.1, 0.16) * s
      leaf.scale.set(ls, ls * 1.4, ls)
      leaf.castShadow = true
      p.add(leaf)
    }
    p.position.set(x, 0, z)
    g.add(p)
  }
  mkPot(0.7, -0.5, 1.1)
  mkPot(4.3, -0.5, 1.0)
  mkPot(6.75, -4.9, 0.9)
  mkPot(-6.55, -4.6, 0.9)

  return g
}
