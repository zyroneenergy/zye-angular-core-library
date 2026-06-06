import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
  AfterContentInit,
  TemplateRef,
  ChangeDetectionStrategy,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { TableColumn } from '../../models/components/data-table.model';
import { ColumnDefDirective } from '../../directives/components/column-def.directive';
import { ShimmerComponent } from "../shimmer/shimmer.component";
 

@Component({
  selector: 'lib-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCheckboxModule,
    ShimmerComponent
],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends { id?: string }> implements AfterContentInit, OnChanges {
  // ── Data inputs ────────────────────────────────────────────────────────────
  @Input() data: T[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() displayedColumns: string[] = [];
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions: number[] = [10, 20, 50];
  @Input() sortActive = '';
  @Input() sortDirection: 'asc' | 'desc' | '' = '';
 
  // ── State inputs ───────────────────────────────────────────────────────────
  @Input() loading = false;
  @Input() emptyIcon = 'folder_open';
  @Input() emptyTitle = 'No data';
  @Input() emptyDescription = 'No records found.';
 
  // ── Selection inputs (optional — pass in a SelectionModel from parent) ─────
  @Input() selection: SelectionModel<T> | null = null;
  @Input() showCheckbox = false;
 
  /** Optional predicate: return true to render the row in solarTextThird colour */
  @Input() isRowDimmed: ((row: T) => boolean) | null = null;
  // ── Outputs ────────────────────────────────────────────────────────────────
  @Output() pageChange  = new EventEmitter<PageEvent>();
  @Output() sortChange  = new EventEmitter<Sort>();
  @Output() rowClick    = new EventEmitter<T>();
  @Output() toggleAll   = new EventEmitter<void>();
  @Output() toggleRow   = new EventEmitter<T>();
 
  // ── Custom cell templates projected via SfColumnDefDirective ──────────────
  @ContentChildren(ColumnDefDirective) columnDefs!: QueryList<ColumnDefDirective>;
 
  dataSource = new MatTableDataSource<T>([]);
 
  /** Map of columnKey → TemplateRef built after content init */
  templateMap = new Map<string, TemplateRef<{ $implicit: T; row: T }>>();
 
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.dataSource.data = this.data ?? [];
    }
  }
 
  ngAfterContentInit(): void {
    this.buildTemplateMap();
    this.columnDefs.changes.subscribe(() => this.buildTemplateMap());
  }
 
  private buildTemplateMap(): void {
    this.templateMap.clear();
    this.columnDefs.forEach((def) => {
      this.templateMap.set(def.columnDef, def.templateRef);
    });
  }
 
  // ── Selection helpers exposed to template ──────────────────────────────────
  get isAllSelected(): boolean {
    return (
      !!this.selection &&
      this.selection.selected.length === this.dataSource.data.length &&
      this.dataSource.data.length > 0
    );
  }
 
  get isIndeterminate(): boolean {
    return (
      !!this.selection &&
      this.selection.hasValue() &&
      !this.isAllSelected
    );
  }
 
  isSelected(row: T): boolean {
    return !!this.selection?.isSelected(row);
  }
 
  onToggleAll(): void {
    this.toggleAll.emit();
  }
 
  onToggleRow(row: T): void {
    this.toggleRow.emit(row);
  }
 
  onPageChange(event: PageEvent): void {
    this.pageChange.emit(event);
  }
 
  onSortChange(sort: Sort): void {
    this.sortChange.emit(sort);
  }
 
  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }
 
  // Skeleton shimmer rows
  get skeletonRows(): number[] {
    return Array.from({ length: this.pageSize }, (_, i) => i);
  }
}
