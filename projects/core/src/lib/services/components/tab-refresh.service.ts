import { Injectable, OnDestroy, signal, computed, Signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TabRefreshService implements OnDestroy {

  private readonly subjects    = new Map<string, Subject<void>>();
  private readonly loadingKeys = signal<Set<string>>(new Set());

  // ── Refresh ────────────────────────────────────────────────────────────────

  refresh(tabKey: string): void {
    this.subjects.get(tabKey)?.next();
  }

  onRefresh(tabKey: string): Observable<void> {
    if (!this.subjects.has(tabKey)) {
      this.subjects.set(tabKey, new Subject<void>());
    }
    return this.subjects.get(tabKey)!.asObservable();
  }

  // ── Loading state (called by child components) ─────────────────────────────

  setLoading(tabKey: string, loading: boolean): void {
    this.loadingKeys.update(set => {
      const next = new Set(set);
      loading ? next.add(tabKey) : next.delete(tabKey);
      return next;
    });
  }

  /** Reactive signal — TabComponent reads this to drive the spinner */
  isLoading(tabKey: string): Signal<boolean> {
    return computed(() => this.loadingKeys().has(tabKey));
  }

  ngOnDestroy(): void {
    this.subjects.forEach(s => s.complete());
    this.subjects.clear();
  }
}