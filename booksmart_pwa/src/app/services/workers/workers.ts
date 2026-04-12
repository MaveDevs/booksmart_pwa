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
  contrasena?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Workers {
  private readonly collectionPath = '/api/v1/workers/';

  constructor(private api: Api) {}

  getByEstablishment(establishmentId: number): Observable<Worker[]> {
    const params = new HttpParams().set('establishment_id', establishmentId.toString());
    return this.api.get<Worker[]>(this.collectionPath, params);
  }

  getWorker(id: number): Observable<Worker> {
    return this.api.get<Worker>(`${this.collectionPath}${id}`);
  }

  getMyWorkerProfile(): Observable<Worker> {
    return this.api.get<Worker>(`${this.collectionPath}me`);
  }

  create(data: Partial<Worker>): Observable<Worker> {
    return this.api.post<Worker>(this.collectionPath, data);
  }

  update(id: number, data: Partial<Worker>): Observable<Worker> {
    return this.api.put<Worker>(`${this.collectionPath}${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`${this.collectionPath}${id}`);
  }
}
