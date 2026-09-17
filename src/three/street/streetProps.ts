import * as THREE from 'three'
import { LAYOUT, PALETTE } from '../core/constants'
import { toon, registerGlow } from '../core/toon'
import { box, cyl, crossPlanesGeometry } from '../core/geometry'
import { Rng } from '../core/rng'
import {
  postMarkTexture,
  vendingSignTexture,
  streetSignTexture,
  crossbuckTexture,
} from '../materials/textures'

/**
 * 日式街景识别件：红色邮筒 / 自动贩卖机 ×2 / 街角路牌 /
 * 踏切警示 / 弯道镜 / 白色护栏（InstancedMesh）。
 */
export function createStreetProps(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'street-props'
  const rng = new Rng(451)

  // ============ 红色邮筒 ============
  const mailbox = new THREE.Group()
  const redMat = toon(PALETTE.mailboxRed)
  const darkRedMat = toon(PALETTE.mailboxDark)
  mailbox.add(box(0.5, 0.12, 0.5, darkRedMat, 0, 0.06, 0))
  mailbox.add(box(0.08, 0.42, 0.34, darkRedMat, -0.15, 0.3, 0))
  mailbox.add(box(0.08, 0.42, 0.34, darkRedMat, 0.15, 0.3, 0))
  const body = cyl(0.32, 0.34, 0.92, redMat, 18, 0, 0.82, 0)
  mailbox.add(body)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), redMat)
  dome.position.set(0, 1.28, 0)
  dome.castShadow = true
  mailbox.add(dome)
  mailbox.add(box(0.3, 0.05, 0.02, toon(0x1c2026), 0, 1.06, 0.31))
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.22),
    new THREE.MeshBasicMaterial({ map: postMarkTexture(), transparent: true }),
  )
  mark.position.set(0, 0.86, 0.335)
  mailbox.add(mark)
  mailbox.position.set(5.5, 0, -0.28)
  g.add(mailbox)

  // ============ 自动贩卖机 ×2 ============
  function vending(x: number, z: number, bodyColor: number, label: string, labelBg: string): void {
    const v = new THREE.Group()
    v.add(box(1.06, 1.9, 0.76, toon(bodyColor), 0, 0.95, 0))
    v.add(box(1.0, 0.16, 0.8, toon(0x24424f), 0, 0.08, 0))
    // 发光商品窗
    const winMat = registerGlow(0xd7ecf8, 0xa8cfe2, 0.28, 'sign')
    const win = box(0.66, 1.02, 0.03, winMat, -0.16, 1.22, 0.39)
    win.castShadow = false
    v.add(win)
    // 窗内饮料
    const bottleGeo = new THREE.BoxGeometry(0.09, 0.2, 0.09)
    const bottles = new THREE.InstancedMesh(bottleGeo, toon(0xffffff), 16)
    const m4 = new THREE.Matrix4()
    const col = new THREE.Color()
    const colors = [0xd8453e, 0x2fae60, 0xf2c53d, 0x2e6db4, 0xffffff, 0xe88a3a]
    let bi = 0
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        m4.makeTranslation(-0.42 + c * 0.17, 0.86 + r * 0.24, 0.42)
        bottles.setMatrixAt(bi, m4)
        col.setHex(colors[(bi + r) % colors.length])
        bottles.setColorAt(bi, col)
        bi++
      }
    }
    bottles.instanceMatrix.needsUpdate = true
    if (bottles.instanceColor) bottles.instanceColor.needsUpdate = true
    v.add(bottles)
    // 按钮面板
    v.add(box(0.16, 1.02, 0.03, toon(0x24424f), 0.4, 1.22, 0.39))
    for (let r = 0; r < 4; r++) {
      const btn = cyl(0.035, 0.035, 0.03, toon(colors[r % colors.length]), 8, 0.4, 1.5 - r * 0.19, 0.41)
      btn.rotation.x = Math.PI / 2
      v.add(btn)
    }
    v.add(box(0.05, 0.12, 0.02, toon(0x1c2026), 0.4, 0.92, 0.4))
    // 取物口
    v.add(box(0.7, 0.3, 0.03, toon(0x2c3138), -0.16, 0.4, 0.39))
    // 顶部标牌
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.26),
      toon(0xffffff, { map: vendingSignTexture(label, labelBg) }),
    )
    sign.position.set(0, 1.72, 0.395)
    v.add(sign)
    v.position.set(x, 0, z)
    g.add(v)
  }
  vending(-2.75, -0.35, PALETTE.vendingBlue, 'ドリンク', '#2e6db4')
  vending(7.7, -0.28, PALETTE.vendingRed, 'アイス', '#c04a8a')

  // ============ 街角路牌 ============
  const sign = new THREE.Group()
  sign.add(cyl(0.035, 0.045, 2.7, toon(0x8f959a), 10, 0, 1.35, 0))
  const signTex = streetSignTexture()
  for (const side of [0, 1]) {
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.78, 0.58),
      toon(0xffffff, { map: signTex }),
    )
    plate.position.set(0, 2.42, side === 0 ? 0.021 : -0.021)
    if (side === 1) plate.rotation.y = Math.PI
    sign.add(plate)
  }
  sign.add(box(0.62, 0.4, 0.03, toon(0xffffff), 0, 1.95, 0.016))
  sign.position.set(-2.55, 0, -0.42)
  sign.rotation.y = 0.35
  g.add(sign)

  // ============ 踏切警示牌（行人过道旁） ============
  const buck = new THREE.Group()
  buck.add(cyl(0.035, 0.045, 2.6, toon(0x8f959a), 10, 0, 1.3, 0))
  const buckTex = crossbuckTexture()
  for (const side of [0, 1]) {
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.56, 0.56),
      toon(0xffffff, { map: buckTex }),
    )
    plate.position.set(0, 2.28, side === 0 ? 0.021 : -0.021)
    if (side === 1) plate.rotation.y = Math.PI
    buck.add(plate)
  }
  buck.position.set(LAYOUT.crossingX - 0.9, 0, LAYOUT.guardRailZ - 0.1)
  g.add(buck)

  // ============ 弯道凸面镜 ============
  const mirror = new THREE.Group()
  mirror.add(cyl(0.03, 0.04, 1.9, toon(0x8f959a), 8, 0, 0.95, 0))
  const mBack = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 18), toon(0xe8862a))
  mBack.rotation.x = Math.PI / 2
  mBack.position.set(0, 1.95, 0)
  mBack.castShadow = true
  mirror.add(mBack)
  const mFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 18),
    new THREE.MeshPhongMaterial({ color: 0xcfe4ec, shininess: 160, specular: 0xffffff }),
  )
  mFace.position.set(0, 1.95, 0.035)
  mirror.add(mFace)
  mirror.position.set(LAYOUT.crossingX + 0.9, 0, LAYOUT.guardRailZ - 0.2)
  mirror.rotation.y = -0.9
  g.add(mirror)

  // ============ 白色护栏（北：道路与铁轨间；南：住宅前） ============
  const postGeo = new THREE.BoxGeometry(0.13, 0.82, 0.13)
  const beamGeo = new THREE.BoxGeometry(1.98, 0.1, 0.05)
  const whiteMat = toon(PALETTE.guardWhite)

  interface Run {
    z: number
    x0: number
    x1: number
    gaps: [number, number][]
  }
  const runs: Run[] = [
    { z: LAYOUT.guardRailZ, x0: -11.7, x1: 11.7, gaps: [[LAYOUT.crossingX - 1.35, LAYOUT.crossingX + 1.35]] },
    { z: LAYOUT.southGuardZ, x0: -11.7, x1: -2.5, gaps: [] },
  ]

  const postXforms: THREE.Matrix4[] = []
  const beamXforms: THREE.Matrix4[] = []
  const m4 = new THREE.Matrix4()
  for (const run of runs) {
    const xs: number[] = []
    for (let x = run.x0; x <= run.x1 + 0.01; x += 2.0) {
      if (run.gaps.some(([a, b]) => x > a - 0.2 && x < b + 0.2)) continue
      xs.push(x)
    }
    for (const x of xs) {
      m4.makeTranslation(x, 0.41, run.z)
      postXforms.push(m4.clone())
    }
    for (let i = 0; i < xs.length - 1; i++) {
      const midX = (xs[i] + xs[i + 1]) / 2
      const spanLen = xs[i + 1] - xs[i]
      if (spanLen > 2.4) {
        // 跨缺口的悬空段跳过（缺口留给过道）
        continue
      }
      m4.compose(
        new THREE.Vector3(midX, 0.62, run.z),
        new THREE.Quaternion(),
        new THREE.Vector3(spanLen / 2.0, 1, 1),
      )
      beamXforms.push(m4.clone())
      m4.compose(
        new THREE.Vector3(midX, 0.36, run.z),
        new THREE.Quaternion(),
        new THREE.Vector3(spanLen / 2.0, 0.8, 1),
      )
      beamXforms.push(m4.clone())
    }
  }

  const posts = new THREE.InstancedMesh(postGeo, whiteMat, postXforms.length)
  postXforms.forEach((m, i) => posts.setMatrixAt(i, m))
  posts.instanceMatrix.needsUpdate = true
  posts.castShadow = true
  g.add(posts)

  const beams = new THREE.InstancedMesh(beamGeo, whiteMat, beamXforms.length)
  beamXforms.forEach((m, i) => beams.setMatrixAt(i, m))
  beams.instanceMatrix.needsUpdate = true
  beams.castShadow = true
  g.add(beams)

  // ============ 路边小草丛点缀 ============
  const tuftGeo = crossPlanesGeometry(0.3, 0.26)
  const tuftMat = toon(0x8fae6e, { alphaTest: 0.4, side: THREE.DoubleSide })
  const tufts = new THREE.InstancedMesh(tuftGeo, tuftMat, 24)
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const scl = new THREE.Vector3()
  const pos = new THREE.Vector3()
  for (let i = 0; i < 24; i++) {
    pos.set(rng.range(-11.5, 11.5), 0.02, rng.chance(0.5) ? rng.range(4.5, 4.95) : rng.range(-0.75, -0.6))
    e.set(0, rng.range(0, Math.PI), 0)
    q.setFromEuler(e)
    const s = rng.range(0.7, 1.2)
    scl.set(s, s, s)
    m4.compose(pos, q, scl)
    tufts.setMatrixAt(i, m4)
  }
  tufts.instanceMatrix.needsUpdate = true
  g.add(tufts)

  return g
}
