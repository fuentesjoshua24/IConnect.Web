import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const apiBaseUrl = environment.apiUrl.replace(/\/$/, '');
  const apiPrefix = `${apiBaseUrl}/api/`;

  if (!request.url.startsWith(apiPrefix)) {
    return next(request);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const isPublicAuthRequest = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
  ].some((path) => request.url.endsWith(path));

  return next(request.clone({ withCredentials: true })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isPublicAuthRequest) {
        auth.clearSession();
        void router.navigate(['/login'], { replaceUrl: true });
      }

      return throwError(() => error);
    }),
  );
};
