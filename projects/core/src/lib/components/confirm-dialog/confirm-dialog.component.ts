import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ─── Config interface ─────────────────────────────────────────
export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogConfig {
  /** Dialog title */
  title: string;
  /** Main message body */
  message: string;
  /** Optional secondary detail text */
  detail?: string;
  /** Confirm button label (default: 'Confirm') */
  confirmText?: string;
  /** Cancel button label (default: 'Cancel') */
  cancelText?: string;
  /** Visual tone (default: 'danger') */
  type?: ConfirmDialogType;
  /** Show a warning note below the message */
  warningNote?: string;
  /** If true, confirm button stays loading until dialog is programmatically closed */
  asyncConfirm?: boolean;
}

// ─── Helper factory functions for common dialogs ─────────────
export const ConfirmDialogs = {
  delete: (itemName: string, itemType = 'item'): ConfirmDialogConfig => ({
    title: `Delete ${itemType}`,
    message: `Are you sure you want to delete "${itemName}"?`,
    detail: 'This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger'
  }),

  deleteBulk: (count: number, itemType = 'items'): ConfirmDialogConfig => ({
    title: `Delete ${count} ${itemType}`,
    message: `Are you sure you want to delete ${count} ${itemType}?`,
    detail: 'This action cannot be undone.',
    confirmText: `Delete ${count}`,
    cancelText: 'Cancel',
    type: 'danger'
  }),

  publish: (siteName: string): ConfirmDialogConfig => ({
    title: 'Publish Site',
    message: `Ready to publish "${siteName}"?`,
    detail: 'Once published, the site will go live and start monitoring. You can still edit it afterwards.',
    confirmText: 'Publish Now',
    cancelText: 'Not Yet',
    type: 'success'
  }),

  discard: (): ConfirmDialogConfig => ({
    title: 'Discard Changes',
    message: 'Are you sure you want to leave?',
    detail: 'Any unsaved progress will be lost.',
    confirmText: 'Discard',
    cancelText: 'Keep Editing',
    type: 'warning'
  }),

  removeInverter: (name: string): ConfirmDialogConfig => ({
    title: 'Remove Inverter',
    message: `Remove "${name}" from this configuration?`,
    confirmText: 'Remove',
    cancelText: 'Cancel',
    type: 'warning'
  }),

  removeBlock: (name: string): ConfirmDialogConfig => ({
    title: 'Remove Block',
    message: `Remove block "${name}" and all its inverters?`,
    detail: 'All inverters in this block will be permanently removed.',
    confirmText: 'Remove Block',
    cancelText: 'Cancel',
    type: 'danger'
  }),

  resetConfig: (): ConfirmDialogConfig => ({
    title: 'Reset Configuration',
    message: 'Reset all blocks and inverters?',
    detail: 'The entire asset configuration will be cleared.',
    confirmText: 'Reset',
    cancelText: 'Cancel',
    type: 'danger'
  }),

  updateLive: (fieldName: string): ConfirmDialogConfig => ({
    title: 'Update Live Site',
    message: `Save changes to "${fieldName}" on this live site?`,
    detail: 'Changes will take effect immediately.',
    confirmText: 'Save Changes',
    cancelText: 'Cancel',
    type: 'info'
  })
};
@Component({
  selector: 'lib-confirm-dialog',
  standalone: true,
  imports: [CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public config: ConfirmDialogConfig
  ) {
    // Apply default type
    if (!this.config.type) this.config.type = 'danger';
  }

  get iconName(): string {
    switch (this.config.type) {
      case 'danger':  return 'delete_forever';
      case 'warning': return 'warning_amber';
      case 'info':    return 'info';
      case 'success': return 'check_circle';
      default:        return 'help_outline';
    }
  }

  onConfirm(): void {
    if (this.config.asyncConfirm) {
      this.isLoading = true;
      // Caller closes the dialog when the async operation completes
    } else {
      this.dialogRef.close(true);
    }
  }
}

// ─── Service wrapper for convenience ─────────────────────────
// Usage:  const ok = await this.confirmSvc.open(ConfirmDialogs.delete('My Site', 'Site'));
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  constructor(private dialog: MatDialog) {}

  async open(config: ConfirmDialogConfig): Promise<boolean> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: config,
      disableClose: true,
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop'
    });
    const result = await lastValueFrom(ref.afterClosed());
    return result === true;
  }
}