import * as THREE from 'three'
import type { SkyDome } from './sky'
import { applyGlowChannels } from '../core/toon'

/**
 * 天气系统：所有环境参数集中在这里。
 * 第一版只精调 spring-day；其余预设保证架构可用，切换不会破坏场景。
 * 未来 Rain/Night 的雨滴、湿润地面等效果在此扩展。
 */
export type WeatherKind = 'spring' | 'rain' | 'storm' | 'snow'
export type TimeOfDayKind = 'morning' | 'day' | 'sunset' | 'night'

export interface WeatherParams {
  skyTop: THREE.Color
  skyBottom: THREE.Color
  sunColor: THREE.Color
  sunIntensity: number
  sunPos: THREE.Vector3
  hemiSky: THREE.Color
  hemiGround: THREE.Color
  hemiIntensity: number
  fogColor: THREE.Color
  fogNear: number
  fogFar: number
  storeGlow: number
  lampGlow: number
  signGlow: number
  petalFactor: number
  /** 雨/雪粒子开关与地面效果（0~1） */
  rainFactor: number
  snowFactor: number
  wetness: number
  snowGround: number
}

type ColorLike = number | THREE.Color

function C(v: ColorLike): THREE.Color {
  return v instanceof THREE.Color ? v.clone() : new THREE.Color(v)
}

interface WeatherInput {
  skyTop: ColorLike
  skyBottom: ColorLike
  sunColor: ColorLike
  sunIntensity: number
  sunPos: THREE.Vector3
  hemiSky?: ColorLike
  hemiGround?: ColorLike
  hemiIntensity?: number
  fogColor?: ColorLike
  fogNear?: number
  fogFar?: number
  storeGlow?: number
  lampGlow?: number
  signGlow?: number
  petalFactor?: number
  rainFactor?: number
  snowFactor?: number
  wetness?: number
  snowGround?: number
}

function params(p: WeatherInput): WeatherParams {
  return {
    skyTop: C(p.skyTop),
    skyBottom: C(p.skyBottom),
    sunColor: C(p.sunColor),
    sunIntensity: p.sunIntensity,
    sunPos: p.sunPos.clone(),
    hemiSky: C(p.hemiSky ?? 0xbfe3ff),
    hemiGround: C(p.hemiGround ?? 0xd8c9a8),
    hemiIntensity: p.hemiIntensity ?? 1.05,
    fogColor: C(p.fogColor ?? p.skyBottom),
    fogNear: p.fogNear ?? 58,
    fogFar: p.fogFar ?? 150,
    storeGlow: p.storeGlow ?? 1,
    lampGlow: p.lampGlow ?? 0,
    signGlow: p.signGlow ?? 1,
    petalFactor: p.petalFactor ?? 0,
    rainFactor: p.rainFactor ?? 0,
    snowFactor: p.snowFactor ?? 0,
    wetness: p.wetness ?? 0,
    snowGround: p.snowGround ?? 0,
  }
}

const SUN_DAY = new THREE.Vector3(18, 26, 15)

