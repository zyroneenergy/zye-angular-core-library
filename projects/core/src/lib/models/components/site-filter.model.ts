// ── Operator sets ─────────────────────────────────────────────────────────────

export type NumericOperator = 'equal_to' | 'greater_than' | 'less_than' | 'between';
export type DateOperator    = 'on' | 'after' | 'before' | 'between';

// ── Unit support ──────────────────────────────────────────────────────────────

export type EnergyUnit  = 'kWh' | 'MWh' | 'GWh';
export type PowerUnit   = 'kW'  | 'MW'  | 'GW';
export type GenericUnit = EnergyUnit | PowerUnit;

export interface UnitOption<U extends string = string> {
  value: U;
  label: U;
  toK: number;
}

export const ENERGY_UNITS: UnitOption<EnergyUnit>[] = [
  { value: 'kWh', label: 'kWh', toK: 1         },
  { value: 'MWh', label: 'MWh', toK: 1_000     },
  { value: 'GWh', label: 'GWh', toK: 1_000_000 },
];

export const POWER_UNITS: UnitOption<PowerUnit>[] = [
  { value: 'kW', label: 'kW', toK: 1         },
  { value: 'MW', label: 'MW', toK: 1_000     },
  { value: 'GW', label: 'GW', toK: 1_000_000 },
];

// ── Field filter shapes ───────────────────────────────────────────────────────

export interface NumericFilter {
  operator: NumericOperator;
  value:    number | null;
  valueTo:  number | null;
  unit:     string;
}

export interface DateFilter {
  operator: DateOperator;
  /** ISO date string "YYYY-MM-DD" — comes from <input type="date"> */
  value:   string | null;
  valueTo: string | null;
}

export interface LocationFilter {
  state: string;
  city:  string;
}

// ── Complete filter state ─────────────────────────────────────────────────────

export interface SiteFilterState {
  search: string;

  location:        LocationFilter | null;
  cuf:             NumericFilter  | null;
  pr:              NumericFilter  | null;
  acE:             NumericFilter  | null;
  acETotal:        NumericFilter  | null;
  acP:             NumericFilter  | null;
  commissionedDate: DateFilter    | null;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_FILTER_STATE: SiteFilterState = {
  search:           '',
  location:         null,
  cuf:              null,
  pr:               null,
  acE:              null,
  acETotal:         null,
  acP:              null,
  commissionedDate: null,
};

// ── Utility helpers ───────────────────────────────────────────────────────────

export function hasActiveFilters(f: SiteFilterState): boolean {
  return !!(f.location || f.cuf || f.pr || f.acE || f.acETotal || f.acP || f.commissionedDate);
}

export function activeFilterCount(f: SiteFilterState): number {
  return [f.location, f.cuf, f.pr, f.acE, f.acETotal, f.acP, f.commissionedDate]
    .filter(Boolean).length;
}

/**
 * Converts a NumericFilter → API range object.
 *
 * Bounds (fieldMin / fieldMax) are intentionally left BLANK in the serialised
 * URL so the server treats them as open-ended — e.g. "greater than 5" becomes
 * r:cuf=[5,] rather than r:cuf=[5,100].
 *
 * The returned object uses `undefined` for the open bound; the serialiser in
 * AllSitesService must emit an empty string for undefined numeric bounds.
 */
export function numericFilterToRange(
  nf: NumericFilter | null,
  _fieldMin: number,  // kept for signature compat but NOT used as fallback
  _fieldMax: number,
  toK = 1,
): { min: number | undefined; max: number | undefined } | undefined {
  if (!nf || nf.value === null) return undefined;

  const v   = nf.value  * toK;
  const vTo = nf.valueTo !== null ? nf.valueTo * toK : undefined;

  switch (nf.operator) {
    case 'equal_to':     return { min: v, max: v };
    case 'greater_than': return { min: v, max: undefined };        // open upper bound
    case 'less_than':    return { min: undefined, max: v };        // open lower bound
    case 'between':      return vTo !== undefined ? { min: v, max: vTo } : undefined;
    default:             return undefined;
  }
}

export function resolveToK(nf: NumericFilter | null, unitOptions: UnitOption[]): number {
  return unitOptions.find(u => u.value === nf?.unit)?.toK ?? 1;
}

/**
 * Convert a DateFilter → { from, to } strings for the API.
 *
 * Open-ended bounds are represented as empty strings so the serialiser can
 * emit them verbatim:
 *   after  → r:commissionedDate=[2025-05-01T00:00:00.000Z,]
 *   before → r:commissionedDate=[,2025-05-01T00:00:00.000Z]
 *   on     → r:commissionedDate=[2025-05-01T00:00:00.000Z,2025-05-01T23:59:59.999Z]
 *   between→ r:commissionedDate=[2025-05-01T00:00:00.000Z,2026-05-01T00:00:00.000Z]
 */
export function dateFilterToRange(
  df: DateFilter | null,
): { from: string; to: string } | undefined {
  if (!df || !df.value) return undefined;

  const startOf = (d: string): string => {
    const dt = new Date(d);
    dt.setHours(0, 0, 0, 0);

    return formatLocalISOString(dt);
  };

  const endOf = (d: string): string => {
    const dt = new Date(d);
    dt.setHours(23, 59, 59, 999);

    return formatLocalISOString(dt);
  };

  switch (df.operator) {
    case 'on':
      return { from: startOf(df.value), to: endOf(df.value) };

    case 'after':
      // Open upper bound → r:commissionedDate=[date,]
      return { from: startOf(df.value), to: '' };

    case 'before':
      // Open lower bound → r:commissionedDate=[,date]
      return { from: '', to: endOf(df.value) };

    case 'between':
      if (!df.valueTo) return undefined;
      return { from: startOf(df.value), to: endOf(df.valueTo) };

    default:
      return undefined;
  }
}

function formatLocalISOString(date: Date): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');

  return (
    date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    '.' + pad(date.getMilliseconds(), 3) +
    'Z'
  );
}