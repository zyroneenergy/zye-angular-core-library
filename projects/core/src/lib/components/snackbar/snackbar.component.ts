import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarData {
  message: string;
  type: SnackbarType;
  /** Optional label for the action button (e.g. 'Retry', 'Undo') */
  action?: string;
}

@Component({
  selector: 'lib-snackbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss'],
})
export class SnackbarComponent {
  constructor(
    public snackbarRef: MatSnackBarRef<SnackbarComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: SnackbarData,
  ) {}

  /** Maps type → Material icon name */
  get icon(): string {
    const icons: Record<SnackbarType, string> = {
      success: 'check_circle',
      error:   'error',
      info:    'info',
      warning: 'warning',
    };
    return icons[this.data.type] ?? 'info';
  }

  dismiss(): void {
    this.snackbarRef.dismiss();
  }

  action(): void {
    this.snackbarRef.dismissWithAction();
  }
}