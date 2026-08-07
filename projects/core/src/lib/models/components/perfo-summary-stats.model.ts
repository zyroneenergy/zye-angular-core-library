export interface KpiStatSubvalue {
  text: string;
  icon?: string;
  /** Any valid CSS color — hex, CSS var, etc. Falls back to the variant's default text color if omitted. */
  color?: string;
}

export interface KpiStat {
  name: string;
  raw?: any;
  value: string;
  icon: string;
  subvalue?: string | KpiStatSubvalue;
  link?: string;
  valueColor?: string;
  /** Per-stat override for the label text color (e.g. 'var(--primary500)'). */
  labelColor?: string;
  iconColor?: string;
  iconBackground?: string;
}

export type StatCardVariant = 'normal' | 'solid';

export type StatCardStatus = 'success' | 'loading' | 'empty' | 'error' | 'no-generation' | 'stale';