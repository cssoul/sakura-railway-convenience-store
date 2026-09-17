/** 可复现的伪随机数工具（场景生成需要稳定，每次刷新布局一致） */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private r: () => number

  constructor(seed = 20260316) {
    this.r = mulberry32(seed)
  }

  next(): number {
    return this.r()
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.r()
  }

  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.r() * arr.length) % arr.length]
  }

  chance(p: number): boolean {
    return this.r() < p
  }

  /** 近似高斯（中心 clamping） */
  gauss(mean = 0, dev = 1): number {
    const u = Math.max(1e-6, this.r())
    const v = this.r()
    return mean + dev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  /** 球面随机方向 */
  direction(elevMin = -1, elevMax = 1): [number, number, number] {
    const az = this.range(0, Math.PI * 2)
    const el = Math.asin(this.range(elevMin, elevMax))
    const ce = Math.cos(el)
    return [Math.sin(az) * ce, Math.sin(el), Math.cos(az) * ce]
  }
}
