import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Theme } from './services/theme/theme';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'booksmart_pwa';

  constructor(private themeService: Theme) {
    this.themeService.initializeTheme();
  }
}