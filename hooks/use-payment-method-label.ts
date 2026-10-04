import { useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import type { PaymentMethod } from '@/services/payments.service';

export function usePaymentMethodLabel() {
  const { t } = useI18n();
  return useCallback(
    (method?: Pick<PaymentMethod, 'kind' | 'brand'> | string) => {
      if (!method) return '—';
      const resolved = typeof method === 'string' ? undefined : method;
      if (!resolved) return typeof method === 'string' ? method : '—';
      return resolved.brand ?? t(`payments.methods.${resolved.kind}`);
    },
    [t],
  );
}
