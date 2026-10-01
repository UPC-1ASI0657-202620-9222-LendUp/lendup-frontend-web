# Brechas de documentación del frontend

Puntos del informe que están incompletos o se contradicen. El frontend toma la decisión indicada y la deja configurable cuando es posible.

1. **Style Guidelines.** El informe no tiene una sección de guía de estilos. El frontend define un sistema de diseño propio derivado del logo (ver `README.md`, sección _Sistema de diseño_): azul `#0C79D8`, `#2E9EFF`, `#68C4FF`, navy `#0A1F3C`, tipografía Plus Jakarta Sans. Se recomienda incorporarlo al informe.

2. **Frontera de cancelación.** US14, US45, RF15 y RF51 indican “antes de la entrega”, mientras una versión previa de las reglas usaba la confirmación de recepción. El frontend sigue el informe: `canCancelReservation` exige reserva `CONFIRMED` y entrega no registrada.

3. **Comisión de LendUp.** RF37 exige mostrar la comisión, pero el informe no fija un porcentaje (hotspot). Se configura con `VITE_LENDUP_COMMISSION_RATE` (10 % por defecto) y queda congelada en el snapshot de cada reserva. Falta definir si se reembolsa al cancelar; hoy se aplica la misma tasa de reembolso que a la tarifa.

4. **Comisión del proveedor de pagos.** Se documenta “cuando corresponda” sin porcentaje. Se configura con `VITE_PAYMENT_PROVIDER_FEE_RATE` (0 por defecto) y solo se muestra si es mayor que cero.

5. **Devolución anticipada.** No existe una User Story formal que cubra evidencias, ausencia de reembolso proporcional, retención por incidencia y liberación del periodo restante. Se traza contra US23, US24 y US26.

6. **Lugar de intercambio.** La User Task Matrix contempla negociar el lugar, pero RF17 indica un lugar definido por el prestamista y aceptado por el prestatario. El frontend implementa RF17 sin negociación.

7. **Fase de evidencias de incidencias.** RF30 solo enumera `INITIAL` y `FINAL`. El frontend usa además `INCIDENT` para la evidencia aportada al reportar.

8. **Nombres de estados económicos.** Algunos artefactos usan `PAID_PENDING_RELEASE` / `RELEASED_TO_LENDER`; el modelo usa `PENDING_RELEASE` / `RELEASED`. El contrato de integración pide un mapeo explícito.
