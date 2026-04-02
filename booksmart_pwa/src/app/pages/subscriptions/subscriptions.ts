import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth/auth';
import { Establishment, Establishments } from '../../services/establishments/establishments';
import { Alert } from '../../shared/alert/alert';

@Component({
  selector: 'app-subscriptions-page',
  standalone: true,
  imports: [CommonModule, RouterLink, Alert],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.scss',
})
export class SubscriptionsPage implements OnInit {
  establishments: Establishment[] = [];
  isLoading = true;
  errorMessage = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private router: Router,
    private authService: Auth,
    private establishmentsService: Establishments,
  ) {}

  ngOnInit(): void {
    this.loadEstablishments();
  }

  goToSubscription(establishmentId: number): void {
    this.router.navigate(['/app/negocio', establishmentId], {
      queryParams: { tab: 'suscripcion' },
    });
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
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (establishments) => {
          this.establishments = Array.isArray(establishments) ? establishments : [];
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.detail || 'No se pudieron cargar tus establecimientos.';
        },
      });
  }

  trackByEstablishmentId(index: number, establishment: Establishment): number {
    return establishment.establecimiento_id;
  }
}
