import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../services/auth/auth';
import { ConfirmModal } from '../../../shared/confirm-modal/confirm-modal';
import { Theme } from '../../../services/theme/theme';
import { NotificationsService } from '../../../services/notifications/notifications';
import { RealtimeService } from '../../../services/realtime/realtime';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ConfirmModal],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit, OnDestroy {
  showLogoutConfirmModal = false;
  readonly isDarkTheme: Theme['isDarkTheme'];
  unreadNotificationsCount = 0;

  constructor(
    private router: Router,
    private authService: Auth,
    private themeService: Theme,
    private notificationsService: NotificationsService,
    private realtimeService: RealtimeService,
  ) {
    this.isDarkTheme = this.themeService.isDarkTheme;
  }

  get isOwner(): boolean {
    return this.authService.isOwner();
  }

  ngOnInit(): void {
    this.realtimeService.connect(this.authService.getToken());
    this.notificationsService.refreshUnreadCount().subscribe();
    this.notificationsService.unreadCount$.subscribe((count) => {
      this.unreadNotificationsCount = count;
    });
  }

  ngOnDestroy(): void {
    this.realtimeService.disconnect();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
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