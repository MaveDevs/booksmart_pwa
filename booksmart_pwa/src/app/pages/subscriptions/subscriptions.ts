import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth/auth';
import { ActiveEstablishmentService } from '../../services/establishments/active-establishment';
import { Establishment, Establishments } from '../../services/establishments/establishments';
import { SubscriptionsService, Subscription } from '../../services/subscriptions/subscriptions';
import { PlansService, Plan } from '../../services/plans/plans';
import { Alert } from '../../shared/alert/alert';
import { CurrentSubscription } from '../../components/current-subscription/current-subscription';
import { PlansList } from '../../components/plans-list/plans-list';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-subscriptions-page',
  standalone: true,
  imports: [CommonModule, RouterLink, Alert, CurrentSubscription, PlansList],
  templateUrl: './subscriptions.html',
  styleUrl: './subscriptions.scss',
})
export class SubscriptionsPage implements OnInit {
  establishments: Establishment[] = [];
  subscriptions: Subscription[] = [];
  plans: Plan[] = [];
  isLoading = true;
  errorMessage = '';
  
  showManageModal = false;
  selectedEstablishmentId: number | null = null;
  selectedEstablishmentName = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private router: Router,
    private authService: Auth,
    private establishmentsService: Establishments,
    private activeEstablishmentService: ActiveEstablishmentService,
    private subscriptionsService: SubscriptionsService,
    private plansService: PlansService,
  ) {}

  ngOnInit(): void {
    this.loadEstablishments();
  }

  goToSubscription(establishmentId: number, establishmentName: string): void {
    this.selectedEstablishmentId = establishmentId;
    this.selectedEstablishmentName = establishmentName;
    this.showManageModal = true;
  }

  closeManageModal(): void {
    this.showManageModal = false;
    this.selectedEstablishmentId = null;
    this.loadEstablishments(); // Refresh summaries when closing
  }

  getCurrentPlanId(establishmentId: number): number | undefined {
    const sub = this.subscriptions.find(s => s.establecimiento_id === establishmentId && s.estado === 'ACTIVA');
    return sub?.plan_id;
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

    const establishments$ = this.establishmentsService.getMyEstablishments(user.usuario_id);
    const subscriptions$ = this.subscriptionsService.getAll();
    const plans$ = this.plansService.getAll();

    forkJoin([establishments$, subscriptions$, plans$])
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ([establishments, subscriptions, plans]) => {
          this.establishments = Array.isArray(establishments) ? establishments : [];
          this.subscriptions = Array.isArray(subscriptions) ? subscriptions : [];
          this.plans = Array.isArray(plans) ? plans : [];
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.detail || 'No se pudo cargar la información de suscripciones.';
        },
      });
  }

  getPlanName(establishmentId: number): string {
    const subscription = this.subscriptions.find(
      (s) => s.establecimiento_id === establishmentId && s.estado === 'ACTIVA'
    );
    if (!subscription) return 'Sin plan activo';

    const plan = this.plans.find((p) => p.plan_id === subscription.plan_id);
    return plan ? plan.nombre : 'Plan desconocido';
  }

  getPlanBadgeClass(establishmentId: number): string {
    const subscription = this.subscriptions.find(
      (s) => s.establecimiento_id === establishmentId && s.estado === 'ACTIVA'
    );
    if (!subscription) return 'inactive';
    
    const plan = this.plans.find((p) => p.plan_id === subscription.plan_id);
    if (!plan) return 'inactive';

    const nombre = plan.nombre.toLowerCase();
    if (nombre.includes('premium') || nombre.includes('pro')) return 'premium';
    if (nombre.includes('free') || nombre.includes('gratis')) return 'free';
    return 'active';
  }

  trackByEstablishmentId(index: number, establishment: Establishment): number {
    return establishment.establecimiento_id;
  }

  isPremium(establishmentId: number): boolean {
    const classType = this.getPlanBadgeClass(establishmentId);
    return classType === 'premium';
  }
}
