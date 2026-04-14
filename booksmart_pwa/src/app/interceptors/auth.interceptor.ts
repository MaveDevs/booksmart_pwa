import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../services/auth/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(Auth);
  
  const token = localStorage.getItem('access_token');
  let request = req;

  if (token) {
    request = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el servidor responde 401 (Prohibido/Token vencido)
      if (error.status === 401) {
        auth.logout(); // Limpiamos el storage local
        router.navigate(['/login']); // Redirigimos al login
      }
      return throwError(() => error);
    })
  );
};
