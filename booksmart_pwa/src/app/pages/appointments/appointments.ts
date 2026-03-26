import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth/auth';
import { Establishment, Establishments } from '../../services/establishments/establishments';
import { BusinessService, BusinessServices } from '../../services/business-services/business-services';
import { Appointment, Appointments } from '../../services/appointments/appointments';
import { Alert } from '../../shared/alert/alert';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';

@Component({
  selector: 'app-appointments',
  imports: [CommonModule, FormsModule, Alert, ConfirmModal],
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss',
})
export class AppointmentsPage implements OnInit {
  establishments: Establishment[] = [];
  selectedEstablishmentId: number | null = null;
  services: BusinessService[] = [];
  appointments: Appointment[] = [];

  isLoadingEstablishments = true;
  isLoadingAppointments = false;
  isProcessing = false;
  errorMessage = '';
  successMessage = '';

  showDeclineModal = false;
  pendingDeclineId: number | null = null;

  rescheduleId: number | null = null;
  rescheduleData = { hora_inicio: '', hora_fin: '' };

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private authService: Auth,
    private establishmentsService: Establishments,
    private businessServicesApi: BusinessServices,
    private appointmentsService: Appointments
  ) {}

  ngOnInit(): void {
    this.loadEstablishments();
  }

  onEstablishmentChange(value: string): void {
    this.selectedEstablishmentId = Number(value);
    this.loadAppointmentsForEstablishment();
  }

  acceptAppointment(id: number): void {
    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentsService.accept(id).subscribe({
      next: () => {
        this.successMessage = 'Cita confirmada exitosamente.';
        this.isProcessing = false;
        this.cdr.markForCheck();
        this.loadAppointmentsForEstablishment();
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || 'No se pudo aceptar la cita.';
        this.isProcessing = false;
        this.cdr.markForCheck();
      },
    });
  }

  requestDecline(id: number): void {
    this.pendingDeclineId = id;
    this.showDeclineModal = true;
  }

  cancelDecline(): void {
    this.showDeclineModal = false;
    this.pendingDeclineId = null;
  }

  confirmDecline(): void {
    if (!this.pendingDeclineId) { this.cancelDecline(); return; }
    const id = this.pendingDeclineId;
    this.cancelDecline();
    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentsService.decline(id).subscribe({
      next: () => {
        this.successMessage = 'Cita rechazada.';
        this.isProcessing = false;
        this.cdr.markForCheck();
        this.loadAppointmentsForEstablishment();
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || 'No se pudo rechazar la cita.';
        this.isProcessing = false;
        this.cdr.markForCheck();
      },
    });
  }

  completeAppointment(id: number): void {
    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentsService.complete(id).subscribe({
      next: () => {
        this.successMessage = 'Cita marcada como completada.';
        this.isProcessing = false;
        this.cdr.markForCheck();
        this.loadAppointmentsForEstablishment();
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || 'No se pudo completar la cita.';
        this.isProcessing = false;
        this.cdr.markForCheck();
      },
    });
  }

  startReschedule(appt: Appointment): void {
    this.rescheduleId = appt.cita_id;
    this.rescheduleData = {
      hora_inicio: appt.hora_inicio,
      hora_fin: appt.hora_fin,
    };
  }

  cancelReschedule(): void {
    this.rescheduleId = null;
  }

  saveReschedule(id: number): void {
    if (!this.rescheduleData.hora_inicio || !this.rescheduleData.hora_fin) {
      this.errorMessage = 'Completa ambos horarios.';
      return;
    }
    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.appointmentsService.reschedule(id, {
      hora_inicio: this.rescheduleData.hora_inicio,
      hora_fin: this.rescheduleData.hora_fin,
    }).subscribe({
      next: () => {
        this.successMessage = 'Cita reprogramada exitosamente.';
        this.rescheduleId = null;
        this.isProcessing = false;
        this.cdr.markForCheck();
        this.loadAppointmentsForEstablishment();
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || 'No se pudo reprogramar.';
        this.isProcessing = false;
        this.cdr.markForCheck();
      },
    });
  }

  getStatusLabel(estado: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: '⏳ Pendiente',
      CONFIRMADA: '✅ Confirmada',
      CANCELADA: '❌ Cancelada',
      COMPLETADA: '🏁 Completada',
    };
    return labels[estado] || estado;
  }

  trackById(index: number, appt: Appointment): number {
    return appt.cita_id;
  }

  private loadEstablishments(): void {
    const user = this.authService.getUser();
    if (!user) {
      this.errorMessage = 'No se encontró sesión activa.';
      this.isLoadingEstablishments = false;
      return;
    }

    this.establishmentsService
      .getMyEstablishments(user.usuario_id)
      .pipe(finalize(() => {
        this.isLoadingEstablishments = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (establishments) => {
          this.establishments = Array.isArray(establishments) ? establishments : [];
          this.selectedEstablishmentId =
            this.establishments.length > 0 ? this.establishments[0].establecimiento_id : null;
          if (this.selectedEstablishmentId) this.loadAppointmentsForEstablishment();
        },
        error: (err) => {
          this.errorMessage = err?.error?.detail || 'No se pudieron cargar los establecimientos.';
        },
      });
  }

  private loadAppointmentsForEstablishment(): void {
    if (!this.selectedEstablishmentId) {
      this.appointments = [];
      return;
    }

    this.isLoadingAppointments = true;

    this.businessServicesApi
      .getByEstablishment(this.selectedEstablishmentId)
      .subscribe({
        next: (services) => {
          this.services = Array.isArray(services) ? services : [];
          if (this.services.length === 0) {
            this.appointments = [];
            this.isLoadingAppointments = false;
            this.cdr.markForCheck();
            return;
          }

          // Fetch all appointments across establishment services
          this.appointmentsService
            .getAll()
            .pipe(finalize(() => {
              this.isLoadingAppointments = false;
              this.cdr.markForCheck();
            }))
            .subscribe({
              next: (appts) => {
                const serviceIds = new Set(this.services.map(s => s.servicio_id));
                this.appointments = (Array.isArray(appts) ? appts : [])
                  .filter(a => serviceIds.has(a.servicio_id))
                  .sort((a, b) => {
                    const order: Record<string, number> = { PENDIENTE: 0, CONFIRMADA: 1, COMPLETADA: 2, CANCELADA: 3 };
                    return (order[a.estado] ?? 4) - (order[b.estado] ?? 4);
                  });
              },
              error: (err) => {
                this.errorMessage = err?.error?.detail || 'No se pudieron cargar las citas.';
              },
            });
        },
        error: (err) => {
          this.errorMessage = err?.error?.detail || 'No se pudieron cargar los servicios.';
          this.isLoadingAppointments = false;
          this.cdr.markForCheck();
        },
      });
  }

  getServiceName(servicioId: number): string {
    const svc = this.services.find(s => s.servicio_id === servicioId);
    return svc?.nombre || `Servicio #${servicioId}`;
  }
}
