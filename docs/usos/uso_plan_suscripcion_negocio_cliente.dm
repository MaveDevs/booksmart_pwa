# Plan detallado: Suscripción para negocios + app de clientes finales

Fecha: 2026-03-19
Producto actual: Booksmart PWA (dueños, `rol_id=2`) + backend FastAPI
Canal faltante: app de clientes (`rol_id=3`) para reservas

---

## 1) Objetivo de negocio (qué debe lograr el plan)

### Objetivo principal
Convertir la suscripción en un motor de crecimiento para negocios (no solo acceso a funciones), aumentando:
- Reservas confirmadas
- Asistencia efectiva (menos no-show)
- Recompra de clientes
- Ticket mensual del negocio

### North Star Metric
**Reservas completadas por negocio por mes**

### KPIs de control
- Tasa de conversión de reserva: `confirmadas / solicitadas`
- Tasa de no-show: `no_show / confirmadas`
- Retención del cliente final: `% clientes que vuelven en 30 días`
- Ingreso por negocio: `sum(servicios completados)`
- Churn de negocio suscrito: `% cancelan suscripción`

---

## 2) Diseño comercial del plan (SaaS para negocios)

## Planes recomendados

### Starter (entrada)
- Agenda y servicios
- Confirmación manual de citas
- Recordatorios básicos
- Dashboard básico (ocupación, citas, ingresos)
- Límite sugerido: hasta X citas/mes o 1 local

### Growth (tracción)
- Todo Starter +
- Automatización de aceptación/rechazo por reglas
- Lista de espera automática
- Campañas de reactivación (clientes inactivos)
- Analítica intermedia (no-show por franja, conversión por servicio)

### Pro (escala)
- Todo Growth +
- Reglas avanzadas por segmento de cliente
- Recomendaciones inteligentes (franjas, precios, promos)
- Multi-sucursal y comparativos
- API/webhooks y reportes ejecutivos

## Add-ons (extras monetizables)
- WhatsApp/SMS transaccional
- Programa de fidelidad
- Reportes avanzados exportables
- Paquete de campañas automáticas

---

## 3) Modelo de producto 2 apps + 1 backend

## Componentes
1. **App Dueños (actual PWA):** operación del negocio, configuración, métricas, control de citas.
2. **App Clientes (nueva):** búsqueda, reserva, reprogramación, historial, reseñas.
3. **Backend compartido (FastAPI):** reglas, suscripciones, notificaciones, analítica, permisos por rol.

## Regla de oro de arquitectura
La lógica crítica (suscripción, reglas de auto-aceptación, KPIs) vive en backend; las apps solo consumen.

---

## 4) Implementación funcional por dominio

## A. Suscripciones y límites (backend primero)

### Qué implementar
- Entitlements por plan (qué puede usar cada negocio)
- Consumo mensual por feature (ej. automatizaciones ejecutadas)
- Estados de suscripción (`ACTIVA`, `PAUSADA`, `VENCIDA`, `CANCELADA`)
- Grace period (ej. 3-7 días)

### Tablas sugeridas (nuevas)
- `plan_feature` (plan_id, feature_code, limit_value)
- `subscription_usage` (subscription_id, period, feature_code, used)
- `billing_event` (subscription_id, event_type, amount, status)

### Endpoints sugeridos
- `GET /api/v1/subscriptions/me/entitlements?establishment_id=`
- `GET /api/v1/subscriptions/me/usage?establishment_id=`
- `POST /api/v1/subscriptions/{id}/renew`
- `POST /api/v1/subscriptions/{id}/cancel`

## B. Automatización de citas (core de valor)

### Estados recomendados de cita
`PENDIENTE` → `CONFIRMADA` → `COMPLETADA`
Con ramas: `RECHAZADA`, `CANCELADA`, `NO_SHOW`, `REPROGRAMADA`

### Reglas automáticas MVP
1. **Auto-aceptar** si:
   - Slot disponible
   - Agenda abierta
   - Servicio activo
   - Cliente sin bloqueo
2. **Auto-rechazar** si conflicto de horario/capacidad.
3. **Alternativas automáticas** al rechazar: proponer 2-3 horarios.
4. **Recordatorios** a 24h y 2h.
5. **Confirmación previa** del cliente (si no confirma, liberar slot).

### Tablas sugeridas
- `automation_rule` (establishment_id, event, condition_json, action_json, active)
- `appointment_event` (appointment_id, event_type, payload, created_at)
- `customer_risk_score` (cliente_id, score, reason, updated_at)

### Endpoints sugeridos
- `POST /api/v1/appointments/{id}/evaluate-rules`
- `POST /api/v1/automation-rules`
- `GET /api/v1/automation-rules?establishment_id=`
- `PUT /api/v1/appointments/{id}` (extender estados)

