import {
  EnvironmentProviders,
  makeEnvironmentProviders
} from '@angular/core';

import { CORE_CONFIG } from './core-config.token';
import { CoreConfig } from './core-config';

export function provideCore(
  config: CoreConfig
): EnvironmentProviders {

  return makeEnvironmentProviders([
    {
      provide: CORE_CONFIG,
      useValue: config,
    }
  ]);
}