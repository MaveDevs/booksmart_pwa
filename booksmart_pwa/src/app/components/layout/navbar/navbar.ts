import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../services/auth/auth';
import { ConfirmModal } from '../../../shared/confirm-modal/confirm-modal';
import { Theme } from '../../../services/theme/theme';
import { NotificationsService } from '../../../services/notifications/notifications';
import { RealtimeService } from '../../../services/realtime/realtime';

import { NotificationPopover } from '../notification-popover/notification-popover';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ConfirmModal, NotificationPopover],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit, OnDestroy {
  showLogoutConfirmModal = false;
  readonly isDarkTheme: Theme['isDarkTheme'];
  unreadNotificationsCount = 0;
  showNotificationsPopover = false;

  constructor(
    private router: Router,
    private authService: Auth,
    private themeService: Theme,
    private notificationsService: NotificationsService,
    private realtimeService: RealtimeService,
    private cdr: ChangeDetectorRef,
  ) {
    this.isDarkTheme = this.themeService.isDarkTheme;
  }

  get isOwner(): boolean {
    return this.authService.isOwner();
  }

  ngOnInit(): void {
    this.realtimeService.connect(this.authService.getToken());
    
    // Cargamos el conteo inicial con un pequeño retraso para asegurar que los componentes estén listos
    this.notificationsService.refreshUnreadCount().subscribe({
      error: (err) => console.warn('[Navbar] No se pudo refrescar el conteo inicial:', err)
    });

    this.notificationsService.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
      // Forzamos actualización por si el evento vino fuera de la zona de Angular (ej: websockets)
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.realtimeService.disconnect();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleNotificationsPopover(): void {
    this.showNotificationsPopover = !this.showNotificationsPopover;
  }

  requestLogout(): void {
    this.showLogoutConfirmModal = true;
  }

  cancelLogout(): void {
    this.showLogoutConfirmModal = false;
  }

  confirmLogout(): void {
    this.showLogoutConfirmModal = false;
    this.realtimeService.disconnect();
    this.notificationsService.resetState();
    this.authService.removeToken();
    this.authService.removeUser();
    this.router.navigate(['/login']);
  }
}