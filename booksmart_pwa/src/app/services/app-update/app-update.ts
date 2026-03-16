import { Injectable, inject } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppUpdate {
  private swUpdate = inject(SwUpdate);

  readonly isUpdateAvailable$ = this.swUpdate.versionUpdates.pipe(
    filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY')
  );

  get isEnabled(): boolean {
    return this.swUpdate.isEnabled;
  }

  checkForUpdate(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate();
    }
  }

  activateUpdate(): Promise<boolean> {
    return this.swUpdate.activateUpdate();
  }
}
