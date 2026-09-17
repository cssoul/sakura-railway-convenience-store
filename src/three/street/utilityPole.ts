import * as THREE from 'three'
import { LAYOUT, PALETTE } from '../core/constants'
import { toon, registerGlow } from '../core/toon'
import { GeoMerger, boxGeo, cylGeo, trs, sagWireGeometry } from '../core/geometry'

/**
 * 电线杆 ×3 + 下垂电线 + 变压器 + 路灯 + 电箱 + 绝缘子 + 警示牌。
 * 电线用 CatmullRom 曲线生成自然下垂，且不穿过建筑与树干。
 * 静态部件全部按材质合并。
 */
export function createUtilityPoles(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'utility-poles'

  const concreteMat = toon(PALETTE.poleConcrete)
  const metalMat = toon(PALETTE.poleMetal)
  const wireMat = toon(PALETTE.wire)
  const insulatorMat = toon(PALETTE.insulator)
  const grayMat = toon(0x8f959a)
  const lampLensMat = registerGlow(0xfff2c8, 0xffedbe, 1.25, 'lamp')

  const H = LAYOUT.poleHeight
  const poles = LAYOUT.poles

  const m = new GeoMerger()
  const addBox = (key: string, w: number, h: number, d: number, px: number, py: number, pz: number, rx = 0, ry = 0, rz = 0): void => {
    m.add(key, boxGeo(w, h, d), trs(px, py, pz, rx, ry, rz))
  }
  const addCyl = (key: string, rt: number, rb: number, h: number, radial: number, px: number, py: number, pz: number, rx = 0, ry = 0, rz = 0): void => {
    m.add(key, cylGeo(rt, rb, h, radial), trs(px, py, pz, rx, ry, rz))
  }

  for (let i = 0; i < poles.length; i++) {
    const ox = poles[i].x
    const oz = poles[i].z
    const L = (x: number, y: number, z: number): [number, number, number] => [ox + x, y, oz + z]

    // 杆身（略带锥度）+ 顶帽
    m.add('concrete', cylGeo(0.13, 0.165, H, 12), trs(...L(0, H / 2, 0)))
    m.add('concrete', cylGeo(0.16, 0.16, 0.06, 12), trs(...L(0, H + 0.03, 0)))

    // 横担 + 绝缘子
    addCylAt(0, H - 1.0, 0)
    function addCylAt(x: number, y: number, z: number): void {
      m.add('metal', boxGeo(1.7, 0.09, 0.09), trs(ox + x, y, oz + z))
      for (const off of [-0.62, 0, 0.62]) {
        m.add('insulator', cylGeo(0.045, 0.06, 0.17, 8), trs(ox + x + off, y + 0.12, oz + z))
      }
    }
    m.add('insulator', cylGeo(0.04, 0.055, 0.2, 8), trs(...L(0, H + 0.14, 0)))

    // 变压器（中间那根）
    if (i === 1) {
      m.add('metal', cylGeo(0.33, 0.33, 0.95, 12), trs(ox + 0.4, 6.15, oz, 0, Math.PI / 2, Math.PI / 2))
      for (const dy of [-0.22, 0, 0.22]) {
        addBox('metal', 0.95, 0.07, 0.5, ox + 0.4, 6.15 + dy, oz)
      }
      for (const dx of [0.15, 0.4, 0.65]) {
        m.add('insulator', cylGeo(0.045, 0.06, 0.16, 8), trs(ox + dx, 6.75, oz))
      }
      addBox('metal', 0.5, 0.1, 0.34, ox, 6.6, oz)
    }

    // 电箱 / 路灯 / 警示牌
    m.add('gray', cylGeo(0.13, 0.13, 0.55, 10), trs(ox + 0.16, 3.2, oz + 0.1))
    if (i === 0) {
      addBox('metal', 0.07, 0.07, 1.35, ox, 5.65, oz + 0.62)
      addBox('metal', 0.5, 0.13, 0.24, ox, 5.62, oz + 1.2)
      m.add('lampLens', boxGeo(0.42, 0.04, 0.18), trs(ox, 5.54, oz + 1.2))
    }

    // 攀爬脚钉
    for (const dy of [2.2, 3.0, 3.8]) {
      m.add('metal', cylGeo(0.02, 0.02, 0.24, 6), trs(ox + 0.16, dy, oz, Math.PI / 2, 0, 0))
    }
  }

  // ---- 电线（相邻杆档 + 两端延伸 + 入户线，全部合并为单 Mesh） ----
  const spans: { a: THREE.Vector3; b: THREE.Vector3; sag: number }[] = []
  const span = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, sag: number): void => {
    spans.push({ a: new THREE.Vector3(ax, ay, az), b: new THREE.Vector3(bx, by, bz), sag })
  }

  for (let i = 0; i < poles.length - 1; i++) {
    const p1 = poles[i]
    const p2 = poles[i + 1]
    const armY = H - 0.88
    for (const off of [-0.62, 0, 0.62]) {
      span(p1.x + off, armY, p1.z, p2.x + off, armY, p2.z, 0.42 + Math.abs(off) * 0.12)
    }
    span(p1.x, H + 0.2, p1.z, p2.x, H + 0.2, p2.z, 0.5)
  }
  const first = poles[0]
  const last = poles[poles.length - 1]
  for (const off of [-0.62, 0, 0.62]) {
    span(first.x + off, H - 0.88, first.z, -12.4, H - 1.05, first.z, 0.3)
    span(last.x + off, H - 0.88, last.z, 12.6, H - 1.05, last.z, 0.3)
  }
  span(poles[1].x + 0.4, 6.75, poles[1].z, poles[1].x - 0.1, 6.75, poles[1].z, 0.06)
  span(last.x, H + 0.1, last.z, 7.9, 5.35, -5.1, 0.62)

  const wireGeos = spans.map((s) => sagWireGeometry(s.a, s.b, s.sag))
  const mergedWires = wireGeos.length
    ? new THREE.Mesh(mergeWires(wireGeos), wireMat)
    : null
  if (mergedWires) {
    mergedWires.castShadow = false
    g.add(mergedWires)
  }

  // ---- 合并输出 ----
  const built = [
    m.build('concrete', concreteMat),
    m.build('metal', metalMat),
    m.build('insulator', insulatorMat),
    m.build('gray', grayMat),
    m.build('lampLens', lampLensMat, false, false),
  ]
  for (const mesh of built) if (mesh) g.add(mesh)

  // 警示牌（带独立材质，每杆一片）
  const warnMat = toon(0xf2c53d, { side: THREE.DoubleSide })
  for (const p of poles) {
    const warn = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), warnMat)
    warn.position.set(p.x, 4.35, p.z + 0.18)
    g.add(warn)
  }

  return g
}

import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function mergeWires(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(geos)
  for (const g of geos) g.dispose()
  return merged
}