## C. Analítica como extra premium

### KPIs MVP (diarios y semanales)
- Ocupación por franja horaria
- Conversión de cita (`PENDIENTE -> CONFIRMADA`)
- No-show por servicio y franja
- Recompra 30/60/90 días
- Ingreso bruto por servicio

### Tablas sugeridas
- `metrics_daily_establishment` (date, establishment_id, kpi_code, value)
- `customer_cohort` (cohort_month, retained_d30, retained_d60, retained_d90)
- `recommendation_feed` (establishment_id, recommendation_type, data, score)

### Proceso técnico
- Jobs programados (cada noche) para agregaciones
- Endpoint de dashboard rápido sobre datos precalculados
- Recomendaciones automáticas basadas en umbrales

---

## 5) Qué construir en cada app

## App Dueños (PWA actual)

### Nuevas secciones
- **Suscripción:** plan actual, uso, upgrade/add-ons
- **Automatización:** editor simple de reglas (checkbox + condiciones)
- **Analítica:** dashboard KPI + recomendaciones accionables

### Flujos clave
1. Configurar reglas de auto-aceptación
2. Revisar cola de excepciones (casos no automatizados)
3. Ver alertas de rendimiento (sube no-show, baja ocupación)
4. Activar campaña sugerida (ej. huecos del martes)

## App Clientes (nueva)

### Funciones mínimas
- Buscar negocio y servicios
- Ver disponibilidad real
- Crear reserva
- Confirmar/reprogramar/cancelar
- Recibir notificaciones
- Calificar servicio

### Funciones growth
- Lista de espera
- Promociones personalizadas
- Historial y favoritos
- Programa de fidelidad

---

## 6) Roadmap de implementación (12 semanas)

## Fase 0 (Semana 1): Descubrimiento y diseño
- Definir precios, límites, catálogo de features por plan
- Definir eventos de negocio y métricas base
- Definir contrato API común para ambas apps

**Entregable:** documento de producto + contrato API versionado

## Fase 1 (Semanas 2-4): Base de suscripciones y estados de cita
- Entitlements por plan en backend
- Ampliar estados de cita y validaciones
- Pantalla de suscripción en PWA dueños

**Entregable:** negocio puede ver plan, límites y estados avanzados de cita

## Fase 2 (Semanas 5-7): Automatización MVP
- Motor de reglas (auto-aceptar/rechazar)
- Sugerencias de horarios alternativos
- Recordatorios y confirmación previa
- Cola de excepciones manual

**Entregable:** reducción de operación manual de citas

## Fase 3 (Semanas 8-10): Analítica MVP
- Jobs diarios de agregación
- Dashboard KPI en PWA
- Recomendaciones simples por umbral

**Entregable:** panel útil para decisiones semanales

## Fase 4 (Semanas 11-12): Integración con app clientes
- Consumo de disponibilidad y reservas
- Notificaciones bidireccionales
- Medición embudo completo (cliente->negocio)

**Entregable:** flujo cerrado entre app clientes y app dueños

---

## 7) Backlog aterrizado (épicas e historias)

## Épica 1: Monetización por suscripción
- Como dueño, quiero ver mi plan y límites para saber qué puedo usar.
- Como dueño, quiero hacer upgrade sin soporte manual.
- Como sistema, debo bloquear features premium cuando el plan vence.

## Épica 2: Motor de automatización de citas
- Como dueño, quiero activar auto-aceptación por reglas simples.
- Como dueño, quiero definir excepciones para clientes de riesgo.
- Como cliente, quiero recibir alternativas si mi horario no aplica.

## Épica 3: Analítica accionable
- Como dueño, quiero ver no-show por franja para ajustar agenda.
- Como dueño, quiero recomendaciones concretas (qué hacer y cuándo).
- Como producto, quiero medir impacto por plan para optimizar pricing.

## Épica 4: Integración app clientes
- Como cliente, quiero reservar en tiempo real.
- Como cliente, quiero confirmar/reprogramar sin fricción.
- Como dueño, quiero ver toda interacción del cliente en una línea de tiempo.

---

## 8) Detalle técnico de implementación (por capa)

## Backend FastAPI
- Crear módulo `subscriptions/entitlements`
- Crear módulo `automation/rules_engine`
- Extender módulo `appointments` con estados y eventos
- Crear módulo `analytics/aggregations`
- Crear cron jobs para métricas y recomendaciones
- Exponer endpoints para app dueños y app clientes

## Base de datos
- Nuevas tablas: `plan_feature`, `subscription_usage`, `automation_rule`, `appointment_event`, `metrics_daily_establishment`, `recommendation_feed`
- Índices críticos:
  - `(establishment_id, fecha, estado)` en citas
  - `(subscription_id, period, feature_code)` en uso
  - `(date, establishment_id, kpi_code)` en métricas

