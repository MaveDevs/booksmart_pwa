import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../services/auth/auth';
import { ConfirmModal } from '../../../shared/confirm-modal/confirm-modal';
import { Theme } from '../../../services/theme/theme';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ConfirmModal],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  showLogoutConfirmModal = false;
  readonly isDarkTheme: Theme['isDarkTheme'];

  constructor(
    private router: Router,
    private authService: Auth,
    private themeService: Theme
  ) {
    this.isDarkTheme = this.themeService.isDarkTheme;
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
    this.authService.removeToken();
    this.authService.removeUser();
    this.router.navigate(['/login']);
  }
}