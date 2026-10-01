# LendUp · Frontend web

SPA de LendUp, plataforma de préstamos y alquileres temporales entre estudiantes universitarios verificados. Implementa las User Stories US01–US47 del informe (ver `FRONTEND_USER_STORY_TRACEABILITY.md`).

## Stack

React 19 · TypeScript · Vite (vinext) · React Router · TanStack Query · React Hook Form + Zod · Tailwind CSS 4 + componentes base UI · lucide-react.

## Puesta en marcha

```bash
npm install
cp .env.example .env   # opcional
npm run dev            # http://localhost:3000
```

Cuentas demo (contraseña `lendup123`): `carlos.mendoza@upc.edu.pe`, `alexandra.ruiz@pucp.edu.pe`, `lucia.paredes@uni.pe` (estudiantes) y `admin@lendup.pe` (administrador). La pantalla de login ofrece acceso rápido y el panel lateral permite cambiar de usuario o reiniciar los datos.

## Scripts

| Script                            | Uso                                                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev` / `npm run build`   | Desarrollo y build de producción                                                                                             |
| `npm run typecheck`               | Verificación de tipos (incluye claves de i18n)                                                                               |
| `npm run lint` / `npm run format` | oxlint (incluye jsx-a11y) y oxfmt                                                                                            |
| `npm test`                        | Reglas de negocio e integridad de traducciones                                                                               |
| `npm run qa:browser`              | Recorre todas las rutas por rol en escritorio, tablet y móvil: errores de consola, desbordes, etiquetas y accesos prohibidos |
| `npm run qa:flows`                | Flujos E2E: registro, publicación, solicitud, pago, entrega, extensión, devolución, calificación, cancelación e incidencias  |

Los scripts de QA usan Playwright; `BROWSER_PATH` indica el ejecutable de Chromium y `LOCAL_URL` la URL del servidor.

## Arquitectura

La estructura sigue el capítulo 4 del informe: SPA (R06, R11) que solo se comunica con el API Gateway (R14) y adapters para cada servicio externo (R16).

```
app/                 Layout, estilos globales y punto de entrada
  styles/            tokens, base, layout, components y estilos por página
components/ui        Componentes base (botón, diálogo, sheet…)
components/lendup    Componentes de dominio (shell, tarjetas, evidencias, términos)
config/              Configuración leída de variables de entorno
features/            Páginas por contexto: public, listings, operations, incidents, dashboard
hooks/               Guardas de operación y análisis de evidencias
lib/                 Reglas de negocio puras, fechas por zona horaria e i18n
mocks/               Catálogo (universidades, categorías) y datos demo
services/api         Catálogo de endpoints (tabla 37) y cliente del gateway
services/adapters    Firebase Auth, Mercado Pago, Cloudinary, Gemini, Google Maps
stores/              Estado demo (backend simulado) y selectores
types/               Modelo de dominio
```

Contextos del informe reflejados en el código: Identidad, Catálogo, Reservas, Préstamos, Pagos y Garantías, Evidencias e Incidencias, Reputación y Notificaciones. Con `VITE_DEMO_MODE=false` los servicios usan el gateway y los endpoints de `services/api/endpoints.ts`.

Reglas del informe aplicadas en el frontend: tarifa diaria mayor que 0 (R25), cobro por bloque de 24 h iniciado (R26), snapshot inmutable de condiciones (R27), solo roles `STUDENT` y `ADMIN` (R19), la IA solo apoya y no decide (R22, R23) y la ubicación actual no se guarda (R05).

## Sistema de diseño

El informe no incluye una guía de estilos; se definió a partir del logo (`public/brand/`).

| Token                                  | Valor                             | Uso                                         |
| -------------------------------------- | --------------------------------- | ------------------------------------------- |
| `--brand-500`                          | `#0C79D8`                         | Color del logo, acentos                     |
| `--brand-400`                          | `#2E9EFF`                         | Estados activos, focos                      |
| `--brand-300`                          | `#68C4FF`                         | Detalles sobre fondos oscuros               |
| `--brand-600`                          | `#0A6BC4`                         | Botones primarios (contraste AA con blanco) |
| `--brand-900`                          | `#0A1F3C`                         | Barra lateral y héroes                      |
| `--success` / `--warning` / `--danger` | `#0F8A6C` / `#9A5B00` / `#C4322F` | Estados                                     |

Tipografía: Plus Jakarta Sans (variable, autoalojada). Radio base 12 px, objetivos táctiles mínimos de 40–44 px, foco visible y soporte de `prefers-reduced-motion`.

Diseño responsive: barra lateral desde 1024 px; en tablet y móvil se usa navegación inferior y menú en hoja; las tablas se convierten en tarjetas y los diálogos en hojas inferiores en pantallas pequeñas.

## Internacionalización

Español (por defecto) e inglés en `lib/i18n/es.ts` y `lib/i18n/en.ts`. Las claves están tipadas: `t('clave')` falla en compilación si la clave no existe y el inglés debe tener la misma forma que el español. Monedas, fechas y tiempos relativos usan `Intl` con la zona horaria configurada. El idioma elegido se guarda en el navegador.

## Documentación relacionada

- `FRONTEND_USER_STORY_TRACEABILITY.md`: US01–US47
- `FRONTEND_REQUIREMENTS_TRACEABILITY.md`: requisitos funcionales
- `FRONTEND_BUSINESS_RULE_TRACEABILITY.md`: reglas de negocio
- `FRONTEND_BACKEND_INTEGRATION_CONTRACTS.md`: endpoints requeridos
- `FRONTEND_DOCUMENTATION_GAPS.md`: brechas del informe
