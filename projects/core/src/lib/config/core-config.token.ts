import { InjectionToken } from '@angular/core';
import { CoreConfig } from './core-config';

export const CORE_CONFIG =
  new InjectionToken<CoreConfig>('CORE_CONFIG');