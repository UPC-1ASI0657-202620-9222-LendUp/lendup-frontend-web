# Contratos reales de integración frontend/backend

Este documento refleja el contrato observado en los Controllers, Request DTOs y ApplicationServices del backend de LendUp. El backend es la fuente de verdad. El frontend no completa localmente estados ni datos ausentes.

Todas las rutas parten de `VITE_API_GATEWAY_URL` (incluye `/api/v1`) y las peticiones protegidas envían `Authorization: Bearer <FIREBASE_ID_TOKEN>`.

Desde el Sprint 2, `VITE_API_GATEWAY_URL` apunta a `lendup-api-gateway`. El gateway envía Pagos y Notificaciones a `lendup-payments-service` y `lendup-notifications-service`, Solicitudes y Reservas a `lendup-reservations-service`, y lo demás al monolito. Las rutas y los cuerpos no cambian.

## Capacidades consumidas

| Contexto       | Endpoints usados                                                                                                                                                      | Estado en la UI                                                                                                                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identidad      | `POST /estudiantes`, `GET/PUT /estudiantes/me`, `GET /estudiantes/{id}`, `POST /estudiantes/me/verificacion`, `POST /estudiantes/me/aceptacion-terminos`              | Firebase crea la credencial; el backend crea y devuelve el perfil. La verificación registra una referencia y permanece en el estado devuelto por el backend.   |
| Publicaciones  | `GET/POST /objetos`, `GET/PUT /objetos/{id}`, `PATCH /objetos/{id}/estado`, `GET/PUT /objetos/{id}/disponibilidad`, `PUT/DELETE /objetos/{id}/disponibilidad/{subid}` | Búsqueda, alta, edición, estado y CRUD de intervalos reales. Las respuestas incluyen disponibilidad y reservas confirmadas; estas últimas son de solo lectura. |
| Solicitudes    | `GET/POST /solicitudes`, `GET /solicitudes/{id}`, acciones de aceptación, rechazo y cancelación                                                                       | Mutaciones reales con invalidación de queries.                                                                                                                 |
| Reservas       | `GET /reservas`, `POST /reservas/{id}/cancelacion`, `GET /reservas/{id}/contacto`                                                                                     | Lectura y cancelación reales.                                                                                                                                  |
| Préstamos      | `GET /prestamos`, `GET /prestamos/{id}`, entrega, recepción, devolución y confirmación; `GET /calendario`                                                             | Se muestran únicamente estados persistidos por el backend.                                                                                                     |
| Incidencias    | `GET/POST /incidencias`, `GET /incidencias/{id}`, `POST /incidencias/{id}/descargo`, `GET /admin/incidencias`, `POST /admin/incidencias/{id}/revision`, `POST /admin/incidencias/{id}/observaciones`, `POST /admin/incidencias/{id}/resolucion`                                                     | Historial autorizado, reporte JSON/multipart con fotos y observaciones, descargo, revisión, notas y resolución. El servidor calcula el saldo y serializa las resoluciones por préstamo.                            |
| Pagos          | `GET /medios-pago`, `POST /pagos`, `POST /garantias`, `GET /prestamos/{id}/transacciones`                                                                             | `POST /pagos` (tarifa o extensión) y `POST /garantias` devuelven la transacción `PENDIENTE` con `checkout_url`. La UI redirige a Checkout Pro de Mercado Pago (solo dominios de Mercado Pago, por HTTPS) y, al volver, `/payments/return` consulta las transacciones hasta ver `CONFIRMADA`, `RECHAZADA` o `CANCELADA`. |
| Reputación     | `POST /prestamos/{id}/calificaciones`, `GET /estudiantes/{id}/reputacion`                                                                                             | Calificaciones y reputación remotas.                                                                                                                           |
| Notificaciones | `GET /notificaciones`, `PATCH /notificaciones/{id}`                                                                                                                   | Lectura y marcado remotos. `origen_tipo` enlaza a Solicitudes (`SOLICITUD`), la reserva (`RESERVA`), el préstamo (`PRESTAMO`), Préstamos (`EXTENSION`), Movimientos (`PAGO`, `GARANTIA`) o la incidencia (`INCIDENCIA`). |

Los cuerpos REST mantienen `snake_case`; los mappers convierten las respuestas JDBC al modelo de presentación en camelCase. El cliente normaliza 400, 401, 403, 404, 409, 422, 5xx y fallos de red. Un 401 invalida la sesión Firebase; un 403 de `GET /estudiantes/me` habilita únicamente el alta del perfil asociado a esa sesión.

## Gaps vigentes del backend

- `GET /terminos` no entrega documento ni versiones vigentes. La aceptación permanece deshabilitada.
- No hay endpoints de categorías, universidades o campus. `config/reference-data.ts` contiene el catálogo temporal y solo usa la categoría `OTROS` presente en `data.sql`.
- No hay endpoint de publicaciones del propietario; `GET /objetos` solo expone publicaciones activas.
- No se pueden consultar evidencias ni cambios de fecha existentes. Las pantallas no fabrican esos subrecursos.
- Cloudinary no tiene flujo de upload. Todos los selectores de archivo están deshabilitados y no se crean Data URLs.
- El análisis Gemini se crea en `PENDIENTE`; no existe resultado ni polling autoritativo.
- Mercado Pago confirma los pagos a `lendup-payments-service` por webhook; la URL de retorno no se usa como prueba de pago. Estados de transacción: `PENDIENTE`, `CONFIRMADA`, `RECHAZADA`, `CANCELADA`, `FALLIDA`; tipos: `PAGO_TARIFA`, `PAGO_EXTENSION`, `CONSTITUCION_GARANTIA`, `LIBERACION_TARIFA`, `DEVOLUCION_GARANTIA`, `RETENCION_GARANTIA`, `REEMBOLSO_TARIFA`. La garantía anidada (`garantia.estado`) indica si se devolvió o se afectó.
- No hay lectura de cambios de fecha en `GET /prestamos/{id}`; solicitar, responder y reprogramar siguen deshabilitados. El pago de una extensión aceptada ya está conectado (`POST /pagos` con `PAGO_EXTENSION`) y se mostrará cuando Préstamos devuelva sus cambios de fecha.
- No hay endpoints para declaración de contraparte, inicio de revisión ni notas administrativas.
- Aunque existe el endpoint de resolución, el administrador no puede consultar el préstamo asociado ni el saldo de garantía autoritativo; la UI no habilita una resolución sin esos datos.
- Las notificaciones las genera `lendup-notifications-service` a partir de eventos, y también se envían por correo (SendGrid).

Estos gaps deben resolverse en el backend antes de habilitar sus controles. No deben cubrirse con fixtures, estados locales, resultados de proveedor elegibles ni mensajes de éxito simulados.
