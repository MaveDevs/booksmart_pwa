import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth/auth';
import { Establishment, Establishments } from '../../services/establishments/establishments';
import { Alert } from '../../shared/alert/alert';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, Alert],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  establishments: Establishment[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private authService: Auth,
    private establishmentsService: Establishments
  ) {}

  ngOnInit(): void {
    this.loadEstablishments();
  }

  retryLoad(): void {
    this.loadEstablishments();
  }

  private loadEstablishments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const user = this.authService.getUser();
    if (!user) {
      this.errorMessage = 'No se encontró sesión activa.';
      this.isLoading = false;
      return;
    }

    this.establishmentsService
      .getMyEstablishments(user.usuario_id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (establishments) => {
          this.establishments = Array.isArray(establishments) ? establishments : [];
        },
        error: (error) => {
          if (error?.status === 408) {
            this.errorMessage = 'El servidor tardó demasiado en responder. Verifica tu conexión e inténtalo de nuevo.';
            return;
          }

          this.errorMessage =
            error?.error?.detail || 'No se pudieron cargar tus establecimientos.';
        },
      });
  }

  trackByEstablishmentId(index: number, establishment: Establishment): number {
    return establishment.establecimiento_id;
  }

}
