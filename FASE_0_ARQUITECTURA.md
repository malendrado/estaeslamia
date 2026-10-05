# FASE 0 — Definición y Arquitectura del MVP
## EstaEsLaMía.cl

---

## 1. Arquitectura general

Arquitectura de 3 capas, clásica y probada — no se justifica nada más complejo para un MVP que necesita validar negocio rápido.

```
┌─────────────────────────┐
│   Angular (SPA)          │  Cliente público (landing, formulario, dashboards)
│   Standalone components  │
└────────────┬─────────────┘
             │ HTTPS / REST + JSON
             ▼
┌─────────────────────────┐
│   NestJS (API REST)      │  Lógica de negocio, autenticación, matching engine
│   Módulos por dominio    │
└────────────┬─────────────┘
             │ TypeORM
             ▼
┌─────────────────────────┐
│   PostgreSQL              │  Persistencia relacional (integridad referencial)
└─────────────────────────┘
```

**Por qué esta arquitectura y no otra:**
- **Monolito modular en el backend**, no microservicios: con el volumen de un MVP, microservicios solo agregan latencia de red, complejidad de despliegue y coordinación de transacciones sin ningún beneficio real. Migrar módulos a servicios independientes más adelante es factible porque cada dominio (`providers`, `service-requests`, `leads`) ya vive en su propio módulo con límites claros.
- **REST sobre GraphQL**: el frontend tiene necesidades de datos predecibles y no anidadas (formularios, listados, dashboards simples). GraphQL agregaría complejidad de resolvers sin resolver un problema real hoy.
- **SPA Angular** separada del backend (no server-side rendering en el MVP) porque el foco de conversión inicial es el formulario de solicitud, no el SEO orgánico masivo — el SEO se aborda en Fase 5 con páginas estáticas específicas por categoría, no con SSR completo.

---

## 2. Estructura de carpetas

### Backend (NestJS)

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── common/
│   │   ├── entities/base.entity.ts       # id (uuid) + createdAt/updatedAt
│   │   ├── enums/                        # UserRole, ProviderStatus, etc.
│   │   ├── guards/                       # JwtAuthGuard, RolesGuard
│   │   ├── decorators/                   # @Roles(), @CurrentUser()
│   │   ├── filters/                      # HttpExceptionFilter
│   │   └── interceptors/                 # LoggingInterceptor
│   ├── database/
│   │   ├── data-source.ts                # DataSource para CLI de migraciones
│   │   ├── migrations/
│   │   └── seeds/
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── providers/
│       ├── categories/
│       ├── services/
│       ├── regions/
│       ├── communes/
│       ├── service-requests/
│       ├── leads/
│       └── admin/
├── test/
├── Dockerfile
└── package.json
```

Cada módulo de dominio sigue el mismo patrón interno:

```
providers/
├── dto/
│   ├── create-provider.dto.ts
│   └── update-provider.dto.ts
├── entities/
│   ├── provider.entity.ts
│   ├── provider-service.entity.ts
│   └── provider-commune.entity.ts
├── providers.controller.ts
├── providers.service.ts
└── providers.module.ts
```

### Frontend (Angular, standalone components)

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                # servicios singleton, interceptors HTTP, guards de ruta
│   │   │   ├── services/
│   │   │   ├── interceptors/
│   │   │   └── guards/
│   │   ├── shared/               # componentes/pipes reutilizables sin lógica de negocio propia
│   │   │   └── components/
│   │   │       ├── navbar/
│   │   │       ├── footer/
│   │   │       ├── service-card/
│   │   │       ├── provider-card/
│   │   │       ├── category-card/
│   │   │       ├── status-badge/
│   │   │       ├── loading/
│   │   │       ├── empty-state/
│   │   │       └── error-state/
│   │   ├── layout/               # shell de la aplicación (header + outlet + footer)
│   │   ├── auth/                 # login, registro
│   │   ├── home/                 # landing
│   │   ├── service-request/      # flujo público "Necesito un servicio"
│   │   ├── provider/              # dashboard provider
│   │   ├── admin/                 # dashboard admin
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── index.html
│   └── styles.scss
├── Dockerfile
└── package.json
```

