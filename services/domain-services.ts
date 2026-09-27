import type { DemoState, EvidenceAnalysis, Listing } from '@/types/domain';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async login(state: DemoState, email: string, password: string) {
    await delay();
    const user = state.users.find(
      (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
    );
    if (!user) throw new Error('USER_NOT_FOUND');
    if (user.accountStatus === 'SUSPENDED')
      throw new Error('ACCOUNT_SUSPENDED');
    if (user.password !== password) throw new Error('INVALID_CREDENTIALS');
    return user;
  },
};

export const listingService = {
  async getListings(state: DemoState) {
    await delay(120);
    return state.listings.filter((listing) => listing.status === 'ACTIVE');
  },
  async getListing(state: DemoState, id: string) {
    await delay(90);
    return state.listings.find((listing) => listing.id === id);
  },
};
export const paymentService = {
  async getAvailablePaymentMethods() {
    await delay(100);
    return ['Yape', 'Plin', 'Tarjeta'];
  },
};
export const profileService = {
  async getUser(state: DemoState, id: string) {
    await delay(90);
    return state.users.find((user) => user.id === id);
  },
};
export const verificationService = {
  async resend() {
    await delay(400);
    return { sent: true };
  },
};
export const termsService = { version: '1.0' };
export const availabilityService = {
  async get(listing: Listing) {
    await delay(80);
    return listing.availabilitySlots;
  },
};
export const requestService = {
  async list(state: DemoState) {
    await delay(80);
    return state.requests;
  },
};
export const reservationService = {
  async list(state: DemoState) {
    await delay(80);
    return state.reservations;
  },
};
export const loanService = {
  async list(state: DemoState) {
    await delay(80);
    return state.loans;
  },
};
export const evidenceService = {
  async list(state: DemoState, loanId: string) {
    await delay(80);
    return state.loans.find((loan) => loan.id === loanId)?.evidence ?? [];
  },
};
export const incidentService = {
  async list(state: DemoState) {
    await delay(80);
    return state.incidents;
  },
};
export const ratingService = {
  async forUser(state: DemoState, userId: string) {
    await delay(80);
    return state.ratings.filter((rating) => rating.targetUserId === userId);
  },
};
export const notificationService = {
  async forUser(state: DemoState, userId: string) {
    await delay(80);
    return state.notifications.filter(
      (notification) => notification.userId === userId,
    );
  },
};
export const reminderService = {
  async forUser(state: DemoState, userId: string) {
    await delay(80);
    return state.reminders.filter((reminder) => reminder.userId === userId);
  },
};
export const calendarService = {
  async forUser(state: DemoState, userId: string) {
    await delay(80);
    return state.reminders.filter((reminder) => reminder.userId === userId);
  },
};

export const evidenceAnalysisService = {
  async analyze(
    loanId: string,
    outcome: 'SUCCESS' | 'TIMEOUT' | 'ERROR' = 'SUCCESS',
  ): Promise<EvidenceAnalysis> {
    await delay(850);
    if (outcome === 'TIMEOUT')
      return {
        id: `analysis-${loanId}`,
        loanId,
        status: 'TIMEOUT',
        updatedAt: new Date().toISOString(),
      };
    if (outcome === 'ERROR')
      return {
        id: `analysis-${loanId}`,
        loanId,
        status: 'ERROR',
        updatedAt: new Date().toISOString(),
      };
    return {
      id: `analysis-${loanId}`,
      loanId,
      status: 'SUCCESS',
      summary:
        'Se observa una posible diferencia visual menor; requiere revisión humana.',
      confidence: 'MODERATE',
      updatedAt: new Date().toISOString(),
    };
  },
};
