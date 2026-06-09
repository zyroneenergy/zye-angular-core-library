import { Component, ViewEncapsulation } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { Router } from "@angular/router";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import {MatIcon} from "@angular/material/icon";
import { CommonModule } from "@angular/common";

@Component({
  selector: "lib-update-password",
  standalone: true,
  imports: [
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIcon,
    CommonModule
  ],
  templateUrl: "./update-password.component.html",
  styleUrl: "./update-password.component.scss",
  encapsulation: ViewEncapsulation.None,
})
export class UpdatePasswordComponent {
  updatePasswordForm: FormGroup;
  hideCurrent = true;
  hideNew = true;
  hideConfirm = true;
  username!: string;
  loading = false;

  constructor(
    private fb: FormBuilder,
    // private authApi: AuthApiService,
    // private authService: AuthService,
    private snackBar: MatSnackBar,
    // private PasswordValidator: PasswordValidatorService,
    // private userService: UserService
  ) {
    //  this.username = this.userService.username() ?? '';

    // ✅ Define full form with custom validator
    this.updatePasswordForm = this.fb.group(
      {
        currentPassword: ["", [Validators.required]],
        newPassword: ["", [Validators.required]],
        confirmPassword: ["", Validators.required],
      },
      { validators: [this.matchPasswords] }
    );
  }

   /** Custom validator to check if newPassword and confirmPassword match */
   private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const newPass = group.get("newPassword")?.value;
    const confirmPass = group.get("confirmPassword")?.value;
    return newPass === confirmPass ? null : { passwordsMismatch: true };
  }

  get currentPassword(): AbstractControl { return this.updatePasswordForm.get("currentPassword")!; }
  get newPassword(): AbstractControl { return this.updatePasswordForm.get("newPassword")!; }
  get confirmPassword(): AbstractControl { return this.updatePasswordForm.get("confirmPassword")!; }

  /** Call API to update password */
  updatePassword(): void {
    if (this.updatePasswordForm.invalid) {
      this.updatePasswordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.updatePasswordForm.value;
    this.loading = true;

    // this.authApi.changePassword(this.username, currentPassword, newPassword).subscribe({
    //   next: () => {
    //     this.snackBar.open("Password updated successfully. Please log in again.", "Close", {
    //       duration: 3000,
    //       horizontalPosition: "right",
    //       verticalPosition: "top",
    //     });
    //     setTimeout(() => {
    //       this.authService.logout("/auth/login");
    //     }, 1000);
    //   },
    //   error: (err) => {
    //     const message = err?.error?.message || "Failed to update password.";
    //     this.snackBar.open(message, "Close", {
    //       duration: 3000,
    //       horizontalPosition: "right",
    //       verticalPosition: "top",
    //     });
    //   }
    // });
  }

  getErrorText(control: AbstractControl) {
    if (control.hasError("required")) return "Password is required";
    if (control.hasError("invalidPassword"))
      return "Password must contain at least one lowercase, one uppercase, one digit, and one special character.";
    if (control.hasError("passwordsMismatch")) return "Passwords do not match";
    return "";
  }
}
