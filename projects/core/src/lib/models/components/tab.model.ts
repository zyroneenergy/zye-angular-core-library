/**
 * Domain-free tab configuration types.
 */

export interface TabItem {
  /** Unique route-friendly key e.g. 'analytics', 'layout' */
  key: string;
  /** Display label */
  label: string;
  /** isax icon class e.g. 'isax-activity' */
  icon?: string;
}