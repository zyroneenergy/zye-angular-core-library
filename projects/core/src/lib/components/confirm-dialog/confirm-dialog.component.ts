import { Component, Inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CONFIRM_DIALOG_ICONS, ConfirmDialogIcon } from './confirm-dialog-icons';
import { lastValueFrom } from 'rxjs';

export type ConfirmDialogType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogConfig {
  title: string;
  message: string;
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  /** Drives color of icon bg / confirm button. @default 'danger' */
  type?: ConfirmDialogType;
  /**
   * Overrides which illustration renders, independent of `type`.
   * Use this when the icon doesn't match the semantic type — e.g. a
   * 'refresh' icon on a 'warning'-colored session-expired dialog.
   * Falls back to `type` when omitted.
   */
  icon?: ConfirmDialogIcon;
  warningNote?: string;
  asyncConfirm?: boolean;
}

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
  }),

  sessionExpired: (): ConfirmDialogConfig => ({
    title: 'Your session has expired',
    message: 'The current session has ended and you have been automatically logged out.',
    detail: 'Please log back in to resume your work.',
    confirmText: 'Login',
    cancelText: 'Close',
    type: 'info',
    icon: 'refresh'
  })
};

@Component({
  selector: 'lib-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public config: ConfirmDialogConfig,
    private sanitizer: DomSanitizer
  ) {
    if (!this.config.type) this.config.type = 'danger';
  }

  /**
   * Illustration to render. `icon` overrides `type` when both are set,
   * so the visual and the color/button semantics can differ.
   */
  get illustration(): SafeHtml {
    const key = this.config.icon ?? this.config.type ?? 'danger';
    const svg = CONFIRM_DIALOG_ICONS[key];
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  onConfirm(): void {
    if (this.config.asyncConfirm) {
      this.isLoading = true;
    } else {
      this.dialogRef.close(true);
    }
  }
}

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