# Reporte de pruebas End-to-End de LendUp (frontend)

- Ejecución: 2026-11-26T00:53:52.977Z
- Resultado global: **passed**
- Pruebas: 5/5 aprobadas
- Entorno: gateway http://localhost:8090/api/v1, emulador de Firebase http://localhost:9099

| #   | Flujo                                         | Resultado | Duración |
| --- | --------------------------------------------- | --------- | -------- |
| 1   | 1. Iniciar sesión con el emulador de Firebase | APROBADA  | 1.9 s    |
| 2   | 2. Explorar publicaciones y usar un filtro    | APROBADA  | 4.5 s    |
| 3   | 3. Crear una solicitud como prestatario       | APROBADA  | 4.7 s    |
| 4   | 4. Aceptar la solicitud como prestamista      | APROBADA  | 4.1 s    |
| 5   | 5. Ver el préstamo y el calendario            | APROBADA  | 5.7 s    |

Capturas: `tests/e2e/reportes/capturas/`. Informe HTML: `tests/e2e/reportes/html/index.html`.
