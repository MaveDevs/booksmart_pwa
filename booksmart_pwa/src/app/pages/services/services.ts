import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth/auth';
import { Establishment, Establishments } from '../../services/establishments/establishments';
import {
  BusinessService,
  BusinessServiceCreate,
  BusinessServices,
  BusinessServiceUpdate,
} from '../../services/business-services/business-services';
import { Alert } from '../../shared/alert/alert';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';

@Component({
  selector: 'app-services',
  imports: [CommonModule, FormsModule, Alert, ConfirmModal],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class Services implements OnInit {
  establishments: Establishment[] = [];
  selectedEstablishmentId: number | null = null;
  services: BusinessService[] = [];

  newService = {
    nombre: '',
    descripcion: '',
    duracion: 30,
    precio: 0,
    activo: true,
  };

  editingServiceId: number | null = null;
  editService = {
    nombre: '',
    descripcion: '',
    duracion: 30,
    precio: 0,
    activo: true,
  };

  isLoadingEstablishments = true;
  isLoadingServices = false;
  isSubmitting = false;
  showDeleteConfirmModal = false;
  pendingDeleteServiceId: number | null = null;
  errorMessage = '';
  successMessage = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private authService: Auth,
    private establishmentsService: Establishments,
    private businessServicesApi: BusinessServices
  ) {}

  ngOnInit(): void {
    this.loadEstablishments();
  }

  onEstablishmentChange(value: string): void {
    this.selectedEstablishmentId = Number(value);
    this.cancelEdit();
    this.loadServices();
  }

  createService(): void {
    if (!this.selectedEstablishmentId) {
      this.errorMessage = 'Selecciona un establecimiento.';
      return;
    }
    if (!this.newService.nombre.trim()) {
      this.errorMessage = 'El nombre del servicio es obligatorio.';
      return;
    }
    if (this.newService.duracion <= 0) {
      this.errorMessage = 'La duración debe ser mayor a 0 minutos.';
      return;
    }
    if (this.newService.precio < 0) {
      this.errorMessage = 'El precio no puede ser negativo.';
      return;
    }

    const payload: BusinessServiceCreate = {
      establecimiento_id: this.selectedEstablishmentId,
      nombre: this.newService.nombre.trim(),
      descripcion: this.newService.descripcion.trim() || undefined,
      duracion: Number(this.newService.duracion),
      precio: Number(this.newService.precio),
      activo: this.newService.activo,
    };

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    this.businessServicesApi.create(payload).subscribe({
      next: () => {
        this.successMessage = 'Servicio creado correctamente.';
        this.newService = {
          nombre: '',
          descripcion: '',
          duracion: 30,
          precio: 0,
          activo: true,
        };
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.loadServices();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.detail || 'No se pudo crear el servicio.';
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  startEdit(service: BusinessService): void {
    this.editingServiceId = service.servicio_id;
    this.editService = {
      nombre: service.nombre,
      descripcion: service.descripcion || '',
      duracion: service.duracion,
      precio: Number(service.precio),
      activo: service.activo,
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEdit(): void {
    this.editingServiceId = null;
  }

  saveEdit(serviceId: number): void {
    if (!this.editService.nombre.trim()) {
      this.errorMessage = 'El nombre del servicio es obligatorio.';
      return;
    }
    if (this.editService.duracion <= 0) {
      this.errorMessage = 'La duración debe ser mayor a 0 minutos.';
      return;
    }
    if (this.editService.precio < 0) {
      this.errorMessage = 'El precio no puede ser negativo.';
      return;
    }

    const payload: BusinessServiceUpdate = {
      nombre: this.editService.nombre.trim(),
      descripcion: this.editService.descripcion.trim() || undefined,
      duracion: Number(this.editService.duracion),
      precio: Number(this.editService.precio),
      activo: this.editService.activo,
    };

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    this.businessServicesApi.update(serviceId, payload).subscribe({
      next: () => {
        this.successMessage = 'Servicio actualizado correctamente.';
        this.isSubmitting = false;
        this.editingServiceId = null;
        this.cdr.markForCheck();
        this.loadServices();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.detail || 'No se pudo actualizar el servicio.';
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  requestDeleteService(serviceId: number): void {
    if (this.isSubmitting) {
      return;
    }

    this.pendingDeleteServiceId = serviceId;
    this.showDeleteConfirmModal = true;
  }

  cancelDeleteService(): void {
    this.showDeleteConfirmModal = false;
    this.pendingDeleteServiceId = null;
  }

  confirmDeleteService(): void {
    if (!this.pendingDeleteServiceId) {
      this.cancelDeleteService();
      return;
    }

    const serviceId = this.pendingDeleteServiceId;
    this.cancelDeleteService();

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    this.businessServicesApi.delete(serviceId).subscribe({
      next: () => {
        this.successMessage = 'Servicio eliminado correctamente.';
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.loadServices();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.detail || 'No se pudo eliminar el servicio.';
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  trackByServiceId(index: number, service: BusinessService): number {
    return service.servicio_id;
  }

  private loadEstablishments(): void {
    const user = this.authService.getUser();
    if (!user) {
      this.errorMessage = 'No se encontró sesión activa.';
      this.isLoadingEstablishments = false;
      return;
    }

    this.establishmentsService
      .getMyEstablishments(user.usuario_id)
      .pipe(finalize(() => {
        this.isLoadingEstablishments = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (establishments) => {
          const normalizedEstablishments = Array.isArray(establishments) ? establishments : [];
          this.establishments = normalizedEstablishments;
          this.selectedEstablishmentId =
            normalizedEstablishments.length > 0
              ? normalizedEstablishments[0].establecimiento_id
              : null;

          if (this.selectedEstablishmentId) {
            this.loadServices();
          }
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.detail || 'No se pudieron cargar los establecimientos.';
        },
      });
  }

  private loadServices(): void {
    if (!this.selectedEstablishmentId) {
      this.services = [];
      this.isLoadingServices = false;
      return;
    }

    this.isLoadingServices = true;
    this.businessServicesApi
      .getByEstablishment(this.selectedEstablishmentId)
      .pipe(finalize(() => {
        this.isLoadingServices = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (services) => {
          this.services = Array.isArray(services) ? services : [];
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.detail || 'No se pudieron cargar los servicios.';
        },
      });
  }

}
