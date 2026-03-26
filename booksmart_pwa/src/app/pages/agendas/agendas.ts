import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import { Alert } from '../../shared/alert/alert';
import { Modal } from '../../shared/modal/modal';
import { Auth } from '../../services/auth/auth';
import { Establishment, Establishments } from '../../services/establishments/establishments';
import { Agenda, Agendas } from '../../services/agendas/agendas';

@Component({
  selector: 'app-agendas',
  imports: [CommonModule, FormsModule, Alert, Modal],
  templateUrl: './agendas.html',
  styleUrl: './agendas.scss',
})
export class AgendasPage implements OnInit {
  establishments: Establishment[] = [];
  selectedEstablishmentId: number | null = null;

  agendas: Agenda[] = [];

  isLoadingEstablishments = true;
  isLoadingAgendas = false;

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

  isFormVisible = false;
  isEditing = false;
  currentAgendaId: number | null = null;
  isLoadingAction = false;

  agendaForm: {
    dia_semana: string;
    selectedDays: string[];
    hora_inicio: string;
    hora_fin: string;
  } = {
    dia_semana: 'LUNES',
    selectedDays: [],
    hora_inicio: '09:00',
    hora_fin: '18:00',
  };

  private readonly days: string[] = [
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
    'DOMINGO',
  ];

  constructor(
    private authService: Auth,
    private establishmentsService: Establishments,
    private agendasService: Agendas
  ) {}

  ngOnInit(): void {
    this.loadEstablishments();
  }

  onEstablishmentChange(value: string): void {
    this.selectedEstablishmentId = Number(value);
    this.loadAgendas();
  }

  getDayLabel(day: string): string {
    return this.dayLabels[day] || day;
  }

  getDays(): string[] {
    return this.days;
  }

  // --- Form Actions ---

  showAddForm(): void {
    this.isEditing = false;
    this.currentAgendaId = null;
    this.agendaForm = {
      dia_semana: 'LUNES',
      selectedDays: [],
      hora_inicio: '09:00',
      hora_fin: '18:00',
    };
    this.isFormVisible = true;
    this.errorMessage = '';
  }

  showEditForm(agenda: Agenda): void {
    this.isEditing = true;
    this.currentAgendaId = agenda.agenda_id;
    this.agendaForm = {
      dia_semana: agenda.dia_semana,
      selectedDays: [agenda.dia_semana],
      hora_inicio: agenda.hora_inicio,
      hora_fin: agenda.hora_fin,
    };
    this.isFormVisible = true;
    this.errorMessage = '';
  }

  hideForm(): void {
    this.isFormVisible = false;
    this.errorMessage = '';
  }

  toggleDaySelection(day: string): void {
    if (this.isDayDisabled(day)) return;

    const index = this.agendaForm.selectedDays.indexOf(day);
    if (index === -1) {
      this.agendaForm.selectedDays.push(day);
    } else {
      this.agendaForm.selectedDays.splice(index, 1);
    }
  }

  isDaySelected(day: string): boolean {
    return this.agendaForm.selectedDays.includes(day);
  }

  isDayDisabled(day: string): boolean {
    if (this.isEditing) return false;
    return this.agendas.some((a) => a.dia_semana === day);
  }

  saveAgenda(): void {
    if (!this.selectedEstablishmentId) return;

    if (!this.isEditing && this.agendaForm.selectedDays.length === 0) {
      this.errorMessage = 'Debes seleccionar al menos un día.';
      return;
    }

    this.isLoadingAction = true;
    this.errorMessage = '';

    const obs$: Observable<any> = this.isEditing && this.currentAgendaId
      ? this.agendasService.update(this.currentAgendaId, {
          dia_semana: this.agendaForm.dia_semana,
          hora_inicio: this.agendaForm.hora_inicio,
          hora_fin: this.agendaForm.hora_fin
        } as any)
      : this.agendasService.createBulk({
          establecimiento_id: this.selectedEstablishmentId,
          dias_semana: this.agendaForm.selectedDays as any,
          hora_inicio: this.agendaForm.hora_inicio,
          hora_fin: this.agendaForm.hora_fin
        });

    obs$.pipe(finalize(() => {
      this.isLoadingAction = false;
      this.cdr.markForCheck();
    }))
    .subscribe({
      next: () => {
        this.hideForm();
        this.loadAgendas();
      },
      error: (error: any) => {
        this.errorMessage = error?.error?.detail || 'No se pudo guardar la agenda.';
      }
    });
  }

  deleteAgenda(id: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este horario?')) return;

    this.isLoadingAction = true;
    this.errorMessage = '';

    this.agendasService.delete(id)
      .pipe(finalize(() => {
        this.isLoadingAction = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.loadAgendas();
        },
        error: (error) => {
          this.errorMessage = error?.error?.detail || 'No se pudo eliminar la agenda.';
        }
      });
  }

  // --- Data Loading ---

  trackByAgendaId(index: number, agenda: Agenda): number {
    return agenda.agenda_id;
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
}
