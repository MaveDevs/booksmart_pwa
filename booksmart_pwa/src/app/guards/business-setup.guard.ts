import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { Auth } from '../services/auth/auth';
import { Establishments } from '../services/establishments/establishments';

export const businessSetupGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const establishmentsService = inject(Establishments);
  const router = inject(Router);

  const user = authService.getUser();
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  return establishmentsService.getMyEstablishments(user.usuario_id).pipe(
    map(establishments => {
      if (establishments.length === 0) {
        return router.createUrlTree(['/setup/establishment']);
      }
      return true;
    }),
    catchError(() => {
      return of(router.createUrlTree(['/setup/establishment']));
    })
  );
};
