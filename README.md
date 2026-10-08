# EstaEsLaMía.cl — MVP

Plataforma de generación de leads para empresas y profesionales de servicios.
Flujo: **Necesidad del cliente → Solicitud → Matching → Leads → Provider**

## Estado del proyecto: FASE 1 y FASE 2 completadas

**Fase 1**
- ✅ Estructura de repo (backend NestJS + frontend Angular) como npm workspace
- ✅ Entidades TypeORM: User, Provider, ProviderService, ProviderCommune, Category,
  Service, Region, Commune, ServiceRequest, Lead
- ✅ Migración inicial (todas las tablas, enums, índices y FKs)
- ✅ Seeds: regiones/comunas de Chile, categorías/servicios, 11 providers ficticios,
  3 customers ficticios, 2 service requests y leads de ejemplo
- ✅ Docker Compose (Postgres + backend + frontend)
- ✅ Angular workspace arrancando (shell mínimo, standalone components)

**Fase 2**
- ✅ Auth JWT (registro, login, guards por rol)
- ✅ CRUD admin de categorías/servicios; lectura pública de regiones/comunas
- ✅ Registro y perfil de Provider (servicios + comunas de cobertura)

**Fase 3**
- ✅ Formulario público de `ServiceRequest` (sin registro obligatorio, crea customer "silencioso")
- ✅ Matching Engine (servicio + comuna + provider ACTIVE), se ejecuta al crear la solicitud
- ✅ Generación automática de `Lead`s + endpoints de consulta (provider y admin)
- ✅ Tests: integración del matching engine (escenarios A/B/C del brief) + unitarios de reglas de negocio y permisos

**Fase 4**
- ✅ Frontend Angular completo: landing con CTAs reales, wizard público de solicitud (mat-stepper), confirmación
- ✅ Auth en el frontend: login, registro customer (reclama cuenta "silenciosa" si ya existía), registro provider
- ✅ Dashboard Provider: resumen + lista de leads, detalle con avance de estado, perfil (datos + servicios + comunas)
- ✅ Dashboard Customer: mis solicitudes + detalle con empresas encontradas
- ✅ Dashboard Admin: resumen (métricas + leads por categoría/comuna), solicitudes, leads, empresas (aprobar/rechazar/suspender), categorías y servicios (CRUD)
- ⏳ Fase 5 en adelante: SEO, pulido UX/responsive, testing e2e de frontend, seguridad y documentación final

## Requisitos

- Node.js 20+ y npm 10+
- Docker y Docker Compose (recomendado para la base de datos)

## Workspace

Este repo es un **npm workspace** único: `backend` (API NestJS) y `frontend`
(APP Angular) viven en el mismo repositorio, comparten `node_modules` en la
raíz, y se instalan/ejecutan con un solo comando desde el root. No hay
paquete compartido (`shared`) por decisión explícita — API y APP se mantienen
independientes en su código, solo comparten la infraestructura del workspace.

```
estaeslamia/
├── package.json          # workspace root (scripts api:*, app:*, dev)
├── docker-compose.yml
├── .env.example
├── backend/               # API — NestJS
└── frontend/              # APP — Angular
```

## Levantar el proyecto (todo desde la raíz)

```bash
cp .env.example .env
# editar .env si es necesario (JWT_SECRET, credenciales DB, etc.)

npm run setup
# equivale a: npm install (hidrata backend + frontend) + levanta Postgres
# + corre migraciones + corre seed

npm run dev
# levanta Postgres (si no está arriba) y corre API + APP en paralelo
```

- Backend: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Frontend: http://localhost:4200

### Scripts disponibles en la raíz

