import { Component, Inject, Input, Optional, ViewEncapsulation } from '@angular/core';

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

  /**
   * Company/app name shown in the right panel heading and footer.
   * Falls back to the appName from the injected environment.
   */
  @Input() companyName?: string;

  /**
   * Tagline / description shown in the right panel.
   * Falls back to the appDescription from the injected environment.
   */
  @Input() description?: string;

  get displayCompanyName(): string {
    return 'Aegis by Zyrone Energy';
  }

  get displayDescription(): string {
    return (
      this.description ??
      "A centralized remote monitoring and analytics platform that enables banks and financial institutions to oversee financed renewable energy assets in real time. Monitor performance, track portfolio health, identify risks early, and make informed lending decisions with confidence."
    );
  }

}