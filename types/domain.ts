export type Role = 'STUDENT' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type VerificationStatus =
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'VERIFIED'
  | 'ERROR';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type ReservationStatus =
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'ACTIVATED'
  | 'COMPLETED';
export type LoanStatus =
  | 'PENDING_DELIVERY'
  | 'PENDING_RECEIPT'
  | 'ACTIVE'
  | 'RETURN_RECORDED'
  | 'RETURN_CONFIRMED_PENDING_INCIDENT'
  | 'COMPLETED'
  | 'OVERDUE';
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PENDING_RELEASE'
  | 'RELEASED'
  | 'REFUNDED'
  | 'FAILED';
export type GuaranteeStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'PROCESSING'
  | 'HELD'
  | 'FAILED'
  | 'CANCELLED'
  | 'RELEASED'
  | 'PARTIALLY_CAPTURED'
  | 'CAPTURED'
  | 'REFUNDED';
export type IncidentType =
  | 'DAMAGE'
  | 'LOSS'
  | 'LATE_RETURN'
  | 'NON_RETURN'
  | 'OTHER';
export type IncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
export type IncidentDecision = 'NO_IMPACT' | 'PARTIAL' | 'TOTAL';
export type ExtensionStatus =
  | 'PENDING'
  | 'PAYMENT_PENDING'
  | 'ACCEPTED'
  | 'REJECTED';
export type RescheduleStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type AnalysisStatus =
  | 'IDLE'
  | 'ANALYZING'
  | 'SUCCESS'
  | 'TIMEOUT'
  | 'ERROR';
export type TransactionType =
  | 'RENTAL_PAYMENT'
  | 'RENTAL_RELEASE'
  | 'GUARANTEE_HOLD'
  | 'GUARANTEE_RELEASE'
  | 'GUARANTEE_PARTIAL_CAPTURE'
  | 'GUARANTEE_CAPTURE'
  | 'REFUND'
  | 'EXTENSION_PAYMENT';

export interface University {
  id: string;
  name: string;
}
export interface Campus {
  id: string;
  universityId: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  firstName: string;
  email: string;
  phone: string;
  initials: string;
  avatar?: string;
  university: string;
  campus: string;
  career: string;
  cycle: string;
  rating: number;
  ratingCount: number;
  completedLoans: number;
  verified: boolean;
  verificationStatus: VerificationStatus;
  role: Role;
  accountStatus: AccountStatus;
  password: string;
}