const PRESETS: Record<string, WeatherParams> = {
  'spring-morning': params({
    skyTop: 0x5aa7e6,
    skyBottom: 0xffe8c4,
    sunColor: 0xffd9a0,
    sunIntensity: 2.4,
    sunPos: new THREE.Vector3(24, 9, 14),
    hemiSky: 0xcfe8ff,
    hemiGround: 0xdcc9a5,
    hemiIntensity: 0.85,
    fogColor: 0xffe8c4,
    storeGlow: 0.85,
    lampGlow: 0.1,
    signGlow: 0.9,
    petalFactor: 1,
  }),
  'spring-day': params({
    skyTop: 0x63b4ec,
    skyBottom: 0xeaf7f5,
    sunColor: 0xfff3dc,
    sunIntensity: 2.9,
    sunPos: SUN_DAY,
    fogColor: 0xeaf7f5,
    storeGlow: 1,
    lampGlow: 0,
    signGlow: 1,
    petalFactor: 1,
  }),
  'spring-sunset': params({
    skyTop: 0x7d86c8,
    skyBottom: 0xfcc9a0,
    sunColor: 0xffb26b,
    sunIntensity: 2.3,
    sunPos: new THREE.Vector3(24, 9, 12),
    hemiSky: 0xf3c9a2,
    hemiGround: 0x9a8468,
    hemiIntensity: 0.85,
    fogColor: 0xf5cba2,
    storeGlow: 1.25,
    lampGlow: 0.55,
    signGlow: 1.15,
    petalFactor: 1,
  }),
  'spring-night': params({
    skyTop: 0x14213f,
    skyBottom: 0x2c3e63,
    sunColor: 0x9fb8ff,
    sunIntensity: 0.85,
    sunPos: new THREE.Vector3(-16, 22, -10),
    hemiSky: 0x35496e,
    hemiGround: 0x232c3a,
    hemiIntensity: 0.5,
    fogColor: 0x27344e,
    storeGlow: 1.9,
    lampGlow: 1.6,
    signGlow: 1.5,
    petalFactor: 0.4,
  }),
  'rain-day': params({
    skyTop: 0x8d99a5,
    skyBottom: 0xc4ccd2,
    sunColor: 0xdfe6ec,
    sunIntensity: 1.35,
    sunPos: new THREE.Vector3(10, 24, 10),
    hemiSky: 0xb9c2c9,
    hemiGround: 0x8e9296,
    hemiIntensity: 0.9,
    fogColor: 0xc4ccd2,
    fogNear: 40,
    fogFar: 120,
    storeGlow: 1.3,
    lampGlow: 0.5,
    signGlow: 1.1,
    rainFactor: 1,
    wetness: 1,
  }),
  'rain-night': params({
    skyTop: 0x1d2733,
    skyBottom: 0x333e4d,
    sunColor: 0x8fa3b8,
    sunIntensity: 0.7,
    sunPos: new THREE.Vector3(-12, 20, -8),
    hemiSky: 0x35404c,
    hemiGround: 0x23292f,
    hemiIntensity: 0.45,
    fogColor: 0x2b3540,
    fogNear: 36,
    fogFar: 110,
    storeGlow: 2.0,
    lampGlow: 1.7,
    signGlow: 1.5,
    rainFactor: 1,
    wetness: 1,
  }),
  'snow-day': params({
    skyTop: 0x9fb4c4,
    skyBottom: 0xe9eef2,
    sunColor: 0xe8f0f6,
    sunIntensity: 1.5,
    sunPos: new THREE.Vector3(8, 22, 8),
    hemiSky: 0xc2cdd6,
    hemiGround: 0x9aa0a6,
    hemiIntensity: 0.85,
    fogColor: 0xe9eef2,
    fogNear: 42,
    fogFar: 125,
    storeGlow: 1.4,
    lampGlow: 0.4,
    signGlow: 1.2,
    snowFactor: 1,
    snowGround: 0.85,
  }),
  'snow-night': params({
    skyTop: 0x2a3547,
    skyBottom: 0x46536b,
    sunColor: 0xa8bdd8,
    sunIntensity: 0.7,
    sunPos: new THREE.Vector3(-10, 20, -8),
    hemiSky: 0x3a4759,
    hemiGround: 0x2a313b,
    hemiIntensity: 0.5,
    fogColor: 0x39445a,
    fogNear: 38,
    fogFar: 115,
    storeGlow: 1.9,
    lampGlow: 1.5,
    signGlow: 1.4,
    snowFactor: 1,
    snowGround: 0.5,
  }),
  'storm-night': params({
    skyTop: 0x1c2430,
    skyBottom: 0x39434f,
    sunColor: 0x8fa3b8,
    sunIntensity: 0.7,
    sunPos: new THREE.Vector3(-12, 20, -8),
    hemiSky: 0x3c4652,
    hemiGround: 0x23292f,
    hemiIntensity: 0.45,
    fogColor: 0x2c353f,
    fogNear: 34,
    fogFar: 110,
    storeGlow: 2.1,
    lampGlow: 1.8,
    signGlow: 1.6,
    rainFactor: 1,
    wetness: 1,
  }),
}

export function resolveParams(weather: string, timeOfDay: string): WeatherParams {
  const key = `${weather}-${timeOfDay}`
  // 必须返回克隆：预设对象是共享单例，直接引用会被 update() 的原地 lerp 污染
  if (PRESETS[key]) return cloneParams(PRESETS[key])
  if (weather === 'storm') return cloneParams(timeOfDay === 'night' ? PRESETS['storm-night'] : PRESETS['rain-day'])
  if (weather === 'rain') return cloneParams(timeOfDay === 'night' ? PRESETS['rain-night'] : PRESETS['rain-day'])
  if (weather === 'snow') return cloneParams(PRESETS['snow-day'])
  return cloneParams(PRESETS['spring-day'])
}

export interface WeatherDeps {
  sky: SkyDome
  scene: THREE.Scene
  sun: THREE.DirectionalLight
  hemi: THREE.HemisphereLight
}

type LightChannel = 'store' | 'lamp' | 'sign'

interface LightEntry {
  light: THREE.Light
  base: number
  channel: LightChannel
}

/** 地面材质：雨天变深变湿、雪天覆白 */
type SurfaceMaterial = THREE.MeshToonMaterial | THREE.MeshPhongMaterial

interface SurfaceEntry {
  mat: SurfaceMaterial
  baseColor: THREE.Color
  wetColor: THREE.Color | null
  snowColor: THREE.Color | null
  baseOpacity: number
  wetOpacity: number | null
}

const lerp = THREE.MathUtils.lerp

export class WeatherSystem {
  private current: WeatherParams
  private target: WeatherParams
  private deps: WeatherDeps
  private fog: THREE.Fog
  private lights: LightEntry[] = []
  private surfaces: SurfaceEntry[] = []

  constructor(deps: WeatherDeps) {
    this.deps = deps
    // current 不能直接引用预设单例（会被 update 的原地 lerp 污染），克隆一份
    this.current = cloneParams(resolveParams('spring', 'day'))
    this.target = cloneParams(this.current)
    this.fog = new THREE.Fog(this.current.fogColor.getHex(), this.current.fogNear, this.current.fogFar)
    deps.scene.fog = this.fog
    this.apply(this.current)
  }

