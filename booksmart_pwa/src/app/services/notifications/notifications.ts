import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export type NotificationType = 'INFO' | 'ALERTA' | 'RECORDATORIO';

export interface AppNotification {
  notificacion_id: number;
  usuario_id: number;
  mensaje: string;
  tipo: NotificationType;
  leida: boolean;
  fecha_envio: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly basePath = '/api/v1/notifications';

  constructor(private api: Api) {}

  getMyNotifications(skip = 0, limit = 50): Observable<AppNotification[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    return this.api.get<AppNotification[]>(`${this.basePath}/me`, params);
  }

  markAsRead(id: number): Observable<AppNotification> {
    return this.api.patch<AppNotification>(`${this.basePath}/${id}`, { leida: true });
  }
}
