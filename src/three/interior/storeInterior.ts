import * as THREE from 'three'
import { toon, registerGlow } from '../core/toon'
import { box, cyl } from '../core/geometry'
import { Rng } from '../core/rng'
import { posterTexture } from '../materials/textures'

/**
 * 便利店内部：透过玻璃幕墙必须看到的完整生活细节。
 * 货架 / 饮料柜 / 冰柜 / 收银台 / 咖啡机 / 关东煮 / 饭团便当柜 /
 * 杂志架 / 海报 / 灯箱 / 储物柜 / 后场门。重复商品全部 InstancedMesh。
 */
export function createStoreInterior(opts: { glassMat: THREE.Material }): THREE.Group {
  const g = new THREE.Group()
  g.name = 'store-interior'
  const rng = new Rng(88231)
  const F = 0.22 // 地板顶面高度

  const white = toon(0xf5f3ee)
  const gray = toon(0xd9d5cb)
  const dark = toon(0x2c3138)

  // ---------- 背墙货架 ×2 ----------
  const shelfProductXforms: { pos: THREE.Vector3; w: number; h: number; d: number }[] = []

  function backShelf(x0: number, w: number): void {
    const z = -2.28
    g.add(box(w, 2.1, 0.05, gray, x0, F + 1.05, z - 0.2)) // 背板
    g.add(box(0.05, 2.1, 0.5, gray, x0 - w / 2, F + 1.05, z))
    g.add(box(0.05, 2.1, 0.5, gray, x0 + w / 2, F + 1.05, z))
    for (let i = 0; i < 4; i++) {
      const by = F + 0.18 + i * 0.52
      g.add(box(w, 0.045, 0.48, white, x0, by, z))
      if (i > 0) {
        const n = Math.floor(w / 0.28)
        for (let k = 0; k < n; k++) {
          shelfProductXforms.push({
            pos: new THREE.Vector3(x0 - w / 2 + 0.18 + k * 0.28, by + 0.03, z + rng.range(-0.04, 0.04)),
            w: rng.range(0.18, 0.24),
            h: rng.range(0.2, 0.32),
            d: 0.2,
          })
        }
      }
    }
  }
  backShelf(-2.05, 2.7)
  backShelf(0.85, 2.4)

  // ---------- 中央岛式货架（双面） ----------
  const gx = -0.9
  const gz = -0.15
  g.add(box(3.0, 0.28, 0.92, gray, gx, F + 0.14, gz))
  g.add(box(3.0, 1.32, 0.07, gray, gx, F + 0.94, gz))
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const by = F + 0.52 + i * 0.44
      g.add(box(2.9, 0.04, 0.4, white, gx, by, gz + side * 0.2))
      const n = side > 0 ? 10 : 6
      for (let k = 0; k < n; k++) {
        shelfProductXforms.push({
          pos: new THREE.Vector3(gx - 1.35 + k * (2.7 / 9) + (side < 0 ? 0.35 : 0), by + 0.03, gz + side * (0.24 + rng.range(-0.03, 0.03))),
          w: rng.range(0.16, 0.22),
          h: rng.range(0.16, 0.28),
          d: 0.18,
        })
      }
    }
  }

  // 商品统一 InstancedMesh
  const prodGeo = new THREE.BoxGeometry(1, 1, 1)
  const prodMat = toon(0xffffff)
  const products = new THREE.InstancedMesh(prodGeo, prodMat, shelfProductXforms.length)
  const pastel = [0xe8b4b8, 0xb8d0e8, 0xe8d5a8, 0xb8d8b8, 0xd8b8e0, 0xf0e0d0, 0xe8a86a, 0x88b8d8, 0xd86a6a]
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const col = new THREE.Color()
  shelfProductXforms.forEach((p, i) => {
    m4.compose(p.pos, q, new THREE.Vector3(p.w, p.h, p.d))
    products.setMatrixAt(i, m4)
    col.setHex(rng.pick(pastel))
    products.setColorAt(i, col)
  })
  products.instanceMatrix.needsUpdate = true
  if (products.instanceColor) products.instanceColor.needsUpdate = true
  products.castShadow = true
  g.add(products)

  // ---------- 饮料柜（右侧墙） ----------
  const fz = 0.7
  const fridgeGlow = registerGlow(0x9fd4ee, 0xbfe4f6, 0.9, 'store')
  g.add(box(0.1, 2.05, 2.24, fridgeGlow, 3.4, F + 1.02, fz)) // 发光背板
  g.add(box(0.62, 0.14, 2.24, dark, 3.16, F + 2.12, fz))
  g.add(box(0.62, 0.12, 2.24, dark, 3.16, F + 0.06, fz))
  for (const dz of [-1.12, 1.12]) {
    g.add(box(0.62, 2.05, 0.1, dark, 3.16, F + 1.02, fz + dz))
  }
  const bottleXforms: THREE.Vector3[] = []
  for (let s = 0; s < 4; s++) {
    const by = F + 0.42 + s * 0.46
    g.add(box(0.52, 0.035, 2.1, white, 3.2, by, fz))
    for (let k = 0; k < 9; k++) {
      bottleXforms.push(new THREE.Vector3(3.22, by + 0.14, fz - 0.92 + k * 0.23))
    }
  }
  const bottleGeo = new THREE.CylinderGeometry(0.045, 0.052, 0.24, 8)
  const bottleMat = toon(0xffffff)
  const bottles = new THREE.InstancedMesh(bottleGeo, bottleMat, bottleXforms.length)
  const drinkColors = [0xd8453e, 0x2e6db4, 0x2fae60, 0xf2c53d, 0xe88a3a, 0xffffff, 0x9a6ad8]
  bottleXforms.forEach((p, i) => {
    m4.makeTranslation(p.x, p.y, p.z)
    bottles.setMatrixAt(i, m4)
    col.setHex(rng.pick(drinkColors))
    bottles.setColorAt(i, col)
  })
  bottles.instanceMatrix.needsUpdate = true
  if (bottles.instanceColor) bottles.instanceColor.needsUpdate = true
  g.add(bottles)
  // 饮料柜玻璃
  const fridgeGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.86, 2.1), opts.glassMat)
  fridgeGlass.position.set(2.84, F + 1.02, fz)
  g.add(fridgeGlass)
  const fridgeGlowLight = new THREE.PointLight(0xcfe9ff, 2.4, 4.5, 2)
  fridgeGlowLight.position.set(2.9, F + 1.1, fz)
  g.add(fridgeGlowLight)

  // ---------- 冰柜（躺式，右前） ----------
  g.add(box(1.05, 0.78, 0.62, toon(0xf2f3f0), 2.55, F + 0.39, 2.05))
  g.add(box(1.05, 0.16, 0.62, toon(0x2e6db4), 2.55, F + 0.72, 2.05))
  const chestGlass = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.05, 0.55), opts.glassMat)
  chestGlass.position.set(2.55, F + 0.82, 2.05)
  g.add(chestGlass)

  // ---------- 收银台 ----------
  const cx = 2.42
  const cz = 1.32
  g.add(box(1.55, 0.92, 0.62, white, cx, F + 0.46, cz))
  g.add(box(1.68, 0.05, 0.72, toon(0xe6e2d8), cx, F + 0.95, cz))
  const counterTop = F + 0.98
  // 收银机
  g.add(box(0.3, 0.16, 0.3, dark, cx - 0.45, counterTop + 0.08, cz))
  const screen = box(0.26, 0.2, 0.03, toon(0x9fd0e8), cx - 0.45, counterTop + 0.24, cz - 0.1)
  screen.rotation.x = -0.35
  g.add(screen)
  // 咖啡机
  g.add(box(0.36, 0.5, 0.3, toon(0x8a3b2e), cx + 0.42, counterTop + 0.25, cz))
  g.add(box(0.3, 0.06, 0.24, dark, cx + 0.42, counterTop + 0.12, cz + 0.06))
  // 关东煮锅
  g.add(cyl(0.18, 0.18, 0.26, toon(0x9aa0a6), 14, cx - 0.05, counterTop + 0.13, cz - 0.12))
  const odenGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.1, 8)
  const odenMat = toon(0xffffff)
  const oden = new THREE.InstancedMesh(odenGeo, odenMat, 7)
  const odenColors = [0xfff2d8, 0xe8d5a8, 0xf2e8e0, 0xd8c8a8]
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    m4.makeTranslation(cx - 0.05 + Math.cos(a) * 0.09, counterTop + 0.2, cz - 0.12 + Math.sin(a) * 0.09)
    oden.setMatrixAt(i, m4)
    col.setHex(odenColors[i % odenColors.length])
    oden.setColorAt(i, col)
  }
  oden.instanceMatrix.needsUpdate = true
  if (oden.instanceColor) oden.instanceColor.needsUpdate = true
  g.add(oden)

  // ---------- 饭团 / 便当展示柜 ----------
  const dx = 1.25
  const dz2 = 2.0
  g.add(box(0.78, 0.44, 0.5, white, dx, F + 0.22, dz2))
  const caseGlass = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.32, 0.46), opts.glassMat)
  caseGlass.position.set(dx, F + 0.6, dz2)
  g.add(caseGlass)
  const onigiriGeo = new THREE.CylinderGeometry(0, 0.055, 0.1, 4)
  const onigiri = new THREE.InstancedMesh(onigiriGeo, toon(0xffffff), 8)
  for (let i = 0; i < 8; i++) {
    m4.makeTranslation(dx - 0.26 + (i % 4) * 0.17, F + 0.49 + Math.floor(i / 4) * 0.11, dz2 + (Math.floor(i / 4) - 0.5) * 0.16)
    onigiri.setMatrixAt(i, m4)
  }
  onigiri.instanceMatrix.needsUpdate = true
  g.add(onigiri)
  const bentoGeo = new THREE.BoxGeometry(0.15, 0.05, 0.11)
  const bento = new THREE.InstancedMesh(bentoGeo, toon(0xffffff), 6)
  const bentoColors = [0xd8453e, 0x2e6db4, 0x2f2f2f, 0xc07a2d]
  for (let i = 0; i < 6; i++) {
    m4.makeTranslation(dx - 0.2 + (i % 3) * 0.2, F + 0.485 + Math.floor(i / 3) * 0.12, dz2 + (Math.floor(i / 3) - 0.5) * 0.2 + 0.08)
    bento.setMatrixAt(i, m4)
    col.setHex(bentoColors[i % bentoColors.length])
    bento.setColorAt(i, col)
  }
  bento.instanceMatrix.needsUpdate = true
  if (bento.instanceColor) bento.instanceColor.needsUpdate = true
  g.add(bento)

  // ---------- 杂志架（入口旁） ----------
  const mx = -0.25
  const mz = 2.2
  g.add(box(0.95, 1.1, 0.06, gray, mx, F + 0.55, mz - 0.13))
  g.add(box(0.95, 0.06, 0.3, gray, mx, F + 0.4, mz))
  g.add(box(0.95, 0.06, 0.3, gray, mx, F + 0.82, mz))
  const magGeo = new THREE.PlaneGeometry(0.2, 0.27)
  const magMat = toon(0xffffff, { side: THREE.DoubleSide })
  const mags = new THREE.InstancedMesh(magGeo, magMat, 8)
  const magColors = [0xd8453e, 0x2e6db4, 0x2fae60, 0xf2c53d, 0xd878a8, 0x886ad8, 0xe88a3a, 0x4ab8b8]
  const eul = new THREE.Euler()
  for (let i = 0; i < 8; i++) {
    const row = Math.floor(i / 4)
    eul.set(-0.28, 0, 0)
    q.setFromEuler(eul)
    m4.compose(
      new THREE.Vector3(mx - 0.36 + (i % 4) * 0.24, F + 0.5 + row * 0.4, mz + 0.1),
      q,
      new THREE.Vector3(1, 1, 1),
    )
    mags.setMatrixAt(i, m4)
    col.setHex(magColors[i])
    mags.setColorAt(i, col)
  }
  mags.instanceMatrix.needsUpdate = true
  if (mags.instanceColor) mags.instanceColor.needsUpdate = true
  g.add(mags)

  // ---------- 背墙海报 ----------
  for (const [px, v] of [
    [-0.55, 3],
    [0.35, 1],
  ] as const) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), toon(0xffffff, { map: posterTexture(v) }))
    p.position.set(px, 2.0, -2.53)
    g.add(p)
  }

  // ---------- 储物柜 + 后场门 ----------
  for (let i = 0; i < 3; i++) {
    g.add(box(0.55, 1.0, 0.45, toon(0x8f959a), 1.7 + i * 0.6, F + 0.5, -2.32))
  }
  g.add(box(0.95, 2.0, 0.07, toon(0x7d8489), 2.62, F + 1.0, -2.6))
  g.add(box(0.6, 0.06, 0.05, dark, 2.62, F + 0.9, -2.55))

  // ---------- 天花灯箱 ----------
  const panelMat = registerGlow(0xfff6e3, 0xfff2d8, 1.0, 'store')
  for (const [px, pz] of [
    [-1.6, -1.15],
    [1.6, -1.15],
    [-1.6, 1.15],
    [1.6, 1.15],
  ] as const) {
    const panel = box(1.5, 0.05, 0.55, panelMat, px, 3.8, pz)
    panel.castShadow = false
    g.add(panel)
  }

  // ---------- 店内主光 ----------
  const mainLight = new THREE.PointLight(0xffe9c8, 5.5, 11, 1.9)
  mainLight.position.set(0, 3.3, 0.5)
  mainLight.castShadow = false
  g.add(mainLight)

  return g
}

/** 店内灯光基础强度（供天气系统缩放） */
export const INTERIOR_LIGHT_BASE = 5.5
