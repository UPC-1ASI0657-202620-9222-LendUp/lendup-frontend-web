'use client';

import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  FileText,
  ImagePlus,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  Video,
  WalletCards,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Evidence, Listing, User } from '@/types/domain';

export const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
  CONFIRMED: 'Confirmada',
  ACTIVATED: 'Activada',
  COMPLETED: 'Finalizado',
  PENDING_DELIVERY: 'Pendiente de entrega',
  PENDING_RECEIPT: 'Pendiente de recepción',
  ACTIVE: 'Activo',
  RETURN_RECORDED: 'Devolución registrada',
  OVERDUE: 'Vencido',
  PROCESSING: 'Procesando',
  PAYMENT_PENDING: 'Pago pendiente',
  PENDING_RELEASE: 'Pendiente de liberación',
  RELEASED: 'Liberado',
  REFUNDED: 'Reembolsado',
  FAILED: 'Fallido',
  NOT_REQUIRED: 'No requerida',
  HELD: 'Retenida',
  PARTIALLY_CAPTURED: 'Afectada parcialmente',
  CAPTURED: 'Afectada totalmente',
  OPEN: 'Abierta',
  UNDER_REVIEW: 'En revisión',
  RESOLVED: 'Resuelta',
  PAUSED: 'Pausado',
  ARCHIVED: 'Archivado',
  IDLE: 'Sin iniciar',
  ANALYZING: 'Analizando',
  SUCCESS: 'Disponible',
  TIMEOUT: 'Tiempo agotado',
  ERROR: 'Error',
};
const variants: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  ACTIVE: 'default',
  ACCEPTED: 'default',
  CONFIRMED: 'default',
  RELEASED: 'default',
  COMPLETED: 'default',
  RESOLVED: 'default',
  SUCCESS: 'default',
  REJECTED: 'destructive',
  CANCELLED: 'destructive',
  FAILED: 'destructive',
  OVERDUE: 'destructive',
  ERROR: 'destructive',
  PENDING: 'secondary',
  PAYMENT_PENDING: 'secondary',
  PENDING_RELEASE: 'secondary',
  HELD: 'secondary',
  UNDER_REVIEW: 'secondary',
  ANALYZING: 'secondary',
};

export function StatusBadge({ status }: { status: string }) {
  const Icon = [
    'ACTIVE',
    'ACCEPTED',
    'CONFIRMED',
    'RELEASED',
    'COMPLETED',
    'RESOLVED',
    'SUCCESS',
  ].includes(status)
    ? CheckCircle2
    : ['REJECTED', 'CANCELLED', 'FAILED', 'OVERDUE', 'ERROR'].includes(status)
      ? AlertCircle
      : Clock3;
  return (
    <Badge variant={variants[status] ?? 'outline'} className="status-badge">
      <Icon aria-hidden="true" />
      {statusLabels[status] ?? status}
    </Badge>
  );
}

