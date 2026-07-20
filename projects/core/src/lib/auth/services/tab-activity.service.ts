import { Injectable, NgZone, OnDestroy } from '@angular/core';

/**
 * Tracks user activity within the current browser TAB (not the browser as a whole).
 * Used to gate silent token refresh so an idle/forgotten tab doesn't stay authenticated forever.
 */
@Injectable({
  providedIn: 'root',
})
export class TabActivityService implements OnDestroy {
  private lastActiveAt = Date.now();
  private lastWriteAt = 0;
  private readonly writeThrottleMs = 5000;

  private readonly activityEvents: (keyof DocumentEventMap)[] = [
    'mousemove',
    'mousedown',
    'keydown',
    'wheel',
    'touchstart',
    'scroll',
  ];

  private readonly boundHandler = () => this.registerActivity();

  constructor(private readonly ngZone: NgZone) {
    this.ngZone.runOutsideAngular(() => {
      this.activityEvents.forEach((evt) =>
        document.addEventListener(evt, this.boundHandler, { passive: true })
      );
      document.addEventListener('visibilitychange', this.boundHandler);
    });
  }

  /** True only if this tab is visible AND had activity within the given window. */
  isActiveWithin(windowMs: number): boolean {
    if (document.visibilityState !== 'visible') return false;
    return Date.now() - this.lastActiveAt <= windowMs;
  }

  getLastActiveAt(): number {
    return this.lastActiveAt;
  }

  private registerActivity(): void {
    const now = Date.now();
    if (now - this.lastWriteAt < this.writeThrottleMs) return;
    this.lastWriteAt = now;
    this.lastActiveAt = now;
  }

  ngOnDestroy(): void {
    this.activityEvents.forEach((evt) =>
      document.removeEventListener(evt, this.boundHandler)
    );
    document.removeEventListener('visibilitychange', this.boundHandler);
  }
}