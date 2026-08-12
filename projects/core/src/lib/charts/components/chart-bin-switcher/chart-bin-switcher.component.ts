import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartTabOption } from '../../models/generic.model';

@Component({
  selector: 'lib-chart-bin-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-bin-switcher.component.html',
  styleUrl: './chart-bin-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartBinSwitcherComponent<T extends string = string> {
  @Input({ required: true }) activeTab!: T;
  @Input({ required: true }) tabs!: readonly ChartTabOption<T>[];
  /** Button height in px — parent controls sizing instead of a baked-in 28px. */
  @Input() height = 26;
  @Output() tabChange = new EventEmitter<T>();

  onSelect(tab: ChartTabOption<T>): void {
    if (tab.key === this.activeTab) return; // guard here, not per-call-site
    this.tabChange.emit(tab.key);
  }
}