## App Dueños (Angular)
- Servicio `subscriptions.ts` (entitlements/usage)
- Servicio `automation.ts` (CRUD reglas)
- Servicio `analytics.ts` (dashboard + recomendaciones)
- Páginas nuevas:
  - `/app/subscription`
  - `/app/automation`
  - `/app/analytics`

## App Clientes (separada)
- Módulo de catálogo y disponibilidad
- Módulo de reserva y gestión de cita
- Módulo de notificaciones y rating
- Consumo de endpoints compartidos con permisos `rol_id=3`

---

## 9) Métricas de éxito por fase

## Meta a 90 días (objetivo realista)
- +20% reservas confirmadas por negocio
- -25% no-show en negocios con automatización activa
- +15% recompra a 30 días
- >30% adopción del plan Growth en negocios activos

## Métricas de producto interno
- % citas gestionadas automáticamente
- Tiempo promedio de respuesta a solicitud de cita
- % recomendaciones aceptadas por dueños
- ARPA (ingreso promedio por negocio suscrito)

---

## 10) Riesgos y mitigación

- **Riesgo:** automatización rechaza mal citas válidas.
  - Mitigación: cola de excepciones + auditoría de reglas + rollback por negocio.

- **Riesgo:** dashboards lentos por cálculo en vivo.
  - Mitigación: métricas precalculadas en jobs nocturnos + caché.

- **Riesgo:** app clientes y dueños desalineadas en estados.
  - Mitigación: contrato API único + catálogo central de estados.

- **Riesgo:** baja adopción de features premium.
  - Mitigación: trials de 14 días + nudges in-app por caso de uso.

---

## 11) Recomendación de lanzamiento comercial

1. Lanzar Starter para captación masiva.
2. Habilitar trial de Growth para dueños nuevos por 14 días.
3. Cobrar add-on de notificaciones transaccionales según volumen.
4. Mostrar valor con reportes semanales automáticos por email/push.

---

## 12) Primer sprint sugerido (2 semanas)

### Objetivo sprint
Tener base de suscripción utilizable + primer bloque de automatización MVP.

### Alcance sprint
- Backend:
  - `GET entitlements`
  - `GET usage`
  - Extensión de estados de cita
  - endpoint `evaluate-rules` (v1 con reglas básicas)
- App dueños:
  - vista `Suscripción` (plan + límites)
  - toggle de `Auto-aceptar` y `Auto-rechazar`
- QA:
  - pruebas de estados de cita
  - pruebas de bloqueo por plan

### Criterio de terminado
- Un negocio con plan Growth puede activar automatización y ver su consumo.
- Un negocio Starter no puede activar reglas premium.
- Se registran eventos de cita para analítica futura.

---

## 13) Decisiones clave que debes cerrar esta semana

1. Precio por plan y límites exactos (citas, locales, automatizaciones).
2. Si incluirás WhatsApp/SMS como add-on desde fase 1 o fase 2.
3. Definir política de no-show (depósito, confirmación previa, ventana de cancelación).
4. Elegir stack de app clientes (si Angular, Flutter o React Native) para estimar tiempos.

---

Este plan está diseñado para que el valor comercial (más reservas y menos no-show) se vea desde fase 2, sin esperar toda la analítica avanzada.

---

## 14) Auditoría técnica real del estado actual (2026-03-19)

Esta sección se basa en revisión directa de código actual de frontend (PWA) y backend.

## Frontend (PWA dueños) hoy
- Ya existe consumo de suscripciones en modo lectura (`getByEstablishment`) y se muestra estado/fechas.
- No existe módulo de pagos en frontend (no hay servicio `payments` ni UI de checkout).
- Gestión de citas soporta solo 4 estados: `PENDIENTE`, `CONFIRMADA`, `CANCELADA`, `COMPLETADA`.
- La pestaña de suscripción en negocio es informativa; no hay upgrade, renovación ni cobro.
- Mensajería en UI aún está en “próximamente”.

## Backend hoy
- Sí existe tabla/modelo/endpoints de `pago`, pero está ligada a `suscripcion_id`.
- Los pagos se crean/actualizan solo por `admin` (owner no inicia cobro directamente).
- Citas NO tienen vínculo a pago (no existe `payment_id`, `deposito`, `monto_pagado` en cita).
- `plan` actual es simple: nombre, descripción, precio, activo (sin límites/entitlements).
- `reporte` actual es descriptivo (texto), no un motor analítico de KPIs agregados.
- Migraciones Alembic visibles son mínimas (se observa solo una versión), por lo que nuevos cambios de esquema deben planearse con cuidado.

