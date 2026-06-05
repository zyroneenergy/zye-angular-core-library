import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'lib-empty-data',
  standalone: true,
  imports: [],
  templateUrl: './empty-data.component.html',
  styleUrl: './empty-data.component.scss'
})
export class EmptyDataComponent {
  @Input() icon: string = "";
  @Input() name: string = "";
  @Input() description: string = "";
  @Input() textColor?: string = '';
  @Input() minHeight? = '';

  @Input() lastRecordDate?: Date | string | null;
  @Input() showLastRecordLink: boolean = false;
  
  // Event emitter for date click
  @Output() lastRecordDateClick = new EventEmitter<Date>();

  constructor() { }

  /**
   * Handle click on "View last recorded data" link
   */
  onLastRecordClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.lastRecordDate) {
      console.warn('[EmptyDataComponent] No lastRecordDate provided');
      return;
    }

    const date = this.lastRecordDate instanceof Date 
      ? this.lastRecordDate 
      : new Date(this.lastRecordDate);

    if (isNaN(date.getTime())) {
      console.error('[EmptyDataComponent] Invalid lastRecordDate:', this.lastRecordDate);
      return;
    }

    this.lastRecordDateClick.emit(date);
  }

  /**
   * Format the last record date for display
   */
  getFormattedLastRecordDate(): string {
    if (!this.lastRecordDate) return '';

    const date = this.lastRecordDate instanceof Date 
      ? this.lastRecordDate 
      : new Date(this.lastRecordDate);

    if (isNaN(date.getTime())) return '';

    // Format: "December 28, 2025"
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Check if last record date is available
   */
  get hasLastRecordDate(): boolean {
    return this.showLastRecordLink && !!this.lastRecordDate;
  }
}