Cada feature (`service-request`, `provider`, `admin`) es **lazy-loaded** vía `loadComponent`/`loadChildren` para mantener el bundle inicial liviano (importante para conversión mobile).

---

## 3. Modelo ER

```
Region 1───N Commune

Category 1───N Service

User 1───0..1 Provider              (un usuario con rol PROVIDER tiene un Provider)

Provider N───N Service   (vía ProviderService)
Provider N───N Commune   (vía ProviderCommune)

User(CUSTOMER) 1───N ServiceRequest

ServiceRequest N───1 Category
ServiceRequest N───1 Service
ServiceRequest N───1 Commune

ServiceRequest 1───N Lead
Provider       1───N Lead
```

Diagrama consolidado:

```
                     ┌─────────┐
                     │ Region  │
                     └────┬────┘
                          │ 1:N
                     ┌────▼────┐
                     │ Commune │◄───────────────┐
                     └────┬────┘                │ N:N
                          │ N:N (ProviderCommune)│
┌──────────┐        ┌─────▼──────┐        ┌─────┴────┐
│ Category │──1:N──►│  Service   │◄──N:N──┤ Provider │◄──1:1──┐
└──────────┘        └─────┬──────┘(ProviderService)  └────┬───┘        │
                          │                                  │ 1:N   ┌──┴───┐
                          │                                  ▼       │ User │
                          │                              ┌────────┐  └──┬───┘
                          └─────────────1:N──────────────►│  Lead  │◄────┘ 1:N
                                                            └───┬────┘        (customerId)
                                                                │
                                                     N:1 ┌──────▼───────┐
                                                         │ServiceRequest│
                                                         └──────────────┘
```

---

## 4. Modelo de datos por entidad

Convención general: PK `id UUID` en todas las tablas, `createdAt`/`updatedAt` (`timestamptz`) en todas salvo donde se indique.

### User
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| email | varchar(255) | **UNIQUE**, índice |
| passwordHash | varchar(255) | nullable (customer "silencioso" sin registro) |
| name | varchar(150) | |
| phone | varchar(30) | nullable |
| role | enum(CUSTOMER, PROVIDER, ADMIN) | |
| isActive | boolean | default true |

### Provider
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| userId | uuid | FK → User, **UNIQUE** (1:1) |
| businessName | varchar(200) | |
| legalName | varchar(200) | nullable |
| rut | varchar(20) | nullable |
| description | text | nullable |
| phone | varchar(30) | |
| email | varchar(255) | |
| website | varchar(255) | nullable |
| whatsapp | varchar(30) | nullable |
| logoUrl | varchar(500) | nullable |
| status | enum(PENDING, ACTIVE, SUSPENDED, REJECTED) | índice |

### Category
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| name | varchar(150) | |
| slug | varchar(170) | **UNIQUE**, índice (SEO: `/servicios/categoria`) |
| icon | varchar(100) | nullable |
| isActive | boolean | |
| order | int | orden de despliegue en landing |

### Service
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| categoryId | uuid | FK → Category, índice |
| name | varchar(150) | |
| slug | varchar(170) | **UNIQUE**, índice |
| isActive | boolean | |

### Region
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| name | varchar(150) | |
| code | varchar(20) | **UNIQUE** |

### Commune
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| regionId | uuid | FK → Region, índice |
| name | varchar(150) | |
| code | varchar(20) | **UNIQUE** |

### ProviderService (tabla puente)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| providerId | uuid | FK → Provider |
| serviceId | uuid | FK → Service, índice |
| — | — | índice **compuesto único** (providerId, serviceId) |

### ProviderCommune (tabla puente)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| providerId | uuid | FK → Provider |
| communeId | uuid | FK → Commune, índice |
| — | — | índice **compuesto único** (providerId, communeId) |

