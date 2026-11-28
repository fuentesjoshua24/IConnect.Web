import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiUser {
  id: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  expiresAt: string;
  user: ApiUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/$/, '');
  private readonly tokenKey = 'iconnect_access_token';
  private readonly userKey = 'iconnect_current_user';

  readonly currentUser = signal<ApiUser | null>(null);
  readonly sessionError = signal('');
  private sessionInitialized = false;
  private sessionCheck: Promise<ApiUser | null> | null = null;

  constructor() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  login(email: string, password: string) {
    const request: LoginRequest = { email: email.trim(), password };

    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/login`, request);
  }

  register(email: string, password: string) {
    const request: RegisterRequest = { email: email.trim(), password };

    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/register`, request);
  }

  forgotPassword(email: string) {
    const request: ForgotPasswordRequest = { email: email.trim() };

    return this.http.post<MessageResponse>(`${this.baseUrl}/api/auth/forgot-password`, request);
  }

  resetPassword(email: string, token: string, newPassword: string) {
    const request: ResetPasswordRequest = { email: email.trim(), token, newPassword };

    return this.http.post<MessageResponse>(`${this.baseUrl}/api/auth/reset-password`, request);
  }

  changePassword(currentPassword: string, newPassword: string) {
    const request: ChangePasswordRequest = { currentPassword, newPassword };

    return this.http.post<void>(`${this.baseUrl}/api/auth/change-password`, request);
  }

  getCurrentUser() {
    return this.http.get<ApiUser>(`${this.baseUrl}/api/users/me`);
  }

  async ensureSession(): Promise<ApiUser | null> {
    if (this.sessionInitialized) {
      return this.currentUser();
    }

    if (!this.sessionCheck) {
      this.sessionCheck = firstValueFrom(this.getCurrentUser())
        .then((user) => {
          this.setCurrentUser(user);
          this.sessionError.set('');
          return user;
        })
        .catch((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.currentUser.set(null);
            this.sessionInitialized = true;
            this.sessionError.set('');
            return null;
          }

          this.sessionError.set('Cannot reach the API. Check the server and network connection.');
          throw error;
        })
        .finally(() => {
          this.sessionCheck = null;
        });
    }

    return this.sessionCheck;
  }

  setCurrentUser(user: ApiUser): void {
    const normalizedUser = this.normalizeUser(user);
    this.currentUser.set(normalizedUser);
    this.sessionInitialized = true;
  }

  setAuthenticatedSession(user: ApiUser): void {
    this.sessionError.set('');
    this.setCurrentUser(user);
  }

  logout() {
    return this.http.post<void>(`${this.baseUrl}/api/auth/logout`, {});
  }

  clearSession(): void {
    this.currentUser.set(null);
    this.sessionError.set('');
    this.sessionInitialized = true;
  }

  private normalizeUser(user: ApiUser & { role?: string }): ApiUser {
    const legacyRole = user.role?.trim();
    return {
      ...user,
      roles: Array.isArray(user.roles) && user.roles.length > 0
        ? user.roles
        : legacyRole
          ? [legacyRole.toLowerCase() === 'admin' ? 'Administrator' : legacyRole]
          : [],
    };
  }
}
