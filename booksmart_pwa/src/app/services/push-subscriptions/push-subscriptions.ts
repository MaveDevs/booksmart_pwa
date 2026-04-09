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

  isBrowserPushSupported(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    if (!window.isSecureContext) {
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      return false;
    }

    if (!('PushManager' in window)) {
      return false;
    }

    if (typeof Notification === 'undefined') {
      return false;
    }

    if (!this.swPush.isEnabled) {
      return false;
    }

    return true;
  }

  getUnsupportedReason(): string {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'Las notificaciones push no están disponibles fuera del navegador.';
    }

    if (!window.isSecureContext) {
      return 'Las notificaciones push requieren HTTPS.';
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('chromium') && !userAgent.includes('edg');

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return isSafari
        ? 'Safari no soporta Web Push en esta plataforma.'
        : 'Tu navegador no soporta Service Workers o Web Push.';
    }

    if (typeof Notification === 'undefined') {
      return 'Tu navegador no soporta notificaciones.';
    }

    if (!this.swPush.isEnabled) {
      return 'Service Worker desactivado en este build. Prueba en produccion (HTTPS) o habilita SW para pruebas.';
    }

    return 'Las notificaciones push no están disponibles en este entorno.';
  }

  async registerCurrentDevice(): Promise<PushSubscriptionRecord> {
    if (!this.isBrowserPushSupported()) {
      throw new Error(this.getUnsupportedReason());
    }

    if (!environment.vapidPublicKey) {
      throw new Error('Falta configurar la VAPID public key en environment.ts.');
    }

    if (!this.swPush.isEnabled) {
      throw new Error('Service Worker no habilitado. En desarrollo, compila/ejecuta en modo production para probar push.');
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

    await navigator.serviceWorker.ready;

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