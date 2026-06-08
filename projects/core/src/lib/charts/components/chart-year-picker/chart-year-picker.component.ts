// Single-step year picker panel (no month grid).
// Used by energy-comparison Monthly tab year-slots.
//
// Features:
//   - 3-column year grid
//   - Disabled state for years already used in other slots
//   - Emits (yearSelect) immediately on click
// ─────────────────────────────────────────────────────────────────────────────
 
import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
 
@Component({
  selector:        'lib-chart-year-picker',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  templateUrl: './chart-year-picker.component.html',
  styleUrl: './chart-year-picker.component.scss'
})
export class ChartYearPickerComponent {
  @Input() availableYears: number[]      = [];
  @Input() selectedYear:   number | null = null;
  @Input() disabledYears:  number[]      = [];
  @Input() title           = '';
 
  @Output() yearSelect = new EventEmitter<number>();
}
