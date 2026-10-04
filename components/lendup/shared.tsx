'use client';

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Star,
  WalletCards,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n, type MessageKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { googleMapsAdapter } from '@/services/adapters/google-maps';
import type { EconomicBreakdown } from '@/lib/business-rules';
import type {
  AppNotification,
  Coordinates,
  Listing,
  Reminder,
  TimelineEvent,
  User,
} from '@/types/domain';

export type StatusKind =
  | 'request'
  | 'reservation'
  | 'loan'
  | 'payment'
  | 'guarantee'
  | 'transaction'
  | 'incident'
  | 'extension'
  | 'reschedule'
  | 'analysis'
  | 'listing'
  | 'verification';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const toneByStatus: Record<string, Tone> = {
  ACTIVE: 'success',
  ACCEPTED: 'success',
  CONFIRMED: 'success',
  ACTIVATED: 'success',
  RELEASED: 'success',
  COMPLETED: 'success',
  RESOLVED: 'success',
  SUCCESS: 'success',
  VERIFIED: 'success',
  HELD: 'info',
  PENDING_RELEASE: 'info',
  PENDING_RECEIPT: 'info',
  RETURN_RECORDED: 'info',
  UNDER_REVIEW: 'info',
  ANALYZING: 'info',
  SENT: 'info',
  SENDING: 'info',
  PROCESSING: 'info',
  PENDING: 'warning',
  PAYMENT_PENDING: 'warning',
  OPEN: 'warning',
  PAUSED: 'warning',
  RETURN_CONFIRMED_PENDING_INCIDENT: 'warning',
  PARTIALLY_CAPTURED: 'warning',
  TIMEOUT: 'warning',
  REJECTED: 'danger',
  CANCELLED: 'danger',
  FAILED: 'danger',
  OVERDUE: 'danger',
  ERROR: 'danger',
  CAPTURED: 'danger',
  REFUNDED: 'neutral',
  NOT_REQUIRED: 'neutral',
  ARCHIVED: 'neutral',
  IDLE: 'neutral',
};

const toneIcon: Record<Tone, LucideIcon> = {
  success: CheckCircle2,
  warning: Clock3,
  danger: XCircle,
  info: Clock3,
  neutral: Circle,
};

export function StatusBadge({
  kind,
  status,
}: {
  kind: StatusKind;
  status: string;
}) {
  const { t } = useI18n();
  const tone = toneByStatus[status] ?? 'neutral';
  const Icon = toneIcon[tone];
  return (
    <span className={cn('status-badge', `tone-${tone}`)}>
      <Icon aria-hidden="true" />
      {t(`status.${kind}.${status}` as MessageKey)}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </header>
  );
}

export function Avatar({
  user,
  size = 'md',
}: {
  user: User;
  size?: 'md' | 'lg';
}) {
  const { t } = useI18n();
  return user.avatar ? (
    <img
      className={cn('avatar', size === 'lg' && 'avatar-lg')}
      src={user.avatar}
      alt={t('common.avatarOf', { name: user.name })}
    />
  ) : (
    <span
      className={cn('avatar', size === 'lg' && 'avatar-lg')}
      aria-hidden="true"
    >
      {user.initials}
    </span>
  );
}

export function UserChip({
  user,
  detail,
  link = false,
}: {
  user?: User;
  detail?: string;
  link?: boolean;
}) {
  const { t } = useI18n();
  if (!user) return null;
  const name = link ? (
    <Link to={`/users/${user.id}`}>{user.name}</Link>
  ) : (
    user.name
  );
  return (
    <div className="user-chip">
      <Avatar user={user} />
      <span>
        <strong>
          {name}
          {user.verified && (
            <BadgeCheck
              className="verified"
              aria-label={t('common.verifiedUser')}
            />
          )}
        </strong>
        {detail && <small>{detail}</small>}
      </span>
    </div>
  );
}

