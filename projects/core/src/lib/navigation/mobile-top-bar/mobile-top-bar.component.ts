import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { SidenavService } from '../sidenav.service';

/**
 * Mobile app header: sidebar toggle + current page title (+ projected actions).
 * The title is the deepest route's `data.title` without the " | App" suffix.
 *
 *   <lib-mobile-top-bar>
 *     <button actions …>…</button>
 *   </lib-mobile-top-bar>
 */
@Component({
  selector: 'lib-mobile-top-bar',
  standalone: true,
  templateUrl: './mobile-top-bar.component.html',
  styleUrl: './mobile-top-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileTopBarComponent {
  protected readonly nav = inject(SidenavService);
  private readonly router = inject(Router);

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.resolveTitle()),
    ),
    { initialValue: '' },
  );

  private resolveTitle(): string {
    // The router-state snapshot is complete even while the shell is being created.
    let snapshot = this.router.routerState.snapshot.root;
    while (snapshot.firstChild) snapshot = snapshot.firstChild;
    const title: string = snapshot.data?.['title'] ?? '';
    return title.split('|')[0].trim();
  }
}
