import {
  Directive,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { EChartsOption } from 'echarts';
import { Subscription } from 'rxjs';

import { ChartBuilderService, ChartThemeContext } from '../../services/chart-builder.service';
import { ThemeService } from '../../../services/frontend/theme.service';

@Directive()
export abstract class BaseChartComponent implements OnInit, OnDestroy, OnChanges {

  protected builder = inject(ChartBuilderService);
  protected themeService = inject(ThemeService);     
  chartOptions: EChartsOption = {};

  private themeSub?: Subscription;

  ngOnInit(): void {
    this.chartOptions = this.buildOptions();

    // Listen to theme changes
    this.themeSub = this.themeService.theme$.subscribe(() => {
      this.chartOptions = this.buildOptions();
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.chartOptions = this.buildOptions();
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
  }

  protected abstract buildOptions(): EChartsOption;

  /** Helper to get current theme context */
  protected themeContext(overrides?: Partial<ChartThemeContext>): ChartThemeContext {
    const isDark = this.themeService.getSystemTheme() === 'dark';
    return { isDark, ...overrides };
  }
}