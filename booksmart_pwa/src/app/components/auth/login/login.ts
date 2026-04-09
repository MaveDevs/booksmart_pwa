import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { timeout, catchError, throwError, finalize } from 'rxjs';
import { Auth, LoginRequest } from '../../../services/auth/auth';
import { Alert } from '../../../shared/alert/alert';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, Alert],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private router: Router,
    private authService: Auth
  ) {}

  onLogin() {
    if (!this.email || !this.password) {
      this.showError('Por favor completa todos los campos');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const credentials: LoginRequest = {
      email: this.email,
      password: this.password
    };

    this.authService.login(credentials).pipe(
      timeout(8000), // Reduced to 8s for faster feedback
      catchError(err => {
        if (err.name === 'TimeoutError') {
          return throwError(() => ({ status: 408, message: 'timeout' }));
        }
        return throwError(() => err);
      }),
      finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (response) => {
        this.authService.saveToken(response.access_token);
        
        // Load user and navigate
        this.authService.fetchCurrentUser().pipe(timeout(5000)).subscribe({
          next: (user) => {
            this.authService.setUser(user);
            this.router.navigate(['/app/home']);
          },
          error: () => {
            // Even if user fetch fails, if we have token, try home
            this.router.navigate(['/app/home']);
          }
        });
      },
      error: (error) => {
        if (error.status === 401 || error.status === 422 || error.status === 400) {
          this.showError('Correo o contraseña incorrectos');
        } else if (error.status === 404) {
          this.showError('Usuario no encontrado');
        } else if (error.status === 408) {
          this.showError('El servidor no responde. Reintenta ahora.');
        } else if (error.status === 0) {
          this.showError('Sin conexión. Revisa tu internet.');
        } else {
          this.showError('Error al entrar. Intenta de nuevo.');
        }
      }
    });
  }

  private showError(msg: string) {
    this.errorMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      if (this.errorMessage === msg) {
        this.errorMessage = '';
        this.cdr.markForCheck();
      }
    }, 5000);
  }
}
