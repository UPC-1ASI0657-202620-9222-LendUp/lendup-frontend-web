'use client';

import { useMemo, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  ArrowRight,
  FileCheck2,
  Scale,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DefinitionList,
  EmptyState,
  Feedback,
  LoadingSkeleton,
  ErrorState,
  FinancialCard,
  NotFound,
  PageHeader,
  StatusBadge,
  Timeline,
  UserChip,
} from '@/components/lendup/shared';
import {
  EvidenceGallery,
  EvidenceUploader,
} from '@/components/lendup/evidence';
import { ConfirmDialog, Field } from '@/components/lendup/forms';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { remainingGuarantee } from '@/lib/business-rules';
import { zonedDayKey } from '@/lib/dates';
import { incidentTypes } from '@/config/reference-data';
import { useLendUp, type ActionResult } from '@/hooks/use-lendup';
import { currentUserOf, listingById, userById } from '@/stores/selectors';
import type {
  Evidence,
  Incident,
  IncidentDecision,
  IncidentStatus,
  IncidentType,
} from '@/types/domain';

function IncidentProgress({ incident }: { incident: Incident }) {
  return (
    <Timeline
      items={[
        {
          id: 'reported',
          event: 'INCIDENT_REPORTED',
          at: incident.createdAt,
          complete: true,
        },
        {
          id: 'review',
          event: 'INCIDENT_REVIEW',
          at: incident.reviewStartedAt,
          complete: incident.status !== 'OPEN',
        },
        {
          id: 'resolved',
          event: 'INCIDENT_RESOLVED',
          at: incident.resolution?.resolvedAt,
          complete: incident.status === 'RESOLVED',
        },
      ]}
    />
  );
}

function ResolutionSummary({ incident }: { incident: Incident }) {
  const { t, formatMoney, formatDateTime } = useI18n();
  const { state } = useLendUp();
  if (!incident.resolution) return null;
  const { resolution } = incident;
  return (
    <section className="panel resolution-summary">
      <p className="eyebrow">{t('incidents.resolution')}</p>
      <h2>{t(`incidentDecisions.${resolution.decision}.title`)}</h2>
      <p>{resolution.justification}</p>
      <DefinitionList
        items={[
          [t('incidents.capturedAmount'), formatMoney(resolution.amount)],
          [
            t('incidents.refundedAmount'),
            formatMoney(resolution.refundedAmount),
          ],
          [t('incidents.resolvedAt'), formatDateTime(resolution.resolvedAt)],
          [
            t('incidents.resolvedBy'),
            userById(state, resolution.resolvedBy)?.name ?? '',
          ],
        ]}
      />
    </section>
  );
}