  /** 注册动态灯（如店内主光/路灯），亮度随天气因子缩放 */
  registerLight(light: THREE.Light, channel: LightChannel = 'store'): void {
    this.lights.push({ light, base: light.intensity, channel })
  }

  /** 注册地面材质：受雨天湿润 / 雪天覆白影响 */
  registerSurface(
    mat: SurfaceMaterial,
    opts: { wet?: ColorLike; snow?: ColorLike; wetOpacity?: number } = {},
  ): void {
    this.surfaces.push({
      mat,
      baseColor: mat.color.clone(),
      wetColor: opts.wet !== undefined ? C(opts.wet) : null,
      snowColor: opts.snow !== undefined ? C(opts.snow) : null,
      baseOpacity: mat.opacity,
      wetOpacity: opts.wetOpacity ?? null,
    })
  }

  get rainFactor(): number {
    return this.current.rainFactor
  }

  get snowFactor(): number {
    return this.current.snowFactor
  }

  get petalFactor(): number {
    return this.current.petalFactor
  }

  setTarget(p: WeatherParams): void {
    this.target = cloneParams(p)
  }

  /** 平滑过渡到目标天气 */
  update(dt: number): void {
    const k = 1 - Math.exp(-dt * 2.2)
    const c = this.current
    const t = this.target
    c.skyTop.lerp(t.skyTop, k)
    c.skyBottom.lerp(t.skyBottom, k)
    c.sunColor.lerp(t.sunColor, k)
    c.sunIntensity = lerp(c.sunIntensity, t.sunIntensity, k)
    c.sunPos.lerp(t.sunPos, k)
    c.hemiSky.lerp(t.hemiSky, k)
    c.hemiGround.lerp(t.hemiGround, k)
    c.hemiIntensity = lerp(c.hemiIntensity, t.hemiIntensity, k)
    c.fogColor.lerp(t.fogColor, k)
    c.fogNear = lerp(c.fogNear, t.fogNear, k)
    c.fogFar = lerp(c.fogFar, t.fogFar, k)
    c.storeGlow = lerp(c.storeGlow, t.storeGlow, k)
    c.lampGlow = lerp(c.lampGlow, t.lampGlow, k)
    c.signGlow = lerp(c.signGlow, t.signGlow, k)
    c.petalFactor = lerp(c.petalFactor, t.petalFactor, k)
    c.rainFactor = lerp(c.rainFactor, t.rainFactor, k)
    c.snowFactor = lerp(c.snowFactor, t.snowFactor, k)
    c.wetness = lerp(c.wetness, t.wetness, k)
    c.snowGround = lerp(c.snowGround, t.snowGround, k)
    this.apply(c)
  }

  private apply(p: WeatherParams): void {
    this.deps.sky.setColors(p.skyTop, p.skyBottom)
    this.deps.scene.background = null
    this.fog.color.copy(p.fogColor)
    this.fog.near = p.fogNear
    this.fog.far = p.fogFar
    this.deps.sun.color.copy(p.sunColor)
    this.deps.sun.intensity = p.sunIntensity
    this.deps.sun.position.copy(p.sunPos)
    this.deps.hemi.color.copy(p.hemiSky)
    this.deps.hemi.groundColor.copy(p.hemiGround)
    this.deps.hemi.intensity = p.hemiIntensity
    applyGlowChannels(p.storeGlow, p.lampGlow, p.signGlow)
    for (const entry of this.lights) {
      const f = entry.channel === 'store' ? p.storeGlow : entry.channel === 'lamp' ? p.lampGlow : p.signGlow
      entry.light.intensity = entry.base * f
    }
    for (const s of this.surfaces) {
      s.mat.color.copy(s.baseColor)
      if (s.wetColor) s.mat.color.lerp(s.wetColor, p.wetness)
      if (s.snowColor) s.mat.color.lerp(s.snowColor, p.snowGround)
      if (s.wetOpacity !== null) s.mat.opacity = s.baseOpacity + (s.wetOpacity - s.baseOpacity) * p.wetness
    }
  }
}

function cloneParams(p: WeatherParams): WeatherParams {
  return {
    skyTop: p.skyTop.clone(),
    skyBottom: p.skyBottom.clone(),
    sunColor: p.sunColor.clone(),
    sunIntensity: p.sunIntensity,
    sunPos: p.sunPos.clone(),
    hemiSky: p.hemiSky.clone(),
    hemiGround: p.hemiGround.clone(),
    hemiIntensity: p.hemiIntensity,
    fogColor: p.fogColor.clone(),
    fogNear: p.fogNear,
    fogFar: p.fogFar,
    storeGlow: p.storeGlow,
    lampGlow: p.lampGlow,
    signGlow: p.signGlow,
    petalFactor: p.petalFactor,
    rainFactor: p.rainFactor,
    snowFactor: p.snowFactor,
    wetness: p.wetness,
    snowGround: p.snowGround,
  }
}
