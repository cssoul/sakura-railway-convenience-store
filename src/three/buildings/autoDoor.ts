import * as THREE from 'three'
import { Rng } from '../core/rng'

/** 便利店自动门状态机：CLOSED → OPENING → OPEN → CLOSING → CLOSED */
export type DoorState = 'closed' | 'opening' | 'open' | 'closing'

export interface AutoDoorOptions {
  width: number
  height: number
  glassMat: THREE.Material
  frameMat: THREE.Material
  baseY?: number
}

export class AutoDoor {
  readonly group = new THREE.Group()
  state: DoorState = 'closed'
  onStateChange: ((s: DoorState) => void) | null = null

  private left: THREE.Group
  private right: THREE.Group
  private progress = 0
  private holdTimer = 7
  private readonly openOffset: number
  private readonly halfW: number
  private readonly baseY: number
  private rng = new Rng(20260401)

  constructor(opts: AutoDoorOptions) {
    const { width, height, glassMat, frameMat } = opts
    this.baseY = opts.baseY ?? 0
    this.halfW = width / 2
    this.openOffset = width / 2 - 0.1

    const panelW = width / 2
    const mkPanel = (side: -1 | 1) => {
      const p = new THREE.Group()
      const glass = new THREE.Mesh(new THREE.BoxGeometry(panelW - 0.08, height - 0.18, 0.035), glassMat)
      glass.position.y = height / 2
      glass.castShadow = false
      p.add(glass)
      // 门框四边
      const top = new THREE.Mesh(new THREE.BoxGeometry(panelW, 0.09, 0.06), frameMat)
      top.position.set(0, height - 0.045, 0)
      const bottom = new THREE.Mesh(new THREE.BoxGeometry(panelW, 0.12, 0.06), frameMat)
      bottom.position.set(0, 0.06, 0)
      p.add(top, bottom)
      const railGeo = new THREE.BoxGeometry(0.07, height, 0.06)
      const r1 = new THREE.Mesh(railGeo, frameMat)
      r1.position.set(side * (panelW / 2 - 0.035), height / 2, 0)
      const r2 = new THREE.Mesh(railGeo, frameMat)
      r2.position.set(side * 0.035, height / 2, 0)
      p.add(r1, r2)
      // 扶手条
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.04), frameMat)
      handle.position.set(side * 0.12, height * 0.52, 0.05)
      p.add(handle)
      return p
    }

    this.left = mkPanel(-1)
    this.right = mkPanel(1)
    this.group.add(this.left, this.right)
    this.applyPositions()
  }

  private setState(s: DoorState): void {
    if (this.state === s) return
    this.state = s
    this.onStateChange?.(s)
  }

  private applyPositions(): void {
    const closedX = this.halfW / 2
    this.left.position.set(-closedX - this.progress * this.openOffset, this.baseY, 0)
    this.right.position.set(closedX + this.progress * this.openOffset, this.baseY, 0)
  }

  update(dt: number): void {
    switch (this.state) {
      case 'closed':
        this.holdTimer -= dt
        if (this.holdTimer <= 0) this.setState('opening')
        break
      case 'opening':
        this.progress += dt / 1.15
        if (this.progress >= 1) {
          this.progress = 1
          this.holdTimer = this.rng.range(1.2, 2.4)
          this.setState('open')
        }
        break
      case 'open':
        this.holdTimer -= dt
        if (this.holdTimer <= 0) this.setState('closing')
        break
      case 'closing':
        this.progress -= dt / 1.35
        if (this.progress <= 0) {
          this.progress = 0
          this.holdTimer = this.rng.range(5, 15)
          this.setState('closed')
        }
        break
    }
    this.applyPositions()
  }
}
