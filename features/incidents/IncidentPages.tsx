'use client';

import { useMemo, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  Camera,
  CheckCircle2,
  FileCheck2,
  Scale,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
  ErrorState,
  EvidenceUploader,
  FinancialCard,
  PageHeader,
  StatusBadge,
  Timeline,
  UserChip,
  money,
  shortDate,
} from '@/components/lendup/shared';
import { evidenceAnalysisService } from '@/services/domain-services';
import { useDemo } from '@/stores/demo-store';
import type { Evidence, IncidentDecision, IncidentType } from '@/types/domain';

const typeLabels: Record<IncidentType, string> = {
  DAMAGE: 'Daño',
  LOSS: 'Pérdida',
  LATE_RETURN: 'Retraso',
  NON_RETURN: 'No devolución',
  OTHER: 'Otro',
};

export function IncidentsPage() {
  const { state, reportIncident } = useDemo();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const loanParam = params.get('loan');
  const [showForm, setShowForm] = useState(Boolean(loanParam));
  const [loanId, setLoanId] = useState(loanParam ?? state.loans[0]?.id ?? '');
  const [type, setType] = useState<IncidentType>('DAMAGE');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const current = state.users.find((user) => user.id === state.currentUserId)!;
  const incidents = state.incidents.filter((incident) => {
    const loan = state.loans.find((item) => item.id === incident.loanId);
    return (
      loan?.borrowerId === state.currentUserId ||
      loan?.lenderId === state.currentUserId ||
      current.role === 'ADMIN'
    );
  });
  return (
    <>
      <PageHeader
        eyebrow="Confianza y seguridad"
        title="Incidencias"
        description="Reporta y sigue situaciones que requieren revisión."
        action={
          <Button type="button" onClick={() => setShowForm((value) => !value)}>
            <ShieldAlert />
            Reportar incidencia
          </Button>
        }
      />
      {showForm && (
        <section className="panel incident-form">
          <h2>Nueva incidencia</h2>
          <div className="field-grid">
            <label className="field">
              <span>Préstamo</span>
              <select
                value={loanId}
                onChange={(event) => setLoanId(event.target.value)}
              >
                {state.loans
                  .filter(
                    (loan) =>
                      loan.borrowerId === state.currentUserId ||
                      loan.lenderId === state.currentUserId,
                  )
                  .map((loan) => (
                    <option value={loan.id} key={loan.id}>
                      {loan.id.toUpperCase()} ·{' '}
                      {
                        state.listings.find(
                          (item) => item.id === loan.listingId,
                        )?.title
                      }
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              <span>Tipo</span>
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as IncidentType)
                }
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field wide">
              <span>Descripción</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe qué ocurrió y cualquier coordinación previa."
              />
            </label>
            <div className="wide">
              <EvidenceUploader
                stage="INCIDENT"
                author={current.name}
                authorId={current.id}
                value={evidence}
                onChange={setEvidence}
                label="Evidencias de la incidencia"
              />
            </div>
          </div>
          <div className="form-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!loanId || description.trim().length < 10}
              onClick={() => {
                const incidentId = reportIncident(
                  loanId,
                  type,
                  description,
                  evidence,
                );
                navigate(`/incidents/${incidentId}`);
              }}
            >
              Registrar incidencia
            </Button>
          </div>
        </section>
      )}
      <div className="incident-list">
        {incidents.map((incident) => {
          const loan = state.loans.find((item) => item.id === incident.loanId);
          const listing = state.listings.find(
            (item) => item.id === loan?.listingId,
          );
          return (
            <Link
              to={`/incidents/${incident.id}`}
              key={incident.id}
              className="incident-card"
            >
              <span className="incident-icon">
                <ShieldAlert />
              </span>
              <div>
                <span className="eyebrow">{incident.id}</span>
                <h2>
                  {typeLabels[incident.type]} · {listing?.title}
                </h2>
                <p>{incident.description}</p>
                <small>{shortDate(incident.createdAt)}</small>
              </div>
              <div>
                <StatusBadge status={incident.status} />
                <ArrowRight />
              </div>
            </Link>
          );
        })}
        {!incidents.length && (
          <EmptyState
            title="No tienes incidencias"
            description="Tus operaciones no registran situaciones pendientes."
          />
        )}
      </div>
    </>
  );
}

export function IncidentDetailPage() {
  const { id } = useParams();
  const { state } = useDemo();
  const incident = state.incidents.find((item) => item.id === id);
  if (!incident)
    return (
      <EmptyState
        title="Incidencia no encontrada"
        description="No pudimos encontrar este registro."
      />
    );
  const loan = state.loans.find((item) => item.id === incident.loanId)!;
  const listing = state.listings.find((item) => item.id === loan.listingId)!;
  return (
    <>
      <PageHeader
        eyebrow={`Incidencia ${incident.id}`}
        title={`${typeLabels[incident.type]} · ${listing.title}`}
        description={`Préstamo ${loan.id.toUpperCase()}`}
        action={<StatusBadge status={incident.status} />}
      />
      {incident.status !== 'RESOLVED' && (
        <div className="warning-box strong">
          <ShieldAlert />
          <p>
            <strong>
              Garantía retenida mientras se revisa esta incidencia.
            </strong>{' '}
            No se liberará hasta que exista una resolución.
          </p>
        </div>
      )}
      <div className="detail-grid">
        <section className="panel">
          <span className="eyebrow">Declaración</span>
          <h2>Información del reportante</h2>
          <p>{incident.description}</p>
          <small>Reportada el {shortDate(incident.createdAt)}</small>
          {incident.counterpartyStatement && (
            <>
              <h3>Respuesta de la contraparte</h3>
              <p>{incident.counterpartyStatement}</p>
            </>
          )}
        </section>
        <FinancialCard
          type="guarantee"
          amount={incident.guaranteeAmount}
          status={loan.guaranteeStatus}
          note={
            incident.status === 'RESOLVED'
              ? 'Estado actualizado según la resolución.'
              : 'Retenida durante la revisión.'
          }
        />
        <section className="panel">
          <span className="eyebrow">Evidencias</span>
          {incident.evidence.length ? (
            incident.evidence.map((item) => (
              <div className="evidence-tile" key={item.id}>
                {item.url && item.type === 'PHOTO' ? (
                  <img src={item.url} alt={item.label} />
                ) : (
                  <Camera />
                )}
                <strong>{item.label}</strong>
              </div>
            ))
          ) : (
            <p className="muted">No se adjuntaron archivos.</p>
          )}
        </section>
        <section className="panel">
          <span className="eyebrow">Respuesta administrativa</span>
          {incident.resolution ? (
            <>
              <h2>
                {incident.resolution.decision === 'NO_IMPACT'
                  ? 'Sin afectación'
                  : incident.resolution.decision === 'PARTIAL'
                    ? 'Afectación parcial'
                    : 'Afectación total'}
              </h2>
              <p>{incident.resolution.justification}</p>
              <strong>{money(incident.resolution.amount)}</strong>
              <small>
                Resuelta el {shortDate(incident.resolution.resolvedAt)}
              </small>
            </>
          ) : (
            <p className="muted">
              El equipo está revisando la información de ambas partes.
            </p>
          )}
        </section>
      </div>
      <section className="panel">
        <Timeline
          items={[
            {
              id: '1',
              label: 'Incidencia registrada',
              date: shortDate(incident.createdAt),
              complete: true,
            },
            {
              id: '2',
              label: 'Revisión de evidencias',
              date: incident.status === 'OPEN' ? 'Pendiente' : 'Completada',
              complete: incident.status !== 'OPEN',
            },
            {
              id: '3',
              label: 'Resolución administrativa',
              date: incident.status === 'RESOLVED' ? 'Completada' : 'Pendiente',
              complete: incident.status === 'RESOLVED',
            },
          ]}
        />
      </section>
    </>
  );
}

export function AdminIncidentsPage() {
  const { state } = useDemo();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [date, setDate] = useState('');
  const [loan, setLoan] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const incidents = useMemo(
    () =>
      state.incidents
        .filter(
          (item) =>
            (!status || item.status === status) &&
            (!type || item.type === type) &&
            (!loan || item.loanId.toLowerCase().includes(loan.toLowerCase())) &&
            (!date || item.createdAt.slice(0, 10) === date),
        )
        .sort((a, b) =>
          order === 'asc'
            ? a.createdAt.localeCompare(b.createdAt)
            : b.createdAt.localeCompare(a.createdAt),
        ),
    [state.incidents, status, type, date, loan, order],
  );
  const clear = () => {
    setStatus('');
    setType('');
    setDate('');
    setLoan('');
    setOrder('desc');
  };
  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Incidencias"
        description="Revisión operativa de evidencias, condiciones y garantías."
      />
      <div className="filter-row">
        <select
          aria-label="Estado"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="OPEN">Abierta</option>
          <option value="UNDER_REVIEW">En revisión</option>
          <option value="RESOLVED">Resuelta</option>
        </select>
        <select
          aria-label="Tipo"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="">Todos los tipos</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          aria-label="Fecha"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <input
          aria-label="Préstamo"
          placeholder="ID de préstamo"
          value={loan}
          onChange={(event) => setLoan(event.target.value)}
        />
        <select
          aria-label="Orden"
          value={order}
          onChange={(event) => setOrder(event.target.value as 'asc' | 'desc')}
        >
          <option value="desc">Más recientes</option>
          <option value="asc">Más antiguas</option>
        </select>
        <Button type="button" variant="outline" onClick={clear}>
          Limpiar filtros
        </Button>
      </div>
      {incidents.length ? (
        <section className="panel table-panel">
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Préstamo</th>
                  <th>Tipo</th>
                  <th>Reportado por</th>
                  <th>Fecha</th>
                  <th>Garantía</th>
                  <th>Estado</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>
                      <strong>{incident.id}</strong>
                    </td>
                    <td>{incident.loanId.toUpperCase()}</td>
                    <td>{typeLabels[incident.type]}</td>
                    <td>
                      {
                        state.users.find(
                          (user) => user.id === incident.reportedBy,
                        )?.name
                      }
                    </td>
                    <td>{shortDate(incident.createdAt)}</td>
                    <td>{money(incident.guaranteeAmount)}</td>
                    <td>
                      <StatusBadge status={incident.status} />
                    </td>
                    <td>
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link to={`/admin/incidents/${incident.id}`} />}
                      >
                        Revisar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          title="No hay incidencias con estos filtros"
          description="Limpia o cambia los filtros para ver otros registros."
          action="Limpiar filtros"
          onAction={clear}
        />
      )}
    </>
  );
}

