import { Component, Inject, Input, Optional, ViewEncapsulation } from '@angular/core';
import { CORE_CONFIG } from '../../../config/core-config.token';
import { CoreConfig } from '../../../config/core-config';

@Component({
  selector: 'lib-auth-layout',
  standalone: true,
  imports: [],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AuthLayoutComponent {
  currentYear = new Date().getFullYear();

  constructor(
    @Inject(CORE_CONFIG)
    protected config: CoreConfig
  ) {
  }

  get layoutTitle(): string {
    return this.config.auth.layoutTitle ?? 'Protecting Renewable Energy Investments Through Intelligent Monitoring';
  }

  get layoutSubtitle(): string {
    return this.config.auth.layoutSubtitle ?? 'A centralized remote monitoring and analytics platform that enables banks and financial institutions to oversee financed renewable energy assets in real time. Monitor performance, track portfolio health, identify risks early, and make informed lending decisions with confidence.';
  }

  get footerText(): string {
    return this.config.auth.footerText ?? 'Aegis by Zyrone Energy';
  }

}