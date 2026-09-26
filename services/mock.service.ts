import type { DemoState, Listing } from '@/types/domain';

const delay = (ms = 260) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const listingService = {
  async getListings(state: DemoState): Promise<Listing[]> { await delay(); return state.listings.filter((item) => item.status === 'ACTIVE'); },
  async getListingById(state: DemoState, id: string): Promise<Listing | undefined> { await delay(180); return state.listings.find((item) => item.id === id); },
};

export const paymentService = {
  async getAvailablePaymentMethods() { await delay(220); return [{ id: 'yape', label: 'Yape', detail: 'Cuenta terminada en 728' }, { id: 'visa', label: 'Visa', detail: 'Tarjeta terminada en 1042' }, { id: 'plin', label: 'Plin', detail: 'Cuenta verificada' }]; },
};
