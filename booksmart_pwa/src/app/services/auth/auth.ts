import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Api } from '../api';

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
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol_id: number;
  activo: boolean;
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

  constructor(private api: Api) {
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
    return this.api.post('/api/v1/auth/logout', {});
  }

  getCurrentUser(): Observable<User> {
    return this.api.get<User>('/api/v1/auth/me').pipe(
      tap(user => this.setUser(user))
    );
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

  // Verificar si el usuario tiene un rol específico
  hasRole(roleId: number): boolean {
    return this.currentUser?.rol_id === roleId;
  }

  // Verificar si el usuario tiene uno de varios roles permitidos
  hasAnyRole(roleIds: number[]): boolean {
    return this.currentUser ? roleIds.includes(this.currentUser.rol_id) : false;
  }

  // Verificar si el usuario está activo
  isActive(): boolean {
    return this.currentUser?.activo === true;
  }
}