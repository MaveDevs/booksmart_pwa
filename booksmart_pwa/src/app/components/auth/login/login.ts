import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { timeout, catchError, throwError, finalize } from 'rxjs';
import { Auth, LoginRequest } from '../../../services/auth/auth';
import { TourService } from '../../../services/tour/tour';
import { DEMO_TOUR_STEPS } from '../../../services/tour/tour-steps';
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
  isDemoLoading = false;

  private static readonly DEMO_EMAIL = 'demo@booksmart.com';
  private static readonly DEMO_PASSWORD = 'Demo2025!';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private router: Router,
    private authService: Auth,
    private tourService: TourService
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

  /** Logs in with the demo account and starts the interactive tour */
  onDemoAccess(): void {
    this.isDemoLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.email = Login.DEMO_EMAIL;
    this.password = Login.DEMO_PASSWORD;

    const credentials: LoginRequest = {
      email: Login.DEMO_EMAIL,
      password: Login.DEMO_PASSWORD,
    };

    this.authService.login(credentials).pipe(
      timeout(10000),
      catchError(err => {
        if (err.name === 'TimeoutError') {
          return throwError(() => ({ status: 408, message: 'timeout' }));
        }
        return throwError(() => err);
      }),
      finalize(() => {
        this.isDemoLoading = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: (response) => {
        this.authService.saveToken(response.access_token);
        localStorage.setItem('booksmart_demo_mode', 'true');

        this.authService.fetchCurrentUser().pipe(timeout(5000)).subscribe({
          next: (user) => {
            this.authService.setUser(user);
            this.router.navigate(['/app/home']).then(() => {
              // Wait for the home page to fully render then start tour
              setTimeout(() => this.tourService.startTour(DEMO_TOUR_STEPS), 1200);
            });
          },
          error: () => {
            this.router.navigate(['/app/home']).then(() => {
              setTimeout(() => this.tourService.startTour(DEMO_TOUR_STEPS), 1200);
            });
          }
        });
      },
      error: (error) => {
        if (error.status === 401 || error.status === 422 || error.status === 400) {
          this.showError('La cuenta demo no está disponible. Contacta al administrador.');
        } else if (error.status === 408) {
          this.showError('El servidor no responde. Reintenta ahora.');
        } else if (error.status === 0) {
          this.showError('Sin conexión. Revisa tu internet.');
        } else {
          this.showError('Error al acceder al demo. Intenta de nuevo.');
        }
      },
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
