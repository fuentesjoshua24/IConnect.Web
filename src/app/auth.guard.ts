import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';


export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureSession().then((user) => {
    if (user) {
      return true;
    }

    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }).catch(() => router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url, apiUnavailable: 'true' },
  }));
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureSession()
    .then((user) => user ? router.createUrlTree(['/dashboard']) : true)
    .catch(() => true);
};
