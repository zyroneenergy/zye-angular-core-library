import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

export type ButtonVariant = 'raised' | 'stroked' | 'flat' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type IconType = 'mat' | 'isax';
/** Built-in semantic presets. Anything else is treated as a literal CSS color/var. */
export type ButtonPresetColor = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';

@Component({
  selector: 'lib-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'raised';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  /**
   * Preset key ('primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info')
   * OR any literal CSS color value: '#FF5733', 'rgb(255,0,0)', 'var(--my-custom-token)'.
   * Presets resolve to design tokens via CSS class; anything unrecognized is applied
   * as an inline color directly — so you're never blocked by a closed palette.
   */
  @Input() color: ButtonPresetColor | string = 'primary';

  @Input() icon?: string;
  @Input() iconType: IconType = 'mat';
  @Input() trailingIcon?: string;
  @Input() trailingIconType: IconType = 'mat';

  @Input() tooltip?: string;
  @Input() tooltipPosition: 'above' | 'below' | 'left' | 'right' = 'below';
  @Input() ariaLabel?: string;

  @Input() width?: number | string;
  @Input() height?: number | string;
  @Input() minWidth?: number | string;

  private readonly PRESETS = ['primary', 'secondary', 'danger', 'success', 'warning', 'info'];

  get isPreset(): boolean {
    return this.PRESETS.includes(this.color);
  }

  get colorClass(): string {
    return this.isPreset ? `lib-btn--${this.color}` : '';
  }

  private toCssValue(val: number | string | undefined): string | null {
    if (val === undefined || val === null) return null;
    return typeof val === 'number' ? `${val}px` : val;
  }

  /** Sizing overrides only — color is handled separately so we can branch raised vs stroked vs flat. */
  get sizeStyle(): Record<string, string> {
    const style: Record<string, string> = {};
    const w = this.toCssValue(this.width);
    const h = this.toCssValue(this.height);
    const mw = this.toCssValue(this.minWidth);

    if (w) { style['width'] = w; style['flex'] = '0 0 auto'; }
    if (h) { style['height'] = h; }
    if (mw) { style['min-width'] = mw; }
    return style;
  }

  /**
   * When color is a literal (not a preset), apply it directly as inline style —
   * different CSS property depending on variant (fill vs text/border).
   */
  get colorStyle(): Record<string, string> {
    if (this.isPreset || !this.color) return {};

    switch (this.variant) {
      case 'raised':
        return { background: this.color, color: '#fff' };
      case 'stroked':
        return { color: this.color, 'border-color': this.color };
      case 'flat':
      case 'icon':
        return { color: this.color };
      default:
        return {};
    }
  }

  get combinedStyle(): Record<string, string> {
    return { ...this.sizeStyle, ...this.colorStyle };
  }
}