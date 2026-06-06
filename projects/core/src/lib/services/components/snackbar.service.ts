import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SnackbarComponent, SnackbarData } from '../../components/snackbar/snackbar.component';

/**
 * Shared notification service used across the entire project.
 * Never call MatSnackBar directly — always go through this service.
 *
 * Usage:
 *   this.snackbar.success('Login successful');
 *   this.snackbar.error('Invalid email or password.');
 *   this.snackbar.info('Verification email sent.');
 *   this.snackbar.warning('Session will expire soon.');
 */
@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string, action?: string): void {
    this.open({ message, type: 'success', action }, {
      duration: 3000,
      panelClass: ['app-snackbar', 'app-snackbar--success'],
    });
  }

  error(message: string, action?: string): void {
    this.open({ message, type: 'error', action }, {
      duration: 5000, // errors stay longer so users can read them
      panelClass: ['app-snackbar', 'app-snackbar--error'],
    });
  }

  info(message: string, action?: string): void {
    this.open({ message, type: 'info', action }, {
      duration: 4000,
      panelClass: ['app-snackbar', 'app-snackbar--info'],
    });
  }

  warning(message: string, action?: string): void {
    this.open({ message, type: 'warning', action }, {
      duration: 5000,
      panelClass: ['app-snackbar', 'app-snackbar--warning'],
    });
  }

  dismiss(): void {
    this.snackBar.dismiss();
  }

  private open(data: SnackbarData, config: MatSnackBarConfig): void {
    this.snackBar.openFromComponent(SnackbarComponent, {
      ...config,
      data,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}