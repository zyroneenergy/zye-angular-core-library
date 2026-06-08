/**
 *
 * Architecture decisions:
 *
 * 1. Uses <mat-tab-group> as the VISUAL driver only.
 *    This ensures all global Material typography, ripple, ink-bar, and
 *    theme tokens are inherited automatically — no hand-rolled tab chrome.
 *
 * 2. mat-tab-body-wrapper is hidden via ::ng-deep so Material never renders
 *    any content. We render content ourselves below the tab bar in a single
 *    <div class="tab-content-outlet">, keyed to activeKey().
 *
 * 3. Query param sync:
 *    - On init, reads ?tab=key from URL → sets activeKey
 *    - On click, writes ?tab=key back → drives browser history
 *    - Browser back/forward works automatically via queryParamMap subscription
 *
 * 4. @ContentChildren finds TabContentDirective / TabControlsDirective only
 *    if the CONSUMER imports those directives. The public-api.ts barrel must
 *    export all three: TabComponent, TabContentDirective, TabControlsDirective.
 *
 * 5. ChangeDetectionStrategy.OnPush + signals — no unnecessary re-renders.
 *
 * Consumer usage:
 *   imports: [TabComponent, TabContentDirective, TabControlsDirective]
 *
 *   <app-tab [tabs]="tabs" (tabChange)="onTabChange($event)">
 *     <ng-template tabControls="overview"><app-date-selector/></ng-template>
 *     <ng-template tabContent="overview"><app-overview/></ng-template>
 *     <ng-template tabContent="report">Report content</ng-template>
 *   </app-tab>
 */
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  TemplateRef,
  computed,
  signal,
} from '@angular/core';
import { CommonModule }           from '@angular/common';
import { MatTabsModule }          from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil }     from 'rxjs';
import { TabRefreshService } from '../../../public-api';
import { MatTooltip } from "@angular/material/tooltip";
import { TabContentDirective } from './../../directives/components/tab-content.directive';
import { TabControlsDirective } from './../../directives/components/tab-controls.directive';
import { TabItem } from '../../models/components/tab.model';


@Component({
  selector: 'lib-tab',
  standalone: true,
  // ── IMPORTANT: both directives imported here so @ContentChildren works
  // even when the consumer forgets to import them (defensive).
  // The consumer STILL needs to import them to use the attribute selectors
  // in its own template — but this import prevents a runtime crash.
  imports: [CommonModule, MatTabsModule, TabContentDirective, TabControlsDirective, MatTooltip],
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.scss'],
  // ── IMPORTANT: do NOT use ViewEncapsulation.None on a shared component.
  // None leaks styles globally and breaks host-app encapsulation.
  // Emulated is correct — ::ng-deep handles the mat-tab internals below.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabComponent implements OnInit, AfterContentInit, OnChanges, OnDestroy {

  @Input({ required: true }) tabs: TabItem[] = [];
  @Input() queryParamKey = 'tab';

  @Output() tabChange = new EventEmitter<string>();

  // ── Projected directives ──────────────────────────────────────────────────
  @ContentChildren(TabContentDirective)
  contentDefs!: QueryList<TabContentDirective>;

  @ContentChildren(TabControlsDirective)
  controlDefs!: QueryList<TabControlsDirective>;

  // ── State ─────────────────────────────────────────────────────────────────
  readonly activeKey   = signal<string>('');
  readonly activeIndex = computed(() =>
    this.tabs.findIndex(t => t.key === this.activeKey()),
  );

  /** Tracks which tab keys are currently loading */
  private readonly loadingKeys = signal<Set<string>>(new Set());

  /** True when the active tab is loading — drives spinner in template */
  readonly isRefreshing = computed(() =>
    this.loadingKeys().has(this.activeKey()),
  );


  contentMap  = new Map<string, TemplateRef<void>>();
  controlsMap = new Map<string, TemplateRef<void>>();

  private destroy$ = new Subject<void>();

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private cdr:    ChangeDetectorRef,
    private readonly refreshSvc: TabRefreshService,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const key      = params.get(this.queryParamKey);
        const resolved = this.resolveKey(key);
        if (resolved !== this.activeKey()) {
          this.activeKey.set(resolved);
          this.tabChange.emit(resolved);
          this.cdr.markForCheck();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tabs'] && this.tabs.length) {
      const current = this.activeKey();
      if (!current || !this.tabs.find(t => t.key === current)) {
        this.activeKey.set(this.tabs[0].key);
        this.cdr.markForCheck();
      }
    }
  }

  ngAfterContentInit(): void {
    this.buildMaps();
    // Re-build whenever projected content changes (e.g. async *ngIf tabs)
    this.contentDefs.changes.pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.buildMaps(); this.cdr.markForCheck(); });
    this.controlDefs.changes.pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.buildMaps(); this.cdr.markForCheck(); });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Called by mat-tab-group (selectedIndexChange) */
  onMatTabChange(index: number): void {
    const key = this.tabs[index]?.key;
    if (key && key !== this.activeKey()) this.selectTab(key);
  }

  selectTab(key: string): void {
    if (key === this.activeKey()) return;
    this.router.navigate([], {
      relativeTo:          this.route,
      queryParams:         { [this.queryParamKey]: key },
      queryParamsHandling: 'merge',
      replaceUrl:          false,
    });
  }

  /** Fires the refresh Subject for the active tab only */
  refreshTab(): void {
    this.refreshSvc.refresh(this.activeKey());
  }

  /**
   * Called by child components to report their loading state.
   * TabRefreshService exposes this so children never import TabComponent.
   */
  setTabLoading(key: string, loading: boolean): void {
    this.loadingKeys.update(set => {
      const next = new Set(set);
      loading ? next.add(key) : next.delete(key);
      return next;
    });
    this.cdr.markForCheck();
  }

  getContent(key: string):  TemplateRef<void> | null { return this.contentMap.get(key)  ?? null; }
  getControls(key: string): TemplateRef<void> | null { return this.controlsMap.get(key) ?? null; }

  trackByKey(_: number, tab: TabItem): string { return tab.key; }

  // ── Private ────────────────────────────────────────────────────────────────

  private buildMaps(): void {
    this.contentMap.clear();
    this.controlsMap.clear();
    this.contentDefs.forEach(d => this.contentMap.set(d.tabContent,   d.templateRef));
    this.controlDefs.forEach(d => this.controlsMap.set(d.tabControls, d.templateRef));
  }

  private resolveKey(key: string | null): string {
    if (key && this.tabs.find(t => t.key === key)) return key;
    return this.tabs[0]?.key ?? '';
  }
}