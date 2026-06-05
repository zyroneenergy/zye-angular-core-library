import {
  NormalizeResult,
  NormResult,
  UnitType
} from './unit-normalization.types';
import { UNIT_CONFIG } from './unit-normalization.config';

const SCALE = [
  { limit: 1_000_000_000, divisor: 1_000_000_000, prefix: 'T' },
  { limit: 1_000_000, divisor: 1_000_000, prefix: 'G' },
  { limit: 1_000, divisor: 1_000, prefix: 'M' }
];

export function normalizeValues(
  values: readonly (number | null)[],
  unitType: UnitType = 'Power'
): NormalizeResult {
  const valid = values.filter(
    (v): v is number => v !== null && Number.isFinite(v)
  );

  if (!valid.length) {
    return {
      divisor: 1,
      unit: UNIT_CONFIG[unitType],
      decimals: 2,
      maxValue: 0
    };
  }

  const maxValue = Math.max(...valid.map(Math.abs));

  // Non-scalable units
  if (!['Power', 'Energy'].includes(unitType)) {
    return {
      divisor: 1,
      unit: UNIT_CONFIG[unitType],
      decimals: unitType === 'Efficiency' ? 0 : 2,
      maxValue
    };
  }
  const baseSuffix = unitType === 'Power' ? 'W' : 'Wh';

  for (const scale of SCALE) {
    if (maxValue >= scale.limit) {
      return {
        divisor: scale.divisor,
        unit: `${scale.prefix}${baseSuffix}`,
        decimals: 2,
        maxValue
      };
    }
  }

  return {
    divisor: 1,
    unit: `k${baseSuffix}`,
    decimals: 0,
    maxValue
  };
}

export function normalizeEnergyValues(
  values: readonly number[]
): NormResult {
  if (!values.length) {
    return { divisor: 1, unit: 'kWh', decimals: 2 };
  }

  const maxValue = Math.max(...values);

  for (const scale of SCALE) {
    if (maxValue >= scale.limit) {
      return {
        divisor: scale.divisor,
        unit: `${scale.prefix}Wh`,
        decimals: 2
      };
    }
  }

  return {
    divisor: 1,
    unit: 'kWh',
    decimals: 0
  };
}
