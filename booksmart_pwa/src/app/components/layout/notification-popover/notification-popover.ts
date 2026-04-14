import { Component, OnInit, inject, Input, Output, EventEmitter, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationsService, AppNotification } from '../../../services/notifications/notifications';
import { PushSubscriptionsService } from '../../../services/push-subscriptions/push-subscriptions';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-notification-popover',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notification-popover.html',
  styleUrl: './notification-popover.scss'
})
export class NotificationPopover implements OnInit, OnChanges {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();

  notifications: AppNotification[] = [];
  isLoading = false;
  isPushEnabled = false;
  isTogglingPush = false;

  private notificationsService = inject(NotificationsService);
  private pushService = inject(PushSubscriptionsService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.checkPushStatus();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['show']?.currentValue === true) {
      this.loadData();
    }
  }

  async loadData() {
    this.isLoading = true;
    this.notificationsService.getMine().subscribe({
      next: (data) => {
        this.notifications = data
          .sort((a, b) => new Date(b.fecha_envio).getTime() - new Date(a.fecha_envio).getTime())
          .slice(0, 5);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  async checkPushStatus() {
    if (!this.pushService.isBrowserPushSupported()) {
      this.isPushEnabled = false;
      return;
    }
    const sub = await firstValueFrom(this.pushService.getCurrentSubscription());
    this.isPushEnabled = !!sub;
    this.cdr.detectChanges();
  }

  async togglePush(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.isTogglingPush = true;
    this.cdr.detectChanges();

    try {
      if (checked) {
        await this.pushService.registerCurrentDevice();
      } else {
        await this.pushService.unregisterCurrentDevice();
      }
      this.isPushEnabled = checked;
    } catch (err) {
      console.error('Error toggling push:', err);
      // Revertir el estado del input visualmente
      (event.target as HTMLInputElement).checked = !checked;
      this.isPushEnabled = !checked;
    } finally {
      this.isTogglingPush = false;
      this.cdr.detectChanges();
    }
  }

  markAsRead(notification: AppNotification) {
    if (notification.leida) return;
    
    this.notificationsService.markAsRead(notification.notificacion_id).subscribe(() => {
      notification.leida = true;
      this.notificationsService.refreshUnreadCount().subscribe();
      this.cdr.detectChanges();
    });
  }

  onClose() {
    this.close.emit();
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
