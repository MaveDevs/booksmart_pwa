import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth, RegisterRequest } from '../../../services/auth/auth';
import { Alert } from '../../../shared/alert/alert';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, Alert],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  nombre = '';
  apellido = '';
  correo = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private router: Router,
    private authService: Auth
  ) {}

  onRegister() {
    // Validaciones
    if (!this.nombre || !this.apellido || !this.correo || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userData: RegisterRequest = {
      nombre: this.nombre,
      apellido: this.apellido,
      correo: this.correo,
      rol_id: 1, // Rol por defecto
      activo: true,
      contrasena: this.password
    };

    console.log('🚀 Registrando usuario:', { ...userData, contrasena: '***' });

    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('✅ Registro exitoso:', response);
        this.successMessage = 'Registro exitoso. Redirigiendo al login...';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error en registro:', error);
        console.error('📋 Error status:', error.status);
        console.error('📋 Error body:', error.error);
        
        // Intentar obtener el mensaje de error específico
        let errorMsg = 'Error al registrar. Por favor intenta de nuevo.';
        
        if (error.error?.detail) {
          if (typeof error.error.detail === 'string') {
            errorMsg = error.error.detail;
          } else if (Array.isArray(error.error.detail)) {
            // Si detail es un array de errores de validación
            errorMsg = error.error.detail.map((e: any) => e.msg || e).join(', ');
          }
        } else if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.status === 400) {
          errorMsg = 'Datos inválidos. Verifica que el correo sea válido y que todos los campos estén completos.';
        }
        
        this.errorMessage = errorMsg;
        this.isLoading = false;
      },
      complete: () => {
        console.log('🏁 Observable completado');
        this.isLoading = false;
      }
    });
  }
}