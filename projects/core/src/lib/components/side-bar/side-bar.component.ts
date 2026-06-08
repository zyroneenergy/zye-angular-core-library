import { Component, Input, effect, Inject, Optional, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { EventsService } from "../../services/frontend/events.service";
import { LayoutService } from "../../services/frontend/layout.service";
import { ThemeService } from "../../services/frontend/theme.service";
import { Subject, takeUntil } from "rxjs";

export interface MenuItem {
  name: string;
  icon: string;
  path?: string;
  action?: () => void;
  children?: MenuItem[];
}

@Component({
  selector: "lib-side-bar",
  standalone: true,
  imports: [CommonModule, MatSidenavModule, MatListModule, MatIconModule, RouterModule],
  templateUrl: "./side-bar.component.html",
  styleUrls: ["./side-bar.component.scss"],
})
export class SideBarComponent implements OnDestroy {
  @Input({ required: true }) fullSize = false;

  @Input() title = 'Zyrone Energy';
  @Input() logoUrl = 'assets/images/company-logo-primary.png';
  @Input() logoWidth = 34;
  @Input() logoHeight = 34;
  @Input() menuItems: MenuItem[] = [];
  @Input() bottomMenuItems: MenuItem[] = [];

  // Reactive — always in sync with ThemeService
  isDarkMode = false;
  isMobile = false;

  private destroy$ = new Subject<void>();

  constructor(
    private eventService: EventsService,
    private layoutService: LayoutService,
    private themeService: ThemeService,
  ) {

    // Reactive device type
    effect(() => {
      this.isMobile = this.layoutService.deviceType() === "mobile";
    });

    // Subscribe to theme changes — single source of truth
   this.themeService.theme$
  .pipe(takeUntil(this.destroy$))
  .subscribe(theme => {
    this.isDarkMode = theme === 'dark';
  });
  }

  toggleTheme() {
    // Just toggle — the subscription above will update isDarkMode automatically
    this.themeService.toggleTheme(!this.isDarkMode);
  }

  onItemClick(item: MenuItem) {
    if (item.action) item.action();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}