export function Reputation({
  value,
  count,
}: {
  value: number;
  count?: number;
}) {
  const { t, formatNumber } = useI18n();
  const label =
    count === undefined
      ? t('reputation.aria', { value: formatNumber(value) })
      : t('reputation.ariaWithCount', { value: formatNumber(value), count });
  if (count === 0)
    return <span className="reputation empty">{t('reputation.none')}</span>;
  return (
    <span className="reputation" aria-label={label}>
      <Star aria-hidden="true" fill="currentColor" />
      <span aria-hidden="true">{value.toFixed(1)}</span>
      {count !== undefined && <small aria-hidden="true">({count})</small>}
    </span>
  );
}

export function ListingCard({
  listing,
  owner,
  ownerReputation,
  own,
  distanceKm,
}: {
  listing: Listing;
  owner?: User;
  ownerReputation: { average: number; count: number };
  own: boolean;
  distanceKm?: number;
}) {
  const { t, formatMoney, formatNumber } = useI18n();
  return (
    <article className="listing-card">
      <Link
        to={`/objects/${listing.id}`}
        className="listing-image-wrap"
        aria-label={t('listing.card.open', { title: listing.title })}
      >
        <img
          className="listing-image"
          src={listing.image}
          alt=""
          loading="lazy"
        />
        <span className={cn('listing-flag', own && 'own')}>
          {own ? t('listing.card.yours') : t('listing.card.available')}
        </span>
      </Link>
      <div className="listing-body">
        <div className="listing-meta">
          <span>{t(`categories.${listing.category}`)}</span>
          <span>
            <MapPin aria-hidden="true" />
            {listing.campus}
            {distanceKm !== undefined &&
              ` · ${t('listing.card.distance', { km: formatNumber(distanceKm) })}`}
          </span>
        </div>
        <h3>
          <Link to={`/objects/${listing.id}`}>{listing.title}</Link>
        </h3>
        <div className="listing-owner">
          <span>{owner?.name}</span>
          <Reputation
            value={ownerReputation.average}
            count={ownerReputation.count}
          />
        </div>
        <div className="listing-price">
          <strong>{formatMoney(listing.dailyRate)}</strong>
          <span>{t('listing.perDay')}</span>
        </div>
      </div>
    </article>
  );
}

export function FinancialCard({
  type,
  amount,
  status,
  note,
  method,
}: {
  type: 'payment' | 'guarantee';
  amount: number;
  status: string;
  note: string;
  method?: string;
}) {
  const { t, formatMoney } = useI18n();
  const Icon = type === 'payment' ? WalletCards : ShieldCheck;
  return (
    <article className="financial-card">
      <span className="financial-icon" aria-hidden="true">
        <Icon />
      </span>
      <div>
        <p className="eyebrow">
          {type === 'payment'
            ? t('finance.rentalCharge')
            : t('finance.guarantee')}
        </p>
        <p className="financial-amount">{formatMoney(amount)}</p>
        <StatusBadge
          kind={type === 'payment' ? 'payment' : 'guarantee'}
          status={status}
        />
        {method && <p className="muted small">{method}</p>}
        <p className="muted">{note}</p>
      </div>
    </article>
  );
}

export function EconomicSummary({
  breakdown,
  showGuarantee = true,
}: {
  breakdown: EconomicBreakdown;
  showGuarantee?: boolean;
}) {
  const { t, formatMoney } = useI18n();
  const rows: [string, number][] = [
    [t('finance.rentalFee', { days: breakdown.days }), breakdown.fee],
    [t('finance.lendupCommission'), breakdown.commission],
    ...(breakdown.providerFee > 0
      ? ([[t('finance.providerFee'), breakdown.providerFee]] as [
          string,
          number,
        ][])
      : []),
    ...(showGuarantee && breakdown.guarantee > 0
      ? ([[t('finance.guaranteeRefundable'), breakdown.guarantee]] as [
          string,
          number,
        ][])
      : []),
  ];
  return (
    <dl className="economic-summary">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{formatMoney(value)}</dd>
        </div>
      ))}
      <div className="total">
        <dt>{t('finance.total')}</dt>
        <dd>
          {formatMoney(
            showGuarantee ? breakdown.total : breakdown.rentalCharge,
          )}
        </dd>
      </div>
    </dl>
  );
}

