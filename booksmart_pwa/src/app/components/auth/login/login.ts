import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

  constructor(
    private router: Router,
    private authService: Auth
  ) {}

  onLogin() {
    console.log('🔵 onLogin iniciado');
    
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

    console.log('🚀 Enviando credenciales:', { email: this.email });

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso:', response);
        this.authService.saveToken(response.access_token);
        console.log('🔑 Token guardado, redirigiendo...');
        this.router.navigate(['/app/home']);
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        
        // Siempre mostrar mensaje en español, ignorar mensajes del servidor
        if (error.status === 401 || error.status === 422) {
          this.errorMessage = 'Correo o contraseña incorrectos';
        } else if (error.status === 404) {
          this.errorMessage = 'Usuario no encontrado';
        } else if (error.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica tu internet';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Intenta de nuevo';
        }
        
        this.isLoading = false;
        console.log('❌ isLoading establecido en false');
        console.log('❌ Mensaje de error:', this.errorMessage);
      }
    });
  }
}