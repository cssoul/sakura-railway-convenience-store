import * as THREE from 'three'
import { LAYOUT, PALETTE } from '../core/constants'
import { toon } from '../core/toon'
import { box, crossPlanesGeometry } from '../core/geometry'
import { Rng } from '../core/rng'
import { grassBladeTexture } from '../materials/textures'

/**
 * 前景铁轨：直接落在水平地面上。
 * 钢轨（底座+轨腰+轨头三层）/ 枕木 / 道砟 / 扣件 / 少量杂草，全部结构可读。
 */
export function createRailway(): THREE.Group {
  const g = new THREE.Group()
  g.name = 'railway'
  const rng = new Rng(5150)

  const z = LAYOUT.railwayZ
  const halfGauge = LAYOUT.railGauge / 2
  const bedW = LAYOUT.ballastWidth
  const bedH = LAYOUT.ballastHeight

  // ---- 道砟基床 ----
  const bedMat = toon(PALETTE.ballast)
  const bed = box(24, bedH, bedW, bedMat, 0, bedH / 2, z)
  bed.castShadow = false
  g.add(bed)

  // 碎石（InstancedMesh，随机大小/旋转/位置/颜色）
  const pebble = new THREE.DodecahedronGeometry(0.05, 0)
  const stoneCount = 850
  const stones = new THREE.InstancedMesh(pebble, toon(0xb9b3aa), stoneCount)
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const scl = new THREE.Vector3()
  const pos = new THREE.Vector3()
  const color = new THREE.Color()
  for (let i = 0; i < stoneCount; i++) {
    pos.set(rng.range(-11.9, 11.9), bedH - rng.range(0, 0.02), z + rng.range(-bedW / 2 + 0.15, bedW / 2 - 0.15))
    e.set(rng.range(0, Math.PI), rng.range(0, Math.PI), rng.range(0, Math.PI))
    q.setFromEuler(e)
    const s = rng.range(0.6, 1.5)
    scl.set(s, s * rng.range(0.7, 1), s)
    m4.compose(pos, q, scl)
    stones.setMatrixAt(i, m4)
    color.setHex(PALETTE.ballastDark).offsetHSL(0, rng.range(-0.04, 0.04), rng.range(-0.09, 0.07))
    stones.setColorAt(i, color)
  }
  stones.instanceMatrix.needsUpdate = true
  if (stones.instanceColor) stones.instanceColor.needsUpdate = true
  stones.castShadow = true
  stones.receiveShadow = true
  g.add(stones)

  // ---- 枕木 ----
  const sleeperGeo = new THREE.BoxGeometry(0.24, 0.09, 2.3)
  const sleeperCount = Math.floor(24 / 0.56)
  const sleepers = new THREE.InstancedMesh(sleeperGeo, toon(PALETTE.sleeper), sleeperCount)
  for (let i = 0; i < sleeperCount; i++) {
    pos.set(-11.8 + i * 0.56, bedH + 0.043, z + rng.range(-0.03, 0.03))
    e.set(0, rng.range(-0.02, 0.02), 0)
    q.setFromEuler(e)
    scl.set(1, 1, 1)
    m4.compose(pos, q, scl)
    sleepers.setMatrixAt(i, m4)
  }
  sleepers.instanceMatrix.needsUpdate = true
  sleepers.castShadow = true
  sleepers.receiveShadow = true
  g.add(sleepers)

  // ---- 钢轨（左右两股，三层断面：轨底/轨腰/轨头） ----
  const railDarkMat = toon(PALETTE.railDark)
  const headMat = toon(PALETTE.railHead)
  for (const side of [-1, 1]) {
    const rz = z + side * halfGauge
    const foot = box(24, 0.025, 0.16, railDarkMat, 0, bedH + 0.095, rz)
    const web = box(24, 0.1, 0.045, railDarkMat, 0, bedH + 0.155, rz)
    const head = box(24, 0.05, 0.085, headMat, 0, bedH + 0.23, rz)
    g.add(foot, web, head)
  }

  // ---- 接头夹板（每 4m 一副） ----
  const jointGeo = new THREE.BoxGeometry(0.22, 0.15, 0.02)
  const jointCount = 12
  const joints = new THREE.InstancedMesh(jointGeo, toon(0x565c63), jointCount * 2)
  let ji = 0
  for (const side of [-1, 1]) {
    for (let i = 0; i < jointCount; i++) {
      pos.set(-10 + i * 4.4, bedH + 0.17, z + side * halfGauge + (side > 0 ? 0.033 : -0.033))
      m4.makeTranslation(pos.x, pos.y, pos.z)
      joints.setMatrixAt(ji++, m4)
    }
  }
  joints.instanceMatrix.needsUpdate = true
  g.add(joints)

  // ---- 道砟间杂草 ----
  const weedTex = grassBladeTexture()
  const weedGeo = crossPlanesGeometry(0.34, 0.3)
  const weedMat = toon(0x8fae6e, { map: weedTex, alphaTest: 0.4, side: THREE.DoubleSide })
  const weeds = new THREE.InstancedMesh(weedGeo, weedMat, 90)
  for (let i = 0; i < 90; i++) {
    const edge = rng.chance(0.5) ? -1 : 1
    pos.set(
      rng.range(-11.7, 11.7),
      bedH - 0.01,
      z + edge * rng.range(bedW / 2 - 0.55, bedW / 2 - 0.05),
    )
    e.set(0, rng.range(0, Math.PI), 0)
    q.setFromEuler(e)
    const s = rng.range(0.7, 1.3)
    scl.set(s, s * rng.range(0.8, 1.3), s)
    m4.compose(pos, q, scl)
    weeds.setMatrixAt(i, m4)
  }
  weeds.instanceMatrix.needsUpdate = true
  weeds.castShadow = true
  g.add(weeds)

  return g
}
