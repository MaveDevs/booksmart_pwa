import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Auth } from '../../services/auth/auth';
import {
  Establishment,
  Establishments,
  EstablishmentUpdate,
} from '../../services/establishments/establishments';
import {
  Profile as BusinessProfile,
  ProfileCreate,
  ProfileUpdate,
  Profiles,
} from '../../services/profiles/profiles';
import { Alert } from '../../shared/alert/alert';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, Alert],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  establishments: Establishment[] = [];
  selectedEstablishmentId: number | null = null;
  currentProfile: BusinessProfile | null = null;

  establishmentForm = {
    nombre: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    activo: true,
  };

  publicProfileForm = {
    descripcion_publica: '',
    imagen_logo: '',
    imagen_portada: '',
  };

  isLoading = true;
  isSavingEstablishment = false;
  isSavingProfile = false;
  errorMessage = '';
  successMessage = '';

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private authService: Auth,
    private establishmentsService: Establishments,
    private profilesService: Profiles
  ) {}

  ngOnInit(): void {
    this.loadEstablishments();
  }

  onEstablishmentChange(value: string): void {
    this.selectedEstablishmentId = Number(value);
    this.bindEstablishmentForm();
    this.loadPublicProfile();
  }

  saveEstablishment(): void {
    if (!this.selectedEstablishmentId) {
      this.errorMessage = 'Selecciona un establecimiento.';
      return;
    }
    if (!this.establishmentForm.nombre.trim()) {
      this.errorMessage = 'El nombre del establecimiento es obligatorio.';
      return;
    }

    const payload: EstablishmentUpdate = {
      nombre: this.establishmentForm.nombre.trim(),
      descripcion: this.establishmentForm.descripcion.trim() || undefined,
      direccion: this.establishmentForm.direccion.trim() || undefined,
      telefono: this.establishmentForm.telefono.trim() || undefined,
      activo: this.establishmentForm.activo,
    };

    this.errorMessage = '';
    this.successMessage = '';
    this.isSavingEstablishment = true;

    this.establishmentsService
      .updateEstablishment(this.selectedEstablishmentId, payload)
      .subscribe({
        next: (updated) => {
          this.establishments = this.establishments.map((item) =>
            item.establecimiento_id === updated.establecimiento_id ? updated : item
          );
          this.successMessage = 'Datos del establecimiento actualizados.';
          this.isSavingEstablishment = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.detail || 'No se pudo actualizar el establecimiento.';
          this.isSavingEstablishment = false;
          this.cdr.markForCheck();
        },
      });
  }

  savePublicProfile(): void {
    if (!this.selectedEstablishmentId) {
      this.errorMessage = 'Selecciona un establecimiento.';
      return;
    }

    const payload: ProfileUpdate = {
      descripcion_publica: this.publicProfileForm.descripcion_publica.trim() || undefined,
      imagen_logo: this.publicProfileForm.imagen_logo.trim() || undefined,
      imagen_portada: this.publicProfileForm.imagen_portada.trim() || undefined,
    };

    this.errorMessage = '';
    this.successMessage = '';
    this.isSavingProfile = true;

    if (this.currentProfile) {
      this.profilesService.update(this.currentProfile.perfil_id, payload).subscribe({
        next: (profile) => {
          this.currentProfile = profile;
          this.successMessage = 'Perfil público actualizado.';
          this.isSavingProfile = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.detail || 'No se pudo actualizar el perfil público.';
          this.isSavingProfile = false;
          this.cdr.markForCheck();
        },
      });
      return;
    }

    const createPayload: ProfileCreate = {
      establecimiento_id: this.selectedEstablishmentId,
      ...payload,
    };

    this.profilesService.create(createPayload).subscribe({
      next: (profile) => {
        this.currentProfile = profile;
        this.successMessage = 'Perfil público creado.';
        this.isSavingProfile = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.detail || 'No se pudo crear el perfil público.';
        this.isSavingProfile = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadEstablishments(): void {
    const user = this.authService.getUser();
    if (!user) {
      this.errorMessage = 'No se encontró sesión activa.';
      this.isLoading = false;
      return;
    }

    this.establishmentsService
      .getMyEstablishments(user.usuario_id)
      .pipe(finalize(() => {
        this.isLoading = false;
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
          this.bindEstablishmentForm();
          this.loadPublicProfile();
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.detail || 'No se pudieron cargar los establecimientos.';
        },
      });
  }

  private bindEstablishmentForm(): void {
    const current = this.establishments.find(
      (item) => item.establecimiento_id === this.selectedEstablishmentId
    );
    if (!current) {
      return;
    }

    this.establishmentForm = {
      nombre: current.nombre,
      descripcion: current.descripcion || '',
      direccion: current.direccion || '',
      telefono: current.telefono || '',
      activo: current.activo,
    };
  }

  private loadPublicProfile(): void {
    if (!this.selectedEstablishmentId) {
      this.currentProfile = null;
      this.publicProfileForm = {
        descripcion_publica: '',
        imagen_logo: '',
        imagen_portada: '',
      };
      return;
    }

    this.profilesService.getByEstablishment(this.selectedEstablishmentId).subscribe({
      next: (profiles) => {
        const normalizedProfiles = Array.isArray(profiles) ? profiles : [];
        const current = normalizedProfiles.length > 0 ? normalizedProfiles[0] : null;
        this.currentProfile = current;
        this.publicProfileForm = {
          descripcion_publica: current?.descripcion_publica || '',
          imagen_logo: current?.imagen_logo || '',
          imagen_portada: current?.imagen_portada || '',
        };
        this.cdr.markForCheck();
      },
      error: () => {
        this.currentProfile = null;
        this.publicProfileForm = {
          descripcion_publica: '',
          imagen_logo: '',
          imagen_portada: '',
        };
        this.cdr.markForCheck();
      },
    });
  }

}
