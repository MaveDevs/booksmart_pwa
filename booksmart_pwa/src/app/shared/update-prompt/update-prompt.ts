import { Component, OnInit, inject, signal } from '@angular/core';
import { AppUpdate } from '../../services/app-update/app-update';

@Component({
  selector: 'app-update-prompt',
  standalone: true,
  templateUrl: './update-prompt.html',
  styleUrl: './update-prompt.scss'
})
export class UpdatePrompt implements OnInit {
  private appUpdate = inject(AppUpdate);

  show = signal(false);
  isReloading = signal(false);

  ngOnInit(): void {
    this.appUpdate.isUpdateAvailable$.subscribe(() => {
      this.show.set(true);
    });
  }

  reload(): void {
    this.isReloading.set(true);
    this.appUpdate.activateUpdate().then(() => window.location.reload());
  }

  dismiss(): void {
    this.show.set(false);
  }
}
