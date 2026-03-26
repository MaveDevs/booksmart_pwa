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
  dia_semana?: DayOfWeek;
  hora_inicio?: string;
  hora_fin?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Agendas {
  private readonly collectionPath = '/api/v1/agendas/';

  constructor(private api: Api) {}

  private itemPath(id: number): string {
    return `${this.collectionPath}${id}`;
  }

  getByEstablishment(establishmentId: number): Observable<Agenda[]> {
    const params = new HttpParams().set('establecimiento_id', establishmentId.toString());
    return this.api.get<Agenda[]>(this.collectionPath, params);
  }

  create(data: AgendaCreate): Observable<Agenda> {
    return this.api.post<Agenda>(this.collectionPath, data);
  }

  update(id: number, data: AgendaUpdate): Observable<Agenda> {
    return this.api.put<Agenda>(this.itemPath(id), data);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(this.itemPath(id));
  }
}
