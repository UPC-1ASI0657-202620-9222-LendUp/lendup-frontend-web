'use client';

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  Bell,
  BellOff,
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
  ShieldCheck,
  Star,
  UsersRound,
  type LucideIcon,
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
  Avatar,
  DefinitionList,
  EmptyState,
  Feedback,
  NotFound,
  NotificationRow,
  PageHeader,
  ReminderRow,
  Reputation,
  StatusBadge,
  UserChip,
} from '@/components/lendup/shared';
import { Field } from '@/components/lendup/forms';
import { usePaymentMethodLabel } from '@/hooks/use-payment-method-label';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { loanNextAction, transactionRoute } from '@/lib/business-rules';
import {
  addDays,
  addMonths,
  dayFromKey,
  startOfMonth,
  startOfWeek,
  today,
  zonedDayKey,
} from '@/lib/dates';
import { findUniversity } from '@/services/catalog.service';
import { useLendUp, type ActionResult } from '@/hooks/use-lendup';
import {
  currentUserOf,
  listingById,
  loansOf,
  reputationOf,
  userById,
} from '@/stores/selectors';
import type { PaymentTransaction, TransactionType, User } from '@/types/domain';

function Metric({
  icon: Icon,
  label,
  value,
  tone,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: string;
  href: string;
}) {
  return (
    <Link to={href} className="metric-card">
      <span className={`metric-icon ${tone}`} aria-hidden="true">
        <Icon />
      </span>
      <span>
        <strong>{value}</strong>
        <span>{label}</span>
      </span>
    </Link>
  );
}

function AdminDashboard({ user }: { user: User }) {
  const { t } = useI18n();
  const { state } = useLendUp();
  const count = (status: string) =>
    state.incidents.filter((item) => item.status === status).length;
  return (
    <>
      <PageHeader
        eyebrow={t('dashboard.adminEyebrow')}
        title={t('dashboard.greeting', { name: user.firstName })}
        description={t('dashboard.adminDescription')}
        action={
          <Button render={<Link to="/admin/incidents" />}>
            {t('dashboard.openInbox')} <ArrowRight aria-hidden="true" />
          </Button>
        }
      />
      <section className="metric-grid">
        <Metric
          icon={ShieldAlert}
          label={t('status.incident.OPEN')}
          value={count('OPEN')}
          tone="amber"
          href="/admin/incidents"
        />
        <Metric
          icon={Clock3}
          label={t('status.incident.UNDER_REVIEW')}
          value={count('UNDER_REVIEW')}
          tone="blue"
          href="/admin/incidents"
        />
        <Metric
          icon={CheckCircle2}
          label={t('status.incident.RESOLVED')}
          value={count('RESOLVED')}
          tone="teal"
          href="/admin/incidents"
        />
      </section>
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('dashboard.activity')}</p>
            <h2>{t('dashboard.recentNotifications')}</h2>
          </div>
          <Link to="/notifications">{t('dashboard.viewAll')}</Link>
        </div>
        <NotificationList userId={user.id} limit={5} />
      </section>
    </>
  );
}

