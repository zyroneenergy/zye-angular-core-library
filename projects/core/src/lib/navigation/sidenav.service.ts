import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { LayoutService } from '../services/frontend/layout.service';

const COLLAPSED_STORAGE_KEY = 'sidenavCollapsed';

/**
 * Single source of truth for the main navigation.
 * - Desktop: a rail that is collapsed (icons) or expanded (icons + labels); persisted.
 * - Mobile:  an off-canvas drawer that is open or closed; never persisted.
 */
@Injectable({ providedIn: 'root' })
export class SidenavService {
  private readonly layout = inject(LayoutService);

  readonly isMobile = this.layout.isMobile;

  private readonly _collapsed = signal(readFlag(COLLAPSED_STORAGE_KEY));
  private readonly _mobileOpen = signal(false);

  readonly collapsed = this._collapsed.asReadonly();
  readonly mobileOpen = this._mobileOpen.asReadonly();

  /** Whether labels are shown. The mobile drawer is always fully expanded. */
  readonly expanded = computed(() => this.isMobile() || !this._collapsed());

  constructor() {
    // Leaving mobile must never leave a stale open drawer behind.
    effect(() => {
      if (!this.isMobile()) this._mobileOpen.set(false);
    }, { allowSignalWrites: true });

    inject(Router).events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.closeMobile());
  }

  toggle(): void {
    if (this.isMobile()) {
      this._mobileOpen.update(open => !open);
    } else {
      this.setCollapsed(!this._collapsed());
    }
  }

  openMobile(): void {
    if (this.isMobile()) this._mobileOpen.set(true);
  }

  closeMobile(): void {
    this._mobileOpen.set(false);
  }

  setCollapsed(collapsed: boolean): void {
    this._collapsed.set(collapsed);
    writeFlag(COLLAPSED_STORAGE_KEY, collapsed);
  }
}

export function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable (private mode): state still works for this session */
  }
}
