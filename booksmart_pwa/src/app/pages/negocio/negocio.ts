import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';
import { Auth } from '../../services/auth/auth';
import {
  Establishment,
  Establishments,
  EstablishmentUpdate,
} from '../../services/establishments/establishments';
import {
  Profile as BusinessProfile,
  ProfileCreate,
  ProfileUpdate,
  Profiles,
} from '../../services/profiles/profiles';
import {
  BusinessService,
  BusinessServiceCreate,
  BusinessServiceUpdate,
  BusinessServices,
} from '../../services/business-services/business-services';
import {
  Agenda,
  AgendaCreate,
  Agendas,
  DayOfWeek,
} from '../../services/agendas/agendas';
import {
  Appointment,
  Appointments,
  AppointmentStatus,
} from '../../services/appointments/appointments';
import { ChatMessage, ChatMessageCreate, MessagesService } from '../../services/messages/messages';
import { Rating, Ratings } from '../../services/ratings/ratings';
import { Subscription, SubscriptionsService } from '../../services/subscriptions/subscriptions';
import { RealtimeService, RealtimeEvent } from '../../services/realtime/realtime';
import { Alert } from '../../shared/alert/alert';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';
import { PlansList } from '../../components/plans-list/plans-list';
import { CurrentSubscription } from '../../components/current-subscription/current-subscription';

type TabId = 'general' | 'servicios' | 'horarios' | 'calendario' | 'mensajes' | 'resenas' | 'suscripcion';

@Component({
  selector: 'app-negocio',
  standalone: true,
  imports: [CommonModule, FormsModule, Alert, ConfirmModal, RouterLink, PlansList, CurrentSubscription],
  templateUrl: './negocio.html',
  styleUrl: './negocio.scss',
})
export class Negocio implements OnInit, OnDestroy {
  establishmentId!: number;
  establishment: Establishment | null = null;
  isLoadingEstablishment = true;

  activeTab: TabId = 'calendario';
  private tabsLoaded = new Set<TabId>();

  // --- General tab ---
  currentProfile: BusinessProfile | null = null;
  establishmentForm = { nombre: '', descripcion: '', direccion: '', telefono: '', activo: true };
  publicProfileForm = { descripcion_publica: '', imagen_logo: '', imagen_portada: '' };
  isSavingEstablishment = false;
  isSavingProfile = false;

  // --- Servicios tab ---
  services: BusinessService[] = [];
  isLoadingServices = false;
  showServiceForm = false;
  newService = { nombre: '', descripcion: '', duracion: 30, precio: 0, activo: true };
  editingServiceId: number | null = null;
  editService = { nombre: '', descripcion: '', duracion: 30, precio: 0, activo: true };
  showDeleteServiceModal = false;
  pendingDeleteServiceId: number | null = null;
  isSubmittingService = false;

  // --- Horarios tab ---
  agendas: Agenda[] = [];
  isLoadingAgendas = false;
  showAgendaModal = false;
  agendaModalDay: DayOfWeek | null = null;
  agendaModalExistingId: number | null = null;
  agendaForm = { hora_inicio: '09:00', hora_fin: '18:00' };
  isSavingAgenda = false;

  readonly DAYS_OF_WEEK: DayOfWeek[] = [
    'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO',
  ];

  private readonly dayLabels: Record<string, string> = {
    LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles',
    JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
  };

  // --- Calendario tab ---
  appointments: Appointment[] = [];
  isLoadingAppointments = false;
  calendarDate = new Date();
  selectedDay: Date | null = null;
  selectedDayAppointments: Appointment[] = [];
  showAppointmentModal = false;
  selectedAppointment: Appointment | null = null;
  isUpdatingAppointment = false;
  messages: ChatMessage[] = [];
  selectedChatAppointment: Appointment | null = null;
  isLoadingMessages = false;
  isSendingMessage = false;
  messageDraft = '';

  // --- Reseñas tab ---
  ratings: Rating[] = [];
  isLoadingRatings = false;

  // --- Suscripción tab ---
  subscription: Subscription | null = null;
  isLoadingSubscription = false;

  errorMessage = '';
  successMessage = '';