function NotificationList({
  userId,
  limit,
}: {
  userId: string;
  limit?: number;
}) {
  const { t } = useI18n();
  const { state, markNotification } = useLendUp();
  const items = state.notifications
    .filter((item) => item.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  if (!items.length) return <p className="muted">{t('notifications.empty')}</p>;
  return (
    <ul className="notice-list">
      {items.map((item) => (
        <li key={item.id}>
          <NotificationRow
            notification={item}
            onOpen={() => markNotification(item.id)}
          />
        </li>
      ))}
    </ul>
  );
}

export function DashboardPage() {
  const { t } = useI18n();
  const { state } = useLendUp();
  const user = currentUserOf(state);
  if (!user) return null;
  if (user.role === 'ADMIN') return <AdminDashboard user={user} />;
  const loans = loansOf(state, user.id);
  const reminders = state.reminders
    .filter((item) => item.userId === user.id)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const actionable = loans.find((loan) => {
    const next = loanNextAction(loan, user.id);
    return next !== 'NONE' && !next.startsWith('WAIT');
  });
  const pendingReceived = state.requests.filter(
    (item) => item.lenderId === user.id && item.status === 'PENDING',
  ).length;
  const unpaid = state.reservations.find(
    (item) =>
      item.borrowerId === user.id &&
      item.status === 'CONFIRMED' &&
      ['PENDING', 'FAILED', 'CANCELLED'].includes(item.paymentStatus),
  );
  const next = actionable
    ? {
        title: t(
          `loans.next.${loanNextAction(actionable, user.id)}` as MessageKey,
        ),
        item: listingById(state, actionable.listingId)?.title ?? '',
        href: `/loans/${actionable.id}`,
      }
    : unpaid
      ? {
          title: t('dashboard.nextPay'),
          item: listingById(state, unpaid.listingId)?.title ?? '',
          href: `/reservations/${unpaid.id}/checkout`,
        }
      : pendingReceived
        ? {
            title: t('dashboard.nextRequests', { count: pendingReceived }),
            item: '',
            href: '/requests?tab=received',
          }
        : null;

  return (
    <>
      <PageHeader
        eyebrow={t('dashboard.eyebrow')}
        title={t('dashboard.greeting', { name: user.firstName })}
        description={t('dashboard.description')}
        action={
          <Button render={<Link to="/explore" />}>
            {t('dashboard.explore')} <ArrowRight aria-hidden="true" />
          </Button>
        }
      />
      {next ? (
        <section className="next-action">
          <span className="next-action-icon" aria-hidden="true">
            <CalendarClock />
          </span>
          <div>
            <p className="eyebrow">{t('dashboard.nextAction')}</p>
            <h2>{next.title}</h2>
            {next.item && <p>{next.item}</p>}
          </div>
          <Button variant="secondary" render={<Link to={next.href} />}>
            {t('dashboard.reviewNow')}
          </Button>
        </section>
      ) : (
        <section className="next-action calm">
          <span className="next-action-icon" aria-hidden="true">
            <CheckCircle2 />
          </span>
          <div>
            <p className="eyebrow">{t('dashboard.nextAction')}</p>
            <h2>{t('dashboard.allClear')}</h2>
          </div>
        </section>
      )}
      <section className="metric-grid" aria-label={t('dashboard.summary')}>
        <Metric
          icon={UsersRound}
          label={t('dashboard.metrics.activeLoans')}
          value={
            loans.filter((item) =>
              [
                'ACTIVE',
                'OVERDUE',
                'PENDING_RECEIPT',
                'RETURN_RECORDED',
              ].includes(item.status),
            ).length
          }
          tone="blue"
          href="/loans"
        />
        <Metric
          icon={Clock3}
          label={t('dashboard.metrics.pendingRequests')}
          value={pendingReceived}
          tone="amber"
          href="/requests?tab=received"
        />
        <Metric
          icon={CalendarDays}
          label={t('dashboard.metrics.reservations')}
          value={
            state.reservations.filter(
              (item) =>
                (item.borrowerId === user.id || item.lenderId === user.id) &&
                item.status === 'CONFIRMED',
            ).length
          }
          tone="teal"
          href="/reservations"
        />
        <Metric
          icon={Package}
          label={t('dashboard.metrics.listings')}
          value={
            state.listings.filter(
              (item) => item.ownerId === user.id && item.status === 'ACTIVE',
            ).length
          }
          tone="violet"
          href="/my-items"
        />
        <Metric
          icon={ShieldAlert}
          label={t('dashboard.metrics.incidents')}
          value={
            state.incidents.filter(
              (incident) =>
                incident.status !== 'RESOLVED' &&
                loans.some((loan) => loan.id === incident.loanId),
            ).length
          }
          tone="rose"
          href="/incidents"
        />
      </section>
      <div className="two-panel-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('dashboard.agenda')}</p>
              <h2>{t('dashboard.upcomingReminders')}</h2>
            </div>
            <Link to="/calendar">{t('dashboard.viewCalendar')}</Link>
          </div>
          {reminders.length ? (
            <ul className="notice-list">
              {reminders.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <ReminderRow
                    reminder={item}
                    item={listingById(state, item.listingId)?.title ?? ''}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t('reminders.empty')}</p>
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('dashboard.activity')}</p>
              <h2>{t('dashboard.recentNotifications')}</h2>
            </div>
            <Link to="/notifications">{t('dashboard.viewAll')}</Link>
          </div>
          <NotificationList userId={user.id} limit={4} />
        </section>
      </div>
    </>
  );
}

export function NotificationsPage() {
  const { t } = useI18n();
  const { state, markNotification } = useLendUp();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const notifications = state.notifications
    .filter(
      (item) =>
        item.userId === state.currentUserId && (!onlyUnread || !item.read),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = state.notifications.filter(
    (item) => item.userId === state.currentUserId && !item.read,
  ).length;
  const reminders = state.reminders
    .filter((item) => item.userId === state.currentUserId)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  return (
    <>
      <PageHeader
        eyebrow={t('notifications.eyebrow')}
        title={t('notifications.title')}
        description={t('notifications.description')}
        action={
          <Button
            type="button"
            variant="outline"
            disabled={!unread}
            onClick={() => markNotification()}
          >
            {t('notifications.markAll')}
          </Button>
        }
      />
      <div className="two-panel-grid wide-left">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('notifications.happened')}</p>
              <h2>{t('notifications.listTitle')}</h2>
            </div>
            <label className="switch-row">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(event) => setOnlyUnread(event.target.checked)}
              />
              {t('notifications.onlyUnread', { count: unread })}
            </label>
          </div>
          {notifications.length ? (
            <ul className="notice-list">
              {notifications.map((item) => (
                <li key={item.id}>
                  <NotificationRow
                    notification={item}
                    onOpen={() => markNotification(item.id)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={BellOff}
              title={t('notifications.emptyTitle')}
              description={t('notifications.emptyDescription')}
            />
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('reminders.eyebrow')}</p>
              <h2>{t('reminders.title')}</h2>
            </div>
            <CalendarClock aria-hidden="true" />
          </div>
          {reminders.length ? (
            <ul className="notice-list">
              {reminders.map((item) => (
                <li key={item.id}>
                  <ReminderRow
                    reminder={item}
                    item={listingById(state, item.listingId)?.title ?? ''}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Bell}
              title={t('reminders.emptyTitle')}
              description={t('reminders.empty')}
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
  kind: 'delivery' | 'return' | 'reminder';
  label: MessageKey;
  item: string;
  href: string;
};

export function CalendarPage() {
  const {
    t,
    formatMonthYear,
    formatWeekday,
    formatTime,
    formatLongDate,
    formatDayNumber,
  } = useI18n();
  const { state } = useLendUp();
  const [cursor, setCursor] = useState(today);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selected, setSelected] = useState(() => zonedDayKey(new Date()));
  const userId = state.currentUserId;
  const events = useMemo<CalendarEvent[]>(() => {
    const title = (listingId: string) =>
      listingById(state, listingId)?.title ?? '';
    const fromReservations = state.reservations
      .filter(
        (item) =>
          (item.borrowerId === userId || item.lenderId === userId) &&
          item.status === 'CONFIRMED',
      )
      .flatMap((item) => [
        {
          id: `${item.id}-delivery`,
          date: new Date(item.snapshot.startAt),
          kind: 'delivery' as const,
          label: 'calendar.events.delivery' as MessageKey,
          item: title(item.listingId),
          href: `/reservations/${item.id}`,
        },
        {
          id: `${item.id}-return`,
          date: new Date(item.snapshot.endAt),
          kind: 'return' as const,
          label: 'calendar.events.return' as MessageKey,
          item: title(item.listingId),
          href: `/reservations/${item.id}`,
        },
      ]);
    const fromLoans = state.loans
      .filter(
        (item) =>
          (item.borrowerId === userId || item.lenderId === userId) &&
          item.status !== 'COMPLETED',
      )
      .map((item) => ({
        id: `${item.id}-return`,
        date: new Date(item.currentReturnAt),
        kind: 'return' as const,
        label: 'calendar.events.return' as MessageKey,
        item: title(item.listingId),
        href: `/loans/${item.id}`,
      }));
    const fromReminders = state.reminders
      .filter(
        (item) =>
          item.userId === userId &&
          ['PAYMENT_DUE', 'RECEIPT'].includes(item.kind),
      )
      .map((item) => ({
        id: item.id,
        date: new Date(item.dueAt),
        kind: 'reminder' as const,
        label: `reminders.${item.kind}.title` as MessageKey,
        item: title(item.listingId),
        href: item.href,
      }));
    return [...fromReservations, ...fromLoans, ...fromReminders].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }, [state, userId]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const key = zonedDayKey(event.date);
      map.set(key, [...(map.get(key) ?? []), event]);
    });
    return map;
  }, [events]);
  const gridStart = startOfWeek(
    view === 'month' ? startOfMonth(cursor) : cursor,
  );
  const days =
    view === 'day'
      ? [cursor]
      : Array.from({ length: view === 'month' ? 42 : 7 }, (_, index) =>
          addDays(gridStart, index),
        );
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    formatWeekday(addDays(startOfWeek(cursor), index)),
  );
  const shift = (direction: number) => {
    const next =
      view === 'month'
        ? addMonths(cursor, direction)
        : addDays(cursor, direction * (view === 'week' ? 7 : 1));
    setCursor(next);
    setSelected(zonedDayKey(next));
  };
  const todayKey = zonedDayKey(new Date());
  const selectedEvents = byDay.get(selected) ?? [];

  return (
    <>
      <PageHeader
        eyebrow={t('calendar.eyebrow')}
        title={t('calendar.title')}
        description={t('calendar.description')}
        action={
          <div className="calendar-actions">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t('calendar.previous')}
              onClick={() => shift(-1)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCursor(today());
                setSelected(todayKey);
              }}
            >
              {t('calendar.today')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t('calendar.next')}
              onClick={() => shift(1)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        }
      />
      {events.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title={t('calendar.emptyTitle')}
          description={t('calendar.emptyDescription')}
          action={t('nav.explore')}
          href="/explore"
        />
      )}
      <section className="panel calendar-panel">
        <div className="calendar-toolbar">
          <fieldset className="segmented">
            <legend className="sr-only">{t('calendar.view')}</legend>
            {(['month', 'week', 'day'] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={view === value}
                onClick={() => setView(value)}
              >
                {t(`calendar.views.${value}`)}
              </button>
            ))}
          </fieldset>
          <h2 className="calendar-title">{formatMonthYear(cursor)}</h2>
          <ul className="calendar-legend">
            <li className="delivery">{t('calendar.legend.delivery')}</li>
            <li className="return">{t('calendar.legend.return')}</li>
            <li className="reminder">{t('calendar.legend.reminder')}</li>
          </ul>
        </div>
        <div className={`calendar-grid view-${view}`}>
          {view !== 'day' &&
            weekdays.map((weekday) => (
              <div
                key={weekday}
                className="calendar-weekday"
                aria-hidden="true"
              >
                {weekday}
              </div>
            ))}
          {days.map((date) => {
            const key = zonedDayKey(date);
            const dayEvents = byDay.get(key) ?? [];
            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelected(key)}
                aria-pressed={selected === key}
                aria-label={`${formatLongDate(date)}: ${t('calendar.eventsCount', { count: dayEvents.length })}`}
                className={`calendar-day ${key === todayKey ? 'today' : ''} ${view === 'month' && date.getUTCMonth() !== cursor.getUTCMonth() ? 'outside' : ''}`}
              >
                <span className="day-number">
                  {view === 'day'
                    ? formatLongDate(date)
                    : formatDayNumber(date)}
                </span>
                <span className="day-events" aria-hidden="true">
                  {dayEvents.slice(0, view === 'month' ? 2 : 6).map((event) => (
                    <span key={event.id} className={`cal-event ${event.kind}`}>
                      {formatTime(event.date)} {event.item}
                    </span>
                  ))}
                  {view === 'month' && dayEvents.length > 2 && (
                    <span className="cal-more">+{dayEvents.length - 2}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      <section className="panel">
        <p className="eyebrow">{t('calendar.selectedDay')}</p>
        <h2>{formatLongDate(dayFromKey(selected))}</h2>
        {selectedEvents.length ? (
          <ul className="event-list">
            {selectedEvents.map((event) => (
              <li key={event.id}>
                <Link to={event.href} className={`event-row ${event.kind}`}>
                  <span className="event-time">{formatTime(event.date)}</span>
                  <span>
                    <strong>{t(event.label)}</strong>
                    <small>{event.item}</small>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">{t('calendar.noEventsDay')}</p>
        )}
      </section>
    </>
  );
}

const transactionTypes: TransactionType[] = [
  'RENTAL_PAYMENT',
  'RENTAL_RELEASE',
  'GUARANTEE_HOLD',
  'GUARANTEE_RELEASE',
  'GUARANTEE_PARTIAL_CAPTURE',
  'GUARANTEE_CAPTURE',
  'REFUND',
  'EXTENSION_PAYMENT',
];

const incomingTypes: TransactionType[] = [
  'RENTAL_RELEASE',
  'GUARANTEE_RELEASE',
  'REFUND',
];

export function TransactionsPage() {
  const { t, formatMoney, formatDateTime } = useI18n();
  const { state } = useLendUp();
  const [type, setType] = useState<TransactionType | ''>('');
  const [detail, setDetail] = useState<PaymentTransaction | null>(null);
  const methodLabel = usePaymentMethodLabel();
  const mine = state.transactions
    .filter((item) => item.userId === state.currentUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rows = mine.filter((item) => !type || item.type === type);
  const settled = (item: PaymentTransaction) =>
    !['FAILED', 'CANCELLED'].includes(item.status);
  const paid = mine
    .filter(
      (item) =>
        ['RENTAL_PAYMENT', 'EXTENSION_PAYMENT'].includes(item.type) &&
        settled(item),
    )
    .reduce((sum, item) => sum + item.amount, 0);
  const received = mine
    .filter((item) => item.type === 'RENTAL_RELEASE')
    .reduce((sum, item) => sum + item.amount, 0);
  const held = mine
    .filter((item) => item.type === 'GUARANTEE_HOLD' && item.status === 'HELD')
    .reduce((sum, item) => sum + item.amount, 0);
  const itemTitle = (row: PaymentTransaction) => {
    const reservation = state.reservations.find(
      (item) => item.id === row.reservationId,
    );
    return listingById(state, reservation?.listingId)?.title ?? '—';
  };

  const download = () => {
    const header = [
      'date',
      'type',
      'item',
      'amount',
      'method',
      'status',
      'reference',
      'reservation',
      'loan',
      'incident',
    ].map((key) => t(`transactions.csv.${key}` as MessageKey));
    const escape = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;
    const csv = [
      header,
      ...rows.map((row) => [
        row.createdAt,
        t(`transactionTypes.${row.type}`),
        itemTitle(row),
        row.amount.toFixed(2),
        methodLabel(row.method),
        t(`status.transaction.${row.status}`),
        row.providerReference,
        row.reservationId ?? '',
        row.loanId ?? '',
        row.incidentId ?? '',
      ]),
    ]
      .map((line) => line.map(escape).join(','))
      .join('\n');
    const url = URL.createObjectURL(
      new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'lendup-transacciones.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        eyebrow={t('transactions.eyebrow')}
        title={t('transactions.title')}
        description={t('transactions.description')}
        action={
          <Button
            type="button"
            variant="outline"
            onClick={download}
            disabled={!rows.length}
          >
            <Download aria-hidden="true" />
            {t('transactions.export')}
          </Button>
        }
      />
      <section className="metric-grid three">
        <div className="metric-card static">
          <span className="metric-icon blue" aria-hidden="true">
            <CircleDollarSign />
          </span>
          <span>
            <strong>{formatMoney(paid)}</strong>
            <span>{t('transactions.totals.paid')}</span>
          </span>
        </div>
        <div className="metric-card static">
          <span className="metric-icon teal" aria-hidden="true">
            <ArrowRight />
          </span>
          <span>
            <strong>{formatMoney(received)}</strong>
            <span>{t('transactions.totals.received')}</span>
          </span>
        </div>
        <div className="metric-card static">
          <span className="metric-icon violet" aria-hidden="true">
            <ShieldCheck />
          </span>
          <span>
            <strong>{formatMoney(held)}</strong>
            <span>{t('transactions.totals.held')}</span>
          </span>
        </div>
      </section>
      <div className="filter-panel open compact">
        <Field label={t('transactions.filterType')}>
          <select
            value={type}
            onChange={(event) =>
              setType(event.target.value as TransactionType | '')
            }
          >
            <option value="">{t('transactions.allTypes')}</option>
            {transactionTypes.map((value) => (
              <option key={value} value={value}>
                {t(`transactionTypes.${value}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {rows.length ? (
        <section className="panel table-panel">
          <div className="responsive-table">
            <table>
              <caption className="sr-only">{t('transactions.title')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('transactions.columns.date')}</th>
                  <th scope="col">{t('transactions.columns.type')}</th>
                  <th scope="col">{t('transactions.columns.item')}</th>
                  <th scope="col" className="numeric">
                    {t('transactions.columns.amount')}
                  </th>
                  <th scope="col">{t('transactions.columns.status')}</th>
                  <th scope="col">
                    <span className="sr-only">
                      {t('transactions.columns.actions')}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td data-label={t('transactions.columns.date')}>
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td data-label={t('transactions.columns.type')}>
                      {t(`transactionTypes.${row.type}`)}
                    </td>
                    <td data-label={t('transactions.columns.item')}>
                      {itemTitle(row)}
                    </td>
                    <td
                      data-label={t('transactions.columns.amount')}
                      className={`numeric ${incomingTypes.includes(row.type) ? 'incoming' : ''}`}
                    >
                      <strong>
                        {incomingTypes.includes(row.type) ? '+' : ''}
                        {formatMoney(row.amount)}
                      </strong>
                    </td>
                    <td data-label={t('transactions.columns.status')}>
                      <StatusBadge kind="transaction" status={row.status} />
                    </td>
                    <td>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetail(row)}
                      >
                        {t('common.viewDetail')}
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
          icon={CircleDollarSign}
          title={t('transactions.emptyTitle')}
          description={t('transactions.emptyDescription')}
        />
      )}
      <Dialog
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setDetail(null)}
      >
        <DialogContent className="app-dialog" closeLabel={t('common.close')}>
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t(`transactionTypes.${detail.type}`)}
                </DialogTitle>
                <DialogDescription>{itemTitle(detail)}</DialogDescription>
              </DialogHeader>
              <div className="dialog-body">
                <DefinitionList
                  items={[
                    [
                      t('transactions.columns.amount'),
                      formatMoney(detail.amount),
                    ],
                    [
                      t('transactions.columns.status'),
                      <StatusBadge
                        key="s"
                        kind="transaction"
                        status={detail.status}
                      />,
                    ],
                    [
                      t('transactions.columns.date'),
                      formatDateTime(detail.createdAt),
                    ],
                    [
                      t('transactions.columns.method'),
                      methodLabel(detail.method),
                    ],
                    [
                      t('transactions.columns.reference'),
                      <code key="r">{detail.providerReference}</code>,
                    ],
                  ]}
                />
                <div className="related-links">
                  {detail.reservationId && (
                    <Link to={`/reservations/${detail.reservationId}`}>
                      {t('transactions.related.reservation')}
                    </Link>
                  )}
                  {detail.loanId && (
                    <Link to={`/loans/${detail.loanId}`}>
                      {t('transactions.related.loan')}
                    </Link>
                  )}
                  {detail.incidentId && (
                    <Link to={`/incidents/${detail.incidentId}`}>
                      {t('transactions.related.incident', {
                        id: detail.incidentId,
                      })}
                    </Link>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button render={<Link to={transactionRoute(detail)} />}>
                  {t('transactions.openOperation')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProfileContent({ user, own }: { user: User; own: boolean }) {
  const { t, formatDate } = useI18n();
  const { state } = useLendUp();
  const reputation = reputationOf(state, user.id);
  const university = findUniversity(user.universityId);
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reputation.ratings.filter((rating) => rating.stars === stars).length,
  }));
  return (
    <div className="profile-grid">
      <section className="panel profile-card">
        <Avatar user={user} size="lg" />
        <h2>{user.name}</h2>
        {user.role === 'STUDENT' && (
          <p className="muted">
            {user.career} · {t('profile.cycle', { cycle: user.cycle })}
          </p>
        )}
        <ul className="profile-badges">
          {university && (
            <li>
              <CheckCircle2 aria-hidden="true" />
              {university.shortName} · {user.campus}
            </li>
          )}
        </ul>
        {own && (
          <DefinitionList
            items={[
              [t('fields.institutionalEmail'), user.email],
              [t('fields.phone'), user.phone || '—'],
            ]}
          />
        )}
        {own && <p className="muted small">{t('profile.privacyNote')}</p>}
      </section>
      <section className="panel reputation-card">
        <p className="eyebrow">{t('profile.reputation')}</p>
        <div className="rating-large">
          <Star aria-hidden="true" fill="currentColor" />
          <strong>
            {reputation.count ? reputation.average.toFixed(1) : '—'}
          </strong>
          <span>/ 5</span>
        </div>
        <p className="muted">
          {t('profile.ratingsSummary', {
            count: reputation.count,
            loans: reputation.completedLoans,
          })}
        </p>
        <ul className="rating-bars" aria-label={t('profile.distribution')}>
          {distribution.map(({ stars, count }) => (
            <li key={stars}>
              <span>{stars}★</span>
              <span className="bar">
                <span
                  style={{
                    width: `${reputation.count ? (count / reputation.count) * 100 : 0}%`,
                  }}
                />
              </span>
              <span>{count}</span>
            </li>
          ))}
        </ul>
        <p className="muted small">{t('profile.ratingsOrigin')}</p>
      </section>
      <section className="panel reviews-card">
        <p className="eyebrow">{t('profile.comments')}</p>
        <h2>{t('profile.commentsTitle')}</h2>
        {reputation.ratings.length ? (
          <ul className="review-list">
            {[...reputation.ratings]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((rating) => (
                <li key={rating.id}>
                  <blockquote>
                    <p>
                      {rating.comment
                        ? `“${rating.comment}”`
                        : t('profile.noComment')}
                    </p>
                    <footer>
                      <UserChip
                        user={userById(state, rating.authorId)}
                        link
                        detail={formatDate(rating.createdAt)}
                      />
                      <Reputation value={rating.stars} />
                    </footer>
                  </blockquote>
                </li>
              ))}
          </ul>
        ) : (
          <p className="muted">{t('profile.noReviews')}</p>
        )}
      </section>
    </div>
  );
}

function ProfileEditDialog({
  user,
  open,
  onOpenChange,
  onSaved,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (result: ActionResult) => void;
}) {
  const { t } = useI18n();
  const { updateProfile } = useLendUp();
  const university = findUniversity(user.universityId);
  const avatar = user.avatar ?? '';
  const schema = useMemo(
    () =>
      z.object({
        career: z
          .string()
          .trim()
          .min(3, t('validation.min', { count: 3 })),
        cycle: z
          .string()
          .trim()
          .regex(/^(1[0-4]|[1-9])$/, t('validation.cycle')),
        campus: z.string().min(1, t('validation.select')),
        phone: z
          .string()
          .trim()
          .regex(/^\+?\d[\d\s]{8,14}$/, t('validation.phone')),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      career: user.career,
      cycle: user.cycle,
      campus: user.campus,
      phone: user.phone,
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-dialog" closeLabel={t('common.close')}>
        <DialogHeader>
          <DialogTitle>{t('profile.editTitle')}</DialogTitle>
          <DialogDescription>{t('profile.editDescription')}</DialogDescription>
        </DialogHeader>
        <form
          id="profile-form"
          className="dialog-body"
          noValidate
          onSubmit={handleSubmit(async (values) => {
            onSaved(await updateProfile(values));
            onOpenChange(false);
          })}
        >
          <div className="avatar-editor">
            {avatar ? (
              <img
                className="avatar avatar-lg"
                src={avatar}
                alt={t('profile.avatarPreview')}
              />
            ) : (
              <span className="avatar avatar-lg" aria-hidden="true">
                {user.initials}
              </span>
            )}
            <div className="field">
              <span className="field-label">{t('profile.avatar')}</span>
              <p className="muted small">
                {t('uploads.errors.NOT_CONFIGURED')}
              </p>
            </div>
          </div>
          <Field
            label={t('fields.career')}
            error={errors.career?.message}
            required
          >
            <input {...register('career')} />
          </Field>
          <Field
            label={t('fields.cycle')}
            error={errors.cycle?.message}
            required
          >
            <input inputMode="numeric" {...register('cycle')} />
          </Field>
          <Field
            label={t('fields.campus')}
            error={errors.campus?.message}
            required
          >
            <select {...register('campus')}>
              {university?.campuses.map((campus) => (
                <option key={campus.id} value={campus.name}>
                  {campus.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={t('fields.phone')}
            error={errors.phone?.message}
            hint={t('profile.phoneHint')}
            required
          >
            <input type="tel" {...register('phone')} />
          </Field>
          <p className="muted small">{t('profile.readonlyNote')}</p>
        </form>
        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="profile-form">
            {t('common.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProfilePage() {
  const { t } = useI18n();
  const { state } = useLendUp();
  const user = currentUserOf(state);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  if (!user) return null;
  return (
    <>
      <PageHeader
        eyebrow={t('profile.eyebrow')}
        title={t('profile.title')}
        description={t('profile.description')}
        action={
          user.role === 'STUDENT' && (
            <div className="button-row">
              <Button type="button" onClick={() => setOpen(true)}>
                {t('profile.edit')}
              </Button>
            </div>
          )
        }
      />
      <Feedback result={result} />
      <ProfileContent user={user} own />
      {user.role === 'STUDENT' && (
        <p className="muted small">
          <Link to={`/users/${user.id}`}>{t('profile.viewPublic')}</Link> ·{' '}
          <Link to="/terms">{t('profile.terms')}</Link>
        </p>
      )}
      {open && (
        <ProfileEditDialog
          user={user}
          open={open}
          onOpenChange={setOpen}
          onSaved={setResult}
        />
      )}
    </>
  );
}

export function PublicProfilePage() {
  const { t } = useI18n();
  const { id } = useParams();
  const { state } = useLendUp();
  const user = userById(state, id);
  if (!user || user.role === 'ADMIN')
    return (
      <NotFound
        title={t('profile.notFound')}
        description={t('errors.notFound.description')}
      />
    );
  return (
    <>
      <PageHeader
        eyebrow={t('profile.publicEyebrow')}
        title={user.name}
        description={t('profile.publicDescription')}
      />
      <ProfileContent user={user} own={false} />
    </>
  );
}
