import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Auth } from '../../services/auth/auth';
import { Establishment, Establishments } from '../../services/establishments/establishments';
import { NotificationsService, AppNotification } from '../../services/notifications/notifications';
import { Appointments, Appointment } from '../../services/appointments/appointments';
import { Alert } from '../../shared/alert/alert';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, Alert],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  establishments: Establishment[] = [];
  notifications: AppNotification[] = [];
  todayAppointments: Appointment[] = [];
  unreadCount = 0;

  isLoading = true;
  errorMessage = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private authService: Auth,
    private establishmentsService: Establishments,
    private notificationsService: NotificationsService,
    private appointmentsService: Appointments
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  retryLoad(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const user = this.authService.getUser();
    if (!user) {
      this.errorMessage = 'No se encontró sesión activa.';
      this.isLoading = false;
      return;
    }

    forkJoin({
      establishments: this.establishmentsService.getMyEstablishments(user.usuario_id),
      notifications: this.notificationsService.getMyNotifications(0, 20),
      appointments: this.appointmentsService.getAll()
    })
    .pipe(finalize(() => {
      this.isLoading = false;
      this.cdr.markForCheck();
    }))
    .subscribe({
      next: (results) => {
        this.establishments = Array.isArray(results.establishments) ? results.establishments : [];
        this.notifications = Array.isArray(results.notifications) ? results.notifications : [];
        
        this.unreadCount = this.notifications.filter(n => !n.leida).length;

        const allAppointments = Array.isArray(results.appointments) ? results.appointments : [];
        const todayStr = new Date().toISOString().split('T')[0];
        
        this.todayAppointments = allAppointments
          .filter(a => a.fecha === todayStr)
          .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      },
      error: (error) => {
        if (error?.status === 408) {
          this.errorMessage = 'El servidor tardó demasiado en responder. Verifica tu conexión e inténtalo de nuevo.';
          return;
        }

        this.errorMessage =
          error?.error?.detail || 'No se pudieron cargar los datos de tu dashboard.';
      },
    });
  }

  trackByEstablishmentId(index: number, establishment: Establishment): number {
    return establishment.establecimiento_id;
  }

  formatTime(timeString: string): { hour: string, meridian: string } {
    if (!timeString) return { hour: '', meridian: '' };
    const [h, m] = timeString.split(':');
    let hour = parseInt(h, 10);
    const meridian = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    
    return {
      hour: `${hour < 10 ? '0' + hour : hour}:${m}`,
      meridian
    };
  }

  getNotificationIcon(tipo: string): string {
    switch (tipo) {
      case 'INFO': return 'ℹ️';
      case 'ALERTA': return '⚠️';
      case 'RECORDATORIO': return '📅';
      default: return '✉️';
    }
  }

  getTimeAgo(dateString: string): string {
    const time = new Date(dateString).getTime();
    if (isNaN(time)) return 'Reciente';
    
    const now = new Date().getTime();
    const diff = (now - time) / 1000;
    
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} horas`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  }
}
