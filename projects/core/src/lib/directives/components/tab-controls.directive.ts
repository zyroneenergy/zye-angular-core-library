/**
 *
 * Marks an ng-template as the right-side controls row for a given tab key.
 * The TabComponent renders this in the .tab-controls slot next to the tab bar.
 *
 * Usage:
 *   <ng-template tabControls="analytics">
 *     <app-date-selector></app-date-selector>
 *     <button mat-stroked-button>Refresh</button>
 *   </ng-template>
 */
import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[tabControls]',
  standalone: true,
})
export class TabControlsDirective {
  @Input('tabControls') tabControls!: string;
  constructor(public templateRef: TemplateRef<void>) {}
}