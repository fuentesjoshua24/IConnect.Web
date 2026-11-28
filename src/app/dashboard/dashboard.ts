import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { ApiUser, AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly user = this.auth.currentUser;
  readonly activeSection = toSignal(this.route.fragment.pipe(map((fragment) => fragment ?? 'overview')), {
    initialValue: this.route.snapshot.fragment ?? 'overview',
  });
  readonly firstName = computed(() => {
    const email = this.user()?.email;
    return email ? email.split('@')[0] : 'User';
  });
  readonly roleLabel = computed(() => {
    const roles = this.user()?.roles ?? [];
    return roles.join(', ') || 'Subscriber';
  });
  readonly isAdministrator = computed(() =>
    (this.user()?.roles ?? []).some((role) => role.toLowerCase() === 'administrator'),
  );
  readonly createdAtLabel = computed(() => {
    const createdAt = this.user()?.createdAt;
    if (!createdAt) {
      return '—';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(createdAt));
  });

  readonly logoutError = signal('');
  readonly passwordError = signal('');
  readonly passwordSuccess = signal('');
  readonly isChangingPassword = signal(false);

  readonly changePasswordForm = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.maxLength(100)] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  }, {
    validators: (control) => control.get('newPassword')?.value === control.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true },
  });

  async updatePassword(): Promise<void> {
    this.passwordError.set('');
    this.passwordSuccess.set('');
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword.set(true);
    try {
      const { currentPassword, newPassword } = this.changePasswordForm.getRawValue();
      await firstValueFrom(this.auth.changePassword(currentPassword, newPassword));
      this.changePasswordForm.reset();
      this.auth.clearSession();
      await this.router.navigate(['/login'], {
        replaceUrl: true,
        queryParams: { passwordChanged: 'true' },
      });
    } catch (error: unknown) {
      this.passwordError.set(this.passwordErrorMessage(error));
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  private passwordErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Unable to update your password. Please try again.';
    }
    if (error.status === 401) {
      return 'The current password is incorrect.';
    }
    if (error.status === 400) {
      const problem = error.error as { detail?: string; title?: string } | null;
      return problem?.detail || problem?.title || 'The new password was rejected.';
    }
    if (error.status === 0) {
      return 'Cannot reach the API. Check the server and network connection.';
    }
    return 'Unable to update your password. Please try again.';
  }

  async logout(): Promise<void> {
    this.logoutError.set('');
    try {
      await firstValueFrom(this.auth.logout());
      this.auth.clearSession();
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch {
      this.logoutError.set('Unable to sign out. Please check your connection and try again.');
    }
  }
}
