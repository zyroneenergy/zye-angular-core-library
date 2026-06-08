// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for ALL shared chart types, interfaces and constants.
// Import from this file only — never re-declare locally.
// ─────────────────────────────────────────────────────────────────────────────

import { NormalizeResult } from "../../utils";

// ── Primitive types ───────────────────────────────────────────────────────────

export type BinType       = 'daily' | 'monthly';
export type ChartTypeKey  = 'bar' | 'line' | 'area';
export type KpiKey        = 'ac_e' | 'dc_e' | 'dc_cap_e' | 'pr' | 'cuf';

export function isEnergyKpi(kpi: KpiKey): boolean {
  return kpi === 'ac_e' || kpi === 'dc_e' || kpi === 'dc_cap_e';
}

// ── KPI catalogue ─────────────────────────────────────────────────────────────

export interface KpiOption {
  key:   KpiKey;
  label: string;   // full label for dropdown
  short: string;   // axis / chip label
}

export const KPI_OPTIONS: readonly KpiOption[] = [
  { key: 'ac_e',     label: 'AC Energy',                        short: 'AC Energy' },
  { key: 'dc_e',     label: 'DC Energy',                        short: 'DC Energy' },
  { key: 'dc_cap_e', label: 'DC Capacity Energy',               short: 'DC Cap'    },
  { key: 'pr',       label: 'Performance Ratio (PR)',           short: 'PR (%)'    },
  { key: 'cuf',      label: 'Capacity Utilisation Factor (CUF)',short: 'CUF (%)'   },
] as const;

// ── Chart type catalogue ──────────────────────────────────────────────────────

export interface ChartTypeOption {
  key:   ChartTypeKey;
  title: string;
  // Inline SVG path data — keeps zero external icon dependency
  icon:  string;
}

export const CHART_TYPE_OPTIONS: readonly ChartTypeOption[] = [
  {
    key: 'bar',
    title: 'Bar',
    icon: `
      <rect x="3" y="12" width="4" height="9" fill="currentColor"/>
      <rect x="10" y="7" width="4" height="14" fill="currentColor"/>
      <rect x="17" y="4" width="4" height="17" fill="currentColor"/>
    `,
  },
  {
    key: 'line',
    title: 'Line',
    icon: `
      <polyline points="2 17 8 11 13 14 22 5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"/>
    `,
  },
  {
    key: 'area',
    title: 'Area',
    icon: `
      <polyline points="2 17 8 11 13 14 22 5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"/>
      <path d="M22 5v12H2V17Z"
        fill="currentColor"
        opacity="0.3"/>
    `,
  },
] as const;

// ── Month / Year selection models ─────────────────────────────────────────────

/** A zero-based (JS Date-compatible) month + year selection */
export interface MonthSelection {
  year:  number;
  month: number; // 0 = Jan … 11 = Dec
}

/** Slot for a month-picker chip row */
export interface MonthSlotState {
  id:           number;
  selection:    MonthSelection | null;
  dropdownOpen: boolean;
}

/** Slot for a year-picker chip row */
export interface YearSlotState {
  id:           number;
  year:         number | null;
  dropdownOpen: boolean;
}

/** Two-slot date range for continuous daily/monthly charts */
export interface MonthRangeSlot {
  id:           0 | 1;
  selection:    MonthSelection | null;
  dropdownOpen: boolean;
}

// ── Time range (daily calendar) ───────────────────────────────────────────────

export interface DailyRange {
  startStr: string; // 'YYYY-MM-DD'
  endStr:   string;
}

// ── Quick preset ──────────────────────────────────────────────────────────────

export interface QuickPreset {
  label:  string;
  build:  () => void; // executes selection side-effect; component owns state
}

// ── Slot colour palette (matches energy-comparison palette) ───────────────────

export const SLOT_PALETTE: readonly string[] = [
  '#2563EB', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#e34ce8',
] as const;

export function slotPaletteColor(index: number): string {
  return SLOT_PALETTE[index % SLOT_PALETTE.length];
}

// ── Bin tab definition ────────────────────────────────────────────────────────

export interface BinTabOption {
  key:   BinType;
  label: string;
}

export const BIN_TAB_OPTIONS: readonly BinTabOption[] = [
  { key: 'daily',   label: 'Daily'   },
  { key: 'monthly', label: 'Monthly' },
] as const;

// ── Calendar helpers (pure — no Angular dependency) ──────────────────────────

export const MONTH_SHORT = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
] as const;

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

export function toMonthStr(year: number, month: number): string {
  return `${year}-${pad(month + 1)}`;
}

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d.getTime());
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(year: number, month: number, n: number): MonthSelection {
  const d = new Date(year, month + n, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export function monthsBetween(
  startY: number, startM: number,
  endY:   number, endM:   number,
): number {
  return (endY - startY) * 12 + (endM - startM);
}

export function currentFyStart(): number {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

export function buildMonthShortLabel(year: number, month: number): string {
  return `${MONTH_SHORT[month]} '${String(year).slice(2)}`;
}

export function buildMonthLongLabel(year: number, month: number): string {
  return `${MONTH_SHORT[month]} ${year}`;
}

export type EnergyNorm = Pick<NormalizeResult, 'divisor' | 'unit' | 'decimals'>;

export interface ChartThemeTokens {
  isLight: boolean;
  axisColor: string;
  splitColor: string;
  bg1: string;
  bg2: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  legendColor: string;
  tooltipTextColor: string;
}

export type ChartStatus = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
 
// ── Donut / Pie ───────────────────────────────────────────────────────────────
export interface DonutSlice {
  name:  string;
  value: number;
  color?: string;   // optional override; builder fills from ColorStrategy if absent
}
 
export interface DonutChartConfig {
  title?:    string;
  subtitle?: string;
  /** inner radius as % string, e.g. '40%' */
  innerRadius?: string;
  /** outer radius as % string, e.g. '60%' */
  outerRadius?: string;
  /** if true, label shows count; default false (shows %) */
  showCount?: boolean;
}
 
// ── Line ──────────────────────────────────────────────────────────────────────
export interface LineSeries {
  name:   string;
  data:   (number | null)[];
  color?: string;
}
 
export interface LineChartConfig {
  title?:     string;
  subtitle?:  string;
  xAxisData:  string[];
  yAxisLabel?: string;
  smooth?:    boolean;
  area?:      boolean;
}
 
// ── Color strategy (injectable per-app override) ──────────────────────────────
export interface ChartColorStrategy {
  /** Return hex/rgb color for a named category like 'Critical', 'Good', 'NA' */
  getColor(category: string): string;
}