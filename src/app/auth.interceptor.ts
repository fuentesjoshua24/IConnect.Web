import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const apiBaseUrl = environment.apiUrl.replace(/\/$/, '');
  const apiPrefix = `${apiBaseUrl}/api/`;

  if (!token || !request.url.startsWith(apiPrefix)) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