| Comando | Qué hace |
|---|---|
| `npm run setup` | Instala dependencias de todo el workspace, levanta Postgres, corre migraciones y seed |
| `npm run dev` | Corre API + APP en paralelo (requiere Postgres arriba) |
| `npm run api:dev` | Solo la API en modo watch |
| `npm run app:dev` | Solo la APP (Angular dev server) |
| `npm run api:migration:run` | Corre migraciones pendientes |
| `npm run api:seed` | Corre el seed de datos de demostración |
| `npm run db:up` / `npm run db:down` | Levanta/detiene solo Postgres vía Docker |
| `npm run api:build` / `npm run app:build` | Build de producción de cada app |

También se puede levantar todo con Docker (usa el mismo workspace dentro de cada contenedor):

```bash
docker compose up --build
```

## Estructura

Ver `backend/src/modules/*` para cada dominio y `frontend/src/app/*` para cada
feature. Detalles de arquitectura, modelo ER y decisiones de diseño en
`FASE_0_ARQUITECTURA.md`.

## Detalle de Fase 2

Además de lo entregado en Fase 1, ahora incluye:

- ✅ **Auth JWT**: registro/login/`me`, guards por rol (`JwtAuthGuard` + `RolesGuard` + `@Roles()`)
- ✅ **CRUD admin de catálogo**: categorías y servicios (crear/editar/desactivar, slug automático), regiones y comunas (solo lectura pública por ahora)
- ✅ **Registro y perfil de Provider**: alta transaccional (User + Provider en un solo paso), edición de perfil propio, gestión de servicios y comunas de cobertura, aprobación/rechazo/suspensión por parte de ADMIN

### Endpoints principales

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/auth/register` | público | Registro de CUSTOMER |
| POST | `/auth/login` | público | Login (cualquier rol) |
| GET | `/auth/me` | autenticado | Usuario actual |
| GET | `/categories` | público | Categorías activas |
| GET/POST/PATCH/DELETE | `/categories/...` | ADMIN (mutaciones) | CRUD de categorías |
| GET | `/services?categoryId=` | público | Servicios activos, filtrable |
| GET/POST/PATCH/DELETE | `/services/...` | ADMIN (mutaciones) | CRUD de servicios |
| GET | `/regions`, `/communes?regionId=` | público | Catálogo geográfico |
| POST | `/providers/register` | público | Alta de empresa (User + Provider) |
| GET/PATCH | `/providers/me` | PROVIDER | Perfil propio |
| PUT | `/providers/me/services` | PROVIDER | Reemplaza servicios ofrecidos |
| PUT | `/providers/me/communes` | PROVIDER | Reemplaza comunas de cobertura |
| GET | `/providers`, `/providers/:id` | ADMIN | Listado/detalle de providers |
| GET | `/providers/featured` | público | Providers destacados para la landing (sin datos de contacto directo) |
| GET | `/stats/public` | público | Cifras agregadas para la landing (categorías, servicios, empresas activas, comunas cubiertas) |
| PATCH | `/providers/:id/status` | ADMIN | Aprobar/rechazar/suspender |

Todos documentados con detalle (DTOs, respuestas, auth Bearer) en Swagger: `http://localhost:3000/api/docs`.

Credenciales de prueba del seed:
- **Admin**: `admin@estaeslamia.cl` / `Demo1234!`
- **Providers**: cualquiera de los 11 ficticios usa `Demo1234!` (ver emails en `backend/src/database/seeds/run-seed.ts`)
- Los customers ficticios no tienen password (cuentas "silenciosas"); para verlas en `/mis-solicitudes` hay que registrarse con ese mismo email desde `/registro` — la cuenta se "reclama" automáticamente.

## Detalle de Fase 3

**Flujo de creación de una ServiceRequest:**
1. `POST /service-requests` (público) valida consentimiento, presupuesto y que el servicio pertenezca a la categoría indicada
2. Crea (o reutiliza) un `User` CUSTOMER "silencioso" a partir del email de contacto
3. Guarda la `ServiceRequest` en `SUBMITTED`
4. Ejecuta el Matching Engine (`MatchingService`: provider `ACTIVE` + ofrece el `serviceId` + cobertura en el `communeId`) en el mismo request, sin colas
5. Genera un `Lead` por cada provider compatible (`DELIVERED`) y sube la solicitud a `MATCHED` si hubo al menos un match
6. Responde `{ id, status, matchesCount }` — el número de solicitud para seguimiento

