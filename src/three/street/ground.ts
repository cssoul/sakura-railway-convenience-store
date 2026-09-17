import * as THREE from 'three'
import { GROUND, PALETTE } from '../core/constants'
import { toon } from '../core/toon'
import { box, flatPlane } from '../core/geometry'
import { Rng } from '../core/rng'

/**
 * 水平地面：场景直接坐在地面上。
 * 只允许极薄底座（0.12），外围是深色桌面（不属于场景主体）。
 */
export interface GroundHandles {
  group: THREE.Group
  /** 供天气系统做雪天覆白效果 */
  grassMats: THREE.MeshToonMaterial[]
}

export function createGround(): GroundHandles {
  const g = new THREE.Group()
  g.name = 'ground'

  const W = GROUND.width
  const D = GROUND.depth

  // 深色桌面（场景之外，用于「摆在桌上」的微缩感）
  const tableMat = toon(0x251c15)
  const table = new THREE.Mesh(new THREE.PlaneGeometry(44, 36), tableMat)
  table.rotation.x = -Math.PI / 2
  table.position.y = -0.13
  table.receiveShadow = true
  g.add(table)

  // 极薄底座（厚度 0.12，视觉上几乎不可见）
  const slab = box(W + 0.6, 0.12, D + 0.6, toon(0x352b24), 0, -0.06, 0)
  slab.castShadow = false
  g.add(slab)

  // 草地基底
  const grassMat = toon(PALETTE.grass)
  g.add(flatPlane(W, D, grassMat, 0, 0.001, 0))

  const rng = new Rng(311)
  const lightMat = toon(PALETTE.grassLight)
  const darkMat = toon(PALETTE.grassDark)

  // 草色斑块：打碎均匀感
  for (let i = 0; i < 16; i++) {
    const w = rng.range(2.2, 5.5)
    const d = rng.range(1.6, 4)
    const x = rng.range(-W / 2 + 2, W / 2 - 2)
    const z = rng.range(-D / 2 + 1.5, D / 2 - 1.5)
    g.add(flatPlane(w, d, rng.chance(0.5) ? lightMat : darkMat, x, 0.006, z))
  }

  // 便利店前铺装（含店前小广场）
  const pavementMat = toon(PALETTE.pavement)
  g.add(flatPlane(10.4, 2.4, pavementMat, 1.8, 0.012, -1.85))
  g.add(flatPlane(8.0, 1.2, pavementMat, 2.5, 0.013, -0.35))

  // 住宅区小径
  const pathMat = toon(PALETTE.dirt)
  g.add(flatPlane(1.4, 2.2, pathMat, -7.7, 0.01, -5.6))
  g.add(flatPlane(1.4, 2.2, pathMat, 7.9, 0.01, -5.4))

  // 樱花树下的花台泥土
  const soil = new THREE.Mesh(new THREE.CircleGeometry(1.7, 24), toon(PALETTE.soil))
  soil.rotation.x = -Math.PI / 2
  soil.position.set(-4.6, 0.014, -1.2)
  soil.receiveShadow = true
  g.add(soil)

  // 铁轨南侧（道路与铁轨之间）的窄草带已由草地基底覆盖

  return { group: g, grassMats: [grassMat, lightMat, darkMat] }
}
