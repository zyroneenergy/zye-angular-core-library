import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import {
  SiteFilterState,
  NumericFilter,
  NumericOperator,
  DateFilter,
  DateOperator,
  LocationFilter,
  DEFAULT_FILTER_STATE,
  activeFilterCount,
  ENERGY_UNITS,
  POWER_UNITS,
  UnitOption,
} from '../../models/components/site-filter.model';

import { LocationService, State } from '../../services/location.service';
import { ChartCalendarComponent } from '../../charts/components/chart-calendar/chart-calendar.component';
import { DailyRange } from '../../charts/models/chart.model';

// ── Field descriptors ─────────────────────────────────────────────────────────
// Exported so parent components can compose their own field sets.

export interface NumericFieldDef {
  kind: 'numeric';
  key: keyof Pick<SiteFilterState, 'cuf' | 'pr' | 'acE' | 'acETotal' | 'acP'>;
  label: string;
  defaultUnit: string;
  units: UnitOption[];
  placeholder: string;
  placeholderTo?: string;
  min: number;
  max: number;
  step: number;
  operators: { value: NumericOperator; label: string }[];
}

export interface DateFieldDef {
  kind: 'date';
  key: 'commissionedDate';
  label: string;
  operators: { value: DateOperator; label: string }[];
}

export type FilterFieldDef = NumericFieldDef | DateFieldDef;

// ── Operator sets (exported for reuse in parent field configs) ────────────────

export const NUMERIC_OPERATORS: { value: NumericOperator; label: string }[] = [
  { value: 'equal_to',     label: 'Equal to (=)'   },
  { value: 'greater_than', label: 'Greater than (>)' },
  { value: 'less_than',    label: 'Less than (<)'   },
  { value: 'between',      label: 'Between'          },
];

export const DATE_OPERATORS: { value: DateOperator; label: string }[] = [
  { value: 'on',      label: 'On date'      },
  { value: 'after',   label: 'After date'   },
  { value: 'before',  label: 'Before date'  },
  { value: 'between', label: 'Between dates' },
];

// ── Default field set (kept as a named export so existing callers don't break) ─

const PCT_UNITS: UnitOption[] = [{ value: '%', label: '%', toK: 1 }];

