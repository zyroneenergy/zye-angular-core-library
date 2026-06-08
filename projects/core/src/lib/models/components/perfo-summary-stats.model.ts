export interface KpiStat {
  name: string;
  raw?: any;
  value: string;
  icon: string;
  link?: string;
}

export type StatCardVariant = 'normal' | 'solid';

export type StatCardStatus = 'success' | 'loading' | 'empty' | 'error' | 'no-generation' | 'stale';