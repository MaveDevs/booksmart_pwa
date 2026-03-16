import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export interface BusinessService {
  servicio_id: number;
  establecimiento_id: number;
  nombre: string;
  descripcion?: string;
  duracion: number;
  precio: number | string;
  activo: boolean;
}

export interface BusinessServiceCreate {
  establecimiento_id: number;
  nombre: string;
  descripcion?: string;
  duracion: number;
  precio: number;
  activo: boolean;
}

export interface BusinessServiceUpdate {
  establecimiento_id?: number;
  nombre?: string;
  descripcion?: string;
  duracion?: number;
  precio?: number;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BusinessServices {
  private readonly collectionPath = '/api/v1/services/';

  constructor(private api: Api) {}

  private itemPath(serviceId: number): string {
    return `${this.collectionPath}${serviceId}`;
  }

  getByEstablishment(establishmentId: number): Observable<BusinessService[]> {
    const params = new HttpParams().set('establishment_id', establishmentId.toString());
    return this.api.get<BusinessService[]>(this.collectionPath, params);
  }

  create(data: BusinessServiceCreate): Observable<BusinessService> {
    return this.api.post<BusinessService>(this.collectionPath, data);
  }

  update(serviceId: number, data: BusinessServiceUpdate): Observable<BusinessService> {
    return this.api.patch<BusinessService>(this.itemPath(serviceId), data);
  }

  delete(serviceId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(this.itemPath(serviceId));
  }
}
