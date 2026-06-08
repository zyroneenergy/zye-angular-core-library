// Single option row rendered inside a chart-dropdown panel.
// Handles: selected state, check icon, click emit.
//
// Usage inside a chart-dropdown:
//   @for (opt of kpiOptions; track opt.key) {
//     <app-chart-dropdown-option
//       [label]="opt.label"
//       [selected]="selectedKpi === opt.key"
//       (select)="selectKpi(opt.key, $event)">
//     </app-chart-dropdown-option>
//   }
// ─────────────────────────────────────────────────────────────────────────────
 
import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
 
@Component({
  selector:        'lib-chart-dropdown-option',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  templateUrl: './chart-dropdown-option.component.html',
  styleUrl: './chart-dropdown-option.component.scss'
})
export class ChartDropdownOptionComponent {
  @Input() label    = '';
  @Input() selected = false;
  @Output() select  = new EventEmitter<MouseEvent>();
}
