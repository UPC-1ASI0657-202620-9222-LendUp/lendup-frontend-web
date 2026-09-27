import { economicBreakdown } from '@/lib/business-rules';
import {
  getMockPaymentMethods,
  type PaymentMethod,
} from '@/services/payment-provider';
import type {
  AvailabilitySlot,
  DemoState,
  Evidence,
  EvidenceAnalysis,
  Incident,
  Listing,
  Loan,
  PaymentTransaction,
  Rating,
  Reservation,
  TermsSnapshot,
  User,
  VerificationStatus,
} from '@/types/domain';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export type DomainErrorCode =
  | 'LISTING_NOT_AVAILABLE'
  | 'OVERLAPPING_RESERVATION'
  | 'FORBIDDEN'
  | 'NOT_PARTICIPANT'
  | 'PAYMENT_REQUIRED'
  | 'GUARANTEE_REQUIRED'
  | 'INVALID_STATE_TRANSITION'
  | 'LOAN_ALREADY_ACTIVE_CANNOT_CANCEL'
  | 'EXTENSION_PAYMENT_REQUIRED'
  | 'INCIDENT_PENDING'
  | 'PAYMENT_PROVIDER_UNAVAILABLE';

export type { PaymentMethod } from '@/services/payment-provider';
export interface AuthService {
  login(state: DemoState, email: string, password: string): Promise<User>;
}
export interface VerificationService {
  resend(): Promise<{ sent: boolean; status: VerificationStatus }>;
}
export interface TermsService {
  version: string;
}
export interface ProfileService {
  getUser(state: DemoState, id: string): Promise<User | undefined>;
}
export interface ListingService {
  getListings(state: DemoState): Promise<Listing[]>;
  getListing(state: DemoState, id: string): Promise<Listing | undefined>;
}
export interface AvailabilityService {
  get(listing: Listing): Promise<AvailabilitySlot[]>;
}
export interface RequestService {
  list(state: DemoState): Promise<DemoState['requests']>;
}
export interface ReservationService {
  list(state: DemoState): Promise<Reservation[]>;
}
export interface LoanService {
  list(state: DemoState): Promise<Loan[]>;
}
export interface PaymentService {
  getAvailablePaymentMethods(): Promise<PaymentMethod[]>;
  getEconomicQuote(
    snapshot: Pick<
      TermsSnapshot,
      'dailyRate' | 'startAt' | 'endAt' | 'guaranteeAmount'
    >,
  ): Promise<ReturnType<typeof economicBreakdown>>;
  getEconomicQuoteSync(
    snapshot: Pick<
      TermsSnapshot,
      'dailyRate' | 'startAt' | 'endAt' | 'guaranteeAmount'
    >,
  ): ReturnType<typeof economicBreakdown>;
}
export interface EvidenceService {
  list(state: DemoState, loanId: string): Promise<Evidence[]>;
}
export interface IncidentService {
  list(state: DemoState): Promise<Incident[]>;
}
export interface RatingService {
  forUser(state: DemoState, userId: string): Promise<Rating[]>;
}
export interface NotificationService {
  forUser(
    state: DemoState,
    userId: string,
  ): Promise<DemoState['notifications']>;
}
export interface ReminderService {
  forUser(state: DemoState, userId: string): Promise<DemoState['reminders']>;
}
export type CalendarService = ReminderService;

export type BackendOperationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DomainErrorCode; message: string };
export type EconomicTransaction = PaymentTransaction;

export const authService: AuthService = {
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

export const listingService: ListingService = {
  async getListings(state: DemoState) {
    await delay(120);
    return state.listings.filter((listing) => listing.status === 'ACTIVE');
  },
  async getListing(state: DemoState, id: string) {
    await delay(90);
    return state.listings.find((listing) => listing.id === id);
  },
};
export const paymentService: PaymentService = {
  async getAvailablePaymentMethods() {
    await delay(100);
    return getMockPaymentMethods();
  },
  async getEconomicQuote(snapshot) {
    await delay(100);
    return economicBreakdown({ ...snapshot, providerFee: 0 });
  },
  getEconomicQuoteSync(snapshot) {
    return economicBreakdown({ ...snapshot, providerFee: 0 });
  },
};
export const profileService: ProfileService = {
  async getUser(state: DemoState, id: string) {
    await delay(90);
    return state.users.find((user) => user.id === id);
  },
};
export const verificationService: VerificationService = {
  async resend() {
    await delay(400);
    return { sent: true, status: 'SENT' };
  },
};
export const termsService: TermsService = { version: '1.0' };
export const availabilityService: AvailabilityService = {
  async get(listing: Listing) {
    await delay(80);
    return listing.availabilitySlots;
  },
};
export const requestService: RequestService = {
  async list(state: DemoState) {
    await delay(80);
    return state.requests;
  },
};
export const reservationService: ReservationService = {
  async list(state: DemoState) {
    await delay(80);
    return state.reservations;
  },
};
export const loanService: LoanService = {
  async list(state: DemoState) {
    await delay(80);
    return state.loans;
  },
};
export const evidenceService: EvidenceService = {
  async list(state: DemoState, loanId: string) {
    await delay(80);
    return state.loans.find((loan) => loan.id === loanId)?.evidence ?? [];
  },
};
export const incidentService: IncidentService = {
  async list(state: DemoState) {
    await delay(80);
    return state.incidents;
  },
};
export const ratingService: RatingService = {
  async forUser(state: DemoState, userId: string) {
    await delay(80);
    return state.ratings.filter((rating) => rating.targetUserId === userId);
  },
};
export const notificationService: NotificationService = {
  async forUser(state: DemoState, userId: string) {
    await delay(80);
    return state.notifications.filter(
      (notification) => notification.userId === userId,
    );
  },
};
export const reminderService: ReminderService = {
  async forUser(state: DemoState, userId: string) {
    await delay(80);
    return state.reminders.filter((reminder) => reminder.userId === userId);
  },
};
export const calendarService: CalendarService = {
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
