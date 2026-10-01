import { appConfig } from '@/config/app-config';
import { hasAcceptedTerms, hasUnresolvedIncident } from '@/lib/business-rules';
import type { DemoState, Listing, Loan, User } from '@/types/domain';

export function currentUserOf(state: DemoState): User | undefined {
  return state.users.find((user) => user.id === state.currentUserId);
}

export function userById(state: DemoState, id: string | undefined) {
  return state.users.find((user) => user.id === id);
}

export function listingById(state: DemoState, id: string | undefined) {
  return state.listings.find((listing) => listing.id === id);
}

export function termsAcceptedBy(state: DemoState, userId: string) {
  return hasAcceptedTerms(
    state.termsAcceptances,
    userId,
    appConfig.termsVersion,
  );
}

export function reputationOf(state: DemoState, userId: string) {
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

export function loansOf(state: DemoState, userId: string) {
  return state.loans.filter(
    (loan) => loan.borrowerId === userId || loan.lenderId === userId,
  );
}

export function incidentsOfLoan(state: DemoState, loanId: string) {
  return state.incidents.filter((incident) => incident.loanId === loanId);
}

export function loanHasOpenIncident(state: DemoState, loan: Loan) {
  return hasUnresolvedIncident(
    incidentsOfLoan(state, loan.id).map((incident) => incident.status),
  );
}

export function pendingRequestsFor(state: DemoState, listing: Listing) {
  return state.requests.filter(
    (request) =>
      request.listingId === listing.id && request.status === 'PENDING',
  ).length;
}
