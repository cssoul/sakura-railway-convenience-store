import { defineStore } from 'pinia'
import { CAMERA_VIEWS } from '../three/core/constants'

export type SceneWeather = 'spring' | 'rain' | 'storm' | 'snow'
export type SceneTimeOfDay = 'morning' | 'day' | 'sunset' | 'night'
export type SceneDoorState = 'closed' | 'opening' | 'open' | 'closing'
export type SceneViewId = keyof typeof CAMERA_VIEWS

export interface SceneState {
  weather: SceneWeather
  timeOfDay: SceneTimeOfDay
  blossomIntensity: number
  petalWind: number
  storeLightIntensity: number
  doorState: SceneDoorState
  /** 相机视角切换请求（nonce 变化触发飞行） */
  viewRequest: { id: SceneViewId; nonce: number }
}

/**
 * 只保存场景状态（不含 Scene / Camera / Renderer / Mesh）。
 * Three.js 对象全部留在渲染层，通过 accessor 读取。
 */
export const useSceneStore = defineStore('scene', {
  state: (): SceneState => ({
    weather: 'spring',
    timeOfDay: 'day',
    blossomIntensity: 1,
    petalWind: 1,
    storeLightIntensity: 1,
    doorState: 'closed',
    viewRequest: { id: 'default', nonce: 0 },
  }),
  actions: {
    setWeather(w: SceneWeather) {
      this.weather = w
    },
    setTimeOfDay(t: SceneTimeOfDay) {
      this.timeOfDay = t
    },
    setBlossomIntensity(v: number) {
      this.blossomIntensity = v
    },
    setPetalWind(v: number) {
      this.petalWind = v
    },
    setStoreLightIntensity(v: number) {
      this.storeLightIntensity = v
    },
    setDoorState(s: SceneDoorState) {
      this.doorState = s
    },
    requestView(id: SceneViewId) {
      this.viewRequest = { id, nonce: this.viewRequest.nonce + 1 }
    },
  },
})
