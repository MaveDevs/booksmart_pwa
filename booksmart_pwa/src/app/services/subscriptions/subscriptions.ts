import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export interface Subscription {
  suscripcion_id: number;
  establecimiento_id: number;
  plan_id: number;
  estado: 'ACTIVA' | 'CANCELADA' | 'EXPIRADA';
  fecha_inicio: string;
  fecha_fin?: string;
}

export interface CreateSubscriptionRequest {
  establecimiento_id: number;
  plan_id: number;
  fecha_inicio: string;
  fecha_fin?: string;
  estado?: 'ACTIVA' | 'CANCELADA' | 'EXPIRADA';
}

export interface UpdateSubscriptionRequest {
  establecimiento_id?: number;
  plan_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: 'ACTIVA' | 'CANCELADA' | 'EXPIRADA';
}

export interface SubscriptionListQuery {
  establecimiento_id?: number;
  plan_id?: number;
  skip?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionsService {
  private readonly basePath = '/api/v1/subscriptions/';

  constructor(private api: Api) {}

  /**
   * Get all subscriptions with optional filters
   */
  getAll(query?: SubscriptionListQuery): Observable<Subscription[]> {
    let params = new HttpParams();
    
    if (query) {
      if (query.establecimiento_id !== undefined) {
        params = params.set('establecimiento_id', query.establecimiento_id.toString());
      }
      if (query.plan_id !== undefined) {
        params = params.set('plan_id', query.plan_id.toString());
      }
      if (query.skip !== undefined) {
        params = params.set('skip', query.skip.toString());
      }
      if (query.limit !== undefined) {
        params = params.set('limit', query.limit.toString());
      }
    }

    return this.api.get<Subscription[]>(this.basePath, params);
  }

  /**
   * Get subscriptions for a specific establishment
   */
  getByEstablishment(establishmentId: number): Observable<Subscription[]> {
    const params = new HttpParams().set('establecimiento_id', establishmentId.toString());
    return this.api.get<Subscription[]>(this.basePath, params);
  }

  /**
   * Get a specific subscription by ID
   */
  getById(subscriptionId: number): Observable<Subscription> {
    return this.api.get<Subscription>(`${this.basePath}${subscriptionId}`);
  }

  /**
   * Create a new subscription
   */
  create(subscription: CreateSubscriptionRequest): Observable<Subscription> {
    return this.api.post<Subscription>(this.basePath, subscription);
  }

  /**
   * Update a subscription (admin only)
   */
  update(subscriptionId: number, subscription: UpdateSubscriptionRequest): Observable<Subscription> {
    return this.api.put<Subscription>(`${this.basePath}${subscriptionId}`, subscription);
  }

  /**
   * Partially update a subscription (admin only)
   */
  patch(subscriptionId: number, subscription: UpdateSubscriptionRequest): Observable<Subscription> {
    return this.api.patch<Subscription>(`${this.basePath}${subscriptionId}`, subscription);
  }

  /**
   * Delete a subscription (admin only)
   */
  delete(subscriptionId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`${this.basePath}${subscriptionId}`);
  }
}
