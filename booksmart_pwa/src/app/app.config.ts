import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { provideRouter, Router, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { timeoutInterceptor } from './interceptors/timeout.interceptor';
import * as Sentry from "@sentry/angular";

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([authInterceptor, timeoutInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: true,
      registrationStrategy: 'registerImmediately'
    }),
    // --- Configuración de Sentry ---
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: false,
      }),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ]
};