'use client';

import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  Package,
  ShieldAlert,
  Star,
  UsersRound,
} from 'lucide-react';
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
  NotificationRow,
  PageHeader,
  Reputation,
  StatusBadge,
  UserChip,
  money,
  shortDate,
} from '@/components/lendup/shared';
import { useDemo } from '@/stores/demo-store';
import { fileToDataUrl } from '@/lib/file-data';

export function DashboardPage() {
  const { state } = useDemo();
  const user = state.users.find((item) => item.id === state.currentUserId)!;
  const myLoans = state.loans.filter(
    (item) => item.borrowerId === user.id || item.lenderId === user.id,
  );
  const pending = state.requests.filter(
    (item) => item.lenderId === user.id && item.status === 'PENDING',
  ).length;
  const notices = state.notifications
    .filter((item) => item.userId === user.id)
    .slice(0, 3);
  const reminders = state.reminders.filter((item) => item.userId === user.id);
  const next = reminders[0];
  return (
    <>
      <PageHeader
        eyebrow="Panel personal"
        title={`Hola, ${user.firstName}`}
        description="Aquí tienes lo más importante para hoy."
        action={
          <Button render={<Link to="/explore" />}>
            Explorar objetos <ArrowRight />
          </Button>
        }
      />
      {next ? (
        <section className="next-action">
          <div className="next-action-icon">
            <CalendarClock />
          </div>
          <div>
            <p className="eyebrow">Tu próxima acción</p>
            <h2>{next.title}</h2>
            <p>
              Abre la operación para revisar los detalles y completar la acción
              pendiente.
            </p>
          </div>
          <Button variant="secondary" render={<Link to={next.href} />}>
            Revisar ahora
          </Button>
        </section>
      ) : (
        <EmptyState
          title="No tienes acciones pendientes"
          description="Tu agenda está al día."
        />
      )}
      <section className="metric-grid">
        <Metric
          icon={UsersRound}
          label="Préstamos activos"
          value={myLoans.filter((item) => item.status === 'ACTIVE').length}
          tone="blue"
        />
        <Metric
          icon={Clock3}
          label="Solicitudes pendientes"
          value={pending}
          tone="amber"
        />
        <Metric
          icon={CalendarDays}
          label="Reservas próximas"
          value={
            state.reservations.filter(
              (item) =>
                item.borrowerId === user.id || item.lenderId === user.id,
            ).length
          }
          tone="teal"
        />
        <Metric
          icon={Package}
          label="Objetos publicados"
          value={
            state.listings.filter((item) => item.ownerId === user.id).length
          }
          tone="violet"
        />
        <Metric
          icon={ShieldAlert}
          label="Incidencias abiertas"
          value={
            state.incidents.filter(
              (incident) =>
                incident.status !== 'RESOLVED' &&
                state.loans.some(
                  (loan) =>
                    loan.id === incident.loanId &&
                    (loan.borrowerId === user.id || loan.lenderId === user.id),
                ),
            ).length
          }
          tone="rose"
        />
      </section>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Agenda</span>
              <h2>Próximos recordatorios</h2>
            </div>
            <Link to="/calendar">Ver calendario</Link>
          </div>
          {reminders.length ? (
            reminders.slice(0, 4).map((item) => (
              <Link key={item.id} to={item.href}>
                <NotificationRow
                  reminder
                  title={item.title}
                  message="Acción vinculada a una operación real."
                  time={item.dueAt}
                />
              </Link>
            ))
          ) : (
            <p className="muted">No hay recordatorios próximos.</p>
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Actividad</span>
              <h2>Notificaciones recientes</h2>
            </div>
            <Link to="/notifications">Ver todas</Link>
          </div>
          {notices.length ? (
            notices.map((item) => (
              <Link key={item.id} to={item.href}>
                <NotificationRow
                  title={item.title}
                  message={item.message}
                  time={item.createdAt}
                  unread={!item.read}
                />
              </Link>
            ))
          ) : (
            <p className="muted">No hay notificaciones.</p>
          )}
        </section>
      </div>
    </>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <article className="metric-card">
      <span className={`metric-icon ${tone}`}>
        <Icon />
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

export function NotificationsPage() {
  const { state, markNotification } = useDemo();
  const notifications = state.notifications.filter(
    (item) => item.userId === state.currentUserId,
  );
  const reminders = state.reminders.filter(
    (item) => item.userId === state.currentUserId,
  );
  return (
    <>
      <PageHeader
        eyebrow="Actividad"
        title="Notificaciones y recordatorios"
        description="Los eventos ocurridos y las obligaciones próximas se muestran por separado."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => markNotification()}
          >
            Marcar todas como leídas
          </Button>
        }
      />
      <div className="two-panel-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Ya ocurrió</span>
              <h2>Notificaciones</h2>
            </div>
            <Bell />
          </div>
          {notifications.length ? (
            notifications.map((item) => (
              <Link
                to={item.href}
                key={item.id}
                onClick={() => markNotification(item.id)}
              >
                <NotificationRow
                  title={item.title}
                  message={item.message}
                  time={item.createdAt}
                  unread={!item.read}
                />
              </Link>
            ))
          ) : (
            <EmptyState
              title="Estás al día"
              description="No tienes notificaciones nuevas."
            />
          )}
        </section>
        <section className="panel reminders-side">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Próximas obligaciones</span>
              <h2>Recordatorios</h2>
            </div>
            <CalendarClock />
          </div>
          {reminders.length ? (
            reminders.map((item) => (
              <Link to={item.href} key={item.id}>
                <NotificationRow
                  reminder
                  title={item.title}
                  message="Abre la operación para consultar todos los detalles."
                  time={item.dueAt}
                />
              </Link>
            ))
          ) : (
            <EmptyState
              title="Sin recordatorios"
              description="No tienes acciones programadas."
            />
          )}
        </section>
      </div>
    </>
  );
}

type CalendarEvent = {
  id: string;
  date: Date;
  label: string;
  href: string;
  kind: 'delivery' | 'return' | 'reminder' | 'reservation';
};
export function CalendarPage() {
  const { state } = useDemo();
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const userId = state.currentUserId;
  const events = useMemo<CalendarEvent[]>(() => {
    const loans = state.loans
      .filter(
        (item) =>
          (item.borrowerId === userId || item.lenderId === userId) &&
          item.status !== 'COMPLETED',
      )
      .flatMap((item) => [
        {
          id: `${item.id}-start`,
          date: new Date(item.snapshot.startAt),
          label: `Préstamo · ${state.listings.find((listing) => listing.id === item.listingId)?.title}`,
          href: `/loans/${item.id}`,
          kind: 'delivery' as const,
        },
        {
          id: `${item.id}-end`,
          date: new Date(item.currentReturnAt),
          label: `Devolución · ${state.listings.find((listing) => listing.id === item.listingId)?.title}`,
          href: `/loans/${item.id}`,
          kind: 'return' as const,
        },
      ]);
    const reservations = state.reservations
      .filter(
        (item) =>
          (item.borrowerId === userId || item.lenderId === userId) &&
          item.status !== 'CANCELLED',
      )
      .map((item) => ({
        id: item.id,
        date: new Date(item.snapshot.startAt),
        label: `Reserva · ${state.listings.find((listing) => listing.id === item.listingId)?.title}`,
        href: `/reservations/${item.id}`,
        kind: 'reservation' as const,
      }));
    const reminders = state.reminders
      .filter(
        (item) =>
          item.userId === userId &&
          !Number.isNaN(new Date(item.dueAt).getTime()),
      )
      .map((item) => ({
        id: item.id,
        date: new Date(item.dueAt),
        label: item.title,
        href: item.href,
        kind: 'reminder' as const,
      }));
    return [...loans, ...reservations, ...reminders];
  }, [state, userId]);
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (monthStart.getDay() + 6) % 7;
  const days = Array.from({ length: view === 'month' ? 42 : 7 }, (_, index) => {
    const date = new Date(view === 'month' ? monthStart : cursor);
    date.setDate(
      (view === 'month'
        ? 1 - offset
        : cursor.getDate() - ((cursor.getDay() + 6) % 7)) + index,
    );
    return date;
  });
  const shift = (direction: number) => {
    const next = new Date(cursor);
    if (view === 'month') next.setMonth(next.getMonth() + direction);
    else next.setDate(next.getDate() + direction * 7);
    setCursor(next);
  };
  return (
    <>
      <PageHeader
        eyebrow="Tu agenda"
        title="Calendario"
        description="Reservas, entregas, devoluciones y recordatorios derivados de tus operaciones."
        action={
          <div className="calendar-actions">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Periodo anterior"
              onClick={() => shift(-1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCursor(new Date())}
            >
              Hoy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Periodo siguiente"
              onClick={() => shift(1)}
            >
              <ChevronRight />
            </Button>
          </div>
        }
      />
      <section className="panel calendar-panel">
        <div className="calendar-toolbar">
          <div className="segmented">
            <button
              type="button"
              className={view === 'month' ? 'active' : ''}
              onClick={() => setView('month')}
            >
              Mes
            </button>
            <button
              type="button"
              className={view === 'week' ? 'active' : ''}
              onClick={() => setView('week')}
            >
              Semana
            </button>
          </div>
          <strong>
            {new Intl.DateTimeFormat('es-PE', {
              month: 'long',
              year: 'numeric',
            }).format(cursor)}
          </strong>
          <div className="calendar-legend">
            <span className="delivery">Entrega</span>
            <span className="return">Devolución</span>
            <span className="reminder-dot">Recordatorio</span>
          </div>
        </div>
        <div className={`calendar-grid ${view === 'week' ? 'week-view' : ''}`}>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day}>{day}</div>
          ))}
          {days.map((date) => {
            const key = date.toISOString().slice(0, 10);
            return (
              <div
                key={key}
                className={`calendar-day ${key === new Date().toISOString().slice(0, 10) ? 'today' : ''} ${date.getMonth() !== cursor.getMonth() && view === 'month' ? 'outside' : ''}`}
              >
                <span>{date.getDate()}</span>
                {events
                  .filter(
                    (event) => event.date.toISOString().slice(0, 10) === key,
                  )
                  .map((event) => (
                    <Link
                      key={event.id}
                      to={event.href}
                      className={`cal-event ${event.kind}`}
                    >
                      {event.label}
                    </Link>
                  ))}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

const transactionLabels: Record<string, string> = {
  RENTAL_PAYMENT: 'Pago de tarifa',
  RENTAL_RELEASE: 'Liberación de tarifa',
  GUARANTEE_HOLD: 'Retención de garantía',
  GUARANTEE_RELEASE: 'Liberación de garantía',
  GUARANTEE_PARTIAL_CAPTURE: 'Afectación parcial de garantía',
  GUARANTEE_CAPTURE: 'Afectación total de garantía',
  REFUND: 'Reembolso',
  EXTENSION_PAYMENT: 'Pago de extensión',
};
export function TransactionsPage() {
  const { state } = useDemo();
  const rows = state.transactions.filter(
    (item) => item.userId === state.currentUserId,
  );
  const download = () => {
    const csv = [
      'Fecha,Operación,Reserva,Préstamo,Incidencia,Monto,Método,Referencia,Estado',
      ...rows.map((row) =>
        [
          row.createdAt,
          transactionLabels[row.type],
          row.reservationId,
          row.loanId,
          row.incidentId,
          row.amount,
          row.method,
          row.providerReference,
          row.status,
        ].join(','),
      ),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'lendup-transacciones.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageHeader
        eyebrow="Actividad económica"
        title="Transacciones"
        description="Eventos reales del estado demo: pagos, liberaciones, garantías y reembolsos."
      />
      {rows.length ? (
        <section className="panel table-panel">
          <div className="table-tools">
            <div className="transaction-summary">
              <CircleDollarSign />
              <span>
                <strong>{rows.length}</strong>
                <small>movimientos registrados</small>
              </span>
            </div>
            <Button type="button" variant="outline" onClick={download}>
              <Download />
              Descargar resumen
            </Button>
          </div>
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Operación</th>
                  <th>Reserva</th>
                  <th>Préstamo</th>
                  <th>Incidencia</th>
                  <th>Monto</th>
                  <th>Medio</th>
                  <th>Referencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{shortDate(row.createdAt)}</td>
                    <td>{transactionLabels[row.type]}</td>
                    <td>
                      {row.reservationId ? (
                        <Link to={`/reservations/${row.reservationId}`}>
                          {row.reservationId.toUpperCase()}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {row.loanId ? (
                        <Link to={`/loans/${row.loanId}`}>
                          {row.loanId.toUpperCase()}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {row.incidentId ? (
                        <Link to={`/incidents/${row.incidentId}`}>
                          {row.incidentId}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <strong>{money(row.amount)}</strong>
                    </td>
                    <td>{row.method}</td>
                    <td>
                      <code>{row.providerReference}</code>
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          title="No tienes transacciones"
          description="Los pagos, garantías y reembolsos aparecerán cuando realices operaciones."
        />
      )}
    </>
  );
}

export function ProfilePage() {
  const { state, updateProfile, logout } = useDemo();
  const navigate = useNavigate();
  const user = state.users.find((item) => item.id === state.currentUserId)!;
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    avatar: user.avatar ?? '',
    career: user.career,
    cycle: user.cycle,
    campus: user.campus,
    phone: user.phone,
  });
  return (
    <>
      <PageHeader
        eyebrow="Cuenta"
        title="Mi perfil"
        description="Tu identidad universitaria y reputación en LendUp."
      />
      <ProfileContent
        user={user}
        own
        ratings={state.ratings.filter((item) => item.targetUserId === user.id)}
        users={state.users}
      />
      <div className="profile-actions">
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          Editar perfil
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Cerrar sesión
        </Button>
      </div>
      {saved && (
        <output className="success-text">
          Perfil actualizado correctamente.
        </output>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>
              Tu teléfono y correo no se muestran en el perfil público.
            </DialogDescription>
          </DialogHeader>
          <label className="field">
            <span>Avatar</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) {
                  try {
                    const avatar = await fileToDataUrl(file);
                    setForm((current) => ({ ...current, avatar }));
                    setAvatarError('');
                  } catch (error) {
                    setAvatarError(
                      error instanceof Error
                        ? error.message
                        : 'No se pudo leer el avatar.',
                    );
                  }
                }
              }}
            />
            {avatarError && (
              <small className="field-error" role="alert">
                {avatarError}
              </small>
            )}
          </label>
          {form.avatar && (
            <img
              className="profile-avatar-preview"
              src={form.avatar}
              alt="Previsualización del avatar"
            />
          )}
          <label className="field">
            <span>Carrera</span>
            <input
              value={form.career}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  career: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Ciclo</span>
            <input
              value={form.cycle}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cycle: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Campus</span>
            <input
              value={form.campus}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  campus: event.target.value,
                }))
              }
            />
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                updateProfile(form);
                setOpen(false);
                setSaved(true);
              }}
            >
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PublicProfilePage() {
  const { id } = useParams();
  const { state } = useDemo();
  const user = state.users.find((item) => item.id === id);
  if (!user)
    return (
      <EmptyState
        title="Perfil no encontrado"
        description="Este perfil no está disponible."
      />
    );
  return (
    <>
      <PageHeader
        eyebrow="Perfil público"
        title={user.name}
        description="Información verificada y reputación dentro de la comunidad."
      />
      <ProfileContent
        user={user}
        ratings={state.ratings.filter((item) => item.targetUserId === user.id)}
        users={state.users}
      />
    </>
  );
}

function ProfileContent({
  user,
  own = false,
  ratings,
  users,
}: {
  user: ReturnType<typeof useDemo>['state']['users'][number];
  own?: boolean;
  ratings: ReturnType<typeof useDemo>['state']['ratings'];
  users: ReturnType<typeof useDemo>['state']['users'];
}) {
  return (
    <div className="profile-grid">
      <section className="panel profile-card">
        {user.avatar ? (
          <img
            className="profile-avatar"
            src={user.avatar}
            alt={`Avatar de ${user.name}`}
          />
        ) : (
          <span className="profile-avatar">{user.initials}</span>
        )}
        <h2>{user.name}</h2>
        <p>
          {user.career} · {user.cycle}
        </p>
        <div className="profile-badges">
          <span>
            <CheckCircle2 />
            {user.verified ? 'Correo verificado' : 'Verificación pendiente'}
          </span>
          <span>
            <CheckCircle2 />
            {user.university} · {user.campus}
          </span>
        </div>
        {own && (
          <p className="private-note">
            Teléfono: {user.phone}. Este dato no aparece en tu perfil público.
          </p>
        )}
      </section>
      <section className="panel reputation-card">
        <span className="eyebrow">Reputación</span>
        <div className="rating-large">
          <Star fill="currentColor" />
          <strong>{user.rating.toFixed(1)}</strong>
          <span>/ 5</span>
        </div>
        <p>
          {user.ratingCount} valoraciones · {user.completedLoans} préstamos
          completados
        </p>
      </section>
      <section className="panel reviews-card">
        <span className="eyebrow">Comentarios recientes</span>
        <h2>Experiencias de la comunidad</h2>
        {ratings.length ? (
          ratings.map((rating) => {
            const author = users.find((item) => item.id === rating.authorId);
            return (
              <blockquote key={rating.id}>
                “{rating.comment || 'Experiencia calificada sin comentario.'}”
                <footer>
                  <UserChip user={author} />
                  <Reputation value={rating.stars} />
                </footer>
              </blockquote>
            );
          })
        ) : (
          <EmptyState
            title="Sin comentarios todavía"
            description="Los comentarios aparecerán después de préstamos finalizados."
          />
        )}
      </section>
    </div>
  );
}
