import { Directive, Input, TemplateRef } from '@angular/core';

/**
 * Structural directive that marks a custom cell template for a given column.
 *
 * Usage:
 *   <ng-template columnDef="site" let-row>
 *     <a (click)="navigateToSite(row)">{{ row.site }}</a>
 *   </ng-template>
 */
@Directive({
  selector: '[columnDef]',
  standalone: true,
})
export class ColumnDefDirective {
  @Input('columnDef') columnDef!: string;

  constructor(
    public templateRef: TemplateRef<{ $implicit: any; row: any }>
  ) {}
}