  private cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: Auth,
    private establishmentsService: Establishments,
    private profilesService: Profiles,
    private businessServicesApi: BusinessServices,
    private agendasService: Agendas,
    private appointmentsService: Appointments,
    private messagesService: MessagesService,
    private ratingsService: Ratings,
    private subscriptionsService: SubscriptionsService,
    private realtimeService: RealtimeService,
  ) {}

  ngOnInit(): void {
    this.realtimeService.connect(this.authService.getToken());
    this.realtimeService.events$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.handleRealtimeEvent(event));

    const id = this.route.snapshot.paramMap.get('id');
    if (!id || isNaN(+id)) {
      this.router.navigate(['/app/home']);
      return;
    }

    const requestedTab = this.route.snapshot.queryParamMap.get('tab');
    if (requestedTab === 'suscripcion') {
      this.activeTab = 'suscripcion';
    }

    this.establishmentId = +id;
    this.loadEstablishment();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
    this.clearMessages();
    this.editingServiceId = null;
    this.showServiceForm = false;
    if (!this.tabsLoaded.has(tab)) {
      this.tabsLoaded.add(tab);
      this.loadTabData(tab);
    }
  }

  private loadTabData(tab: TabId): void {
    if (tab === 'servicios') this.loadServices();
    else if (tab === 'horarios') this.loadAgendas();
    else if (tab === 'calendario') this.loadAppointments();
    else if (tab === 'mensajes') this.loadMessagesTab();
    else if (tab === 'resenas') this.loadRatings();
    else if (tab === 'suscripcion') this.loadSubscription();
  }

  // ─── ESTABLISHMENT / GENERAL ─────────────────────────────────────────────

  private loadEstablishment(): void {
    this.isLoadingEstablishment = true;
    this.establishmentsService.getEstablishment(this.establishmentId).pipe(
      finalize(() => { this.isLoadingEstablishment = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (e) => {
        this.establishment = e;
        this.establishmentForm = {
          nombre: e.nombre,
          descripcion: e.descripcion || '',
          direccion: e.direccion || '',
          telefono: e.telefono || '',
          activo: e.activo,
        };
        this.tabsLoaded.add(this.activeTab);
        this.loadTabData(this.activeTab);
        this.loadPublicProfile();
      },
      error: () => { this.errorMessage = 'No se pudo cargar el negocio.'; },
    });
  }

  private loadPublicProfile(): void {
    this.profilesService.getByEstablishment(this.establishmentId).subscribe({
      next: (profiles) => {
        this.currentProfile = Array.isArray(profiles) ? (profiles[0] ?? null) : null;
        if (this.currentProfile) {
          this.publicProfileForm = {
            descripcion_publica: this.currentProfile.descripcion_publica || '',
            imagen_logo: this.currentProfile.imagen_logo || '',
            imagen_portada: this.currentProfile.imagen_portada || '',
          };
        }
        this.cdr.markForCheck();
      },
    });
  }

  saveEstablishment(): void {
    if (!this.establishmentForm.nombre.trim()) {
      this.errorMessage = 'El nombre es obligatorio.'; return;
    }
    const payload: EstablishmentUpdate = {
      nombre: this.establishmentForm.nombre.trim(),
      descripcion: this.establishmentForm.descripcion.trim() || undefined,
      direccion: this.establishmentForm.direccion.trim() || undefined,
      telefono: this.establishmentForm.telefono.trim() || undefined,
      activo: this.establishmentForm.activo,
    };
    this.isSavingEstablishment = true;
    this.clearMessages();
    this.establishmentsService.updateEstablishment(this.establishmentId, payload).pipe(
      finalize(() => { this.isSavingEstablishment = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (e) => { this.establishment = e; this.successMessage = 'Negocio actualizado correctamente.'; },
      error: (err) => { this.errorMessage = err?.error?.detail || 'No se pudo guardar el negocio.'; },
    });
  }

  savePublicProfile(): void {
    const payload: ProfileUpdate = {
      descripcion_publica: this.publicProfileForm.descripcion_publica.trim() || undefined,
      imagen_logo: this.publicProfileForm.imagen_logo.trim() || undefined,
      imagen_portada: this.publicProfileForm.imagen_portada.trim() || undefined,
    };
    this.isSavingProfile = true;
    this.clearMessages();
    const obs$ = this.currentProfile
      ? this.profilesService.update(this.currentProfile.perfil_id, payload)
      : this.profilesService.create({ establecimiento_id: this.establishmentId, ...payload } as ProfileCreate);
    obs$.pipe(
      finalize(() => { this.isSavingProfile = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (profile) => { this.currentProfile = profile; this.successMessage = 'Perfil público actualizado.'; },
      error: (err) => { this.errorMessage = err?.error?.detail || 'No se pudo guardar el perfil público.'; },
    });
  }

  // ─── SERVICES ────────────────────────────────────────────────────────────

  private loadServices(): void {
    this.isLoadingServices = true;
    this.businessServicesApi.getByEstablishment(this.establishmentId).pipe(
      finalize(() => { this.isLoadingServices = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (services) => { this.services = services; },
      error: (err) => { this.errorMessage = err?.error?.detail || 'No se pudieron cargar los servicios.'; },
    });
  }

  createService(): void {
    if (!this.newService.nombre.trim()) {
      this.errorMessage = 'El nombre del servicio es obligatorio.'; return;
    }
    const payload: BusinessServiceCreate = {
      establecimiento_id: this.establishmentId,
      nombre: this.newService.nombre.trim(),
      descripcion: this.newService.descripcion.trim() || undefined,
      duracion: Number(this.newService.duracion),
      precio: Number(this.newService.precio),
      activo: this.newService.activo,
    };
    this.isSubmittingService = true;
    this.clearMessages();
    this.businessServicesApi.create(payload).subscribe({
      next: () => {
        this.successMessage = 'Servicio creado correctamente.';
        this.newService = { nombre: '', descripcion: '', duracion: 30, precio: 0, activo: true };
        this.showServiceForm = false;
        this.isSubmittingService = false;
        this.cdr.markForCheck();
        this.loadServices();
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || 'No se pudo crear el servicio.';
        this.isSubmittingService = false;
        this.cdr.markForCheck();
      },
    });
  }

  startEditService(service: BusinessService): void {
    this.editingServiceId = service.servicio_id;
    this.editService = {
      nombre: service.nombre,
      descripcion: service.descripcion || '',
      duracion: service.duracion,
      precio: Number(service.precio),
      activo: service.activo,
    };
  }

  cancelEditService(): void { this.editingServiceId = null; }

  saveEditService(serviceId: number): void {
    const payload: BusinessServiceUpdate = {
      nombre: this.editService.nombre.trim(),
      descripcion: this.editService.descripcion.trim() || undefined,
      duracion: Number(this.editService.duracion),
      precio: Number(this.editService.precio),
      activo: this.editService.activo,
    };
    this.isSubmittingService = true;
    this.clearMessages();
    this.businessServicesApi.update(serviceId, payload).subscribe({
      next: () => {
        this.successMessage = 'Servicio actualizado.';
        this.editingServiceId = null;
        this.isSubmittingService = false;
        this.cdr.markForCheck();
        this.loadServices();
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || 'No se pudo actualizar el servicio.';
        this.isSubmittingService = false;
        this.cdr.markForCheck();
      },
    });
  }

  requestDeleteService(serviceId: number): void {
    this.pendingDeleteServiceId = serviceId;
    this.showDeleteServiceModal = true;
  }

  cancelDeleteService(): void { this.showDeleteServiceModal = false; this.pendingDeleteServiceId = null; }

  confirmDeleteService(): void {
    if (!this.pendingDeleteServiceId) return;
    this.clearMessages();
    this.businessServicesApi.delete(this.pendingDeleteServiceId).subscribe({
      next: () => {
        this.successMessage = 'Servicio eliminado.';
        this.showDeleteServiceModal = false;
        this.pendingDeleteServiceId = null;
        this.cdr.markForCheck();
        this.loadServices();
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || 'No se pudo eliminar el servicio.';
        this.showDeleteServiceModal = false;
        this.cdr.markForCheck();
      },
    });
  }

  trackByServiceId(_: number, s: BusinessService): number { return s.servicio_id; }

  // ─── AGENDAS / HORARIOS ──────────────────────────────────────────────────

  private loadAgendas(): void {
    this.isLoadingAgendas = true;
    this.agendasService.getByEstablishment(this.establishmentId).pipe(
      finalize(() => { this.isLoadingAgendas = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (agendas) => { this.agendas = agendas; },
      error: (err) => { this.errorMessage = err?.error?.detail || 'No se pudieron cargar los horarios.'; },
    });
  }

  getAgendaForDay(day: DayOfWeek): Agenda | undefined {
    return this.agendas.find(a => a.dia_semana === day);
  }

  getDayLabel(day: string): string { return this.dayLabels[day] || day; }

  openAgendaModal(day: DayOfWeek): void {
    const existing = this.getAgendaForDay(day);
    this.agendaModalDay = day;
    this.agendaModalExistingId = existing ? existing.agenda_id : null;
    this.agendaForm = {
      hora_inicio: existing ? existing.hora_inicio.substring(0, 5) : '09:00',
      hora_fin: existing ? existing.hora_fin.substring(0, 5) : '18:00',
    };
    this.showAgendaModal = true;
  }

  closeAgendaModal(): void { this.showAgendaModal = false; this.agendaModalDay = null; }

  saveAgenda(): void {
    if (!this.agendaModalDay) return;
    if (this.agendaForm.hora_fin <= this.agendaForm.hora_inicio) {
      this.errorMessage = 'La hora de fin debe ser posterior a la hora de inicio.'; return;
    }
    this.isSavingAgenda = true;
    this.clearMessages();
    const obs$ = this.agendaModalExistingId
      ? this.agendasService.update(this.agendaModalExistingId, {
          hora_inicio: this.agendaForm.hora_inicio,
          hora_fin: this.agendaForm.hora_fin,
        })
      : this.agendasService.create({
          establecimiento_id: this.establishmentId,
          dia_semana: this.agendaModalDay,
          hora_inicio: this.agendaForm.hora_inicio,
          hora_fin: this.agendaForm.hora_fin,
        } as AgendaCreate);
    obs$.pipe(
      finalize(() => { this.isSavingAgenda = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: () => {
        this.successMessage = 'Horario guardado.';
        this.closeAgendaModal();
        this.loadAgendas();
      },
      error: (err) => { this.errorMessage = err?.error?.detail || 'No se pudo guardar el horario.'; },
    });
  }

  closeDay(day: DayOfWeek): void {
    const existing = this.getAgendaForDay(day);
    if (!existing) return;
    this.clearMessages();
    this.agendasService.delete(existing.agenda_id).subscribe({
      next: () => {
        this.successMessage = 'Día cerrado correctamente.';
        this.loadAgendas();
        this.cdr.markForCheck();
      },
      error: (err) => { this.errorMessage = err?.error?.detail || 'No se pudo cerrar el día.'; },
    });
  }

  // ─── APPOINTMENTS / CALENDARIO ───────────────────────────────────────────

  private loadAppointments(): void {
    this.isLoadingAppointments = true;
    this.appointmentsService.getByEstablishment(this.establishmentId).pipe(
      finalize(() => { this.isLoadingAppointments = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (appts) => {
        this.appointments = this.sortAppointments(appts);
        if (this.selectedDay) {
          this.selectedDayAppointments = this.getAppointmentsForDay(this.selectedDay);
        }
        if (this.activeTab === 'mensajes') {
          this.ensureChatSelection();
        }
      },
      error: (err) => { this.errorMessage = err?.error?.detail || 'No se pudieron cargar las citas.'; },
    });
  }

  private loadMessagesTab(): void {
    if (!this.appointments.length) {
      this.loadAppointments();
      return;
    }

    this.ensureChatSelection();
  }

  selectChatAppointment(appointment: Appointment): void {
    this.selectedChatAppointment = appointment;
    this.activeTab = 'mensajes';
    this.clearMessages();
    this.loadMessagesForAppointment(appointment.cita_id);
  }

  private loadMessagesForAppointment(citaId: number): void {
    this.isLoadingMessages = true;
    this.messagesService.getByAppointment(citaId).pipe(
      finalize(() => { this.isLoadingMessages = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (messages) => {
        this.messages = this.sortMessages(messages);
      },
      error: (err) => {
        this.messages = [];
        this.errorMessage = err?.error?.detail || 'No se pudieron cargar los mensajes.';
      },
    });
  }

  sendMessage(): void {
    if (!this.selectedChatAppointment) {
      this.errorMessage = 'Selecciona una cita para enviar mensajes.';
      return;
    }

    const currentUser = this.authService.getUser();
    if (!currentUser) {
      this.errorMessage = 'No se encontró una sesión activa.';
      return;
    }

    const content = this.messageDraft.trim();
    if (!content) {
      this.errorMessage = 'Escribe un mensaje antes de enviar.';
      return;
    }

    const payload: ChatMessageCreate = {
      cita_id: this.selectedChatAppointment.cita_id,
      emisor_id: currentUser.usuario_id,
      contenido: content,
    };

    this.isSendingMessage = true;
    this.clearMessages();
    this.messagesService.create(payload).pipe(
      finalize(() => { this.isSendingMessage = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (message) => {
        this.messages = this.sortMessages([...this.messages, message]);
        this.messageDraft = '';
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || 'No se pudo enviar el mensaje.';
      },
    });
  }

  acceptAppointment(): void {
    if (!this.selectedAppointment) {
      return;
    }

    this.isUpdatingAppointment = true;
    this.clearMessages();
    this.appointmentsService.accept(this.selectedAppointment.cita_id).pipe(
      finalize(() => { this.isUpdatingAppointment = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (updated) => {
        this.applyAppointmentUpdate(updated);
        this.successMessage = 'Cita confirmada correctamente.';
        this.closeAppointmentModal();
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || 'No se pudo confirmar la cita.';
      },
    });
  }

  declineAppointment(): void {
    if (!this.selectedAppointment) {
      return;
    }

    this.isUpdatingAppointment = true;
    this.clearMessages();
    this.appointmentsService.decline(this.selectedAppointment.cita_id).pipe(
      finalize(() => { this.isUpdatingAppointment = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (updated) => {
        this.applyAppointmentUpdate(updated);
        this.successMessage = 'Cita rechazada correctamente.';
        this.closeAppointmentModal();
      },
      error: (err) => {
        this.errorMessage = err?.error?.detail || 'No se pudo rechazar la cita.';
      },
    });
  }

  get calendarYear(): number { return this.calendarDate.getFullYear(); }
  get calendarMonth(): number { return this.calendarDate.getMonth(); }
  get calendarMonthLabel(): string {
    return this.calendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    this.calendarDate = new Date(this.calendarYear, this.calendarMonth - 1, 1);
    this.selectedDay = null;
    this.selectedDayAppointments = [];
  }

  nextMonth(): void {
    this.calendarDate = new Date(this.calendarYear, this.calendarMonth + 1, 1);
    this.selectedDay = null;
    this.selectedDayAppointments = [];
  }

  get calendarDays(): (Date | null)[] {
    const first = new Date(this.calendarYear, this.calendarMonth, 1);
    const last = new Date(this.calendarYear, this.calendarMonth + 1, 0);
    const startPad = (first.getDay() + 6) % 7; // 0=Monday
    const days: (Date | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(new Date(this.calendarYear, this.calendarMonth, d));
    }
    return days;
  }

  getAppointmentsForDay(date: Date): Appointment[] {
    const dateStr = this.toDateString(date);
    return this.sortAppointments(this.appointments.filter((appointment) => appointment.fecha === dateStr));
  }

  selectDay(date: Date): void {
    this.selectedDay = date;
    this.selectedDayAppointments = this.getAppointmentsForDay(date);
  }

  openAppointmentModal(appt: Appointment): void {
    this.selectedAppointment = appt;
    this.showAppointmentModal = true;
  }

  closeAppointmentModal(): void {
    this.showAppointmentModal = false;
    this.selectedAppointment = null;
  }

  updateAppointmentStatus(status: AppointmentStatus): void {
    if (!this.selectedAppointment) return;
    this.isUpdatingAppointment = true;
    this.clearMessages();
    this.appointmentsService.updateStatus(this.selectedAppointment.cita_id, status).pipe(
      finalize(() => { this.isUpdatingAppointment = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (updated) => {
        this.applyAppointmentUpdate(updated);
        this.successMessage = 'Estado de cita actualizado.';
        this.closeAppointmentModal();
      },
      error: (err) => { this.errorMessage = err?.error?.detail || 'No se pudo actualizar la cita.'; },
    });
  }

  openAppointmentMessages(): void {
    if (!this.selectedAppointment) {
      return;
    }

    this.selectChatAppointment(this.selectedAppointment);
    this.closeAppointmentModal();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada',
      CANCELADA: 'Cancelada', COMPLETADA: 'Completada',
    };
    return labels[status] || status;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  isSelectedDay(date: Date): boolean {
    if (!this.selectedDay) return false;
    return date.getDate() === this.selectedDay.getDate() &&
      date.getMonth() === this.selectedDay.getMonth() &&
      date.getFullYear() === this.selectedDay.getFullYear();
  }

  private toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private ensureChatSelection(): void {
    if (!this.appointments.length) {
      this.selectedChatAppointment = null;
      this.messages = [];
      return;
    }

    const currentSelection = this.selectedChatAppointment
      ? this.appointments.find((appointment) => appointment.cita_id === this.selectedChatAppointment?.cita_id)
      : null;

    this.selectedChatAppointment = currentSelection || this.appointments[0];

    if (this.selectedChatAppointment) {
      this.loadMessagesForAppointment(this.selectedChatAppointment.cita_id);
    }
  }

  private applyAppointmentUpdate(updated: Appointment): void {
    this.appointments = this.appointments.map((appointment) => (
      appointment.cita_id === updated.cita_id ? updated : appointment
    ));

    if (this.selectedAppointment?.cita_id === updated.cita_id) {
      this.selectedAppointment = updated;
    }

    if (this.selectedChatAppointment?.cita_id === updated.cita_id) {
      this.selectedChatAppointment = updated;
    }

    if (this.selectedDay) {
      this.selectedDayAppointments = this.getAppointmentsForDay(this.selectedDay);
    }
  }

  private sortAppointments(appointments: Appointment[]): Appointment[] {
    return [...appointments].sort((left, right) => {
      const leftDate = `${left.fecha}T${left.hora_inicio}`;
      const rightDate = `${right.fecha}T${right.hora_inicio}`;
      return new Date(leftDate).getTime() - new Date(rightDate).getTime();
    });
  }

  private sortMessages(messages: ChatMessage[]): ChatMessage[] {
    return [...messages].sort(
      (left, right) => new Date(left.fecha_envio).getTime() - new Date(right.fecha_envio).getTime(),
    );
  }

  isCurrentUserMessage(message: ChatMessage): boolean {
    return this.authService.getUser()?.usuario_id === message.emisor_id;
  }

  private handleRealtimeEvent(event: RealtimeEvent): void {
    if (event.type === 'message') {
      const message = event as RealtimeEvent & { data: ChatMessage };
      const payload = message.data;
      if (this.selectedChatAppointment?.cita_id === payload.cita_id) {
        if (!this.messages.some((existing) => existing.mensaje_id === payload.mensaje_id)) {
          this.messages = this.sortMessages([...this.messages, payload]);
          this.cdr.markForCheck();
        }
      }
      return;
    }

    if (event.type === 'appointment') {
      const appointmentEvent = event as RealtimeEvent & { data: { cita_id: number; estado: AppointmentStatus } };
      const appointment = this.appointments.find((item) => item.cita_id === appointmentEvent.data.cita_id);
      if (appointment) {
        this.applyAppointmentUpdate({ ...appointment, estado: appointmentEvent.data.estado });
        this.cdr.markForCheck();
      }
    }
  }

  // ─── RATINGS ─────────────────────────────────────────────────────────────

  private loadRatings(): void {
    this.isLoadingRatings = true;
    this.ratingsService.getByEstablishment(this.establishmentId).pipe(
      finalize(() => { this.isLoadingRatings = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (ratings) => { this.ratings = ratings; },
      error: () => { this.ratings = []; },
    });
  }

  get averageRating(): number {
    if (!this.ratings.length) return 0;
    const sum = this.ratings.reduce((acc, r) => acc + r.calificacion, 0);
    return Math.round((sum / this.ratings.length) * 10) / 10;
  }

  // ─── SUBSCRIPTION ─────────────────────────────────────────────────────────

  private loadSubscription(): void {
    this.isLoadingSubscription = true;
    this.subscriptionsService.getByEstablishment(this.establishmentId).pipe(
      finalize(() => { this.isLoadingSubscription = false; this.cdr.markForCheck(); }),
    ).subscribe({
      next: (subs) => { this.subscription = Array.isArray(subs) ? (subs[0] ?? null) : null; },
      error: () => { this.subscription = null; },
    });
  }

  // ─── UTILS ───────────────────────────────────────────────────────────────

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  goBack(): void { this.router.navigate(['/app/home']); }

  trackByAppointmentId(_: number, a: Appointment): number { return a.cita_id; }
  trackByRatingId(_: number, r: Rating): number { return r.resena_id; }
  trackByMessageId(_: number, message: ChatMessage): number { return message.mensaje_id; }
}
