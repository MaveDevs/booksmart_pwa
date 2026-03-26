import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export type AppointmentStatus = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA';

export interface Appointment {
  cita_id: number;
  cliente_id: number;
  servicio_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: AppointmentStatus;
  fecha_creacion: string;
}

export interface AppointmentUpdate {
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  estado?: AppointmentStatus;
}

@Injectable({
  providedIn: 'root',
})
export class Appointments {
  private readonly basePath = '/api/v1/appointments';

  constructor(private api: Api) {}

  getMine(): Observable<Appointment[]> {
    return this.api.get<Appointment[]>(`${this.basePath}/me`);
  }

  getAll(servicioId?: number): Observable<Appointment[]> {
    let params = new HttpParams();
    if (servicioId) {
      params = params.set('servicio_id', servicioId.toString());
    }
    return this.api.get<Appointment[]>(`${this.basePath}/`, params);
  }

  get(id: number): Observable<Appointment> {
    return this.api.get<Appointment>(`${this.basePath}/${id}`);
  }

  accept(id: number): Observable<Appointment> {
    return this.api.post<Appointment>(`${this.basePath}/${id}/accept`, {});
  }

  decline(id: number): Observable<Appointment> {
    return this.api.post<Appointment>(`${this.basePath}/${id}/decline`, {});
  }

  reschedule(id: number, data: AppointmentUpdate): Observable<Appointment> {
    return this.api.patch<Appointment>(`${this.basePath}/${id}`, data);
  }

  complete(id: number): Observable<Appointment> {
    return this.api.patch<Appointment>(`${this.basePath}/${id}`, { estado: 'COMPLETADA' });
  }
}
