export type Role = 'STUDENT' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type VerificationStatus =
  | 'PENDING'
  | 'SENDING'
  | 'SENT'
  | 'VERIFIED'
  | 'ERROR';
export type ListingStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type ReservationStatus =
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'ACTIVATED'
  | 'COMPLETED';
export type LoanStatus =
  | 'PENDING_RECEIPT'
  | 'ACTIVE'
  | 'OVERDUE'
  | 'RETURN_RECORDED'
  | 'RETURN_CONFIRMED_PENDING_INCIDENT'
  | 'COMPLETED';
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PENDING_RELEASE'
  | 'RELEASED'
  | 'REFUNDED'
  | 'FAILED'
  | 'CANCELLED';
export type GuaranteeStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'PROCESSING'
  | 'HELD'
  | 'FAILED'
  | 'CANCELLED'
  | 'RELEASED'
  | 'PARTIALLY_CAPTURED'
  | 'CAPTURED';
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
export type TransactionStatus = PaymentStatus | GuaranteeStatus;
export type EvidencePhase = 'INITIAL' | 'FINAL' | 'INCIDENT';
export type EvidenceType = 'PHOTO' | 'VIDEO' | 'NOTE';
export type CategoryCode =
  | 'CALCULATORS'
  | 'CAMERAS'
  | 'BOOKS'
  | 'TOOLS'
  | 'ELECTRONICS'
  | 'OTHER';
export type ConditionCode = 'NEW' | 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'FAIR';
export type PaymentPurpose = 'RENTAL' | 'GUARANTEE' | 'EXTENSION';
export type ProviderOutcome = 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ERROR';

export interface Coordinates {
  lat: number;
  lng: number;
}
export interface Campus {
  id: string;
  name: string;
  district: string;
  coordinates: Coordinates;
}
export interface University {
  id: string;
  shortName: string;
  name: string;
  emailDomains: string[];
  campuses: Campus[];
}

export interface User {
  id: string;
  name: string;
  firstName: string;
  email: string;
  phone: string;
  initials: string;
  avatar?: string;
  universityId: string;
  campus: string;
  career: string;
  cycle: string;
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
export interface ListingTerms {
  usage: string;
  delivery: string;
  returnPolicy: string;
  cancellation: string;
}
export interface CancellationPolicy {
  borrowerRefundRate: number;
  lenderRefundRate: number;
}
export interface TermsSnapshot extends ListingTerms {
  dailyRate: number;
  guaranteeAmount: number;
  commissionRate: number;
  providerFeeRate: number;
  exchangePlace: string;
  startAt: string;
  endAt: string;
  originalEndAt: string;
  cancellationPolicy: CancellationPolicy;
  acceptedAt: string;
}
export interface Listing {
  id: string;
  ownerId: string;
  title: string;
  category: CategoryCode;
  description: string;
  condition: ConditionCode;
  universityId: string;
  campus: string;
  location: string;
  exchangePlace: string;
  dailyRate: number;
  guaranteeAmount: number;
  status: ListingStatus;
  image: string;
  media: ListingMedia[];
  availabilitySlots: AvailabilitySlot[];
  terms: ListingTerms;
  createdAt: string;
}
export interface LoanRequest {
  id: string;
  listingId: string;
  borrowerId: string;
  lenderId: string;
  startAt: string;
  endAt: string;
  message?: string;
  status: RequestStatus;
  createdAt: string;
  respondedAt?: string;
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
  deliveredAt?: string;
  receiptConfirmedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
  snapshot: ReservationSnapshot;
}
export type TimelineEventCode =
  | 'DELIVERY_RECORDED'
  | 'RECEIPT_PENDING'
  | 'RECEIPT_CONFIRMED'
  | 'RETURN_RECORDED'
  | 'EARLY_RETURN_RECORDED'
  | 'RETURN_CONFIRMATION_PENDING'
  | 'RETURN_CONFIRMED_PENDING_INCIDENT'
  | 'LOAN_COMPLETED'
  | 'LOAN_OVERDUE'
  | 'INCIDENT_REPORTED'
  | 'INCIDENT_REVIEW'
  | 'INCIDENT_RESOLVED';
export interface TimelineEvent {
  id: string;
  event: TimelineEventCode;
  at?: string;
  complete: boolean;
}
export interface Evidence {
  id: string;
  phase: EvidencePhase;
  type: EvidenceType;
  label: string;
  description: string;
  author: string;
  authorId: string;
  createdAt: string;
  url?: string;
}
export type AnalysisFindingCode =
  | 'NO_VISIBLE_CHANGES'
  | 'MINOR_SURFACE_MARKS'
  | 'MISSING_ACCESSORY'
  | 'VISIBLE_DAMAGE';
export interface EvidenceAnalysis {
  id: string;
  loanId: string;
  status: AnalysisStatus;
  findings?: AnalysisFindingCode[];
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
  status: RescheduleStatus;
  resultingReturnAt?: string;
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
  deliveredAt: string;
  currentReturnAt: string;
  originalReturnAt: string;
  actualReturnAt?: string;
  receiptConfirmedAt?: string;
  completedAt?: string;
  earlyReturn?: boolean;
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
  refundedAmount: number;
  justification: string;
  resolvedAt: string;
  resolvedBy: string;
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
  counterpartyStatementAt?: string;
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
export type NotificationEvent =
  | 'REQUEST_CREATED'
  | 'REQUEST_CANCELLED'
  | 'REQUEST_ACCEPTED'
  | 'REQUEST_REJECTED'
  | 'RESERVATION_CANCELLED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'GUARANTEE_HELD'
  | 'GUARANTEE_FAILED'
  | 'DELIVERY_REGISTERED'
  | 'RECEIPT_CONFIRMED'
  | 'RENTAL_RELEASED'
  | 'EXTENSION_REQUESTED'
  | 'EXTENSION_ACCEPTED_PAYMENT_PENDING'
  | 'EXTENSION_ACCEPTED'
  | 'EXTENSION_REJECTED'
  | 'EXTENSION_PAYMENT_CONFIRMED'
  | 'RESCHEDULE_PROPOSED'
  | 'RESCHEDULE_ACCEPTED'
  | 'RESCHEDULE_REJECTED'
  | 'RETURN_REGISTERED'
  | 'EARLY_RETURN_REGISTERED'
  | 'RETURN_CONFIRMED_PENDING_INCIDENT'
  | 'LOAN_COMPLETED'
  | 'LOAN_OVERDUE'
  | 'INCIDENT_CREATED'
  | 'INCIDENT_ADMIN_NEW'
  | 'INCIDENT_UNDER_REVIEW'
  | 'INCIDENT_RESOLVED'
  | 'RATING_RECEIVED';
export interface NotificationParams {
  item?: string;
  incidentId?: string;
  reason?: string;
}
export interface AppNotification {
  id: string;
  userId: string;
  event: NotificationEvent;
  params: NotificationParams;
  createdAt: string;
  read: boolean;
  href: string;
}
export type ReminderKind =
  | 'PAYMENT_DUE'
  | 'DELIVERY'
  | 'RECEIPT'
  | 'RETURN'
  | 'RETURN_RECEIPT';
export interface Reminder {
  id: string;
  userId: string;
  operationId: string;
  listingId: string;
  kind: ReminderKind;
  dueAt: string;
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
  status: TransactionStatus;
}
export interface TermsAcceptance {
  userId: string;
  version: string;
  acceptedAt: string;
}
export interface DemoState {
  version: 4;
  currentUserId: string;
  authenticated: boolean;
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
