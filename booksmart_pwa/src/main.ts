import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from "@sentry/angular";
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Reemplaza el DSN con el que te dio tu dashboard de Sentry
Sentry.init({
  dsn: "https://86878bb2a33bd8f0f46d147c5b21d505@o4510971416608768.ingest.us.sentry.io/4510971980808192", 
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Captura el 100% de las transacciones de rendimiento
  tracesSampleRate: 1.0,
  // Ajustes para la grabación de sesiones (Replay)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));