# Brechas de documentación del frontend

1. **Frontera de cancelación.** RF15, RF46, RF51 y User Stories relacionadas todavía pueden decir “antes de la entrega”. BR-05 establece la frontera definitiva en `receiptConfirmedAt == null`; debe actualizarse la documentación para evitar dos interpretaciones.

2. **Devolución anticipada.** BR-07 a BR-10 son reglas definitivas, pero no poseen todavía un RF/User Story formal equivalente que cubra flujo de evidencias, ausencia de reembolso proporcional, retención por incidencia y liberación del periodo restante.

3. **Lugar de intercambio.** La User Task Matrix contempla propuesta/alternativa del lugar, mientras RF17 indica un lugar definido por el prestamista y aceptado por el prestatario. El frontend implementa RF17 y no añade negociación hasta que el equipo resuelva la contradicción.

4. **Comisión del proveedor.** La documentación dice “cuando corresponda” y no define un porcentaje universal. El frontend obtiene la cotización de `PaymentService`; el adapter mock devuelve comisión S/ 0. Se eliminó el 8 % fijo.

5. **Nombres de estados económicos.** Algunos artefactos usan `PAID_PENDING_RELEASE` / `RELEASED_TO_LENDER`, mientras el modelo previo empleaba `PENDING_RELEASE` / `RELEASED`. La UI mantiene las etiquetas de dominio completas y el contrato de integración exige un mapeo explícito, no inferencias por texto.

6. **Fase de evidencias de incidencias.** RF30 enumera `INITIAL` y `FINAL`; una incidencia necesita además distinguir evidencia aportada durante el reclamo. El frontend conserva `INCIDENT` como fase explícita hasta que la documentación normalice el modelo.
