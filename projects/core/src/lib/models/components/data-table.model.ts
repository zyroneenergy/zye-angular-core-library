import { TemplateRef } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  sticky?: boolean;
  minWidth?: string;
}

export interface TableConfig {
  columns: TableColumn[];
  displayedColumns: string[];
  pageSize?: number;
  pageSizeOptions?: number[];
  stickyHeader?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export interface CellTemplateMap {
  [columnKey: string]: TemplateRef<{ $implicit: any; row: any }>;
}
export interface TableColumn {
  /** Template column key — must match matColumnDef */
  key: string;
  /** Header label */
  label: string;
  /** Whether the column is sortable */
  sortable?: boolean;
  /**
   * API sort field name.
   * If provided, [mat-sort-header] will use this value so that
   * Sort.active === sortKey (the API field), not key (the display column).
   * If omitted, falls back to key.
   */
  sortKey?: string;
  /** min-width CSS value */
  minWidth?: string;
}