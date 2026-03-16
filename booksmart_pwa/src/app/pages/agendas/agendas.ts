import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Alert } from '../../shared/alert/alert';
import { Auth } from '../../services/auth/auth';
import { Establishment, Establishments } from '../../services/establishments/establishments';
import { Agenda, Agendas } from '../../services/agendas/agendas';
import { Appointment, Appointments } from '../../services/appointments/appointments';

@Component({
  selector: 'app-agendas',
  imports: [CommonModule, FormsModule, Alert],
  templateUrl: './agendas.html',
  styleUrl: './agendas.scss',
})
export class AgendasPage implements OnInit {
  establishments: Establishment[] = [];
  selectedEstablishmentId: number | null = null;

  agendas: Agenda[] = [];
  appointments: Appointment[] = [];

  isLoadingEstablishments = true;
  isLoadingAgendas = false;
  isLoadingAppointments = false;

  errorMessage = '';

  private cdr = inject(ChangeDetectorRef);

  private readonly dayLabels: Record<string, string> = {
    LUNES: 'Lunes',
    MARTES: 'Martes',
    MIERCOLES: 'Miércoles',
    JUEVES: 'Jueves',
    VIERNES: 'Viernes',
    SABADO: 'Sábado',
    DOMINGO: 'Domingo',
  };

  constructor(
    private authService: Auth,
    private establishmentsService: Establishments,
    private agendasService: Agendas,
    private appointmentsService: Appointments
  ) {}

  ngOnInit(): void {
    this.loadEstablishments();
    this.loadAppointments();
  }

  onEstablishmentChange(value: string): void {
    this.selectedEstablishmentId = Number(value);
    this.loadAgendas();
  }

  getDayLabel(day: string): string {
    return this.dayLabels[day] || day;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      CONFIRMADA: 'Confirmada',
      CANCELADA: 'Cancelada',
      COMPLETADA: 'Completada',
    };

    return labels[status] || status;
  }

  trackByAgendaId(index: number, agenda: Agenda): number {
    return agenda.agenda_id;
  }

  trackByAppointmentId(index: number, appointment: Appointment): number {
    return appointment.cita_id;
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
          const normalizedEstablishments = Array.isArray(establishments) ? establishments : [];
          this.establishments = normalizedEstablishments;
          this.selectedEstablishmentId =
            normalizedEstablishments.length > 0
              ? normalizedEstablishments[0].establecimiento_id
              : null;

          this.loadAgendas();
        },
        error: (error) => {
          this.errorMessage = error?.error?.detail || 'No se pudieron cargar los establecimientos.';
        },
      });
  }

  private loadAgendas(): void {
    if (!this.selectedEstablishmentId) {
      this.agendas = [];
      this.isLoadingAgendas = false;
      return;
    }

    this.isLoadingAgendas = true;

    this.agendasService
      .getByEstablishment(this.selectedEstablishmentId)
      .pipe(finalize(() => {
        this.isLoadingAgendas = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (agendas) => {
          this.agendas = Array.isArray(agendas) ? agendas : [];
        },
        error: (error) => {
          this.errorMessage = error?.error?.detail || 'No se pudieron cargar las agendas.';
        },
      });
  }

  private loadAppointments(): void {
    this.isLoadingAppointments = true;

    this.appointmentsService
      .getMine()
      .pipe(finalize(() => {
        this.isLoadingAppointments = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (appointments) => {
          this.appointments = Array.isArray(appointments) ? appointments : [];
        },
        error: (error) => {
          this.errorMessage = error?.error?.detail || 'No se pudieron cargar las citas.';
        },
      });
  }
}
