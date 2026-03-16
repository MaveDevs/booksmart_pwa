import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { Auth } from '../services/auth/auth';
import { Establishments } from '../services/establishments/establishments';

// Cache the guard result for the duration of the session.
// Cleared when the user logs out (token is removed from localStorage).
let guardCache: boolean | null = null;

export function clearBusinessSetupGuardCache(): void {
  guardCache = null;
}

export const businessSetupGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const establishmentsService = inject(Establishments);
  const router = inject(Router);

  const user = authService.getUser();
  if (!user) {
    guardCache = null;
    return router.createUrlTree(['/login']);
  }

  // Return cached result to avoid an HTTP call on every child-route navigation.
  if (guardCache !== null) {
    return guardCache ? true : router.createUrlTree(['/setup/establishment']);
  }

  return establishmentsService.getMyEstablishments(user.usuario_id).pipe(
    map(establishments => {
      if (establishments.length === 0) {
        guardCache = false;
        return router.createUrlTree(['/setup/establishment']);
      }
      guardCache = true;
      return true;
    }),
    catchError(() => {
      guardCache = null;
      return of(router.createUrlTree(['/setup/establishment']));
    })
  );
};
