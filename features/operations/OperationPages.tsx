'use client';

import { useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  MapPin,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Star,
  WalletCards,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  EmptyState,
  ErrorState,
  EvidenceUploader,
  FinancialCard,
  LoadingSkeleton,
  PageHeader,
  Reputation,
  StatusBadge,
  Timeline,
  UserChip,
  money,
  shortDate,
} from '@/components/lendup/shared';
import {
  evidenceAnalysisService,
  paymentService,
} from '@/services/domain-services';
import { economicBreakdown, extensionCost } from '@/lib/business-rules';
import { useDemo } from '@/stores/demo-store';
import type { Evidence } from '@/types/domain';

export function RequestsPage() {
  const { state, respondRequest, cancelRequest } = useDemo();
  const [mode, setMode] = useState<'received' | 'sent'>('sent');
  const requests = state.requests.filter((request) =>
    mode === 'sent'
      ? request.borrowerId === state.currentUserId
      : request.lenderId === state.currentUserId,
  );
  return (
    <>
      <PageHeader
        eyebrow="Solicitudes"
        title="Solicitudes de préstamo"
        description="Una solicitud se convierte en reserva únicamente después de ser aceptada."
      />
      <div className="tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'sent'}
          className={mode === 'sent' ? 'active' : ''}
          onClick={() => setMode('sent')}
        >
          Enviadas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'received'}
          className={mode === 'received' ? 'active' : ''}
          onClick={() => setMode('received')}
        >
          Recibidas
        </button>
      </div>
      {requests.length ? (
        <div className="operation-list">
          {requests.map((request) => {
            const item = state.listings.find(
              (listing) => listing.id === request.listingId,
            )!;
            const person = state.users.find(
              (user) =>
                user.id ===
                (mode === 'sent' ? request.lenderId : request.borrowerId),
            );
            return (
              <article className="operation-card" key={request.id}>
                <img src={item.image} alt={item.title} />
                <div className="operation-main">
                  <div className="operation-top">
                    <StatusBadge status={request.status} />
                    <span>{shortDate(request.createdAt)}</span>
                  </div>
                  <h2>{item.title}</h2>
                  <UserChip user={person} />
                  <div className="operation-facts">
                    <span>
                      <CalendarClock />
                      {shortDate(request.startAt)} — {shortDate(request.endAt)}
                    </span>
                    <span>
                      <CircleDollarSign />
                      {money(request.snapshot.dailyRate)}/día
                    </span>
                    <span>
                      <ShieldCheck />
                      Garantía {money(request.snapshot.guaranteeAmount)}
                    </span>
                  </div>
                </div>
                <div className="operation-actions">
                  <Button
                    variant="outline"
                    render={<Link to={`/objects/${item.id}`} />}
                  >
                    Ver objeto
                  </Button>
                  {mode === 'received' && request.status === 'PENDING' && (
                    <>
                      <Button onClick={() => respondRequest(request.id, true)}>
                        <Check />
                        Aceptar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => respondRequest(request.id, false)}
                      >
                        <X />
                        Rechazar
                      </Button>
                    </>
                  )}
                  {mode === 'sent' && request.status === 'PENDING' && (
                    <Button
                      variant="destructive"
                      onClick={() => cancelRequest(request.id)}
                    >
                      Cancelar solicitud
                    </Button>
                  )}
                  {request.status === 'ACCEPTED' && (
                    <Button render={<Link to="/reservations" />}>
                      Ver reserva <ArrowRight />
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={`No tienes solicitudes ${mode === 'sent' ? 'enviadas' : 'recibidas'}`}
          description={
            mode === 'sent'
              ? 'Explora objetos para enviar tu primera solicitud.'
              : 'Las nuevas solicitudes aparecerán aquí.'
          }
          action={mode === 'sent' ? 'Explorar objetos' : undefined}
          href="/explore"
        />
      )}
    </>
  );
}

export function ReservationsPage() {
  const { state } = useDemo();
  const rows = state.reservations.filter(
    (reservation) =>
      reservation.borrowerId === state.currentUserId ||
      reservation.lenderId === state.currentUserId,
  );
  return (
    <>
      <PageHeader
        eyebrow="Operaciones confirmadas"
        title="Reservas"
        description="Solicitudes aceptadas con condiciones congeladas."
      />
      {rows.length ? (
        <div className="reservation-grid">
          {rows.map((reservation) => {
            const item = state.listings.find(
              (listing) => listing.id === reservation.listingId,
            )!;
            const isBorrower = reservation.borrowerId === state.currentUserId;
            const loan = state.loans.find(
              (candidate) => candidate.reservationId === reservation.id,
            );
            return (
              <article className="reservation-card" key={reservation.id}>
                <img src={item.image} alt={item.title} />
                <div className="reservation-body">
                  <div className="operation-top">
                    <StatusBadge status={reservation.status} />
                    <span>
                      {isBorrower ? 'Como prestatario' : 'Como prestamista'}
                    </span>
                  </div>
                  <h2>{item.title}</h2>
                  <p>
                    <CalendarClock />
                    {shortDate(reservation.snapshot.startAt)} —{' '}
                    {shortDate(reservation.snapshot.endAt)}
                  </p>
                  <div className="mini-status">
                    <span>
                      <small>Pago</small>
                      <StatusBadge status={reservation.paymentStatus} />
                    </span>
                    <span>
                      <small>Garantía</small>
                      <StatusBadge status={reservation.guaranteeStatus} />
                    </span>
                    <span>
                      <small>Entrega</small>
                      <strong>
                        {reservation.deliveryRecorded
                          ? 'Registrada'
                          : 'Pendiente'}
                      </strong>
                    </span>
                  </div>
                  <div className="reservation-actions">
                    <Button
                      variant="outline"
                      render={<Link to={`/reservations/${reservation.id}`} />}
                    >
                      Ver detalle
                    </Button>
                    {isBorrower &&
                      reservation.paymentStatus === 'PENDING' &&
                      reservation.status === 'CONFIRMED' && (
                        <Button
                          render={
                            <Link
                              to={`/reservations/${reservation.id}/checkout`}
                            />
                          }
                        >
                          Pagar
                        </Button>
                      )}
                    {!isBorrower &&
                      !reservation.deliveryRecorded &&
                      reservation.paymentStatus === 'PENDING_RELEASE' &&
                      ['HELD', 'NOT_REQUIRED'].includes(
                        reservation.guaranteeStatus,
                      ) && (
                        <Button
                          render={
                            <Link
                              to={`/loans/${loan?.id ?? 'new'}?delivery=${reservation.id}`}
                            />
                          }
                        >
                          Registrar entrega
                        </Button>
                      )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No tienes reservas confirmadas"
          description="Cuando una solicitud sea aceptada, aparecerá aquí."
          action="Explorar objetos"
          href="/explore"
        />
      )}
    </>
  );
}

export function ReservationDetailPage() {
  const { id } = useParams();
  const { state, cancelReservation } = useDemo();
  const reservation = state.reservations.find((item) => item.id === id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('Cambio de planes');
  const [message, setMessage] = useState('');
  if (!reservation)
    return (
      <EmptyState
        title="Reserva no encontrada"
        description="Esta operación no está disponible."
      />
    );
  const item = state.listings.find(
    (listing) => listing.id === reservation.listingId,
  )!;
  const counterpart = state.users.find(
    (user) =>
      user.id ===
      (reservation.borrowerId === state.currentUserId
        ? reservation.lenderId
        : reservation.borrowerId),
  );
  const breakdown = economicBreakdown(reservation.snapshot);
  const loan = state.loans.find(
    (candidate) => candidate.reservationId === reservation.id,
  );
  const canCancel =
    reservation.status === 'CONFIRMED' &&
    !reservation.receiptConfirmedAt &&
    loan?.status !== 'ACTIVE';
  return (
    <>
      <PageHeader
        eyebrow={`Reserva ${reservation.id.toUpperCase()}`}
        title={item.title}
        description="Detalle de la operación confirmada."
        action={<StatusBadge status={reservation.status} />}
      />
      <div className="info-banner immutable">
        <FileCheck2 />
        <p>
          <strong>Condiciones confirmadas e inmutables.</strong> Estas
          condiciones corresponden al momento en que la reserva fue confirmada.
        </p>
      </div>
      <div className="detail-grid">
        <section className="panel">
          <span className="eyebrow">Fechas acordadas</span>
          <h2>{shortDate(reservation.snapshot.startAt)}</h2>
          <p>hasta {shortDate(reservation.snapshot.endAt)}</p>
          <p>
            <MapPin />
            {reservation.snapshot.exchangePlace}
          </p>
        </section>
        <section className="panel">
          <span className="eyebrow">Contraparte</span>
          <UserChip user={counterpart} detail />
          <Reputation
            value={counterpart?.rating ?? 0}
            count={counterpart?.ratingCount}
          />
          {reservation.status !== 'CANCELLED' &&
            reservation.status !== 'COMPLETED' && (
              <div className="contact-card">
                <strong>Coordinación de entrega</strong>
                <span>Teléfono: {counterpart?.phone}</span>
              </div>
            )}
        </section>
        <FinancialCard
          type="payment"
          amount={breakdown.fee + breakdown.serviceFee}
          status={reservation.paymentStatus}
          note={
            reservation.paymentStatus === 'PENDING_RELEASE'
              ? 'Pago confirmado — pendiente de liberación al prestamista.'
              : reservation.paymentStatus === 'RELEASED'
                ? 'Tarifa liberada al prestamista.'
                : reservation.paymentStatus === 'REFUNDED'
                  ? 'Tarifa reembolsada.'
                  : 'Completa el pago para continuar.'
          }
        />
        <FinancialCard
          type="guarantee"
          amount={reservation.snapshot.guaranteeAmount}
          status={reservation.guaranteeStatus}
          note="La garantía se mantiene separada de la tarifa."
        />
        <section className="panel conditions-panel full">
          <span className="eyebrow">Condiciones congeladas</span>
          <dl>
            <div>
              <dt>Uso</dt>
              <dd>{reservation.snapshot.usage}</dd>
            </div>
            <div>
              <dt>Entrega</dt>
              <dd>{reservation.snapshot.delivery}</dd>
            </div>
            <div>
              <dt>Devolución</dt>
              <dd>{reservation.snapshot.returnPolicy}</dd>
            </div>
            <div>
              <dt>Cancelación</dt>
              <dd>{reservation.snapshot.cancellation}</dd>
            </div>
          </dl>
        </section>
      </div>
      <div className="sticky-actions">
        {reservation.paymentStatus === 'PENDING' &&
          reservation.status === 'CONFIRMED' && (
            <Button
              render={<Link to={`/reservations/${reservation.id}/checkout`} />}
            >
              Completar pago
            </Button>
          )}
        {canCancel && (
          <Button variant="destructive" onClick={() => setCancelOpen(true)}>
            Cancelar reserva
          </Button>
        )}{' '}
        {!canCancel && reservation.status === 'ACTIVATED' && (
          <span className="muted">
            La cancelación ya no está disponible después de confirmar la
            recepción.
          </span>
        )}
        <Button variant="outline" render={<Link to="/reservations" />}>
          Volver
        </Button>
      </div>
      {message && <output className="action-message">{message}</output>}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar esta reserva</DialogTitle>
            <DialogDescription>
              Se liberará el periodo, se reembolsará la tarifa aplicable y se
              devolverá la garantía.
            </DialogDescription>
          </DialogHeader>
          <div className="economic-summary">
            <div>
              <span>Tarifa y comisión</span>
              <strong>{money(breakdown.fee + breakdown.serviceFee)}</strong>
            </div>
            <div>
              <span>Garantía</span>
              <strong>{money(breakdown.guarantee)}</strong>
            </div>
          </div>
          <label className="field">
            <span>Motivo</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim()}
              onClick={() => {
                const result = cancelReservation(reservation.id, reason);
                setMessage(result.message);
                setCancelOpen(false);
              }}
            >
              Confirmar cancelación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CheckoutPage() {
  const { id } = useParams();
  const { state, payReservation, holdGuarantee } = useDemo();
  const navigate = useNavigate();
  const reservation = state.reservations.find((item) => item.id === id);
  const {
    data: methods = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => paymentService.getAvailablePaymentMethods(),
  });
  const [method, setMethod] = useState('Yape');
  const [processing, setProcessing] = useState(false);
  if (!reservation)
    return (
      <EmptyState
        title="Reserva no encontrada"
        description="No se puede completar este pago."
      />
    );
  const item = state.listings.find(
    (listing) => listing.id === reservation.listingId,
  )!;
  const breakdown = economicBreakdown(reservation.snapshot);
  return (
    <>
      <PageHeader
        eyebrow="Pago simulado"
        title={`Completa tu reserva · ${item.title}`}
        description="No se guarda información financiera sensible."
      />
      <div className="checkout-layout">
        <section className="panel">
          <h2>Medio de pago</h2>
          {isLoading ? (
            <LoadingSkeleton cards={1} />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <div className="payment-methods">
              {methods.map((label) => (
                <label
                  key={label}
                  className={method === label ? 'selected' : ''}
                >
                  <input
                    type="radio"
                    checked={method === label}
                    onChange={() => setMethod(label)}
                  />
                  <WalletCards />
                  <span>
                    <strong>{label}</strong>
                    <small>Método demo</small>
                  </span>
                </label>
              ))}
            </div>
          )}
          <div className="info-banner">
            <ShieldCheck />
            <p>
              Esta simulación no solicita números de tarjeta, claves ni códigos.
            </p>
          </div>
        </section>
        <aside className="panel checkout-summary">
          <h2>Desglose económico</h2>
          <div className="economic-summary">
            <div>
              <span>Tarifa · {breakdown.days} días</span>
              <strong>{money(breakdown.fee)}</strong>
            </div>
            <div>
              <span>Comisión</span>
              <strong>{money(breakdown.serviceFee)}</strong>
            </div>
            <div>
              <span>Garantía</span>
              <strong>{money(breakdown.guarantee)}</strong>
            </div>
            <div className="total">
              <span>Total</span>
              <strong>{money(breakdown.total)}</strong>
            </div>
          </div>
          <Button
            size="lg"
            disabled={processing || isLoading}
            onClick={() => {
              setProcessing(true);
              setTimeout(() => {
                payReservation(reservation.id, method);
                holdGuarantee(reservation.id);
                navigate(`/reservations/${reservation.id}`);
              }, 500);
            }}
          >
            {processing ? 'Procesando…' : 'Confirmar pago y garantía'}
          </Button>
        </aside>
      </div>
    </>
  );
}

export function LoansPage() {
  const { state } = useDemo();
  const [tab, setTab] = useState<
    'UPCOMING' | 'ACTIVE' | 'OVERDUE' | 'COMPLETED'
  >('ACTIVE');
  const mine = state.loans.filter(
    (item) =>
      item.borrowerId === state.currentUserId ||
      item.lenderId === state.currentUserId,
  );
  const filtered = mine.filter((item) =>
    tab === 'UPCOMING'
      ? ['PENDING_DELIVERY', 'PENDING_RECEIPT'].includes(item.status)
      : item.status === tab ||
        (tab === 'ACTIVE' && item.status === 'RETURN_RECORDED'),
  );
  return (
    <>
      <PageHeader
        eyebrow="Operaciones"
        title="Préstamos"
        description="Revisa estado, próxima acción, tarifa, garantía y contraparte."
      />
      <div className="tabs-bar" role="tablist">
        {(
          [
            { key: 'UPCOMING', label: 'Próximos' },
            { key: 'ACTIVE', label: 'Activos' },
            { key: 'OVERDUE', label: 'Vencidos' },
            { key: 'COMPLETED', label: 'Finalizados' },
          ] as const
        ).map((item) => (
          <button
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            key={item.key}
            className={tab === item.key ? 'active' : ''}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {filtered.length ? (
        <div className="reservation-grid">
          {filtered.map((item) => {
            const listing = state.listings.find(
              (candidate) => candidate.id === item.listingId,
            )!;
            const isBorrower = item.borrowerId === state.currentUserId;
            const counterpart = state.users.find(
              (user) =>
                user.id === (isBorrower ? item.lenderId : item.borrowerId),
            );
            const next =
              item.status === 'PENDING_RECEIPT'
                ? 'Confirmar recepción'
                : item.status === 'ACTIVE'
                  ? 'Registrar devolución'
                  : item.status === 'RETURN_RECORDED'
                    ? 'Confirmar devolución'
                    : item.status === 'OVERDUE'
                      ? 'Coordinar devolución'
                      : 'Calificar experiencia';
            return (
              <article className="reservation-card" key={item.id}>
                <img src={listing.image} alt={listing.title} />
                <div className="reservation-body">
                  <div className="operation-top">
                    <StatusBadge status={item.status} />
                    <span>
                      {isBorrower ? 'Como prestatario' : 'Como prestamista'}
                    </span>
                  </div>
                  <h2>{listing.title}</h2>
                  <UserChip user={counterpart} />
                  <p>
                    <CalendarClock />
                    {shortDate(item.snapshot.startAt)} —{' '}
                    {shortDate(item.currentReturnAt)}
                  </p>
                  <div className="mini-status">
                    <span>
                      <small>Próxima acción</small>
                      <strong>{next}</strong>
                    </span>
                    <span>
                      <small>Tarifa</small>
                      <strong>
                        {money(economicBreakdown(item.snapshot).fee)}
                      </strong>
                    </span>
                    <span>
                      <small>Garantía</small>
                      <StatusBadge status={item.guaranteeStatus} />
                    </span>
                  </div>
                  <Button render={<Link to={`/loans/${item.id}`} />}>
                    Abrir operación
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title={`No tienes préstamos ${tab === 'ACTIVE' ? 'activos' : tab === 'UPCOMING' ? 'próximos' : tab === 'OVERDUE' ? 'vencidos' : 'finalizados'}`}
          description="Cuando exista una operación en este estado, aparecerá aquí."
        />
      )}
    </>
  );
}

type LoanDialog =
  | 'receipt'
  | 'extension'
  | 'reschedule'
  | 'return'
  | 'early'
  | 'confirm'
  | 'rating'
  | null;
export function LoanDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const {
    state,
    recordDelivery,
    confirmReceipt,
    requestExtension,
    respondExtension,
    proposeReschedule,
    respondReschedule,
    recordReturn,
    confirmReturn,
    rateLoan,
    saveAnalysis,
  } = useDemo();
  const navigate = useNavigate();
  const deliveryId = params.get('delivery');
  const reservation = state.reservations.find((item) => item.id === deliveryId);
  const item = state.loans.find((candidate) => candidate.id === id);
  const [deliveryEvidence, setDeliveryEvidence] = useState<Evidence[]>([]);
  const [dialog, setDialog] = useState<LoanDialog>(null);
  const [newDate, setNewDate] = useState('2026-10-15T18:00');
  const [notes, setNotes] = useState('');
  const [returnEvidence, setReturnEvidence] = useState<Evidence[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  if (id === 'new' && reservation) {
    const listing = state.listings.find(
      (candidate) => candidate.id === reservation.listingId,
    )!;
    const current = state.users.find(
      (user) => user.id === state.currentUserId,
    )!;
    return (
      <>
        <PageHeader
          eyebrow="Entrega"
          title={`Registrar entrega · ${listing.title}`}
          description="Documenta el estado y funcionamiento antes de entregar."
        />
        <div className="info-banner">
          <FileCheck2 />
          <p>
            <strong>Controles previos:</strong> pago{' '}
            {reservation.paymentStatus === 'PENDING_RELEASE'
              ? 'confirmado'
              : 'pendiente'}{' '}
            y garantía {reservation.guaranteeStatus}.
          </p>
        </div>
        <section className="panel">
          <EvidenceUploader
            stage="BEFORE"
            author={current.name}
            authorId={current.id}
            value={deliveryEvidence}
            onChange={setDeliveryEvidence}
          />
          <Button
            size="lg"
            disabled={!deliveryEvidence.length}
            onClick={() => {
              const result = recordDelivery(reservation.id, deliveryEvidence);
              setMessage(result.message);
              if (result.ok) setTimeout(() => navigate('/loans'), 500);
            }}
          >
            Confirmar entrega
          </Button>
          {message && <output className="action-message">{message}</output>}
        </section>
      </>
    );
  }
  if (!item)
    return (
      <EmptyState
        title="Préstamo no encontrado"
        description="Esta operación no existe."
      />
    );
  const listing = state.listings.find(
    (candidate) => candidate.id === item.listingId,
  )!;
  const isBorrower = item.borrowerId === state.currentUserId;
  const counterpart = state.users.find(
    (user) => user.id === (isBorrower ? item.lenderId : item.borrowerId),
  );
  const breakdown = economicBreakdown(item.snapshot);
  const unresolvedIncident = state.incidents.some(
    (incident) => incident.loanId === item.id && incident.status !== 'RESOLVED',
  );
  const pendingExtension = item.extensions.findLast(
    (extension) => extension.status === 'PENDING',
  );
  const pendingReschedule = item.reschedules.findLast(
    (reschedule) => reschedule.status === 'PENDING',
  );
  const alreadyRated = item.ratedBy.includes(state.currentUserId);
  const analysis = state.analyses.find(
    (candidate) => candidate.loanId === item.id,
  );
  const runAnalysis = async () => {
    saveAnalysis({
      id: `analysis-${item.id}`,
      loanId: item.id,
      status: 'ANALYZING',
      updatedAt: new Date().toISOString(),
    });
    const result = await evidenceAnalysisService.analyze(item.id);
    saveAnalysis(result);
  };
  return (
    <>
      <PageHeader
        eyebrow={`Préstamo ${item.id.toUpperCase()}`}
        title={listing.title}
        description={`${isBorrower ? 'Como prestatario' : 'Como prestamista'} · ${counterpart?.name}`}
        action={<StatusBadge status={item.status} />}
      />
      <div className="info-banner immutable">
        <FileCheck2 />
        <p>
          <strong>Condiciones congeladas.</strong> Estas condiciones
          corresponden al momento en que la reserva fue confirmada.
        </p>
      </div>
      <div className="detail-grid">
        <section className="panel">
          <span className="eyebrow">Periodo vigente</span>
          <h2>{shortDate(item.snapshot.startAt)}</h2>
          <p>hasta {shortDate(item.currentReturnAt)}</p>
          {item.currentReturnAt !== item.originalReturnAt && (
            <p className="muted">
              Fecha original: {shortDate(item.originalReturnAt)}
            </p>
          )}
          <p>
            <MapPin />
            {item.snapshot.exchangePlace}
          </p>
        </section>
        <section className="panel">
          <span className="eyebrow">Contraparte</span>
          <UserChip user={counterpart} detail />
          {item.status !== 'COMPLETED' && (
            <div className="contact-card">
              <strong>Coordinación de entrega</strong>
              <span>Teléfono: {counterpart?.phone}</span>
            </div>
          )}
        </section>
        <FinancialCard
          type="payment"
          amount={breakdown.fee + breakdown.serviceFee}
          status={item.paymentStatus}
          note={
            item.paymentStatus === 'RELEASED'
              ? 'Tarifa liberada al prestamista.'
              : 'Pago confirmado — pendiente de liberación al prestamista.'
          }
        />
        <FinancialCard
          type="guarantee"
          amount={item.snapshot.guaranteeAmount}
          status={item.guaranteeStatus}
          note={
            unresolvedIncident
              ? 'Garantía retenida mientras se resuelve la incidencia.'
              : 'Estado actual de la garantía.'
          }
        />
      </div>
      <section className="panel">
        <span className="eyebrow">Trazabilidad</span>
        <Timeline items={item.timeline} />
      </section>
      <EvidenceComparison
        evidence={item.evidence}
        analysis={analysis}
        onAnalyze={runAnalysis}
      />
      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Historial</span>
            <h2>Extensiones y reprogramaciones</h2>
          </div>
          <RotateCcw />
        </div>
        {!item.extensions.length && !item.reschedules.length ? (
          <p className="muted">No hay cambios de fecha registrados.</p>
        ) : (
          <div className="history-list">
            {item.extensions.map((extension) => (
              <article key={extension.id}>
                <strong>Extensión solicitada por el prestatario</strong>
                <span>
                  {shortDate(extension.originalReturnAt)} →{' '}
                  {shortDate(extension.proposedReturnAt)}
                </span>
                <span>Costo adicional: {money(extension.additionalCost)}</span>
                <StatusBadge status={extension.status} />
              </article>
            ))}
            {item.reschedules.map((reschedule) => (
              <article key={reschedule.id}>
                <strong>Reprogramación propuesta por el prestamista</strong>
                <span>
                  {shortDate(reschedule.originalReturnAt)} →{' '}
                  {shortDate(reschedule.proposedReturnAt)}
                </span>
                <span>Costo adicional: {money(0)}</span>
                <StatusBadge status={reschedule.status} />
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="sticky-actions">
        {isBorrower && item.status === 'PENDING_RECEIPT' && (
          <Button onClick={() => setDialog('receipt')}>
            Confirmar recepción
          </Button>
        )}
        {isBorrower && item.status === 'ACTIVE' && (
          <>
            <Button variant="outline" onClick={() => setDialog('extension')}>
              Solicitar extensión
            </Button>
            <Button onClick={() => setDialog('return')}>
              Registrar devolución
            </Button>
            <Button variant="outline" onClick={() => setDialog('early')}>
              Devolver antes de tiempo
            </Button>
          </>
        )}
        {!isBorrower && item.status === 'ACTIVE' && (
          <Button variant="outline" onClick={() => setDialog('reschedule')}>
            Proponer nueva fecha
          </Button>
        )}
        {!isBorrower && pendingExtension && (
          <>
            <Button onClick={() => respondExtension(item.id, true)}>
              Aceptar extensión
            </Button>
            <Button
              variant="destructive"
              onClick={() => respondExtension(item.id, false)}
            >
              Rechazar extensión
            </Button>
          </>
        )}
        {isBorrower && pendingReschedule && (
          <>
            <Button onClick={() => respondReschedule(item.id, true)}>
              Aceptar reprogramación
            </Button>
            <Button
              variant="destructive"
              onClick={() => respondReschedule(item.id, false)}
            >
              Rechazar reprogramación
            </Button>
          </>
        )}
        {!isBorrower && item.status === 'RETURN_RECORDED' && (
          <>
            <Button onClick={() => setDialog('confirm')}>
              Confirmar devolución
            </Button>
            <Button
              variant="destructive"
              render={<Link to={`/incidents?loan=${item.id}`} />}
            >
              <ShieldAlert />
              Reportar incidencia
            </Button>
          </>
        )}
        {item.status === 'COMPLETED' && !alreadyRated && (
          <Button onClick={() => setDialog('rating')}>
            Calificar experiencia
          </Button>
        )}
        {item.status === 'COMPLETED' && alreadyRated && (
          <span className="success-text">Ya calificaste esta operación.</span>
        )}
        {item.status === 'ACTIVE' && (
          <span className="muted">Un préstamo activo no puede cancelarse.</span>
        )}
      </div>
      {message && <output className="action-message">{message}</output>}
      <LoanActionDialog
        dialog={dialog}
        onClose={() => setDialog(null)}
        item={item}
        currentUser={state.users.find(
          (user) => user.id === state.currentUserId,
        )!}
        newDate={newDate}
        setNewDate={setNewDate}
        notes={notes}
        setNotes={setNotes}
        evidence={returnEvidence}
        setEvidence={setReturnEvidence}
        rating={rating}
        setRating={setRating}
        comment={comment}
        setComment={setComment}
        onSubmit={() => {
          if (dialog === 'receipt') confirmReceipt(item.id);
          if (dialog === 'extension') {
            const result = requestExtension(
              item.id,
              new Date(newDate).toISOString(),
            );
            setMessage(result.message);
          }
          if (dialog === 'reschedule') {
            const result = proposeReschedule(
              item.id,
              new Date(newDate).toISOString(),
            );
            setMessage(result.message);
          }
          if (dialog === 'return' || dialog === 'early')
            recordReturn(item.id, dialog === 'early', notes, returnEvidence);
          if (dialog === 'confirm') confirmReturn(item.id);
          if (dialog === 'rating') {
            const result = rateLoan(item.id, rating, comment);
            setMessage(result.message);
          }
          setDialog(null);
        }}
      />
    </>
  );
}

function EvidenceComparison({
  evidence,
  analysis,
  onAnalyze,
}: {
  evidence: Evidence[];
  analysis?: ReturnType<typeof useDemo>['state']['analyses'][number];
  onAnalyze: () => void;
}) {
  const before = evidence.filter((item) => item.stage === 'BEFORE');
  const after = evidence.filter((item) => item.stage === 'AFTER');
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Evidencias</span>
          <h2>Comparación antes y después</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onAnalyze}
          disabled={analysis?.status === 'ANALYZING'}
        >
          {analysis?.status === 'ANALYZING'
            ? 'Analizando…'
            : 'Simular análisis'}
        </Button>
      </div>
      <div className="ai-banner">
        <ShieldCheck />
        <div>
          <strong>Análisis automático · {analysis?.status ?? 'IDLE'}</strong>
          <p>
            {analysis?.summary ??
              'Inicia el análisis simulado cuando existan evidencias.'}
          </p>
          <small>
            El análisis automático es únicamente información de apoyo y no
            determina responsabilidades.
          </small>
        </div>
      </div>
      <div className="evidence-comparison">
        <EvidenceColumn title="Antes de la entrega" items={before} />
        <EvidenceColumn title="Después de la devolución" items={after} />
      </div>
    </section>
  );
}
function EvidenceColumn({
  title,
  items,
}: {
  title: string;
  items: Evidence[];
}) {
  return (
    <section>
      <span className="eyebrow">{title}</span>
      {items.length ? (
        items.map((item) => (
          <div className="evidence-tile" key={item.id}>
            {item.url && item.type === 'PHOTO' ? (
              <img src={item.url} alt={item.label} />
            ) : (
              <Camera />
            )}
            <strong>{item.label}</strong>
            <span>
              {item.author} · {shortDate(item.date)}
            </span>
          </div>
        ))
      ) : (
        <p className="muted">Sin evidencias.</p>
      )}
    </section>
  );
}

function LoanActionDialog({
  dialog,
  onClose,
  item,
  currentUser,
  newDate,
  setNewDate,
  notes,
  setNotes,
  evidence,
  setEvidence,
  rating,
  setRating,
  comment,
  setComment,
  onSubmit,
}: {
  dialog: LoanDialog;
  onClose: () => void;
  item: ReturnType<typeof useDemo>['state']['loans'][number];
  currentUser: ReturnType<typeof useDemo>['state']['users'][number];
  newDate: string;
  setNewDate: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  evidence: Evidence[];
  setEvidence: (value: Evidence[]) => void;
  rating: number;
  setRating: (value: number) => void;
  comment: string;
  setComment: (value: string) => void;
  onSubmit: () => void;
}) {
  const title =
    dialog === 'receipt'
      ? 'Confirmar recepción'
      : dialog === 'extension'
        ? 'Solicitar extensión'
        : dialog === 'reschedule'
          ? 'Proponer nueva fecha'
          : dialog === 'early'
            ? 'Devolver antes de tiempo'
            : dialog === 'confirm'
              ? 'Confirmar devolución'
              : dialog === 'rating'
                ? 'Calificar experiencia'
                : 'Registrar devolución';
  const needsEvidence = dialog === 'return' || dialog === 'early';
  const validDate = new Date(newDate) > new Date(item.currentReturnAt);
  return (
    <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flow-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {dialog === 'receipt'
              ? 'Después de confirmar, el préstamo quedará activo y la tarifa se liberará.'
              : dialog === 'early'
                ? 'La devolución anticipada usa el mismo proceso de evidencias y confirmación.'
                : 'Revisa la información antes de confirmar.'}
          </DialogDescription>
        </DialogHeader>
        {dialog === 'receipt' && (
          <div className="warning-box">
            <AlertTriangle />
            <p>
              Después de confirmar la recepción, esta operación ya no podrá
              cancelarse.
            </p>
          </div>
        )}
        {(dialog === 'extension' || dialog === 'reschedule') && (
          <>
            <label className="field">
              <span>Nueva fecha y hora</span>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(event) => setNewDate(event.target.value)}
              />
            </label>
            <div className="economic-summary">
              <div>
                <span>Costo adicional</span>
                <strong>
                  {dialog === 'reschedule'
                    ? money(0)
                    : money(
                        extensionCost(
                          item.currentReturnAt,
                          newDate,
                          item.snapshot.dailyRate,
                        ),
                      )}
                </strong>
              </div>
            </div>
            {!validDate && (
              <p className="field-error">
                La fecha propuesta debe ser posterior a la fecha vigente.
              </p>
            )}
          </>
        )}
        {dialog === 'early' && (
          <div className="warning-box strong">
            <AlertTriangle />
            <p>
              <strong>
                Devolver el objeto antes de la fecha acordada no genera
                automáticamente un reembolso proporcional de la tarifa pagada.
              </strong>
            </p>
          </div>
        )}
        {needsEvidence && (
          <>
            <EvidenceUploader
              stage="AFTER"
              author={currentUser.name}
              authorId={currentUser.id}
              value={evidence}
              onChange={setEvidence}
              label="Evidencias finales"
            />
            <label className="field">
              <span>Estado, funcionamiento y observaciones</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>
          </>
        )}
        {dialog === 'confirm' && (
          <div className="success-box">
            <CheckCircle2 />
            <p>
              Si no existe una incidencia abierta, la garantía se liberará. Si
              existe, seguirá retenida hasta su resolución.
            </p>
          </div>
        )}
        {dialog === 'rating' && (
          <div className="rating-input">
            <p>¿Cómo fue tu experiencia?</p>
            <div>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setRating(value)}
                  aria-label={`${value} estrellas`}
                >
                  <Star fill={value <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            <label className="field">
              <span>Comentario</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Volver
          </Button>
          <Button
            type="button"
            disabled={
              (needsEvidence && !evidence.length) ||
              ((dialog === 'extension' || dialog === 'reschedule') &&
                !validDate) ||
              (dialog === 'rating' && (rating < 1 || rating > 5))
            }
            onClick={onSubmit}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
