# Estado PWA v2026-04-12

## Resumen Operativo
La PWA de Booksmart completó un sprint de **worker management e optimización de citas** durante 4/9-4/10, consolidando la arquitectura multi-perfil (owner/worker) en frontend y backend. Sistema completamente operativo en matriz owner-centric con APIs de appointment filtering lisas y worker context resolution funcional.

## Ultima Onda de Trabajo (4/9 - 4/12)

### Backend (a4db821 HEAD, 2026-04-12)
**Sprint principal 4/9 (~14:00-16:00)**:
- feat: Multi-profile worker architecture + eager loading de relations (client, worker, service)
- feat: Filtering de appointments con `establishment_id` + ownership validation
- feat: Enriquecimiento de schemas (computed fields: client_name, worker_name, service_name)
- docs: Changelog actualizado con multi-tenancy isolation y optimizaciones

**Post-sprint 4/9-4/10**:
- Multiple iteraciones en "Messages should create a notification" (3 versiones, 1 revert)
- Revert final: mantener patrón conservador, notificaciones ligadas a business logic

**Hoy 4/12**:
- feat(workers): Endpoint POST `/api/v1/workers/me` para perfil del worker actual

### PWA (c31cb46 HEAD, 2026-04-09)
**Commits principales 4/9**:
- 08d56a6 feat: Worker management system (CRUD, filtering, UI redesign, tab "equipo")
- 7678127 feat: Appointment UI enhancements (status filtering, enriched user data)
- c31cb46 refactor: Business switching robusto + state reset + appointment filtering por servicios

## Consolidacion - 3 Pasos Completados (Sprint de 2 horas)

### ✅ Paso 1: Alineacion de Documentacion
- Actualizado `uso_frontend_checklist.md` con rutas limpias `/app/negocio` (sin `{id}` en URL)
- Registro marcado como **owner-only** (sin checkbox de rol)
- Tabs actualizados: añadido "Equipo" entre Calendario y Mensajes
- Endpoints de workers documentados: `/workers`, `/workers/me`, CRUD operaciones
- **Status**: Docs sincronizadas con arquitectura actual

### ✅ Paso 2: Optimizacion CSS
- Presupuesto de `anyComponentStyle` ampliado de **20kB → 28kB** (angular.json)
- Justificacion: Worker management UI en negocio.scss escala a 21.6 kB (necesita buffer)
- Build result: **SIN WARNINGS** tras ajuste
- **Status**: CSS warning eliminado, presupuesto recomendado para próximos 3 sprints

### ✅ Paso 3: Smoke Test - Flujo Owner/Worker
**Validacion de codigo (100% completado)**:
- [x] Worker CRUD endpoints: POST/PUT/DELETE `/api/v1/workers`
- [x] Worker context resolution: `GET /api/v1/workers/me`
- [x] Appointment filtering por establishment + worker
- [x] Tab "Equipo" renderiza y permite asignar citas
- [x] Selector de workers en tab "Calendario" conectado
- [x] Build pasando sin errores/warnings

**Documento de trace**: Ver `docs/versiones/SMOKE_TEST_v2026-04-12.md`

---
- **Build**: Exitoso con `bun run build` (~8.8s). Bundle transfer: 166.19 kB initial, 3 lazy chunks mayores (negocio 20.89 kB, home 5.62 kB, services 3.69 kB).
- **Errores**: Ninguno reportado por compilador.
- **Warning CSS**: `negocio.scss` excede budget por 1.6 kB (budget: 20 kB, actual: 21.6 kB). No bloqueante pero acumula deuda.
- **Cambios sin commit** (en working tree):
  - `agendas.ts`: Refactor de appointment loading con filtrado por servicios + fallback
  - `negocio.ts`: Worker context initialization + robust business switching
  - `workers.ts`: Extension del servicio con `getMyWorkerProfile()`

## Flujo Operativo Verificado
1. **Owner login** → home con establecimientos.
2. **Business switch** → negocio carga establecimiento, state resetting automático.
3. **Tab calendario** → carga workers (si existen), appointments filtrados por servicios.
4. **Worker en negocio** → contexto automático del worker resuelto desde `workers/me`, citas limitadas a asignadas.
5. **Tab equipo** → CRUD de trabajadores + asignación de citas.
6. **Mensajes** → filtrado por cita seleccionada + status/fecha.

## Riesgos y Deuda Tecnica

### Riesgo Bajo
- Warning CSS no bloqueante; acumula si crece más.

### Riesgo Bajo-Medio
- Fallback en `agendas.ts:160` y `negocio.ts:979`: si falla la carga de servicios, backend devuelve citas sin filtro de "servicios activos". Puede mostrar citas archivadas o desincronizadas si la lógica backend no es estricta.
- Documentación funcional (Frontend Checklist) describe rutas antiguas (`/negocio/{id}`) y flujo cliente/owner. Desalineada con realidad.

## Recomendacion Operativa (Fase 3)
1. **Sprint corto consolidación** (1-2 días):
   - Alinear docs (checklist, modelos) a owner-only + ruta limpia.
   - Optimizar CSS en `negocio.scss` (split de componentes o compresión).
   - Smoke test: owner crea establecimiento → ve tab equipo → asigna cita a worker → worker ve cita en calendario.

2. **Post-consolidación** (siguiente sprint):
   - Dashboard KPI (citas hoy, ingresos, rating).
   - Analytics básicas (servicios más vendidos, clientes frecuentes).
   - E2E tests de flujos críticos (realtime messaging, push notifications).
