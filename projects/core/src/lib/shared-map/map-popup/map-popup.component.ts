import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ShimmerComponent } from '../../components/shimmer/shimmer.component';

export type PopupState = 'loading' | 'empty' | 'error' | 'data';

@Component({
  selector: 'app-map-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ShimmerComponent,
  ],
  templateUrl: './map-popup.component.html',
  styleUrl: './map-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPopupComponent {
  // ── Core display ──────────────────────────────────────────────────────────
  @Input() siteName   = '';
  @Input() location   = '';
  @Input() bookmarked = false;

  // ── KPI metrics ───────────────────────────────────────────────────────────
  /** Capacity Utilisation Factor (%) */
  @Input() cuf: number | null = null;
  /** Expected CUF threshold (%) — drives good/bad colouring */
  @Input() expCUF: number | null = null;
  /** Today's AC energy (Wh) */
  @Input() acEnergy: number | null = null;
  /** Current AC power (W) */
  @Input() acPower: number | null = null;
  /** Online inverter count */
  @Input() onlineInv: number | null = null;
  /** Total inverter count */
  @Input() totInv: number | null = null;

  // ── UI state ──────────────────────────────────────────────────────────────
  popupState: PopupState = 'loading';

  // ── Navigation ────────────────────────────────────────────────────────────
  @Input() siteId = '';

  // ── Outputs ───────────────────────────────────────────────────────────────
  @Output() closePopup = new EventEmitter<void>();
  @Output() openSite   = new EventEmitter<void>();
  @Output() retryLoad  = new EventEmitter<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  // ── State resolution ──────────────────────────────────────────────────────

  /**
   * Called by SitesMapComponent after all @Input() properties have been set
   * imperatively. Resolves display state and triggers OnPush change detection.
   */
  resolve(): void {
    if (!this.siteName) {
      this.popupState = 'loading';
    } else if (
      this.cuf === null &&
      this.acEnergy === null &&
      this.acPower === null &&
      this.onlineInv === null
    ) {
      this.popupState = 'empty';
    } else {
      this.popupState = 'data';
    }
    this.cdr.markForCheck();
  }

  /** Sets error state — e.g. from a failed API call. */
  setError(): void {
    this.popupState = 'error';
    this.cdr.markForCheck();
  }

  // ── CUF styling ───────────────────────────────────────────────────────────

  private get cufStatus(): 'good' | 'bad' | 'na' {
    if (this.cuf === null) return 'na';
    return this.cuf >= (this.expCUF ?? 0) ? 'good' : 'bad';
  }

  getCufIconBg(): string {
    const color = this.getCufIconColor();
    return color + '1A'; // ~10% opacity tint
  }

  getCufIconColor(): string {
    switch (this.cufStatus) {
      case 'good': return 'var(--actionColorGreen, #16A34A)';
      case 'bad':  return 'var(--actionColorDarkRed, #DC2626)';
      default:     return 'var(--primary500)';
    }
  }

  getCufBadgeStyle(): { background: string; color: string } {
    const color = this.getCufIconColor();
    return { background: color + '1F', color };
  }

  // ── Inverter display ──────────────────────────────────────────────────────

  get inverterDisplay(): string {
    if (this.onlineInv === null && this.totInv === null) return 'N/A';
    const online = this.onlineInv ?? 0;
    const total  = this.totInv  ?? '?';
    return `${online} / ${total}`;
  }

  get inverterIconColor(): string {
    if (this.onlineInv === null || this.totInv === null) return 'var(--primary500)';
    return this.onlineInv === this.totInv
      ? 'var(--actionColorGreen, #16A34A)'
      : 'var(--actionColorDarkRed, #DC2626)';
  }

  get inverterIconBg(): string {
    return this.inverterIconColor + '1A';
  }

  // ── Energy / power formatting ─────────────────────────────────────────────

  /** Format Wh → Wh / kWh / MWh */
  formatEnergy(wh: number | null): string {
    if (wh === null) return 'N/A';
    if (wh >= 1_000_000) return `${(wh / 1_000_000).toFixed(2)} MWh`;
    if (wh >= 1_000)     return `${(wh / 1_000).toFixed(2)} kWh`;
    return `${wh.toFixed(0)} Wh`;
  }

  /** Format W → W / kW / MW */
  formatPower(w: number | null): string {
    if (w === null) return 'N/A';
    if (w >= 1_000_000) return `${(w / 1_000_000).toFixed(2)} MW`;
    if (w >= 1_000)     return `${(w / 1_000).toFixed(2)} kW`;
    return `${w.toFixed(0)} W`;
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  onClose(): void { this.closePopup.emit(); }

  onOpenSite(): void {
    this.openSite.emit();
    if (this.siteId) {
      this.router.navigate(['/sites/site', this.siteId]);
    }
  }

  onRetry(): void { this.retryLoad.emit(); }
}