### Endpoints nuevos

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/service-requests` | público | Crea la solicitud y dispara el matching |
| GET | `/service-requests/:id/summary` | público | Resumen seguro (sin datos de contacto) para la pantalla de confirmación |
| GET | `/service-requests` | ADMIN | Listado filtrable por status/servicio/comuna |
| GET | `/service-requests/:id` | ADMIN | Detalle completo, incluyendo contacto |
| PATCH | `/service-requests/:id/status` | ADMIN | Cambia el estado (transición validada) |
| GET | `/leads/mine` | PROVIDER | Mis leads (filtrable por status) |
| GET | `/leads/mine/:id` | PROVIDER | Detalle de un lead propio (marca `VIEWED` automáticamente) |
| PATCH | `/leads/mine/:id/status` | PROVIDER | Avanza el estado de un lead propio |
| GET | `/leads` | ADMIN | Listado filtrable por status/provider |
| GET | `/leads/by-service-request/:id` | ADMIN | Leads generados para una solicitud |

### Tests

```bash
# Unitarios (reglas de negocio + guards, sin DB)
npm run api:test

# Integración del Matching Engine (requiere Postgres arriba + migraciones aplicadas)
npm run api:test:e2e
```

El test de integración reproduce exactamente el escenario del brief: Provider A (Gasfitería + Quintero) matchea, Provider B (Electricidad + Quintero) no matchea por servicio distinto, Provider C (Gasfitería + Santiago) no matchea por comuna distinta, y un provider `SUSPENDED` nunca matchea.

## Detalle de Fase 4

**Rutas del frontend:**

| Ruta | Quién | Descripción |
|---|---|---|
| `/` | público | Landing |
| `/solicitar` | público | Wizard de solicitud (categoría → servicio → comuna → detalle → contacto) |
| `/solicitud/:id` | público | Confirmación con número de solicitud y empresas encontradas |
| `/login`, `/registro`, `/proveedores/registro` | público | Auth |
| `/mis-solicitudes`, `/mis-solicitudes/:id` | CUSTOMER | Dashboard cliente |
| `/proveedor`, `/proveedor/leads/:id`, `/proveedor/perfil` | PROVIDER | Dashboard empresa |
| `/admin`, `/admin/solicitudes`, `/admin/leads`, `/admin/providers`, `/admin/categorias` | ADMIN | Dashboard admin |

**Backend — ajustes que hizo posible el frontend:**
- `AuthService.register` ahora activa una cuenta CUSTOMER "silenciosa" existente (creada al enviar una solicitud sin registro) en vez de rechazar el registro por conflicto — así un cliente puede crear su cuenta después y ver el historial de lo que ya había solicitado.
- `GET /service-requests/mine` y `GET /service-requests/mine/:id` (CUSTOMER): solicitudes propias y detalle con las empresas encontradas.
- `GET /providers/me` ahora incluye `providerServices`/`providerCommunes` para que el frontend pre-seleccione lo ya guardado.
- Las consultas de `Lead` cargan `serviceRequest.service/commune/category` para evitar requests adicionales desde el frontend.

**Notas de implementación:**
- Sesión persistida en `localStorage` (token + datos básicos del usuario) — es un proyecto real, no un artifact de la interfaz, así que esto es lo esperado.
- `authInterceptor` adjunta el Bearer token a toda request hacia `environment.apiUrl`.
- `roleGuard` protege rutas por rol vía `data: { roles: [...] }`.
- El customer del wizard público sigue sin necesitar cuenta; solo se le ofrece crear una en la pantalla de confirmación.

## Identidad visual

- Paleta inspirada en las fachadas de los cerros de Valparaíso (turquesa `#0E8388`, coral `#FF6B4A`, mostaza `#FFB100`, púrpura `#6C4AB6`), definida como variables CSS en `frontend/src/styles.scss`.
- Tipografía: **Fraunces** (titulares) + **Plus Jakarta Sans** (cuerpo/UI).
- Los componentes de Angular Material (botones, checkboxes, stepper, spinner, focus de inputs) están "reskineados" globalmente en `styles.scss` para usar esta paleta en vez del indigo por defecto — se aplica a toda la app (landing, auth, wizard, dashboards) sin tocar cada componente individualmente.
- Las tarjetas de métricas (dashboard Provider y Admin) usan un acento de color distinto por tarjeta en vez de un solo color plano.

