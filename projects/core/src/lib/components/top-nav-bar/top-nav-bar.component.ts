import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventNames, EventsService } from '../../services/frontend/events.service';
import { ThemeService } from '../../services/frontend/theme.service';

@Component({
  selector: 'lib-top-nav-bar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatToolbarModule],
  templateUrl: './top-nav-bar.component.html',
  styleUrl: './top-nav-bar.component.scss',
})
export class TopNavBarComponent {
  // Inject services using modern inject() function
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly eventsService = inject(EventsService);
  private readonly themeService = inject(ThemeService);

  // Signals for reactive state management
  readonly pageTitle = signal<string>('Dashboard');
  readonly currentTheme = signal<'light' | 'dark'>(
    this.themeService.getSystemTheme() as 'light' | 'dark'
  );

  // Computed values if needed
  readonly isDarkMode = computed(() => this.currentTheme() === 'dark');
  readonly themeIcon = computed(() => 
    this.isDarkMode() ? 'light_mode' : 'dark_mode'
  );

  constructor() {
    this.initializeRouteTracking();
    this.initializeThemeListener();
  }

  /**
   * Initialize route tracking to update page title
   * Handles both navigation and initial load/reload scenarios
   */
  private initializeRouteTracking(): void {
    // Get initial route title on component initialization
    this.updatePageTitle();

    // Listen to navigation events
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.updatePageTitle();
      });
  }

  /**
   * Extract and update the page title from the current route
   */
  private updatePageTitle(): void {
    let route = this.activatedRoute;
    
    // Traverse to the deepest activated route
    while (route.firstChild) {
      route = route.firstChild;
    }

    // Extract title from route data
    let title = route.snapshot.data['title'] || 'Dashboard';
    
    // If title contains pipe (|), extract only the page title part
    if (title.includes('|')) {
      title = title.split('|')[0].trim();
    }
    
    this.pageTitle.set(title);
  }

  /**
   * Initialize theme change listener
   */
  private initializeThemeListener(): void {
    this.eventsService
      .on(EventNames.toggletheme)
      .pipe(takeUntilDestroyed())
      .subscribe((theme: 'light' | 'dark') => {
        this.currentTheme.set(theme);
      });
  }

  /**
   * Toggle the side navigation drawer
   */
  toggleSidenav(): void {
    this.eventsService.emitEvent('ToggleSidenav', {});
  }

  /**
   * Toggle between light and dark theme
   */
  toggleTheme(): void {
    const newTheme = this.isDarkMode() ? 'light' : 'dark';
    this.eventsService.emitEvent(EventNames.toggletheme, newTheme);
  }

  /**
   * Open the onboarding side panel
   */
  openOnboardingSidenav(): void {
    this.eventsService.emitEvent('ToggleOnboardingSidenav', {});
  }

  /**
   * Navigate to the onboarding page
   */
  navigateToOnboarding(): void {
    this.router.navigate(['/sites/onboard']);
  }
}