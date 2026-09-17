import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/** 快捷盒体（默认投影） */
export function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

export function cyl(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  mat: THREE.Material,
  radial = 14,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radial), mat)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

export function flatPlane(
  w: number,
  h: number,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
  m.rotation.x = -Math.PI / 2
  m.position.set(x, y, z)
  m.receiveShadow = true
  return m
}

/**
 * 自定义锥形管：沿 CatmullRom 曲线生成半径渐变的管体（树干/树枝）。
 * TubeGeometry 不支持变半径，这里手动构建。
 */
export function taperedTubeGeometry(
  curve: THREE.CatmullRomCurve3,
  radiusAt: (t: number) => number,
  tubularSegments = 20,
  radialSegments = 9,
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegments, false)
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const point = new THREE.Vector3()
  const normal = new THREE.Vector3()

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments
    curve.getPointAt(t, point)
    const r = radiusAt(t)
    const N = frames.normals[i]
    const B = frames.binormals[i]
    for (let j = 0; j <= radialSegments; j++) {
      const a = (j / radialSegments) * Math.PI * 2
      const sin = Math.sin(a)
      const cos = Math.cos(a)
      normal.set(cos * N.x + sin * B.x, cos * N.y + sin * B.y, cos * N.z + sin * B.z).normalize()
      positions.push(point.x + normal.x * r, point.y + normal.y * r, point.z + normal.z * r)
      normals.push(normal.x, normal.y, normal.z)
      uvs.push(t, j / radialSegments)
    }
  }

  for (let i = 1; i <= tubularSegments; i++) {
    for (let j = 1; j <= radialSegments; j++) {
      const a = (radialSegments + 1) * (i - 1) + (j - 1)
      const b = (radialSegments + 1) * i + (j - 1)
      const c = (radialSegments + 1) * i + j
      const d = (radialSegments + 1) * (i - 1) + j
      indices.push(a, b, d, b, c, d)
    }
  }

  const g = new THREE.BufferGeometry()
  g.setIndex(indices)
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  return g
}

/** 两点之间自然下垂的电线管几何体 */
export function sagWireGeometry(a: THREE.Vector3, b: THREE.Vector3, sag: number): THREE.BufferGeometry {
  const mid = a.clone().add(b).multiplyScalar(0.5)
  mid.y -= sag
  const q1 = a.clone().lerp(mid, 0.5)
  q1.y -= sag * 0.4
  const q2 = b.clone().lerp(mid, 0.5)
  q2.y -= sag * 0.4
  const curve = new THREE.CatmullRomCurve3([a, q1, mid, q2, b])
  return new THREE.TubeGeometry(curve, 20, 0.022, 5, false)
}

/** 颠簸的小石块（道砟/装饰） */
export function pebbleGeometry(radius = 1): THREE.BufferGeometry {
  const g = new THREE.DodecahedronGeometry(radius, 0)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const s = 0.75 + Math.random() * 0.5
    pos.setXYZ(i, pos.getX(i) * s, pos.getY(i) * s * 0.8, pos.getZ(i) * s)
  }
  g.computeVertexNormals()
  return g
}

/** 轻微扰动的球状花簇 blob（按位置哈希扰动，保证共享顶点不撕裂） */
export function blossomBlobGeometry(): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, 1)
  const pos = g.attributes.position as THREE.BufferAttribute
  const hash = (x: number, y: number, z: number): number => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
    return n - Math.floor(n)
  }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const s = 0.84 + hash(x, y, z) * 0.32
    pos.setXYZ(i, x * s, y * s, z * s)
  }
  g.computeVertexNormals()
  return g
}

/** 按材质 key 收集几何并在最后合并，大幅减少静态小盒子的 draw call */
export class GeoMerger {
  private groups = new Map<string, THREE.BufferGeometry[]>()

  add(key: string, geo: THREE.BufferGeometry, matrix: THREE.Matrix4): void {
    // mergeGeometries 要求属性一致：统一转成非索引几何
    let g = geo.clone()
    if (g.index) g = g.toNonIndexed()
    g.applyMatrix4(matrix)
    const arr = this.groups.get(key) ?? []
    arr.push(g)
    this.groups.set(key, arr)
  }

  build(key: string, material: THREE.Material, castShadow = true, receiveShadow = true): THREE.Mesh | null {
    const arr = this.groups.get(key)
    if (!arr || arr.length === 0) return null
    const merged = mergeGeometries(arr)
    arr.forEach((g) => g.dispose())
    this.groups.delete(key)
    const mesh = new THREE.Mesh(merged, material)
    mesh.castShadow = castShadow
    mesh.receiveShadow = receiveShadow
    return mesh
  }
}

export function boxGeo(w: number, h: number, d: number): THREE.BufferGeometry {
  return new THREE.BoxGeometry(w, h, d)
}

export function cylGeo(rt: number, rb: number, h: number, radial = 12): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(rt, rb, h, radial)
}

/** 组装 TRS 矩阵 */
export function trs(
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = 1,
  sz = 1,
): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  )
}

/** 两片交叉的平面（草丛/花丛通用，配合 alpha 贴图 + InstancedMesh） */
export function crossPlanesGeometry(w: number, h: number): THREE.BufferGeometry {
  const a = new THREE.PlaneGeometry(w, h)
  a.translate(0, h / 2, 0)
  const b = new THREE.PlaneGeometry(w, h)
  b.translate(0, h / 2, 0)
  b.rotateY(Math.PI / 2)
  const merged = mergeGeometries([a, b])
  a.dispose()
  b.dispose()
  return merged
}

export function disposeGeometry(g: THREE.BufferGeometry | null | undefined): void {
  g?.dispose()
}