## Inconsistencias detectadas (importante)
- Documentación de roles y algunos campos no siempre coincide con el código real.
- Debes usar como fuente de verdad el código backend actual para evitar romper permisos.

---

## 15) Análisis de la idea: “incluir costo de reservas dentro de la suscripción”

## Interpretación recomendada para lanzar rápido
No cobrar al cliente final dentro de la app en esta fase. En su lugar:
- El negocio paga su suscripción mensual.
- La suscripción incluye “bolsa” de reservas procesadas (ej. 200/mes).
- Si supera cupo: cobra excedente por reserva (`pay-as-you-go`) al negocio, no al cliente.

## Por qué esta ruta es mejor para este fin de semana
- Reutiliza tu sistema actual de pagos de suscripción.
- Evita integrar pasarela de cobro al cliente final (más compleja y riesgosa).
- Evita meter compliance fiscal/PCI/KYC en este sprint.

## Si quieres cobrar al cliente final en app (alcance real)
Esto ya es otro proyecto (no de fin de semana):
- Nuevas entidades de transacción por cita.
- Integración pasarela (Stripe/MercadoPago/PayPal SDK + webhooks).
- Reglas de split/retención/comisión y conciliación.
- Manejo de reembolsos/disputas y estados de pago por cita.

---

## 16) ¿Qué tanto cambia realmente tu proyecto este fin de semana?

## Escenario A (recomendado): cobro por suscripción + cupos/excedentes
Impacto estimado: **MEDIO**

### Backend (cambio medio-alto)
1. Extender plan con límites:
  - `max_reservas_mes` (int)
  - `precio_reserva_extra` (decimal)
2. Crear tabla de uso mensual:
  - `subscription_usage` (suscripcion_id, periodo_yyyy_mm, reservas_consumidas, extras_consumidas)
3. Ajustar creación de cita:
  - Validar suscripción activa del establecimiento.
  - Incrementar consumo.
  - Si excede cupo, registrar `pago` por excedente (pendiente/completado según política).
4. Nuevos endpoints:
  - `GET /subscriptions/{id}/usage`
  - `GET /subscriptions/{id}/limits`
5. Jobs/cron opcional:
  - Reset o rollover de consumo mensual.

### Frontend PWA dueños (cambio medio)
1. En pestaña Suscripción mostrar:
  - Cupo mensual, consumido, restante, costo extra acumulado.
2. Alertas visuales:
  - 80% de consumo, 100% consumo, excedente activo.
3. CTA comercial:
  - Upgrade de plan o compra de paquete adicional.

### App clientes
- Casi sin cambios para esta fase (solo UX de mensajes de disponibilidad y estados).

## Escenario B: cobrar al cliente final por cada reserva
Impacto estimado: **ALTO/CRÍTICO** para fin de semana

### Backend
- Nuevas tablas de transacción por cita y webhooks.
- Máquinas de estado de pago (`PENDIENTE`, `AUTORIZADO`, `CAPTURADO`, `FALLIDO`, `REEMBOLSADO`).
- Seguridad antifraude, idempotencia y conciliación.

### Frontend
- Checkout seguro en app clientes.
- Confirmación condicionada a pago exitoso.
- Gestión de errores de pago, expiración, reintentos.

### Riesgo
- Alto riesgo de dejar flujo inestable sin pruebas E2E + sandbox del proveedor.

---

## 17) Plan de ejecución realista para este fin de semana

## Día 1 (backend-first)
- Migración DB: ampliar `plan` + crear `subscription_usage`.
- Endpoint de lectura de límites/uso.
- Hook en creación de citas para contabilizar consumo.

## Día 2 (frontend dueños + QA)
- UI de uso de suscripción en pestaña Suscripción.
- Mensajes de alerta por umbrales.
- Pruebas manuales con 2 planes (Starter/Growth) y negocio de prueba.

## Resultado esperable en 2 días
- Sí llegas a tener “costo por reserva como parte de suscripción” bajo modelo de cupo + excedente.
- No es realista llegar a “checkout del cliente final” robusto en ese mismo fin de semana.

---

## 18) Estimación de impacto por componente

- Backend API/CRUD/modelos: 35-45% de archivos de dominio suscripción/citas afectados.
- Base de datos: 2-3 cambios de esquema + índices.
- Frontend PWA dueños: 10-20% del módulo negocio (solo tab suscripción + badges/alertas).
- App clientes: 0-10% en escenario A, 40%+ en escenario B.

---

## 19) Recomendación final de alcance

Para este fin de semana implementa **Escenario A** (suscripción con cupo + excedentes). Es el mejor balance entre valor comercial y riesgo técnico.

Luego, en una fase separada, evalúa checkout del cliente final con pasarela real y pruebas completas.