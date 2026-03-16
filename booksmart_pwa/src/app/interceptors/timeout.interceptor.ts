import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { TimeoutError, catchError, throwError, timeout } from 'rxjs';

const REQUEST_TIMEOUT_MS = 15000;

export const timeoutInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  return next(req).pipe(
    timeout(REQUEST_TIMEOUT_MS),
    catchError((error: unknown) => {
      if (error instanceof TimeoutError) {
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 408,
              statusText: 'Request Timeout',
              url: req.urlWithParams,
              error: {
                detail: 'La solicitud tardó demasiado en responder. Intenta nuevamente.',
              },
            })
        );
      }

      return throwError(() => error);
    })
  );
};