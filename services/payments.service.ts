import { appConfig } from '@/config/app-config';
import { economicBreakdown } from '@/lib/business-rules';
import { gatewayRequest } from '@/services/api/http-client';
import { endpoints } from '@/services/api/endpoints';
import {
  mercadoPagoAdapter,
  type PaymentMethod,
} from '@/services/adapters/mercado-pago';
import type {
  CancellationPolicy,
  Listing,
  PaymentPurpose,
  ProviderOutcome,
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
  rate: appConfig.lendupCommissionRate,
};
export const costPolicy: CostPolicy = {
  providerFeeRate: appConfig.providerFeeRate,
  cancellation: { borrowerRefundRate: 1, lenderRefundRate: 1 },
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
    if (!appConfig.demoMode)
      return gatewayRequest<PaymentMethod[]>(endpoints.payments.methods, {
        query: { proposito: purpose },
      });
    return mercadoPagoAdapter.listMethods(purpose);
  },
  charge(purpose: PaymentPurpose, outcome?: ProviderOutcome) {
    return mercadoPagoAdapter.charge(purpose, outcome);
  },
};

export type { PaymentMethod } from '@/services/adapters/mercado-pago';
