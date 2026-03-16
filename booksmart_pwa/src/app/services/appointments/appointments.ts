import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root',
})
export class Appointments {
  private readonly basePath = '/api/v1/appointments';

  constructor(private api: Api) {}

  getMine(): Observable<Appointment[]> {
    return this.api.get<Appointment[]>(`${this.basePath}/me`);
  }
}
