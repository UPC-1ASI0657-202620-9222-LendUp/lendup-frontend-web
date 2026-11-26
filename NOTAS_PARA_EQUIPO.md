# Notas para el equipo (hallazgos de la integración frontend ↔ gateway)

Origen: rama `feat/gateway-routes-and-e2e`, probado contra `lendup-e2e` (gateway en `localhost:8090`, emulador de Firebase). El frontend no arregla nada de esto; son observaciones para los dueños.

## Catálogo e Identidad (dueño no indicado en el briefing: confirmar con el equipo)

1. **`GET /catalogo/publicaciones` y `/mis-publicaciones` no devuelven las fotos.**
   - Esperaba: `imagenes` dentro de la publicación (el monolito las incluía) o al menos la portada.
   - Recibí: solo `id`, `propietarioUsuarioId`, `detalles`, `condiciones`, `estado`, `disponibilidades`.
   - Efecto: el frontend hace una petición `GET /catalogo/publicaciones/{id}/imagenes` por publicación (N+1). Sugerencia: incluir la lista de imágenes en `PublicacionResponse`.
2. **La publicación no trae fecha de creación** (el monolito enviaba `creado_en`). El frontend usa una fecha vacía; no puede ordenar por «más recientes».
3. **`GET /catalogo/publicaciones` no acepta filtro por `ubicacion`/distrito.** El filtro se aplica en el navegador sobre lo que devuelve la lista.
4. **Categorías:** Catálogo tiene `DIBUJO` y `LABORATORIO` y los ids `c0000000-…` (V2). El frontend solo conoce seis y muestra esas dos como «Otros». Cualquier dato creado con los ids antiguos del monolito (`00000000-…-0003` a `0008`) ya no se reconoce.
5. **Identidad rechaza `universidad` en `POST /estudiantes`** (`forbidNonWhitelisted`) porque la deduce del dominio del correo. El frontend lo enviaba; ya se quitó. Solo informativo para quien documente el contrato.

## Evidencias e Incidencias (Eduardo)

- Siguen en el monolito vía gateway (`/prestamos/{id}/evidencias`, `/prestamos/{id}/analisis-evidencias`, `/incidencias/**`, `/admin/incidencias/**`). El frontend **no** migró esas rutas. Cuando el servicio exista y el monolito desaparezca, esas pantallas dejarán de funcionar hasta apuntar el gateway al nuevo servicio. No las probé de extremo a extremo.

## Gateway (Braden)

- `GET /api/v1/objetos` sigue yendo al monolito; el frontend ya no lo usa. Confirmar que nadie más depende de él antes de apagar el monolito.
- La URL pública del gateway en AWS no la tengo: `.env.example` deja `VITE_API_GATEWAY_URL` pendiente para producción.

## Sin verificar contra los microservicios

Pagos, extensiones/reprogramaciones, reputación, notificaciones y devolución desde la UI: la suite E2E no los toca. El texto de `FRONTEND_BACKEND_INTEGRATION_CONTRACTS.md` sobre esos gaps proviene del monolito y no se reconfirmó.