const resolutionSchema = (max: number) =>
  z
    .object({
      decision: z.enum(['NO_IMPACT', 'PARTIAL', 'TOTAL']),
      amount: z.number().min(0),
      justification: z
        .string()
        .min(15, 'Explica la decisión con al menos 15 caracteres'),
    })
    .superRefine((value, context) => {
      if (
        value.decision === 'PARTIAL' &&
        (value.amount <= 0 || value.amount > max)
      )
        context.addIssue({
          code: 'custom',
          path: ['amount'],
          message: `El monto debe estar entre S/ 0 y ${money(max)}.`,
        });
    });
type ResolutionValues = {
  decision: IncidentDecision;
  amount: number;
  justification: string;
};
export function AdminIncidentDetailPage() {
  const { id } = useParams();
  const { state, resolveIncident, saveAnalysis } = useDemo();
  const navigate = useNavigate();
  const incident = state.incidents.find((item) => item.id === id);
  const schema = resolutionSchema(incident?.guaranteeAmount ?? 0);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResolutionValues>({
    resolver: zodResolver(schema),
    defaultValues: { decision: 'NO_IMPACT', amount: 0, justification: '' },
  });
  const decision = watch('decision');
  if (!incident)
    return (
      <ErrorState
        title="Incidencia no encontrada"
        description="El registro solicitado no existe."
      />
    );
  const loan = state.loans.find((item) => item.id === incident.loanId)!;
  const listing = state.listings.find((item) => item.id === loan.listingId)!;
  const lender = state.users.find((user) => user.id === loan.lenderId);
  const borrower = state.users.find((user) => user.id === loan.borrowerId);
  const analysis = state.analyses.find((item) => item.loanId === loan.id);
  const analyze = async () => {
    saveAnalysis({
      id: `analysis-${loan.id}`,
      loanId: loan.id,
      status: 'ANALYZING',
      updatedAt: new Date().toISOString(),
    });
    saveAnalysis(await evidenceAnalysisService.analyze(loan.id));
  };
  const submit = (values: ResolutionValues) => {
    const amount =
      values.decision === 'TOTAL'
        ? incident.guaranteeAmount
        : values.decision === 'NO_IMPACT'
          ? 0
          : values.amount;
    const result = resolveIncident(
      incident.id,
      values.decision,
      amount,
      values.justification,
    );
    if (result.ok) navigate('/admin/incidents');
  };
  return (
    <>
      <PageHeader
        eyebrow={`Administración · ${incident.id}`}
        title={listing.title}
        description={`Revisión del préstamo ${loan.id.toUpperCase()}`}
        action={<StatusBadge status={incident.status} />}
      />
      <div className="admin-summary">
        <section className="panel">
          <span className="eyebrow">Prestamista</span>
          <UserChip user={lender} detail />
        </section>
        <section className="panel">
          <span className="eyebrow">Prestatario</span>
          <UserChip user={borrower} detail />
        </section>
        <FinancialCard
          type="guarantee"
          amount={loan.snapshot.guaranteeAmount}
          status={loan.guaranteeStatus}
          note="Monto máximo disponible para una posible afectación."
        />
      </div>
      <section className="panel conditions-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Condiciones congeladas</span>
            <h2>Acuerdo confirmado</h2>
          </div>
          <FileCheck2 />
        </div>
        <dl>
          <div>
            <dt>Uso</dt>
            <dd>{loan.snapshot.usage}</dd>
          </div>
          <div>
            <dt>Entrega</dt>
            <dd>{loan.snapshot.delivery}</dd>
          </div>
          <div>
            <dt>Devolución</dt>
            <dd>{loan.snapshot.returnPolicy}</dd>
          </div>
          <div>
            <dt>Lugar</dt>
            <dd>{loan.snapshot.exchangePlace}</dd>
          </div>
          <div>
            <dt>Fechas</dt>
            <dd>
              {shortDate(loan.snapshot.startAt)} —{' '}
              {shortDate(loan.snapshot.originalEndAt)}
            </dd>
          </div>
        </dl>
      </section>
      <div className="two-panel-grid">
        <section className="panel">
          <span className="eyebrow">Declaración del reportante</span>
          <p>{incident.description}</p>
        </section>
        <section className="panel">
          <span className="eyebrow">Declaración de contraparte</span>
          <p>
            {incident.counterpartyStatement ?? 'Sin declaración registrada.'}
          </p>
        </section>
      </div>
      <div className="evidence-comparison">
        <AdminEvidence
          title="Evidencias iniciales"
          items={loan.evidence.filter((item) => item.stage === 'BEFORE')}
        />
        <AdminEvidence
          title="Evidencias finales e incidencia"
          items={[
            ...loan.evidence.filter((item) => item.stage === 'AFTER'),
            ...incident.evidence,
          ]}
        />
      </div>
      <section className="ai-banner">
        <BrainCircuit />
        <div>
          <strong>Análisis automático · {analysis?.status ?? 'IDLE'}</strong>
          <p>
            {analysis?.summary ?? 'Todavía no se ejecutó el análisis simulado.'}
          </p>
          <small>
            El análisis automático es únicamente información de apoyo y no
            determina responsabilidades.
          </small>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={analyze}
          disabled={analysis?.status === 'ANALYZING'}
        >
          {analysis?.status === 'ANALYZING'
            ? 'Analizando…'
            : 'Ejecutar simulación'}
        </Button>
      </section>
      <section className="panel">
        <span className="eyebrow">Timeline del préstamo</span>
        <Timeline items={loan.timeline} />
      </section>
      {incident.status !== 'RESOLVED' ? (
        <form className="panel resolution-form" onSubmit={handleSubmit(submit)}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Resolución administrativa</span>
              <h2>Decisión sobre la garantía</h2>
            </div>
            <Scale />
          </div>
          <div className="decision-grid">
            {(
              [
                {
                  value: 'NO_IMPACT',
                  title: 'Sin afectación',
                  detail: 'Liberar garantía completa',
                },
                {
                  value: 'PARTIAL',
                  title: 'Afectación parcial',
                  detail: 'Capturar un monto y liberar el saldo',
                },
                {
                  value: 'TOTAL',
                  title: 'Afectación total',
                  detail: 'Capturar toda la garantía',
                },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={decision === option.value ? 'selected' : ''}
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register('decision')}
                />
                <ShieldCheck />
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.detail}</small>
                </span>
              </label>
            ))}
          </div>
          {decision === 'PARTIAL' && (
            <label className="field">
              <span>
                Monto de afectación (máximo {money(incident.guaranteeAmount)})
              </span>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && (
                <small className="field-error">{errors.amount.message}</small>
              )}
            </label>
          )}
          <label className="field">
            <span>Justificación</span>
            <textarea
              {...register('justification')}
              placeholder="Explica la decisión usando evidencias y condiciones."
            />
            {errors.justification && (
              <small className="field-error">
                {errors.justification.message}
              </small>
            )}
          </label>
          <div className="form-footer">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/incidents')}
            >
              Volver
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Resolver incidencia
            </Button>
          </div>
        </form>
      ) : (
        <section className="panel">
          <CheckCircle2 />
          <h2>Incidencia resuelta</h2>
          <p>{incident.resolution?.justification}</p>
        </section>
      )}
    </>
  );
}

function AdminEvidence({ title, items }: { title: string; items: Evidence[] }) {
  return (
    <section className="panel">
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
        <p className="muted">No se registraron evidencias.</p>
      )}
    </section>
  );
}
