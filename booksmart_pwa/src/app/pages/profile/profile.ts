import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import * as L from 'leaflet';
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

// Fix for default Leaflet marker icons in Angular
const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, Alert],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit, OnDestroy {
  establishments: Establishment[] = [];
  selectedEstablishmentId: number | null = null;
  currentProfile: BusinessProfile | null = null;

  establishmentForm = {
    nombre: '',
    descripcion: '',
    direccion: '',
    latitud: null as number | null,
    longitud: null as number | null,
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

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private authService: Auth,
    private establishmentsService: Establishments,
    private profilesService: Profiles
  ) {}

  ngOnInit(): void {
    this.loadEstablishments();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    if (this.map) return; // Prevent double initialization

    const mapElement = document.getElementById('map');
    if (!mapElement) return; // Guard clause if DOM not ready

    // Fallback location just in case (e.g., Centro de Chihuahua)
    const defaultLat = 28.632995;
    const defaultLng = -106.069100;

    this.map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Initial click listener to drop/move the pin
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.updateMarker(e.latlng.lat, e.latlng.lng, true);
    });

    // Try to auto-locate the user via browser GPS (only if they don't have coords saved)
    if (this.establishmentForm.latitud === null && this.establishmentForm.longitud === null) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            if (this.map) {
              this.map.setView([currentLat, currentLng], 16);
              this.updateMarker(currentLat, currentLng, true);
              
              // We trigger CDR again because updateMarker updates establishmentForm directly
              this.cdr.markForCheck(); 
            }
          },
          (error) => {
            console.warn('Geolocation blocked or unavailable. Falling back to default.', error);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }

    // In case the map container is hidden and then shown, give it a little time to resize properly
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 500);
  }

  private updateMarker(lat: number, lng: number, fetchAddress: boolean = false): void {
    if (!this.map) return;

    this.establishmentForm.latitud = lat;
    this.establishmentForm.longitud = lng;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }

    if (fetchAddress) {
      this.reverseGeocode(lat, lng);
    }

    this.cdr.markForCheck();
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.address) {
          // Construct a nice human-readable string (road, house_number, suburb, city)
          const addr = data.address;
          const road = addr.road || '';
          const house = addr.house_number || '';
          const suburb = addr.suburb || addr.neighbourhood || '';
          const city = addr.city || addr.town || addr.village || '';
          
          let formattedAddress = `${road} ${house}`.trim();
          if (suburb) formattedAddress += `, ${suburb}`;
          if (city) formattedAddress += `, ${city}`;

          if (formattedAddress.trim() === ',' || formattedAddress.trim() === '') {
            formattedAddress = data.display_name;
          }
          
          this.establishmentForm.direccion = formattedAddress;
          this.cdr.markForCheck();
        }
      }
    } catch (err) {
      console.warn('No se pudo obtener la dirección automáticamente:', err);
    }
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
      latitud: this.establishmentForm.latitud !== null ? this.establishmentForm.latitud : undefined,
      longitud: this.establishmentForm.longitud !== null ? this.establishmentForm.longitud : undefined,
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
      latitud: current.latitud ?? null,
      longitud: current.longitud ?? null,
      telefono: current.telefono || '',
      activo: current.activo,
    };

    // Initialize map after Angular renders the form
    setTimeout(() => {
      this.initMap();
      
      // Update map view if coords exist
      if (this.establishmentForm.latitud && this.establishmentForm.longitud && this.map) {
        this.updateMarker(this.establishmentForm.latitud, this.establishmentForm.longitud);
        this.map.setView([this.establishmentForm.latitud, this.establishmentForm.longitud], 15);
      }
    }, 50);
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