export interface ListingMedia {
  id: string;
  type: 'PHOTO' | 'VIDEO';
  url: string;
  name: string;
}
export interface AvailabilitySlot {
  id: string;
  startAt: string;
  endAt: string;
  status: 'AVAILABLE' | 'RESERVED';
  reservationId?: string;
}
export interface TermsSnapshot {
  dailyRate: number;
  guaranteeAmount: number;
  usage: string;
  delivery: string;
  returnPolicy: string;
  cancellation: string;
  exchangePlace: string;
  startAt: string;
  endAt: string;
  originalEndAt: string;
  providerFee: number;
  cancellationPolicy: {
    borrowerRefundRate: number;
    lenderRefundRate: number;
    description: string;
  };
}
export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  category: string;
  description: string;
  condition: string;
  university: string;
  campus: string;
  location: string;
  exchangePlace: string;
  dailyRate: number;
  guaranteeAmount: number;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  image: string;
  media: ListingMedia[];
  availability: string[];
  availabilitySlots: AvailabilitySlot[];
  terms: Pick<
    TermsSnapshot,
    'usage' | 'delivery' | 'returnPolicy' | 'cancellation'
  >;
}
export interface LoanRequest {
  id: string;
  listingId: string;
  borrowerId: string;
  lenderId: string;
  startAt: string;
  endAt: string;
  status: RequestStatus;
  createdAt: string;
  snapshot: TermsSnapshot;
}
export type ReservationSnapshot = TermsSnapshot;
export interface Reservation {
  id: string;
  requestId: string;
  listingId: string;
  borrowerId: string;
  lenderId: string;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  guaranteeStatus: GuaranteeStatus;
  paymentMethod?: string;
  guaranteePaymentMethod?: string;
  deliveryRecorded: boolean;
  receiptConfirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  snapshot: ReservationSnapshot;
}
export interface TimelineEvent {
  id: string;
  label: string;
  date: string;
  complete: boolean;
}
export interface Evidence {
  id: string;
  phase: 'INITIAL' | 'FINAL' | 'INCIDENT';
  type: 'PHOTO' | 'VIDEO' | 'NOTE';
  label: string;
  description: string;
  author: string;
  authorId: string;
  createdAt: string;
  url?: string;
}
export interface EvidenceAnalysis {
  id: string;
  loanId: string;
  status: AnalysisStatus;
  summary?: string;
  confidence?: 'LOW' | 'MODERATE' | 'HIGH';
  updatedAt: string;
}
export interface LoanExtension {
  id: string;
  requesterId: string;
  requestedAt: string;
  originalReturnAt: string;
  proposedReturnAt: string;
  additionalCost: number;
  status: ExtensionStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  resultingReturnAt?: string;
  respondedAt?: string;
}
export interface LoanReschedule {
  id: string;
  proposerId: string;
  proposedAt: string;
  originalReturnAt: string;
  proposedReturnAt: string;
  additionalCost: 0;
  status: RescheduleStatus;
  respondedAt?: string;
}
export interface LoanReturn {
  registeredAt: string;
  confirmedAt?: string;
  early: boolean;
  notes: string;
}
export interface Loan {
  id: string;
  reservationId: string;
  listingId: string;
  borrowerId: string;
  lenderId: string;
  status: LoanStatus;
  paymentStatus: PaymentStatus;
  guaranteeStatus: GuaranteeStatus;
  snapshot: TermsSnapshot;
  currentReturnAt: string;
  originalReturnAt: string;
  actualReturnAt?: string;
  receiptConfirmedAt?: string;
  earlyReturn?: boolean;
  extensionStatus?: ExtensionStatus;
  extensionEndAt?: string;
  extensions: LoanExtension[];
  reschedules: LoanReschedule[];
  returnRecord?: LoanReturn;
  evidence: Evidence[];
  timeline: TimelineEvent[];
  ratedBy: string[];
}
export interface IncidentResolution {
  decision: IncidentDecision;
  amount: number;
  justification: string;
  resolvedAt: string;
}
export interface IncidentAdminNote {
  id: string;
  adminId: string;
  text: string;
  createdAt: string;
}
export interface Incident {
  id: string;
  loanId: string;
  type: IncidentType;
  reportedBy: string;
  description: string;
  counterpartyStatement?: string;
  evidence: Evidence[];
  status: IncidentStatus;
  createdAt: string;
  reviewStartedAt?: string;
  reviewedBy?: string;
  adminNotes: IncidentAdminNote[];
  guaranteeAmount: number;
  resolution?: IncidentResolution;
}
export interface Rating {
  id: string;
  stars: number;
  comment: string;
  authorId: string;
  targetUserId: string;
  loanId: string;
  createdAt: string;
}
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  href: string;
  event: string;
}
export interface Reminder {
  id: string;
  userId: string;
  operationId: string;
  title: string;
  dueAt: string;
  kind: 'DELIVERY' | 'RETURN' | 'ACTION';
  href: string;
}
export interface PaymentTransaction {
  id: string;
  userId: string;
  loanId?: string;
  reservationId?: string;
  incidentId?: string;
  createdAt: string;
  updatedAt: string;
  type: TransactionType;
  amount: number;
  currency: 'PEN';
  method: string;
  providerReference: string;
  status: PaymentStatus | GuaranteeStatus;
}
export interface TermsAcceptance {
  userId: string;
  version: string;
  acceptedAt: string;
}
export interface DemoState {
  version: 3;
  currentUserId: string;
  authenticated: boolean;
  termsAccepted: boolean;
  termsAcceptances: TermsAcceptance[];
  users: User[];
  listings: Listing[];
  requests: LoanRequest[];
  reservations: Reservation[];
  loans: Loan[];
  incidents: Incident[];
  analyses: EvidenceAnalysis[];
  ratings: Rating[];
  notifications: AppNotification[];
  reminders: Reminder[];
  transactions: PaymentTransaction[];
}
