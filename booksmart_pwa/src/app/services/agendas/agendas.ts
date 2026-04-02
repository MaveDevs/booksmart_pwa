import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export type DayOfWeek =
  | 'LUNES'
  | 'MARTES'
  | 'MIERCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SABADO'
  | 'DOMINGO';

export interface Agenda {
  agenda_id: number;
  establecimiento_id: number;
  dia_semana: DayOfWeek;
  hora_inicio: string;
  hora_fin: string;
}

export interface AgendaCreate {
  establecimiento_id: number;
  dia_semana: DayOfWeek;
  hora_inicio: string;
  hora_fin: string;
}

export interface AgendaUpdate {
  hora_inicio?: string;
  hora_fin?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Agendas {
  private readonly collectionPath = '/api/v1/agendas/';

  constructor(private api: Api) {}

  getByEstablishment(establishmentId: number): Observable<Agenda[]> {
    const params = new HttpParams().set('establecimiento_id', establishmentId.toString());
    return this.api.get<Agenda[]>(this.collectionPath, params);
  }

  create(data: AgendaCreate): Observable<Agenda> {
    return this.api.post<Agenda>(this.collectionPath, data);
  }

  update(agendaId: number, data: AgendaUpdate): Observable<Agenda> {
    return this.api.patch<Agenda>(`${this.collectionPath}${agendaId}`, data);
  }

  delete(agendaId: number): Observable<any> {
    return this.api.delete(`${this.collectionPath}${agendaId}`);
  }
}
