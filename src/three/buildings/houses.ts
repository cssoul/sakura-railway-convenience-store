import * as THREE from 'three'
import { PALETTE } from '../core/constants'
import { toon, registerGlow } from '../core/toon'
import { GeoMerger, boxGeo, trs } from '../core/geometry'
import { Rng } from '../core/rng'
import { roofTileTexture } from '../materials/textures'

/** 住宅窗户玻璃：白天暗色，夜晚透出暖光（lamp 通道） */
const houseWindowMat = registerGlow(0x41505d, 0xffd98c, 0.95, 'lamp')

interface HouseConfig {
  x: number
  z: number
  rot: number
  w: number
  d: number
  wallH: number
  roof: 'gable' | 'hip'
}

const HOUSE_WALLS = [PALETTE.houseWallA, PALETTE.houseWallB, PALETTE.houseWallC]
const HOUSE_ROOFS = [PALETTE.roofTile, 0x4f5e58, PALETTE.roofTileDark]

function createHouse(cfg: HouseConfig, index: number): THREE.Group {
  const g = new THREE.Group()
  const { w, d, wallH } = cfg
  const wallMat = toon(HOUSE_WALLS[index % HOUSE_WALLS.length])
  const roofMat = toon(HOUSE_ROOFS[index % HOUSE_ROOFS.length], { map: roofTileTexture() })
  const roofDarkMat = toon(PALETTE.roofTileDark)
  const trimMat = toon(PALETTE.windowFrame)
  const isTwoStory = wallH > 4.2

  const m = new GeoMerger()
  const add = (key: string, gw: number, gh: number, gd: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): void => {
    m.add(key, boxGeo(gw, gh, gd), trs(x, y, z, rx, ry, rz))
  }

  // 基础 + 主体
  add('concrete', w + 0.3, 0.14, d + 0.3, 0, 0.07, 0)
  add('wall', w, wallH, d, 0, wallH / 2 + 0.1, 0)

  // ---- 屋顶 ----
  if (cfg.roof === 'gable') {
    // 实心三角棱柱屋顶：坡面与山墙完全贴合，任何角度都不露缝
    const pitch = 0.65
    const halfSpan = d / 2 + 0.45
    const apexH = halfSpan * Math.tan(pitch)
    const roofLen = w + 0.7
    const wallTop = wallH + 0.1

    const profile = new THREE.Shape()
    profile.moveTo(-halfSpan, 0)
    profile.lineTo(halfSpan, 0)
    profile.lineTo(0, apexH)
    profile.closePath()

    const roofGeo = new THREE.ExtrudeGeometry(profile, { depth: roofLen, bevelEnabled: false })
    roofGeo.rotateY(Math.PI / 2) // 脊线沿 x
    roofGeo.translate(-roofLen / 2, wallTop, 0)
    const roofMesh = new THREE.Mesh(roofGeo, roofMat)
    roofMesh.castShadow = true
    roofMesh.receiveShadow = true
    g.add(roofMesh)

    // 山墙端板（墙色，断面略小于屋面并内缩：屋顶边缘包住山墙，无共面闪烁）
    const inset = 0.3
    const plateProfile = new THREE.Shape()
    plateProfile.moveTo(-(halfSpan - inset), 0)
    plateProfile.lineTo(halfSpan - inset, 0)
    plateProfile.lineTo(0, apexH - inset * 0.55)
    plateProfile.closePath()
    const plateGeo = new THREE.ExtrudeGeometry(plateProfile, { depth: 0.1, bevelEnabled: false })
    plateGeo.rotateY(Math.PI / 2)
    for (const side of [-1, 1]) {
      const plate = new THREE.Mesh(plateGeo, wallMat)
      plate.position.x = side > 0 ? roofLen / 2 - 0.12 : -roofLen / 2 + 0.02
      plate.position.y = wallTop
      plate.castShadow = true
      g.add(plate)
    }

    // 脊 caps + 檐口
    add('roofDark', roofLen + 0.06, 0.1, 0.34, 0, wallTop + apexH + 0.02, 0)
    add('roofDark', roofLen + 0.06, 0.12, 0.12, 0, wallTop + 0.04, halfSpan)
    add('roofDark', roofLen + 0.06, 0.12, 0.12, 0, wallTop + 0.04, -halfSpan)
  } else {
    const hipGeo = new THREE.ConeGeometry(1, 1, 4)
    hipGeo.rotateY(Math.PI / 4)
    const hipH = 1.5
    m.add('roof', hipGeo, trs(0, wallH + hipH / 2 + 0.1, 0, 0, 0, 0, w / 2 + 0.5, hipH, d / 2 + 0.5))
  }

  // ---- 正面门窗（朝 +z） ----
  const z = d / 2 + 0.02
  const windowAt = (wx: number, wy: number, ww = 1.0, wh = 0.85): void => {
    add('trim', ww + 0.14, wh + 0.14, 0.06, wx, wy, z)
    add('glass', ww, wh, 0.05, wx, wy, z + 0.02)
    add('trim', ww + 0.02, 0.05, 0.04, wx, wy, z + 0.05)
  }

  const doorX = w * 0.26
  windowAt(-w * 0.26, 1.7)
  windowAt(doorX + w * 0.02 + 0.9, 1.7, 0.7, 0.7)
  if (isTwoStory) {
    windowAt(-w * 0.24, 4.35)
    windowAt(w * 0.24, 4.35)
  }

  // 大门 + 门楣 + 台阶
  add('wood', 0.88, 1.92, 0.09, doorX, 1.06, d / 2 + 0.02)
  add('roofDark', 0.95, 0.1, 0.18, doorX, 2.12, d / 2 + 0.08)
  add('concrete', 0.8, 0.14, 0.5, doorX, 0.07, d / 2 + 0.3)

  // ---- 阳台（两层住宅） ----
  if (isTwoStory) {
    const by = 2.95
    add('concrete', 2.3, 0.09, 0.85, -w * 0.05, by, d / 2 + 0.45)
    add('trim', 2.3, 0.06, 0.06, -w * 0.05, by + 0.72, d / 2 + 0.85)
    for (let i = 0; i < 6; i++) {
      add('trim', 0.045, 0.72, 0.045, -w * 0.05 - 1.05 + i * 0.42, by + 0.38, d / 2 + 0.85)
    }
    add('ac', 0.7, 0.48, 0.28, w * 0.28, by + 0.28, d / 2 + 0.5)
  }

  // 侧面空调外机 + 电表箱
  add('ac', 0.32, 0.45, 0.68, -w / 2 - 0.16, 2.3, 0.4)
  add('gray', 0.1, 0.5, 0.34, w / 2 + 0.05, 1.4, -d * 0.2)

  // ---- 按材质合并输出 ----
  const mergedWalls = m.build('wall', wallMat)
  const mergedRoof = m.build('roof', roofMat)
  const mergedRoofDark = m.build('roofDark', roofDarkMat)
  const mergedTrim = m.build('trim', trimMat)
  const mergedGlass = m.build('glass', houseWindowMat, false, false)
  const mergedWood = m.build('wood', toon(PALETTE.doorWood))
  const mergedConcrete = m.build('concrete', toon(0xb8b2a4))
  const mergedAc = m.build('ac', toon(0xcfd3d5))
  const mergedGray = m.build('gray', toon(0x9ba1a6))
  for (const mesh of [mergedWalls, mergedRoof, mergedRoofDark, mergedTrim, mergedGlass, mergedWood, mergedConcrete, mergedAc, mergedGray]) {
    if (mesh) g.add(mesh)
  }

  g.position.set(cfg.x, 0, cfg.z)
  g.rotation.y = cfg.rot
  return g
}

