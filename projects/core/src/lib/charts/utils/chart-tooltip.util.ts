// SINGLE source of truth for ALL ECharts tooltip HTML.
// No Angular dependency — pure functions, safe in computed() or any method.
//
// Consumers:
//   ReportDataService          → buildMultiTooltip, buildSingleTooltip
//   EnergyVsExpectedComponent  → buildDualTooltip
//   Any future chart            → import from here, never re-implement inline
//
// Row anatomy:  ● (colored dot)  |  name (truncated)  |  value + unit (bold)
// ─────────────────────────────────────────────────────────────────────────────

import { primary500 } from '../../../styles/custom_style_variables';
import { ChartThemeTokens, EnergyNorm } from '../models/chart.model';

// ── Internal row model ────────────────────────────────────────────────────────

export interface TooltipRow {
  /** CSS color string — dot fill */
  color:       string;
  /** Series / slot label */
  name:        string;
  /** Raw value ALREADY divided by norm.divisor (pass null for N/A) */
  value:       number | null;
  /** Normalisation meta for unit + decimal formatting */
  norm:        EnergyNorm;
  /** Max px width for the name span before ellipsis (default 130) */
  maxNameLen?: number;
}

// ── Shared constants ──────────────────────────────────────────────────────────

/** Narrow non-breaking space between value and unit (U+202F) */
const NNBSP = '\u202F';

// ─────────────────────────────────────────────────────────────────────────────
// COLOR RESOLUTION
//
// ECharts passes p.color as EITHER:
//   • a plain CSS string  "#2563EB"         → bar with itemStyle.color string
//   • a LinearGradient object               → bar built with graphic.LinearGradient
//   • a hex string from line/area series    → always fine
//
// When a gradient object leaks into the tooltip formatter, interpolating it
// directly produces "background:[object Object]" and the dot disappears.
//
// Strategy (in priority order):
//   1. p.borderColor         — ECharts sometimes copies the base color here
//   2. p.color (string)      — plain series color, safe to use directly
//   3. LinearGradient.colorStops[0].color — first stop of gradient
//   4. SLOT_PALETTE[p.seriesIndex % 6]    — absolute fallback from known palette
// ─────────────────────────────────────────────────────────────────────────────

/** The same palette used by slotPaletteColor() in chart.model — kept in sync manually */
const _FALLBACK_PALETTE = [
  '#2563EB', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#e34ce8',
] as const;

/**
 * Extracts a safe CSS color string from an ECharts formatter param entry.
 * Handles plain strings, LinearGradient objects, and index-based fallback.
 */
