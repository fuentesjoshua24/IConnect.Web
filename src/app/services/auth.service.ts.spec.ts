import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('sends login credentials to the API contract', () => {
    service.login('  admin@example.com ', 'secret').subscribe();

    const request = http.expectOne('http://localhost:5000/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'admin@example.com', password: 'secret' });
    request.flush({ token: 'token', expiresAt: '2026-01-01T00:00:00Z', user: {
      id: 'user-id',
      email: 'admin@example.com',
      roles: ['Administrator'],
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
    } });
  });

  it('requests the signed-in user from the authenticated profile endpoint', () => {
    service.getCurrentUser().subscribe();

    const request = http.expectOne('http://localhost:5000/api/users/me');
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'user-id',
      email: 'admin@example.com',
      roles: ['Administrator'],
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
    });
  });

  it('uses the reset and change password endpoints and request shapes', () => {
    service.resetPassword(' admin@example.com ', 'reset-token', 'new-password').subscribe();
    const reset = http.expectOne('http://localhost:5000/api/auth/reset-password');
    expect(reset.request.body).toEqual({
      email: 'admin@example.com',
      token: 'reset-token',
      newPassword: 'new-password',
    });
    reset.flush({ message: 'Password reset successful.' });

    service.changePassword('old-password', 'new-password').subscribe();
    const change = http.expectOne('http://localhost:5000/api/auth/change-password');
    expect(change.request.body).toEqual({
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
    change.flush(null);
  });
});
