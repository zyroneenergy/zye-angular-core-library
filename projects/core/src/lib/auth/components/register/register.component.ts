import { CommonModule } from '@angular/common';
import { Component, computed, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterModule } from '@angular/router';
import { AuthLayoutComponent } from '../..';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';

export type AuthUiStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AuthUiState {
  status: AuthUiStatus;
  errorMessage?: string;
}

@Component({
  selector: 'lib-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatIconModule,
    RouterModule,
    AuthLayoutComponent,
    // ShimmerComponent,
    MatProgressSpinner
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  encapsulation: ViewEncapsulation.None
})

export class RegisterComponent {

  registrationForm!: FormGroup;
  hidePassword = true;

  /** Single source of truth for UI state */
  uiState = signal<AuthUiState>({ status: 'idle' });

  /** Derived signals */
  isLoading = computed(() => this.uiState().status === 'loading');
  isError = computed(() => this.uiState().status === 'error');
  errorMsg = computed(() => this.uiState().errorMessage ?? '');

  // Autocomplete
  filteredStates$!: Observable<string[]>;
  filteredCities$!: Observable<string[]>;

  get stateControl() {
    return this.registrationForm.get('region') as FormControl;
  }

  get cityControl() {
    return this.registrationForm.get('branch') as FormControl;
  }

  constructor(
    private fb: FormBuilder,
    // private authApi: AuthApiService,
    // private locationService: LocationService,
    private router: Router,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.setupAutocomplete();
  }

  private initForm(): void {
    this.registrationForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9\\s]+')]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
        ],
      ],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      branch: ['', Validators.required],
      region: ['', Validators.required],
    });
  }

  private setupAutocomplete(): void {
    // States
    // const states$ = this.locationService.getStates();
    // this.filteredStates$ = combineLatest({
    //   states: states$,
    //   query: this.stateControl.valueChanges.pipe(startWith('')),
    // }).pipe(
    //   map(({ states, query }) => this._filter(query || '', states))
    // );

    // // Cities (dynamic based on state)
    // const citiesSource$ = this.stateControl.valueChanges.pipe(
    //   startWith(''),
    //   switchMap((state) => (state ? this.locationService.getCities(state) : of([] as string[])))
    // );

    // this.filteredCities$ = combineLatest({
    //   cities: citiesSource$,
    //   query: this.cityControl.valueChanges.pipe(startWith('')),
    // }).pipe(
    //   map(({ cities, query }) => this._filter(query || '', cities))
    // );
  }

  private _filter(value: string, options: string[]): string[] {
    const filterValue = value.toLowerCase().trim();
    return filterValue
      ? options.filter((option) => option.toLowerCase().includes(filterValue))
      : options;
  }

  onSubmit(): void {
    // if (this.isLoading() || this.registrationForm.invalid) {
    //   this.registrationForm.markAllAsTouched();
    //   return;
    // }

    // this.uiState.set({ status: 'loading' });

    // const details: RegistrationDetails = this.registrationForm.value;

    // this.authApi.register(details).subscribe({
    //   next: (res: RegisterSuccessResponse) => {
    //     this.uiState.set({ status: 'success' });
    //     this.snackBar.open(
    //       `Registration successful. Please check your email (${details.email}) for OTP verification.`,
    //       'Close',
    //       { duration: 5000, horizontalPosition: 'right', verticalPosition: 'top' }
    //     );
    //     this.router.navigate(['/auth/register/verify-otp'], {
    //       queryParams: { email: details.email },
    //     });
    //   },
    //   error: (err: HttpErrorResponse) => {
    //     let message = 'Something went wrong. Please try again.';

    //     if (err.status === 409) {
    //       message = 'Company name is already taken.';
    //     } else if (err.error?.errorCode === ResponseErrorCodes.GeneralError) {
    //       message = 'Something went wrong, please try again.';
    //     } else if (err.error?.message) {
    //       message = err.error.message;
    //     }

    //     this.uiState.set({ status: 'error', errorMessage: message });
    //     this.snackBar.open(message, 'Close', {
    //       duration: 4000,
    //       horizontalPosition: 'right',
    //       verticalPosition: 'top',
    //     });
    //   },
    // });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  // Optional: Company name availability check (kept but improved)
  checkCompanyNameAvailability(event: Event): void {
    const input = event.target as HTMLInputElement;
    const companyName = input.value.trim();
    if (!companyName) return;

    // this.authApi.checkNamespace(companyName).subscribe({
    //   next: () => {
    //     // You can show success message if needed
    //   },
    //   error: (err: HttpErrorResponse) => {
    //     if (err.status === 409) {
    //       this.snackBar.open('Company name is already taken.', 'Close', { duration: 3000 });
    //     }
    //   },
    // });
  }
  
}