export function resolveParamColor(p: any): string {
  // 1. borderColor is set to the raw hex on bar series even when fill is gradient
  if (typeof p.borderColor === 'string' && p.borderColor.startsWith('#')) {
    return p.borderColor;
  }

  // 2. Plain CSS color string — safe as-is
  if (typeof p.color === 'string') return p.color;

  // 3. ECharts LinearGradient object — dig into colorStops
  if (p.color && typeof p.color === 'object') {
    const stops: any[] | undefined =
      p.color.colorStops ??          // LinearGradient internal shape
      p.color.colorStops;
    if (Array.isArray(stops) && stops.length > 0) {
      const first = stops[0]?.color;
      if (typeof first === 'string') return first;
    }
  }

  // 4. Last resort: slot palette by series index
  const idx = typeof p.seriesIndex === 'number' ? p.seriesIndex : 0;
  return _FALLBACK_PALETTE[idx % _FALLBACK_PALETTE.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// LOW-LEVEL: single row  ● name  value unit
// ─────────────────────────────────────────────────────────────────────────────

export function buildTooltipRow(row: TooltipRow, theme: ChartThemeTokens): string {
  const maxW      = row.maxNameLen ?? 130;
  const displayed = _formatValue(row.value, row.norm);
  // row.color is already resolved by the caller via resolveParamColor()
  return `
    <div style="display:flex;align-items:center;gap:8px;margin:3px 0">
      <span style="width:8px;height:8px;border-radius:50%;background:${row.color};flex-shrink:0;display:inline-block"></span>
      <span style="flex:1;font-size:11px;font-family:${theme.fontFamily};white-space:nowrap;overflow:hidden;max-width:${maxW}px;text-overflow:ellipsis;color:${theme.tooltipTextColor}">${row.name}</span>
      ${displayed}
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MID-LEVEL: row list from raw ECharts params
//
// Shared by buildMultiTooltip and buildDualTooltip.
// Filters out series whose name includes 'Trend' (overlay helpers).
// ─────────────────────────────────────────────────────────────────────────────

export function buildRowsFromParams(
  params:       any,
  norm:         EnergyNorm,
  theme:        ChartThemeTokens,
  options?: {
    maxNameLen?:    number;
    excludeTrend?:  boolean;   // default true
  },
): string {
  const items         = (Array.isArray(params) ? params : [params]) as any[];
  const excludeTrend  = options?.excludeTrend ?? true;
  const maxNameLen    = options?.maxNameLen;

  return items
    .filter(p => p.seriesName && !(excludeTrend && p.seriesName.includes('Trend')))
    .map(p => buildTooltipRow(
      { color: resolveParamColor(p), name: p.seriesName, value: p.value, norm, maxNameLen },
      theme,
    ))
    .join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// HIGH-LEVEL: wrapper shell  (header + rows)
// ─────────────────────────────────────────────────────────────────────────────

export function buildTooltipShell(
  theme:   ChartThemeTokens,
  header:  string,
  rows:    string,
  minWidth = 200,
): string {
  if (!rows) return '';
  return `
    <div style="
      background:linear-gradient(135deg,${theme.bg1},${theme.bg2});
      border-radius:10px;padding:10px 14px;
      min-width:${minWidth}px;max-width:260px">
      <div style="
        font-weight:600;margin-bottom:6px;font-size:10px;opacity:.6;
        font-family:${theme.fontFamily};letter-spacing:.06em;
        text-transform:uppercase;color:${theme.tooltipTextColor}">
        ${header}
      </div>
      ${rows}
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NAMED BUILDERS — one function per chart variant
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Single-series tooltip.
 * Used by: buildTimeSeriesOption (DailyMonthlyEnergy)
 *
 * @param params   ECharts formatter params (object or single-element array)
 * @param norm     Energy normalisation (unit + decimals)
 * @param theme    Resolved chart theme tokens
 * @param kpiLabel Short KPI label appended to the timestamp header
 */
export function buildSingleTooltip(
  params:    any,
  norm:      EnergyNorm,
  theme:     ChartThemeTokens,
  kpiLabel?: string,
): string {
  const p   = Array.isArray(params) ? params[0] : params;
  if (!p) return '';

  const header    = `${p.name ?? ''}${kpiLabel ? ' · ' + kpiLabel : ''}`;
  const displayed = _formatValue(p.value, norm, 12);
  const dotColor  = resolveParamColor(p);

  const row = `
    <div style="display:flex;align-items:center;gap:8px">
      <span style="width:8px;height:8px;border-radius:50%;background:${dotColor};flex-shrink:0;display:inline-block"></span>
      ${displayed}
    </div>`;

  return buildTooltipShell(theme, header, row, 180);
}

/**
 * Multi-series tooltip — multiple months or years on the same x-axis tick.
 * Used by: buildComparisonDailyOption, buildComparisonMonthlyOption
 *
 * @param params     ECharts formatter params array
 * @param norm       Energy normalisation
 * @param theme      Resolved chart theme tokens
 * @param groupLabel x-axis label, e.g. "Day 15" or "Apr"
 * @param kpiLabel   Short KPI label, e.g. "AC Energy"
 */
export function buildMultiTooltip(
  params:     any,
  norm:       EnergyNorm,
  theme:      ChartThemeTokens,
  groupLabel: string,
  kpiLabel:   string,
): string {
  const rows = buildRowsFromParams(params, norm, theme);
  return buildTooltipShell(theme, `${groupLabel} · ${kpiLabel}`, rows);
}

/**
 * Dual-series tooltip — two KPIs for the same month (EnergyVsExpected).
 * Used by: EnergyVsExpectedComponent
 *
 * @param params  ECharts formatter params
 * @param norm    Energy normalisation (shared across both series)
 * @param theme   Resolved chart theme tokens
 * @param month   x-axis label, e.g. "Jan"
 */
export function buildDualTooltip(
  params:  any,
  norm:    EnergyNorm,
  theme:   ChartThemeTokens,
  month:   string,
): string {
  const rows = buildRowsFromParams(params, norm, theme, {
    maxNameLen:   140,
    excludeTrend: true,
  });
  return buildTooltipShell(theme, month, rows, 220);
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a numeric value with its normalised unit.
 * Returns an italic "N/A" span when value is null/undefined.
 *
 * @param value      Already-normalised numeric value (or null)
 * @param norm       Unit + decimal config
 * @param fontSize   Font size for the <b> tag (default 11)
 */
function _formatValue(
  value:    number | null | undefined,
  norm:     EnergyNorm,
  fontSize  = 11,
): string {
  if (value == null) {
    return `<span style="opacity:.45;font-style:italic;font-size:11px">N/A</span>`;
  }
  return `<b style="font-size:${fontSize}px;white-space:nowrap; color:${primary500}">
    ${(+value).toFixed(norm.decimals)}${NNBSP}${norm.unit}
  </b>`;
}