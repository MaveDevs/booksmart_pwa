import { Component, OnInit, Input, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, SubscriptionsService } from '../../services/subscriptions/subscriptions';
import { Plan, PlansService } from '../../services/plans/plans';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-current-subscription',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './current-subscription.html',
  styleUrl: './current-subscription.scss',
})
export class CurrentSubscription implements OnInit {
  @Input() establishmentId!: number;

  subscription: Subscription | null = null;
  plan: Plan | null = null;
  isLoading = false;
  errorMessage = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private subscriptionsService: SubscriptionsService,
    private plansService: PlansService,
  ) {}

  ngOnInit(): void {
    this.loadSubscription();
  }

  private loadSubscription(): void {
    this.isLoading = true;
    this.subscriptionsService.getByEstablishment(this.establishmentId)
      .pipe(finalize(() => { this.isLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (subscriptions) => {
          // Get the first active subscription
          this.subscription = subscriptions.find(s => s.estado === 'ACTIVA') || subscriptions[0] || null;
          if (this.subscription) {
            this.loadPlan(this.subscription.plan_id);
          }
        },
        error: () => {
          this.errorMessage = 'No se pudo cargar la suscripción.';
        },
      });
  }

  private loadPlan(planId: number): void {
    this.plansService.getById(planId)
      .pipe(finalize(() => { this.cdr.markForCheck(); }))
      .subscribe({
        next: (plan) => {
          this.plan = plan;
        },
        error: () => {
          this.plan = null;
        },
      });
  }

  getStatusBadgeClass(): string {
    if (!this.subscription) return '';
    switch (this.subscription.estado) {
      case 'ACTIVA':
        return 'badge-active';
      case 'CANCELADA':
        return 'badge-cancelled';
      case 'EXPIRADA':
        return 'badge-expired';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVA':
        return 'Activa';
      case 'CANCELADA':
        return 'Cancelada';
      case 'EXPIRADA':
        return 'Expirada';
      default:
        return status;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  getPriceFormatted(price: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
  }

  daysUntilExpiration(): number | null {
    if (!this.subscription || !this.subscription.fecha_fin) return null;
    const today = new Date();
    const endDate = new Date(this.subscription.fecha_fin);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}
