# Contratos reales de integración frontend/backend

Este documento refleja el contrato observado en los Controllers, Request DTOs y ApplicationServices del backend de LendUp. El backend es la fuente de verdad. El frontend no completa localmente estados ni datos ausentes.

Todas las rutas parten de `VITE_API_GATEWAY_URL` (incluye `/api/v1`) y las peticiones protegidas envían `Authorization: Bearer <FIREBASE_ID_TOKEN>`.

## Capacidades consumidas

| Contexto       | Endpoints usados                                                                                                                                                      | Estado en la UI                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identidad      | `POST /estudiantes`, `GET/PUT /estudiantes/me`, `GET /estudiantes/{id}`, `POST /estudiantes/me/verificacion`, `POST /estudiantes/me/aceptacion-terminos`              | Firebase crea la credencial; el backend crea y devuelve el perfil. La verificación registra una referencia y permanece en el estado devuelto por el backend.   |
| Publicaciones  | `GET/POST /objetos`, `GET/PUT /objetos/{id}`, `PATCH /objetos/{id}/estado`, `GET/PUT /objetos/{id}/disponibilidad`, `PUT/DELETE /objetos/{id}/disponibilidad/{subid}` | Búsqueda, alta, edición, estado y CRUD de intervalos reales. Las respuestas incluyen disponibilidad y reservas confirmadas; estas últimas son de solo lectura. |
| Solicitudes    | `GET/POST /solicitudes`, `GET /solicitudes/{id}`, acciones de aceptación, rechazo y cancelación                                                                       | Mutaciones reales con invalidación de queries.                                                                                                                 |
| Reservas       | `GET /reservas`, `POST /reservas/{id}/cancelacion`, `GET /reservas/{id}/contacto`                                                                                     | Lectura y cancelación reales.                                                                                                                                  |
| Préstamos      | `GET /prestamos`, `GET /prestamos/{id}`, entrega, recepción, devolución y confirmación; `GET /calendario`                                                             | Se muestran únicamente estados persistidos por el backend.                                                                                                     |
| Incidencias    | `POST /incidencias`, `GET /incidencias/{id}`, `GET /admin/incidencias`, `POST /admin/incidencias/{id}/resolucion`                                                     | Reporte y detalle del participante, y bandeja administrativa. La resolución se bloquea si faltan el préstamo y saldo autoritativos.                            |
| Pagos          | `GET /medios-pago`, `POST /garantias`, `GET /prestamos/{id}/transacciones`                                                                                            | La garantía conserva `PENDIENTE` si eso devuelve el backend. El pago de tarifa está bloqueado mientras no exista una cotización autoritativa.                  |
| Reputación     | `POST /prestamos/{id}/calificaciones`, `GET /estudiantes/{id}/reputacion`                                                                                             | Calificaciones y reputación remotas.                                                                                                                           |
| Notificaciones | `GET /notificaciones`, `PATCH /notificaciones/{id}`                                                                                                                   | Lectura y marcado remotos.                                                                                                                                     |

Los cuerpos REST mantienen `snake_case`; los mappers convierten las respuestas JDBC al modelo de presentación en camelCase. El cliente normaliza 400, 401, 403, 404, 409, 422, 5xx y fallos de red. Un 401 invalida la sesión Firebase; un 403 de `GET /estudiantes/me` habilita únicamente el alta del perfil asociado a esa sesión.

## Gaps vigentes del backend

- `GET /terminos` no entrega documento ni versiones vigentes. La aceptación permanece deshabilitada.
- No hay endpoints de categorías, universidades o campus. `config/reference-data.ts` contiene el catálogo temporal y solo usa la categoría `OTROS` presente en `data.sql`.
- No hay endpoint de publicaciones del propietario; `GET /objetos` solo expone publicaciones activas.
- No se pueden consultar evidencias ni cambios de fecha existentes. Las pantallas no fabrican esos subrecursos.
- Cloudinary no tiene flujo de upload. Todos los selectores de archivo están deshabilitados y no se crean Data URLs.
- El análisis Gemini se crea en `PENDIENTE`; no existe resultado ni polling autoritativo.
- Mercado Pago no confirma operaciones: pagos y garantías permanecen en el estado real del backend. El webhook solo registra `PENDIENTE_VALIDACION`.
- La cotización de pago es preliminar y no entrega un total autoritativo. Por ello la UI no ejecuta `POST /pagos` para tarifa o extensión.
- No hay lectura de cambios de fecha; extensión, reprogramación y sus respuestas están deshabilitadas para no crear operaciones invisibles en la UI.
- No hay endpoints para declaración de contraparte, inicio de revisión ni notas administrativas.
- Aunque existe el endpoint de resolución, el administrador no puede consultar el préstamo asociado ni el saldo de garantía autoritativo; la UI no habilita una resolución sin esos datos.
- No existe lista de incidencias para el estudiante, ni servicio de correo/SendGrid.

Estos gaps deben resolverse en el backend antes de habilitar sus controles. No deben cubrirse con fixtures, estados locales, resultados de proveedor elegibles ni mensajes de éxito simulados.
