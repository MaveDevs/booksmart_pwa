import { Component, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import * as L from 'leaflet';
import { Auth } from '../../services/auth/auth';
import {
  Establishment,
  EstablishmentCreate,
  Establishments,
} from '../../services/establishments/establishments';
import { ActiveEstablishmentService } from '../../services/establishments/active-establishment';
import { Alert } from '../../shared/alert/alert';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, FormsModule, Alert],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private static readonly DEFAULT_MAP_LAT = 19.432608;
  private static readonly DEFAULT_MAP_LON = -99.133209;

  establishments: Establishment[] = [];
  isLoading = true;
  isCreatingEstablishment = false;
  isResolvingAddress = false;
  isResolvingMapAddress = false;
  isLocatingUser = false;
  showCreateModal = false;
  currentCreateStep = 1;
  addressSuggestions: AddressSuggestion[] = [];
  addressSearchMessage = '';
  isSearchingAddresses = false;
  selectedAddressIndex = '';
  errorMessage = '';
  createErrorMessage = '';
  userName = '';
  establishmentForm = {
    nombre: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    latitud: Home.DEFAULT_MAP_LAT,
    longitud: Home.DEFAULT_MAP_LON,
  };
  private mapInstance: L.Map | null = null;
  private marker: L.Marker | null = null;
  private addressSearchTimeout: ReturnType<typeof setTimeout> | null = null;
  private addressSearchRequestId = 0;

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: Auth,
    private establishmentsService: Establishments,
    private activeEstablishmentService: ActiveEstablishmentService
  ) {}

  get isOwner(): boolean {
    return this.authService.isOwner();
  }

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userName = user.nombre;
    }

    const shouldOpenModal = this.route.snapshot.queryParamMap.get('createBusiness') === '1';
    if (shouldOpenModal) {
      this.openCreateModal();
      this.router.navigate([], {
        queryParams: { createBusiness: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }

    this.loadEstablishments();
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  goToNegocio(id: number): void {
    this.activeEstablishmentService.setEstablishmentId(id);
    this.router.navigate(['/app/negocio']);
  }

  retryLoad(): void {
    this.loadEstablishments();
  }

  openCreateModal(): void {
    this.resetCreateForm();
    this.showCreateModal = true;
    this.createErrorMessage = '';
    setTimeout(() => {
      if (this.currentCreateStep === 2) {
        this.initializeMap();
      }
    }, 0);
  }

  closeCreateModal(): void {
    if (this.isCreatingEstablishment) {
      return;
    }

    this.showCreateModal = false;
    this.createErrorMessage = '';
    this.clearAddressSearchTimer();
    this.destroyMap();
  }

  nextCreateStep(): void {
    if (!this.establishmentForm.nombre.trim()) {
      this.createErrorMessage = 'El nombre del negocio es obligatorio.';
      return;
    }

    this.createErrorMessage = '';
    this.currentCreateStep = 2;
    setTimeout(() => this.initializeMap(), 0);
  }

  previousCreateStep(): void {
    this.createErrorMessage = '';
    this.currentCreateStep = 1;
  }

  goToCreateStep(step: 1 | 2): void {
    if (step === 1) {
      this.previousCreateStep();
      return;
    }

    this.nextCreateStep();
  }

  onAddressInputChange(value: string): void {
    this.establishmentForm.direccion = value;
    this.selectedAddressIndex = '';
    this.scheduleAddressSearch();
  }

  createEstablishment(): void {
    if (this.currentCreateStep === 1) {
      this.nextCreateStep();
      return;
    }

    const user = this.authService.getUser();
    if (!user) {
      this.errorMessage = 'No se encontró sesión activa.';
      this.showCreateModal = false;
      return;
    }

    if (!this.establishmentForm.nombre.trim()) {
      this.createErrorMessage = 'El nombre del negocio es obligatorio.';
      return;
    }

    const payload: EstablishmentCreate = {
      nombre: this.establishmentForm.nombre.trim(),
      descripcion: this.establishmentForm.descripcion.trim() || undefined,
      direccion: this.establishmentForm.direccion.trim() || undefined,
      telefono: this.establishmentForm.telefono.trim() || undefined,
      latitud: this.establishmentForm.latitud,
      longitud: this.establishmentForm.longitud,
      usuario_id: user.usuario_id,
      activo: true,
    };

    this.isCreatingEstablishment = true;
    this.createErrorMessage = '';

    this.establishmentsService
      .createEstablishment(payload)
      .pipe(finalize(() => {
        this.isCreatingEstablishment = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (establishment) => {
          this.activeEstablishmentService.setEstablishmentId(establishment.establecimiento_id);
          this.establishments = [establishment, ...this.establishments];
          this.resetCreateForm();
          this.showCreateModal = false;
          this.destroyMap();
          this.goToNegocio(establishment.establecimiento_id);
        },
        error: (error) => {
          this.createErrorMessage = error?.error?.detail || 'No se pudo crear el negocio.';
        },
      });
  }

  async locateAddressOnMap(): Promise<void> {
    const address = this.establishmentForm.direccion.trim();
    if (!address) {
      this.createErrorMessage = 'Escribe una dirección para buscarla en el mapa.';
      return;
    }

    this.isResolvingAddress = true;
    this.createErrorMessage = '';
    this.addressSearchMessage = '';

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=es&q=${encodeURIComponent(address)}`,
      );

      if (!response.ok) {
        throw new Error('No se pudo consultar la dirección.');
      }

      const results = await response.json() as AddressSuggestion[];
      if (!results.length) {
        throw new Error('No se encontró esa dirección. Intenta con una más específica.');
      }

      this.addressSuggestions = results;
      this.selectAddressSuggestion(results[0]);
      this.updateMapPosition();
    } catch (error) {
      this.createErrorMessage = error instanceof Error
        ? error.message
        : 'No se pudo ubicar la dirección en el mapa.';
    } finally {
      this.isResolvingAddress = false;
      this.cdr.markForCheck();
    }
  }

  async searchAddressSuggestions(query: string): Promise<void> {
    const address = query.trim();
    this.addressSearchMessage = '';

    if (address.length < 3) {
      this.addressSuggestions = [];
      return;
    }

    this.isSearchingAddresses = true;
    const requestId = ++this.addressSearchRequestId;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=es&q=${encodeURIComponent(address)}`,
      );

      if (!response.ok) {
        throw new Error('No se pudo consultar la dirección.');
      }

      const results = await response.json() as AddressSuggestion[];
      if (requestId !== this.addressSearchRequestId) {
        return;
      }

      this.selectedAddressIndex = '';
      this.addressSuggestions = results;
      this.addressSearchMessage = results.length
        ? 'Selecciona una coincidencia para centrar el mapa.'
        : 'No se encontraron coincidencias.';
    } catch {
      if (requestId === this.addressSearchRequestId) {
        this.selectedAddressIndex = '';
        this.addressSuggestions = [];
        this.addressSearchMessage = 'No se pudo buscar direcciones en este momento.';
      }
    } finally {
      if (requestId === this.addressSearchRequestId) {
        this.isSearchingAddresses = false;
        this.cdr.markForCheck();
      }
    }
  }

  selectAddressSuggestion(suggestion: AddressSuggestion): void {
    this.clearAddressSearchTimer();
    this.establishmentForm.direccion = suggestion.display_name;
    this.establishmentForm.latitud = Number.parseFloat(suggestion.lat);
    this.establishmentForm.longitud = Number.parseFloat(suggestion.lon);
    this.selectedAddressIndex = '';
    this.addressSuggestions = [];
    this.addressSearchMessage = 'Ubicación seleccionada. Ajusta el marcador si lo necesitas.';
    this.updateMapPosition();
    void this.resolveAddressFromCoordinates();
    this.cdr.markForCheck();
  }

  selectAddressByIndex(indexValue: string | number): void {
    const index = Number(indexValue);
    if (Number.isNaN(index) || index < 0 || index >= this.addressSuggestions.length) {
      return;
    }

    this.selectAddressSuggestion(this.addressSuggestions[index]);
  }

  useCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.createErrorMessage = 'Tu navegador no soporta geolocalización.';
      return;
    }

    this.isLocatingUser = true;
    this.createErrorMessage = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.establishmentForm.latitud = Number(position.coords.latitude.toFixed(6));
        this.establishmentForm.longitud = Number(position.coords.longitude.toFixed(6));
        this.updateMapPosition();
        void this.resolveAddressFromCoordinates();
        this.isLocatingUser = false;
        this.cdr.markForCheck();
      },
      () => {
        this.createErrorMessage = 'No pudimos obtener tu ubicación. Revisa permisos del navegador.';
        this.isLocatingUser = false;
        this.cdr.markForCheck();
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  get mapExternalUrl(): string {
    return `https://www.openstreetmap.org/?mlat=${this.establishmentForm.latitud}&mlon=${this.establishmentForm.longitud}#map=15/${this.establishmentForm.latitud}/${this.establishmentForm.longitud}`;
  }

  private initializeMap(): void {
    const mapElement = document.getElementById('create-business-map');
    if (!mapElement || this.mapInstance) {
      return;
    }

    this.mapInstance = L.map(mapElement, {
      zoomControl: true,
      attributionControl: true,
    }).setView([this.establishmentForm.latitud, this.establishmentForm.longitud], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.mapInstance);

    this.marker = L.marker([this.establishmentForm.latitud, this.establishmentForm.longitud], {
      draggable: true,
      icon: L.divIcon({
        className: 'business-map-pin-wrapper',
        html: '<span class="business-map-pin"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    }).addTo(this.mapInstance);

    this.marker.on('dragend', () => {
      const current = this.marker?.getLatLng();
      if (!current) {
        return;
      }
      this.setCoordinates(current.lat, current.lng);
    });

    this.mapInstance.on('click', (event: L.LeafletMouseEvent) => {
      this.setCoordinates(event.latlng.lat, event.latlng.lng);
    });

    setTimeout(() => this.mapInstance?.invalidateSize(), 0);
  }

  private resetCreateForm(): void {
    this.currentCreateStep = 1;
    this.addressSuggestions = [];
    this.addressSearchMessage = '';
    this.isSearchingAddresses = false;
    this.selectedAddressIndex = '';
    this.createErrorMessage = '';
    this.clearAddressSearchTimer();
    this.establishmentForm = {
      nombre: '',
      descripcion: '',
      direccion: '',
      telefono: '',
      latitud: Home.DEFAULT_MAP_LAT,
      longitud: Home.DEFAULT_MAP_LON,
    };
  }

  private clearAddressSearchTimer(): void {
    if (this.addressSearchTimeout) {
      clearTimeout(this.addressSearchTimeout);
      this.addressSearchTimeout = null;
    }
  }

  private scheduleAddressSearch(): void {
    this.clearAddressSearchTimer();
    this.addressSearchMessage = '';
    this.addressSuggestions = [];

    this.addressSearchTimeout = setTimeout(() => {
      void this.searchAddressSuggestions(this.establishmentForm.direccion);
    }, 350);
  }

  private updateMapPosition(): void {
    if (!this.mapInstance || !this.marker) {
      return;
    }

    const latLng: L.LatLngExpression = [this.establishmentForm.latitud, this.establishmentForm.longitud];
    this.marker.setLatLng(latLng);
    this.mapInstance.setView(latLng, 15);
  }

  private setCoordinates(lat: number, lon: number): void {
    this.establishmentForm.latitud = Number(lat.toFixed(6));
    this.establishmentForm.longitud = Number(lon.toFixed(6));
    this.updateMapPosition();
    void this.resolveAddressFromCoordinates();
    this.cdr.markForCheck();
  }

  private async resolveAddressFromCoordinates(): Promise<void> {
    this.isResolvingMapAddress = true;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${this.establishmentForm.latitud}&lon=${this.establishmentForm.longitud}`,
      );

      if (!response.ok) {
        return;
      }

      const result = await response.json() as { display_name?: string };
      if (result.display_name) {
        this.establishmentForm.direccion = result.display_name;
      }
    } catch {
      // Silently ignore reverse geocoding errors to avoid blocking map interaction.
    } finally {
      this.isResolvingMapAddress = false;
      this.cdr.markForCheck();
    }
  }

  private destroyMap(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
      this.marker = null;
    }
  }

  private loadEstablishments(): void {
    this.isLoading = true;
    this.errorMessage = '';

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
          this.establishments = Array.isArray(establishments) ? establishments : [];
        },
        error: (error) => {
          if (error?.status === 408) {
            this.errorMessage = 'El servidor tardó demasiado en responder. Verifica tu conexión e inténtalo de nuevo.';
            return;
          }
          this.errorMessage =
            error?.error?.detail || 'No se pudieron cargar tus establecimientos.';
        },
      });
  }

  trackByEstablishmentId(index: number, establishment: Establishment): number {
    return establishment.establecimiento_id;
  }
}