export function EmptyState({
  icon: Icon = CalendarClock,
  title,
  description,
  action,
  href,
  onAction,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        <Icon />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && href && <Button render={<Link to={href} />}>{action}</Button>}
      {action && onAction && !href && (
        <Button type="button" variant="outline" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={AlertCircle}
      title={t('common.loadError.title')}
      description={t('common.loadError.description')}
      action={onRetry ? t('common.retry') : undefined}
      onAction={onRetry}
    />
  );
}

export function NotFound({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={t('common.backHome')}
      href="/app"
    />
  );
}

export function LoadingSkeleton({ cards = 3 }: { cards?: number }) {
  const { t } = useI18n();
  return (
    <output className="loading-grid" aria-label={t('common.loading')}>
      {Array.from({ length: cards }, (_, index) => (
        <div className="panel" key={index}>
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </output>
  );
}

export function Feedback({
  result,
}: {
  result?: { ok: boolean; message: MessageKey; detail?: string } | null;
}) {
  const { t } = useI18n();
  if (!result) return null;
  return (
    <p
      className={cn('feedback', result.ok ? 'is-success' : 'is-error')}
      role={result.ok ? 'status' : 'alert'}
    >
      {result.ok ? (
        <CheckCircle2 aria-hidden="true" />
      ) : (
        <AlertCircle aria-hidden="true" />
      )}
      <span>
        {t(result.message)}
        {result.detail ? ` ${result.detail}` : ''}
      </span>
    </p>
  );
}

export function Timeline({ items }: { items: TimelineEvent[] }) {
  const { t, formatDateTime } = useI18n();
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={item.id} className={item.complete ? 'complete' : ''}>
          <span aria-hidden="true">
            {item.complete ? <CheckCircle2 /> : <Circle />}
          </span>
          <div>
            <strong>{t(`timeline.${item.event}`)}</strong>
            <small>
              {item.at ? formatDateTime(item.at) : t('common.pending')}
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function NotificationRow({
  notification,
  href,
  onOpen,
}: {
  notification: AppNotification;
  href?: string;
  onOpen?: () => void;
}) {
  const { t, formatRelative } = useI18n();
  const content = (
    <>
      <span className="row-icon" aria-hidden="true">
        <Bell />
      </span>
      <div>
        <div className="row-title">
          <strong>
            {notification.title ??
              t(`notifications.events.${notification.event}.title`)}
          </strong>
          {!notification.read && (
            <span className="unread-dot">
              <span className="sr-only">{t('notifications.unread')}</span>
            </span>
          )}
        </div>
        <p>
          {notification.message ??
            t(`notifications.events.${notification.event}.message`, {
              ...notification.params,
            })}
        </p>
        <small>{formatRelative(notification.createdAt)}</small>
      </div>
    </>
  );
  return (
    <Link
      to={href ?? notification.href}
      className={cn('notice-row', !notification.read && 'unread')}
      onClick={onOpen}
    >
      {content}
    </Link>
  );
}

export function ReminderRow({
  reminder,
  item,
}: {
  reminder: Reminder;
  item: string;
}) {
  const { t, formatDateTime } = useI18n();
  return (
    <Link to={reminder.href} className="notice-row reminder">
      <span className="row-icon" aria-hidden="true">
        <CalendarClock />
      </span>
      <div>
        <div className="row-title">
          <strong>{t(`reminders.${reminder.kind}.title`)}</strong>
        </div>
        <p>{t(`reminders.${reminder.kind}.message`, { item })}</p>
        <small>{formatDateTime(reminder.dueAt)}</small>
      </div>
    </Link>
  );
}

export function MapPreview({
  place,
  coordinates,
}: {
  place: string;
  coordinates?: Coordinates;
}) {
  const { t } = useI18n();
  return (
    <div className="map-preview">
      {googleMapsAdapter.hasEmbed ? (
        <iframe
          title={t('maps.embedTitle', { place })}
          src={googleMapsAdapter.embedUrl(place, coordinates)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="map-placeholder" aria-hidden="true">
          <MapPin />
        </div>
      )}
      <div className="map-caption">
        <span>
          <MapPin aria-hidden="true" />
          {place}
        </span>
        <a
          href={googleMapsAdapter.searchUrl(place, coordinates)}
          target="_blank"
          rel="noreferrer"
        >
          {t('maps.open')}
          <ExternalLink aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export function DefinitionList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="definition-list">
      {items.map(([term, value]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