### ServiceRequest
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| customerId | uuid | FK → User |
| categoryId | uuid | FK → Category |
| serviceId | uuid | FK → Service, índice |
| communeId | uuid | FK → Commune, índice |
| description | text | |
| address | varchar(300) | nullable |
| preferredDate | date | nullable |
| budgetMin | numeric(12,0) | nullable |
| budgetMax | numeric(12,0) | nullable |
| contactName | varchar(150) | snapshot al momento de solicitar |
| contactEmail | varchar(255) | snapshot |
| contactPhone | varchar(30) | snapshot |
| consentAcceptedAt | timestamptz | consentimiento explícito (sección 33 del brief original) |
| status | enum(DRAFT, SUBMITTED, MATCHING, MATCHED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED) | índice |
| — | — | índice **compuesto** (serviceId, communeId, status) → es el filtro exacto del matching engine |

### Lead
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| serviceRequestId | uuid | FK → ServiceRequest |
| providerId | uuid | FK → Provider, índice |
| status | enum(GENERATED, DELIVERED, VIEWED, ACCEPTED, REJECTED, CONTACTED, CONVERTED, EXPIRED) | índice |
| price | numeric(12,0) | default 0, preparado para monetización futura |
| isPaid | boolean | default false |
| contactedAt | timestamptz | nullable |
| — | — | índice **compuesto único** (serviceRequestId, providerId) — evita leads duplicados |
| — | — | índice compuesto (providerId, status) — para el dashboard del provider |

**Nota sobre estados:** las transiciones de `ServiceRequest.status` y `Lead.status` se validan en el backend mediante tablas de transición explícitas (no se permite, por ejemplo, `CANCELLED → MATCHED` directamente).

---

## 5. Módulos NestJS

| Módulo | Responsabilidad |
|---|---|
| `AuthModule` | Registro, login, JWT, guards, `@CurrentUser()` |
| `UsersModule` | CRUD de usuarios (uso interno de otros módulos) |
| `ProvidersModule` | Registro/perfil de empresa, servicios ofrecidos, comunas de cobertura |
| `CategoriesModule` | CRUD de categorías (admin) + lectura pública |
| `ServicesModule` | CRUD de servicios (admin) + lectura pública |
| `RegionsModule` | Lectura pública (catálogo, no editable por ahora) |
| `CommunesModule` | Lectura pública |
| `ServiceRequestsModule` | Creación pública de solicitudes + consulta por customer/admin |
| `LeadsModule` | Contiene el **Matching Engine** como servicio de dominio; entrega/consulta de leads a providers |
| `AdminModule` | Métricas agregadas y endpoints de gestión transversal |

`LeadsModule` importa `ServiceRequestsModule` y `ProvidersModule` para ejecutar el matching (`ProviderService`/`ProviderCommune` + estado `ACTIVE`) inmediatamente después de que una `ServiceRequest` pasa a `SUBMITTED`.

---

## 6. Módulos Angular

| Área | Contenido |
|---|---|
| `core` | `AuthService`, `TokenInterceptor`, `AuthGuard`, `RoleGuard` |
| `shared` | Componentes de presentación puros (cards, badges, estados vacíos/error/carga) |
| `layout` | Navbar + footer + outlet, distinto según sesión (público/customer/provider/admin) |
| `home` | Landing pública |
| `service-request` | Wizard de 4-5 pasos: categoría → servicio → comuna → detalle → contacto/confirmación |
| `provider` | Login/registro de empresa, dashboard de leads, detalle de lead |
| `admin` | Dashboard de métricas + CRUDs de catálogo |
| `auth` | Login/registro compartido (customer y provider) |

Todas las áreas de feature son **standalone + lazy loaded** vía `app.routes.ts`.

---

## 7. Flujo completo del MVP

