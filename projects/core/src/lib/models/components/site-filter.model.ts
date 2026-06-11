
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
  location: LocationFilter | null;
  [key: string]: NumericFilter | DateFilter | LocationFilter | null | string | any; // Fully dynamic
}

// ── Defaults ──────────────────────────────────────────────────────────────────

export const DEFAULT_FILTER_STATE: SiteFilterState = {
  search: '',
  location: null,
};
// ── Utility helpers ───────────────────────────────────────────────────────────

export function hasActiveFilters(f: SiteFilterState, fieldDefs: FilterFieldDef[] = []): boolean {
  if (f.location) return true;
  if (f.search?.trim()) return true;

  return fieldDefs.some(def => {
    const val = (f as any)[def.key];
    if (!val) return false;
    if (def.kind === 'numeric') {
      return (val as NumericFilter).value !== null;
    }
    if (def.kind === 'date') {
      return !!(val as DateFilter).value;
    }
    return false;
  });
}

export function activeFilterCount(f: SiteFilterState, fieldDefs: FilterFieldDef[] = []): number {
  let count = 0;
  if (f.location) count++;
  if (f.search?.trim()) count++;

  fieldDefs.forEach(def => {
    const val = (f as any)[def.key];
    if (!val) return;
    if (def.kind === 'numeric' && (val as NumericFilter).value !== null) count++;
    if (def.kind === 'date' && !!(val as DateFilter).value) count++;
  });

  return count;
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

export interface NumericFieldDef {
  kind: 'numeric';
  key: string;
  label: string;
  defaultUnit: string;
  units: UnitOption[];
  placeholder: string;
  placeholderTo?: string;
  min: number;
  max: number;
  step: number;
  operators: { value: NumericOperator; label: string }[];
}

export interface DateFieldDef {
  kind: 'date';
  key: string;
  label: string;
  operators: { value: DateOperator; label: string }[];
}

export type FilterFieldDef = NumericFieldDef | DateFieldDef;

// ── Operator sets (exported for reuse in parent field configs) ────────────────

export const NUMERIC_OPERATORS: { value: NumericOperator; label: string }[] = [
  { value: 'equal_to',     label: 'Equal to (=)'   },
  { value: 'greater_than', label: 'Greater than (>)' },
  { value: 'less_than',    label: 'Less than (<)'   },
  { value: 'between',      label: 'Between'          },
];

export const DATE_OPERATORS: { value: DateOperator; label: string }[] = [
  { value: 'on',      label: 'On date'      },
  { value: 'after',   label: 'After date'   },
  { value: 'before',  label: 'Before date'  },
  { value: 'between', label: 'Between dates' },
];

// ── Default field set (kept as a named export so existing callers don't break) ─

const PCT_UNITS: UnitOption[] = [{ value: '%', label: '%', toK: 1 }];

export const SITES_FILTER_FIELDS: FilterFieldDef[] = [
  {
    kind: 'numeric', key: 'cuf', label: 'CUF',
    defaultUnit: '%', units: PCT_UNITS,
    placeholder: 'Value', min: 0, max: 100, step: 0.1,
    operators: NUMERIC_OPERATORS,
  },
  {
    kind: 'numeric', key: 'pr', label: 'PR',
    defaultUnit: '%', units: PCT_UNITS,
    placeholder: 'Value', min: 0, max: 100, step: 0.1,
    operators: NUMERIC_OPERATORS,
  },
  {
    kind: 'numeric', key: 'acE', label: 'Today Energy',
    defaultUnit: 'kWh', units: ENERGY_UNITS,
    placeholder: 'From', placeholderTo: 'To',
    min: 0, max: 1_000_000_000, step: 1,
    operators: NUMERIC_OPERATORS,
  },
  {
    kind: 'numeric', key: 'acP', label: 'Today Power',
    defaultUnit: 'kW', units: POWER_UNITS,
    placeholder: 'Value',
    min: 0, max: 1_000_000_000, step: 1,
    operators: NUMERIC_OPERATORS,
  },
  {
    kind: 'date', key: 'commissionedDate', label: 'Commissioned Date',
    operators: DATE_OPERATORS,
  },
];