## Paginación (admin)

`GET /service-requests`, `GET /leads` y `GET /providers` (todos ADMIN) aceptan `page`/`limit` (por defecto 20, máx. 500) y devuelven:
```json
{ "data": [...], "total": 137, "page": 1, "limit": 20 }
```
El dashboard de Admin (`/admin/solicitudes`, `/admin/leads`, `/admin/providers`) usa un componente `PagerComponent` compartido (Anterior/Siguiente + rango). El resumen (`/admin`) pide un límite alto (500) solo para calcular sus métricas y desgloses en el cliente — para volúmenes más grandes que eso, lo correcto sería un endpoint de agregación en el backend (`GROUP BY` en SQL), documentado como pendiente en el propio código.

## Detalle de Fase 5 (en curso)

### SEO

**Limitación honesta primero**: el frontend es una SPA Angular sin SSR (decisión de Fase 0). Esto significa que el HTML inicial no trae contenido — el indexado orgánico real en buscadores depende de que el crawler ejecute JS. Lo que sí queda resuelto:

- `SeoService` (`core/services/seo.service.ts`): título de pestaña, meta description, Open Graph, Twitter Card y `<link rel="canonical">` dinámicos por página.
- Por defecto **todo es `noindex`** (`index.html`); las páginas que llaman a `SeoService.set(...)` sin `noindex: true` quedan indexables — hoy son `/`, `/solicitar` y `/servicios/:slug`. `/solicitud/:id` es explícitamente `noindex` (contiene un ID transaccional).
- **`/servicios/:slug`**: página real por servicio (no contenido delgado/auto-generado — reutiliza el flujo "cómo funciona" con copy específico del servicio), con CTA que prellena el wizard vía query params (`?categoryId=&serviceId=`). Esto es exactamente lo que pedía el brief original (`/servicios/gasfiteria`, etc.) sin generar miles de páginas vacías.
- `robots.txt` (estático, en `frontend/src/robots.txt`) bloquea `/admin`, `/proveedor`, `/mis-solicitudes` y `/solicitud/`.
- `GET /sitemap.xml` (backend, público, excluido de Swagger) genera el sitemap dinámicamente a partir de los servicios activos — se actualiza solo cuando se agregan/desactivan servicios desde el admin. **Nota de despliegue**: como frontend y backend son apps separadas, en producción hay que enrutar `/sitemap.xml` del dominio del frontend hacia el backend (regla de reverse proxy), igual que se hace con `/api/*`.
- Si más adelante se quiere indexado orgánico serio, el siguiente paso natural es migrar a **Angular Universal (SSR)** — la estructura actual (rutas + `SeoService`) no debería requerir rehacerse.

**Bug corregido: `og:image` apuntaba a un archivo que no existía.** `frontend/src/assets/og-cover.png` (1200×630, el tamaño estándar) ya está creado — con el logo, el wordmark y el tagline, en la misma paleta de la landing.

**Otro hallazgo al revisar esto**: `index.html` no tenía **ninguna** etiqueta Open Graph estática — solo las dinámicas que agrega `SeoService` después de que Angular arranca. El problema es que la mayoría de los bots que generan la vista previa al compartir (WhatsApp, Discord, iMessage) **no ejecutan JavaScript**, así que nunca veían esas etiquetas. Ya se agregaron `og:title`/`og:description`/`og:image`/`twitter:*` estáticos directo en `index.html` — cubren al menos la home. Las rutas internas (`/servicios/:slug`, etc.) heredan esta misma preview genérica hasta que haya SSR; es una limitación conocida de una SPA pura, no un bug adicional.

