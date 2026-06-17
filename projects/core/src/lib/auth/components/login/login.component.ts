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
    ShimmerComponent
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

    const credentials: any = this.loginForm.value;

    this.authService.login(credentials, true).subscribe({
      next: (res: LoginSuccessResponse) => {
        this.userService.setToken(res.accessToken);
        this.uiState.set({ status: 'success' });
        this.snackbar.success('Welcome back!');
       const returnUrl =
  sessionStorage.getItem(
    'returnUrl'
  );

if (returnUrl) {

  sessionStorage.removeItem(
    'returnUrl'
  );

  this.router.navigateByUrl(
    returnUrl
  );

} else {

  this.router.navigate([
    '/dashboard'
  ]);

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