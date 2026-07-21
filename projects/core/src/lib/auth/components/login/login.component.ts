import { Component, computed, Inject, Optional, signal, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthLayoutComponent } from "../auth-layout/auth-layout.component";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { LoginSuccessResponse } from '../../models/login-success-response';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { mapAuthError } from '../../utils/auth-error.mapper';
import { ShimmerComponent } from '../../../components/shimmer/shimmer.component';
import { SnackbarService } from '../../../services/components/snackbar.service';
import { CoreConfig } from '../../../config/core-config';
import { CORE_CONFIG } from '../../../config/core-config.token';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { LoginCredentials } from '../../models/login-credentials';

@Component({
  selector: 'lib-login',
  standalone: true,
  imports: [
    AuthLayoutComponent,
    MatButtonModule,
    RouterModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinner,
    ShimmerComponent,
    MatCheckboxModule 
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent {
  loginForm!: FormGroup;
  hidePassword = true;

  /** Single source of truth for UI state */
  uiState = signal<any>({ status: 'idle' });

  /** Derived signals for template */
  isLoading = computed(() => this.uiState().status === 'loading');
  isError = computed(() => this.uiState().status === 'error');
  errorMsg = computed(() => this.uiState().errorMessage ?? '');

  /** Welcome title for the login card */
  loginTitle: string;
  loginSubTitle?: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private snackbar: SnackbarService,
    private userService: UserService,
    @Inject(CORE_CONFIG)
    protected config: CoreConfig
  ) {
    this.loginTitle = this.config.auth.loginTitle ?? `Aegis`;
    this.loginSubTitle = this.config.auth.loginSubtitle ?? `Portfolio Intelligence for Renewable Finance`;
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
  if (this.isLoading()) return;

  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.uiState.set({ status: 'loading' });

  const rawValue = this.loginForm.value;

  // Remember-me is only a genuine user choice on projects with the
  // activity-based silent refresh flow enabled. Elsewhere we preserve the
  // legacy "always persisted" behavior — no checkbox is rendered, so the
  // control's value is never a real signal.
  const rememberMe = this.config.auth.enableActivitySilentRefresh
    ? !!rawValue.rememberMe
    : true;

  const credentials: LoginCredentials = {
    ...rawValue,
    rememberMe,
  };

  this.authService.login(credentials, rememberMe).subscribe({
    next: (res: LoginSuccessResponse) => {
      this.uiState.set({ status: 'success' });
      this.snackbar.success('Welcome back!');

      const returnUrl = sessionStorage.getItem('returnUrl');
      if (returnUrl) {
        sessionStorage.removeItem('returnUrl');
        this.router.navigateByUrl(returnUrl);
      } else {
        this.router.navigate(['/dashboard']);
      }
    },
    error: (err: any) => {
      const message = mapAuthError(err);
      this.uiState.set({ status: 'error', errorMessage: message });
      this.snackbar.error(message);
    },
  });
}

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}