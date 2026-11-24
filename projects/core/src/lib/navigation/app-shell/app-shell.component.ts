import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NavItem } from '../nav-item.model';
import { SidenavService } from '../sidenav.service';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { MobileTopBarComponent } from '../mobile-top-bar/mobile-top-bar.component';

/**
 * Ready-made signed-in layout: [ sidebar | page ], with the mobile header on phones.
 * Apps that want the layout in their own `app.component.html` compose
 * `lib-sidenav` + `lib-mobile-top-bar` directly instead.
 *
 *   <lib-app-shell brandName="Solar APM" [menuItems]="menu">
 *     <router-outlet />
 *   </lib-app-shell>
 */
@Component({
  selector: 'lib-app-shell',
  standalone: true,
  imports: [SidenavComponent, MobileTopBarComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly brandName = input('Zyrone Energy');
  readonly logoUrl = input('assets/images/company-logo-primary.png');
  readonly brandLink = input<string | null>(null);
  readonly menuItems = input.required<NavItem[]>();
  readonly footerItems = input<NavItem[]>([]);
  readonly accountItems = input<NavItem[]>([]);
  readonly showThemeToggle = input(true);
  readonly showLogout = input(true);
  /** Remove the content padding (full-bleed pages such as maps). */
  readonly flush = input(false);

  protected readonly nav = inject(SidenavService);
}
