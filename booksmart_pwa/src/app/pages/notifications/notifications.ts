import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

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
export class NotificationsPage implements OnInit {
  notifications: AppNotification[] = [];
  isLoading = true;
  isRegisteringPush = false;
  errorMessage = '';
  successMessage = '';

  private readonly notificationsService = inject(NotificationsService);
  private readonly pushSubscriptionsService = inject(PushSubscriptionsService);

  get canEnablePushNotifications(): boolean {
    return this.pushSubscriptionsService.isBrowserPushSupported();
  }

  get pushSupportHint(): string {
    return this.pushSubscriptionsService.getUnsupportedReason();
  }

  ngOnInit(): void {
    this.loadNotifications();
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