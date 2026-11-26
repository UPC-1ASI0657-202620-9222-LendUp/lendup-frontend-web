# Contratos reales de integración frontend/backend

Este documento refleja el contrato de los microservicios de LendUp detrás del API Gateway (actualizado en la rama `feat/gateway-routes-and-e2e`, verificado contra el entorno `lendup-e2e` solo en los flujos que cubre `tests/e2e/`). El backend es la fuente de verdad. El frontend no completa localmente estados ni datos ausentes.

Todas las rutas parten de `VITE_API_GATEWAY_URL` (incluye `/api/v1`) y las peticiones protegidas envían `Authorization: Bearer <FIREBASE_ID_TOKEN>`.

## Capacidades consumidas

| Contexto       | Endpoints usados                                                                                                                                                      | Estado en la UI                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identidad      | `POST /estudiantes`, `GET/PUT /estudiantes/me`, `GET /estudiantes/{id}`, `POST /estudiantes/me/verificacion`, `POST /estudiantes/me/aceptacion-terminos`, `GET /documentos/terminos`, `GET /universidades` | Firebase crea la credencial; el backend crea y devuelve el perfil. La verificación registra una referencia y permanece en el estado devuelto por el backend.   |
| Publicaciones  | `GET/POST /catalogo/publicaciones`, `GET/PATCH /catalogo/publicaciones/{id}`, `PATCH /catalogo/publicaciones/{id}/estado`, `GET /catalogo/mis-publicaciones`, `GET /catalogo/categorias`, `GET/POST/PUT/DELETE /catalogo/publicaciones/{id}/disponibilidades`, `GET/POST/DELETE /catalogo/publicaciones/{id}/imagenes`, `GET /catalogo/publicaciones/{id}/snapshot` | Búsqueda, alta, edición parcial (PATCH), estado, intervalos y fotos. Catálogo usa camelCase y secciones `detalles`/`condiciones`. Las fotos se piden aparte por publicación. |
| Solicitudes    | `GET/POST /solicitudes`, `GET /solicitudes/{id}`, acciones de aceptación, rechazo y cancelación                                                                       | `POST /solicitudes` envía `aceptacion_condiciones` (`snapshot_id`, `snapshot_hash`, `aceptada`) leído del snapshot de Catálogo. Mutaciones reales con invalidación de queries.                                                                                                                 |
| Reservas       | `GET /reservas`, `POST /reservas/{id}/cancelacion`, `GET /reservas/{id}/contacto`                                                                                     | Lectura y cancelación reales.                                                                                                                                  |
| Préstamos      | `GET /prestamos`, `GET /prestamos/{id}`, entrega, recepción, devolución y confirmación; `GET /calendario`                                                             | Se muestran únicamente estados persistidos por el backend.                                                                                                     |
| Incidencias    | `GET/POST /incidencias`, `GET /incidencias/{id}`, `POST /incidencias/{id}/descargo`, `GET /admin/incidencias`, `POST /admin/incidencias/{id}/revision`, `POST /admin/incidencias/{id}/observaciones`, `POST /admin/incidencias/{id}/resolucion`                                                     | Historial autorizado, reporte JSON/multipart con fotos y observaciones, descargo, revisión, notas y resolución. El servidor calcula el saldo y serializa las resoluciones por préstamo.                            |
| Pagos          | `GET /medios-pago`, `POST /garantias`, `GET /prestamos/{id}/transacciones`                                                                                            | La garantía conserva `PENDIENTE` si eso devuelve el backend. El pago de tarifa está bloqueado mientras no exista una cotización autoritativa.                  |
| Reputación     | `POST /prestamos/{id}/calificaciones`, `GET /estudiantes/{id}/reputacion`                                                                                             | Calificaciones y reputación remotas.                                                                                                                           |
| Notificaciones | `GET /notificaciones`, `PATCH /notificaciones/{id}`                                                                                                                   | Lectura y marcado remotos.                                                                                                                                     |

Los cuerpos REST de Identidad, Reservas, Préstamos y Pagos usan `snake_case`; Catálogo usa `camelCase` (solo el snapshot es snake_case); los mappers convierten las respuestas JDBC al modelo de presentación en camelCase. El cliente normaliza 400, 401, 403, 404, 409, 422, 5xx y fallos de red. Un 401 invalida la sesión Firebase; un 403 de `GET /estudiantes/me` habilita únicamente el alta del perfil asociado a esa sesión.

## Gaps vigentes del backend

- Resueltos con los microservicios: documento de términos (`/documentos/terminos`), categorías (`/catalogo/categorias`), publicaciones del propietario (`/catalogo/mis-publicaciones`) y carga de fotos (`/catalogo/publicaciones/{id}/imagenes`).
- Catálogo no incluye las fotos ni la fecha de creación en la publicación, y no filtra por `ubicacion` (distrito): el filtro de ubicación se aplica en el cliente y las fotos cuestan una petición por publicación.
- Catálogo tiene las categorías DIBUJO y LABORATORIO; la UI solo conoce seis y las muestra como «Otros».
- Los gaps siguientes provienen del documento original del monolito y **no se volvieron a verificar** contra los microservicios; Evidencias e Incidencias siguen en el monolito.
- No se pueden consultar evidencias ni cambios de fecha existentes. Las pantallas no fabrican esos subrecursos.
- Las fotos de incidencias dependen del servicio de Evidencias, que aún no existe.
- El análisis Gemini se crea en `PENDIENTE`; no existe resultado ni polling autoritativo.
- Mercado Pago no confirma operaciones: pagos y garantías permanecen en el estado real del backend. El webhook solo registra `PENDIENTE_VALIDACION`.
- La cotización de pago es preliminar y no entrega un total autoritativo. Por ello la UI no ejecuta `POST /pagos` para tarifa o extensión.
- No hay lectura de cambios de fecha; extensión, reprogramación y sus respuestas están deshabilitadas para no crear operaciones invisibles en la UI.
- No hay endpoints para declaración de contraparte, inicio de revisión ni notas administrativas.
- Aunque existe el endpoint de resolución, el administrador no puede consultar el préstamo asociado ni el saldo de garantía autoritativo; la UI no habilita una resolución sin esos datos.
- Las notificaciones de incidencias están disponibles dentro de la aplicación. El correo externo requiere su integración independiente.

Estos gaps deben resolverse en el backend antes de habilitar sus controles. No deben cubrirse con fixtures, estados locales, resultados de proveedor elegibles ni mensajes de éxito simulados.
