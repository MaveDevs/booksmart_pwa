import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Theme } from './services/theme/theme';
import { AppUpdate } from './services/app-update/app-update';
import { PushNotifications } from './services/push-notifications/push-notifications';
import { UpdatePrompt } from './shared/update-prompt/update-prompt';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, UpdatePrompt],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'booksmart_pwa';

  private themeService = inject(Theme);
  private appUpdate = inject(AppUpdate);
  readonly pushNotifications = inject(PushNotifications);
  private router = inject(Router);

  constructor() {
    this.themeService.initializeTheme();
  }

  ngOnInit(): void {
    // Verificar actualizaciones cada 6 horas
    this.appUpdate.checkForUpdate();
    setInterval(() => this.appUpdate.checkForUpdate(), 6 * 60 * 60 * 1000);

    // Al hacer clic en una notificación push, navegar a la ruta indicada
    this.pushNotifications.notificationClicks$.subscribe(({ action, notification }) => {
      const url = (notification.data as any)?.url;
      if (url) {
        this.router.navigateByUrl(url);
      }
    });
  }
}