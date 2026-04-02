import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Api } from '../api';

export interface ChatMessage {
  mensaje_id: number;
  cita_id: number;
  emisor_id: number;
  contenido: string;
  fecha_envio: string;
}

export interface ChatMessageCreate {
  cita_id: number;
  emisor_id: number;
  contenido: string;
}

export interface ChatMessageUpdate {
  cita_id?: number;
  emisor_id?: number;
  contenido?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private readonly basePath = '/api/v1/messages';

  constructor(private api: Api) {}

  getByAppointment(citaId: number): Observable<ChatMessage[]> {
    const params = new HttpParams().set('cita_id', citaId.toString());
    return this.api.get<ChatMessage[]>(this.basePath, params);
  }

  create(message: ChatMessageCreate): Observable<ChatMessage> {
    return this.api.post<ChatMessage>(this.basePath, message);
  }

  update(messageId: number, message: ChatMessageUpdate): Observable<ChatMessage> {
    return this.api.put<ChatMessage>(`${this.basePath}/${messageId}`, message);
  }

  delete(messageId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`${this.basePath}/${messageId}`);
  }
}