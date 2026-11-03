import type { PaymentPurpose } from '@/types/domain';

/** Checkout Pro pages live on Mercado Pago domains; anything else is never followed. */
const CHECKOUT_HOSTS = [
  'mercadopago.com',
  'mercadopago.com.pe',
  'mercadopago.com.ar',
  'mercadopago.com.mx',
  'mercadopago.cl',
  'mercadopago.com.co',
  'mercadopago.com.br',
];

export function isTrustedCheckoutUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === 'https:' &&
      CHECKOUT_HOSTS.some(
        (allowed) => host === allowed || host.endsWith(`.${allowed}`),
      )
    );
  } catch {
    return false;
  }
}

export interface PendingCheckout {
  transactionId: string;
  loanId: string;
  reservationId?: string;
  purpose: PaymentPurpose;
  startedAt: string;
}

const STORAGE_KEY = 'lendup.pendingCheckout';

/** Kept in sessionStorage so the return page knows which loan to check after Mercado Pago redirects back. */
export function rememberCheckout(checkout: PendingCheckout) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(checkout));
  } catch {
    // Private mode or blocked storage: the return page falls back to the transactions list.
  }
}

export function readPendingCheckout(): PendingCheckout | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const value = JSON.parse(raw) as Partial<PendingCheckout>;
    return value.transactionId && value.loanId && value.purpose
      ? (value as PendingCheckout)
      : undefined;
  } catch {
    return undefined;
  }
}

export function clearPendingCheckout() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clean.
  }
}

export type CheckoutOutcome = 'CONFIRMED' | 'REJECTED' | 'PENDING';

/** Final state of the transaction according to lendup-payments-service (the webhook is the source of truth, not the return URL). */
export function checkoutOutcome(estado: unknown): CheckoutOutcome {
  if (estado === 'CONFIRMADA') return 'CONFIRMED';
  if (estado === 'RECHAZADA' || estado === 'CANCELADA' || estado === 'FALLIDA')
    return 'REJECTED';
  return 'PENDING';
}