export const SITES_FILTER_FIELDS: FilterFieldDef[] = [
  {
    kind: 'numeric', key: 'cuf', label: 'CUF',
    defaultUnit: '%', units: PCT_UNITS,
    placeholder: 'Value', min: 0, max: 100, step: 0.1,
    operators: NUMERIC_OPERATORS,
  },
  {
    kind: 'numeric', key: 'pr', label: 'PR',
    defaultUnit: '%', units: PCT_UNITS,
    placeholder: 'Value', min: 0, max: 100, step: 0.1,
    operators: NUMERIC_OPERATORS,
  },
  {
    kind: 'numeric', key: 'acE', label: 'Today Energy',
    defaultUnit: 'kWh', units: ENERGY_UNITS,
    placeholder: 'From', placeholderTo: 'To',
    min: 0, max: 1_000_000_000, step: 1,
    operators: NUMERIC_OPERATORS,
  },
  {
    kind: 'numeric', key: 'acP', label: 'Today Power',
    defaultUnit: 'kW', units: POWER_UNITS,
    placeholder: 'Value',
    min: 0, max: 1_000_000_000, step: 1,
    operators: NUMERIC_OPERATORS,
  },
  {
    kind: 'date', key: 'commissionedDate', label: 'Commissioned Date',
    operators: DATE_OPERATORS,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  Component
//
//  ARCHITECTURE NOTE
//  -----------------
//  This component is intentionally a "dumb" / presentational panel.
//  It has NO opinion about which fields exist — that decision lives entirely
//  in the parent via the `fieldDefs` input.
//
//  The only two things it owns:
//    1. Rendering: accordions, operators, value inputs, calendar popover.
//    2. Draft state management: local copy of the filter that is emitted
//       only when the user clicks Apply or Reset.
//
//  Location (State / City) is a special-cased built-in section because it
//  requires its own async data (LocationService) and a two-field UX that
//  doesn't fit the generic numeric/date field model. Pass
//  `showLocationFilter = false` to hide it.
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'lib-sites-filter-panel',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatButtonModule, MatDividerModule,
    MatCardModule, MatSelectModule, MatFormFieldModule,
    MatTooltipModule, ChartCalendarComponent,
  ],
  templateUrl: './sites-filter-panel.component.html',
  styleUrls: ['./sites-filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SitesFilterPanelComponent implements OnChanges, OnDestroy {

  // ── Inputs ─────────────────────────────────────────────────────────────────

  @Input() opened = false;

  /** Current committed filter state (owned by the parent). */
  @Input() filters!: SiteFilterState;

  /**
   * Which filter fields to render — parent decides.
   * Falls back to the default Sites set so existing usages remain unchanged.
   */
  @Input() fieldDefs: FilterFieldDef[] = SITES_FILTER_FIELDS;

  /**
   * Whether to show the built-in Location (State / City) section.
   * Defaults to true for backwards-compat; set false on pages that don't
   * need location filtering.
   */
  @Input() showLocationFilter = true;

  // ── Outputs ────────────────────────────────────────────────────────────────

  @Output() filtersChange = new EventEmitter<SiteFilterState>();
  @Output() closePanel    = new EventEmitter<void>();

  // ── Internal state ─────────────────────────────────────────────────────────

  panelSearch      = '';
  draft!: SiteFilterState;
  expanded: Record<string, boolean> = {};
  openCalendarKey: string | null    = null;

  // Location
  states: State[]   = [];
  cities: string[]  = [];
  loadingCities     = false;

  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private locationService: LocationService,
  ) {
    this.locationService.getStates()
      .pipe(takeUntil(this.destroy$))
      .subscribe(s => { this.states = s; this.cdr.markForCheck(); });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnChanges(c: SimpleChanges): void {
    if (c['filters']) {
      this.draft = structuredClone(this.filters);
      // Auto-expand sections that already have an active filter
      for (const field of this.fieldDefs) {
        if ((this.draft as any)[field.key] !== null) {
          this.expanded[field.key] = true;
        }
      }
      if (this.draft.location?.state) {
        this._loadCities(this.draft.location.state);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Visible fields (respects search box) ──────────────────────────────────

  get visibleFields(): FilterFieldDef[] {
    if (!this.panelSearch.trim()) return this.fieldDefs;
    const q = this.panelSearch.toLowerCase();
    return this.fieldDefs.filter(f => f.label.toLowerCase().includes(q));
  }

  // ── Section helpers ────────────────────────────────────────────────────────

  toggle(key: string):           void    { this.expanded[key] = !this.expanded[key]; }
  isExpanded(key: string):       boolean { return !!this.expanded[key]; }
  isFieldActive(key: string):    boolean { return (this.draft as any)[key] !== null; }
  isLocationActive():            boolean { return this.draft.location !== null; }

  // ── Type guards ────────────────────────────────────────────────────────────

  isNumericField(f: FilterFieldDef): f is NumericFieldDef { return f.kind === 'numeric'; }
  isDateField(f: FilterFieldDef):    f is DateFieldDef    { return f.kind === 'date'; }

  // ── Location helpers ───────────────────────────────────────────────────────

  get draftState(): string { return this.draft.location?.state ?? ''; }
  get draftCity():  string { return this.draft.location?.city  ?? ''; }

  onStateSelect(stateName: string): void {
    this.draft = { ...this.draft, location: { state: stateName, city: '' } };
    this.cities = [];
    if (stateName) this._loadCities(stateName);
  }

  onCitySelect(city: string): void {
    this.draft = { ...this.draft, location: { state: this.draftState, city } };
  }

  clearLocation(): void {
    this.draft  = { ...this.draft, location: null };
    this.cities = [];
  }

  private _loadCities(state: string): void {
    this.loadingCities = true;
    this.locationService.getCitiesByState(state)
      .pipe(takeUntil(this.destroy$))
      .subscribe(c => {
        this.cities       = c;
        this.loadingCities = false;
        this.cdr.markForCheck();
      });
  }

  // ── Numeric filter helpers ─────────────────────────────────────────────────

  getNumericFilter(key: NumericFieldDef['key']): NumericFilter {
    const def = this.fieldDefs.find(f => f.key === key) as NumericFieldDef | undefined;
    return (this.draft[key] as NumericFilter) ?? {
      operator: 'equal_to', value: null, valueTo: null,
      unit: def?.defaultUnit ?? '',
    };
  }

  activateNumericFilter(key: NumericFieldDef['key'], op: NumericOperator): void {
    const cur = this.getNumericFilter(key);
    this.draft = { ...this.draft, [key]: { ...cur, operator: op } };
  }

  setNumericValue(key: NumericFieldDef['key'], val: string): void {
    const cur = this.getNumericFilter(key);
    this.draft = { ...this.draft, [key]: { ...cur, value: val === '' ? null : +val } };
  }

  setNumericValueTo(key: NumericFieldDef['key'], val: string): void {
    const cur = this.getNumericFilter(key);
    this.draft = { ...this.draft, [key]: { ...cur, valueTo: val === '' ? null : +val } };
  }

  setUnit(key: NumericFieldDef['key'], unit: string): void {
    const cur = this.getNumericFilter(key);
    this.draft = { ...this.draft, [key]: { ...cur, unit } };
  }

  isBetween(key: NumericFieldDef['key']): boolean {
    return this.getNumericFilter(key).operator === 'between';
  }

  // ── Date filter helpers ────────────────────────────────────────────────────

  getDateFilter(key: DateFieldDef['key']): DateFilter {
    return (this.draft[key] as DateFilter) ?? {
      operator: 'on', value: null, valueTo: null,
    };
  }

  activateDateFilter(key: DateFieldDef['key'], op: DateOperator): void {
    const cur = this.getDateFilter(key);
    this.draft = {
      ...this.draft,
      [key]: {
        ...cur,
        operator: op,
        valueTo: op === 'between' ? cur.valueTo : null,
      },
    };
  }

  setDateValue(key: DateFieldDef['key'], val: string): void {
    const cur = this.getDateFilter(key);
    this.draft = { ...this.draft, [key]: { ...cur, value: val || null } };
  }

  setDateValueTo(key: DateFieldDef['key'], val: string): void {
    const cur = this.getDateFilter(key);
    this.draft = { ...this.draft, [key]: { ...cur, valueTo: val || null } };
  }

  isDateBetween(key: DateFieldDef['key']): boolean {
    return this.getDateFilter(key).operator === 'between';
  }

  // ── Clear ──────────────────────────────────────────────────────────────────

  clearField(key: string): void {
    this.draft = { ...this.draft, [key]: null };
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  apply(): void {
    this.filtersChange.emit(structuredClone(this.draft));
    this.closePanel.emit();
  }

  reset(): void {
    this.draft        = structuredClone(DEFAULT_FILTER_STATE);
    this.expanded     = {};
    this.panelSearch  = '';
    this.cities       = [];
    this.filtersChange.emit(structuredClone(this.draft));
    this.closePanel.emit();
  }

  get draftFilterCount(): number { return activeFilterCount(this.draft); }

  // ── Calendar helpers ───────────────────────────────────────────────────────

  toggleCalendar(key: string): void {
    this.openCalendarKey = this.openCalendarKey === key ? null : key;
  }

  closeCalendar(): void { this.openCalendarKey = null; }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day   = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const year  = date.getFullYear();
    return `${day} ${month} ${year}`;
  }

  onCalendarRangeChange(key: DateFieldDef['key'], range: DailyRange): void {
    const cur = this.getDateFilter(key);
    if (cur.operator === 'between') {
      this.draft = {
        ...this.draft,
        [key]: { ...cur, value: range.startStr, valueTo: range.endStr },
      };
    } else {
      this.draft = {
        ...this.draft,
        [key]: { ...cur, value: range.startStr, valueTo: null },
      };
    }
    this.closeCalendar();
  }
}