import { hasUnresolvedIncident } from '@/lib/business-rules';
import type { AppState, Listing, Loan, User } from '@/types/domain';

export function currentUserOf(state: AppState): User | undefined {
  return state.users.find((user) => user.id === state.currentUserId);
}

export function userById(state: AppState, id: string | undefined) {
  return state.users.find((user) => user.id === id);
}

export function listingById(state: AppState, id: string | undefined) {
  return state.listings.find((listing) => listing.id === id);
}

export function termsAcceptedBy(state: AppState, userId: string) {
  return state.termsAcceptances.some((item) => item.userId === userId);
}

export function reputationOf(state: AppState, userId: string) {
  const ratings = state.ratings.filter(
    (rating) => rating.targetUserId === userId,
  );
  const average = ratings.length
    ? ratings.reduce((sum, rating) => sum + rating.stars, 0) / ratings.length
    : 0;
  const completedLoans = state.loans.filter(
    (loan) =>
      loan.status === 'COMPLETED' &&
      (loan.borrowerId === userId || loan.lenderId === userId),
  ).length;
  return {
    average: Math.round(average * 10) / 10,
    count: ratings.length,
    completedLoans,
    ratings,
  };
}

export function loansOf(state: AppState, userId: string) {
  return state.loans.filter(
    (loan) => loan.borrowerId === userId || loan.lenderId === userId,
  );
}

export function incidentsOfLoan(state: AppState, loanId: string) {
  return state.incidents.filter((incident) => incident.loanId === loanId);
}

export function loanHasOpenIncident(state: AppState, loan: Loan) {
  return hasUnresolvedIncident(
    incidentsOfLoan(state, loan.id).map((incident) => incident.status),
  );
}

export function pendingRequestsFor(state: AppState, listing: Listing) {
  return state.requests.filter(
    (request) =>
      request.listingId === listing.id && request.status === 'PENDING',
  ).length;
}
