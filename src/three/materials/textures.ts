import * as THREE from 'three'

/**
 * 全部纹理均为 CanvasTexture 程序化生成（禁止外部图片）。
 * 颜色纹理使用 SRGBColorSpace。
 */

const JP_FONT = `"Hiragino Sans", "Yu Gothic", "Noto Sans CJK JP", sans-serif`

const tracked: THREE.Texture[] = []

function makeTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  srgb = true,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.anisotropy = 4
  tracked.push(tex)
  return tex
}

export function disposeTextures(): void {
  for (const t of tracked) t.dispose()
  tracked.length = 0
}

/** 雪花（柔和圆点） */
export function snowflakeTexture(): THREE.CanvasTexture {
  return makeTexture(64, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2 - 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.7, 'rgba(255,255,255,0.85)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

/** 雨棚条纹（青绿/白） */
export function awningTexture(): THREE.CanvasTexture {
  const tex = makeTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#f4f6f4'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#2f9e9e'
    for (let x = 0; x < w; x += 64) {
      ctx.fillRect(x, 0, 32, h)
    }
  })
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(6, 1)
  return tex
}

/** 单片樱花花瓣（近白色，便于 instanceColor 调色） */
export function petalTexture(): THREE.CanvasTexture {
  return makeTexture(64, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#fff3f7')
    g.addColorStop(1, '#ffcfe0')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(w / 2, 2)
    // 花瓣尖端的小缺口（樱花特征）
    ctx.quadraticCurveTo(w - 2, h * 0.28, w - 6, h * 0.72)
    ctx.quadraticCurveTo(w - 8, h - 4, w / 2, h - 3)
    ctx.quadraticCurveTo(8, h - 4, 6, h * 0.72)
    ctx.quadraticCurveTo(2, h * 0.28, w / 2, 2)
    ctx.lineTo(w / 2 + 4, 9)
    ctx.lineTo(w / 2 - 4, 9)
    ctx.closePath()
    ctx.fill()
  })
}

/** 五瓣樱花正面（近景细节用） */
export function blossomFlowerTexture(): THREE.CanvasTexture {
  return makeTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    const cx = w / 2
    const cy = h / 2
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(a)
      const g = ctx.createLinearGradient(0, -cy + 6, 0, 0)
      g.addColorStop(0, '#f9b8d2')
      g.addColorStop(1, '#ffeef5')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(0, -6)
      ctx.quadraticCurveTo(20, -30, 12, -52)
      ctx.lineTo(0, -46)
      ctx.lineTo(-12, -52)
      ctx.quadraticCurveTo(-20, -30, 0, -6)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
    ctx.fillStyle = '#f6c9a0'
    ctx.beginPath()
    ctx.arc(cx, cy, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#e8918f'
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, 2.6, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

/** 树干纵向纹理 */
export function barkTexture(): THREE.CanvasTexture {
  const tex = makeTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w
      const gray = 200 + Math.random() * 55
      ctx.strokeStyle = `rgba(${gray},${gray * 0.96},${gray * 0.92},0.55)`
      ctx.lineWidth = 1 + Math.random() * 2.2
      ctx.beginPath()
      ctx.moveTo(x, 0)
      let cx = x
      for (let y = 0; y <= h; y += 16) {
        cx += (Math.random() - 0.5) * 6
        ctx.lineTo(cx, y)
      }
      ctx.stroke()
    }
  })
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 3)
  return tex
}

/** 屋顶砾石噪点 */
export function gravelTexture(): THREE.CanvasTexture {
  const tex = makeTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 900; i++) {
      const gray = 205 + Math.random() * 50
      ctx.fillStyle = `rgba(${gray},${gray},${gray},0.5)`
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
  })
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 3)
  return tex
}

/** 柏油路噪点 */
export function asphaltTexture(): THREE.CanvasTexture {
  const tex = makeTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 1400; i++) {
      const gray = 225 + Math.random() * 30
      ctx.fillStyle = `rgba(${gray},${gray},${gray},0.35)`
      const s = 1 + Math.random() * 2
      ctx.fillRect(Math.random() * w, Math.random() * h, s, s)
    }
  })
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(8, 1)
  return tex
}

