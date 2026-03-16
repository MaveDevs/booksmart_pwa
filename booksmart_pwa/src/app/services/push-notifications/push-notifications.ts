import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotifications {
  private swPush = inject(SwPush);
  private http = inject(HttpClient);

  get isEnabled(): boolean {
    return this.swPush.isEnabled;
  }

  /** Solicita permiso al usuario y registra la suscripción en el backend. */
  subscribeAndRegister(): Promise<void> {
    if (!this.swPush.isEnabled) {
      return Promise.resolve();
    }

    return this.swPush
      .requestSubscription({ serverPublicKey: environment.vapidPublicKey })
      .then(subscription => {
        this.http
          .post(`${environment.apiUrl}/api/v1/push-subscriptions/`, subscription.toJSON())
          .subscribe();
      })
      .catch(err => {
        // El usuario denegó el permiso o el navegador no lo soporta; no es error fatal.
        console.warn('[Push] Suscripción no disponible:', err);
      });
  }

  /** Elimina la suscripción del usuario (logout). */
  unsubscribe(): void {
    this.swPush.unsubscribe().catch(() => {});
  }

  /** Escucha mensajes push recibidos mientras la app está abierta. */
  get messages$() {
    return this.swPush.messages;
  }

  /** Escucha cuando el usuario hace clic en la notificación. */
  get notificationClicks$() {
    return this.swPush.notificationClicks;
  }
}