/** 混凝土砌块围墙段（几何合并） */
function fenceRun(merger: GeoMerger, x0: number, x1: number, z: number): void {
  let x = x0
  while (x < x1) {
    const len = Math.min(2.0, x1 - x)
    merger.add('fence', boxGeo(len - 0.06, 1.02, 0.14), trs(x + len / 2, 0.51, z))
    merger.add('fenceCap', boxGeo(len, 0.08, 0.2), trs(x + len / 2, 1.06, z))
    x += len
  }
}

export function createHouses(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'houses'

  const cfgs = [
    { x: 7.9, z: -7.35, rot: 0.06, w: 5.6, d: 4.6, wallH: 5.6, roof: 'gable' as const },
    { x: -7.7, z: -7.1, rot: -0.08, w: 5.2, d: 4.4, wallH: 3.1, roof: 'hip' as const },
    { x: -1.2, z: -8.4, rot: 0.04, w: 4.6, d: 3.8, wallH: 5.3, roof: 'gable' as const },
  ]
  cfgs.forEach((c, i) => g.add(createHouse(c, i)))

  // 前院围墙（留门口缺口）
  const fence = new GeoMerger()
  fenceRun(fence, 4.9, 7.0, -4.92)
  fenceRun(fence, 8.9, 11.4, -4.92)
  fenceRun(fence, -10.5, -8.4, -4.72)
  fenceRun(fence, -7.0, -4.9, -4.72)
  fenceRun(fence, -4.6, -3.7, -6.5)
  fenceRun(fence, 1.4, 4.6, -6.5)
  const fenceMesh = fence.build('fence', toon(PALETTE.fenceConcrete))
  const fenceCapMesh = fence.build('fenceCap', toon(0xc4c0b4))
  if (fenceMesh) g.add(fenceMesh)
  if (fenceCapMesh) g.add(fenceCapMesh)

  return g
}