/** 人行道铺装 + 分缝 */
export function concreteTexture(): THREE.CanvasTexture {
  const tex = makeTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(140,142,146,0.55)'
    ctx.lineWidth = 2
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
    ctx.stroke()
  })
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** 店内地板瓷砖 */
export function floorTileTexture(): THREE.CanvasTexture {
  const tex = makeTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(150,146,138,0.6)'
    ctx.lineWidth = 2
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y <= h; y += 64) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  })
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(4, 3)
  return tex
}

/** 日式屋瓦横纹 */
export function roofTileTexture(): THREE.CanvasTexture {
  const tex = makeTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    for (let y = 8; y < h; y += 16) {
      ctx.strokeStyle = 'rgba(30,36,44,0.5)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(0, y + 3)
      ctx.lineTo(w, y + 3)
      ctx.stroke()
    }
  })
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 2)
  return tex
}

/** 便利店主招牌：绿蓝条纹 + 原创品牌「サクラマート」 */
export function storeSignTexture(): THREE.CanvasTexture {
  return makeTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f8f7f2'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#2fae60'
    ctx.fillRect(0, 0, w, 30)
    ctx.fillStyle = '#2e6db4'
    ctx.fillRect(0, h - 30, w, 30)
    ctx.fillStyle = '#d8453e'
    ctx.fillRect(0, h - 42, w, 10)

    // 樱花 logo
    const cx = 118
    const cy = h / 2
    ctx.fillStyle = '#f2a7c3'
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(a)
      ctx.beginPath()
      ctx.ellipse(0, -30, 20, 34, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    ctx.fillStyle = '#f8f7f2'
    ctx.beginPath()
    ctx.arc(cx, cy, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#1e3a6e'
    ctx.font = `bold 118px ${JP_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('サクラマート', 560, cy + 6)
  })
}

/** 招牌侧带（条纹，无文字） */
export function fasciaStripeTexture(vertical = false): THREE.CanvasTexture {
  const tex = makeTexture(512, 64, (ctx, w, h) => {
    ctx.fillStyle = '#f8f7f2'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#2fae60'
    ctx.fillRect(0, 0, w, 8)
    ctx.fillStyle = '#2e6db4'
    ctx.fillRect(0, h - 8, w, 8)
    ctx.fillStyle = '#d8453e'
    ctx.fillRect(0, h - 16, w, 5)
  })
  if (vertical) {
    tex.rotation = Math.PI / 2
    tex.center.set(0.5, 0.5)
  }
  tex.wrapS = THREE.RepeatWrapping
  tex.repeat.set(3, 1)
  return tex
}

/** 门上灯箱 */
export function lightboxTexture(): THREE.CanvasTexture {
  return makeTexture(256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#1f4f8f'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.strokeRect(6, 6, w - 12, h - 12)
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 44px ${JP_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('24時間営業', w / 2, h / 2 + 2)
  })
}

/** 店内海报（多种变体） */
export function posterTexture(variant: number): THREE.CanvasTexture {
  return makeTexture(256, 340, (ctx, w, h) => {
    const palettes = [
      ['#fde7ef', '#f6b8d0', '#d8453e', '新発売'],
      ['#e3f0fd', '#a9cdf2', '#2e6db4', '春の新生活'],
      ['#fdf3dd', '#f4d794', '#c07a2d', '期間限定'],
      ['#e8f6e8', '#a8d6a8', '#2f7a4a', 'おいしさ新登場'],
    ]
    const [bg1, bg2, accent, title] = palettes[variant % palettes.length]
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, bg1)
    g.addColorStop(1, bg2)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillRect(16, 16, w - 32, h - 32)

    // 樱花点缀
    ctx.fillStyle = 'rgba(242,167,195,0.8)'
    for (let i = 0; i < 6; i++) {
      const x = 30 + ((i * 53) % (w - 60))
      const y = 26 + ((i * 37) % 60)
      ctx.beginPath()
      ctx.arc(x, y, 7, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.fillStyle = accent
    ctx.font = `bold 52px ${JP_FONT}`
    ctx.textAlign = 'center'
    ctx.fillText(title, w / 2, 130)

    ctx.fillStyle = '#333333'
    ctx.font = `bold 30px ${JP_FONT}`
    ctx.fillText('サクラマート', w / 2, 180)
    ctx.font = `24px ${JP_FONT}`
    ctx.fillText('セール開催中', w / 2, 225)

    ctx.fillStyle = accent
    ctx.fillRect(48, 255, w - 96, 44)
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 28px ${JP_FONT}`
    ctx.fillText('春のおすすめ', w / 2, 284)
  })
}

