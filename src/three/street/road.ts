import * as THREE from 'three'
import { LAYOUT, PALETTE } from '../core/constants'
import { toon } from '../core/toon'
import { box } from '../core/geometry'
import { Rng } from '../core/rng'
import { asphaltTexture, concreteTexture } from '../materials/textures'

/**
 * 日本社区小路：柏油路 + 两侧人行道 + 路缘 + 排水沟 + 标线 + 斑马线 + 积水。
 * 道路与铁轨通过西侧行人过道直接相连。
 */
export interface RoadHandles {
  group: THREE.Group
  /** 供天气系统做雨天变湿效果 */
  asphaltMat: THREE.MeshToonMaterial
  puddleMat: THREE.MeshPhongMaterial
}

export function createRoad(): RoadHandles {
  const g = new THREE.Group()
  g.name = 'road'
  const rng = new Rng(902)

  const roadN = LAYOUT.roadNorth
  const roadS = LAYOUT.roadSouth
  const roadW = roadN - roadS
  const roadCz = (roadN + roadS) / 2

  // ---- 柏油路面 ----
  const asphalt = asphaltTexture()
  const roadMat = toon(PALETTE.asphalt, { map: asphalt })
  const road = box(24, 0.04, roadW, roadMat, 0, 0.02, roadCz)
  road.castShadow = false
  g.add(road)

  // 道路中央虚线
  const dashGeo = new THREE.BoxGeometry(0.9, 0.012, 0.09)
  const dashCount = 12
  const dashes = new THREE.InstancedMesh(dashGeo, toon(PALETTE.roadLine), dashCount)
  const m4 = new THREE.Matrix4()
  for (let i = 0; i < dashCount; i++) {
    m4.makeTranslation(-10.5 + i * 1.9, 0.046, roadCz)
    dashes.setMatrixAt(i, m4)
  }
  dashes.instanceMatrix.needsUpdate = true
  dashes.castShadow = false
  dashes.receiveShadow = false
  g.add(dashes)

  // 斑马线（店前过街）
  const stripeGeo = new THREE.BoxGeometry(2.6, 0.012, 0.34)
  const stripeCount = 5
  const zebra = new THREE.InstancedMesh(stripeGeo, toon(0xe8eae6), stripeCount)
  for (let i = 0; i < stripeCount; i++) {
    m4.makeTranslation(LAYOUT.zebraX, 0.046, 0.55 + i * 0.62)
    zebra.setMatrixAt(i, m4)
  }
  zebra.instanceMatrix.needsUpdate = true
  g.add(zebra)

  // ---- 人行道（南北两段，微抬升） ----
  const walkTex = concreteTexture()
  walkTex.repeat.set(12, 1)
  const walkMat = toon(PALETTE.sidewalk, { map: walkTex })
  const curbMat = toon(PALETTE.curb)
  const h = LAYOUT.walkHeight

  const nZ = (LAYOUT.sidewalkNorth[0] + LAYOUT.sidewalkNorth[1]) / 2
  const nW = LAYOUT.sidewalkNorth[1] - LAYOUT.sidewalkNorth[0]
  const sZ = (LAYOUT.sidewalkSouth[0] + LAYOUT.sidewalkSouth[1]) / 2
  const sW = LAYOUT.sidewalkSouth[1] - LAYOUT.sidewalkSouth[0]

  for (const [z, w] of [
    [nZ, nW],
    [sZ, sW],
  ] as const) {
    const walk = box(24, h, w, walkMat, 0, h / 2, z)
    walk.castShadow = false
    g.add(walk)
    // 路缘（靠道路一侧）
    const curbSide = z > roadCz ? z - w / 2 - 0.06 : z + w / 2 + 0.06
    const curb = box(24, h + 0.02, 0.12, curbMat, 0, h / 2, curbSide)
    curb.castShadow = false
    g.add(curb)
  }

  // ---- 南侧排水沟 + 雨水篦 ----
  const gutter = box(24, 0.05, 0.22, toon(PALETTE.gutter), 0, 0.024, roadS + 0.14)
  gutter.castShadow = false
  g.add(gutter)

  const grateGeo = new THREE.BoxGeometry(0.55, 0.015, 0.18)
  const grateMat = toon(PALETTE.grate)
  const grates = new THREE.InstancedMesh(grateGeo, grateMat, 6)
  for (let i = 0; i < 6; i++) {
    const x = -10 + i * 4 + rng.range(-0.6, 0.6)
    m4.makeTranslation(x, 0.052, roadS + 0.14)
    grates.setMatrixAt(i, m4)
  }
  grates.instanceMatrix.needsUpdate = true
  g.add(grates)

  // ---- 积水（雨天氛围伏笔：小面积浅洼） ----
  const puddleMat = new THREE.MeshPhongMaterial({
    color: 0xbcd7e8,
    transparent: true,
    opacity: 0.42,
    shininess: 150,
    specular: 0xffffff,
  })
  const puddleGeo = new THREE.CircleGeometry(1, 22)
  for (const [x, z, sx, sz] of [
    [-6.4, 2.6, 1.15, 0.55],
    [3.9, 1.1, 0.8, 0.4],
    [-10.3, 5.9, 0.7, 1.0],
  ] as const) {
    const p = new THREE.Mesh(puddleGeo, puddleMat)
    p.rotation.x = -Math.PI / 2
    p.scale.set(sx, sz, 1)
    p.position.set(x, 0.05, z)
    p.renderOrder = 2
    g.add(p)
  }

  // ---- 行人过道：连接人行道并横穿铁轨（路网与铁轨的关系） ----
  const crossMat = toon(0x5a5f66)
  const cx = LAYOUT.crossingX
  const path1 = box(1.7, 0.075, LAYOUT.sidewalkNorth[1] - roadS + 0.4, crossMat, cx, 0.036, (roadS + LAYOUT.sidewalkNorth[1]) / 2)
  path1.castShadow = false
  g.add(path1)
  // 跨越道砟的部分略高
  const path2 = box(1.7, 0.16, LAYOUT.ballastWidth + 0.5, crossMat, cx, 0.08, LAYOUT.railwayZ)
  path2.castShadow = false
  path2.receiveShadow = true
  g.add(path2)
  const path3 = box(1.7, 0.075, 0.9, crossMat, cx, 0.036, LAYOUT.railwayZ + LAYOUT.ballastWidth / 2 + 0.85)
  path3.castShadow = false
  g.add(path3)

  return { group: g, asphaltMat: roadMat, puddleMat: puddleMat }
}
