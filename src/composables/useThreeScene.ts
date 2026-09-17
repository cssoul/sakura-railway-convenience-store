import * as THREE from 'three'
import { watch } from 'vue'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

import { useSceneStore } from '../stores/scene'
import { buildWorld } from '../three/world'
import type { WorldHandles } from '../three/world'
import { resolveParams } from '../three/effects/weather'
import { CAMERA_VIEWS } from '../three/core/constants'
import { createCameraRig } from './useCamera'
import type { CameraRig } from './useCamera'
import { AnimationLoop } from './useAnimation'
import { disposeTextures } from '../three/materials/textures'
import { disposeToonMaterials, disposeGlows } from '../three/core/toon'

/** 初始化整个 Three.js 场景；返回清理函数 */
export function initThreeScene(container: HTMLElement): () => void {
  const store = useSceneStore()

  // ---- 渲染器 ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  const pixelRatio = Math.min(window.devicePixelRatio, 1.5)
  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.shadowMap.autoUpdate = false
  renderer.toneMapping = THREE.NoToneMapping
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  // ---- 世界 ----
  const world: WorldHandles = buildWorld(scene, () => store.$state)

  // ---- 相机与控制 ----
  const rig: CameraRig = createCameraRig(container)

  // ---- 后期：直接渲染 + 输出转换（不用边缘检测描边，避免半分辨率光晕） ----
  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(pixelRatio)
  composer.setSize(container.clientWidth, container.clientHeight)
  composer.addPass(new RenderPass(scene, rig.camera))
  composer.addPass(new OutputPass())

  // ---- 循环 ----
  let shadowTimer = 0
  let applyTimer = 0
  let lastViewNonce = store.viewRequest.nonce
  const loop = new AnimationLoop((dt) => {
    rig.update(dt)
    // 面板状态 → 天气/花瓣/相机（轮询同步，setTarget 幂等）
    applyTimer += dt
    if (applyTimer > 0.25) {
      applyTimer = 0
      world.weather.setTarget(resolveParams(store.weather, store.timeOfDay))
      // 花瓣 = 用户强度 × 天气因子（雨天/雪天无花瓣）
      world.petals.setFactor(store.blossomIntensity * world.weather.petalFactor)
      if (store.viewRequest.nonce !== lastViewNonce) {
        lastViewNonce = store.viewRequest.nonce
        const view = CAMERA_VIEWS[store.viewRequest.id] ?? CAMERA_VIEWS.default
        rig.flyTo(new THREE.Vector3(...view.pos), new THREE.Vector3(...view.target))
      }
    }
    // 静态场景为主：阴影每 0.35s 刷新一次即可（花瓣/云不投影，树影变化缓慢）
    shadowTimer += dt
    if (shadowTimer > 0.35) {
      shadowTimer = 0
      renderer.shadowMap.needsUpdate = true
    }
    composer.render()
  })
  for (const fn of world.updatables) loop.register(fn)
  loop.start()

  // ---- 自动门状态同步到 Pinia ----
  world.door.onStateChange = (s) => store.setDoorState(s)

  // ---- Pinia → 天气/花瓣（初次应用，后续由动画循环轮询同步） ----
  world.weather.setTarget(resolveParams(store.weather, store.timeOfDay))
  world.petals.setFactor(store.blossomIntensity)

  // ---- 自适应尺寸 ----
  const resize = (): void => {
    const w = container.clientWidth
    const h = Math.max(1, container.clientHeight)
    renderer.setSize(w, h)
    composer.setSize(w, h)
    rig.resize(w, h)
    renderer.shadowMap.needsUpdate = true
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)

  // ---- 清理 ----
  return () => {
    loop.stop()
    observer.disconnect()
    world.door.onStateChange = null
    world.dispose()
    rig.dispose()
    composer.dispose()
    renderer.dispose()
    container.removeChild(renderer.domElement)
    disposeGlows()
    disposeToonMaterials()
    disposeTextures()
  }
}
