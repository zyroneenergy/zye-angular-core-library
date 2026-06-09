import { Component, ViewEncapsulation } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatStepperModule } from "@angular/material/stepper";
import { MatDialog } from "@angular/material/dialog";
import { MatCardModule } from "@angular/material/card";
import { AuthLayoutComponent } from "../auth-layout/auth-layout.component";
import { AuthApiService } from "../../services/auth.api.service";
import { SnackbarService } from "../../../services/components/snackbar.service";
import { ConfirmDialogComponent, ConfirmDialogConfig } from "../../../components/confirm-dialog/confirm-dialog.component";

@Component({
  selector: "lib-forgot-password",
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatStepperModule,
    MatCardModule,
    AuthLayoutComponent,
  ],
  templateUrl: "./forgot-password.component.html",
  styleUrls: ["./forgot-password.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class ForgotPasswordComponent {
  // ─── Forms ────────────────────────────────────────────────────────────────
  firstFormGroup = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
  });

  secondFormGroup = this.fb.group({
    otp: ["", Validators.required],
  });

  thirdFormGroup = this.fb.group({
    password: [
      "",
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(
          /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
        ),
      ],
    ],
    confirmPassword: [
      "",
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(
          /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
        ),
      ],
    ],
  });

  // ─── State ────────────────────────────────────────────────────────────────
  isOTPSent = false;
  otpAttempts = 0;
  readonly maxOtpAttempts = 3;
  isOtpVerified = false;
  hideNew = true;
  hideConfirm = true;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private router: Router,
    private authApiService: AuthApiService,
    private snackbar: SnackbarService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Safely extracts a human-readable error message from any HttpErrorResponse.
   * Handles both { message: string } and { error: { message: string } } shapes,
   * plus the NestJS GlobalExceptionFilter envelope.
   */
  private extractErrorMessage(err: any, fallback: string): string {
    return (
      err?.error?.message ||
      err?.error?.error ||
      err?.message ||
      fallback
    );
  }

  // ─── Success dialog ───────────────────────────────────────────────────────

  private openSuccessDialog(): void {
    const config: ConfirmDialogConfig = {
      title: "Password Changed!",
      message: "Your password has been changed successfully.",
      confirmText: "Back to Login",
      type: "success",
    };

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: config,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.router.navigate(["/auth/login"]);
      }
    });
  }

  // ─── Step 1 – Send OTP ────────────────────────────────────────────────────

  sendOTP(): void {
    if (this.firstFormGroup.invalid) {
      this.snackbar.error("Please enter a valid email address.");
      return;
    }

    const email = this.firstFormGroup.get("email")!.value!;

    this.authApiService.forgotPassword(email).subscribe({
      next: () => {
        this.isOTPSent = true;
        this.snackbar.success("OTP has been sent to your email address.");
      },
      error: (err) => {
        console.error("[ForgotPassword] sendOTP error:", err);

        if (err.status === 404) {
          this.snackbar.error(
            "No account found for this email. Please register or use a different address."
          );
          this.router.navigate(["/auth/login"]);
          return;
        }

        if (err.status === 400 || err.status === 403) {
          // Covers "User not linked to any tenant" and similar domain errors
          this.snackbar.error(
            this.extractErrorMessage(
              err,
              "Your account is not set up correctly. Please contact support."
            )
          );
          return;
        }

        this.snackbar.error(
          this.extractErrorMessage(err, "Failed to send OTP. Please try again.")
        );
      },
    });
  }

  // ─── Step 1 – Resend OTP ──────────────────────────────────────────────────

  resendOTP(): void {
    const email = this.firstFormGroup.get("email")!.value!;

    this.authApiService.resendEmail(email).subscribe({
      next: () => {
        this.snackbar.success("A new OTP has been sent to your email address.");
      },
      error: (err) => {
        console.error("[ForgotPassword] resendOTP error:", err);
        this.snackbar.error(
          this.extractErrorMessage(err, "Failed to resend OTP. Please try again.")
        );
      },
    });
  }

  // ─── Step 2 – Verify OTP ─────────────────────────────────────────────────

  verifyOTP(stepper: any): void {
    if (this.secondFormGroup.invalid) {
      this.snackbar.error("Please enter the OTP sent to your email.");
      return;
    }

    const email = this.firstFormGroup.get("email")!.value!;
    const otp   = this.secondFormGroup.get("otp")!.value!;

    this.authApiService.verifyEmail(email, otp).subscribe({
      next: () => {
        this.isOtpVerified = true;
        this.otpAttempts   = 0;
        this.snackbar.success("OTP verified successfully.");
        stepper.next();
      },
      error: (err) => {
        console.error("[ForgotPassword] verifyOTP error:", err);

        this.otpAttempts++;
        // Always clear the field so users don't accidentally resubmit stale input
        this.secondFormGroup.get("otp")?.reset();

        const remaining = this.maxOtpAttempts - this.otpAttempts;

        if (this.otpAttempts >= this.maxOtpAttempts) {
          this.snackbar.error(
            "Maximum OTP attempts exceeded. Redirecting to login…"
          );
          this._resetAllForms();
          setTimeout(() => this.router.navigate(["/auth/login"]), 3000);
          return;
        }

        this.snackbar.warning(
          `Invalid OTP — ${remaining} ${remaining === 1 ? "attempt" : "attempts"} remaining.`
        );
      },
    });
  }

  // ─── Step 3 – Set New Password ────────────────────────────────────────────

  setNewPassword(): void {
    if (this.thirdFormGroup.invalid) {
      this.snackbar.error(
        "Password must be at least 8 characters and include uppercase, lowercase, digit, and special character."
      );
      return;
    }

    const password        = this.thirdFormGroup.get("password")!.value!;
    const confirmPassword = this.thirdFormGroup.get("confirmPassword")!.value!;

    if (password !== confirmPassword) {
      this.snackbar.error("Passwords do not match. Please re-enter.");
      return;
    }

    const email = this.firstFormGroup.get("email")!.value!;
    const otp   = this.secondFormGroup.get("otp")!.value!;

    this.authApiService.updatePassword(email, otp, password).subscribe({
      next: () => this.openSuccessDialog(),
      error: (err) => {
        console.error("[ForgotPassword] setNewPassword error:", err);
        this.snackbar.error(
          this.extractErrorMessage(
            err,
            "Failed to update password. Please try again."
          )
        );
      },
    });
  }

  // ─── Private utilities ────────────────────────────────────────────────────

  private _resetAllForms(): void {
    this.firstFormGroup.reset();
    this.secondFormGroup.reset();
    this.thirdFormGroup.reset();
    this.otpAttempts  = 0;
    this.isOTPSent    = false;
    this.isOtpVerified = false;
  }
}