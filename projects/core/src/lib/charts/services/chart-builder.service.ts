// Pure chart-option factories.  No HTTP, no state.
// Consuming components inject this and call build*() whenever data or theme changes.
//
// Theming variables are passed in as a ThemeContext so the service stays
// decoupled from any app-specific ThemeService.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable, Optional, Inject } from '@angular/core';
import { EChartsOption } from 'echarts';

import {
  DonutSlice,
  DonutChartConfig,
  LineSeries,
  LineChartConfig,
} from '../models/chart.model';
import { ChartColorStrategy } from '../models/chart.model';

// ── Minimal theme descriptor passed by the consuming component ────────────────
export interface ChartThemeContext {
  isDark: boolean;
  // Typography / color tokens (match your existing style-variables file)
  fontFamily?:          string;
  defaultFontSize?:     number;
  headerFontSize?:      number;
  headerFontWeight?:    string | number;
  headerColor?:         string;
  subheaderColor?:      string;
  subheaderFontSize?:   number;
  legendColor?:         string;
  tooltipBg?:           string;
  tooltipBorderColor?:  string;
  tooltipTextColor?:    string;
  gridLineColor?:       string;
  axisLabelColor?:      string;
  splitLineColor?:      string;
}

// ── Sensible defaults ─────────────────────────────────────────────────────────
function defaults(ctx: ChartThemeContext): Required<ChartThemeContext> {
  return {
    fontFamily:         ctx.fontFamily!        ,
    defaultFontSize: ctx.defaultFontSize!,
    headerFontSize:     ctx.headerFontSize!      ,
    headerFontWeight:   ctx.headerFontWeight!    ,
    headerColor:        ctx.headerColor         ?? (ctx.isDark ? '#e2e8f0' : '#1e293b'),
    subheaderColor:     ctx.subheaderColor      ?? (ctx.isDark ? '#94a3b8' : '#64748b'),
    subheaderFontSize:  ctx.subheaderFontSize   ?? 12,
    legendColor:        ctx.legendColor         ?? (ctx.isDark ? '#94a3b8' : '#64748b'),
    tooltipBg:          ctx.tooltipBg           ?? (ctx.isDark ? '#1e2a38' : '#ffffff'),
    tooltipBorderColor: ctx.tooltipBorderColor  ?? (ctx.isDark ? '#334155' : '#e2e8f0'),
    tooltipTextColor:   ctx.tooltipTextColor    ?? (ctx.isDark ? '#e2e8f0' : '#1e293b'),
    gridLineColor:      ctx.gridLineColor        ?? (ctx.isDark ? '#1e293b' : '#f1f5f9'),
    axisLabelColor:     ctx.axisLabelColor       ?? (ctx.isDark ? '#94a3b8' : '#64748b'),
    splitLineColor:     ctx.splitLineColor       ?? (ctx.isDark ? '#334155' : '#e2e8f0'),
    isDark:             ctx.isDark,
  };
}

@Injectable({ providedIn: 'root' })
export class ChartBuilderService {

  constructor(
    @Optional() @Inject('CHART_COLOR_STRATEGY') 
    private colorStrategy?: ChartColorStrategy
  ) {}

  // ── §1  Donut / Pie ─────────────────────────────────────────────────────────
  buildDonut(
    slices:  DonutSlice[],
    config:  DonutChartConfig,
    theme:   ChartThemeContext,
  ): EChartsOption {
    const t = defaults(theme);

    const seriesData = slices.map(s => ({
  name: this.normalizeLabel(s.name),
  value: s.value,
  itemStyle: {
    color: s.color ?? this.getColor(s.name),
  },
}));

    const total = slices.reduce((acc, s) => acc + s.value, 0);

    return {
      title: this.buildTitle(config.title, config.subtitle, t),
      tooltip: this.buildTooltip(t, (params: any) =>
        `${params.marker}${params.name}: ${
          config.showCount
            ? params.value
            : params.percent?.toFixed(1) + '%'
        }`
      ),
      legend: {
        bottom: 0,
        left: 'center',
        itemWidth:  10,
        itemHeight: 10,
        itemGap:    16,
        textStyle: {
          fontFamily: t.fontFamily,
          color:      t.legendColor,
          fontSize:   12,
        },
        orient: 'horizontal',
      },
      series: [{
        type:   'pie',
        radius: [
          config.innerRadius ?? '40%',
          config.outerRadius ?? '62%',
        ],
        avoidLabelOverlap: false,
        label:     { show: false },
        labelLine: { show: false },
        emphasis: { scale: true, scaleSize: 8 },
        data: seriesData,
      }],
    };
  }

