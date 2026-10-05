'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  LayoutGrid,
  Phone,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Star,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DefinitionList,
  EconomicSummary,
  EmptyState,
  ErrorState,
  Feedback,
  FinancialCard,
  LoadingSkeleton,
  MapPreview,
  NotFound,
  PageHeader,
  Reputation,
  StatusBadge,
  Timeline,
  UserChip,
} from '@/components/lendup/shared';
import {
  AnalysisPanel,
  EvidenceGallery,
  EvidenceUploader,
} from '@/components/lendup/evidence';
import { ConfirmDialog, Field } from '@/components/lendup/forms';
import { fromZonedInput, toZonedInput } from '@/lib/dates';
import { useEvidenceAnalysis } from '@/hooks/use-evidence-analysis';
import { useOperationGate } from '@/hooks/use-operation-gate';
import { usePaymentMethodLabel } from '@/hooks/use-payment-method-label';
import { useI18n, type MessageKey } from '@/lib/i18n';
import {
  canCancelReservation,
  canRetryPayment,
  canViewCounterpartyPhone,
  cancellationRefund,
  counterpartOf,
  economicBreakdown,
  extensionCost,
  isPaymentSettled,
  loanNextAction,
  type LoanNextAction,
} from '@/lib/business-rules';
import { campusCoordinates, findUniversity } from '@/services/catalog.service';
import {
  paymentsService,
  type PaymentMethod,
} from '@/services/payments.service';
import { useLendUp, type ActionResult } from '@/hooks/use-lendup';
import {
  currentUserOf,
  incidentsOfLoan,
  listingById,
  loanHasOpenIncident,
  reputationOf,
  userById,
} from '@/stores/selectors';
import type {
  Evidence,
  Loan,
  LoanRequest,
  PaymentPurpose,
  Reservation,
  User,
} from '@/types/domain';

function roleLabel(isBorrower: boolean) {
  return isBorrower ? 'operations.asBorrower' : 'operations.asLender';
}

