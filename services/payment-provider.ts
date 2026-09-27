export interface PaymentMethod {
  id: string;
  label: string;
  kind: 'WALLET' | 'CARD';
}

const mockPaymentMethods: PaymentMethod[] = [
  { id: 'yape', label: 'Yape', kind: 'WALLET' },
  { id: 'plin', label: 'Plin', kind: 'WALLET' },
  { id: 'card', label: 'Tarjeta', kind: 'CARD' },
];

export function getMockPaymentMethods() {
  return mockPaymentMethods.map((method) => ({ ...method }));
}
