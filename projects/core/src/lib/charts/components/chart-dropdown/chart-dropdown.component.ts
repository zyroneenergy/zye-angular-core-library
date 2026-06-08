// ─────────────────────────────────────────────────────────────────────────────
// Generic trigger + panel dropdown used by:
//   - KPI selector
//   - Quick select
//   - Comparison mode selector
//   - Year selector
//   - Any future list dropdown
//
// Usage:
//   <app-chart-dropdown [label]="selectedKpi.short" panelTitle="KPI" [isOpen]="kpiOpen"
//     (toggle)="onToggleKpi($event)" (closed)="kpiOpen = false">
//     <ng-content></ng-content>   ← drop any option list here
//   </app-chart-dropdown>
// ─────────────────────────────────────────────────────────────────────────────
import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-chart-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  templateUrl: './chart-dropdown.component.html',
  styleUrl: './chart-dropdown.component.scss'
})
export class ChartDropdownComponent {
  /** Button label text */
  @Input() label = '';
  /** Header text inside the panel */
  @Input() panelTitle = '';
  /** Optional SVG path data rendered as lead icon inside trigger */
  @Input() leadIcon = '';
  /** Panel alignment: 'right' (default) or 'left' */
  @Input() align: 'left' | 'right' = 'right';
  /** Controlled open state — parent owns this */
  @Input() isOpen = false;
 
  /** Emits the click event so parent can toggle */
  @Output() toggle = new EventEmitter<MouseEvent>();

  @Input() hideLabelOnMobile = false;
}
