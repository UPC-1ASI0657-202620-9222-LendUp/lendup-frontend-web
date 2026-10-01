import { useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import {
  mercadoPagoAdapter,
  type PaymentMethod,
} from '@/services/adapters/mercado-pago';

export function usePaymentMethodLabel() {
  const { t } = useI18n();
  return useCallback(
    (method?: Pick<PaymentMethod, 'kind' | 'brand'> | string) => {
      if (!method) return '—';
      const resolved =
        typeof method === 'string'
          ? mercadoPagoAdapter.findMethod(method)
          : method;
      if (!resolved) return typeof method === 'string' ? method : '—';
      return resolved.brand ?? t(`payments.methods.${resolved.kind}`);
    },
    [t],
  );
}
