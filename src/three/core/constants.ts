/**
 * 世界常量：边界、布局坐标、全局色板。
 * 所有模块共享同一份布局，避免各模块坐标对不上。
 */

export const GROUND = { width: 24, depth: 18 } as const

export const BOUNDS = { minX: -12, maxX: 12, minZ: -9, maxZ: 9 } as const

/** 场景布局（世界坐标，x 向右，z 朝观察者） */
export const LAYOUT = {
  /** 前景铁轨中心线 */
  railwayZ: 6.2,
  railGauge: 1.1,
  ballastWidth: 3.4,
  ballastHeight: 0.12,

  /** 社区道路（z 区间） */
  roadNorth: 3.4,
  roadSouth: 0.2,
  sidewalkNorth: [3.4, 4.4] as const,
  sidewalkSouth: [-0.8, 0.2] as const,
  walkHeight: 0.07,
  guardRailZ: 4.72,
  southGuardZ: -0.74,
  /** 行人跨越铁轨的小路口 */
  crossingX: -10.3,
  /** 斑马线位置 */
  zebraX: -1.6,

  store: { x: 2.5, z: -3.45, w: 7.5, d: 5.5, h: 4.2 },
  tree: { x: -4.6, z: -1.2 },

  houses: [
    { x: 7.9, z: -7.35, rot: 0.06, w: 5.6, d: 4.6, wallH: 5.6, roof: 'gable' as const },
    { x: -7.7, z: -7.1, rot: -0.08, w: 5.2, d: 4.4, wallH: 3.1, roof: 'hip' as const },
    { x: -1.2, z: -8.35, rot: 0.04, w: 4.6, d: 3.8, wallH: 5.3, roof: 'gable' as const },
  ],

  poles: [
    { x: -9.2, z: 4.15 },
    { x: 6.8, z: 4.15 },
    { x: 9.6, z: 4.15 },
  ],
  poleHeight: 8.6,

  camera: {
    pos: [16.8, 11.5, 26.0] as const,
    target: [-1.4, 3.1, 0.2] as const,
    fov: 38,
  },
} as const

/** 面板视角预设（pos/target 供相机飞行） */
export const CAMERA_VIEWS = {
  default: { label: '默认视角', pos: [16.8, 11.5, 26.0], target: [-1.4, 3.1, 0.2] },
  store: { label: '店门前', pos: [9.5, 3.8, 11.0], target: [2.6, 1.6, -2.2] },
  sakura: { label: '樱花树下', pos: [2.6, 5.2, 4.6], target: [-4.2, 7.0, -1.6] },
  railway: { label: '铁轨视角', pos: [10.5, 2.0, 12.5], target: [-5.0, 1.2, 6.2] },
  bird: { label: '空中鸟瞰', pos: [1.0, 27.0, 7.5], target: [0.0, 0.0, -0.6] },
} as const

/** 全局色板（春日白天 · 赛璐璐动画配色） */
export const PALETTE = {
  skyTop: 0x63b4ec,
  skyBottom: 0xeaf7f5,
  sun: 0xfff3dc,

  grass: 0x8fbd76,
  grassLight: 0xa6d18c,
  grassDark: 0x79aa63,
  dirt: 0xb59a76,
  soil: 0x6f5b46,

  asphalt: 0x4b5058,
  roadLine: 0xf1f3ee,
  sidewalk: 0xccd0d3,
  curb: 0x9ba1a7,
  pavement: 0xd6d8d2,
  gutter: 0x3f444b,
  grate: 0x2c3036,

  ballast: 0x9c968d,
  ballastDark: 0x7b756d,
  sleeper: 0x6e5744,
  railDark: 0x474c53,
  railHead: 0x9aa4ae,

  storeWall: 0xf6f3ea,
  storeSoffit: 0xf1eee4,
  fascia: 0xf8f7f2,
  signGreen: 0x2fae60,
  signBlue: 0x2e6db4,
  signRed: 0xd8453e,
  awningTeal: 0x2f9e9e,
  roofGravel: 0xa9adaf,
  frameDark: 0x3c4147,
  glassTint: 0xa9d3e6,
  interiorFloor: 0xe9e3d6,
  interiorWall: 0xf3efe6,
  shelfWhite: 0xf5f3ee,
  shelfGray: 0xd9d5cb,

  trunk: 0x64503f,
  trunkDark: 0x52423a,
  blossoms: [0xffd9e7, 0xffc9dd, 0xffe6f0, 0xf5bcd9, 0xe9aed3, 0xfff0f5],
  petals: [0xffcfe0, 0xffdce9, 0xf7bcd6, 0xffe2ec],

  houseWallA: 0xe9e3d3,
  houseWallB: 0xdcd6c4,
  houseWallC: 0xe4ddca,
  roofTile: 0x5c6a78,
  roofTileDark: 0x49555f,
  windowFrame: 0xe5e0d4,
  windowGlass: 0x41505d,
  doorWood: 0x6b4f3a,
  fenceConcrete: 0xd8d4c8,

  poleConcrete: 0x9ba1a6,
  poleMetal: 0x7d8489,
  wire: 0x33383d,
  insulator: 0x5f666c,

  mailboxRed: 0xd23b30,
  mailboxDark: 0x8f1f18,

  vendingBlue: 0x2e6db4,
  vendingRed: 0xd8453e,
  vendingPanel: 0x244f85,
  vendingWindow: 0xd7ecf8,

  guardWhite: 0xe9ebee,
  signBluePlate: 0x2a6ebb,
  crossbuckYellow: 0xf2c53d,

  hedge: 0x5d8f52,
  bush: 0x6a9c58,
  bushDark: 0x588749,
  leafPot: 0x4f8a4a,

  cloud: 0xffffff,
  outline: 0x3f3852,
} as const

export const OUTLINE_COLOR = PALETTE.outline
