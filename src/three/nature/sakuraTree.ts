import * as THREE from 'three'
import { PALETTE } from '../core/constants'
import { toon } from '../core/toon'
import treeModelUrl from '../assets/sakura-tree.json?url'

/**
 * 巨大樱花树：Blender 建模导出的网格（主干/三级分枝/花簇/五瓣花朵）。
 * JSON 内为 Blender(Z-up) 坐标，加载时已转换为 Three.js(Y-up)。
 * 花簇与花朵带轻微风摆（顶点着色器注入）。
 */
export interface SakuraTree {
  group: THREE.Group
  update(elapsed: number): void
  dispose(): void
}

const swayUniform = { value: 0 }

/** 花簇/花朵的风摆：在顶点阶段按位置相位偏移 */
function injectSway(mat: THREE.MeshToonMaterial): void {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSway = swayUniform
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uSway;')
      .replace(
        '#include <begin_vertex>',
        [
          '#include <begin_vertex>',
          'float swayPh = position.x * 2.1 + position.y * 1.6 + position.z * 2.7;',
          'transformed += vec3(sin(uSway * 1.35 + swayPh), sin(uSway * 1.05 + swayPh * 1.31), cos(uSway * 1.2 + swayPh)) * 0.035;',
        ].join('\n'),
      )
  }
}

function buildGeometry(mesh: { position: number[]; normal: number[]; index: number[]; color?: number[] }): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(mesh.position, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.normal, 3))
  g.setIndex(mesh.index)
  if (mesh.color) {
    g.setAttribute('color', new THREE.Float32BufferAttribute(mesh.color, 3))
  }
  return g
}

interface MeshData {
  name: string
  mat: string
  position: number[]
  normal: number[]
  index: number[]
  color?: number[]
}

interface TreeJson {
  meshes: MeshData[]
}

export function createSakuraTree(
  position: { x: number; z: number },
): SakuraTree {
  const group = new THREE.Group()
  group.name = 'sakura-tree'
  group.position.set(position.x, 0, position.z)

  // 材质（与场景三渲二风格一致）
  const barkMat = toon(PALETTE.trunk)
  const blossomMat = toon(0xffffff, { vertexColors: true })
  const petalMat = toon(0xfff3f7)
  const coreMat = toon(0xf2a86e)
  for (const m of [blossomMat, petalMat, coreMat]) injectSway(m)

  const materials: THREE.MeshToonMaterial[] = [barkMat, blossomMat, petalMat, coreMat]
  const geometries: THREE.BufferGeometry[] = []

  fetch(treeModelUrl)
    .then((r) => r.json() as Promise<TreeJson>)
    .then((data) => {
      for (const mesh of data.meshes) {
        const geo = buildGeometry(mesh)
        geometries.push(geo)
        const m = new THREE.Mesh(
          geo,
          mesh.mat === 'Bark' ? barkMat : mesh.mat === 'Blossom' ? blossomMat : mesh.mat === 'Petal' ? petalMat : coreMat,
        )
        m.name = mesh.name
        m.castShadow = true
        m.receiveShadow = mesh.mat === 'Bark'
        group.add(m)
      }
    })
    .catch((e) => console.warn('sakura tree load failed:', e))

  // 加载期间占位位姿（隐形，保持 group 可用）
  group.visible = true

  return {
    group,
    update(elapsed) {
      swayUniform.value = elapsed
    },
    dispose() {
      for (const g of geometries) g.dispose()
    },
  }
}
