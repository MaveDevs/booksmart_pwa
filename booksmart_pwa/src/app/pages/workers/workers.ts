import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth/auth';
import { Establishment, Establishments } from '../../services/establishments/establishments';
import { Worker, WorkerCreate, WorkerUpdate, Workers } from '../../services/workers/workers';
import { Alert } from '../../shared/alert/alert';
import { ConfirmModal } from '../../shared/confirm-modal/confirm-modal';
import { Modal } from '../../shared/modal/modal';

@Component({
  selector: 'app-workers',
  imports: [CommonModule, FormsModule, Alert, ConfirmModal, Modal],
  templateUrl: './workers.html',
  styleUrl: './workers.scss',
})
export class WorkersPage implements OnInit {
  establishments: Establishment[] = [];
  selectedEstablishmentId: number | null = null;
  workers: Worker[] = [];

  showWorkerModal = false;
  isEditingWorker = false;
  currentWorkerId: number | null = null;

  workerForm = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    especialidad: '',
    descripcion: '',
    activo: true,
  };

  isLoadingEstablishments = true;
  isLoadingWorkers = false;
  isSubmitting = false;
  
  showDeleteConfirmModal = false;
  pendingDeleteWorkerId: number | null = null;
  
  errorMessage = '';
  successMessage = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private authService: Auth,
    private establishmentsService: Establishments,
    private workersService: Workers
  ) {}

  ngOnInit(): void {
    this.loadEstablishments();
  }

  openCreateModal(): void {
    this.isEditingWorker = false;
    this.currentWorkerId = null;
    this.resetForm();
    this.errorMessage = '';
    this.successMessage = '';
    this.showWorkerModal = true;
  }

  openEditModal(worker: Worker): void {
    this.isEditingWorker = true;
    this.currentWorkerId = worker.trabajador_id;
    this.workerForm = {
      nombre: worker.nombre,
      apellido: worker.apellido,
      email: worker.email || '',
      telefono: worker.telefono || '',
      especialidad: worker.especialidad || '',
      descripcion: worker.descripcion || '',
      activo: worker.activo,
    };
    this.errorMessage = '';
    this.successMessage = '';
    this.showWorkerModal = true;
  }

  closeWorkerModal(): void {
    if (this.isSubmitting) return;
    this.showWorkerModal = false;
  }

  resetForm(): void {
    this.workerForm = {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      especialidad: '',
      descripcion: '',
      activo: true,
    };
  }

  saveWorker(): void {
    if (!this.selectedEstablishmentId) {
      this.errorMessage = 'Ningún establecimiento seleccionado.';
      return;
    }
    if (!this.workerForm.nombre.trim() || !this.workerForm.apellido.trim()) {
      this.errorMessage = 'Nombre y apellido son obligatorios.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    if (this.isEditingWorker && this.currentWorkerId) {
      const payload: WorkerUpdate = {
        nombre: this.workerForm.nombre.trim(),
        apellido: this.workerForm.apellido.trim(),
        email: this.workerForm.email.trim() || undefined,
        telefono: this.workerForm.telefono.trim() || undefined,
        especialidad: this.workerForm.especialidad.trim() || undefined,
        descripcion: this.workerForm.descripcion.trim() || undefined,
        activo: this.workerForm.activo,
      };

      this.workersService.update(this.currentWorkerId, payload).subscribe({
        next: () => {
          this.successMessage = 'Trabajador actualizado correctamente.';
          this.isSubmitting = false;
          this.showWorkerModal = false;
          this.cdr.markForCheck();
          this.loadWorkers();
        },
        error: (error) => {
          this.errorMessage = error?.error?.detail || 'No se pudo actualizar el trabajador.';
          this.isSubmitting = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      const payload: WorkerCreate = {
        establecimiento_id: this.selectedEstablishmentId,
        nombre: this.workerForm.nombre.trim(),
        apellido: this.workerForm.apellido.trim(),
        email: this.workerForm.email.trim() || undefined,
        telefono: this.workerForm.telefono.trim() || undefined,
        especialidad: this.workerForm.especialidad.trim() || undefined,
        descripcion: this.workerForm.descripcion.trim() || undefined,
        activo: this.workerForm.activo,
      };

      this.workersService.create(payload).subscribe({
        next: () => {
          this.successMessage = 'Trabajador registrado y cuenta de acceso creada.';
          this.isSubmitting = false;
          this.showWorkerModal = false;
          this.cdr.markForCheck();
          this.loadWorkers();
        },
        error: (error) => {
          this.errorMessage = error?.error?.detail || 'No se pudo registrar el trabajador.';
          this.isSubmitting = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  requestDelete(workerId: number): void {
    if (this.isSubmitting) return;
    this.pendingDeleteWorkerId = workerId;
    this.showDeleteConfirmModal = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirmModal = false;
    this.pendingDeleteWorkerId = null;
  }

  confirmDelete(): void {
    if (!this.pendingDeleteWorkerId) {
      this.cancelDelete();
      return;
    }
    const id = this.pendingDeleteWorkerId;
    this.cancelDelete();
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    this.workersService.delete(id).subscribe({
      next: () => {
        this.successMessage = 'Trabajador eliminado.';
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.loadWorkers();
      },
      error: (error) => {
        this.errorMessage = error?.error?.detail || 'No se pudo eliminar.';
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  trackById(index: number, worker: Worker): number {
    return worker.trabajador_id;
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
          this.establishments = Array.isArray(establishments) ? establishments : [];
          this.selectedEstablishmentId =
            this.establishments.length > 0 ? this.establishments[0].establecimiento_id : null;
          if (this.selectedEstablishmentId) this.loadWorkers();
        },
        error: (error) => {
          this.errorMessage = error?.error?.detail || 'No se pudieron cargar los establecimientos.';
        },
      });
  }

  private loadWorkers(): void {
    if (!this.selectedEstablishmentId) {
      this.workers = [];
      return;
    }
    this.isLoadingWorkers = true;
    this.workersService
      .getByEstablishment(this.selectedEstablishmentId)
      .pipe(finalize(() => {
        this.isLoadingWorkers = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (workers) => {
          this.workers = Array.isArray(workers) ? workers : [];
        },
        error: (error) => {
          this.errorMessage = error?.error?.detail || 'No se pudieron cargar los trabajadores.';
        },
      });
  }
}
