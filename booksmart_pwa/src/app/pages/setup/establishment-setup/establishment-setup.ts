import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Auth } from '../../../services/auth/auth';
import { Establishments, EstablishmentCreate } from '../../../services/establishments/establishments';
import { Alert } from '../../../shared/alert/alert';

@Component({
  selector: 'app-establishment-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, Alert],
  templateUrl: './establishment-setup.html',
  styleUrl: './establishment-setup.scss'
})
export class EstablishmentSetup implements OnInit {
  nombre = '';
  descripcion = '';
  direccion = '';
  telefono = '';
  errorMessage = '';
  isLoading = false;
  isCheckingExisting = true;
  showOptionalFields = false;

  constructor(
    private router: Router,
    private authService: Auth,
    private establishmentsService: Establishments
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.establishmentsService
      .getMyEstablishments(user.usuario_id)
      .pipe(finalize(() => {
        this.isCheckingExisting = false;
      }))
      .subscribe({
        next: (establishments) => {
          if (Array.isArray(establishments) && establishments.length > 0) {
            this.router.navigate(['/app/home']);
          }
        },
        error: () => {
          this.errorMessage = 'No pudimos verificar tus negocios. Puedes continuar con el registro.';
        },
      });
  }

  onSubmit() {
    if (this.isCheckingExisting) {
      return;
    }

    if (!this.nombre.trim()) {
      this.errorMessage = 'El nombre del negocio es obligatorio';
      return;
    }

    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload: EstablishmentCreate = {
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim() || undefined,
      direccion: this.direccion.trim() || undefined,
      telefono: this.telefono.trim() || undefined,
      usuario_id: user.usuario_id,
      activo: true
    };

    this.establishmentsService.createEstablishment(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/app/home']);
      },
      error: (error) => {
        let msg = 'Error al crear el negocio. Intenta de nuevo.';
        if (error.error?.detail) {
          msg = typeof error.error.detail === 'string'
            ? error.error.detail
            : error.error.detail.map((e: any) => e.msg || e).join(', ');
        }
        this.errorMessage = msg;
        this.isLoading = false;
      }
    });
  }

  toggleOptionalFields() {
    this.showOptionalFields = !this.showOptionalFields;
  }

  continueLater() {
    if (this.isCheckingExisting || this.isLoading) {
      return;
    }
    this.router.navigate(['/app/home']);
  }

  onLogout() {
    this.authService.removeToken();
    this.authService.removeUser();
    this.router.navigate(['/login']);
  }
}
