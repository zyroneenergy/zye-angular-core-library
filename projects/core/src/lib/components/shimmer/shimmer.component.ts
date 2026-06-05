import {
  Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ShimmerShape = 'line' | 'block' | 'circle' | 'chip' | 'title' | 'subtitle' | 'text-sm';
export type ShimmerPreset =
  // ── Auth pages ──────────────────────────────────────────────────
  | 'auth-login' | 'auth-register'
  // ── Dashboard / Portfolio ────────────────────────────────────────
  | 'portfolio-header' | 'portfolio-summary-card' | 'portfolio-site-row'
  | 'portfolio-map' | 'portfolio-bookmarks' | 'dashboard-page'
  // ── Sites list ──────────────────────────────────────────────────
  | 'sites-table-row' | 'sites-table'
  // ── Site detail — Analytics tab ─────────────────────────────────
  | 'analytics-kpi-strip'   // Today / This Month / This Year strip
  | 'analytics-bar-chart'   // Performance Trends / Energy Trend bar chart
  | 'analytics-kpi-compare' // KPI Comparisons line chart
  | 'analytics-loss-card'   // Loss Classification panel
  | 'analytics-page'
  // ── Site detail — Analytics (original) ──────────────────────────
  | 'site-ai-summary'       // red/orange AI summary card
  | 'site-kpi-row'          // DC/AC/CUF/Yield 4-chip row
  | 'site-issue-item'       // single issue row in left panel
  | 'site-issues-panel'     // full left panel
  | 'site-energy-chart'     // main power chart
  | 'site-heatmap'          // Solar Intensity heatmap
  | 'site-donut'            // Data Quality donut
  | 'site-waterfall'        // Energy Loss & classification waterfall
  | 'site-inverter-loss-chart' // Inverter Level Loss scatter
  | 'site-analytics-page'  // full analytics page
  // ── Site detail — Layout tab ─────────────────────────────────────
  | 'layout-block'          // one block group of inverter tiles
  | 'layout-page'           // full layout page
  // ── Site detail — Monitoring tab ─────────────────────────────────
  | 'monitoring-chart'      // Inverter Comparison line chart
  | 'monitoring-downtime-item' | 'monitoring-downtimes'
  | 'monitoring-table-row'  | 'monitoring-table'
  | 'monitoring-page'
  // ── Site detail — Report tab ─────────────────────────────────────
  | 'report-page'
  // ── Generic primitives (kept for custom usage) ───────────────────
  | 'card' | 'card-compact' | 'stat-card' | 'kpi'
  | 'chart' | 'chart-bar'
  | 'table-row' | 'table' | 'table-inline'
  | 'list-item' | 'page'| 'site-chart';

export interface ShimmerItem {
  shape: ShimmerShape;
  width?: string; height?: string; radius?: string;
  delay?: number; marginTop?: string; marginLeft?: string; flex?: string;
  /** internal layout hints */
  _row?: boolean; _indent?: string;
}

@Component({
  selector: 'lib-shimmer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shimmer.component.html',
  styleUrls: ['./shimmer.component.scss'],
})
export class ShimmerComponent implements OnChanges {
  @Input() preset?: ShimmerPreset;
  @Input() count: number = 1;
  @Input() shape?: ShimmerShape;
  @Input() width?: string;
  @Input() height?: string;
  @Input() items?: ShimmerItem[];
  @Input() staggerDelay: number = 40;
  /** For table-inline: number of columns per row */
  @Input() columns: number = 6;

  renderedGroups = signal<ShimmerItem[][]>([]);

  ngOnChanges(_: SimpleChanges): void { this.renderedGroups.set(this.buildGroups()); }

  private buildGroups(): ShimmerItem[][] {
    if (this.items?.length) return [this.items];
    if (this.shape && !this.preset) return [[{ shape: this.shape, width: this.width, height: this.height }]];
    const tpl = this.preset ? this.buildPreset(this.preset) : [];
    if (!tpl.length) return [];
    return Array.from({ length: this.count }, (_, i) =>
      tpl.map(item => ({ ...item, delay: (item.delay ?? 0) + i * this.staggerDelay }))
    );
  }

  // ─────────────────────────────────────────────────────────────────
  private buildPreset(p: ShimmerPreset): ShimmerItem[] {
    switch (p) {

      // ── AUTH ──────────────────────────────────────────────────────
      case 'auth-login': return [
        { shape: 'block',    width: '40px',  height: '40px', radius: '8px', delay: 0   },
        { shape: 'title',    width: '180px',                 delay: 30  },
        { shape: 'subtitle', width: '240px',                 delay: 50  },
        { shape: 'subtitle', width: '60px',                  delay: 70  },
        { shape: 'block',    width: '100%',  height: '36px', delay: 90  },
        { shape: 'subtitle', width: '60px',                  delay: 110 },
        { shape: 'block',    width: '100%',  height: '36px', delay: 130 },
        { shape: 'block',    width: '100%',  height: '36px', delay: 170, radius: '6px' },
        { shape: 'subtitle', width: '220px', marginTop: '8px', delay: 200 },
      ];

      case 'auth-register': return [
        { shape: 'block',    width: '40px',  height: '40px', radius: '8px', delay: 0   },
        { shape: 'title',    width: '180px',                 delay: 30  },
        { shape: 'subtitle', width: '240px',                 delay: 50  },
        { shape: 'subtitle', width: '100px',                 delay: 70  },
        { shape: 'block',    width: '100%',  height: '36px', delay: 90  },
        { shape: 'subtitle', width: '60px',                  delay: 110 },
        { shape: 'block',    width: '100%',  height: '36px', delay: 130 },
        { shape: 'subtitle', width: '80px',                  delay: 150 },
        { shape: 'block',    width: '100%',  height: '36px', delay: 170 },
        { shape: 'subtitle', width: '80px',                  delay: 190 },
        { shape: 'block',    width: '100%',  height: '36px', delay: 210 },
        { shape: 'block',    width: '100%',  height: '36px', delay: 250, radius: '6px' },
        { shape: 'subtitle', width: '200px', marginTop: '8px', delay: 280 },
      ];

      // ── PORTFOLIO / DASHBOARD ─────────────────────────────────────
      case 'portfolio-header': return [
        { shape: 'block',    width: '260px', height: '72px', delay: 0  },
        { shape: 'subtitle', width: '200px',                 delay: 30 },
      ];

      case 'portfolio-summary-card': return [
        { shape: 'subtitle', width: '140px', delay: 0  },
        { shape: 'title',    width: '220px',             delay: 30 },
        { shape: 'line',     width: '100%',              delay: 50 },
        { shape: 'line',     width: '90%',               delay: 70 },
        { shape: 'line',     width: '80%',               delay: 90 },
        { shape: 'block',    width: '100%', height: '1px', delay: 110, marginTop: '8px' },
        { shape: 'chip',     width: '90px',              delay: 130 },
        { shape: 'chip',     width: '90px',              delay: 145 },
        { shape: 'chip',     width: '90px',              delay: 160 },
      ];

      case 'portfolio-site-row': return [
        { shape: 'title',    width: '55%', delay: 0  },
        { shape: 'subtitle', width: '40%', delay: 20 },
        { shape: 'chip',     width: '80px', delay: 40 },
        { shape: 'line',     width: '30%', delay: 60 },
        { shape: 'line',     width: '30%', delay: 80 },
      ];

      case 'portfolio-map': return [
        { shape: 'block', width: '100%', height: '100%', radius: '12px', delay: 0 },
      ];

      case 'portfolio-bookmarks': return [
        { shape: 'title',    width: '160px', delay: 0   },
        { shape: 'subtitle', width: '200px', delay: 20  },
        { shape: 'line',     width: '100%',  delay: 50  },
        { shape: 'line',     width: '100%',  delay: 80  },
        { shape: 'line',     width: '100%',  delay: 110 },
        { shape: 'line',     width: '100%',  delay: 140 },
        { shape: 'line',     width: '100%',  delay: 170 },
      ];

      case 'dashboard-page': return [
        // header strip
        { shape: 'block',    width: '100%',  height: '90px',  delay: 0,   radius: '12px' },
        // capacity cards row
        { shape: 'block',    width: '23%',   height: '70px',  delay: 80,  radius: '10px' },
        { shape: 'block',    width: '23%',   height: '70px',  delay: 100, radius: '10px', marginLeft: '2%' },
        { shape: 'block',    width: '23%',   height: '70px',  delay: 120, radius: '10px', marginLeft: '2%' },
        { shape: 'block',    width: '23%',   height: '70px',  delay: 140, radius: '10px', marginLeft: '2%' },
        // summary card
        { shape: 'block',    width: '100%',  height: '180px', delay: 190, radius: '12px' },
        // map
        { shape: 'block',    width: '100%',  height: '200px', delay: 240, radius: '12px' },
      ];

      // ── ANALYTICS — KPI STRIP (Today / This Month / This Year) ───
      case 'analytics-kpi-strip': return [
        { shape: 'block', width: '32%',  height: '40px', delay: 0,  radius: '10px' },
      ];

      // ── ANALYTICS — BAR CHART (Performance Trends / Energy Trend) ─
      case 'analytics-bar-chart': return [
        { shape: 'title',    width: '35%', delay: 0  },
        { shape: 'subtitle', width: '55%', delay: 20 },
        // toggle pills (Daily/Monthly + metric selector)
        { shape: 'chip',  width: '50px', delay: 35 },
        { shape: 'chip',  width: '60px', delay: 45 },
        { shape: 'chip',  width: '100px', delay: 55 },
        // month selector chips
        { shape: 'chip',  width: '70px', delay: 65 },
        { shape: 'chip',  width: '70px', delay: 75 },
        { shape: 'chip',  width: '70px', delay: 85 },
        // bars — vary heights to simulate real chart bars
        { shape: 'block', width: '2.4%', height: '100px', delay: 100, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '75px',  delay: 108, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '120px', delay: 116, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '90px',  delay: 124, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '130px', delay: 132, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '60px',  delay: 140, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '145px', delay: 148, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '110px', delay: 156, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '95px',  delay: 164, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '125px', delay: 172, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '80px',  delay: 180, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '140px', delay: 188, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '70px',  delay: 196, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '115px', delay: 204, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '85px',  delay: 212, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '160px', delay: 220, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '105px', delay: 228, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '135px', delay: 236, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '65px',  delay: 244, marginLeft: '0.8%' },
        { shape: 'block', width: '2.4%', height: '120px', delay: 252, marginLeft: '0.8%' },
      ];

      // ── ANALYTICS — KPI COMPARE ───────────────────────────────────
      case 'analytics-kpi-compare': return [
        { shape: 'title',    width: '40%',  delay: 0  },
        { shape: 'subtitle', width: '60%',  delay: 20 },
        { shape: 'chip',     width: '140px', delay: 35 },
        { shape: 'block',    width: '100%', height: '180px', delay: 60, radius: '8px' },
        { shape: 'subtitle', width: '100%', delay: 200 },
      ];

      // ── ANALYTICS — LOSS CARD ─────────────────────────────────────
      case 'analytics-loss-card': return [
        { shape: 'title',    width: '55%',  delay: 0   },
        { shape: 'subtitle', width: '75%',  delay: 20  },
        { shape: 'subtitle', width: '90px', delay: 35  },
        { shape: 'line',     width: '100%', delay: 60  },
        { shape: 'block',    width: '100%', height: '6px',  delay: 80,  radius: '3px' },
        { shape: 'line',     width: '100%', delay: 100 },
        { shape: 'block',    width: '80%',  height: '6px',  delay: 120, radius: '3px' },
        { shape: 'line',     width: '100%', delay: 140 },
        { shape: 'block',    width: '65%',  height: '6px',  delay: 160, radius: '3px' },
        { shape: 'line',     width: '100%', delay: 180 },
        { shape: 'block',    width: '20%',  height: '6px',  delay: 200, radius: '3px' },
      ];

      case 'analytics-page': return [
        ...this.buildPreset('analytics-kpi-strip').map(i => ({ ...i })),
        ...this.buildPreset('analytics-bar-chart').map(i => ({ ...i, delay: (i.delay ?? 0) + 100 })),
        ...this.buildPreset('analytics-bar-chart').map(i => ({ ...i, delay: (i.delay ?? 0) + 200 })),
        ...this.buildPreset('analytics-kpi-compare').map(i => ({ ...i, delay: (i.delay ?? 0) + 300 })),
        ...this.buildPreset('analytics-loss-card').map(i => ({ ...i, delay: (i.delay ?? 0) + 400 })),
      ];

      // ── SITE ANALYTICS TAB ────────────────────────────────────────
      case 'site-ai-summary': return [
        { shape: 'block',    width: '100%', height: '180px', delay: 0,  radius: '10px' },
      ];

            case 'site-chart': return [

        // Main chart area — realistic large block with slight rounded corners
        { shape: 'block',    width: '100%', height: this.height ?? '260px', 
          delay: 90, radius: '12px' },
      ];

      case 'site-kpi-row': return [
        { shape: 'block', width: '23%', height: '56px', delay: 0,  radius: '8px' },
        { shape: 'block', width: '23%', height: '56px', delay: 20, radius: '8px', marginLeft: '2%' },
        { shape: 'block', width: '23%', height: '56px', delay: 40, radius: '8px', marginLeft: '2%' },
        { shape: 'block', width: '23%', height: '56px', delay: 60, radius: '8px', marginLeft: '2%' },
      ];

      case 'site-issue-item': return [
        { shape: 'title',    width: '70%',  delay: 0  },
        { shape: 'subtitle', width: '90%',  delay: 20 },
        { shape: 'chip',     width: '80px', delay: 40 },
        { shape: 'line',     width: '45%',  delay: 55 },
        { shape: 'line',     width: '45%',  delay: 70 },
      ];

      case 'site-issues-panel':
        return Array.from({ length: 6 }, (_, i) =>
          this.buildPreset('site-issue-item').map(item => ({
            ...item, delay: (item.delay ?? 0) + i * 80,
          }))
        ).flat();

      case 'site-energy-chart': return [
        { shape: 'title',    width: '30%',  delay: 0  },
        { shape: 'subtitle', width: '50%',  delay: 20 },
        { shape: 'chip',     width: '60px', delay: 35 },
        { shape: 'chip',     width: '80px', delay: 45 },
        { shape: 'chip',     width: '80px', delay: 55 },
        { shape: 'block',    width: '100%', height: this.height ?? '200px', delay: 80, radius: '8px' },
      ];

      case 'site-heatmap': return [
        { shape: 'title',    width: '50%',  delay: 0  },
        { shape: 'subtitle', width: '75%',  delay: 20 },
        { shape: 'block',    width: '100%', height: '220px', delay: 50, radius: '8px' },
      ];

      case 'site-donut': return [

        { shape: 'subtitle', width: '80px', delay: 80 },
        { shape: 'circle',   width: '200px', height: '200px', delay: 50 },
      ];

      case 'site-waterfall': return [
        { shape: 'title',    width: '50%',  delay: 0  },
        { shape: 'subtitle', width: '70%',  delay: 20 },
        { shape: 'block',    width: '100%', height: '80px',  delay: 50, radius: '6px' },
      ];

      case 'site-inverter-loss-chart': return [
        { shape: 'title',    width: '55%', delay: 0  },
        { shape: 'subtitle', width: '70%', delay: 20 },
        { shape: 'block',    width: '100%', height: '140px', delay: 50, radius: '8px' },
      ];

      case 'site-analytics-page': return [
        ...this.buildPreset('site-ai-summary'),
        ...this.buildPreset('site-kpi-row').map(i => ({ ...i, delay: (i.delay ?? 0) + 120 })),
        ...this.buildPreset('site-energy-chart').map(i => ({ ...i, delay: (i.delay ?? 0) + 200 })),
        ...this.buildPreset('site-heatmap').map(i => ({ ...i, delay: (i.delay ?? 0) + 300 })),
        ...this.buildPreset('site-donut').map(i => ({ ...i, delay: (i.delay ?? 0) + 400 })),
        ...this.buildPreset('site-waterfall').map(i => ({ ...i, delay: (i.delay ?? 0) + 480 })),
      ];

      // ── LAYOUT TAB ───────────────────────────────────────────────
      case 'layout-block': return [
        { shape: 'block',    width: '70px',  height: '70px', delay: 0,  radius: '10px', marginLeft: '0' },
        { shape: 'block',    width: '70px',  height: '70px', delay: 15,  radius: '10px', marginLeft: '8px' },
        { shape: 'block',    width: '70px',  height: '70px', delay: 30,  radius: '10px', marginLeft: '8px' },
        { shape: 'subtitle', width: '200px', delay: 110 },
      ];

      case 'layout-page': return [
        ...this.buildPreset('layout-block'),
        ...this.buildPreset('layout-block').map(i => ({ ...i, delay: (i.delay ?? 0) + 120 })),
        ...this.buildPreset('layout-block').map(i => ({ ...i, delay: (i.delay ?? 0) + 240 })),
      ];

      // ── MONITORING TAB ───────────────────────────────────────────
      case 'monitoring-chart': return [
        { shape: 'title',    width: '40%',  delay: 0  },
        { shape: 'subtitle', width: '55%',  delay: 20 },
        // inverter chip filters
        { shape: 'chip', width: '70px', delay: 35 },
        { shape: 'chip', width: '70px', delay: 45 },
        { shape: 'chip', width: '70px', delay: 55 },
        { shape: 'chip', width: '70px', delay: 65 },
        { shape: 'chip', width: '70px', delay: 75 },
        { shape: 'chip', width: '70px', delay: 85 },
        // main line chart area
        { shape: 'block', width: '100%', height: this.height ?? '260px', delay: 100, radius: '8px' },
        // legend chips
        { shape: 'chip', width: '60px', delay: 200 },
        { shape: 'chip', width: '60px', delay: 210 },
        { shape: 'chip', width: '60px', delay: 220 },
        { shape: 'chip', width: '60px', delay: 230 },
        { shape: 'chip', width: '60px', delay: 240 },
      ];

      case 'monitoring-downtime-item': return [
        { shape: 'circle',   width: '10px',  height: '10px', delay: 0  },
        { shape: 'title',    width: '60%',                   delay: 10 },
        { shape: 'subtitle', width: '80%',                   delay: 25 },
        { shape: 'chip',     width: '60px',                  delay: 40 },
      ];

      case 'monitoring-downtimes':
        return Array.from({ length: 6 }, (_, i) =>
          this.buildPreset('monitoring-downtime-item').map(item => ({
            ...item, delay: (item.delay ?? 0) + i * 60,
          }))
        ).flat();

      case 'monitoring-table-row': return [
        { shape: 'line',  width: '22%',  delay: 0  },
        { shape: 'line',  width: '22%',  delay: 15 },
        { shape: 'circle', width: '22px', height: '22px', delay: 25 },
        { shape: 'line',  width: '10%',  delay: 35 },
        { shape: 'line',  width: '12%',  delay: 45 },
        { shape: 'line',  width: '12%',  delay: 55 },
      ];

      case 'monitoring-table':
        return Array.from({ length: 10 }, (_, i) =>
          this.buildPreset('monitoring-table-row').map(item => ({
            ...item, delay: (item.delay ?? 0) + i * 40,
          }))
        ).flat();

      case 'monitoring-page': return [
        ...this.buildPreset('monitoring-chart'),
        ...this.buildPreset('monitoring-downtimes').map(i => ({ ...i, delay: (i.delay ?? 0) + 250 })),
        ...this.buildPreset('monitoring-table').map(i => ({ ...i, delay: (i.delay ?? 0) + 500 })),
      ];

      // ── REPORT TAB ───────────────────────────────────────────────
      case 'report-page': return [
        { shape: 'block',    width: '100%', height: '72px',  delay: 0,  radius: '10px' },
        { shape: 'title',    width: '50%',                   delay: 80  },
        { shape: 'subtitle', width: '70%',                   delay: 100 },
        ...this.buildPreset('analytics-bar-chart').map(i => ({ ...i, delay: (i.delay ?? 0) + 140 })),
        ...this.buildPreset('analytics-loss-card').map(i => ({ ...i, delay: (i.delay ?? 0) + 350 })),
      ];

      // ── GENERIC PRIMITIVES (backward-compat) ──────────────────────
      case 'card': return [
        { shape: 'circle',   width: '36px', height: '36px', delay: 0   },
        { shape: 'title',    width: '62%',                  delay: 30  },
        { shape: 'subtitle', width: '40%',                  delay: 50  },
        { shape: 'line',     width: '100%',                 delay: 70  },
        { shape: 'line',     width: '82%',                  delay: 90  },
        { shape: 'line',     width: '55%',                  delay: 110 },
        { shape: 'chip',     width: '72px',                 delay: 130 },
        { shape: 'chip',     width: '56px',                 delay: 150 },
      ];
      case 'card-compact': return [
        { shape: 'title', width: '55%', delay: 0  },
        { shape: 'line',  width: '90%', delay: 40 },
        { shape: 'line',  width: '70%', delay: 70 },
      ];
      case 'stat-card': return [
        { shape: 'circle',   width: '40px', height: '40px', delay: 0  },
        { shape: 'block',    width: '50%',  height: '20px', delay: 30 },
        { shape: 'subtitle', width: '65%',                  delay: 60 },
      ];
      case 'kpi': return [
        { shape: 'circle',   width: '44px', height: '44px', delay: 0  },
        { shape: 'block',    width: '70px', height: '24px', delay: 30 },
        { shape: 'subtitle', width: '80px',                 delay: 55 },
      ];
      case 'chart': return [
        { shape: 'title',    width: '35%',                              delay: 0  },
        { shape: 'subtitle', width: '55%',                              delay: 30 },
        { shape: 'block',    width: '100%', height: this.height ?? '220px', delay: 60 },
      ];
      case 'chart-bar': return [
        { shape: 'title',    width: '30%', delay: 0  },
        { shape: 'subtitle', width: '50%', delay: 20 },
        { shape: 'block', width: '8%', height: '80px',  delay: 40,  marginLeft: '3%' },
        { shape: 'block', width: '8%', height: '130px', delay: 55,  marginLeft: '3%' },
        { shape: 'block', width: '8%', height: '60px',  delay: 70,  marginLeft: '3%' },
        { shape: 'block', width: '8%', height: '160px', delay: 85,  marginLeft: '3%' },
        { shape: 'block', width: '8%', height: '100px', delay: 100, marginLeft: '3%' },
        { shape: 'block', width: '8%', height: '140px', delay: 115, marginLeft: '3%' },
        { shape: 'block', width: '8%', height: '70px',  delay: 130, marginLeft: '3%' },
        { shape: 'block', width: '8%', height: '120px', delay: 145, marginLeft: '3%' },
      ];
      case 'table-row': return [
        { shape: 'line', width: '15%',  delay: 0  },
        { shape: 'line', width: '25%',  delay: 20 },
        { shape: 'line', width: '20%',  delay: 40 },
        { shape: 'chip', width: '60px', delay: 60 },
        { shape: 'line', width: '12%',  delay: 80 },
      ];
      case 'table':
        return Array.from({ length: 5 }, (_, i) => [
          { shape: 'line' as ShimmerShape, width: '15%',  delay: i * 60      },
          { shape: 'line' as ShimmerShape, width: '25%',  delay: i * 60 + 20 },
          { shape: 'line' as ShimmerShape, width: '20%',  delay: i * 60 + 40 },
          { shape: 'chip' as ShimmerShape, width: '60px', delay: i * 60 + 60 },
        ]).flat();
      case 'table-inline':
        return Array.from({ length: this.columns }, (_, c) => ({
          shape: 'line' as ShimmerShape,
          width: c === 0 ? '20px' : c === this.columns - 1 ? '40%' : '45%',
          height: '13px',
          delay: c ,
        }));
      case 'list-item': return [
        { shape: 'circle',   width: '32px', height: '32px', delay: 0  },
        { shape: 'title',    width: '55%',                  delay: 30 },
        { shape: 'subtitle', width: '38%',                  delay: 55 },
      ];
      case 'page': return [
        { shape: 'block', width: '220px', height: '32px',  delay: 0   },
        { shape: 'line',  width: '340px',                  delay: 30  },
        { shape: 'block', width: '23%',   height: '80px',  delay: 80  },
        { shape: 'block', width: '23%',   height: '80px',  delay: 110 },
        { shape: 'block', width: '23%',   height: '80px',  delay: 140 },
        { shape: 'block', width: '23%',   height: '80px',  delay: 170 },
        { shape: 'block', width: '100%',  height: '200px', delay: 220 },
      ];

      default: return [];
    }
  }

  get isTableInline(): boolean { return this.preset === 'table-inline'; }
  get isBarPreset(): boolean {
    return this.preset === 'analytics-bar-chart' || this.preset === 'chart-bar';
  }
  get isLayoutPreset(): boolean { return this.preset === 'layout-block' || this.preset === 'layout-page'; }

  hasHeader(g: ShimmerItem[]): boolean {
    return g.some(i => i.shape === 'circle') && g.some(i => i.shape === 'title' || i.shape === 'subtitle');
  }
  getCircle(g: ShimmerItem[]): ShimmerItem | undefined { return g.find(i => i.shape === 'circle'); }
  getHeaderLines(g: ShimmerItem[]): ShimmerItem[] { return g.filter(i => i.shape === 'title' || i.shape === 'subtitle'); }
  getBodyItems(g: ShimmerItem[]): ShimmerItem[] {
    return g.filter(i => i.shape !== 'circle' && i.shape !== 'title' && i.shape !== 'subtitle' && i.shape !== 'chip');
  }
  getChips(g: ShimmerItem[]): ShimmerItem[] { return g.filter(i => i.shape === 'chip'); }
  getBarItems(g: ShimmerItem[]): ShimmerItem[] {
    return g.filter(i => i.shape === 'block' && i.marginLeft);
  }
  getNonBarItems(g: ShimmerItem[]): ShimmerItem[] {
    return g.filter(i => !(i.shape === 'block' && i.marginLeft));
  }

  getItemStyle(item: ShimmerItem | undefined): Record<string, string> {
    if (!item) return {};
    const s: Record<string, string> = {};
    if (item.width)      s['width']           = item.width;
    if (item.height)     s['height']          = item.height;
    if (item.radius)     s['border-radius']   = item.radius;
    if (item.delay)      s['animation-delay'] = `${item.delay}ms`;
    if (item.marginTop)  s['margin-top']      = item.marginTop;
    if (item.marginLeft) s['margin-left']     = item.marginLeft;
    if (item.flex)       s['flex']            = item.flex;
    return s;
  }

  trackByIndex(i: number): number { return i; }
}