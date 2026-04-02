import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Api } from '../api';

export interface PushSubscriptionRecord {
  id: number;
  usuario_id: number;
  endpoint: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class PushSubscriptionsService {
  private readonly basePath = '/api/v1/push-subscriptions';

  constructor(
    private api: Api,
    private swPush: SwPush,
  ) {}

  getMine(): Observable<PushSubscriptionRecord[]> {
    return this.api.get<PushSubscriptionRecord[]>(this.basePath);
  }

  async registerCurrentDevice(): Promise<PushSubscriptionRecord> {
    if (!this.swPush.isEnabled) {
      throw new Error('Las notificaciones push no están disponibles en este entorno.');
    }

    if (!environment.vapidPublicKey) {
      throw new Error('Falta configurar la VAPID public key en environment.ts.');
    }

    if (typeof Notification === 'undefined') {
      throw new Error('Tu navegador no soporta notificaciones push.');
    }

    if (Notification.permission === 'denied') {
      throw new Error('Las notificaciones están bloqueadas en el navegador.');
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('No se concedió permiso para notificaciones.');
      }
    }

    const subscription = await this.swPush.requestSubscription({
      serverPublicKey: environment.vapidPublicKey,
    });

    return firstValueFrom(
      this.api.post<PushSubscriptionRecord>(this.basePath, subscription.toJSON()),
    );
  }

  removeSubscription(endpoint: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}?endpoint=${encodeURIComponent(endpoint)}`);
  }
}