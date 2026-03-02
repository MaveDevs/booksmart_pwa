import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = 'booksmart_pwa';

  ngOnInit() {
    // Esta línea forzará un error visible en tu dashboard de Sentry
    // Borra esta línea después de verificar que el error llegó a Sentry.io
    console.log("Enviando prueba a Sentry...");
    throw new Error("Sentry Test Error: Booksmart PWA is connected!");
  }
}