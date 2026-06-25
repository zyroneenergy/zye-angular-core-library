import {
  Component,
  computed,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

// ─── Public types (re-export from shared index) ───────────────────────────────

export type SortDirection = 'asc' | 'desc';

export interface SortOption<F extends string = string> {
  field: F;
  label: string;
  /** Default direction when this field is first activated. */
  defaultDirection?: SortDirection;
}

export interface SortState<F extends string = string> {
  field: F;
  direction: SortDirection;
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'lib-sort-control',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  templateUrl: './sort-control.component.html',
  styleUrl: './sort-control.component.scss',
})
export class SortControlComponent<F extends string = string> implements OnInit {

  /** The list of sortable fields the consumer wants to expose. */
  @Input({ required: true }) options: SortOption<F>[] = [];

  /**
   * Seed the initial sort state. If omitted the component defaults
   * to the first option with its defaultDirection (or 'asc').
   */
  @Input() initialState?: SortState<F>;

  /** Emits every time the field or direction changes. */
  @Output() sortChange = new EventEmitter<SortState<F>>();

  // ── Internal reactive state ───────────────────────────────────────────────

  readonly sortState = signal<SortState<F>>({ field: '' as F, direction: 'asc' });
  readonly panelOpen = signal(false);

  readonly currentLabel = computed(() => {
    const active = this.sortState().field;
    return this.options.find(o => o.field === active)?.label ?? 'Sort';
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (this.initialState) {
      this.sortState.set(this.initialState);
    } else if (this.options.length) {
      const first = this.options[0];
      this.sortState.set({
        field: first.field,
        direction: first.defaultDirection ?? 'asc',
      });
    }
  }

  // ── Host listener — close panel on outside click ──────────────────────────

  @HostListener('document:click')
  onDocumentClick(): void {
    this.panelOpen.set(false);
  }

  // ── Template actions ──────────────────────────────────────────────────────

  togglePanel(event: MouseEvent): void {
    event.stopPropagation();
    this.panelOpen.update(v => !v);
  }

  selectField(field: F, event: MouseEvent): void {
    event.stopPropagation();
    this._applyFieldChange(field);
    this.panelOpen.set(false);
  }

  toggleDirection(event: MouseEvent): void {
    event.stopPropagation();
    const { field, direction } = this.sortState();
    const next: SortState<F> = {
      field,
      direction: direction === 'asc' ? 'desc' : 'asc',
    };
    this.sortState.set(next);
    this.sortChange.emit(next);
  }

  stopProp(event: MouseEvent): void {
    event.stopPropagation();
  }

  isActive(field: F): boolean {
    return this.sortState().field === field;
  }

  get direction(): SortDirection {
    return this.sortState().direction;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _applyFieldChange(field: F): void {
    const current = this.sortState();

    if (current.field === field) {
      // Same field — toggle direction
      const next: SortState<F> = {
        field,
        direction: current.direction === 'asc' ? 'desc' : 'asc',
      };
      this.sortState.set(next);
      this.sortChange.emit(next);
    } else {
      // New field — use its default direction
      const opt = this.options.find(o => o.field === field);
      const next: SortState<F> = {
        field,
        direction: opt?.defaultDirection ?? 'asc',
      };
      this.sortState.set(next);
      this.sortChange.emit(next);
    }
  }
}