  // ── §2  Line ────────────────────────────────────────────────────────────────
  buildLine(
    series:  LineSeries[],
    config:  LineChartConfig,
    theme:   ChartThemeContext,
  ): EChartsOption {
    const t = defaults(theme);

    const echartseries = series.map((s, i) => ({
      name:       s.name,
      type:       'line' as const,
      data:       s.data,
      smooth:     config.smooth ?? true,
      symbol:     'circle',
      symbolSize: 6,
      lineStyle:  { width: 2.5 },
      itemStyle:  { color: s.color ?? this.getColor(s.name) },
      areaStyle:  config.area
        ? { opacity: 0.12, color: s.color ?? this.getColor(s.name) }
        : undefined,
    }));

    return {
      title: this.buildTitle(config.title, config.subtitle, t),
      tooltip: this.buildTooltip(t, undefined, 'axis'),
      legend: {
        bottom: 0,
        left: 'center',
        textStyle: { fontFamily: t.fontFamily, color: t.legendColor, fontSize: t.defaultFontSize },
      },
      grid: {
        top: config.title ? 70 : 16,
        left: 12, right: 12, bottom: 40,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: config.xAxisData,
        axisLabel: {
          fontFamily: t.fontFamily,
          color: t.axisLabelColor,
          fontSize: 11,
        },
        axisLine:  { lineStyle: { color: t.splitLineColor } },
        axisTick:  { show: false },
      },
      yAxis: {
        type: 'value',
        name: config.yAxisLabel,
        nameTextStyle: { fontFamily: t.fontFamily, color: t.axisLabelColor, fontSize: 11 },
        axisLabel: { fontFamily: t.fontFamily, color: t.axisLabelColor, fontSize: 11 },
        splitLine: { lineStyle: { color: t.splitLineColor, type: 'dashed' } },
      },
      series: echartseries,
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  // ── Color Resolver ─────────────────────────────────────────────────────
  private getColor(category: string): string {
    // Use app-provided strategy if available
    if (this.colorStrategy) {
      return this.colorStrategy.getColor(category);
    }
    // Fallback colors
    return this.getFallbackColor(category);
  }

  private getFallbackColor(category: string): string {
    const fallback: Record<string, string> = {
      'Good': '#4ade80',
      'Bad': '#f87171',
      'NA': '#94a3b8',
    };
    return fallback[category] || '#3b82f6';
  }

  private buildTitle(
    text:    string | undefined,
    subtext: string | undefined,
    t:       Required<ChartThemeContext>,
  ): EChartsOption['title'] {
    if (!text) return undefined;
    return {
      text,
      subtext,
      textStyle: {
        fontFamily:  t.fontFamily,
        fontSize:    t.headerFontSize,
        fontWeight:  t.headerFontWeight as any,
        color:       t.headerColor,
      },
      subtextStyle: {
        fontFamily: t.fontFamily,
        fontSize:   t.subheaderFontSize,
        color:      t.subheaderColor,
      },
    };
  }

  private buildTooltip(
    t:         Required<ChartThemeContext>,
    formatter?: (params: any) => string,
    trigger:   'item' | 'axis' = 'item',
  ): EChartsOption['tooltip'] {
    return {
      trigger,
      backgroundColor:  t.tooltipBg,
      borderWidth:      1,
      borderColor:      t.tooltipBorderColor,
      borderRadius:     12,
      confine:          true,
      textStyle: {
        color:      t.tooltipTextColor,
        fontFamily: t.fontFamily,
        fontSize:   t.defaultFontSize,
      },
      ...(formatter ? { formatter } : {}),
    };
  }

  private normalizeLabel(label: string): string {
  switch (label?.trim()?.toUpperCase()) {
    case 'NA':
    case 'N/A':
      return 'Not Live';

    default:
      return label;
  }
}
}