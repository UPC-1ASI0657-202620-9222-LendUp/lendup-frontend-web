'use client';

import { Link } from 'react-router-dom';
import { AlertCircle, BadgeCheck, Bell, CalendarClock, CheckCircle2, Circle, Clock3, ShieldCheck, Star, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Listing, User } from '@/types/domain';

const labels: Record<string, string> = {
  PENDING: 'Pendiente', ACCEPTED: 'Aceptada', REJECTED: 'Rechazada', CANCELLED: 'Cancelada', CONFIRMED: 'Confirmada', ACTIVATED: 'Activada',
  COMPLETED: 'Finalizado', PENDING_DELIVERY: 'Pendiente de entrega', PENDING_RECEIPT: 'Pendiente de recepción', ACTIVE: 'Activo', RETURN_RECORDED: 'Devolución registrada', OVERDUE: 'Vencido',
  PROCESSING: 'Procesando', PENDING_RELEASE: 'Pendiente de liberación', RELEASED: 'Liberado', REFUNDED: 'Reembolsado', FAILED: 'Fallido', HELD: 'Retenida', PARTIAL: 'Afectada parcialmente', TOTAL: 'Afectada totalmente',
  OPEN: 'Abierta', UNDER_REVIEW: 'En revisión', RESOLVED: 'Resuelta', PAUSED: 'Pausado', ARCHIVED: 'Archivado',
};

const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = { ACTIVE: 'default', ACCEPTED: 'default', CONFIRMED: 'default', RELEASED: 'default', COMPLETED: 'default', REJECTED: 'destructive', CANCELLED: 'destructive', FAILED: 'destructive', OVERDUE: 'destructive', PENDING: 'secondary', PENDING_RELEASE: 'secondary', HELD: 'secondary', UNDER_REVIEW: 'secondary' };

export function StatusBadge({ status }: { status: string }) {
  const Icon = ['ACTIVE', 'ACCEPTED', 'CONFIRMED', 'RELEASED', 'COMPLETED', 'RESOLVED'].includes(status) ? CheckCircle2 : ['REJECTED', 'CANCELLED', 'FAILED', 'OVERDUE'].includes(status) ? AlertCircle : Clock3;
  return <Badge variant={variants[status] ?? 'outline'} className="status-badge"><Icon aria-hidden="true" />{labels[status] ?? status}</Badge>;
}

export const money = (value: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(value);
export const shortDate = (value: string) => new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</header>;
}

export function UserChip({ user, detail = false }: { user?: User; detail?: boolean }) {
  if (!user) return null;
  return <div className="user-chip"><span className="avatar">{user.initials}</span><span><strong>{user.name}</strong>{detail && <small>{user.university} · {user.campus}</small>}</span>{user.verified && <BadgeCheck className="verified" aria-label="Usuario verificado" />}</div>;
}

export function Reputation({ value }: { value: number }) { return <span className="reputation"><Star aria-hidden="true" fill="currentColor" />{value.toFixed(1)}</span>; }

export function ListingCard({ listing, owner }: { listing: Listing; owner?: User }) {
  return <article className="listing-card"><Link to={`/objects/${listing.id}`} className="listing-image-wrap"><img className="listing-image" src={listing.image} alt={listing.title} /><span className="availability-dot"><Circle fill="currentColor" />Disponible</span></Link><div className="listing-body"><div className="listing-meta"><span>{listing.category}</span><span>{listing.campus}</span></div><Link to={`/objects/${listing.id}`}><h3>{listing.title}</h3></Link><div className="listing-owner"><span>{owner?.name ?? listing.university}</span>{owner && <Reputation value={owner.rating} />}</div><div className="listing-price"><strong>{money(listing.dailyRate)}</strong><span>/ día</span></div></div></article>;
}

export function FinancialCard({ type, amount, status, note }: { type: 'payment' | 'guarantee'; amount: number; status: string; note: string }) {
  const Icon = type === 'payment' ? WalletCards : ShieldCheck;
  return <article className="financial-card"><div className="financial-icon"><Icon /></div><div><p className="eyebrow">{type === 'payment' ? 'Tarifa' : 'Garantía'}</p><h3>{money(amount)}</h3><StatusBadge status={status} /><p className="muted">{note}</p></div></article>;
}

export function EmptyState({ icon: Icon = CalendarClock, title, description, action, href }: { icon?: typeof CalendarClock; title: string; description: string; action?: string; href?: string }) {
  return <div className="empty-state"><Icon /><h3>{title}</h3><p>{description}</p>{action && href && <Button render={<Link to={href} />}>{action}</Button>}</div>;
}

export function Timeline({ items }: { items: { id: string; label: string; date: string; complete: boolean }[] }) {
  return <ol className="timeline">{items.map((item) => <li key={item.id} className={item.complete ? 'complete' : ''}><span>{item.complete ? <CheckCircle2 /> : <Circle />}</span><div><strong>{item.label}</strong><small>{item.date}</small></div></li>)}</ol>;
}

export function NotificationRow({ title, message, time, reminder = false, unread = false }: { title: string; message: string; time: string; reminder?: boolean; unread?: boolean }) {
  const Icon = reminder ? CalendarClock : Bell;
  return <article className={`notification-row ${reminder ? 'reminder' : ''} ${unread ? 'unread' : ''}`}><span className="notification-icon"><Icon /></span><div><div className="row-title"><strong>{title}</strong>{unread && <span className="unread-dot" />}</div><p>{message}</p><small>{time}</small></div></article>;
}
