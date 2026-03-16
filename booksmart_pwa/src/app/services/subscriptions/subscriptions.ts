import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export interface BusinessSubscription {
  subscripcion_id: number;
  establishment_id: number;
  plan_id?: number;
  estado: string;
  fecha_inicio?: string;
  fecha_expiracion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Subscriptions {
  private readonly basePath = '/api/v1/subscriptions/';

  constructor(private api: Api) {}

  getByEstablishment(establishmentId: number): Observable<BusinessSubscription[]> {
    const params = new HttpParams().set('establishment_id', establishmentId.toString());
    return this.api.get<BusinessSubscription[]>(this.basePath, params);
  }
}
