import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export interface ApiUser {
  id: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
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

  readonly token = signal<string | null>(localStorage.getItem(this.tokenKey));
  readonly currentUser = signal<ApiUser | null>(this.restoreUser());

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

  setCurrentUser(user: ApiUser): void {
    const normalizedUser = this.normalizeUser(user);
    localStorage.setItem(this.userKey, JSON.stringify(normalizedUser));
    this.currentUser.set(normalizedUser);
  }

  setAuthenticatedSession(response: AuthResponse): void {
    const user = this.normalizeUser(response.user);
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.token.set(response.token);
    this.currentUser.set(user);
  }

  isAuthenticated(): boolean {
    const token = this.token();
    if (!token) {
      return false;
    }

    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) {
        return false;
      }

      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
      const payload = JSON.parse(atob(padded)) as { exp?: number };
      return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.token.set(null);
    this.currentUser.set(null);
  }

  private restoreUser(): ApiUser | null {
    const user = localStorage.getItem(this.userKey);
    if (!user) {
      return null;
    }

    try {
      return this.normalizeUser(JSON.parse(user) as ApiUser & { role?: string });
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
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