1. Usuario entra a `estaeslamia.cl` → ve landing con CTA "Necesito un servicio".
2. Selecciona categoría → servicio → región/comuna (todo desde catálogo en BD, no hardcodeado).
3. Completa descripción, fecha y presupuesto aproximados (opcionales).
4. Ingresa nombre, email, teléfono.
5. Acepta consentimiento explícito → envía.
6. Backend: crea (si no existe) un `User` rol CUSTOMER "silencioso" (`isActive=false`, sin password) + crea `ServiceRequest` con `status=SUBMITTED`.
7. `LeadsModule` ejecuta el matching: busca `Provider` con `status=ACTIVE` que tengan `ProviderService` para ese `serviceId` **y** `ProviderCommune` para ese `communeId`.
8. Por cada match, se crea un `Lead` (`status=GENERATED` → `DELIVERED`). `ServiceRequest.status` pasa a `MATCHED` (o queda `SUBMITTED` si no hubo matches).
9. Usuario recibe confirmación con número de solicitud y cantidad de empresas encontradas.
10. Provider inicia sesión → ve su dashboard con el nuevo lead → lo abre → ve los datos de contacto → cambia el estado del lead (`VIEWED` → `CONTACTED`, etc.).
11. Admin puede ver la solicitud, los providers, los leads generados y métricas agregadas.

---

## 8. Decisiones arquitectónicas clave

- **UUID como PK en todo**: evita IDs adivinables en URLs de leads/solicitudes (dato sensible) y no genera fricción para un futuro escenario multi-tenant.
- **TypeORM con migraciones explícitas, `synchronize: false` siempre**: el modelo va a evolucionar (pagos, suscripciones, leads exclusivos) y necesitamos historial de schema confiable en todo ambiente, incluyendo producción.
- **Enums + tablas de transición de estado en backend**: ningún estado se cambia por string libre desde el frontend; toda transición pasa por una validación de dominio.
- **Cliente sin registro obligatorio**: se resuelve creando un `User` CUSTOMER inactivo asociado a la solicitud, sin duplicar modelo de datos ni crear una entidad "Lead público" paralela.
- **Matching síncrono y simple** (sin colas, sin IA): se ejecuta en el mismo request de creación de la solicitud. Es intencionalmente naive — el objetivo de esta fase es validar negocio, no precisión algorítmica.
- **Datos de contacto visibles de inmediato al provider en el MVP**, pero modelados (`Lead.isPaid`, `Lead.price`) para poder ocultarlos detrás de un pago sin cambiar el schema después.

---

## 9. Riesgos

**Técnicos**
- Comunas con poca cobertura de providers → leads sin matches, mala primera impresión. Mitigación: seed inicial con cobertura amplia en zonas piloto.
- Duplicidad de `User` si un customer "silencioso" luego se registra con el mismo email → requiere `UNIQUE(email)` desde el día uno (ya contemplado) y lógica de "reclamar cuenta" en fase posterior.
- Migraciones manuales (no autogeneradas) exigen disciplina: todo cambio de entidad debe ir acompañado de su migración correspondiente.

**De negocio**
- Sin retroalimentación de providers (tasa de respuesta, conversión) es difícil demostrar valor del lead — vale la pena instrumentar analítica básica desde ya, aunque el brief pidió no incluir features avanzadas.
- Leads de baja calidad/intención (spam) dañan la percepción de valor ante empresas de pago. Mitigación mínima en MVP: descripción obligatoria + consentimiento explícito.
- Validar "empresas dispuestas a pagar" requiere que el dashboard del provider comunique valor claramente aunque no haya cobro todavía (fricción de percepción, no técnica).

---

## 10. Roadmap

| Fase | Contenido |
|---|---|
| **Fase 1** | Repo, Docker, PostgreSQL, entidades TypeORM, migración inicial, seeds (regiones/comunas, categorías/servicios, providers/customers/leads ficticios), Angular workspace arrancando |
| **Fase 2** | Auth (JWT, guards, roles), CRUD admin de catálogo (categorías, servicios, regiones, comunas), registro/perfil de Provider |
| **Fase 3** | Formulario público de ServiceRequest, Matching Engine, generación de Leads, endpoints de consulta |
| **Fase 4** | Dashboard Provider, Dashboard Customer, Dashboard Admin (métricas + CRUDs restantes) |
| **Fase 5** | Landing final, SEO (slugs, meta tags, OG), UX/responsive, testing (auth, matching, permisos), seguridad (rate limiting, helmet, CORS), documentación Swagger completa |

Cada fase debe quedar funcional end-to-end antes de avanzar a la siguiente.

---

**Quedo a la espera de tu aprobación de esta Fase 0 antes de comenzar la implementación de Fase 1.**
