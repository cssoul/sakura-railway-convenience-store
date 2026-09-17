import * as THREE from 'three'

/** 三步渐变贴图：明显但柔和的赛璐璐明暗分层 */
let gradientMap: THREE.DataTexture | null = null

export function getGradientMap(): THREE.DataTexture {
  if (!gradientMap) {
    const steps = new Uint8Array([96, 180, 255])
    gradientMap = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat)
    gradientMap.minFilter = THREE.NearestFilter
    gradientMap.magFilter = THREE.NearestFilter
    gradientMap.generateMipmaps = false
    gradientMap.needsUpdate = true
  }
  return gradientMap
}

export interface ToonOptions {
  map?: THREE.Texture | null
  emissive?: number
  emissiveIntensity?: number
  transparent?: boolean
  opacity?: number
  alphaTest?: number
  side?: THREE.Side
  vertexColors?: boolean
}

const cache = new Map<string, THREE.MeshToonMaterial>()
const allMaterials: THREE.MeshToonMaterial[] = []

/** 带缓存的 toon 材质工厂：同参数共享同一份材质 */
export function toon(color: number | string, opts: ToonOptions = {}): THREE.MeshToonMaterial {
  const key = `${color}|${opts.map?.uuid ?? '-'}|${opts.emissive ?? '-'}|${opts.emissiveIntensity ?? '-'}|${opts.transparent ?? '-'}|${opts.opacity ?? '-'}|${opts.alphaTest ?? '-'}|${opts.side ?? '-'}|${opts.vertexColors ?? '-'}`
  const hit = cache.get(key)
  if (hit) return hit

  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: getGradientMap(),
    map: opts.map ?? null,
  })
  if (opts.emissive !== undefined) m.emissive = new THREE.Color(opts.emissive)
  if (opts.emissiveIntensity !== undefined) m.emissiveIntensity = opts.emissiveIntensity
  if (opts.transparent) m.transparent = true
  if (opts.opacity !== undefined) m.opacity = opts.opacity
  if (opts.alphaTest !== undefined) m.alphaTest = opts.alphaTest
  if (opts.side !== undefined) m.side = opts.side
  if (opts.vertexColors) m.vertexColors = true

  cache.set(key, m)
  allMaterials.push(m)
  return m
}

export function disposeToonMaterials(): void {
  for (const m of allMaterials) m.dispose()
  allMaterials.length = 0
  cache.clear()
}

/**
 * 发光材质注册表：WeatherSystem 按天气统一调 emissiveIntensity。
 * day 值为春日白天的基准亮度，channel 区分受天气影响的方式。
 */
export type GlowChannel = 'store' | 'lamp' | 'sign'

export interface GlowEntry {
  material: THREE.MeshToonMaterial
  dayIntensity: number
  channel: GlowChannel
}

const glowEntries: GlowEntry[] = []

export function registerGlow(
  color: number,
  emissive: number,
  dayIntensity: number,
  channel: GlowChannel = 'sign',
  opts: ToonOptions = {},
): THREE.MeshToonMaterial {
  const m = toon(color, { ...opts, emissive, emissiveIntensity: dayIntensity })
  glowEntries.push({ material: m, dayIntensity, channel })
  return m
}

/** 把已有材质（常带 map/emissiveMap）登记为发光材质 */
export function registerGlowMaterial(
  material: THREE.MeshToonMaterial,
  dayIntensity: number,
  channel: GlowChannel = 'sign',
): void {
  glowEntries.push({ material, dayIntensity, channel })
}

export function applyGlowChannels(store: number, lamp: number, sign: number): void {
  for (const e of glowEntries) {
    const f = e.channel === 'store' ? store : e.channel === 'lamp' ? lamp : sign
    e.material.emissiveIntensity = e.dayIntensity * f
  }
}

export function disposeGlows(): void {
  glowEntries.length = 0
}