export const money = (value: number) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
export const shortDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('es-PE', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(parsed);
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function UserChip({
  user,
  detail = false,
}: {
  user?: User;
  detail?: boolean;
}) {
  if (!user) return null;
  return (
    <div className="user-chip">
      {user.avatar ? (
        <img
          className="avatar"
          src={user.avatar}
          alt={`Avatar de ${user.name}`}
        />
      ) : (
        <span className="avatar">{user.initials}</span>
      )}
      <span>
        <strong>{user.name}</strong>
        {detail && (
          <small>
            {user.university} · {user.campus}
          </small>
        )}
      </span>
      {user.verified && (
        <BadgeCheck className="verified" aria-label="Usuario verificado" />
      )}
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
  return (
    <span
      className="reputation"
      aria-label={`${value.toFixed(1)} de 5${count !== undefined ? `, ${count} valoraciones` : ''}`}
    >
      <Star aria-hidden="true" fill="currentColor" />
      {value.toFixed(1)}
      {count !== undefined && <small>({count})</small>}
    </span>
  );
}

export function ListingCard({
  listing,
  owner,
}: {
  listing: Listing;
  owner?: User;
}) {
  return (
    <article className="listing-card">
      <Link
        to={`/objects/${listing.id}`}
        className="listing-image-wrap"
        aria-label={`Ver ${listing.title}`}
      >
        <img
          className="listing-image"
          src={listing.image}
          alt={listing.title}
        />
        <span className="availability-dot">
          <Circle fill="currentColor" />
          Disponible
        </span>
      </Link>
      <div className="listing-body">
        <div className="listing-meta">
          <span>{listing.category}</span>
          <span>{listing.campus}</span>
        </div>
        <Link to={`/objects/${listing.id}`}>
          <h3>{listing.title}</h3>
        </Link>
        <div className="listing-owner">
          <span>{owner?.name ?? listing.university}</span>
          {owner && (
            <Reputation value={owner.rating} count={owner.ratingCount} />
          )}
        </div>
        <div className="listing-price">
          <strong>{money(listing.dailyRate)}</strong>
          <span>/ día</span>
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
}: {
  type: 'payment' | 'guarantee';
  amount: number;
  status: string;
  note: string;
}) {
  const Icon = type === 'payment' ? WalletCards : ShieldCheck;
  return (
    <article className="financial-card">
      <div className="financial-icon">
        <Icon />
      </div>
      <div>
        <p className="eyebrow">{type === 'payment' ? 'Tarifa' : 'Garantía'}</p>
        <h3>{money(amount)}</h3>
        <StatusBadge status={status} />
        <p className="muted">{note}</p>
      </div>
    </article>
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
  icon?: typeof CalendarClock;
  title: string;
  description: string;
  action?: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <Icon />
      <h3>{title}</h3>
      <p>{description}</p>
      {action && href && <Button render={<Link to={href} />}>{action}</Button>}
      {action && onAction && (
        <Button type="button" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'No se pudo cargar la información',
  description = 'Intenta nuevamente en unos segundos.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={onRetry ? 'Reintentar' : undefined}
      onAction={onRetry}
    />
  );
}

export function LoadingSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <output className="loading-grid" aria-label="Cargando información">
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

export function EvidenceUploader({
  stage,
  author,
  authorId,
  value,
  onChange,
  label = 'Fotos, videos y notas',
}: {
  stage: Evidence['stage'];
  author: string;
  authorId: string;
  value: Evidence[];
  onChange: (evidence: Evidence[]) => void;
  label?: string;
}) {
  const inputId = useId();
  const [note, setNote] = useState('');
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const additions: Evidence[] = Array.from(files).map((file) => ({
      id: `evidence-${Date.now()}-${file.name}`,
      stage,
      type: file.type.startsWith('video/') ? 'VIDEO' : 'PHOTO',
      label: file.name,
      author,
      authorId,
      date: new Date().toISOString(),
      url: URL.createObjectURL(file),
    }));
    onChange([...value, ...additions]);
  };
  const addNote = () => {
    if (!note.trim()) return;
    onChange([
      ...value,
      {
        id: `evidence-note-${Date.now()}`,
        stage,
        type: 'NOTE',
        label: note.trim(),
        author,
        authorId,
        date: new Date().toISOString(),
      },
    ]);
    setNote('');
  };
  return (
    <div className="evidence-uploader">
      <label className="upload-zone compact" htmlFor={inputId}>
        <ImagePlus />
        <strong>{label}</strong>
        <span>Selecciona imágenes o videos desde tu dispositivo.</span>
        <span className="button-like">
          <Upload />
          Seleccionar archivos
        </span>
      </label>
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(event) => addFiles(event.target.files)}
      />
      <div className="evidence-note-input">
        <label htmlFor={`${inputId}-note`}>Nota de evidencia</label>
        <textarea
          id={`${inputId}-note`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Describe el estado o funcionamiento."
        />
        <Button
          type="button"
          variant="outline"
          onClick={addNote}
          disabled={!note.trim()}
        >
          <FileText />
          Agregar nota
        </Button>
      </div>
      {value.length > 0 && (
        <div className="evidence-previews">
          {value.map((item) => (
            <article key={item.id}>
              <div>
                {item.type === 'PHOTO' && item.url ? (
                  <img src={item.url} alt={item.label} />
                ) : item.type === 'VIDEO' && item.url ? (
                  <video src={item.url} controls aria-label={item.label}>
                    <track
                      kind="captions"
                      srcLang="es"
                      label="Sin audio descriptivo"
                      src="data:text/vtt,WEBVTT"
                      default
                    />
                  </video>
                ) : item.type === 'VIDEO' ? (
                  <Video />
                ) : (
                  <FileText />
                )}
              </div>
              <span>{item.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Eliminar ${item.label}`}
                onClick={() =>
                  onChange(
                    value.filter((candidate) => candidate.id !== item.id),
                  )
                }
              >
                <Trash2 />
              </Button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function Timeline({
  items,
}: {
  items: { id: string; label: string; date: string; complete: boolean }[];
}) {
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={item.id} className={item.complete ? 'complete' : ''}>
          <span>{item.complete ? <CheckCircle2 /> : <Circle />}</span>
          <div>
            <strong>{item.label}</strong>
            <small>{item.date}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function NotificationRow({
  title,
  message,
  time,
  reminder = false,
  unread = false,
}: {
  title: string;
  message: string;
  time: string;
  reminder?: boolean;
  unread?: boolean;
}) {
  const Icon = reminder ? CalendarClock : Bell;
  return (
    <article
      className={`notification-row ${reminder ? 'reminder' : ''} ${unread ? 'unread' : ''}`}
    >
      <span className="notification-icon">
        <Icon />
      </span>
      <div>
        <div className="row-title">
          <strong>{title}</strong>
          {unread && <span className="unread-dot" aria-label="No leída" />}
        </div>
        <p>{message}</p>
        <small>{time}</small>
      </div>
    </article>
  );
}
