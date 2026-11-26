import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  HostListener,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { filter, map, startWith } from 'rxjs';
import { ThemeService } from '../../services/frontend/theme.service';
import { AuthService } from '../../auth/services/auth.service';
import { UserService } from '../../auth/services/user.service';
import { AccessService } from '../../access/access.service';
import { ConfirmDialogService, ConfirmDialogs } from '../../components/confirm-dialog/confirm-dialog.component';
import { MenuItem } from '../../components/side-bar/side-bar.component';
import { NavItem } from '../nav-item.model';
import { SidenavService } from '../sidenav.service';
import { SidenavSwipe } from './sidenav-swipe';

const OPEN_GROUPS_KEY = 'sidenavOpenGroups';
const FLYOUT_OPEN_DELAY_MS = 120;
const FLYOUT_CLOSE_DELAY_MS = 200;

/** Drops what the user may not access; a group left with nothing to show goes too. */
export function filterNavItems(items: readonly NavItem[], can: (item: NavItem) => boolean): NavItem[] {
  return items.filter(can).flatMap(item => {
    if (!item.children?.length) return [item];
    const children = filterNavItems(item.children, can);
    return children.length || item.path || item.submenu ? [{ ...item, children }] : [];
  });
}

function readOpenGroups(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(OPEN_GROUPS_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

/** Path part of a URL, without query / fragment. */
const pathOf = (url: string) => url.split(/[?#]/)[0];

/**
 * Main app navigation, ChatGPT / Claude style.
 * Desktop: collapsible icon rail (Ctrl/⌘+B). Mobile: full-height drawer with backdrop.
 * One sidebar icon opens and closes it everywhere (header here, mobile top bar).
 * Items are data-driven and filtered by `AccessService`; open state lives in `SidenavService`.
 */
@Component({
  selector: 'lib-sidenav',
  standalone: true,
  imports: [NgClass, NgTemplateOutlet, RouterLink, RouterLinkActive, MatTooltipModule, MatMenuModule, OverlayModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-mobile]': 'nav.isMobile()',
    '[class.is-collapsed]': '!nav.expanded()',
  },
})
export class SidenavComponent {
  readonly brandName = input('Zyrone Energy');
  readonly logoUrl = input('assets/images/company-logo-primary.png');
  /** Brand link target. Defaults to the user's role home. */
  readonly brandLink = input<string | null>(null);
  /** Primary navigation (top). */
  readonly menuItems = input.required<NavItem[]>();
  /** Secondary items in the footer, under the theme toggle (customer-app layout). */
  readonly footerItems = input<NavItem[]>([]);
  /** Extra entries in the "My Account" menu, above Log out. */
  readonly accountItems = input<NavItem[]>([]);
  /** Theme toggle as the first footer button. */
  readonly showThemeToggle = input(true);
  /** Built-in "Log out" (with confirmation) in the "My Account" menu. */
  readonly showLogout = input(true);
  /**
   * Label of the account entry, e.g. the user's name from the app's profile.
   * Falls back to the token's first name, then "My Account".
   */
  readonly accountName = input<string | null>(null);
  /** Avatar on the account entry (photo / chosen avatar); the profile icon when absent or broken. */
  readonly accountAvatarUrl = input<string | null>(null);

  protected readonly nav = inject(SidenavService);
  private readonly access = inject(AccessService);
  private readonly user = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  private readonly toggleBtn = viewChild.required<ElementRef<HTMLButtonElement>>('toggleBtn');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  protected readonly items = computed(() => filterNavItems(this.menuItems(), item => this.access.can(item.access)));
  protected readonly footer = computed(() => filterNavItems(this.footerItems(), item => this.access.can(item.access)));
  protected readonly accountMenu = computed(() => filterNavItems(this.accountItems(), item => this.access.can(item.access)));
  protected readonly homeLink = computed(() => this.brandLink() ?? this.access.homeUrl());

  private readonly url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Groups whose sub-menu is expanded (expanded sidebar). Remembered across reloads. */
  private readonly openGroups = signal(readOpenGroups());
  /** Group whose hover flyout is showing (collapsed rail only). */
  protected readonly flyoutFor = signal<string | null>(null);
  private flyoutTimer?: ReturnType<typeof setTimeout>;

  protected readonly flyoutPositions: ConnectedPosition[] = [
    { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX: 8, offsetY: -8 },
    { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom', offsetX: 8, offsetY: 8 },
  ];

  protected readonly isDark = toSignal(this.themeService.theme$, { initialValue: this.themeService.getSystemTheme() });
  protected readonly themeLabel = computed(() => (this.isDark() === 'dark' ? 'Light mode' : 'Dark mode'));
  protected readonly themeIcon = computed(() => (this.isDark() === 'dark' ? 'isax-sun-1' : 'isax-moon'));

  protected readonly accountLabel = computed(() =>
    this.accountName()?.trim() || this.user.firstName() || 'My Account');

  /** Set when the avatar image fails (e.g. an expired signed URL); a new URL retries. */
  private readonly avatarFailed = signal(false);
  protected readonly accountAvatar = computed(() => (this.avatarFailed() ? null : this.accountAvatarUrl()));

  protected readonly toggleLabel = computed(() =>
    this.nav.isMobile() || this.nav.expanded() ? 'Close sidebar' : 'Open sidebar');
  protected readonly shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘B' : 'Ctrl+B';

  constructor() {
    // Edge-swipe to open, swipe-left to close (mobile only).
    const swipe = new SidenavSwipe(inject(NgZone), {
      host: inject(ElementRef<HTMLElement>).nativeElement,
      panel: () => this.panel().nativeElement,
      enabled: () => this.nav.isMobile(),
      isOpen: () => this.nav.mobileOpen(),
      settle: open => (open ? this.nav.openMobile() : this.nav.closeMobile()),
    });
    inject(DestroyRef).onDestroy(() => swipe.destroy());

    // Navigating into a group opens it; any navigation dismisses the flyout.
    effect(() => {
      const url = pathOf(this.url());
      const inside = this.items().filter(item => this.hasSub(item) && this.isUnder(item, url));
      if (inside.length) {
        this.openGroups.update(open => new Set([...open, ...inside.map(item => item.name)]));
      }
      this.flyoutFor.set(null);
    }, { allowSignalWrites: true });

    effect(() => {
      this.accountAvatarUrl();
      this.avatarFailed.set(false);
    }, { allowSignalWrites: true });

    // The flyout only exists on the rail.
    effect(() => {
      if (this.nav.expanded()) this.flyoutFor.set(null);
    }, { allowSignalWrites: true });

    // Move focus into the drawer when it opens on mobile (keyboard / screen-reader users).
    effect(() => {
      if (this.nav.isMobile() && this.nav.mobileOpen()) {
        queueMicrotask(() => this.toggleBtn().nativeElement.focus());
      }
    });
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.nav.mobileOpen()) {
      this.nav.closeMobile();
      return;
    }
    const target = event.target as HTMLElement | null;
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey
      && event.key.toLowerCase() === 'b' && !target?.isContentEditable) {
      event.preventDefault();
      this.nav.toggle();
    }
  }

  protected hasSub(item: NavItem): boolean {
    return !!item.submenu || !!item.children?.length;
  }

  protected isOpen(item: NavItem): boolean {
    return this.openGroups().has(item.name);
  }

  /** Sub-menu actually on screen: then the active child, not the parent, carries the highlight. */
  protected subShown(item: NavItem): boolean {
    return this.nav.expanded() && this.hasSub(item) && this.isOpen(item);
  }

  /** Current URL is this item's page or below it. */
  protected isUnder(item: NavItem, url = pathOf(this.url())): boolean {
    if (!item.path) return item.children?.some(child => this.isUnder(child, url)) ?? false;
    const base = item.path.replace(/\/+$/, '');
    return url === base || url.startsWith(base + '/');
  }

  protected toggleGroup(item: NavItem): void {
    this.openGroups.update(open => {
      const next = new Set(open);
      if (!next.delete(item.name)) next.add(item.name);
      try {
        localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify([...next]));
      } catch {
        /* not persisted: fine */
      }
      return next;
    });
  }

  /** Hover intent for the rail flyout: small open delay, forgiving close delay. */
  protected onGroupHover(item: NavItem, entering: boolean): void {
    if (this.nav.expanded() || !this.hasSub(item)) return;
    clearTimeout(this.flyoutTimer);
    if (entering) {
      this.flyoutTimer = setTimeout(() => this.flyoutFor.set(item.name), FLYOUT_OPEN_DELAY_MS);
    } else if (!document.activeElement?.closest('.nav-flyout')) {
      this.flyoutTimer = setTimeout(() => this.flyoutFor.set(null), FLYOUT_CLOSE_DELAY_MS);
    }
  }

  protected closeFlyout(): void {
    clearTimeout(this.flyoutTimer);
    this.flyoutFor.set(null);
  }

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme(this.isDark() !== 'dark');
  }

  protected runAction(item: MenuItem): void {
    item.action?.();
  }

  protected async logout(): Promise<void> {
    if (await this.confirm.open(ConfirmDialogs.logout())) {
      this.auth.logout(this.access.loginUrl);
    }
  }
}
