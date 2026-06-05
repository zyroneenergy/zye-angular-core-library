export type UnitType =
  | 'Power'
  | 'Energy'
  | 'Voltage'
  | 'Current'
  | 'Efficiency';

export interface NormalizeResult {
  divisor: number;
  unit: string;
  maxValue: number;
  decimals: number;
}

export interface NormResult {
  divisor: number;
  unit: string;
  decimals: number;
}
