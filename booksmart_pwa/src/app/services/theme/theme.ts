import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class Theme {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'booksmart_theme';

  readonly isDarkTheme = signal(false);

  initializeTheme(): void {
    const stored = this.readStoredTheme();
    const theme = stored ?? this.getPreferredTheme();
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    const nextTheme: AppTheme = this.isDarkTheme() ? 'light' : 'dark';
    this.applyTheme(nextTheme);
  }

  private applyTheme(theme: AppTheme): void {
    this.isDarkTheme.set(theme === 'dark');
    this.document.documentElement.setAttribute('data-theme', theme);

    try {
      localStorage.setItem(this.storageKey, theme);
    } catch {
      return;
    }
  }

  private getPreferredTheme(): AppTheme {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  private readStoredTheme(): AppTheme | null {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved === 'dark' || saved === 'light' ? saved : null;
    } catch {
      return null;
    }
  }
}
