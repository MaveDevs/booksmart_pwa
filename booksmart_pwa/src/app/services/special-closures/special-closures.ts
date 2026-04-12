import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export interface SpecialClosure {
  cierre_id: number;
  establecimiento_id: number;
  fecha: string;
  motivo?: string | null;
  creado_en: string;
}

export interface SpecialClosureCreate {
  establecimiento_id: number;
  fecha: string;
  motivo?: string | null;
}

export interface SpecialClosureUpdate {
  motivo?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class SpecialClosuresService {
  private readonly collectionPath = '/api/v1/special-closures/';

  constructor(private api: Api) {}

  getByEstablishment(establishmentId: number): Observable<SpecialClosure[]> {
    const params = new HttpParams().set('establecimiento_id', establishmentId.toString());
    return this.api.get<SpecialClosure[]>(this.collectionPath, params);
  }

  create(data: SpecialClosureCreate): Observable<SpecialClosure> {
    return this.api.post<SpecialClosure>(this.collectionPath, data);
  }

  update(closureId: number, data: SpecialClosureUpdate): Observable<SpecialClosure> {
    return this.api.patch<SpecialClosure>(`${this.collectionPath}${closureId}`, data);
  }

  delete(closureId: number): Observable<any> {
    return this.api.delete(`${this.collectionPath}${closureId}`);
  }
}