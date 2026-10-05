# LendUp frontend web

Frontend de producción de LendUp. Consume exclusivamente la API Spring Boot real y usa Firebase Authentication en el navegador. No contiene usuarios, tokens, pagos, entidades ni persistencia de negocio simulados.

## Stack y arquitectura

React 19, TypeScript, Vinext/Vite, React Router, TanStack Query, Firebase Web SDK, React Hook Form y Zod. La aplicación mantiene el diseño responsive y el despliegue en Cloudflare Workers.

```text
features/auth/          sesión Firebase (AuthProvider)
services/auth/          inicialización y operaciones Firebase Web
services/api/           cliente HTTP, endpoints, DTOs y mappers
services/*.service.ts   clientes por módulo del backend
hooks/use-lendup.ts     composición de queries/mutations para la UI
features/               páginas por contexto funcional
config/reference-data   configuración temporal sin endpoint backend
```

Firebase es la fuente de verdad de la sesión. Cada llamada protegida obtiene el ID token actual y envía `Authorization: Bearer <FIREBASE_ID_TOKEN>`. Los datos remotos se cachean con TanStack Query; después de cada mutación se invalidan las queries relacionadas. El navegador no guarda datos de negocio ni tokens personalizados en `localStorage`.

## Configuración

Copia `.env.example` a `.env.local` y completa únicamente valores públicos del cliente Firebase:

```env
VITE_API_GATEWAY_URL=https://lendup-backend.onrender.com/api/v1
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_GOOGLE_MAPS_API_KEY=
VITE_DEFAULT_LOCALE=es
VITE_TIME_ZONE=America/Lima
```

No uses credenciales Firebase Admin, service accounts, claves privadas de MySQL, Mercado Pago, Cloudinary o Gemini. Toda variable `VITE_*` es visible en el navegador.

Para el backend local usa `VITE_API_GATEWAY_URL=http://localhost:8080/api/v1`. El proyecto Firebase del cliente debe coincidir con el configurado en el backend.

## Desarrollo y validación

```bash
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Los scripts Playwright requieren `QA_EMAIL`, `QA_PASSWORD`, `LOCAL_URL` y, cuando corresponda, `BROWSER_PATH`. Usan una cuenta Firebase de pruebas y no deben ejecutarse contra producción para flujos mutables. `qa:flows` solo realiza navegación autenticada de lectura.

## Backend y contratos

- API desplegada: `https://lendup-backend.onrender.com/api/v1`
- Swagger: `https://lendup-backend.onrender.com/swagger-ui.html`
- OpenAPI: `https://lendup-backend.onrender.com/v3/api-docs`

Los DTOs REST conservan nombres `snake_case`; los mappers los convierten al modelo camelCase de la UI. No añadas `/api/v1` a las rutas internas porque la URL base ya lo incluye.

## Limitaciones conocidas del backend

- Mercado Pago registra pagos y garantías en `PENDIENTE`; el webhook no valida ni confirma al proveedor.
- Cloudinary no tiene un flujo de subida desde el frontend. Los selectores de archivo permanecen deshabilitados y nunca se generan Data URLs.
- Gemini crea análisis en estado pendiente; no hay resultado real ni polling disponible.
- SendGrid/correo todavía no está integrado.
- `/terminos` no entrega el documento ni sus versiones vigentes, por lo que una nueva aceptación no puede completarse de forma autoritativa.
- No hay endpoints para categorías, universidades/campus, publicaciones del propietario, imágenes o disponibilidades existentes, evidencias de un préstamo, cambios de fecha.
- Extensiones, reprogramaciones y sus respuestas permanecen deshabilitadas porque el backend no permite consultar después esos cambios de fecha.
- No existen operaciones para registrar declaraciones de contraparte, iniciar revisión o añadir notas administrativas.
- Incidencias: historial de participantes, fotos y observaciones, descargo, revisión y notas administrativas, resolución validada con saldo calculado por el servidor. La resolución registra una decisión; las transferencias monetarias requieren integración del proveedor.

La UI muestra o bloquea estas capacidades de forma explícita; nunca las marca como exitosas localmente.

## Cloudflare Workers

1. Configura las variables públicas anteriores en el proyecto Cloudflare.
2. Ejecuta `npm ci && npm run build`.
3. Despliega usando `dist/server/wrangler.json` con el flujo existente.
4. Configura en Render `CORS_ORIGINS=https://DOMINIO_FRONTEND`.
5. Añade el dominio definitivo a los dominios autorizados de Firebase Authentication.

El frontend no puede ni debe eludir CORS desde el navegador.

## Verificación obligatoria de correo

Firebase envía un enlace después de guardar el perfil. La pantalla `/verify-email`
permite reenviarlo y comprobar la verificación. No se permite acceder a la aplicación
hasta que Firebase indique `emailVerified=true`; esto también se aplica a cuentas existentes.
Al comprobar el enlace, se recarga el usuario, se renueva su token y se vuelve a consultar el perfil.

En Firebase Authentication > Settings > Authorized domains debe figurar el dominio publicado
(sin esquema ni rutas). La plantilla de verificación de Firebase puede personalizarse en Templates.
La implementación usa el manejador de enlaces alojado por Firebase y vuelve a `/verify-email`.

Desplegar frontend y backend juntos: el backend comprueba `email_verified` en cada solicitud
protegida y permite exclusivamente las rutas necesarias para completar el perfil antes de verificar.
No hace falta un proveedor SMTP adicional para este flujo.
