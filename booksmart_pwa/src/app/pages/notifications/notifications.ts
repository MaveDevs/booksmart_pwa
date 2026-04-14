import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { first, timeout, catchError, of, Subscription, from, map } from 'rxjs';

import { Alert } from '../../shared/alert/alert';
import { NotificationsService, AppNotification } from '../../services/notifications/notifications';
import { PushSubscriptionsService } from '../../services/push-subscriptions/push-subscriptions';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, Alert],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class NotificationsPage implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  isLoading = true;
  isRegisteringPush = false;
  isSubscribed = false;
  isCheckingSubscription = true;
  errorMessage = '';
  successMessage = '';

  private subCheck?: Subscription;

  private readonly notificationsService = inject(NotificationsService);
  private readonly pushSubscriptionsService = inject(PushSubscriptionsService);
  private readonly cdr = inject(ChangeDetectorRef);

  get canEnablePushNotifications(): boolean {
    return this.pushSubscriptionsService.isBrowserPushSupported();
  }

  get pushSupportHint(): string {
    return this.pushSubscriptionsService.getUnsupportedReason();
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.checkSubscriptionStatus();
  }

  ngOnDestroy(): void {
    this.subCheck?.unsubscribe();
  }

  checkSubscriptionStatus(): void {
    console.log('[Notifications] Iniciando verificación de suscripción...');
    
    if (!this.pushSubscriptionsService.isBrowserPushSupported()) {
      console.warn('[Notifications] Push no soportado:', this.pushSubscriptionsService.getUnsupportedReason());
      this.isCheckingSubscription = false;
      this.isSubscribed = false;
      return;
    }

    // Consultamos al SW usando la API nativa para ser más robustos que SwPush en el arranque
    const nativeSub$ = from(navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription()));

    this.subCheck = nativeSub$
      .pipe(
        timeout(5000), 
        catchError((err) => {
          console.warn('[Notifications] Timeout o error consultando suscripción nativa:', err);
          return of(null);
        }),
        first()
      )
      .subscribe({
        next: (sub) => {
          console.log('[Notifications] Resultado final de suscripción:', sub ? 'Existe' : 'No existe (null)');
          this.isSubscribed = !!sub;
          this.isCheckingSubscription = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isCheckingSubscription = false;
          this.cdr.markForCheck();
        }
      });
  }

  get unreadCount(): number {
    return this.notifications.filter((notification) => !notification.leida).length;
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.notificationsService.loadMine().subscribe({
      next: (notifications) => {
        this.notifications = [...notifications].sort(
          (left, right) => new Date(right.fecha_envio).getTime() - new Date(left.fecha_envio).getTime(),
        );
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.detail || 'No se pudieron cargar tus notificaciones.';
        this.isLoading = false;
      },
    });
  }

  markAsRead(notification: AppNotification): void {
    if (notification.leida) {
      return;
    }

    this.notificationsService.markAsRead(notification.notificacion_id).subscribe({
      next: () => {
        this.successMessage = 'Notificación marcada como leída.';
        this.notificationsService.refreshUnreadCount().subscribe();
        this.loadNotifications();
      },
      error: (error) => {
        this.errorMessage = error?.error?.detail || 'No se pudo actualizar la notificación.';
      },
    });
  }

  async enablePushNotifications(): Promise<void> {
    this.isRegisteringPush = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.pushSubscriptionsService.registerCurrentDevice();
      this.successMessage = 'Notificaciones push activadas en este dispositivo.';
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'No se pudieron activar las notificaciones push.';
    } finally {
      this.isRegisteringPush = false;
    }
  }

  trackByNotificationId(_: number, notification: AppNotification): number {
    return notification.notificacion_id;
  }
}