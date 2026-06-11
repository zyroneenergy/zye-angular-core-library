import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { MatCard } from '@angular/material/card';
import { EmptyDataComponent } from '../empty-data/empty-data.component';
import { ShimmerComponent } from '../shimmer/shimmer.component';
import { LiveStatusDotComponent } from '../live-status-dot/live-status-dot.component';
import { createColoredSurfaceStyle } from '../../utils/front-end/color-style.util';

// ─────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────

export interface SiteChip {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

export interface SiteListBadge {
  label: string;
  value: string | number;
  unit?: string;
  color?:string;
}

export interface SiteListProgressBar {
  fillPct: number;
  fillColor?: string;
  trackColor?: string;
  label?: string;
}

/** SVG donut ring — used in the recent-commissioned variant */
export interface SiteListRingBadge {
  /** 0–100 */
  fillPct: number;
  /** Any CSS colour: hex, rgba, or var(--…) */
  color: string;
  /** Text in the centre of the ring, e.g. '21.3%' */
  centerLabel: string;
  label?: string;
}

/**
 * A sort option for the cycle-button.
 * The card cycles through them in order on each click.
 */
export interface SortButton {
  key: string;
  label: string;
  /** Dot colour shown on the button while this option is active */
  dotColor?: string;
}

export interface SiteListItem {
  id: string;
  name: string;
  city: string;
  state: string;
  chips: SiteChip[];
  badge?: SiteListBadge | null;
  progressBar?: SiteListProgressBar | null;
  ringBadge?: SiteListRingBadge | null;
  /** Indicates if the site has live data. Default: true */
  isLive?: boolean;
}

export type CardVariant =
  | 'watchlist'
  | 'top-performing'
  | 'performance'        // chips-only, no badge, no bar
  | 'recent-commissioned'; // ring badge on the right

export type CardStatus = 'loading' | 'success' | 'empty' | 'error' | 'no-generation';

// ─── Ring geometry ─────────────────────────────────────────────────────────

export function ringDash(fillPct: number, r = 18): { array: number; offset: number } {
  const c = 2 * Math.PI * r;
  return { array: c, offset: c * (1 - Math.min(Math.max(fillPct, 0), 100) / 100) };
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

@Component({
  selector: 'lib-site-list-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatDividerModule,
    MatCard,
    EmptyDataComponent,
    ShimmerComponent,
    LiveStatusDotComponent,
  ],
  templateUrl: './site-list-card.component.html',
  styleUrl:    './site-list-card.component.scss',
})
export class SiteListCardComponent implements OnChanges {

  @Input({ required: true }) title!: string;
  @Input({ required: true }) icon!:  string;
  @Input() subtitle?: string;
  @Input() variant: CardVariant = 'watchlist';
  @Input() status: CardStatus   = 'loading';
  @Input() items: SiteListItem[] = [];
  @Input() maxVisible = 4;
  @Input() emptyMessage = 'No sites to display.';

  /**
   * Ordered list of sort options.
   * Each click advances to the next option (wraps around).
   * Pass an empty array (default) to hide the button entirely.
   */
  @Input() sortButtons: SortButton[] = [];

  /** Key of the initially-active sort option. Defaults to first. */
  @Input() activeSortKey?: string;

  @Output() siteClick  = new EventEmitter<SiteListItem>();
  /** Emits the key of the newly-active sort option after each click. */
  @Output() sortChange = new EventEmitter<string>();

  @Input() navigationFactory?: (site: SiteListItem) => any[];
  // ── Internal ──────────────────────────────────────────────────────────────

  _activeSortIndex = 0;

  ngOnChanges(_: SimpleChanges): void {
    if (!this.sortButtons.length) { this._activeSortIndex = 0; return; }

    const preferred = this.activeSortKey ?? this.sortButtons[0]?.key;
    const idx = this.sortButtons.findIndex(b => b.key === preferred);
    this._activeSortIndex = idx >= 0 ? idx : 0;
  }

  get _activeSort(): SortButton | null {
    return this.sortButtons[this._activeSortIndex] ?? null;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  cycleSort(): void {
    if (!this.sortButtons.length) return;
    this._activeSortIndex = (this._activeSortIndex + 1) % this.sortButtons.length;
    this.sortChange.emit(this._activeSort!.key);
  }

  navigate(id: string): void {
  const item = this.items.find(i => i.id === id);

  if (!item) return;

  this.siteClick.emit(item);

  const route = this.navigationFactory
    ? this.navigationFactory(item)
    : ['/sites', item.id];

  this.router.navigate(route);
}

  getBadgeStyle(badge: SiteListBadge) {
  return createColoredSurfaceStyle(badge.color,{
    variant: 'solid',
  });
}

getChipStyle(chip: SiteChip) {
  return createColoredSurfaceStyle(chip.color, {
    variant: 'solid',
  });
}

  

  /**
   * Format chip value: distinguish between null ("N/A") and 0 ("0")
   * Handles cases where value might be a string or number
   */
  formatChipValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (typeof value === 'string') {
      return value.trim() === '' ? 'N/A' : value;
    }
    return String(value);
  }

  /**
   * Safely determine if a site has live data.
   * Defaults to true if not explicitly set to false.
   */
  isSiteLive(site: SiteListItem): boolean {
    return site.isLive !== false;
  }
  
  constructor(private router: Router) {}
}