function Tabs<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="tabs-bar" role="tablist" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={value === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="pill-count">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function PartyCard({
  title,
  user,
  showPhone,
}: {
  title: string;
  user?: User;
  showPhone: boolean;
}) {
  const { t } = useI18n();
  const { state } = useLendUp();
  if (!user) return null;
  const reputation = reputationOf(state, user.id);
  return (
    <section className="panel">
      <p className="eyebrow">{title}</p>
      <UserChip
        user={user}
        link
        detail={`${findUniversity(user.universityId)?.shortName ?? user.universityId} · ${user.campus}`}
      />
      <Reputation value={reputation.average} count={reputation.count} />
      {showPhone ? (
        <div className="contact-card">
          <Phone aria-hidden="true" />
          <div>
            <strong>{t('operations.contactTitle')}</strong>
            <a href={`tel:${user.phone.replace(/\s/g, '')}`}>{user.phone}</a>
          </div>
        </div>
      ) : (
        <p className="muted small">{t('operations.phoneHidden')}</p>
      )}
    </section>
  );
}

export function RequestsPage() {
  const { t, formatDateTime } = useI18n();
  const { state, respondRequest, cancelRequest } = useLendUp();
  const [params] = useSearchParams();
  const { guard, dialog } = useOperationGate();
  const received = state.requests.filter(
    (request) => request.lenderId === state.currentUserId,
  );
  const sent = state.requests.filter(
    (request) => request.borrowerId === state.currentUserId,
  );
  const [tab, setTab] = useState<'sent' | 'received'>(
    params.get('tab') === 'received' ||
      (params.get('tab') !== 'sent' &&
        received.some((r) => r.status === 'PENDING'))
      ? 'received'
      : 'sent',
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    kind: 'accept' | 'reject' | 'cancel';
  } | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const rows = (tab === 'sent' ? sent : received).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const target = state.requests.find(
    (request) => request.id === pendingAction?.id,
  );

  const confirm = async () => {
    if (!pendingAction) return;
    const run = async () =>
      setResult(
        await (pendingAction.kind === 'cancel'
          ? cancelRequest(pendingAction.id)
          : respondRequest(pendingAction.id, pendingAction.kind === 'accept')),
      );
    setPendingAction(null);
    if (pendingAction.kind === 'accept') guard(run);
    else run();
  };

  return (
    <>
      <PageHeader
        eyebrow={t('requests.eyebrow')}
        title={t('requests.title')}
        description={t('requests.description')}
      />
      <Tabs
        label={t('requests.title')}
        value={tab}
        onChange={(value) => {
          setTab(value);
          setResult(null);
        }}
        options={[
          {
            value: 'received',
            label: t('requests.received'),
            count: received.filter((r) => r.status === 'PENDING').length,
          },
          {
            value: 'sent',
            label: t('requests.sent'),
            count: sent.filter((r) => r.status === 'PENDING').length,
          },
        ]}
      />
      <Feedback result={result} />
      {rows.length ? (
        <ul className="operation-list">
          {rows.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              mode={tab}
              expanded={expanded === request.id}
              onToggle={() =>
                setExpanded((current) =>
                  current === request.id ? null : request.id,
                )
              }
              onAction={(kind) => setPendingAction({ id: request.id, kind })}
            />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={
            tab === 'sent'
              ? t('requests.emptySentTitle')
              : t('requests.emptyReceivedTitle')
          }
          description={
            tab === 'sent'
              ? t('requests.emptySentDescription')
              : t('requests.emptyReceivedDescription')
          }
          action={tab === 'sent' ? t('nav.explore') : undefined}
          href={tab === 'sent' ? '/explore' : undefined}
        />
      )}
      <ConfirmDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={
          pendingAction ? t(`requests.confirm.${pendingAction.kind}.title`) : ''
        }
        description={
          pendingAction && target
            ? t(`requests.confirm.${pendingAction.kind}.description`, {
                title: listingById(state, target.listingId)?.title ?? '',
                period: `${formatDateTime(target.startAt)} – ${formatDateTime(target.endAt)}`,
              })
            : undefined
        }
        confirmLabel={
          pendingAction
            ? t(`requests.confirm.${pendingAction.kind}.action`)
            : ''
        }
        destructive={pendingAction?.kind !== 'accept'}
        onConfirm={confirm}
      />
      {dialog}
    </>
  );
}

function RequestCard({
  request,
  mode,
  expanded,
  onToggle,
  onAction,
}: {
  request: LoanRequest;
  mode: 'sent' | 'received';
  expanded: boolean;
  onToggle: () => void;
  onAction: (kind: 'accept' | 'reject' | 'cancel') => void;
}) {
  const { t, formatDateTime, formatMoney, formatRelative } = useI18n();
  const { state } = useLendUp();
  const listing = listingById(state, request.listingId);
  const person = userById(
    state,
    mode === 'sent' ? request.lenderId : request.borrowerId,
  );
  const reservation = state.reservations.find(
    (item) => item.requestId === request.id,
  );
  const reputation = person ? reputationOf(state, person.id) : undefined;
  const breakdown = economicBreakdown(request.snapshot);
  const detailsId = `request-details-${request.id}`;
  return (
    <li className="operation-card panel">
      <img src={listing?.image} alt="" />
      <div className="operation-main">
        <div className="operation-top">
          <StatusBadge kind="request" status={request.status} />
          <span className="muted small">
            {t('requests.createdAgo', {
              time: formatRelative(request.createdAt),
            })}
          </span>
        </div>
        <h2>
          <Link to={`/objects/${request.listingId}`}>{listing?.title}</Link>
        </h2>
        <UserChip
          user={person}
          link
          detail={t(mode === 'sent' ? 'roles.LENDER' : 'roles.BORROWER')}
        />
        <ul className="operation-facts">
          <li>
            <CalendarClock aria-hidden="true" />
            {formatDateTime(request.startAt)} – {formatDateTime(request.endAt)}
          </li>
          <li>
            <CircleDollarSign aria-hidden="true" />
            {t('requests.totalRental', {
              amount: formatMoney(breakdown.rentalCharge),
            })}
          </li>
          <li>
            <ShieldCheck aria-hidden="true" />
            {request.snapshot.guaranteeAmount > 0
              ? t('requests.guarantee', {
                  amount: formatMoney(request.snapshot.guaranteeAmount),
                })
              : t('listing.noGuarantee')}
          </li>
        </ul>
        {expanded && (
          <div className="request-details" id={detailsId}>
            {request.message && (
              <blockquote>
                <p>“{request.message}”</p>
              </blockquote>
            )}
            {person && reputation && (
              <DefinitionList
                items={[
                  [
                    t('profile.reputation'),
                    <Reputation
                      key="rep"
                      value={reputation.average}
                      count={reputation.count}
                    />,
                  ],
                  [t('profile.completedLoans'), reputation.completedLoans],
                  [
                    t('fields.university'),
                    `${findUniversity(person.universityId)?.shortName ?? person.universityId} · ${person.campus}`,
                  ],
                ]}
              />
            )}
            <EconomicSummary breakdown={breakdown} />
            <p className="muted small">
              {t('requests.snapshotNotice', {
                date: formatDateTime(request.snapshot.acceptedAt),
              })}
            </p>
          </div>
        )}
      </div>
      <div className="operation-actions">
        <Button
          variant="ghost"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggle}
        >
          <ChevronDown
            aria-hidden="true"
            className={expanded ? 'rotate' : ''}
          />
          {expanded ? t('common.hideDetails') : t('common.showDetails')}
        </Button>
        {mode === 'received' && request.status === 'PENDING' && (
          <>
            <Button onClick={() => onAction('accept')}>
              <Check aria-hidden="true" />
              {t('requests.accept')}
            </Button>
            <Button variant="destructive" onClick={() => onAction('reject')}>
              <X aria-hidden="true" />
              {t('requests.reject')}
            </Button>
          </>
        )}
        {mode === 'sent' && request.status === 'PENDING' && (
          <Button variant="destructive" onClick={() => onAction('cancel')}>
            {t('requests.cancel')}
          </Button>
        )}
        {reservation && (
          <Button render={<Link to={`/reservations/${reservation.id}`} />}>
            {t('requests.viewReservation')}
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </li>
  );
}

export function ReservationsPage() {
  const { t, formatDateTime } = useI18n();
  const { state } = useLendUp();
  const [tab, setTab] = useState<'current' | 'history'>('current');
  const mine = state.reservations.filter(
    (reservation) =>
      reservation.borrowerId === state.currentUserId ||
      reservation.lenderId === state.currentUserId,
  );
  const current = mine.filter((reservation) =>
    ['CONFIRMED', 'ACTIVATED'].includes(reservation.status),
  );
  const history = mine.filter((reservation) =>
    ['CANCELLED', 'COMPLETED'].includes(reservation.status),
  );
  const rows = (tab === 'current' ? current : history).sort((a, b) =>
    a.snapshot.startAt.localeCompare(b.snapshot.startAt),
  );
  return (
    <>
      <PageHeader
        eyebrow={t('reservations.eyebrow')}
        title={t('reservations.title')}
        description={t('reservations.description')}
      />
      <Tabs
        label={t('reservations.title')}
        value={tab}
        onChange={setTab}
        options={[
          {
            value: 'current',
            label: t('reservations.current'),
            count: current.length,
          },
          {
            value: 'history',
            label: t('reservations.history'),
            count: history.length,
          },
        ]}
      />
      {rows.length ? (
        <ul className="card-grid">
          {rows.map((reservation) => {
            const listing = listingById(state, reservation.listingId);
            const isBorrower = reservation.borrowerId === state.currentUserId;
            return (
              <li className="reservation-card panel" key={reservation.id}>
                <img src={listing?.image} alt="" />
                <div className="reservation-body">
                  <div className="operation-top">
                    <StatusBadge
                      kind="reservation"
                      status={reservation.status}
                    />
                    <span className="role-tag">{t(roleLabel(isBorrower))}</span>
                  </div>
                  <h2>{listing?.title}</h2>
                  <p className="muted">
                    <CalendarClock aria-hidden="true" />
                    {formatDateTime(reservation.snapshot.startAt)} –{' '}
                    {formatDateTime(reservation.snapshot.endAt)}
                  </p>
                  <dl className="mini-status">
                    <div>
                      <dt>{t('finance.payment')}</dt>
                      <dd>
                        <StatusBadge
                          kind="payment"
                          status={reservation.paymentStatus}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt>{t('finance.guarantee')}</dt>
                      <dd>
                        <StatusBadge
                          kind="guarantee"
                          status={reservation.guaranteeStatus}
                        />
                      </dd>
                    </div>
                  </dl>
                  <Button
                    variant="outline"
                    render={<Link to={`/reservations/${reservation.id}`} />}
                  >
                    {t('common.viewDetail')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={LayoutGrid}
          title={
            tab === 'current'
              ? t('reservations.emptyTitle')
              : t('reservations.emptyHistoryTitle')
          }
          description={t('reservations.emptyDescription')}
          action={t('nav.explore')}
          href="/explore"
        />
      )}
    </>
  );
}

function ReservationActions({ reservation }: { reservation: Reservation }) {
  const { t } = useI18n();
  const { state } = useLendUp();
  const isBorrower = reservation.borrowerId === state.currentUserId;
  const loan = state.loans.find(
    (item) => item.reservationId === reservation.id,
  );
  const settled = isPaymentSettled(reservation);
  if (loan && !isBorrower && loan.status === 'AWAITING_DELIVERY' && settled)
    return (
      <Button render={<Link to={`/delivery?reservation=${reservation.id}`} />}>
        <FileCheck2 aria-hidden="true" />
        {t('reservations.recordDelivery')}
      </Button>
    );
  if (loan)
    return (
      <Button render={<Link to={`/loans/${loan.id}`} />}>
        {t('reservations.openLoan')}
        <ArrowRight aria-hidden="true" />
      </Button>
    );
  if (reservation.status !== 'CONFIRMED') return null;
  if (isBorrower)
    return settled ? (
      <p className="inline-status success">
        <CheckCircle2 aria-hidden="true" />
        {t('reservations.readyForDelivery')}
      </p>
    ) : (
      <Button render={<Link to={`/reservations/${reservation.id}/checkout`} />}>
        <WalletCards aria-hidden="true" />
        {t('reservations.pay')}
      </Button>
    );
  return settled ? (
    <Button render={<Link to={`/delivery?reservation=${reservation.id}`} />}>
      <FileCheck2 aria-hidden="true" />
      {t('reservations.recordDelivery')}
    </Button>
  ) : (
    <p className="inline-status warning">
      <CalendarClock aria-hidden="true" />
      {t('reservations.waitingPayment')}
    </p>
  );
}

export function ReservationDetailPage() {
  const { t, formatDateTime, formatMoney } = useI18n();
  const { id } = useParams();
  const { state, cancelReservation } = useLendUp();
  const methodLabel = usePaymentMethodLabel();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState<ActionResult | null>(null);
  const reservation = state.reservations.find((item) => item.id === id);
  if (!reservation)
    return (
      <NotFound
        title={t('reservations.notFound')}
        description={t('errors.notFound.description')}
      />
    );
  const listing = listingById(state, reservation.listingId);
  const isBorrower = reservation.borrowerId === state.currentUserId;
  const counterpart = userById(
    state,
    counterpartOf(reservation, state.currentUserId),
  );
  const breakdown = economicBreakdown(reservation.snapshot);
  const refund = cancellationRefund(
    reservation,
    isBorrower ? 'BORROWER' : 'LENDER',
  );
  const canCancel = canCancelReservation(reservation);
  const cancelledBy = userById(state, reservation.cancelledBy);

  return (
    <>
      <Link className="back-link" to="/reservations">
        <ArrowLeft aria-hidden="true" />
        {t('reservations.back')}
      </Link>
      <PageHeader
        eyebrow={`${t('reservations.eyebrowDetail')} · ${t(roleLabel(isBorrower))}`}
        title={listing?.title ?? ''}
        description={`${formatDateTime(reservation.snapshot.startAt)} – ${formatDateTime(reservation.snapshot.endAt)}`}
        action={<StatusBadge kind="reservation" status={reservation.status} />}
      />
      <Feedback result={result} />
      {reservation.status === 'CANCELLED' && (
        <div className="app-banner danger">
          <X aria-hidden="true" />
          <p>
            {t('reservations.cancelledBy', {
              name: cancelledBy?.name ?? '',
              date: formatDateTime(reservation.cancelledAt),
              reason: reservation.cancellationReason ?? '',
            })}
          </p>
        </div>
      )}
      <div className="app-banner info">
        <FileCheck2 aria-hidden="true" />
        <p>{t('reservations.snapshotNotice')}</p>
      </div>
      <div className="action-panel panel">
        <div>
          <p className="eyebrow">{t('operations.nextStep')}</p>
          <p>
            {t(
              isBorrower
                ? 'reservations.borrowerSteps'
                : 'reservations.lenderSteps',
            )}
          </p>
        </div>
        <div className="button-row">
          <ReservationActions reservation={reservation} />
          {canCancel && (
            <Button variant="destructive" onClick={() => setCancelOpen(true)}>
              {t('reservations.cancel')}
            </Button>
          )}
        </div>
      </div>
      <div className="detail-grid">
        <section className="panel">
          <p className="eyebrow">{t('operations.periodAndPlace')}</p>
          <DefinitionList
            items={[
              [t('fields.from'), formatDateTime(reservation.snapshot.startAt)],
              [t('fields.to'), formatDateTime(reservation.snapshot.endAt)],
            ]}
          />
          {listing && (
            <MapPreview
              place={reservation.snapshot.exchangePlace}
              coordinates={campusCoordinates(
                listing.universityId,
                listing.campus,
              )}
            />
          )}
        </section>
        <PartyCard
          title={t(isBorrower ? 'roles.LENDER' : 'roles.BORROWER')}
          user={counterpart}
          showPhone={canViewCounterpartyPhone(reservation, state.currentUserId)}
        />
        <section className="panel">
          <p className="eyebrow">{t('finance.breakdown')}</p>
          <EconomicSummary breakdown={breakdown} />
          {!isBorrower && (
            <p className="muted small">
              {t('finance.lenderPayout', {
                amount: formatMoney(breakdown.lenderPayout),
              })}
            </p>
          )}
        </section>
        <div className="stack">
          <FinancialCard
            type="payment"
            amount={breakdown.rentalCharge}
            status={reservation.paymentStatus}
            method={
              reservation.paymentMethod
                ? methodLabel(reservation.paymentMethod)
                : undefined
            }
            note={t(
              `finance.paymentNotes.${reservation.paymentStatus}` as MessageKey,
            )}
          />
          <FinancialCard
            type="guarantee"
            amount={breakdown.guarantee}
            status={reservation.guaranteeStatus}
            method={
              reservation.guaranteePaymentMethod
                ? methodLabel(reservation.guaranteePaymentMethod)
                : undefined
            }
            note={t(
              `finance.guaranteeNotes.${reservation.guaranteeStatus}` as MessageKey,
            )}
          />
        </div>
        <section className="panel conditions-panel full">
          <p className="eyebrow">{t('operations.frozenConditions')}</p>
          <DefinitionList
            items={[
              [t('fields.usage'), reservation.snapshot.usage],
              [t('fields.delivery'), reservation.snapshot.delivery],
              [t('fields.returnPolicy'), reservation.snapshot.returnPolicy],
              [t('fields.cancellation'), reservation.snapshot.cancellation],
              [t('fields.exchangePlace'), reservation.snapshot.exchangePlace],
            ]}
          />
        </section>
      </div>
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t('reservations.cancelTitle')}
        description={t(
          isBorrower
            ? 'reservations.cancelDescriptionBorrower'
            : 'reservations.cancelDescriptionLender',
        )}
        confirmLabel={t('reservations.cancelConfirm')}
        destructive
        disabled={reason.trim().length < 5}
        onConfirm={async () => {
          setResult(await cancelReservation(reservation.id, reason));
          setCancelOpen(false);
        }}
      >
        <dl className="economic-summary">
          <div>
            <dt>{t('reservations.refundRental')}</dt>
            <dd>{formatMoney(refund.rentalRefund)}</dd>
          </div>
          <div>
            <dt>{t('reservations.refundGuarantee')}</dt>
            <dd>{formatMoney(refund.guaranteeRelease)}</dd>
          </div>
        </dl>
        <Field
          label={t('reservations.reason')}
          hint={t('reservations.reasonHint')}
          required
        >
          <textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}

function MethodPicker({
  purpose,
  value,
  onChange,
  name,
}: {
  purpose: PaymentPurpose;
  value: string;
  onChange: (id: string) => void;
  name: string;
}) {
  const { t } = useI18n();
  const methodLabel = usePaymentMethodLabel();
  const {
    data: methods = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['payment-methods', purpose],
    queryFn: () => paymentsService.getPaymentMethods(purpose),
  });
  useEffect(() => {
    if (methods.length && !methods.some((method) => method.id === value))
      onChange(methods[0].id);
  }, [methods, value, onChange]);
  if (isLoading) return <LoadingSkeleton cards={1} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!methods.length)
    return <p className="muted">{t('payments.noMethods')}</p>;
  const selected = value;
  return (
    <fieldset className="payment-methods">
      <legend className="sr-only">{t('payments.chooseMethod')}</legend>
      {methods.map((method) => (
        <label
          key={method.id}
          className={selected === method.id ? 'selected' : ''}
        >
          <input
            type="radio"
            name={name}
            checked={selected === method.id}
            onChange={() => onChange(method.id)}
          />
          <WalletCards aria-hidden="true" />
          <span>
            <strong>{methodLabel(method)}</strong>
            <small>{t(`payments.methodHints.${method.kind}`)}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function PaymentStep({
  purpose,
  step,
  title,
  amount,
  status,
  done,
  locked = false,
  unsupported = false,
  pending = false,
  onPay,
}: {
  purpose: PaymentPurpose;
  step: number;
  title: string;
  amount: number;
  status: string;
  done: boolean;
  locked?: boolean;
  unsupported?: boolean;
  pending?: boolean;
  onPay?: (methodId: string) => Promise<ActionResult>;
}) {
  const { t, formatMoney } = useI18n();
  const [methodId, setMethodId] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <section
      className={`panel payment-step ${done ? 'done' : ''} ${locked ? 'locked' : ''}`}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {t('checkout.step', { number: step })} · {title}
          </p>
          <h2>{formatMoney(amount)}</h2>
        </div>
        <StatusBadge
          kind={purpose === 'GUARANTEE' ? 'guarantee' : 'payment'}
          status={status}
        />
      </div>
      {done ? (
        <p className="inline-status success">
          <CheckCircle2 aria-hidden="true" />
          {t(
            purpose === 'GUARANTEE'
              ? 'checkout.guaranteeDone'
              : 'checkout.rentalDone',
          )}
        </p>
      ) : pending ? (
        <p className="inline-status">
          <CalendarClock aria-hidden="true" />
          {t('checkout.providerPending')}
        </p>
      ) : unsupported ? (
        <p className="inline-status">
          <ShieldCheck aria-hidden="true" />
          {t('common.backendGap')}
        </p>
      ) : locked ? (
        <p className="inline-status">
          <ShieldCheck aria-hidden="true" />
          {t('checkout.rentalLocked')}
        </p>
      ) : (
        <>
          <MethodPicker
            purpose={purpose}
            value={methodId}
            onChange={setMethodId}
            name={`method-${purpose}`}
          />
          <Feedback result={result} />
          <Button
            size="lg"
            disabled={busy || !methodId}
            onClick={async () => {
              setBusy(true);
              if (onPay) setResult(await onPay(methodId));
              setBusy(false);
            }}
          >
            {busy
              ? t('checkout.processing')
              : t('checkout.payWithProvider', { amount: formatMoney(amount) })}
          </Button>
        </>
      )}
    </section>
  );
}

export function CheckoutPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const { state, holdGuarantee } = useLendUp();
  const reservation = state.reservations.find((item) => item.id === id);
  if (!reservation)
    return (
      <NotFound
        title={t('reservations.notFound')}
        description={t('errors.notFound.description')}
      />
    );
  const listing = listingById(state, reservation.listingId);
  const breakdown = economicBreakdown(reservation.snapshot);
  const requiresGuarantee = breakdown.guarantee > 0;
  const rentalDone = !canRetryPayment(reservation.paymentStatus);
  const guaranteeDone =
    !requiresGuarantee || reservation.guaranteeStatus === 'HELD';
  const checkoutLoan = state.loans.find(
    (loan) => loan.reservationId === reservation.id,
  );
  const guaranteeSubmitted = state.transactions.some(
    (transaction) =>
      transaction.loanId === checkoutLoan?.id &&
      transaction.type === 'GUARANTEE_HOLD' &&
      ['PENDING', 'PROCESSING'].includes(transaction.status),
  );
  const closed = reservation.status !== 'CONFIRMED';

  return (
    <>
      <Link className="back-link" to={`/reservations/${reservation.id}`}>
        <ArrowLeft aria-hidden="true" />
        {t('checkout.back')}
      </Link>
      <PageHeader
        eyebrow={t('checkout.eyebrow')}
        title={t('checkout.title', { title: listing?.title ?? '' })}
        description={t('checkout.description')}
      />
      {rentalDone && guaranteeDone && (
        <div className="app-banner success">
          <CheckCircle2 aria-hidden="true" />
          <p>{t('checkout.allDone')}</p>
          <Button
            size="sm"
            render={<Link to={`/reservations/${reservation.id}`} />}
          >
            {t('checkout.backToReservation')}
          </Button>
        </div>
      )}
      {closed ? (
        <EmptyState
          title={t('checkout.closedTitle')}
          description={t('checkout.closedDescription')}
          action={t('checkout.backToReservation')}
          href={`/reservations/${reservation.id}`}
        />
      ) : (
        <div className="checkout-layout">
          <div className="stack">
            {requiresGuarantee && (
              <PaymentStep
                purpose="GUARANTEE"
                step={1}
                title={t('checkout.guaranteeStep')}
                amount={breakdown.guarantee}
                status={reservation.guaranteeStatus}
                done={guaranteeDone}
                pending={guaranteeSubmitted}
                onPay={(method) => holdGuarantee(reservation.id, method)}
              />
            )}
            <PaymentStep
              purpose="RENTAL"
              step={requiresGuarantee ? 2 : 1}
              title={t('checkout.rentalStep')}
              amount={breakdown.rentalCharge}
              status={reservation.paymentStatus}
              done={rentalDone}
              locked={!guaranteeDone}
              unsupported
            />
            <div className="app-banner info">
              <ShieldCheck aria-hidden="true" />
              <p>{t('checkout.security')}</p>
            </div>
          </div>
          <aside className="panel checkout-summary">
            <h2>{t('finance.breakdown')}</h2>
            <EconomicSummary breakdown={breakdown} />
            <p className="muted small">{t('checkout.guaranteeNote')}</p>
          </aside>
        </div>
      )}
    </>
  );
}

export function DeliveryPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state, recordDelivery } = useLendUp();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const reservation = state.reservations.find(
    (item) => item.id === params.get('reservation'),
  );
  const user = currentUserOf(state);
  if (!reservation || !user)
    return (
      <NotFound
        title={t('reservations.notFound')}
        description={t('errors.notFound.description')}
      />
    );
  const listing = listingById(state, reservation.listingId);
  const guaranteeOk =
    reservation.snapshot.guaranteeAmount === 0 ||
    reservation.guaranteeStatus === 'HELD';
  const paymentOk = reservation.paymentStatus === 'PENDING_RELEASE';
  const checks: [string, boolean][] = [
    [
      t('delivery.checks.reservation'),
      reservation.status === 'CONFIRMED' && !reservation.deliveryRecorded,
    ],
    [t('delivery.checks.payment'), paymentOk],
    [t('delivery.checks.guarantee'), guaranteeOk],
  ];
  const ready = checks.every(([, ok]) => ok);

  return (
    <>
      <Link className="back-link" to={`/reservations/${reservation.id}`}>
        <ArrowLeft aria-hidden="true" />
        {t('checkout.backToReservation')}
      </Link>
      <PageHeader
        eyebrow={t('delivery.eyebrow')}
        title={t('delivery.title', { title: listing?.title ?? '' })}
        description={t('delivery.description')}
      />
      <div className="two-panel-grid">
        <section className="panel">
          <h2>{t('delivery.checksTitle')}</h2>
          <ul className="checklist">
            {checks.map(([label, ok]) => (
              <li key={label} className={ok ? 'ok' : 'missing'}>
                {ok ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <AlertTriangle aria-hidden="true" />
                )}
                {label}
              </li>
            ))}
          </ul>
          {!ready && <p className="field-error">{t('delivery.notReady')}</p>}
        </section>
        <section className="panel">
          <h2>{t('delivery.evidenceTitle')}</h2>
          <p className="muted small">{t('delivery.evidenceHint')}</p>
          <EvidenceUploader
            phase="INITIAL"
            author={user}
            value={evidence}
            onChange={setEvidence}
            label={t('delivery.evidenceLabel')}
          />
        </section>
      </div>
      <Feedback result={result} />
      <div className="form-footer">
        <Button
          size="lg"
          disabled={!ready}
          onClick={() => setConfirmOpen(true)}
        >
          {t('delivery.confirm')}
        </Button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('delivery.confirmTitle')}
        description={
          evidence.length
            ? t('delivery.confirmDescription', { count: evidence.length })
            : t('delivery.confirmNoEvidence')
        }
        confirmLabel={t('delivery.confirm')}
        onConfirm={async () => {
          const outcome = await recordDelivery(reservation.id, evidence);
          setResult(outcome);
          setConfirmOpen(false);
          if (outcome.ok && outcome.id) navigate(`/loans/${outcome.id}`);
        }}
      />
    </>
  );
}

type LoanTab = 'upcoming' | 'active' | 'overdue' | 'history';
const loanTabStatuses: Record<LoanTab, Loan['status'][]> = {
  upcoming: ['AWAITING_DELIVERY', 'PENDING_RECEIPT'],
  active: ['ACTIVE', 'RETURN_RECORDED', 'RETURN_CONFIRMED_PENDING_INCIDENT'],
  overdue: ['OVERDUE'],
  history: ['COMPLETED'],
};

export function LoansPage() {
  const { t, formatDateTime } = useI18n();
  const { state } = useLendUp();
  const mine = state.loans.filter(
    (loan) =>
      loan.borrowerId === state.currentUserId ||
      loan.lenderId === state.currentUserId,
  );
  const counts = Object.fromEntries(
    (Object.keys(loanTabStatuses) as LoanTab[]).map((key) => [
      key,
      mine.filter((loan) => loanTabStatuses[key].includes(loan.status)).length,
    ]),
  ) as Record<LoanTab, number>;
  const [tab, setTab] = useState<LoanTab>(
    counts.upcoming ? 'upcoming' : 'active',
  );
  const rows = mine
    .filter((loan) => loanTabStatuses[tab].includes(loan.status))
    .sort((a, b) =>
      tab === 'history'
        ? b.currentReturnAt.localeCompare(a.currentReturnAt)
        : a.currentReturnAt.localeCompare(b.currentReturnAt),
    );
  return (
    <>
      <PageHeader
        eyebrow={t('loans.eyebrow')}
        title={t('loans.title')}
        description={t('loans.description')}
      />
      <Tabs
        label={t('loans.title')}
        value={tab}
        onChange={setTab}
        options={(Object.keys(loanTabStatuses) as LoanTab[]).map((key) => ({
          value: key,
          label: t(`loans.tabs.${key}`),
          count: counts[key],
        }))}
      />
      {rows.length ? (
        <ul className="card-grid">
          {rows.map((loan) => {
            const listing = listingById(state, loan.listingId);
            const isBorrower = loan.borrowerId === state.currentUserId;
            const counterpart = userById(
              state,
              counterpartOf(loan, state.currentUserId),
            );
            const next = loanNextAction(loan, state.currentUserId);
            return (
              <li className="reservation-card panel" key={loan.id}>
                <img src={listing?.image} alt="" />
                <div className="reservation-body">
                  <div className="operation-top">
                    <StatusBadge kind="loan" status={loan.status} />
                    <span className="role-tag">{t(roleLabel(isBorrower))}</span>
                  </div>
                  <h2>{listing?.title}</h2>
                  <UserChip user={counterpart} />
                  <p className="muted">
                    <CalendarClock aria-hidden="true" />
                    {t('loans.returnAt', {
                      date: formatDateTime(loan.currentReturnAt),
                    })}
                  </p>
                  {next !== 'NONE' && (
                    <p
                      className={`next-hint ${next.startsWith('WAIT') ? '' : 'actionable'}`}
                    >
                      {t(`loans.next.${next}`)}
                    </p>
                  )}
                  <Button render={<Link to={`/loans/${loan.id}`} />}>
                    {t('loans.open')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={UsersRound}
          title={t(`loans.empty.${tab}`)}
          description={t('loans.emptyDescription')}
        />
      )}
    </>
  );
}

type LoanDialog =
  | 'receipt'
  | 'extension'
  | 'respondExtension'
  | 'payExtension'
  | 'reschedule'
  | 'respondReschedule'
  | 'return'
  | 'early'
  | 'confirmReturn'
  | 'rating';

export function LoanDetailPage() {
  const { t, formatDateTime, formatMoney } = useI18n();
  const { id } = useParams();
  const lendUp = useLendUp();
  const { state } = lendUp;
  const methodLabel = usePaymentMethodLabel();
  const loan = state.loans.find((candidate) => candidate.id === id);
  const { analysis, run } = useEvidenceAnalysis(loan);
  const [dialog, setDialog] = useState<LoanDialog | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const user = currentUserOf(state);
  if (!loan || !user)
    return (
      <NotFound
        title={t('loans.notFound')}
        description={t('errors.notFound.description')}
      />
    );
  const listing = listingById(state, loan.listingId);
  const isBorrower = loan.borrowerId === user.id;
  const counterpart = userById(state, counterpartOf(loan, user.id));
  const breakdown = economicBreakdown(loan.snapshot);
  const reservation = state.reservations.find(
    (item) => item.id === loan.reservationId,
  );
  const incidents = incidentsOfLoan(state, loan.id);
  const openIncident = loanHasOpenIncident(state, loan);
  const pendingExtension = loan.extensions.find(
    (ext) => ext.status === 'PENDING',
  );
  const payableExtension = loan.extensions.find(
    (ext) => ext.status === 'PAYMENT_PENDING',
  );
  const pendingReschedule = loan.reschedules.find(
    (item) => item.status === 'PENDING',
  );
  const next = loanNextAction(loan, user.id);
  const canChangeDates =
    loan.status === 'ACTIVE' && new Date(loan.currentReturnAt) > new Date();
  const myRating = state.ratings.find(
    (rating) => rating.loanId === loan.id && rating.authorId === user.id,
  );
  const close = (outcome?: ActionResult) => {
    if (outcome) setResult(outcome);
    if (!outcome || outcome.ok) setDialog(null);
  };

  const actions: { key: string; node: React.ReactNode }[] = [];
  const add = (key: string, node: React.ReactNode) =>
    actions.push({ key, node });
  if (isBorrower && loan.status === 'PENDING_RECEIPT')
    add(
      'receipt',
      <Button onClick={() => setDialog('receipt')}>
        {t('loanDetail.actions.confirmReceipt')}
      </Button>,
    );
  if (!isBorrower && loan.status === 'AWAITING_DELIVERY' && reservation)
    add(
      'delivery',
      <Button render={<Link to={`/delivery?reservation=${reservation.id}`} />}>
        {t('loanDetail.actions.recordDelivery')}
      </Button>,
    );
  if (isBorrower && ['ACTIVE', 'OVERDUE'].includes(loan.status)) {
    add(
      'return',
      <Button onClick={() => setDialog('return')}>
        {t('loanDetail.actions.recordReturn')}
      </Button>,
    );
    if (loan.status === 'ACTIVE')
      add(
        'early',
        <Button variant="outline" onClick={() => setDialog('early')}>
          {t('loanDetail.actions.earlyReturn')}
        </Button>,
      );
  }
  if (isBorrower && canChangeDates && !pendingExtension && !payableExtension)
    add(
      'extension',
      <Button variant="outline" disabled title={t('common.backendGap')}>
        {t('loanDetail.actions.requestExtension')}
      </Button>,
    );
  if (isBorrower && payableExtension)
    add(
      'payExtension',
      <Button disabled title={t('common.backendGap')}>
        {t('loanDetail.actions.payExtension', {
          amount: formatMoney(payableExtension.additionalCost),
        })}
      </Button>,
    );
  if (isBorrower && pendingReschedule)
    add(
      'respondReschedule',
      <Button disabled title={t('common.backendGap')}>
        {t('loanDetail.actions.reviewReschedule')}
      </Button>,
    );
  if (!isBorrower && pendingExtension)
    add(
      'respondExtension',
      <Button disabled title={t('common.backendGap')}>
        {t('loanDetail.actions.reviewExtension')}
      </Button>,
    );
  if (!isBorrower && canChangeDates && !pendingReschedule)
    add(
      'reschedule',
      <Button variant="outline" disabled title={t('common.backendGap')}>
        {t('loanDetail.actions.proposeReschedule')}
      </Button>,
    );
  if (!isBorrower && loan.status === 'RETURN_RECORDED')
    add(
      'confirmReturn',
      <Button onClick={() => setDialog('confirmReturn')}>
        {t('loanDetail.actions.confirmReturn')}
      </Button>,
    );
  if (loan.status === 'COMPLETED' && !loan.ratedBy.includes(user.id))
    add(
      'rating',
      <Button onClick={() => setDialog('rating')}>
        <Star aria-hidden="true" />
        {t('loanDetail.actions.rate')}
      </Button>,
    );
  if (loan.status !== 'COMPLETED' && loan.status !== 'AWAITING_DELIVERY')
    add(
      'incident',
      <Button
        variant="ghost"
        className="danger-text"
        render={<Link to={`/incidents?loan=${loan.id}`} />}
      >
        <ShieldAlert aria-hidden="true" />
        {t('loanDetail.actions.reportIncident')}
      </Button>,
    );

  return (
    <>
      <Link className="back-link" to="/loans">
        <ArrowLeft aria-hidden="true" />
        {t('loans.back')}
      </Link>
      <PageHeader
        eyebrow={`${t('loanDetail.eyebrow')} · ${t(roleLabel(isBorrower))}`}
        title={listing?.title ?? ''}
        description={t('loanDetail.with', { name: counterpart?.name ?? '' })}
        action={<StatusBadge kind="loan" status={loan.status} />}
      />
      <Feedback result={result} />
      {loan.status === 'OVERDUE' && (
        <div className="app-banner danger">
          <AlertTriangle aria-hidden="true" />
          <p>
            {t(
              isBorrower
                ? 'loanDetail.overdueBorrower'
                : 'loanDetail.overdueLender',
              { date: formatDateTime(loan.currentReturnAt) },
            )}
          </p>
        </div>
      )}
      {openIncident && (
        <div className="app-banner warning">
          <ShieldAlert aria-hidden="true" />
          <p>{t('loanDetail.incidentHold')}</p>
        </div>
      )}
      <div className="action-panel panel">
        <div>
          <p className="eyebrow">{t('operations.nextStep')}</p>
          <p className="next-title">{t(`loans.next.${next}` as MessageKey)}</p>
          {loan.status === 'ACTIVE' && (
            <p className="muted small">{t('loanDetail.noCancel')}</p>
          )}
        </div>
        <div className="button-row">
          {actions.map(({ key, node }) => (
            <span key={key}>{node}</span>
          ))}
        </div>
      </div>
      <div className="detail-grid">
        <section className="panel">
          <p className="eyebrow">{t('loanDetail.period')}</p>
          <DefinitionList
            items={[
              [t('loanDetail.start'), formatDateTime(loan.snapshot.startAt)],
              [
                t('loanDetail.currentReturn'),
                <strong key="due">
                  {formatDateTime(loan.currentReturnAt)}
                </strong>,
              ],
              ...(loan.currentReturnAt !== loan.originalReturnAt
                ? ([
                    [
                      t('loanDetail.originalReturn'),
                      formatDateTime(loan.originalReturnAt),
                    ],
                  ] as [string, string][])
                : []),
              [
                t('loanDetail.deliveredAt'),
                loan.deliveredAt
                  ? formatDateTime(loan.deliveredAt)
                  : t('common.pending'),
              ],
              [
                t('loanDetail.receivedAt'),
                loan.receiptConfirmedAt
                  ? formatDateTime(loan.receiptConfirmedAt)
                  : t('common.pending'),
              ],
              ...(loan.returnRecord
                ? ([
                    [
                      t('loanDetail.returnedAt'),
                      formatDateTime(loan.returnRecord.registeredAt),
                    ],
                    [
                      t('loanDetail.returnConfirmedAt'),
                      loan.returnRecord.confirmedAt
                        ? formatDateTime(loan.returnRecord.confirmedAt)
                        : t('common.pending'),
                    ],
                  ] as [string, string][])
                : []),
            ]}
          />
          <p className="muted small">
            {t('fields.exchangePlace')}: {loan.snapshot.exchangePlace}
          </p>
        </section>
        <PartyCard
          title={t(isBorrower ? 'roles.LENDER' : 'roles.BORROWER')}
          user={counterpart}
          showPhone={canViewCounterpartyPhone(loan, user.id)}
        />
        <FinancialCard
          type="payment"
          amount={breakdown.rentalCharge}
          status={loan.paymentStatus}
          method={
            reservation?.paymentMethod
              ? methodLabel(reservation.paymentMethod)
              : undefined
          }
          note={
            isBorrower
              ? t(`finance.paymentNotes.${loan.paymentStatus}` as MessageKey)
              : loan.paymentStatus === 'RELEASED'
                ? t('finance.lenderReleased', {
                    amount: formatMoney(breakdown.lenderPayout),
                  })
                : t('finance.lenderPending', {
                    amount: formatMoney(breakdown.lenderPayout),
                  })
          }
        />
        <FinancialCard
          type="guarantee"
          amount={breakdown.guarantee}
          status={loan.guaranteeStatus}
          method={
            reservation?.guaranteePaymentMethod
              ? methodLabel(reservation.guaranteePaymentMethod)
              : undefined
          }
          note={t(
            `finance.guaranteeNotes.${loan.guaranteeStatus}` as MessageKey,
          )}
        />
      </div>
      <div className="two-panel-grid">
        <section className="panel">
          <p className="eyebrow">{t('loanDetail.traceability')}</p>
          <Timeline items={loan.timeline} />
          {loan.returnRecord && (
            <div className="return-note">
              <strong>
                {t(
                  loan.returnRecord.early
                    ? 'loanDetail.earlyReturnNotes'
                    : 'loanDetail.returnNotes',
                )}
              </strong>
              <p>{loan.returnRecord.notes}</p>
            </div>
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('loanDetail.history')}</p>
              <h2>{t('loanDetail.historyTitle')}</h2>
            </div>
            <RotateCcw aria-hidden="true" />
          </div>
          {loan.extensions.length || loan.reschedules.length ? (
            <ul className="history-list">
              {loan.extensions.map((ext) => (
                <li key={ext.id}>
                  <div className="history-head">
                    <strong>
                      {t('loanDetail.extensionBy', {
                        name: userById(state, ext.requesterId)?.name ?? '',
                      })}
                    </strong>
                    <StatusBadge kind="extension" status={ext.status} />
                  </div>
                  <DefinitionList
                    items={[
                      [
                        t('loanDetail.requestedAt'),
                        formatDateTime(ext.requestedAt),
                      ],
                      [
                        t('loanDetail.previousDate'),
                        formatDateTime(ext.originalReturnAt),
                      ],
                      [
                        t('loanDetail.proposedDate'),
                        formatDateTime(ext.proposedReturnAt),
                      ],
                      [
                        t('loanDetail.additionalCost'),
                        formatMoney(ext.additionalCost),
                      ],
                      ...(ext.respondedAt
                        ? ([
                            [
                              t('loanDetail.respondedAt'),
                              formatDateTime(ext.respondedAt),
                            ],
                          ] as [string, string][])
                        : []),
                      ...(ext.paymentStatus
                        ? ([
                            [
                              t('finance.payment'),
                              <StatusBadge
                                key="p"
                                kind="payment"
                                status={ext.paymentStatus}
                              />,
                            ],
                          ] as [string, React.ReactNode][])
                        : []),
                      ...(ext.resultingReturnAt
                        ? ([
                            [
                              t('loanDetail.resultingDate'),
                              formatDateTime(ext.resultingReturnAt),
                            ],
                          ] as [string, string][])
                        : []),
                    ]}
                  />
                </li>
              ))}
              {loan.reschedules.map((item) => (
                <li key={item.id}>
                  <div className="history-head">
                    <strong>
                      {t('loanDetail.rescheduleBy', {
                        name: userById(state, item.proposerId)?.name ?? '',
                      })}
                    </strong>
                    <StatusBadge kind="reschedule" status={item.status} />
                  </div>
                  <DefinitionList
                    items={[
                      [
                        t('loanDetail.requestedAt'),
                        formatDateTime(item.proposedAt),
                      ],
                      [
                        t('loanDetail.previousDate'),
                        formatDateTime(item.originalReturnAt),
                      ],
                      [
                        t('loanDetail.proposedDate'),
                        formatDateTime(item.proposedReturnAt),
                      ],
                      [t('loanDetail.additionalCost'), formatMoney(0)],
                      ...(item.resultingReturnAt
                        ? ([
                            [
                              t('loanDetail.resultingDate'),
                              formatDateTime(item.resultingReturnAt),
                            ],
                          ] as [string, string][])
                        : []),
                    ]}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('loanDetail.noExtensions')}</p>
          )}
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('evidence.title')}</p>
            <h2>{t('evidence.comparison')}</h2>
          </div>
        </div>
        <div className="evidence-comparison">
          <EvidenceGallery
            title={t('evidence.initial')}
            items={loan.evidence.filter((item) => item.phase === 'INITIAL')}
          />
          <EvidenceGallery
            title={t('evidence.final')}
            items={loan.evidence.filter((item) => item.phase === 'FINAL')}
          />
        </div>
        <AnalysisPanel
          analysis={analysis}
          evidence={loan.evidence}
          onAnalyze={run}
        />
      </section>
      <section className="panel">
        <p className="eyebrow">{t('loanDetail.incidents')}</p>
        {incidents.length ? (
          <ul className="incident-mini-list">
            {incidents.map((incident) => (
              <li key={incident.id}>
                <Link to={`/incidents/${incident.id}`}>
                  <strong>{incident.id}</strong> ·{' '}
                  {t(`incidentTypes.${incident.type}`)}
                </Link>
                <StatusBadge kind="incident" status={incident.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{t('loanDetail.noIncidents')}</p>
        )}
      </section>
      {loan.status === 'COMPLETED' && (
        <section className="panel">
          <p className="eyebrow">{t('loanDetail.rating')}</p>
          {myRating ? (
            <p>
              {t('loanDetail.yourRating', { stars: myRating.stars })}
              {myRating.comment && <> · “{myRating.comment}”</>}
            </p>
          ) : (
            <p className="muted">{t('loanDetail.ratingPending')}</p>
          )}
        </section>
      )}
      <LoanDialogs
        dialog={dialog}
        setDialog={setDialog}
        loan={loan}
        user={user}
        onDone={close}
      />
    </>
  );
}

function LoanDialogs({
  dialog,
  setDialog,
  loan,
  user,
  onDone,
}: {
  dialog: LoanDialog | null;
  setDialog: (dialog: LoanDialog | null) => void;
  loan: Loan;
  user: User;
  onDone: (result?: ActionResult) => void;
}) {
  const { t, formatDateTime, formatMoney } = useI18n();
  const lendUp = useLendUp();
  const suggested = useMemo(() => {
    const base = new Date(
      Math.max(new Date(loan.currentReturnAt).getTime(), Date.now()) +
        86_400_000,
    );
    return toZonedInput(base);
  }, [loan.currentReturnAt]);
  const [date, setDate] = useState(suggested);
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [methodId, setMethodId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ActionResult | null>(null);
  const pendingExtension = loan.extensions.find(
    (ext) => ext.status === 'PENDING',
  );
  const payableExtension = loan.extensions.find(
    (ext) => ext.status === 'PAYMENT_PENDING',
  );
  const pendingReschedule = loan.reschedules.find(
    (item) => item.status === 'PENDING',
  );
  const dateIso = fromZonedInput(date);
  const openChange = (open: boolean) => {
    if (!open) {
      setDialog(null);
      setError(null);
    }
  };
  const finish = (result: ActionResult) => {
    if (result.ok) {
      setError(null);
      setNotes('');
      setEvidence([]);
      onDone(result);
    } else setError(result);
  };
  const common = { open: true, onOpenChange: openChange };

  switch (dialog) {
    case 'receipt':
      return (
        <ConfirmDialog
          {...common}
          title={t('loanDialogs.receipt.title')}
          description={t('loanDialogs.receipt.description')}
          confirmLabel={t('loanDialogs.receipt.confirm')}
          onConfirm={async () => finish(await lendUp.confirmReceipt(loan.id))}
        >
          <EvidenceGallery
            title={t('evidence.initial')}
            items={loan.evidence.filter((item) => item.phase === 'INITIAL')}
          />
          <p className="inline-status warning">
            <AlertTriangle aria-hidden="true" />
            {t('loanDialogs.receipt.warning')}
          </p>
          <Feedback result={error} />
        </ConfirmDialog>
      );
    case 'extension':
    case 'reschedule': {
      const extension = dialog === 'extension';
      const cost = extension
        ? extensionCost(loan.currentReturnAt, dateIso, loan.snapshot.dailyRate)
        : 0;
      const validDate =
        Boolean(dateIso) &&
        (extension
          ? new Date(dateIso) > new Date(loan.currentReturnAt)
          : new Date(dateIso) > new Date());
      return (
        <ConfirmDialog
          {...common}
          title={t(
            extension
              ? 'loanDialogs.extension.title'
              : 'loanDialogs.reschedule.title',
          )}
          description={t(
            extension
              ? 'loanDialogs.extension.description'
              : 'loanDialogs.reschedule.description',
            { date: formatDateTime(loan.currentReturnAt) },
          )}
          confirmLabel={t(
            extension
              ? 'loanDialogs.extension.confirm'
              : 'loanDialogs.reschedule.confirm',
          )}
          disabled={!validDate}
          onConfirm={async () =>
            finish(
              await (extension
                ? lendUp.requestExtension(loan.id, dateIso)
                : lendUp.proposeReschedule(loan.id, dateIso)),
            )
          }
        >
          <Field
            label={t('loanDialogs.newDate')}
            error={
              !validDate
                ? t(
                    extension
                      ? 'results.extension.mustBeLater'
                      : 'results.reschedule.mustBeFuture',
                  )
                : undefined
            }
          >
            <input
              type="datetime-local"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <dl className="economic-summary">
            <div className="total">
              <dt>{t('loanDetail.additionalCost')}</dt>
              <dd>{formatMoney(cost)}</dd>
            </div>
          </dl>
          <p className="muted small">
            {t(
              extension
                ? 'loanDialogs.extension.note'
                : 'loanDialogs.reschedule.note',
            )}
          </p>
          <Feedback result={error} />
        </ConfirmDialog>
      );
    }
    case 'respondExtension':
    case 'respondReschedule': {
      const isExtension = dialog === 'respondExtension';
      const item = isExtension ? pendingExtension : pendingReschedule;
      if (!item) return null;
      const respond = async (accepted: boolean) =>
        finish(
          await (isExtension
            ? lendUp.respondExtension(loan.id, accepted)
            : lendUp.respondReschedule(loan.id, accepted)),
        );
      return (
        <ConfirmDialog
          {...common}
          title={t(
            isExtension
              ? 'loanDialogs.respondExtension.title'
              : 'loanDialogs.respondReschedule.title',
          )}
          description={t(
            isExtension
              ? 'loanDialogs.respondExtension.description'
              : 'loanDialogs.respondReschedule.description',
          )}
          confirmLabel={t('loanDialogs.accept')}
          onConfirm={() => respond(true)}
        >
          <DefinitionList
            items={[
              [
                t('loanDetail.currentReturn'),
                formatDateTime(item.originalReturnAt),
              ],
              [
                t('loanDetail.proposedDate'),
                formatDateTime(item.proposedReturnAt),
              ],
              [
                t('loanDetail.additionalCost'),
                formatMoney(
                  isExtension && pendingExtension
                    ? pendingExtension.additionalCost
                    : 0,
                ),
              ],
            ]}
          />
          {isExtension &&
            pendingExtension &&
            pendingExtension.additionalCost > 0 && (
              <p className="muted small">
                {t('loanDialogs.respondExtension.paymentNote')}
              </p>
            )}
          <Button
            type="button"
            variant="destructive"
            onClick={() => respond(false)}
          >
            {t('loanDialogs.reject')}
          </Button>
          <Feedback result={error} />
        </ConfirmDialog>
      );
    }
    case 'payExtension':
      if (!payableExtension) return null;
      return (
        <ConfirmDialog
          {...common}
          title={t('loanDialogs.payExtension.title')}
          description={t('loanDialogs.payExtension.description', {
            date: formatDateTime(payableExtension.proposedReturnAt),
          })}
          confirmLabel={t('checkout.payWithProvider', {
            amount: formatMoney(payableExtension.additionalCost),
          })}
          disabled={!methodId}
          busy={busy}
          onConfirm={async () => {
            setBusy(true);
            const result = await lendUp.payExtension(loan.id, methodId);
            setBusy(false);
            finish(result);
          }}
        >
          <MethodPicker
            purpose="EXTENSION"
            value={methodId}
            onChange={setMethodId}
            name="extension-method"
          />
          <Feedback result={error} />
        </ConfirmDialog>
      );
    case 'return':
    case 'early':
      return (
        <ConfirmDialog
          {...common}
          className="wide"
          title={t(
            dialog === 'early'
              ? 'loanDialogs.early.title'
              : 'loanDialogs.return.title',
          )}
          description={t('loanDialogs.return.description')}
          confirmLabel={t('loanDialogs.return.confirm')}
          disabled={notes.trim().length < 10 || !evidence.length}
          onConfirm={async () =>
            finish(
              await lendUp.recordReturn(
                loan.id,
                dialog === 'early',
                notes,
                evidence,
              ),
            )
          }
        >
          {dialog === 'early' && (
            <p className="inline-status warning">
              <AlertTriangle aria-hidden="true" />
              {t('loanDialogs.early.warning')}
            </p>
          )}
          <EvidenceUploader
            phase="FINAL"
            author={user}
            value={evidence}
            onChange={setEvidence}
            label={t('loanDialogs.return.evidenceLabel')}
          />
          <Field
            label={t('loanDialogs.return.notes')}
            hint={t('validation.min', { count: 10 })}
            required
          >
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
          <Feedback result={error} />
        </ConfirmDialog>
      );
    case 'confirmReturn':
      return (
        <ConfirmDialog
          {...common}
          className="wide"
          title={t('loanDialogs.confirmReturn.title')}
          description={t('loanDialogs.confirmReturn.description')}
          confirmLabel={t('loanDialogs.confirmReturn.confirm')}
          onConfirm={async () => finish(await lendUp.confirmReturn(loan.id))}
        >
          <EvidenceGallery
            title={t('evidence.final')}
            items={loan.evidence.filter((item) => item.phase === 'FINAL')}
          />
          <p className="inline-status">
            <ShieldCheck aria-hidden="true" />
            {t('loanDialogs.confirmReturn.guaranteeNote')}
          </p>
          <p className="muted small">
            {t('loanDialogs.confirmReturn.incidentHint')}
          </p>
          <Feedback result={error} />
        </ConfirmDialog>
      );
    case 'rating':
      return (
        <ConfirmDialog
          {...common}
          title={t('loanDialogs.rating.title')}
          description={t('loanDialogs.rating.description')}
          confirmLabel={t('loanDialogs.rating.confirm')}
          disabled={stars < 1}
          onConfirm={async () =>
            finish(await lendUp.rateLoan(loan.id, stars, comment))
          }
        >
          <fieldset className="rating-input">
            <legend>{t('loanDialogs.rating.stars')}</legend>
            <div>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setStars(value)}
                  aria-pressed={value <= stars}
                  aria-label={t('loanDialogs.rating.starAria', {
                    count: value,
                  })}
                >
                  <Star
                    aria-hidden="true"
                    fill={value <= stars ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
          </fieldset>
          <Field
            label={t('loanDialogs.rating.comment')}
            hint={t('loanDialogs.rating.commentHint')}
          >
            <textarea
              rows={3}
              maxLength={400}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </Field>
          <Feedback result={error} />
        </ConfirmDialog>
      );
    default:
      return null;
  }
}
