import { economicBreakdown } from '@/lib/business-rules';
import { backendPaymentsService } from '@/services/payments-api.service';
import type {
  CancellationPolicy,
  Listing,
  PaymentPurpose,
  TermsSnapshot,
} from '@/types/domain';

export interface CommissionPolicy {
  rate: number;
}
export interface CostPolicy {
  providerFeeRate: number;
  cancellation: CancellationPolicy;
}

export const commissionPolicy: CommissionPolicy = {
  rate: 0,
};
export const costPolicy: CostPolicy = {
  providerFeeRate: 0,
  cancellation: { borrowerRefundRate: 0, lenderRefundRate: 0 },
};

export function createTermsSnapshot(
  listing: Listing,
  startAt: string,
  endAt: string,
): TermsSnapshot {
  return {
    ...listing.terms,
    dailyRate: listing.dailyRate,
    guaranteeAmount: listing.guaranteeAmount,
    commissionRate: commissionPolicy.rate,
    providerFeeRate: costPolicy.providerFeeRate,
    exchangePlace: listing.exchangePlace,
    startAt,
    endAt,
    originalEndAt: endAt,
    cancellationPolicy: { ...costPolicy.cancellation },
    acceptedAt: new Date().toISOString(),
  };
}

export function quoteListing(listing: Listing, startAt: string, endAt: string) {
  return economicBreakdown(createTermsSnapshot(listing, startAt, endAt));
}

export const paymentsService = {
  async getPaymentMethods(purpose: PaymentPurpose): Promise<PaymentMethod[]> {
    const rows = await backendPaymentsService.methods();
    return rows
      .filter((row) => row.estado === 'ACTIVO' || row.estado === 'DISPONIBLE')
      .map((row) => ({
        id: typeof row.codigo === 'string' ? row.codigo : '',
        kind: 'WALLET',
        brand:
          typeof row.nombre === 'string'
            ? row.nombre
            : typeof row.codigo === 'string'
              ? row.codigo
              : '',
        purposes: [purpose],
        status: typeof row.estado === 'string' ? row.estado : '',
      }));
  },
};

export type PaymentMethodKind = 'CARD' | 'WALLET' | 'ACCOUNT_MONEY' | 'CASH';
export interface PaymentMethod {
  id: string;
  kind: PaymentMethodKind;
  brand?: string;
  purposes: PaymentPurpose[];
  status: string;
}
