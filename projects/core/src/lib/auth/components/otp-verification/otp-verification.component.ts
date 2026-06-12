import { Component, ElementRef, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { MatCard } from "@angular/material/card";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthLayoutComponent } from '../auth-layout/auth-layout.component';
import { AuthApiService } from '../../services/auth.api.service';

@Component({
  selector: 'lib-otp-verification',
  standalone: true,
  imports: [AuthLayoutComponent, MatCard, ReactiveFormsModule, CommonModule, MatButtonModule, MatInputModule],
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OtpVerificationComponent {
  otpForm!: FormGroup;
  @ViewChildren('input') inputs!: QueryList<ElementRef>;
  email!: string;
  isSubmitting = false;

  constructor(private fb: FormBuilder, private router: Router, 
    private apiService: AuthApiService, 
    private route: ActivatedRoute, private _snackBar: MatSnackBar) {}

  ngOnInit() {
    this.otpForm = this.fb.group({
      0: ['', [Validators.required, Validators.pattern('[0-9]')]],
      1: ['', [Validators.required, Validators.pattern('[0-9]')]],
      2: ['', [Validators.required, Validators.pattern('[0-9]')]],
      3: ['', [Validators.required, Validators.pattern('[0-9]')]],
      4: ['', [Validators.required, Validators.pattern('[0-9]')]],
      5: ['', [Validators.required, Validators.pattern('[0-9]')]],
    });
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });
  }

  get otpControls() {
    return Object.keys(this.otpForm.controls);
  }
  
  moveFocus(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && index < 5) {
      const nextInput = input.parentElement?.children[index + 1] as HTMLInputElement;
      nextInput?.focus();
    } else if (!value && index > 0 && event.key === 'Backspace') {
      const prevInput = input.parentElement?.children[index - 1] as HTMLInputElement;
      prevInput?.focus();
    }
  }

  onSubmit() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    const emailCode = Object.values(this.otpForm.value).join('');
    this.isSubmitting = true;

    this.apiService.verifyEmail(this.email, emailCode).subscribe({
      next: (res) => {
        this._snackBar.open('Email verified successfully! Please log in.', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('OTP verification failed:', err);
        this._snackBar.open('Invalid or expired OTP. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
        });
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}
