import * as THREE from 'three'
import { PALETTE } from '../core/constants'
import { toon, registerGlowMaterial } from '../core/toon'
import { GeoMerger, boxGeo, cylGeo, trs } from '../core/geometry'
import { AutoDoor } from './autoDoor'
import { createStoreInterior } from '../interior/storeInterior'
import {
  storeSignTexture,
  fasciaStripeTexture,
  lightboxTexture,
  posterTexture,
  noboriTexture,
  awningTexture,
  entranceMatTexture,
  gravelTexture,
  floorTileTexture,
} from '../materials/textures'

/**
 * 日式街角便利店：墙体 / 玻璃幕墙 / 自动门 / 雨棚 / 招牌 / 灯箱 /
 * 空调外机 / 垃圾桶 / のぼり，绝不只是一个盒子。
 * 本地坐标：店中心为原点，正面朝 +z。静态外观按材质合并。
 */
export interface ConvenienceStore {
  group: THREE.Group
  /** 仅外观（不含内部），供轮廓通道使用 */
  exterior: THREE.Group
  door: AutoDoor
}

export function createConvenienceStore(): ConvenienceStore {
  const g = new THREE.Group()
  g.name = 'convenience-store'
  const exterior = new THREE.Group()
  exterior.name = 'store-exterior'
  g.add(exterior)

  const W = 7.5
  const D = 5.5
  const H = 4.2
  const base = 0.16
  const wallMat = toon(PALETTE.storeWall)
  const frameMat = toon(PALETTE.frameDark)
  const glassMat = new THREE.MeshPhongMaterial({
    color: PALETTE.glassTint,
    transparent: true,
    opacity: 0.22,
    shininess: 110,
    specular: 0xdff1fa,
  })

  const m = new GeoMerger()
  const add = (key: string, w: number, h: number, d: number, x: number, y: number, z: number): void => {
    m.add(key, boxGeo(w, h, d), trs(x, y, z))
  }

  // ---- 基础与楼板 ----
  add('concrete', W + 0.4, base, D + 0.4, 0, base / 2, 0)

  // ---- 墙体（背/左/右） ----
  add('wall', W, H, 0.18, 0, base + H / 2, -D / 2 + 0.09)
  add('wall', 0.18, H, D, -W / 2 + 0.09, base + H / 2, 0)
  add('wall', 0.18, H, D, W / 2 - 0.09, base + H / 2, 0)

  // ---- 天花板 ----
  add('soffit', W - 0.24, 0.1, D - 0.24, 0, 3.86, 0)

  // ---- 正面幕墙（左窗 + 门洞 + 右窗） ----
  const winBottom = 0.55
  const winTop = 3.3
  const winH = winTop - winBottom
  for (const side of [-1, 1]) {
    const cx = side * 2.36
    const w = 2.42
    add('wall', w, winBottom - base, 0.12, cx, base + (winBottom - base) / 2, D / 2 - 0.06)
    // 窗框竖梃
    for (const fx of [cx - w / 2, cx, cx + w / 2]) {
      add('frame', 0.09, winH + 0.1, 0.1, fx, winBottom + winH / 2, D / 2 - 0.08)
    }
    add('frame', w, 0.12, 0.12, cx, winTop + 0.03, D / 2 - 0.08)
  }
  // 上带（遮住天花边缘）
  add('wall', W, 0.5, 0.14, 0, 3.56, D / 2 - 0.07)

  // 门洞边框 + 感应器
  add('frame', 0.12, 3.36, 0.14, -1.18, base + 1.68, D / 2 - 0.07)
  add('frame', 0.12, 3.36, 0.14, 1.18, base + 1.68, D / 2 - 0.07)
  add('frame', 0.34, 0.09, 0.1, 0, 3.44, D / 2 - 0.02)

  // ---- 招牌檐板（三面） ----
  const fasciaY = base + H + 0.48
  const fasciaH = 0.96
  const signTex = storeSignTexture()
  const signMat = toon(0xffffff, { map: signTex })
  signMat.emissive = new THREE.Color(0xffffff)
  signMat.emissiveMap = signTex
  signMat.emissiveIntensity = 0.16
  registerGlowMaterial(signMat, 0.16, 'sign')

  const frontFascia = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, fasciaH, 0.3), [
    toon(PALETTE.fascia),
    toon(PALETTE.fascia),
    toon(PALETTE.fascia),
    toon(PALETTE.fascia),
    signMat,
    toon(PALETTE.fascia),
  ])
  frontFascia.position.set(0, fasciaY, D / 2 + 0.12)
  frontFascia.castShadow = true
  exterior.add(frontFascia)

  m.add('fasciaStripe', boxGeo(0.3, fasciaH, D + 0.4), trs(-W / 2 - 0.2, fasciaY, 0))
  m.add('fasciaStripe', boxGeo(0.3, fasciaH, D + 0.4), trs(W / 2 + 0.2, fasciaY, 0))
  add('fasciaWhite', W + 0.4, fasciaH, 0.3, 0, fasciaY, -D / 2 - 0.12)

  // ---- 屋顶 + 设备 ----
  m.add('roof', boxGeo(W + 0.1, 0.16, D + 0.2), trs(0, base + H + 0.08, 0))
  for (const [ax, az, s] of [
    [1.8, 0.9, 1],
    [-1.5, -1.1, 0.85],
  ] as const) {
    const acy = base + H + 0.16 + 0.36 * s
    add('ac', 1.2 * s, 0.72 * s, 0.88 * s, ax, acy, az)
    m.add('acDark', cylGeo(0.3 * s, 0.3 * s, 0.06, 18), trs(ax, acy + 0.38 * s, az))
    add('acDark', 0.1, 0.14, 0.5, ax + 0.5 * s, acy - 0.3 * s, az + 0.3 * s)
  }
  // 屋顶检修门
  add('ac', 0.85, 1.05, 0.85, -2.6, base + H + 0.16 + 0.52, 1.4)
  // 落水管
  for (const px of [-W / 2 + 0.24, W / 2 - 0.24]) {
    m.add('pipe', cylGeo(0.05, 0.05, base + H, 8), trs(px, (base + H) / 2, -D / 2 - 0.18))
  }

  // ---- 雨棚 ----
  const awningTex = awningTexture()
  const awningMat = toon(0xffffff, { map: awningTex })
  m.add('awningStripe', boxGeo(W + 0.24, 0.1, 1.25), trs(0, 3.3, D / 2 + 0.62))
  m.add('awningStripe', boxGeo(W + 0.24, 0.18, 0.05), trs(0, 3.26, D / 2 + 1.24))

  // ---- 门上灯箱 ----
  const lbTex = lightboxTexture()
  const lbMat = toon(0xffffff, { map: lbTex })
  lbMat.emissive = new THREE.Color(0xffffff)
  lbMat.emissiveMap = lbTex
  lbMat.emissiveIntensity = 0.45
  registerGlowMaterial(lbMat, 0.45, 'sign')
  const lightbox = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 0.12), [
    toon(0x1f4f8f),
    toon(0x1f4f8f),
    toon(0x1f4f8f),
    toon(0x1f4f8f),
    lbMat,
    toon(0x1f4f8f),
  ])
  lightbox.position.set(0, 3.62, D / 2 + 0.02)
  exterior.add(lightbox)

  // ---- のぼり旗 ----
  const nobori1 = noboriTexture('春の新生活', '#d8453e')
  const nobori2 = noboriTexture('サクラマート', '#2e6db4')
  for (const [nx, tex] of [
    [-2.7, nobori1],
    [2.7, nobori2],
  ] as const) {
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 1.85),
      toon(0xffffff, { map: tex, side: THREE.DoubleSide, alphaTest: 0.05 }),
    )
    flag.position.set(nx, 2.25, D / 2 + 1.3)
    flag.castShadow = true
    exterior.add(flag)
    const bar = new THREE.Mesh(boxGeo(0.03, 0.03, 2.0), frameMat)
    bar.position.set(nx, 3.22, D / 2 + 0.75)
    bar.rotation.x = Math.PI / 2
    exterior.add(bar)
  }

  // ---- 窗内海报 ----
  for (const [px, v] of [
    [-2.36, 0],
    [2.36, 1],
  ] as const) {
    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(0.66, 0.88),
      toon(0xffffff, { map: posterTexture(v) }),
    )
    poster.position.set(px, 1.95, D / 2 - 0.22)
    exterior.add(poster)
  }
  // 外墙小看板（右侧）
  const sideBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 0.72),
    toon(0xffffff, { map: posterTexture(2) }),
  )
  sideBoard.position.set(W / 2 + 0.01, 2.3, 1.2)
  sideBoard.rotation.y = Math.PI / 2
  exterior.add(sideBoard)

  // ---- 入口地垫 ----
  const matTex = entranceMatTexture()
  m.add('entryMat', boxGeo(2.0, 0.035, 0.95), trs(0, 0.02, D / 2 + 0.62))

  // ---- 垃圾桶（门左侧，靠贩卖机方向，颜色不同保持独立） ----
  const binColors = [0x3f7fbf, 0x6b7280, 0x4f9e5f]
  binColors.forEach((c, i) => {
    const bx = -2.9 + i * 0.62
    const bin = new THREE.Mesh(cylGeo(0.24, 0.21, 0.72, 12), toon(c))
    bin.position.set(bx, 0.38, D / 2 + 0.55)
    bin.castShadow = true
    exterior.add(bin)
    const lid = new THREE.Mesh(cylGeo(0.26, 0.26, 0.07, 12), toon(0x2c3138))
    lid.position.set(bx, 0.77, D / 2 + 0.55)
    exterior.add(lid)
    const slot = new THREE.Mesh(boxGeo(0.26, 0.05, 0.03), toon(0x1c2026))
    slot.position.set(bx, 0.79, D / 2 + 0.42)
    exterior.add(slot)
  })

  // ---- 地板（瓷砖，单独保留下来用于内部组） ----
  const floorTex = floorTileTexture()
  const floor = new THREE.Mesh(boxGeo(W - 0.2, 0.06, D - 0.2), toon(PALETTE.interiorFloor, { map: floorTex }))
  floor.position.set(0, base + 0.02, 0)
  floor.receiveShadow = true
  g.add(floor)

  // ---- 玻璃（透明，保持独立） ----
  for (const side of [-1, 1]) {
    const glass = new THREE.Mesh(boxGeo(2.42 - 0.06, winH - 0.04, 0.03), glassMat)
    glass.position.set(side * 2.36, winBottom + winH / 2, D / 2 - 0.09)
    exterior.add(glass)
  }

  // ---- 自动门 ----
  const door = new AutoDoor({
    width: 2.06,
    height: 3.1,
    glassMat,
    frameMat,
    baseY: base + 0.02,
  })
  door.group.position.set(0, 0, D / 2 - 0.04)
  exterior.add(door.group)

  // ---- 合并输出外观静态件 ----
  const awningWhiteMat = toon(0xeef1ef)
  const built = [
    m.build('concrete', toon(0xc9c6bd)),
    m.build('wall', wallMat),
    m.build('soffit', toon(PALETTE.storeSoffit)),
    m.build('frame', frameMat),
    m.build('fasciaStripe', toon(PALETTE.fascia, { map: fasciaStripeTexture(true) })),
    m.build('fasciaWhite', toon(PALETTE.fascia)),
    m.build('roof', toon(PALETTE.roofGravel, { map: gravelTexture() })),
    m.build('ac', toon(0xcfd3d5)),
    m.build('acDark', toon(0x8f959a)),
    m.build('pipe', toon(0xdadcd8), false),
    m.build('awningBase', awningWhiteMat),
    m.build('awningStripe', awningMat),
    m.build('entryMat', toon(0x3f6f52, { map: matTex })),
  ]
  for (const mesh of built) if (mesh) exterior.add(mesh)

  // ---- 内部（不属于外观组：不参与轮廓通道） ----
  for (const child of [...g.children]) {
    if (child !== exterior) exterior.add(child)
  }
  const interior = createStoreInterior({ glassMat })
  g.add(interior)

  // 世界坐标定位
  g.position.set(2.5, 0, -3.45)

  return { group: g, exterior, door }
}
