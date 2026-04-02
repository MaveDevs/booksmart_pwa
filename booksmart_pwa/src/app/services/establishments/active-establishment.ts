import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ActiveEstablishmentService {
  private readonly storageKey = 'booksmart_active_establishment_id';

  setEstablishmentId(id: number): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, String(id));
  }

  getEstablishmentId(): number | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const rawValue = localStorage.getItem(this.storageKey);
    if (!rawValue) {
      return null;
    }

    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  clear(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(this.storageKey);
  }
}