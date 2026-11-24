import { TemplateRef } from '@angular/core';
import { MenuItem } from '../components/side-bar/side-bar.component';
import { AccessRequirement } from '../access/access.config';

/** One sidebar entry. Data-driven; anything the user may not access is hidden automatically. */
export interface NavItem extends MenuItem {
  /** Hide the item unless the user meets this (feature key, rule, or list). */
  access?: AccessRequirement;
  /** Sub-items: inline under the item when expanded, a hover flyout on the collapsed rail. */
  children?: NavItem[];
  /** Custom sub-menu content (e.g. the open site's tabs), shown like `children`. */
  submenu?: TemplateRef<unknown> | null;
  /** Only highlight on an exact URL match. */
  exact?: boolean;
  /** Small counter / tag after the label. */
  badge?: string | number | null;
}