### Seguridad

- **Bug corregido**: `ThrottlerGuard` nunca estaba registrado como guard global — todo el rate limiting configurado (incluyendo `THROTTLE_TTL`/`THROTTLE_LIMIT` del `.env`, que tampoco se leían) no tenía efecto real. Ahora está registrado vía `APP_GUARD` y el módulo lee la config correctamente.
- Límites más estrictos que el default (100 req/min/IP) en endpoints sensibles:
  - `POST /auth/login`: 10/min/IP
  - `POST /auth/register`, `POST /providers/register`: 5/min/IP
  - `POST /service-requests`: 10/min/IP (evita spam de solicitudes/leads falsos)
- `.env.example` documenta que `CORS_ORIGIN` debe ser el dominio real en producción (nunca `*`, incompatible además con `credentials: true`).

### Testing e2e (Playwright)

```bash
cd frontend
npx playwright install   # una sola vez, descarga los navegadores
npm run e2e              # requiere API + APP corriendo (npm run dev desde la raíz) y seed aplicado
npm run e2e:ui           # modo interactivo
```

Specs en `frontend/e2e/`:
- `landing.spec.ts`: hero, CTAs, categorías populares cargadas del backend
- `service-request-wizard.spec.ts`: flujo completo del wizard hasta la confirmación, y bloqueo si no se acepta el consentimiento
- `auth.spec.ts`: login admin/provider, credenciales inválidas, protección de rutas por rol (`roleGuard`)

### UX/responsive

- Navbar con menú hamburguesa en mobile (`< 720px`) en vez de comprimir los links.
- Tablas de los dashboards (admin y provider) envueltas en un contenedor con scroll horizontal en mobile, en vez de comprimir columnas hasta ser ilegibles.

### Seguridad: JWT_SECRET

El servidor **se niega a arrancar en producción** (`NODE_ENV=production`) si `JWT_SECRET` es el valor por defecto o tiene menos de 32 caracteres (ver `assertSecureJwtSecretInProduction` en `backend/src/main.ts`). Genera uno real antes de desplegar:
```bash
openssl rand -base64 48
```

### Páginas legales

- `/terminos` y `/privacidad` — contenido específico a lo que la plataforma realmente hace (no una plantilla genérica), enlazadas desde el footer, el checkbox de consentimiento del wizard, y ambos formularios de registro.
- **No reemplazan una revisión legal real** — la plataforma recolecta datos personales y aplica la Ley 19.628 (Chile); se recomienda que un abogado las revise antes de un lanzamiento con usuarios reales.

### Anti-spam: Cloudflare Turnstile

Protege los 3 formularios públicos que crean datos (solicitudes, registro de cliente, registro de empresa) contra bots — el rate limiting por IP solo frena volumen, no bots bien hechos.

