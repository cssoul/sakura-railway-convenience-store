import * as THREE from 'three'
import { createSky } from './effects/sky'
import { createLights } from './core/lights'
import { WeatherSystem } from './effects/weather'
import { Precipitation } from './effects/precipitation'
import { createGround } from './street/ground'
import { createRoad } from './street/road'
import { createRailway } from './railway/railway'
import { createSakuraTree } from './nature/sakuraTree'
import { createPlants } from './nature/plants'
import { createConvenienceStore } from './buildings/convenienceStore'
import type { AutoDoor } from './buildings/autoDoor'
import { createHouses } from './buildings/houses'
import { createUtilityPoles } from './street/utilityPole'
import { createStreetProps } from './street/streetProps'
import { FallingPetals, createGroundPetals } from './effects/petals'
import { LAYOUT } from './core/constants'
import type { SceneState } from '../stores/scene'

export interface WorldHandles {
  root: THREE.Group
  door: AutoDoor
  weather: WeatherSystem
  petals: FallingPetals
  updatables: ((dt: number, elapsed: number) => void)[]
  dispose(): void
}

/** 组装整个微缩世界：返回渲染循环需要的句柄 */
export function buildWorld(scene: THREE.Scene, getState: () => SceneState): WorldHandles {
  const root = new THREE.Group()
  root.name = 'diorama'

  const sky = createSky()
  scene.add(sky.mesh)

  const lights = createLights(scene)

  const ground = createGround()
  root.add(ground.group)
  root.add(createRailway())

  const tree = createSakuraTree(LAYOUT.tree)
  root.add(tree.group)

  root.add(createPlants())

  const store = createConvenienceStore()
  root.add(store.group)

  const houses = createHouses()
  root.add(houses)
  const poles = createUtilityPoles()
  root.add(poles)
  const road = createRoad()
  root.add(road.group)
  const props = createStreetProps()
  root.add(props)

  root.add(createGroundPetals())
  const petals = new FallingPetals(240)
  root.add(petals.mesh)

  const precip = new Precipitation()
  root.add(precip.rain)
  root.add(precip.snow)

  scene.add(root)

  // ---- 天气系统 ----
  const weather = new WeatherSystem({ sky, scene, sun: lights.sun, hemi: lights.hemi })
  // 店内 PointLight 注册给天气（店门灯光/夜间暖光）
  store.group.traverse((obj) => {
    if ((obj as THREE.PointLight).isPointLight) {
      weather.registerLight(obj as THREE.PointLight, 'store')
    }
  })
  // 地面材质：雨天变湿、雪天覆白
  for (const m of ground.grassMats) {
    weather.registerSurface(m, { snow: 0xdfe9e2 })
  }
  weather.registerSurface(road.asphaltMat, { wet: 0x2e3238 })
  weather.registerSurface(road.puddleMat, { wetOpacity: 0.85 })

  const updatables: ((dt: number, elapsed: number) => void)[] = [
    (dt, elapsed) => {
      weather.update(dt)
      petals.update(dt, elapsed, getState().petalWind)
      precip.setRain(weather.rainFactor)
      precip.setSnow(weather.snowFactor)
      precip.update(dt, elapsed)
      tree.update(elapsed)
      store.door.update(dt)
    },
  ]

  return {
    root,
    door: store.door,
    weather,
    petals,
    updatables,
    dispose() {
      scene.remove(root)
      scene.remove(sky.mesh)
      sky.dispose()
      precip.dispose()
      lights.dispose()
    },
  }
}
