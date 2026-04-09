import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Api } from '../api';
import { ActiveEstablishmentService } from '../establishments/active-establishment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  correo: string;
  rol_id: number;
  activo: boolean;
  contrasena: string;
}

export interface User {
  usuario_id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol_id: number | null;
  activo: boolean;
  fecha_creacion?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private currentUser: User | null = null;

  constructor(
    private api: Api,
    private activeEstablishmentService: ActiveEstablishmentService,
  ) {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/api/v1/auth/login/access-token', credentials).pipe(
      tap(response => {
        if (response.user) {
          this.setUser(response.user);
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.api.post<User>('/api/v1/users/', userData);
  }

  logout(): Observable<any> {
    this.removeToken();
    this.removeUser();
    this.activeEstablishmentService.clear();
    return this.api.post('/api/v1/auth/logout', {});
  }

  getCurrentUser(): Observable<User> {
    return this.api.get<User>('/api/v1/users/me').pipe(
      tap(user => this.setUser(user))
    );
  }

  fetchCurrentUser(): Observable<User> {
    return this.getCurrentUser();
  }

  // Métodos auxiliares para manejar tokens
  saveToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  removeToken(): void {
    localStorage.removeItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Métodos para manejar usuario
  setUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  getUser(): User | null {
    return this.currentUser;
  }

  removeUser(): void {
    this.currentUser = null;
    localStorage.removeItem('current_user');
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }

  isOwner(): boolean {
    return this.currentUser?.rol_id === 2;
  }

  isWorker(): boolean {
    return this.currentUser?.rol_id === 4;
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(roleId: number): boolean {
    return this.currentUser?.rol_id === roleId;
  }

  // Verificar si el usuario tiene uno de varios roles permitidos
  hasAnyRole(roleIds: number[]): boolean {
    if (!this.currentUser || this.currentUser.rol_id === null) return false;
    return roleIds.includes(this.currentUser.rol_id);
  }

  // Verificar si el usuario está activo
  isActive(): boolean {
    return this.currentUser?.activo === true;
  }
}