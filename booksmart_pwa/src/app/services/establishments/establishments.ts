import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { Api } from '../api';

export interface Establishment {
  establecimiento_id: number;
  nombre: string;
  descripcion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  usuario_id: number;
  activo: boolean;
}

export interface EstablishmentCreate {
  nombre: string;
  descripcion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  usuario_id: number;
  activo: boolean;
}

export interface EstablishmentUpdate {
  nombre?: string;
  descripcion?: string;
  direccion?: string;
  latitud?: number;
  longitud?: number;
  telefono?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Establishments {
  private readonly collectionPath = '/api/v1/establishments/';

  constructor(private api: Api) {}

  private itemPath(id: number): string {
    return `${this.collectionPath}${id}`;
  }

  getEstablishments(): Observable<Establishment[]> {
    return this.api.get<Establishment[]>(this.collectionPath);
  }

  getMyEstablishments(userId: number): Observable<Establishment[]> {
    const params = new HttpParams().set('user_id', userId.toString());
    return this.api.get<Establishment[]>(this.collectionPath, params);
  }

  getEstablishment(id: number): Observable<Establishment> {
    return this.api.get<Establishment>(this.itemPath(id));
  }

  createEstablishment(data: EstablishmentCreate): Observable<Establishment> {
    return this.api.post<Establishment>(this.collectionPath, data);
  }

  updateEstablishment(id: number, data: EstablishmentUpdate): Observable<Establishment> {
    return this.api.patch<Establishment>(this.itemPath(id), data);
  }

  deleteEstablishment(id: number): Observable<any> {
    return this.api.delete(this.itemPath(id));
  }
}

