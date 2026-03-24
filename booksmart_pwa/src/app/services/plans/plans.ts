import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Api } from '../api';

export interface Plan {
  plan_id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
}

export interface CreatePlanRequest {
  nombre: string;
  descripcion?: string;
  precio: number;
  activo?: boolean;
}

export interface UpdatePlanRequest {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  activo?: boolean;
}

export interface InitializeDefaultsResponse {
  created: boolean;
  free_plan_id: number;
  premium_plan_id: number;
}

@Injectable({
  providedIn: 'root',
})
export class PlansService {
  private readonly basePath = '/api/v1/plans/';

  constructor(private api: Api) {}

  /**
   * Get all plans with pagination
   */
  getAll(skip: number = 0, limit: number = 100): Observable<Plan[]> {
    const params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    return this.api.get<Plan[]>(this.basePath, params);
  }

  /**
   * Get a specific plan by ID
   */
  getById(planId: number): Observable<Plan> {
    return this.api.get<Plan>(`${this.basePath}${planId}`);
  }

  /**
   * Create a new plan (admin only)
   */
  create(plan: CreatePlanRequest): Observable<Plan> {
    return this.api.post<Plan>(this.basePath, plan);
  }

  /**
   * Update an entire plan (admin only)
   */
  update(planId: number, plan: UpdatePlanRequest): Observable<Plan> {
    return this.api.put<Plan>(`${this.basePath}${planId}`, plan);
  }

  /**
   * Partially update a plan (admin only)
   */
  patch(planId: number, plan: UpdatePlanRequest): Observable<Plan> {
    return this.api.patch<Plan>(`${this.basePath}${planId}`, plan);
  }

  /**
   * Delete a plan (admin only)
   */
  delete(planId: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`${this.basePath}${planId}`);
  }

  /**
   * Initialize default FREE and PREMIUM plans (admin only)
   */
  initializeDefaults(): Observable<InitializeDefaultsResponse> {
    return this.api.post<InitializeDefaultsResponse>(
      `${this.basePath}initialize/defaults`,
      {}
    );
  }
}
