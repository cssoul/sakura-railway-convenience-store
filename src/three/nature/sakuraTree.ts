import * as THREE from 'three'
import { PALETTE } from '../core/constants'
import { toon } from '../core/toon'
import { taperedTubeGeometry, blossomBlobGeometry } from '../core/geometry'
import { Rng } from '../core/rng'
import { barkTexture, blossomFlowerTexture } from '../materials/textures'

/**
 * 最高优先级资产：巨大樱花树。
 * 主干 → 一级枝 → 二级枝 → 三级小枝 → 大量独立花簇（InstancedMesh）。
 * 树冠由上百个大小/朝向/颜色各异的 blob 组成，枝干空隙可见。
 */
export interface SakuraTree {
  group: THREE.Group
  update(elapsed: number): void
  dispose(): void
}

const UP = new THREE.Vector3(0, 1, 0)

interface BranchSpec {
  azDeg: number
  elDeg: number
  len: number
  startT: number
}

/** 一级枝的手工方向表：塑造「伸向便利店屋顶」的经典构图，同时保证不穿墙 */
const PRIMARY_BRANCHES: BranchSpec[] = [
  { azDeg: 68, elDeg: 46, len: 4.4, startT: 0.98 },
  { azDeg: 110, elDeg: 44, len: 3.7, startT: 1.0 },
  { azDeg: 165, elDeg: 38, len: 3.4, startT: 0.86 },
  { azDeg: 222, elDeg: 42, len: 3.4, startT: 0.8 },
  { azDeg: 288, elDeg: 46, len: 3.4, startT: 0.74 },
  { azDeg: 342, elDeg: 50, len: 3.0, startT: 0.68 },
  { azDeg: 38, elDeg: 55, len: 3.2, startT: 1.0 },
]

