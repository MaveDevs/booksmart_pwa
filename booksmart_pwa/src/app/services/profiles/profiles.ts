import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export interface Profile {
  perfil_id: number;
  establecimiento_id: number;
  descripcion_publica?: string;
  imagen_logo?: string;
  imagen_portada?: string;
}

export interface ProfileCreate {
  establecimiento_id: number;
  descripcion_publica?: string;
  imagen_logo?: string;
  imagen_portada?: string;
}

export interface ProfileUpdate {
  descripcion_publica?: string;
  imagen_logo?: string;
  imagen_portada?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Profiles {
  private readonly basePath = '/api/v1/profiles';

  constructor(private api: Api) {}

  getByEstablishment(establishmentId: number): Observable<Profile[]> {
    const params = new HttpParams().set('establecimiento_id', establishmentId.toString());
    return this.api.get<Profile[]>(this.basePath, params);
  }

  create(data: ProfileCreate): Observable<Profile> {
    return this.api.post<Profile>(this.basePath, data);
  }

  update(profileId: number, data: ProfileUpdate): Observable<Profile> {
    return this.api.patch<Profile>(`${this.basePath}/${profileId}`, data);
  }
}
