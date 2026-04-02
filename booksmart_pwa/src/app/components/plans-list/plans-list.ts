import { Component, OnInit, Input, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Plan, PlansService } from '../../services/plans/plans';
import { Subscription, SubscriptionsService, CreateSubscriptionRequest } from '../../services/subscriptions/subscriptions';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-plans-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plans-list.html',
  styleUrl: './plans-list.scss',
})
export class PlansList implements OnInit {
  @Input() establishmentId!: number;
  @Input() currentSubscriptionPlanId?: number;

  plans: Plan[] = [];
  isLoading = false;
  isSelectingPlan = false;
  selectedPlanId: number | null = null;
  errorMessage = '';
  successMessage = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private plansService: PlansService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  private loadPlans(): void {
    this.isLoading = true;
    this.plansService.getAll()
      .pipe(finalize(() => { this.isLoading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (plans) => {
          this.plans = plans.filter(p => p.activo);
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar los planes.';
        },
      });
  }

  selectPlan(planId: number): void {
    this.selectedPlanId = planId;
  }

  confirmSelectPlan(planId: number): void {
    if (!this.establishmentId) {
      this.errorMessage = 'ID de negocio no válido.';
      return;
    }

    this.isSelectingPlan = true;
    this.clearMessages();

    const today = new Date().toISOString().split('T')[0];
    const subscription: CreateSubscriptionRequest = {
      establecimiento_id: this.establishmentId,
      plan_id: planId,
      fecha_inicio: today,
      estado: 'ACTIVA',
    };

    this.subscriptionsService.create(subscription)
      .pipe(finalize(() => { this.isSelectingPlan = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          this.successMessage = 'Plan seleccionado correctamente.';
          this.selectedPlanId = null;
          this.currentSubscriptionPlanId = planId;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.errorMessage = err?.error?.detail || 'No se pudo cambiar el plan.';
          this.cdr.markForCheck();
        },
      });
  }

  cancelSelectPlan(): void {
    this.selectedPlanId = null;
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  getPriceFormatted(price: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
  }
}
