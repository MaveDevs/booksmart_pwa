import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, timeout, catchError, of } from 'rxjs';

import { Api } from '../api';
import { RealtimeService, RealtimeNotificationEvent } from '../realtime/realtime';

export type AppNotificationType = 'INFO' | 'ALERTA' | 'RECORDATORIO';

export interface AppNotification {
  notificacion_id: number;
  usuario_id: number;
  mensaje: string;
  tipo: AppNotificationType;
  leida: boolean;
  fecha_envio: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly basePath = '/api/v1/notifications';
  private readonly unreadCountSubject = new BehaviorSubject<number>(0);

  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private api: Api,
    private realtimeService: RealtimeService,
  ) {
    this.realtimeService.events$.subscribe((event) => {
      if (event.type !== 'notification') {
        return;
      }

      const notificationEvent = event as RealtimeNotificationEvent;
      if (!notificationEvent.data.leida) {
        this.incrementUnreadCount();
      }
    });
  }

  getMine(): Observable<AppNotification[]> {
    return this.api.get<AppNotification[]>(`${this.basePath}/me`);
  }

  loadMine(): Observable<AppNotification[]> {
    return this.getMine().pipe(
      tap((notifications) => {
        this.unreadCountSubject.next(notifications.filter((notification) => !notification.leida).length);
      }),
    );
  }

  refreshUnreadCount(): Observable<number> {
    return this.getMine().pipe(
      timeout(5000),
      map((notifications) => notifications.filter((notification) => !notification.leida).length),
      tap((count) => this.unreadCountSubject.next(count)),
      catchError((err) => {
        console.warn('[NotificationsService] Error refreshing unread count:', err);
        // No actualizamos el subject para mantener el último valor conocido o 0
        return of(this.unreadCountSubject.value);
      }),
    );
  }

  markAsRead(notificationId: number): Observable<AppNotification> {
    return this.api.patch<AppNotification>(`${this.basePath}/${notificationId}`, { leida: true });
  }

  resetState(): void {
    this.unreadCountSubject.next(0);
  }

  private incrementUnreadCount(): void {
    this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
  }
}