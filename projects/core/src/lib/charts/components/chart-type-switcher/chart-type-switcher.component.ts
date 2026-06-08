import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartTypeKey, CHART_TYPE_OPTIONS, ChartTypeOption } from '../../models/chart.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'lib-chart-type-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, MatTooltipModule],
  templateUrl: './chart-type-switcher.component.html',
  styleUrl: './chart-type-switcher.component.scss'
})
export class ChartTypeSwitcherComponent {
  @Input() activeType: ChartTypeKey = 'bar';
  @Input() options: readonly ChartTypeOption[] = CHART_TYPE_OPTIONS;
  @Output() typeChange = new EventEmitter<ChartTypeKey>();

  constructor(private sanitizer: DomSanitizer) {}

  getIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }
}
