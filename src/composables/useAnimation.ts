import * as THREE from 'three'

/**
 * 统一动画循环：全场景共用一个 requestAnimationFrame + 一个 Clock。
 * 各模块只注册 update 回调，绝不自建 RAF。
 */
export class AnimationLoop {
  private tasks: ((dt: number, elapsed: number) => void)[] = []
  private clock = new THREE.Clock()
  private running = false
  private rafId = 0

  constructor(private render: (dt: number, elapsed: number) => void) {}

  register(fn: (dt: number, elapsed: number) => void): void {
    this.tasks.push(fn)
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.clock.start()
    const loop = (): void => {
      if (!this.running) return
      const dt = Math.min(this.clock.getDelta(), 0.05)
      const elapsed = this.clock.elapsedTime
      for (const task of this.tasks) task(dt, elapsed)
      this.render(dt, elapsed)
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
  }
}
