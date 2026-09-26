export type Role = 'STUDENT' | 'ADMIN';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type ReservationStatus = 'CONFIRMED' | 'CANCELLED' | 'ACTIVATED' | 'COMPLETED';
export type LoanStatus = 'PENDING_DELIVERY' | 'PENDING_RECEIPT' | 'ACTIVE' | 'RETURN_RECORDED' | 'COMPLETED' | 'OVERDUE';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PENDING_RELEASE' | 'RELEASED' | 'REFUNDED' | 'FAILED';
export type GuaranteeStatus = 'PENDING' | 'HELD' | 'RELEASED' | 'PARTIAL' | 'TOTAL' | 'REFUNDED';
export type IncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';

export interface User { id: string; name: string; firstName: string; email: string; initials: string; university: string; campus: string; career: string; cycle: string; rating: number; completedLoans: number; verified: boolean; role: Role; }
export interface TermsSnapshot { dailyRate: number; guaranteeAmount: number; usage: string; delivery: string; returnPolicy: string; cancellation: string; exchangePlace: string; startAt: string; endAt: string; originalEndAt: string; }
export interface Listing { id: string; ownerId: string; title: string; category: string; description: string; condition: string; university: string; campus: string; location: string; exchangePlace: string; dailyRate: number; guaranteeAmount: number; status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'; image: string; availability: string[]; terms: Pick<TermsSnapshot, 'usage' | 'delivery' | 'returnPolicy' | 'cancellation'>; }
export interface LoanRequest { id: string; listingId: string; borrowerId: string; lenderId: string; startAt: string; endAt: string; status: RequestStatus; createdAt: string; snapshot: TermsSnapshot; }
export interface Reservation { id: string; requestId: string; listingId: string; borrowerId: string; lenderId: string; status: ReservationStatus; paymentStatus: PaymentStatus; guaranteeStatus: GuaranteeStatus; deliveryRecorded: boolean; snapshot: TermsSnapshot; }
export interface TimelineEvent { id: string; label: string; date: string; complete: boolean; }
export interface Evidence { id: string; stage: 'BEFORE' | 'AFTER'; type: 'PHOTO' | 'VIDEO'; label: string; author: string; date: string; }
export interface Loan { id: string; reservationId: string; listingId: string; borrowerId: string; lenderId: string; status: LoanStatus; paymentStatus: PaymentStatus; guaranteeStatus: GuaranteeStatus; snapshot: TermsSnapshot; actualReturnAt?: string; earlyReturn?: boolean; extensionStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED'; extensionEndAt?: string; evidence: Evidence[]; timeline: TimelineEvent[]; ratedBy: string[]; }
export interface Incident { id: string; loanId: string; type: 'Daño' | 'Pérdida' | 'Retraso' | 'No devolución' | 'Otro'; reportedBy: string; description: string; status: IncidentStatus; createdAt: string; guaranteeAmount: number; resolution?: { decision: 'NONE' | 'PARTIAL' | 'TOTAL'; amount: number; justification: string }; }
export interface AppNotification { id: string; userId: string; title: string; message: string; createdAt: string; read: boolean; href: string; }
export interface Reminder { id: string; userId: string; title: string; dueAt: string; kind: 'DELIVERY' | 'RETURN' | 'ACTION'; href: string; }
export interface Transaction { id: string; userId: string; loanId: string; date: string; type: string; amount: number; method: string; status: string; }
export interface DemoState { currentUserId: string; authenticated: boolean; termsAccepted: boolean; users: User[]; listings: Listing[]; requests: LoanRequest[]; reservations: Reservation[]; loans: Loan[]; incidents: Incident[]; notifications: AppNotification[]; reminders: Reminder[]; transactions: Transaction[]; }