/** 竖幅のぼり */
export function noboriTexture(text: string, accent: string): THREE.CanvasTexture {
  return makeTexture(128, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f8f7f2'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, w, 26)
    ctx.fillRect(0, h - 26, w, 26)

    ctx.fillStyle = '#333333'
    ctx.font = `bold 64px ${JP_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const chars = [...text]
    const startY = 90
    chars.forEach((ch, i) => {
      ctx.fillText(ch, w / 2, startY + i * 76)
    })
  })
}

/** 街角路牌 */
export function streetSignTexture(): THREE.CanvasTexture {
  return makeTexture(512, 384, (ctx, w, h) => {
    ctx.fillStyle = '#2a6ebb'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 10
    ctx.strokeRect(16, 16, w - 32, h - 32)
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.font = `bold 84px ${JP_FONT}`
    ctx.fillText('さくら木通り', w / 2, 165)
    ctx.font = `bold 58px ${JP_FONT}`
    ctx.fillText('一丁目', w / 2, 265)
    ctx.font = `30px ${JP_FONT}`
    ctx.fillText('SAKURAGI-DORI 1', w / 2, 325)
  })
}

/** 踏切警示牌（黄色 X + 踏切） */
export function crossbuckTexture(): THREE.CanvasTexture {
  return makeTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f2c53d'
    ctx.fillRect(0, 0, w, h)
    ctx.save()
    ctx.translate(w / 2, h / 2)
    ctx.rotate(Math.PI / 4)
    ctx.fillStyle = '#222222'
    ctx.fillRect(-110, -14, 220, 28)
    ctx.rotate(Math.PI / 2)
    ctx.fillRect(-110, -14, 220, 28)
    ctx.restore()
    ctx.fillStyle = '#f2c53d'
    ctx.beginPath()
    ctx.arc(w / 2, h / 2, 52, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#222222'
    ctx.font = `bold 40px ${JP_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('踏切', w / 2, h / 2 + 2)
  })
}

/** 自动贩卖机顶部标牌 */
export function vendingSignTexture(label: string, bg: string): THREE.CanvasTexture {
  return makeTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 72px ${JP_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, w / 2, h / 2 + 4)
  })
}

/** 邮筒 〒 标记 */
export function postMarkTexture(): THREE.CanvasTexture {
  return makeTexture(96, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold 64px ${JP_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('〒', w / 2, h / 2 + 4)
  })
}

/** 草丛横切面（alpha 贴图） */
export function grassBladeTexture(): THREE.CanvasTexture {
  return makeTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    for (let i = 0; i < 26; i++) {
      const x = 6 + Math.random() * (w - 12)
      const top = h * (0.15 + Math.random() * 0.35)
      ctx.strokeStyle = `rgba(255,255,255,${0.75 + Math.random() * 0.25})`
      ctx.lineWidth = 3.5 + Math.random() * 3
      ctx.beginPath()
      ctx.moveTo(x, h)
      ctx.quadraticCurveTo(x + (Math.random() - 0.5) * 26, top + (h - top) * 0.4, x + (Math.random() - 0.5) * 34, top)
      ctx.stroke()
    }
  })
}

/** 入口地垫 */
export function entranceMatTexture(): THREE.CanvasTexture {
  return makeTexture(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#3f6f52'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#6f9f7c'
    ctx.lineWidth = 6
    ctx.strokeRect(10, 10, w - 20, h - 20)
    ctx.fillStyle = '#d9ecd9'
    ctx.font = `bold 44px ${JP_FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('いらっしゃいませ', w / 2, h / 2 + 2)
  })
}
