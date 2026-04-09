import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface RealtimeNotificationEvent {
  type: 'notification';
  data: {
    notificacion_id: number;
    mensaje: string;
    tipo: string;
    leida: boolean;
    fecha_envio: string;
  };
}

export interface RealtimeMessageEvent {
  type: 'message';
  data: {
    mensaje_id: number;
    cita_id: number;
    emisor_id: number;
    contenido: string;
    fecha_envio: string;
  };
}

export interface RealtimeAppointmentEvent {
  type: 'appointment';
  event?: string;
  data: {
    cita_id: number;
    estado: string;
  };
}

export interface RealtimePingEvent {
  type: 'ping' | 'pong';
  [key: string]: unknown;
}

export interface RealtimeErrorEvent {
  type: 'error';
  message: string;
}

export type RealtimeEvent =
  | RealtimeNotificationEvent
  | RealtimeMessageEvent
  | RealtimeAppointmentEvent
  | RealtimePingEvent
  | RealtimeErrorEvent
  | Record<string, unknown>;

@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private socket: WebSocket | null = null;
  private readonly eventSubject = new Subject<RealtimeEvent>();
  private readonly connectedSubject = new BehaviorSubject<boolean>(false);

  readonly events$: Observable<RealtimeEvent> = this.eventSubject.asObservable();
  readonly connected$ = this.connectedSubject.asObservable();

  connect(token: string | null | undefined): void {
    if (!token) {
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = this.buildWebSocketUrl(token);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.connectedSubject.next(true);
    };

    this.socket.onclose = () => {
      this.connectedSubject.next(false);
      this.socket = null;
    };

    this.socket.onerror = () => {
      this.connectedSubject.next(false);
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as RealtimeEvent;
        this.eventSubject.next(data);
      } catch {
        this.eventSubject.next({ type: 'error', message: 'Invalid realtime payload' });
      }
    };
  }

  disconnect(): void {
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // ignore close errors
      }
    }

    this.socket = null;
    this.connectedSubject.next(false);
  }

  send(payload: Record<string, unknown>): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify(payload));
  }

  private buildWebSocketUrl(token: string): string {
    const normalizedBaseUrl = environment.apiUrl.replace(/\/$/, '');
    const wsBaseUrl = normalizedBaseUrl.startsWith('https://')
      ? normalizedBaseUrl.replace('https://', 'wss://')
      : normalizedBaseUrl.replace('http://', 'ws://');

    return `${wsBaseUrl}/api/v1/ws/?token=${encodeURIComponent(token)}`;
  }
}