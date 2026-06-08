// Self-contained daily date-range calendar picker.
// Two-phase UX: pick start → pick end (max-days enforced).
//
// When maxDays === 1 (single-date operators: on / after / before) the
// component auto-commits on the first click — no second click required.
//
// The component owns its own calendar grid/navigation state.
// It emits (rangeChange) with { startStr, endStr } when end is committed.
// It emits (rangeStart) when start is selected (end still pending).
// ─────────────────────────────────────────────────────────────────────────────

import {
  ChangeDetectionStrategy, Component, computed,
  EventEmitter, Input, OnChanges, Output, signal, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MONTH_SHORT, toDateStr, addDays, daysBetween, pad,
  DailyRange,
} from '../../models/chart.model';


@Component({
  selector:        'lib-chart-calendar',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  templateUrl: './chart-calendar.component.html',
  styleUrl: './chart-calendar.component.scss'
})
export class ChartCalendarComponent implements OnChanges {
  @Input() initialStart = '';
  @Input() initialEnd   = '';
  /**
   * Maximum selectable range in days.
   * When set to 1, the calendar operates in single-date mode:
   * clicking a day immediately emits rangeChange with startStr === endStr.
   * No second click is required.
   */
  @Input() maxDays = 90;

  @Output() rangeChange = new EventEmitter<DailyRange>();
  @Output() rangeStart  = new EventEmitter<string>();

  readonly weekdays = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  readonly todayStr  = toDateStr(new Date());

  private readonly _year  = signal(new Date().getFullYear());
  private readonly _month = signal(new Date().getMonth());

  readonly startStr = signal('');
  readonly endStr   = signal('');
  readonly hoverStr = signal('');
  readonly phase    = signal<'start' | 'end'>('start');

  /** True when we're in single-date mode (maxDays === 1) */
  get isSingleDateMode(): boolean {
    return this.maxDays === 1;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialStart'] && this.initialStart) {
      this.startStr.set(this.initialStart);
      const [y, m] = this.initialStart.split('-').map(Number);
      this._year.set(y);
      this._month.set(m - 1);
    }
    if (changes['initialEnd'] && this.initialEnd) {
      this.endStr.set(this.initialEnd);
    }
    // If maxDays changes to 1 while we're in 'end' phase, reset to 'start'
    if (changes['maxDays'] && this.isSingleDateMode) {
      this.phase.set('start');
      this.endStr.set('');
      this.hoverStr.set('');
    }
  }

  readonly calTitle = computed(() =>
    `${MONTH_SHORT[this._month()]} ${this._year()}`
  );

  readonly canGoNext = computed(() => {
    const now = new Date();
    return !(this._year() === now.getFullYear() && this._month() === now.getMonth());
  });

  readonly calDays = computed<Array<{ ds: string; d: number } | null>>(() => {
    const y = this._year();
    const m = this._month();
    const first  = new Date(y, m, 1).getDay();
    const total  = new Date(y, m + 1, 0).getDate();
    const offset = (first + 6) % 7;
    const cells: Array<{ ds: string; d: number } | null> = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
      cells.push({ ds: `${y}-${pad(m + 1)}-${pad(d)}`, d });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  });

  readonly rangeLabel = computed(() => {
    const s = this.startStr();
    const e = this.endStr();
    if (!s) return '';
    if (!e || s === e) return this.fmt(s);                            // single date
    const days = daysBetween(s, e) + 1;
    return `${this.fmt(s)} → ${this.fmt(e)} · ${days} day${days !== 1 ? 's' : ''}`;
  });

  isInRange(ds: string): boolean {
    const s = this.startStr();
    if (!s || this.isSingleDateMode) return false;                    // no range highlight in single mode
    const e = (this.phase() === 'end' && this.hoverStr()) ? this.hoverStr() : this.endStr();
    return !!e && ds > s && ds < e;
  }

  isDisabled(ds: string): boolean {
    if (ds > this.todayStr) return true;
    if (!this.isSingleDateMode && this.phase() === 'end' && this.startStr()) {
      const diff = daysBetween(this.startStr(), ds);
      if (diff < 0 || diff >= this.maxDays) return true;
    }
    return false;
  }

  onDayClick(ds: string): void {
    if (this.isDisabled(ds)) return;

    // ── Single-date mode: commit immediately on first click ────────────
    if (this.isSingleDateMode) {
      this.startStr.set(ds);
      this.endStr.set(ds);
      this.hoverStr.set('');
      this.phase.set('start');                                        // reset for next interaction
      this.rangeChange.emit({ startStr: ds, endStr: ds });
      return;
    }

    // ── Range mode: two-phase pick ─────────────────────────────────────
    if (this.phase() === 'start') {
      this.startStr.set(ds);
      this.endStr.set('');
      this.hoverStr.set('');
      this.phase.set('end');
      this.rangeStart.emit(ds);
    } else {
      if (ds < this.startStr()) {
        // User clicked before start — restart
        this.startStr.set(ds);
        this.endStr.set('');
        this.phase.set('end');
        this.rangeStart.emit(ds);
      } else {
        this.endStr.set(ds);
        this.hoverStr.set('');
        this.phase.set('start');
        this.rangeChange.emit({ startStr: this.startStr(), endStr: ds });
      }
    }
  }

  onHover(ds: string): void {
    if (this.phase() === 'end' && !this.isSingleDateMode) {
      this.hoverStr.set(ds);
    }
  }

  prevMonth(): void {
    let m = this._month() - 1;
    let y = this._year();
    if (m < 0) { m = 11; y--; }
    this._month.set(m);
    this._year.set(y);
  }

  nextMonth(): void {
    if (!this.canGoNext()) return;
    let m = this._month() + 1;
    let y = this._year();
    if (m > 11) { m = 0; y++; }
    this._month.set(m);
    this._year.set(y);
  }

  private fmt(s: string): string {
    const [y, m, d] = s.split('-').map(Number);
    return `${d} ${MONTH_SHORT[m - 1]} ${y}`;
  }
}