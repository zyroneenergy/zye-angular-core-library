import { NgZone } from '@angular/core';

/** Touches starting this close to the left screen edge can pull the drawer open. */
const EDGE_PX = 24;
/** Movement before deciding whether the gesture is a horizontal drag or a scroll. */
const AXIS_LOCK_PX = 8;
/** Fling speed (px/ms) that settles the drawer regardless of how far it moved. */
const FLING_VELOCITY = 0.4;

export interface SwipeHost {
  /** Element that receives `--sn-progress` (0 closed → 1 open) and `.is-dragging`. */
  readonly host: HTMLElement;
  /** The drawer panel; its width is the full drag distance. */
  readonly panel: () => HTMLElement;
  readonly enabled: () => boolean;
  readonly isOpen: () => boolean;
  readonly settle: (open: boolean) => void;
}

/**
 * Native-app drawer gestures (ChatGPT / Claude mobile):
 *  - swipe right from the left edge to pull the drawer open,
 *  - swipe left on the open drawer or backdrop to push it closed.
 * The drawer follows the finger; on release it snaps by distance or fling speed.
 * Runs outside Angular; only the final open / close re-enters the zone.
 */
export class SidenavSwipe {
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private lastX = 0;
  private width = 1;
  private fromOpen = false;
  private tracking = false;
  private dragging = false;

  private readonly listeners: [string, EventListener, AddEventListenerOptions][] = [
    ['touchstart', (e) => this.onStart(e as TouchEvent), { passive: true }],
    ['touchmove', (e) => this.onMove(e as TouchEvent), { passive: false }],
    ['touchend', () => this.onEnd(), { passive: true }],
    ['touchcancel', () => this.reset(), { passive: true }],
  ];

  constructor(private readonly zone: NgZone, private readonly target: SwipeHost) {
    zone.runOutsideAngular(() => {
      for (const [type, fn, opts] of this.listeners) document.addEventListener(type, fn, opts);
    });
  }

  destroy(): void {
    for (const [type, fn, opts] of this.listeners) document.removeEventListener(type, fn, opts);
  }

  private onStart(event: TouchEvent): void {
    if (!this.target.enabled() || event.touches.length !== 1) return;
    const touch = event.touches[0];
    this.fromOpen = this.target.isOpen();
    // Closed: only an edge swipe. Open: anywhere (drawer or backdrop).
    if (!this.fromOpen && touch.clientX > EDGE_PX) return;

    this.tracking = true;
    this.dragging = false;
    this.startX = this.lastX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = performance.now();
    this.width = this.target.panel().getBoundingClientRect().width || 1;
  }

  private onMove(event: TouchEvent): void {
    if (!this.tracking) return;
    const touch = event.touches[0];
    const dx = touch.clientX - this.startX;
    const dy = touch.clientY - this.startY;

    if (!this.dragging) {
      if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
      // Vertical first, or the "wrong" direction for the current state: let the page scroll.
      if (Math.abs(dy) > Math.abs(dx) || (this.fromOpen ? dx > 0 : dx < 0)) {
        this.reset();
        return;
      }
      this.dragging = true;
      this.target.host.classList.add('is-dragging');
    }

    event.preventDefault();
    this.lastX = touch.clientX;
    this.target.host.style.setProperty('--sn-progress', String(this.progress()));
  }

  private onEnd(): void {
    if (!this.dragging) {
      this.reset();
      return;
    }
    const velocity = (this.lastX - this.startX) / Math.max(1, performance.now() - this.startTime);
    const open = Math.abs(velocity) > FLING_VELOCITY ? velocity > 0 : this.progress() > 0.5;
    this.reset();
    this.zone.run(() => this.target.settle(open));
  }

  /** 0 = fully closed, 1 = fully open. */
  private progress(): number {
    const dx = this.lastX - this.startX;
    const p = this.fromOpen ? 1 + dx / this.width : dx / this.width;
    return Math.min(1, Math.max(0, p));
  }

  private reset(): void {
    this.tracking = false;
    this.dragging = false;
    this.target.host.classList.remove('is-dragging');
    this.target.host.style.removeProperty('--sn-progress');
  }
}
