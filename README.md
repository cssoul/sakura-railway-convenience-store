# SAKURA RAILWAY CONVENIENCE STORE 🌸🚃🏪

> 樱花铁道 · 日式便利店街角 · 三渲二微缩 Diorama

一棵巨大樱花树守在铁轨旁的日式便利店前，电线杆、电线、红色邮筒、自动贩卖机
与后方日式住宅串联起一个可以自由旋转观察的「日本春日街角微缩世界」。
整个场景直接落在水平地面上——不是厚重的沙盘底座。

基于 **Vue 3 + TypeScript + Three.js + Pinia**，全部模型程序化生成
（无 GLB / 外部贴图），纹理均为 CanvasTexture，动画风格 Toon 渲染。

## 运行

```bash
npm install
npm run dev        # http://localhost:5188
```

```bash
npm run build      # 类型检查 + 产物构建
npm run preview    # 预览构建产物
```

## 操作

- 鼠标左键拖拽：旋转视角
- 滚轮：缩放（不会进入模型或地下）
- **左侧面板**：
  - 视角切换——默认视角 / 店门前 / 樱花树下 / 铁轨视角 / 空中鸟瞰（相机平滑飞行）
  - 时间——早上 / 正午 / 晚上
  - 天气——晴天（樱花飘落）/ 下雨（雨丝 + 湿路面 + 积水反光）/ 下雪（雪花 + 地面覆白 + 暖窗灯光）

## 场景看点

| 优先级 | 内容 |
| --- | --- |
| ★★★★★ | 巨大樱花树：主干 → 三级分枝 → 300+ 独立花簇（InstancedMesh）→ 单朵五瓣樱花，树冠低垂到便利店屋顶 |
| ★★★★★ | 铁轨：轨底/轨腰/轨头三段钢轨、枕木、850 颗道砟、接头夹板、杂草 |
| ★★★★ | 便利店：玻璃幕墙（可见完整内部）、自动门（5–15s 随机开闭）、招牌、雨棚、灯箱、のぼり、垃圾桶 |
| ★★★★ | 电线杆 ×3：变压器、路灯、绝缘子、下垂电线（CatmullRom 曲线） |
| ★★★ | 日式住宅 ×3、红色邮筒、自动贩卖机 ×2、路牌、踏切警示、白色护栏 |
| ★★★ | 花瓣飘落（240 片，独立相位/速度/翻滚）+ 地面花瓣堆积 |

## 架构

```
src/
├── components/ThreeScene.vue      # 唯一 DOM：全屏 canvas 容器
├── stores/scene.ts                # Pinia：仅场景状态（天气/花瓣/门状态…）
├── composables/
│   ├── useThreeScene.ts           # 渲染器 / EffectComposer / OutlinePass / 生命周期
│   ├── useCamera.ts               # PerspectiveCamera + OrbitControls（阻尼+限位）
│   └── useAnimation.ts            # 全场景唯一 RAF + Clock
└── three/
    ├── core/                      # 常量布局 / 色板 / Toon 材质工厂 / 几何工具 / 灯光
    ├── materials/textures.ts      # 全部 CanvasTexture（招牌·海报·花瓣·路牌…）
    ├── nature/                    # 樱花巨树 / 植物
    ├── railway/                   # 铁轨
    ├── buildings/                 # 便利店（外观+自动门）/ 住宅
    ├── interior/                  # 便利店内部（货架/饮料柜/关东煮/杂志架…）
    ├── street/                    # 地面 / 道路 / 电线杆 / 街道小件
    ├── effects/                   # 花瓣 / 雨雪 / 天空 / 天气系统
    └── world.ts                   # 世界组装
```

### 天气系统

`stores/scene.ts` 中的 `weather / timeOfDay` 变化会经
`WeatherSystem`（`three/effects/weather.ts`）平滑过渡天空、阳光、雾、
店内灯光、路灯与招牌亮度。已内置 `spring / rain / storm` 与
`day / sunset / night` 组合预设（第一版视觉以 spring-day 精调为准），
未来雨滴、湿润地面等效果在此扩展，不侵入具体模型。

### 性能

- 重复元素全部 InstancedMesh：花簇、花朵、花瓣、道砟、枕木、商品、护栏、草丛…
- 静态建筑按材质合并几何（GeoMerger），draw call 从 ~450 降至 ~250
- 阴影贴图周期性刷新（静态场景为主）
- OutlinePass 半分辨率；树干树枝使用烘焙式背面外壳轮廓
- 目标：Chrome Desktop 稳定 60 FPS（实测 M1 满帧 60 / p95 16.8ms）
