import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth, LoginRequest } from '../../../services/auth/auth';
import { Establishments } from '../../../services/establishments/establishments';
import { PushNotifications } from '../../../services/push-notifications/push-notifications';
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

  constructor(
    private router: Router,
    private authService: Auth,
    private establishmentsService: Establishments,
    private pushNotifications: PushNotifications
  ) {}

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginRequest = {
      email: this.email,
      password: this.password
    };

    console.log('[Login] 🚀 Payload enviado:', { email: this.email, password: '***' });

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('[Login] ✅ Respuesta exitosa:', response);
        this.authService.saveToken(response.access_token);

        // Fetch user profile and then check if they have an establishment
        this.authService.fetchCurrentUser().subscribe({
          next: (user) => {
            console.log('[Login] 👤 Usuario obtenido:', user);
            this.authService.setUser(user);
            this.pushNotifications.subscribeAndRegister();
            this.checkEstablishmentsAndNavigate(user.usuario_id);
          },
          error: (err) => {
            console.error('[Login] ❌ Error al obtener usuario:', err);
            console.error('[Login] status:', err.status, '| body:', err.error);
            this.isLoading = false;
            this.router.navigate(['/setup/establishment']);
          }
        });
      },
      error: (error) => {
        console.error('[Login] ❌ Error en login:', error);
        console.error('[Login] status:', error.status);
        console.error('[Login] body:', error.error);
        console.error('[Login] payload enviado:', { email: this.email, password: '***' });

        if (error.status === 401 || error.status === 422 || error.status === 400) {
          this.errorMessage = 'Correo o contraseña incorrectos';
        } else if (error.status === 404) {
          this.errorMessage = 'Usuario no encontrado';
        } else if (error.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica tu internet';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Intenta de nuevo';
        }
        this.isLoading = false;
      }
    });
  }

  private checkEstablishmentsAndNavigate(userId: number): void {
    this.establishmentsService.getMyEstablishments(userId).subscribe({
      next: (establishments) => {
        this.isLoading = false;
        if (establishments.length === 0) {
          this.router.navigate(['/setup/establishment']);
        } else {
          this.router.navigate(['/app/home']);
        }
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/setup/establishment']);
      }
    });
  }
}
