import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BinType, BIN_TAB_OPTIONS, BinTabOption } from '../../models/chart.model';

@Component({
  selector: 'lib-chart-bin-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-bin-switcher.component.html',
  styleUrl: './chart-bin-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBinSwitcherComponent {
  @Input() activeBin: BinType = 'daily';
  @Input() tabs: readonly BinTabOption[] = BIN_TAB_OPTIONS;
  @Output() binChange = new EventEmitter<BinType>();
}
