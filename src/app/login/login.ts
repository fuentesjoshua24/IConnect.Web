import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly mode = signal<AuthMode>('login');
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isSubmitting = signal(false);

  readonly loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(254)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
  });

  readonly registerForm = new FormGroup(
    {
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(254)] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.maxLength(100)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: this.passwordsMatch },
  );

  readonly forgotForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(254)] }),
  });

  readonly resetForm = new FormGroup(
    {
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(254)] }),
      token: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.maxLength(100)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: this.resetPasswordsMatch },
  );

  constructor() {
    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');
    if (email && token) {
      this.resetForm.patchValue({ email, token });
      this.mode.set('reset');
    }
  }

  setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  async submitLogin(): Promise<void> {
    await this.submit(
      this.loginForm,
      async () => {
        const { email, password } = this.loginForm.getRawValue();
        const response = await firstValueFrom(this.auth.login(email, password));
        this.auth.setAuthenticatedSession(response);

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        await this.router.navigateByUrl(returnUrl, { replaceUrl: true });
      },
      'Login failed. Please try again.',
    );
  }

  async submitRegister(): Promise<void> {
    await this.submit(
      this.registerForm,
      async () => {
        const { email, password } = this.registerForm.getRawValue();
        const response = await firstValueFrom(this.auth.register(email, password));
        this.auth.setAuthenticatedSession(response);
        await this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      },
      'Registration failed. Please check your details and try again.',
    );
  }

  async submitForgotPassword(): Promise<void> {
    await this.submit(
      this.forgotForm,
      async () => {
        const { email } = this.forgotForm.getRawValue();
        const response = await firstValueFrom(this.auth.forgotPassword(email));
        this.successMessage.set(response.message || 'If that email exists, a reset link has been sent.');
      },
      'Unable to submit the password reset request.',
    );
  }

  async submitResetPassword(): Promise<void> {
    await this.submit(
      this.resetForm,
      async () => {
        const { email, token, newPassword } = this.resetForm.getRawValue();
        const response = await firstValueFrom(this.auth.resetPassword(email, token, newPassword));
        this.mode.set('login');
        this.successMessage.set(response.message || 'Password reset successful. You can now sign in.');
      },
      'Unable to reset your password. Request a new reset link and try again.',
    );
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((visible) => !visible);
  }

  private passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private resetPasswordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private async submit(form: FormGroup, action: () => Promise<void>, fallbackMessage: string): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    try {
      await action();
    } catch (error: unknown) {
      this.errorMessage.set(this.apiErrorMessage(error, fallbackMessage));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private apiErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (error.status === 400) {
      const problem = error.error as { title?: string; detail?: string; errors?: Record<string, string[]> } | null;
      if (problem?.errors) {
        const firstError = Object.values(problem.errors)[0]?.[0];
        if (firstError) return firstError;
      }
      return problem?.detail || problem?.title || fallback;
    }
    if (error.status === 401) return 'Invalid email or password. Please try again.';
    if (error.status === 409) return 'An account with this email already exists.';
    if (error.status === 429) return 'Too many attempts. Please wait and try again.';
    if (error.status === 0) return 'Cannot reach the API. Check the server and network connection.';
    return fallback;
  }
}
