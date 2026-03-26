import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export interface Worker {
  trabajador_id: number;
  establecimiento_id: number;
  usuario_id?: number;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  foto_perfil?: string;
  especialidad?: string;
  descripcion?: string;
  activo: boolean;
  fecha_contratacion?: string;
  fecha_creacion: string;
}

export interface WorkerCreate {
  establecimiento_id: number;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  especialidad?: string;
  descripcion?: string;
  activo: boolean;
}

export interface WorkerUpdate {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  especialidad?: string;
  descripcion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Workers {
  private readonly collectionPath = '/api/v1/workers/';

  constructor(private api: Api) {}

  private itemPath(id: number): string {
    return `${this.collectionPath}${id}`;
  }

  getByEstablishment(establishmentId: number): Observable<Worker[]> {
    const params = new HttpParams().set('establishment_id', establishmentId.toString());
    return this.api.get<Worker[]>(this.collectionPath, params);
  }

  getWorker(id: number): Observable<Worker> {
    return this.api.get<Worker>(this.itemPath(id));
  }

  create(data: WorkerCreate): Observable<Worker> {
    return this.api.post<Worker>(this.collectionPath, data);
  }

  update(id: number, data: WorkerUpdate): Observable<Worker> {
    return this.api.patch<Worker>(this.itemPath(id), data);
  }

  delete(id: number): Observable<{ detail: string }> {
    return this.api.delete<{ detail: string }>(this.itemPath(id));
  }
}
