import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  Optional,
  Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { Subscription } from 'rxjs';
 
import { DonutSlice, DonutChartConfig } from '../../../models/chart.model';
import { ChartBuilderService }          from '../../../services/chart-builder.service';
import { ThemeService } from '../../../../services/frontend/theme.service';

@Component({
  selector: 'lib-donut-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NgxEchartsModule],
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss'
})
export class DonutChartComponent implements OnInit, OnDestroy, OnChanges {
 
  @Input() slices: DonutSlice[]     = [];
  @Input() config: DonutChartConfig = {};
  // height input kept for backwards compat but no longer applied inline —
  // sizing is now controlled entirely by the parent via CSS.
  @Input() height = '100%';
 
  chartOptions: EChartsOption = {};
 
  private themeSub?: Subscription;
 
  constructor(
    private builder: ChartBuilderService,
    private themeService: ThemeService,
  ) {}
 
  ngOnInit(): void {
    this.themeSub = this.themeService?.theme$.subscribe(() => {
      this.chartOptions = this.build();
    });
    this.chartOptions = this.build();
  }
 
  ngOnChanges(_: SimpleChanges): void {
    this.chartOptions = this.build();
  }
 
  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
  }
 
  private build(): EChartsOption {
    return this.builder.buildDonut(
      this.slices,
      this.config,
      { isDark: this.themeService?.getSystemTheme() === 'dark' },
    );
  }
}