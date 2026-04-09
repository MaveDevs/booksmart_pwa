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
  private readonly basePath = '/api/v1/push-subscriptions/';

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
    console.log('[PushService] Registrando dispositivo...');
    console.log('[PushService] VAPID Public Key:', environment.vapidPublicKey);
    console.log('[PushService] SwPush habilitado:', this.swPush.isEnabled);

    if (!this.isBrowserPushSupported()) {
      const reason = this.getUnsupportedReason();
      console.error('[PushService] Browser no soportado:', reason);
      throw new Error(reason);
    }

    if (!environment.vapidPublicKey) {
      console.error('[PushService] Falta VAPID key');
      throw new Error('Falta configurar la VAPID public key en environment.ts.');
    }

    const permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    console.log('[PushService] Estado de permiso:', permission);

    if (permission === 'denied') {
      console.error('[PushService] Permiso denegado');
      throw new Error('Las notificaciones están bloqueadas en el navegador.');
    }

    if (permission !== 'granted') {
      console.log('[PushService] Solicitando permiso...');
      const requestedPermission = await Notification.requestPermission();
      console.log('[PushService] Resultado solicitud permiso:', requestedPermission);
      if (requestedPermission !== 'granted') {
        throw new Error('No se concedió permiso para notificaciones.');
      }
    }

    try {
      console.log('[PushService] Esperando Service Worker Ready...');
      const registration = await navigator.serviceWorker.ready;
      console.log('[PushService] Service Worker listo:', registration.scope);

      console.log('[PushService] Solicitando suscripción al Push Service del navegador...');
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey,
      });
      console.log('[PushService] Suscripción obtenida con éxito:', subscription.endpoint);

      console.log('[PushService] Enviando suscripción al servidor backend...');
      return firstValueFrom(
        this.api.post<PushSubscriptionRecord>(this.basePath, subscription.toJSON()),
      );
    } catch (err) {
      console.error('[PushService] Error crítico durante la suscripción:', err);
      throw err;
    }
  }

  removeSubscription(endpoint: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}?endpoint=${encodeURIComponent(endpoint)}`);
  }

  getCurrentSubscription(): Observable<PushSubscription | null> {
    return this.swPush.subscription;
  }
}