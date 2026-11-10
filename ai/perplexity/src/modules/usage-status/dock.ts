import { storage } from '../../core/storage'

interface Spot {
  readonly x: number
  readonly y: number
}

interface Drag {
  readonly startX: number
  readonly startY: number
  readonly offsetX: number
  readonly offsetY: number
  moved: boolean
}

const KEY = 'usage-status:dock'
const MARGIN = 8
const GAP = 16
const DRAG_THRESHOLD = 4
const RECHECK_MS = 1_500
const INTERACTIVE = 'button, a[href], input, textarea, select, summary, [role="button"], [contenteditable="true"]'

export class Dock {
  private attached = false
  private manual: Spot | null = storage.get<Spot | null>(KEY, null)
  private checkedAt = 0
  private drag: Drag | null = null
  private suppressClick = false

  constructor(private readonly element: HTMLElement) {}

  attach(): void {
    if (this.attached) return
    this.attached = true
    this.element.addEventListener('pointerdown', this.onPointerDown)
    this.element.addEventListener('click', this.onClick, true)
    this.element.addEventListener('dblclick', this.onDoubleClick)
    window.addEventListener('resize', this.onResize)
  }

  detach(): void {
    if (!this.attached) return
    this.attached = false
    this.element.removeEventListener('pointerdown', this.onPointerDown)
    this.element.removeEventListener('click', this.onClick, true)
    this.element.removeEventListener('dblclick', this.onDoubleClick)
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('pointermove', this.onPointerMove)
    this.drag = null
    for (const property of ['left', 'top', 'right', 'bottom']) this.element.style.removeProperty(property)
  }

  refresh(force = false): void {
    if (!this.attached || this.drag?.moved) return
    const now = performance.now()
    if (!force && now - this.checkedAt < RECHECK_MS) return
    this.checkedAt = now
    const { width, height } = this.element.getBoundingClientRect()
    if (!width) return
    if (this.manual) {
      this.place(this.manual.x * window.innerWidth - width / 2, this.manual.y * window.innerHeight - height / 2, width, height)
      return
    }
    this.placeAutomatically(width, height)
  }

  private placeAutomatically(width: number, height: number): void {
    const current = this.element.getBoundingClientRect()
    if (this.element.style.left && this.crowd(current.left, current.top, width, height) === 0) return
    const { innerWidth: vw, innerHeight: vh } = window
    const candidates = [
      { left: vw - width - GAP, top: vh - height - GAP },
      { left: GAP, top: vh - height - GAP },
      { left: vw - width - GAP, top: GAP + 56 },
      { left: GAP, top: GAP }
    ]
    const best = candidates.map((spot) => ({ spot, crowd: this.crowd(spot.left, spot.top, width, height) })).sort((a, b) => a.crowd - b.crowd)[0]!
    this.place(best.spot.left, best.spot.top, width, height)
  }

  private crowd(left: number, top: number, width: number, height: number): number {
    let hits = 0
    for (const fx of [0.1, 0.5, 0.9]) {
      for (const fy of [0.25, 0.75]) {
        const stack = document.elementsFromPoint(left + width * fx, top + height * fy)
        if (stack.some((node) => !this.element.contains(node) && node.closest(INTERACTIVE))) hits++
      }
    }
    return hits
  }

  private place(left: number, top: number, width: number, height: number): void {
    const x = Math.max(MARGIN, Math.min(window.innerWidth - width - MARGIN, left))
    const y = Math.max(MARGIN, Math.min(window.innerHeight - height - MARGIN, top))
    this.element.style.left = `${Math.round(x)}px`
    this.element.style.top = `${Math.round(y)}px`
    this.element.style.right = 'auto'
    this.element.style.bottom = 'auto'
  }

  private readonly onResize = (): void => this.refresh(true)

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return
    const rect = this.element.getBoundingClientRect()
    this.drag = { startX: event.clientX, startY: event.clientY, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, moved: false }
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp, { once: true })
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const drag = this.drag
    if (!drag) return
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD) return
    drag.moved = true
    const { width, height } = this.element.getBoundingClientRect()
    this.place(event.clientX - drag.offsetX, event.clientY - drag.offsetY, width, height)
  }

  private readonly onPointerUp = (): void => {
    window.removeEventListener('pointermove', this.onPointerMove)
    const drag = this.drag
    this.drag = null
    if (!drag?.moved) return
    const rect = this.element.getBoundingClientRect()
    this.manual = { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight }
    storage.set(KEY, this.manual)
    this.suppressClick = true
    window.setTimeout(() => {
      this.suppressClick = false
    }, 50)
  }

  private readonly onClick = (event: MouseEvent): void => {
    if (!this.suppressClick) return
    event.stopImmediatePropagation()
    event.preventDefault()
    this.suppressClick = false
  }

  private readonly onDoubleClick = (): void => {
    this.manual = null
    storage.set(KEY, null)
    this.refresh(true)
  }
}
