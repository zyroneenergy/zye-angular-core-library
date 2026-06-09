import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimeZoneService {

  private readonly fallbackTimezone = 'Asia/Kolkata';


  /**
   * LOCAL time formatting for special endpoints like heatmap
   * - If date is today: preserves current local time
   * - If date is past: uses local midnight (00:00:00)
   * Returns ISO string but maintains local time semantics
   */
  toLocalTimeForHeatmap(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inputDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Check if input date is today
    if (inputDay.getTime() === today.getTime()) {
      // Return current local time as ISO (not UTC)
      return this.toLocalIso(now);
    } else {
      // Return past date at local midnight
      const localMidnight = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23, 59, 59
      );
      return this.toLocalIso(localMidnight);
    }
  }




  private toLocalIso(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
  }

  toLocalPreservedIso(dateInput: string | Date): string {
    const date = new Date(dateInput);

    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
      + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
      + `.${String(date.getMilliseconds()).padStart(3, '0')}Z`;
  }

  /** Active application timezone */
  getTimezone(): string {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      this.fallbackTimezone
    );
  }

  /**
   * Preserve exact time as real UTC ISO string
   * Always ends with Z
   */
  toIso(date: Date | string): string {
    if (!date) return '';
    return new Date(date).toISOString();
  }

  /**
   * Start of day in UTC
   * Use when backend requires 00:00:00Z
   */
  toUtcStartOfDay(date: Date): string {
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    )).toISOString();
  }

  /**
   * End of day in UTC (23:59:59)
   */
  toUtcEndOfDay(date: Date): string {
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23, 59, 59, 999
    )).toISOString();
  }

  /**
   * Heatmap logic (NO fake local ISO)
   * Today → current time in UTC
   * Past date → end of that day in UTC
   */
  toHeatmapIso(date: Date): string {
    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const inputDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    if (inputDay.getTime() === today.getTime()) {
      return now.toISOString();
    }

    return this.toUtcEndOfDay(date);
  }

  /**
   * Convert UTC timestamp → site-local Date (UI only)
   */
  toSiteDate(utcInput: string | Date): Date {
    const tz = this.getTimezone();
    const d = typeof utcInput === 'string'
      ? new Date(utcInput)
      : utcInput;

    return new Date(
      d.toLocaleString('en-US', { timeZone: tz })
    );
  }

  /**
   * Format site date as YYYY-MM-DD (UI safe)
   */
  formatSiteDate(date: Date | string): string {
    const d = this.toSiteDate(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

}