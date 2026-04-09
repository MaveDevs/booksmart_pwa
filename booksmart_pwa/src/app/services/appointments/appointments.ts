import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export type AppointmentStatus = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';

export interface Appointment {
  cita_id: number;
  cliente_id: number;
  trabajador_id?: number | null;
  servicio_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: AppointmentStatus;
  fecha_creacion: string;

  // Campos enriquecidos
  cliente_nombre?: string;
  cliente_apellido?: string;
  trabajador_nombre?: string;
  trabajador_apellido?: string;
  servicio_nombre?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Appointments {
  private readonly basePath = '/api/v1/appointments/';

  constructor(private api: Api) {}

  getMine(): Observable<Appointment[]> {
    return this.api.get<Appointment[]>(`${this.basePath}me`);
  }

  getByEstablishment(establishmentId: number, trabajadorId?: number | null): Observable<Appointment[]> {
    let params = new HttpParams().set('establishment_id', establishmentId.toString());
    if (trabajadorId) {
      params = params.set('trabajador_id', trabajadorId.toString());
    }
    return this.api.get<Appointment[]>(this.basePath, params);
  }

  updateStatus(appointmentId: number, estado: AppointmentStatus): Observable<Appointment> {
    return this.api.patch<Appointment>(`${this.basePath}${appointmentId}`, { estado });
  }

  accept(appointmentId: number): Observable<Appointment> {
    return this.api.post<Appointment>(`${this.basePath}${appointmentId}/accept`, {});
  }

  decline(appointmentId: number): Observable<Appointment> {
    return this.api.post<Appointment>(`${this.basePath}${appointmentId}/decline`, {});
  }
}
