import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export interface Rating {
  resena_id: number;
  usuario_id: number;
  establecimiento_id: number;
  calificacion: number;
  comentario?: string;
  fecha?: string;
  usuario_nombre?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Ratings {
  private readonly basePath = '/api/v1/ratings/';

  constructor(private api: Api) {}

  getByEstablishment(establishmentId: number): Observable<Rating[]> {
    const params = new HttpParams().set('establishment_id', establishmentId.toString());
    return this.api.get<Rating[]>(this.basePath, params);
  }
}