export function createSakuraTree(
  position: { x: number; z: number },
  seed = 421337,
): SakuraTree {
  const rng = new Rng(seed)
  const group = new THREE.Group()
  group.name = 'sakura-tree'
  group.position.set(position.x, 0, position.z)

  const swayUniform = { value: 0 }
  const disposables: (THREE.BufferGeometry | THREE.Material)[] = []
  const outlineMat = new THREE.MeshBasicMaterial({ color: 0x352f42, side: THREE.BackSide })
  disposables.push(outlineMat)

  /** 背面放大外壳：给枝干加干净的动画式轮廓线（管体是索引几何，法线外推无缝） */
  function addOutlineShell(source: THREE.BufferGeometry, thickness: number): void {
    const shellGeo = source.clone()
    const p = shellGeo.attributes.position as THREE.BufferAttribute
    const n = shellGeo.attributes.normal as THREE.BufferAttribute
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(
        i,
        p.getX(i) + n.getX(i) * thickness,
        p.getY(i) + n.getY(i) * thickness,
        p.getZ(i) + n.getZ(i) * thickness,
      )
    }
    const shell = new THREE.Mesh(shellGeo, outlineMat)
    shell.castShadow = false
    shell.receiveShadow = false
    shell.renderOrder = -1
    group.add(shell)
    disposables.push(shellGeo)
  }

  // ---------- 树干 ----------
  const bark = barkTexture()
  const trunkMat = toon(PALETTE.trunk, { map: bark })
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.2, 1.3, -0.13),
    new THREE.Vector3(-0.14, 2.6, 0.15),
    new THREE.Vector3(0.1, 3.6, -0.05),
    new THREE.Vector3(0, 4.5, 0.02),
  ])
  const trunkGeo = taperedTubeGeometry(
    trunkCurve,
    (t) => 0.26 + 0.34 * Math.pow(1 - t, 1.7),
    24,
    11,
  )
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.castShadow = true
  trunk.receiveShadow = true
  group.add(trunk)
  disposables.push(trunkGeo)
  addOutlineShell(trunkGeo, 0.045)

  // 根部外扩
  const flareGeo = new THREE.CylinderGeometry(0.04, 0.3, 1.3, 7)
  disposables.push(flareGeo)
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rng.range(-0.2, 0.2)
    const dir = new THREE.Vector3(Math.cos(a) * 0.6, 1, Math.sin(a) * 0.6).normalize()
    const flare = new THREE.Mesh(flareGeo, trunkMat)
    flare.quaternion.setFromUnitVectors(UP, dir)
    flare.position.copy(dir).multiplyScalar(0.42)
    flare.castShadow = true
    group.add(flare)
  }

  // ---------- 分枝递归 ----------
  const branchMat = toon(PALETTE.trunkDark, { map: bark })
  const anchors: THREE.Vector3[] = []
  const tmp = new THREE.Vector3()
  const tmp2 = new THREE.Vector3()

  function addBranch(
    start: THREE.Vector3,
    dir: THREE.Vector3,
    len: number,
    r0: number,
    r1: number,
    depth: number,
  ): void {
    // 弯曲的分枝曲线：方向逐步上扬 + 随机侧摆
    const d1 = dir.clone().lerp(UP, rng.range(0.12, 0.3)).normalize()
    const d2 = d1.clone().lerp(UP, rng.range(0.15, 0.4)).normalize()
    const side = new THREE.Vector3().crossVectors(dir, UP).normalize()
    const p0 = start.clone()
    const p1 = p0.clone().addScaledVector(d1, len * 0.38).addScaledVector(side, rng.range(-0.15, 0.15) * len)
    const p2 = p1.clone().addScaledVector(d2, len * 0.34)
    const p3 = p0.clone().addScaledVector(dir, len).addScaledVector(UP, len * rng.range(0.3, 0.5))
    p3.addScaledVector(side, rng.range(-0.1, 0.1) * len)

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3])
    const geo = taperedTubeGeometry(curve, (t) => r0 + (r1 - r0) * t, 12, depth === 0 ? 8 : 6)
    const mesh = new THREE.Mesh(geo, branchMat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    disposables.push(geo)
    if (depth <= 1) addOutlineShell(geo, depth === 0 ? 0.03 : 0.022)

    if (depth < 2) {
      // 二级 / 三级分枝（一级枝的最后一根允许下垂，填补树冠下方）
      const childCount = depth === 0 ? 3 : rng.int(1, 2)
      for (let i = 0; i < childCount; i++) {
        const t = rng.range(0.5, 0.92)
        const sp = curve.getPointAt(t, tmp).clone()
        const yaw = rng.range(0.5, 1.05) * (rng.chance(0.5) ? 1 : -1)
        const cd = curve.getTangentAt(t, tmp2).clone()
        cd.applyAxisAngle(UP, yaw).normalize()
        const droop = depth === 0 && i === childCount - 1 && rng.chance(0.8)
        if (droop) {
          cd.y = -rng.range(0.15, 0.5)
          cd.normalize()
        } else {
          cd.y = Math.abs(cd.y) * rng.range(0.4, 1) + 0.25
          cd.normalize()
        }
        const clen = depth === 0 ? rng.range(1.1, 2.0) : rng.range(0.55, 0.95)
        addBranch(sp, cd, clen, r1 * rng.range(0.75, 0.95), r1 * 0.45, depth + 1)
      }
    }

    // 花簇锚点：各级枝端 + 二级枝中段
    anchors.push(p3.clone())
    if (depth >= 1 && rng.chance(0.6)) {
      anchors.push(curve.getPointAt(rng.range(0.55, 0.8), tmp).clone())
    }
  }

  for (const spec of PRIMARY_BRANCHES) {
    const az = THREE.MathUtils.degToRad(spec.azDeg)
    const el = THREE.MathUtils.degToRad(spec.elDeg)
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el))
    const start = trunkCurve.getPointAt(spec.startT).clone()
    const r0 = 0.14 + 0.07 * (1 - spec.startT)
    addBranch(start, dir, spec.len, r0, 0.06, 0)
  }

  // ---------- 花簇（InstancedMesh） ----------
  const canopyCenter = new THREE.Vector3(0.2, 6.8, 0.2)
  const maxR = 4.9
  const clusterGeo = blossomBlobGeometry()
  const clusterMat = toon(0xffffff)
  // 轻微摇曳：在顶点阶段注入风摆
  clusterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = swayUniform
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        [
          '#include <begin_vertex>',
          'float swayPh = position.x * 2.1 + position.y * 1.6 + position.z * 2.7;',
          'transformed += vec3(sin(uTime * 1.35 + swayPh), sin(uTime * 1.05 + swayPh * 1.31), cos(uTime * 1.2 + swayPh)) * 0.035;',
        ].join('\n'),
      )
  }
  disposables.push(clusterGeo, clusterMat)

  const clusterXform: { pos: THREE.Vector3; scl: number; color: THREE.Color }[] = []
  const deepPinks = [PALETTE.blossoms[3], PALETTE.blossoms[4]]
  const lightPinks = [PALETTE.blossoms[0], PALETTE.blossoms[1], PALETTE.blossoms[2], 0xffdfe9]

  for (const anchor of anchors) {
    const dist = anchor.distanceTo(canopyCenter) / maxR
    const outer = THREE.MathUtils.clamp(dist, 0, 1)
    const count = rng.int(4, 6)
    for (let i = 0; i < count; i++) {
      const offDir = new THREE.Vector3(...rng.direction(-0.8, 1))
      const off = offDir.multiplyScalar(rng.range(0.12, 0.6))
      const pos = anchor.clone().add(off)
      const base = rng.range(0.5, 0.85) * (0.82 + outer * 0.52)
      const palette = rng.chance(0.45 + 0.4 * (1 - outer)) ? deepPinks : lightPinks
      clusterXform.push({
        pos,
        scl: base,
        color: new THREE.Color(rng.pick(palette)).offsetHSL(0, 0, rng.range(-0.03, 0.03)),
      })
    }
  }

  // 树冠下层环带：制造「低垂到便利店屋顶上」的丰满感
  for (let i = 0; i < 30; i++) {
    const a = rng.range(0, Math.PI * 2)
    const r = rng.range(1.8, 4.2)
    const pos = new THREE.Vector3(
      0.2 + Math.cos(a) * r,
      rng.range(4.85, 5.85),
      0.2 + Math.sin(a) * r * 0.85,
    )
    clusterXform.push({
      pos,
      scl: rng.range(0.45, 0.75),
      color: new THREE.Color(rng.pick(lightPinks)).offsetHSL(0, 0, rng.range(-0.03, 0.02)),
    })
  }

  // 屋顶搭披簇：几簇直接落在便利店屋顶左角上（经典日式构图）
  for (let i = 0; i < 10; i++) {
    const pos = new THREE.Vector3(
      rng.range(3.0, 4.4),
      rng.range(4.45, 4.95),
      rng.range(-2.2, 0.8),
    )
    clusterXform.push({
      pos,
      scl: rng.range(0.4, 0.62),
      color: new THREE.Color(rng.pick(lightPinks)).offsetHSL(0, 0, rng.range(-0.02, 0.02)),
    })
  }

  // 补充少量内层填充簇（保持树冠通透）
  for (let i = 0; i < 90; i++) {
    const a = rng.pick(anchors)
    const jitter = new THREE.Vector3(...rng.direction(-1, 1)).multiplyScalar(rng.range(0.3, 1.0))
    const pos = a.clone().lerp(canopyCenter, rng.range(0.2, 0.6)).add(jitter)
    clusterXform.push({
      pos,
      scl: rng.range(0.35, 0.6),
      color: new THREE.Color(rng.pick(deepPinks)).offsetHSL(0, 0, rng.range(-0.05, 0)),
    })
  }

  const clusters = new THREE.InstancedMesh(clusterGeo, clusterMat, clusterXform.length)
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const v = new THREE.Vector3()
  const one = new THREE.Vector3(1, 1, 1)
  clusterXform.forEach((c, i) => {
    e.set(rng.range(0, Math.PI), rng.range(0, Math.PI), rng.range(0, Math.PI))
    q.setFromEuler(e)
    v.set(c.scl, c.scl * rng.range(0.85, 1.05), c.scl)
    m4.compose(c.pos, q, v)
    clusters.setMatrixAt(i, m4)
    clusters.setColorAt(i, c.color)
  })
  clusters.instanceMatrix.needsUpdate = true
  if (clusters.instanceColor) clusters.instanceColor.needsUpdate = true
  clusters.castShadow = true
  clusters.receiveShadow = false
  group.add(clusters)

  // ---------- 单朵樱花（近景层次） ----------
  const flowerTex = blossomFlowerTexture()
  const flowerMat = toon(0xffffff, {
    map: flowerTex,
    alphaTest: 0.45,
    side: THREE.DoubleSide,
  })
  const flowerGeo = new THREE.PlaneGeometry(1, 1)
  disposables.push(flowerGeo, flowerMat)
  const flowerCount = clusterXform.length * 4
  const flowers = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount)
  let fi = 0
  const dirV = new THREE.Vector3()
  for (const c of clusterXform) {
    const n = rng.int(3, 5)
    for (let k = 0; k < n && fi < flowerCount; k++) {
      dirV.set(rng.gauss(0, 0.55), rng.range(0.1, 1), rng.gauss(0, 0.55)).normalize()
      const pos = c.pos.clone().addScaledVector(dirV, c.scl * rng.range(0.85, 1.02))
      q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirV)
      q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rng.range(0, Math.PI * 2)))
      const s = rng.range(0.18, 0.28)
      v.set(s, s, s)
      m4.compose(pos, q, v)
      flowers.setMatrixAt(fi, m4)
      flowers.setColorAt(fi, c.color)
      fi++
    }
  }
  for (let i = fi; i < flowerCount; i++) {
    // 隐藏多余实例
    m4.makeScale(0, 0, 0)
    flowers.setMatrixAt(i, m4)
  }
  flowers.instanceMatrix.needsUpdate = true
  if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true
  group.add(flowers)

  return {
    group,
    update(elapsed) {
      swayUniform.value = elapsed
    },
    dispose() {
      for (const d of disposables) d.dispose()
    },
  }
}