**Cómo activarlo:**
1. Crea un sitio gratis en [Cloudflare Turnstile](https://dash.cloudflare.com/) → Turnstile → Add site
2. Backend: agrega `TURNSTILE_SECRET_KEY` a tu `.env`
3. Frontend: agrega tu site key en `frontend/src/environments/environment.ts` → `turnstileSiteKey`

**Sin configurar (desarrollo):** todo funciona igual, sin widget visible — el backend omite la verificación automáticamente (con una advertencia en el log, para que no se te olvide activarlo en producción) y el frontend no bloquea el envío de los formularios.

**Dónde está implementado:**
- `backend/src/common/services/turnstile.service.ts` — verifica el token contra la API de Cloudflare
- `POST /service-requests`, `POST /auth/register`, `POST /providers/register` — los 3 endpoints protegidos
- `POST /auth/login` **no** lleva Turnstile a propósito (mejor UX para quien vuelve a entrar; ya cubierto por rate limiting)
- `frontend/src/app/shared/components/turnstile/turnstile.component.ts` — widget reutilizable

### Gaps de producto cerrados

**Gestión de usuarios (Admin)** — `GET /users` (paginado, filtro por rol/estado), `GET /users/:id`, `PATCH /users/:id/status` (suspender/reactivar). UI en `/admin/usuarios`. No permite "reactivar" una cuenta silenciosa (sin contraseña): esas solo se activan cuando el dueño se registra de verdad. El `User` expone un campo seguro `hasPassword` (solo un booleano, nunca el hash) para que el frontend pueda distinguir una cuenta silenciosa de una suspendida.

**Analytics propio** — sin cookies ni servicios de terceros: tabla `analytics_events` (solo tipo de evento + ruta + fecha, nada personal). 5 eventos del embudo: `PAGE_VIEW_HOME` → `WIZARD_STARTED` → `SERVICE_REQUEST_CREATED`, más `CUSTOMER_REGISTERED` y `PROVIDER_REGISTERED`. `POST /analytics/event` es público (fire-and-forget, nunca muestra errores al usuario), `GET /analytics/summary` es solo ADMIN y alimenta la sección "Embudo de conversión" de `/admin`. Requiere correr la migración nueva (`npm run api:migration:run`).

**Monitoreo de errores (Sentry)** — backend (`@sentry/node`, con un filtro global que reporta solo errores 5xx reales, nunca 400/401/404 esperados) y frontend (`@sentry/angular`, reemplaza el `ErrorHandler` por defecto). Sin `SENTRY_DSN` / `environment.sentryDsn` configurados es un no-op seguro.

**Subida de logo** — `POST /providers/me/logo` (PROVIDER, multipart, JPG/PNG/WEBP/SVG, máx. 2 MB) sube a **Supabase Storage** vía su API REST; el `SERVICE_ROLE_KEY` queda solo en el backend. Los SVG se sanitizan en el backend (se quita `<script>`, atributos `on*=` y `javascript:` en links) antes de subirlos, ya que un SVG es XML y puede traer contenido ejecutable. Setup: crear un bucket **público** llamado `provider-logos` en Supabase → Storage, y configurar `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` en el `.env`. El logo se muestra en el perfil del provider y en las tarjetas de "Empresas destacadas" de la landing.

**Decisión de diseño a notar (Turnstile)**: si la llamada a Cloudflare falla por red, el backend **rechaza** la solicitud en vez de dejarla pasar ("fail closed"). Es lo más seguro (un atacante no puede saltarse el CAPTCHA provocando que falle la verificación), con el costo de que una caída de Cloudflare bloquearía registros legítimos mientras dure.

**Tests nuevos**: `TurnstileService` (5 casos: bypass en dev, token faltante, válido, rechazado, caída de red) y `UsersService` (regla de no activar cuentas silenciosas). Además se corrigió el test de `ServiceRequestsService`, que se había roto al agregar `TurnstileService` al constructor sin actualizar su mock.

### Pendiente de Fase 5

1. ~~Documentación Swagger~~: completada — todos los endpoints (`auth`, `service-requests`, `providers`, `leads`, `categories`, `services`) tienen `@ApiResponse` (200/201/400/401/403/404/409/429) documentando sus respuestas reales.
2. ~~Revisión final de accesibilidad~~: completada — el contraste de color ya estaba resuelto (`--eslm-accent-ink`/`--eslm-accent-2-ink` en `styles.scss`, oscurecidos para cumplir 4.5:1 AA como texto). El gap real era foco de teclado: las filas clicables de las 4 tablas admin (usuarios, empresas, solicitudes, leads) usaban `<tr (click)>` sin ser operables por teclado — se agregó `tabindex`, `role="button"`, manejo de `Enter`/`Espacio` y un `:focus-visible` visible en las 4.