export function IncidentsPage() {
  const { t, formatDateTime } = useI18n();
  const {
    state,
    reportIncident,
    incidentsLoading,
    incidentsError,
    retryIncidents,
  } = useLendUp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = currentUserOf(state);
  const eligibleLoans = state.loans.filter(
    (loan) =>
      (loan.borrowerId === state.currentUserId ||
        loan.lenderId === state.currentUserId) &&
      loan.status !== 'COMPLETED',
  );
  const loanParam = params.get('loan');
  const [showForm, setShowForm] = useState(Boolean(loanParam));
  const [loanId, setLoanId] = useState(
    eligibleLoans.some((loan) => loan.id === loanParam)
      ? (loanParam as string)
      : '',
  );
  const [type, setType] = useState<IncidentType | ''>('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<ActionResult | null>(null);
  const [touched, setTouched] = useState(false);
  const mine = state.incidents
    .filter((incident) => {
      const loan = state.loans.find((item) => item.id === incident.loanId);
      return (
        loan?.borrowerId === state.currentUserId ||
        loan?.lenderId === state.currentUserId
      );
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!user) return null;
  const errors = {
    loan: !loanId ? t('validation.select') : undefined,
    type: !type ? t('validation.select') : undefined,
    description:
      description.trim().length < 20
        ? t('validation.min', { count: 20 })
        : undefined,
  };

  const submit = async () => {
    setTouched(true);
    if (errors.loan || errors.type || errors.description || !type) return;
    if (submitting) return;
    setSubmitting(true);
    const outcome = await reportIncident(
      loanId,
      type,
      description,
      evidence,
      photos,
      requestId,
    );
    setSubmitting(false);
    setResult(outcome);
    if (outcome.ok && outcome.id) navigate(`/incidents/${outcome.id}`);
  };

  return (
    <>
      <PageHeader
        eyebrow={t('incidents.eyebrow')}
        title={t('incidents.title')}
        description={t('incidents.description')}
        action={
          <Button
            type="button"
            onClick={() => setShowForm((value) => !value)}
            aria-expanded={showForm}
          >
            <ShieldAlert aria-hidden="true" />
            {t('incidents.report')}
          </Button>
        }
      />
      {showForm && (
        <section className="panel incident-form">
          <h2>{t('incidents.newTitle')}</h2>
          <p className="muted small">{t('incidents.newHint')}</p>
          {eligibleLoans.length === 0 ? (
            <p className="muted">{t('incidents.noEligibleLoans')}</p>
          ) : (
            <>
              <div className="field-grid">
                <Field
                  label={t('incidents.loan')}
                  error={touched ? errors.loan : undefined}
                  required
                >
                  <select
                    value={loanId}
                    onChange={(event) => setLoanId(event.target.value)}
                  >
                    <option value="">{t('common.selectOption')}</option>
                    {eligibleLoans.map((loan) => (
                      <option value={loan.id} key={loan.id}>
                        {listingById(state, loan.listingId)?.title} ·{' '}
                        {t(`status.loan.${loan.status}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={t('incidents.type')}
                  error={touched ? errors.type : undefined}
                  required
                >
                  <select
                    value={type}
                    onChange={(event) =>
                      setType(event.target.value as IncidentType)
                    }
                  >
                    <option value="">{t('common.selectOption')}</option>
                    {incidentTypes.map((value) => (
                      <option value={value} key={value}>
                        {t(`incidentTypes.${value}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={t('incidents.descriptionLabel')}
                  error={touched ? errors.description : undefined}
                  hint={t('incidents.descriptionHint')}
                  wide
                  required
                >
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </Field>
                <div className="wide">
                  <EvidenceUploader
                    phase="INCIDENT"
                    author={user}
                    value={evidence}
                    onChange={setEvidence}
                    label={t('incidents.evidenceLabel')}
                  />
                </div>
              </div>
              <Field
                label={t('incidents.photos')}
                hint={t('incidents.photosHint')}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={submitting}
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (
                      files.length > 6 ||
                      files.some(
                        (file) =>
                          file.size === 0 ||
                          file.size > 5 * 1024 * 1024 ||
                          !['image/jpeg', 'image/png', 'image/webp'].includes(
                            file.type,
                          ),
                      )
                    ) {
                      setResult({ ok: false, message: 'incidents.photoError' });
                      event.target.value = '';
                      setPhotos([]);
                      return;
                    }
                    setPhotos(files);
                  }}
                />
                {photos.map((file) => (
                  <small key={file.name}>{file.name}</small>
                ))}
              </Field>
              <p className="inline-status">
                <ShieldCheck aria-hidden="true" />
                {t('incidents.guaranteeHoldNotice')}
              </p>
              <Feedback result={result && !result.ok ? result : null} />
              <div className="form-footer">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="button" onClick={submit} disabled={submitting}>
                  {t('incidents.submit')}
                </Button>
              </div>
            </>
          )}
        </section>
      )}
      {incidentsError ? (
        <section className="panel">
          <p role="alert">{t('incidents.loadError')}</p>
          <Button onClick={() => void retryIncidents()}>
            {t('incidents.retry')}
          </Button>
        </section>
      ) : incidentsLoading ? (
        <output>{t('incidents.loading')}</output>
      ) : mine.length ? (
        <ul className="incident-list">
          {mine.map((incident) => {
            const loan = state.loans.find(
              (item) => item.id === incident.loanId,
            );
            const listing = listingById(state, loan?.listingId);
            return (
              <li key={incident.id}>
                <Link
                  to={`/incidents/${incident.id}`}
                  className="incident-card panel"
                >
                  <span className="incident-icon" aria-hidden="true">
                    <ShieldAlert />
                  </span>
                  <div>
                    <p className="eyebrow">
                      {incident.id} · {t(`incidentTypes.${incident.type}`)}
                    </p>
                    <h2>{listing?.title}</h2>
                    <p className="clamp-2">{incident.description}</p>
                    <small className="muted">
                      {t('incidents.reportedBy', {
                        name: userById(state, incident.reportedBy)?.name ?? '',
                        date: formatDateTime(incident.createdAt),
                      })}
                    </small>
                  </div>
                  <div className="incident-card-side">
                    <StatusBadge kind="incident" status={incident.status} />
                    <ArrowRight aria-hidden="true" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        !showForm && (
          <EmptyState
            icon={ShieldAlert}
            title={t('incidents.emptyTitle')}
            description={t('incidents.emptyDescription')}
          />
        )
      )}
    </>
  );
}

export function IncidentDetailPage() {
  const { t, formatDateTime } = useI18n();
  const { id } = useParams();
  const { state, submitIncidentStatement } = useLendUp();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [statement, setStatement] = useState('');
  const incident = state.incidents.find((item) => item.id === id);
  const loan = state.loans.find((item) => item.id === incident?.loanId);
  if (!incident)
    return (
      <NotFound
        title={t('incidents.notFound')}
        description={t('errors.notFound.description')}
      />
    );
  if (!loan)
    return (
      <>
        <Link className="back-link" to="/admin/incidents">
          <ArrowLeft aria-hidden="true" />
          {t('admin.back')}
        </Link>
        <PageHeader
          eyebrow={`${t('admin.eyebrow')} · ${incident.id}`}
          title={t(`incidentTypes.${incident.type}`)}
          description={formatDateTime(incident.createdAt)}
        />
        <EmptyState
          icon={ShieldAlert}
          title={t('incidents.notFound')}
          description={t('errors.notFound.description')}
        />
      </>
    );
  const listing = listingById(state, loan.listingId);
  const reporter = userById(state, incident.reportedBy);
  const canRespond =
    incident.status !== 'RESOLVED' &&
    incident.reportedBy !== state.currentUserId &&
    !incident.counterpartyStatement;

  return (
    <>
      <Link className="back-link" to="/incidents">
        <ArrowLeft aria-hidden="true" />
        {t('incidents.back')}
      </Link>
      <PageHeader
        eyebrow={`${incident.id} · ${t(`incidentTypes.${incident.type}`)}`}
        title={listing?.title ?? ''}
        description={t('incidents.linkedLoan')}
        action={<StatusBadge kind="incident" status={incident.status} />}
      />
      {incident.status !== 'RESOLVED' && (
        <div className="app-banner warning">
          <ShieldAlert aria-hidden="true" />
          <p>{t('incidents.holdBanner')}</p>
        </div>
      )}
      <div className="detail-grid">
        <section className="panel">
          <p className="eyebrow">{t('incidents.reporterStatement')}</p>
          <UserChip
            user={reporter}
            detail={formatDateTime(incident.createdAt)}
          />
          <p>{incident.description}</p>
          <p className="eyebrow">{t('incidents.counterpartyStatement')}</p>
          {incident.counterpartyStatement ? (
            <>
              <p>{incident.counterpartyStatement}</p>
              <small className="muted">
                {formatDateTime(incident.counterpartyStatementAt)}
              </small>
            </>
          ) : (
            <p className="muted">{t('incidents.noStatement')}</p>
          )}
        </section>
        <section className="panel">
          <p className="eyebrow">{t('incidents.progress')}</p>
          <IncidentProgress incident={incident} />
          <Button variant="outline" render={<Link to={`/loans/${loan.id}`} />}>
            {t('incidents.openLoan')}
          </Button>
        </section>
        <FinancialCard
          type="guarantee"
          amount={incident.guaranteeAmount}
          status={loan.guaranteeStatus}
          note={t(
            `finance.guaranteeNotes.${loan.guaranteeStatus}` as MessageKey,
          )}
        />
        <EvidenceGallery
          title={t('incidents.evidence')}
          items={incident.evidence}
        />
      </div>
      <ResolutionSummary incident={incident} />
      <Feedback result={result} />
      {canRespond && (
        <section className="panel">
          <p className="eyebrow">{t('incidents.yourStatement')}</p>
          <h2>{t('incidents.yourStatementTitle')}</h2>
          <Field
            label={t('incidents.statementLabel')}
            hint={t('validation.min', { count: 20 })}
            required
          >
            <textarea
              rows={4}
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
            />
          </Field>
          <Button
            type="button"
            disabled={saving || statement.trim().length < 20}
            onClick={async () => {
              setSaving(true);
              const outcome = await submitIncidentStatement(
                incident.id,
                statement,
              );
              setResult(outcome);
              setSaving(false);
            }}
          >
            {t('incidents.saveStatement')}
          </Button>
        </section>
      )}
    </>
  );
}

const incidentStatuses: IncidentStatus[] = ['OPEN', 'UNDER_REVIEW', 'RESOLVED'];

export function AdminIncidentsPage() {
  const { t, formatDateTime, formatMoney } = useI18n();
  const { state, incidentsLoading, incidentsError, retryIncidents } =
    useLendUp();
  const [status, setStatus] = useState<IncidentStatus | ''>('');
  const [type, setType] = useState<IncidentType | ''>('');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  const incidents = useMemo(
    () =>
      state.incidents
        .filter((item) => {
          const listing = listingById(
            state,
            state.loans.find((loan) => loan.id === item.loanId)?.listingId,
          );
          const term = search.trim().toLowerCase();
          return (
            (!status || item.status === status) &&
            (!type || item.type === type) &&
            (!date || zonedDayKey(item.createdAt) === date) &&
            (!term ||
              `${item.id} ${item.loanId} ${listing?.title ?? ''}`
                .toLowerCase()
                .includes(term))
          );
        })
        .sort((a, b) =>
          order === 'asc'
            ? a.createdAt.localeCompare(b.createdAt)
            : b.createdAt.localeCompare(a.createdAt),
        ),
    [state, status, type, date, search, order],
  );
  const counts = Object.fromEntries(
    incidentStatuses.map((value) => [
      value,
      state.incidents.filter((item) => item.status === value).length,
    ]),
  );
  const clear = () => {
    setStatus('');
    setType('');
    setDate('');
    setSearch('');
    setOrder('desc');
  };

  return (
    <>
      <PageHeader
        eyebrow={t('admin.eyebrow')}
        title={t('admin.title')}
        description={t('admin.description')}
      />
      <fieldset className="status-chips">
        <legend className="sr-only">{t('admin.statusFilter')}</legend>
        <button
          type="button"
          aria-pressed={!status}
          onClick={() => setStatus('')}
        >
          {t('admin.all')}{' '}
          <span className="pill-count">{state.incidents.length}</span>
        </button>
        {incidentStatuses.map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            {t(`status.incident.${value}`)}{' '}
            <span className="pill-count">{counts[value]}</span>
          </button>
        ))}
      </fieldset>
      <div className="filter-panel open admin-filters">
        <Field label={t('incidents.type')}>
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as IncidentType | '')
            }
          >
            <option value="">{t('admin.allTypes')}</option>
            {incidentTypes.map((value) => (
              <option value={value} key={value}>
                {t(`incidentTypes.${value}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('admin.date')}>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </Field>
        <Field label={t('admin.search')}>
          <input
            type="search"
            value={search}
            placeholder={t('admin.searchPlaceholder')}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field>
        <Field label={t('admin.order')}>
          <select
            value={order}
            onChange={(event) => setOrder(event.target.value as 'asc' | 'desc')}
          >
            <option value="desc">{t('admin.newest')}</option>
            <option value="asc">{t('admin.oldest')}</option>
          </select>
        </Field>
        <div className="filter-actions">
          <Button type="button" variant="ghost" onClick={clear}>
            {t('explore.clear')}
          </Button>
        </div>
      </div>
      <output className="result-count">
        {t('admin.results', { count: incidents.length })}
      </output>
      {incidentsError ? (
        <section className="panel">
          <p role="alert">{t('incidents.loadError')}</p>
          <Button onClick={() => void retryIncidents()}>
            {t('incidents.retry')}
          </Button>
        </section>
      ) : incidentsLoading ? (
        <output>{t('incidents.loading')}</output>
      ) : incidents.length ? (
        <section className="panel table-panel">
          <div className="responsive-table">
            <table>
              <caption className="sr-only">{t('admin.title')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('admin.columns.id')}</th>
                  <th scope="col">{t('admin.columns.object')}</th>
                  <th scope="col">{t('admin.columns.type')}</th>
                  <th scope="col">{t('admin.columns.reporter')}</th>
                  <th scope="col">{t('admin.columns.date')}</th>
                  <th scope="col">{t('admin.columns.guarantee')}</th>
                  <th scope="col">{t('admin.columns.status')}</th>
                  <th scope="col">
                    <span className="sr-only">
                      {t('admin.columns.actions')}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => {
                  const loan = state.loans.find(
                    (item) => item.id === incident.loanId,
                  );
                  return (
                    <tr key={incident.id}>
                      <td data-label={t('admin.columns.id')}>
                        <strong>{incident.id}</strong>
                      </td>
                      <td data-label={t('admin.columns.object')}>
                        {listingById(state, loan?.listingId)?.title}
                      </td>
                      <td data-label={t('admin.columns.type')}>
                        {t(`incidentTypes.${incident.type}`)}
                      </td>
                      <td data-label={t('admin.columns.reporter')}>
                        {userById(state, incident.reportedBy)?.name}
                      </td>
                      <td data-label={t('admin.columns.date')}>
                        {formatDateTime(incident.createdAt)}
                      </td>
                      <td data-label={t('admin.columns.guarantee')}>
                        {formatMoney(incident.guaranteeAmount)}
                      </td>
                      <td data-label={t('admin.columns.status')}>
                        <StatusBadge kind="incident" status={incident.status} />
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          render={
                            <Link to={`/admin/incidents/${incident.id}`} />
                          }
                        >
                          {t('admin.review')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title={t('admin.emptyTitle')}
          description={t('admin.emptyDescription')}
          action={t('explore.clear')}
          onAction={clear}
        />
      )}
    </>
  );
}

export function AdminIncidentDetailPage() {
  const { t, formatDateTime, formatMoney } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    state,
    dataLoading,
    incidentDetailError,
    retryIncidentDetail,
    resolveIncident,
    startIncidentReview,
    addIncidentNote,
  } = useLendUp();
  const [saving, setSaving] = useState(false);
  const incident = state.incidents.find((item) => item.id === id);
  const loan = state.loans.find((item) => item.id === incident?.loanId);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<ActionResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const available =
    loan && incident
      ? remainingGuarantee(state.incidents, loan, incident.id)
      : 0;
  const schema = useMemo(
    () =>
      z
        .object({
          decision: z.enum(['NO_IMPACT', 'PARTIAL', 'TOTAL']),
          amount: z.number({ error: t('validation.number') }),
          justification: z
            .string()
            .trim()
            .min(20, t('validation.min', { count: 20 })),
        })
        .superRefine((value, context) => {
          if (
            value.decision === 'PARTIAL' &&
            (value.amount <= 0 || value.amount >= available)
          )
            context.addIssue({
              code: 'custom',
              path: ['amount'],
              message: t('results.incident.invalidAmountDetail', {
                max: formatMoney(available),
              }),
            });
        }),
    [t, available, formatMoney],
  );
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { decision: 'NO_IMPACT', amount: 0, justification: '' },
  });
  const decision = watch('decision') as IncidentDecision;
  const amountValue = watch('amount');
  if (dataLoading) return <LoadingSkeleton />;
  if (incidentDetailError)
    return <ErrorState onRetry={() => void retryIncidentDetail()} />;
  if (!incident || !loan)
    return (
      <NotFound
        title={t('incidents.notFound')}
        description={t('errors.notFound.description')}
      />
    );
  const listing = listingById(state, loan.listingId);
  const lender = userById(state, loan.lenderId);
  const borrower = userById(state, loan.borrowerId);
  const captured =
    decision === 'TOTAL'
      ? available
      : decision === 'PARTIAL'
        ? Math.max(0, Number(amountValue) || 0)
        : 0;

  const resolve = async () => {
    if (saving) return;
    setSaving(true);
    const values = getValues();
    const outcome = await resolveIncident(
      incident.id,
      values.decision,
      captured,
      values.justification,
    );
    setResult(outcome);
    setSaving(false);
    setConfirmOpen(false);
    if (outcome.ok) navigate('/admin/incidents');
  };

  return (
    <>
      <Link className="back-link" to="/admin/incidents">
        <ArrowLeft aria-hidden="true" />
        {t('admin.back')}
      </Link>
      <PageHeader
        eyebrow={`${t('admin.eyebrow')} · ${incident.id}`}
        title={listing?.title ?? ''}
        description={`${t(`incidentTypes.${incident.type}`)} · ${formatDateTime(incident.createdAt)}`}
        action={
          <div className="header-actions">
            <StatusBadge kind="incident" status={incident.status} />
            {incident.status === 'OPEN' && (
              <Button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  setResult(await startIncidentReview(incident.id));
                  setSaving(false);
                }}
              >
                {t('admin.startReview')}
              </Button>
            )}
          </div>
        }
      />
      <Feedback result={result} />
      <div className="detail-grid three">
        <section className="panel">
          <p className="eyebrow">{t('roles.LENDER')}</p>
          <UserChip user={lender} link detail={lender?.email} />
        </section>
        <section className="panel">
          <p className="eyebrow">{t('roles.BORROWER')}</p>
          <UserChip user={borrower} link detail={borrower?.email} />
        </section>
        <FinancialCard
          type="guarantee"
          amount={loan.snapshot.guaranteeAmount}
          status={loan.guaranteeStatus}
          note={t('admin.availableGuarantee', {
            amount: formatMoney(available),
          })}
        />
      </div>
      <section className="panel conditions-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('operations.frozenConditions')}</p>
            <h2>{t('admin.agreement')}</h2>
          </div>
          <FileCheck2 aria-hidden="true" />
        </div>
        <DefinitionList
          items={[
            [t('fields.usage'), loan.snapshot.usage],
            [t('fields.delivery'), loan.snapshot.delivery],
            [t('fields.returnPolicy'), loan.snapshot.returnPolicy],
            [t('fields.exchangePlace'), loan.snapshot.exchangePlace],
            [
              t('admin.agreedPeriod'),
              `${formatDateTime(loan.snapshot.startAt)} – ${formatDateTime(loan.snapshot.originalEndAt)}`,
            ],
            [
              t('loanDetail.currentReturn'),
              formatDateTime(loan.currentReturnAt),
            ],
            [
              t('admin.loanStatus'),
              <StatusBadge key="s" kind="loan" status={loan.status} />,
            ],
          ]}
        />
      </section>
      <div className="two-panel-grid">
        <section className="panel">
          <p className="eyebrow">{t('incidents.reporterStatement')}</p>
          <UserChip
            user={userById(state, incident.reportedBy)}
            detail={formatDateTime(incident.createdAt)}
          />
          <p>{incident.description}</p>
        </section>
        <section className="panel">
          <p className="eyebrow">{t('incidents.counterpartyStatement')}</p>
          <p>{incident.counterpartyStatement ?? t('incidents.noStatement')}</p>
          {incident.counterpartyStatementAt && (
            <small className="muted">
              {formatDateTime(incident.counterpartyStatementAt)}
            </small>
          )}
        </section>
      </div>
      <section className="panel">
        <p className="eyebrow">{t('evidence.title')}</p>
        <div className="evidence-comparison three">
          <EvidenceGallery
            title={t('evidence.initial')}
            items={loan.evidence.filter((item) => item.phase === 'INITIAL')}
          />
          <EvidenceGallery
            title={t('evidence.final')}
            items={loan.evidence.filter((item) => item.phase === 'FINAL')}
          />
          <EvidenceGallery
            title={t('incidents.evidence')}
            items={incident.evidence}
          />
        </div>
      </section>
      <div className="two-panel-grid">
        <section className="panel">
          <p className="eyebrow">{t('admin.loanTimeline')}</p>
          <Timeline items={loan.timeline} />
        </section>
        <section className="panel">
          <p className="eyebrow">{t('admin.notes')}</p>
          {incident.adminNotes.length ? (
            <ul className="history-list">
              {incident.adminNotes.map((item) => (
                <li key={item.id}>
                  <p>{item.text}</p>
                  <small className="muted">
                    {userById(state, item.adminId)?.name} ·{' '}
                    {formatDateTime(item.createdAt)}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('admin.noNotes')}</p>
          )}
          {incident.status === 'UNDER_REVIEW' ? (
            <>
              <Field label={t('admin.newNote')}>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>
              <Button
                type="button"
                variant="outline"
                disabled={saving || !note.trim()}
                onClick={async () => {
                  setSaving(true);
                  const outcome = await addIncidentNote(incident.id, note);
                  setResult(outcome);
                  if (outcome.ok) setNote('');
                  setSaving(false);
                }}
              >
                {t('admin.addNote')}
              </Button>
            </>
          ) : incident.status === 'OPEN' ? (
            <p className="muted small">{t('admin.startToNote')}</p>
          ) : null}
        </section>
      </div>
      {incident.status === 'UNDER_REVIEW' && (
        <form
          className="panel resolution-form"
          onSubmit={handleSubmit(() => setConfirmOpen(true))}
          noValidate
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('admin.resolution')}</p>
              <h2>{t('admin.resolutionTitle')}</h2>
            </div>
            <Scale aria-hidden="true" />
          </div>
          <fieldset className="decision-grid">
            <legend className="sr-only">{t('admin.resolutionTitle')}</legend>
            {(['NO_IMPACT', 'PARTIAL', 'TOTAL'] as const).map((value) => (
              <label
                key={value}
                className={decision === value ? 'selected' : ''}
              >
                <input
                  type="radio"
                  value={value}
                  disabled={value !== 'NO_IMPACT' && available <= 0}
                  {...register('decision')}
                />
                <ShieldCheck aria-hidden="true" />
                <span>
                  <strong>{t(`incidentDecisions.${value}.title`)}</strong>
                  <small>{t(`incidentDecisions.${value}.detail`)}</small>
                </span>
              </label>
            ))}
          </fieldset>
          {decision === 'PARTIAL' && (
            <Field
              label={t('admin.amount', { max: formatMoney(available) })}
              error={errors.amount?.message}
              required
            >
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                max={available}
                {...register('amount', { valueAsNumber: true })}
              />
            </Field>
          )}
          <dl className="economic-summary">
            <div>
              <dt>{t('incidents.capturedAmount')}</dt>
              <dd>{formatMoney(captured)}</dd>
            </div>
            <div className="total">
              <dt>{t('incidents.refundedAmount')}</dt>
              <dd>{formatMoney(Math.max(0, available - captured))}</dd>
            </div>
          </dl>
          <Field
            label={t('admin.justification')}
            error={errors.justification?.message}
            hint={t('admin.justificationHint')}
            required
          >
            <textarea rows={4} {...register('justification')} />
          </Field>
          <div className="form-footer">
            <Button type="submit">{t('admin.resolve')}</Button>
          </div>
        </form>
      )}
      {incident.status === 'RESOLVED' && (
        <ResolutionSummary incident={incident} />
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('admin.confirmTitle')}
        description={t('admin.confirmDescription', {
          decision: t(`incidentDecisions.${decision}.title`),
          captured: formatMoney(captured),
          refunded: formatMoney(Math.max(0, available - captured)),
        })}
        confirmLabel={t('admin.resolve')}
        onConfirm={resolve}
        busy={saving}
      />
    </>
  );
}
