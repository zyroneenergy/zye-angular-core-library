// Reusable month or year selection chip.
// Two visual states: empty (dashed, + Add) and filled (solid, dot + label + ×).
//
// Used by:
//   - energy-comparison  (month slots + year slots)
//   - daily-monthly-energy (month range FROM / TO slots)
//
// The chip is DUMB — it emits (chipClick) and (clear).
// The parent opens/closes the picker panel and owns selection state.
// ─────────────────────────────────────────────────────────────────────────────
 
import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
 
@Component({
  selector:        'lib-chart-slot-chip',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  templateUrl: './chart-slot-chip.component.html',
  styleUrl: './chart-slot-chip.component.scss'
})
export class ChartSlotChipComponent {
  /** Filled label (e.g. "Apr '26"). Empty string = show empty state. */
  @Input() label       = '';
  /** Slot accent colour from SLOT_PALETTE */
  @Input() color       = '#2563EB';
  /** Whether picker panel is currently open (adds .open class) */
  @Input() isOpen      = false;
  /** Text shown in empty state */
  @Input() placeholder = 'Add';
 
  @Output() chipClick = new EventEmitter<MouseEvent>();
  @Output() clear     = new EventEmitter<MouseEvent>();
 
  onClear(e: MouseEvent): void {
    e.stopPropagation();
    this.clear.emit(e);
  }
}
