import type {
  PaymentPurpose,
  PaymentStatus,
  ProviderOutcome,
} from '@/types/domain';

export type PaymentMethodKind = 'CARD' | 'WALLET' | 'ACCOUNT_MONEY' | 'CASH';

export interface PaymentMethod {
  id: string;
  kind: PaymentMethodKind;
  brand?: string;
  purposes: PaymentPurpose[];
}

export interface ProviderCharge {
  reference: string;
  outcome: ProviderOutcome;
}

const methods: PaymentMethod[] = [
  {
    id: 'yape',
    kind: 'WALLET',
    brand: 'Yape',
    purposes: ['RENTAL', 'EXTENSION'],
  },
  {
    id: 'card',
    kind: 'CARD',
    purposes: ['RENTAL', 'GUARANTEE', 'EXTENSION'],
  },
  {
    id: 'account_money',
    kind: 'ACCOUNT_MONEY',
    purposes: ['RENTAL', 'GUARANTEE', 'EXTENSION'],
  },
  {
    id: 'pagoefectivo',
    kind: 'CASH',
    brand: 'PagoEfectivo',
    purposes: ['RENTAL'],
  },
];

const latency = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const reference = (prefix: string) =>
  `MP-${prefix}-${Date.now().toString(36).toUpperCase()}`;

export const mercadoPagoAdapter = {
  async listMethods(purpose: PaymentPurpose) {
    await latency(200);
    return methods
      .filter((method) => method.purposes.includes(purpose))
      .map((method) => ({ ...method }));
  },
  async charge(
    purpose: PaymentPurpose,
    outcome: ProviderOutcome = 'APPROVED',
  ): Promise<ProviderCharge> {
    await latency(700);
    return { reference: reference(purpose), outcome };
  },
  async refund(): Promise<ProviderCharge> {
    await latency(300);
    return { reference: reference('REFUND'), outcome: 'APPROVED' };
  },
  findMethod(id: string) {
    return methods.find((method) => method.id === id);
  },
};

export function paymentStatusFromOutcome(
  outcome: ProviderOutcome,
): Extract<PaymentStatus, 'PENDING_RELEASE' | 'FAILED' | 'CANCELLED'> {
  if (outcome === 'APPROVED') return 'PENDING_RELEASE';
  if (outcome === 'CANCELLED') return 'CANCELLED';
  return 'FAILED';
}

export function guaranteeStatusFromOutcome(outcome: ProviderOutcome) {
  if (outcome === 'APPROVED') return 'HELD' as const;
  if (outcome === 'CANCELLED') return 'CANCELLED' as const;
  return 'FAILED' as const;
}

export const providerOutcomes: ProviderOutcome[] = [
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'ERROR',
];
