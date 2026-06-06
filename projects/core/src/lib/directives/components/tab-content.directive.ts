/**
 *
 * Marks an ng-template as the body content for a given tab key.
 *
 * Usage:
 *   <ng-template tabContent="analytics">
 *     <app-analytics ...></app-analytics>
 *   </ng-template>
 */
import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[tabContent]',
  standalone: true,
})
export class TabContentDirective {
  @Input('tabContent') tabContent!: string;
  constructor(public templateRef: TemplateRef<void>) {}
}