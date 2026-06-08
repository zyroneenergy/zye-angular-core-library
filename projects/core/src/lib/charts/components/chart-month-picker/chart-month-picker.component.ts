// Two-step month picker panel:
//   Step 1: Year grid (3 columns)
//   Step 2: Month grid (4×3) — appears once a year is pending
//
// Emits:
//   (yearSelect)  — year clicked (parent stores pending year)
//   (monthSelect) — { year, month } committed
//   (backdropClick) — user clicked outside (parent closes)
//
// Usage:
//   @if (slot.dropdownOpen) {
//     <app-chart-month-picker
//       [availableYears]="availableYears"
//       [pendingYear]="getPendingYear(slot.id)"
//       [selectedYear]="slot.selection?.year ?? null"
//       [selectedMonth]="slot.selection?.month ?? null"
//       [title]="'Select Month'"
//       (yearSelect)="onYearSelect(slot.id, $event)"
//       (monthSelect)="onMonthSelect(slot.id, $event)">
//     </app-chart-month-picker>
//   }
// ─────────────────────────────────────────────────────────────────────────────
 
import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MONTH_SHORT, MonthSelection } from '../../models/chart.model';
 
@Component({
  selector:        'lib-chart-month-picker',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  templateUrl: './chart-month-picker.component.html',
  styleUrl: './chart-month-picker.component.scss'
})
export class ChartMonthPickerComponent {
  readonly monthNames = MONTH_SHORT;
 
  @Input() availableYears: number[] = [];
  @Input() pendingYear:    number | null = null;
  @Input() selectedYear:   number | null = null;
  @Input() selectedMonth:  number | null = null;
  @Input() title           = '';
 
  @Output() yearSelect  = new EventEmitter<number>();
  @Output() monthSelect = new EventEmitter<MonthSelection>();
 
  onMonthClick(month: number): void {
    if (this.pendingYear == null) return;
    this.monthSelect.emit({ year: this.pendingYear, month });
  }
}
