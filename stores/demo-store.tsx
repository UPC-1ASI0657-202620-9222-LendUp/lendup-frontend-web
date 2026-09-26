'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createSeed } from '@/mocks/seed';
import type { DemoState, Incident, Listing, TermsSnapshot } from '@/types/domain';

const STORAGE_KEY = 'lendup-demo-v1';
type IncidentDecision = 'NONE' | 'PARTIAL' | 'TOTAL';

interface DemoActions {
  switchUser: (id: string) => void;
  login: (email: string) => void;
  logout: () => void;
  acceptTerms: () => void;
  resetDemo: () => void;
  toggleListing: (id: string) => void;
  archiveListing: (id: string) => void;
  addListing: (listing: Omit<Listing, 'id' | 'ownerId' | 'status'>) => string;
  createRequest: (listingId: string, startAt: string, endAt: string) => string;
  respondRequest: (id: string, accepted: boolean) => void;
  cancelReservation: (id: string) => { ok: boolean; message: string };
  payReservation: (id: string) => void;
  holdGuarantee: (id: string) => void;
  recordDelivery: (id: string) => void;
  confirmReceipt: (loanId: string) => void;
  requestExtension: (loanId: string, endAt: string) => void;
  respondExtension: (loanId: string, accepted: boolean) => void;
  recordReturn: (loanId: string, early: boolean, notes: string) => void;
  confirmReturn: (loanId: string) => void;
  reportIncident: (loanId: string, type: Incident['type'], description: string) => string;
  resolveIncident: (id: string, decision: IncidentDecision, amount: number, justification: string) => void;
  rateLoan: (loanId: string, rating: number) => void;
  markNotification: (id?: string) => void;
}

interface DemoContextValue extends DemoActions { state: DemoState; }
const DemoContext = createContext<DemoContextValue | null>(null);

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(createSeed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setState(JSON.parse(stored) as DemoState);
    } catch { localStorage.removeItem(STORAGE_KEY); }
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state, hydrated]);

  const switchUser = useCallback((id: string) => setState((s) => ({ ...s, currentUserId: id, authenticated: true })), []);
  const login = useCallback((email: string) => setState((s) => ({ ...s, currentUserId: email.includes('admin') ? 'admin' : email.includes('carlos') ? 'carlos' : 'alexandra', authenticated: true })), []);
  const logout = useCallback(() => setState((s) => ({ ...s, authenticated: false })), []);
  const acceptTerms = useCallback(() => setState((s) => ({ ...s, termsAccepted: true })), []);
  const resetDemo = useCallback(() => { const fresh = createSeed(); setState(fresh); localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)); }, []);
  const toggleListing = useCallback((id: string) => setState((s) => ({ ...s, listings: s.listings.map((l) => l.id === id ? { ...l, status: l.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : l) })), []);
  const archiveListing = useCallback((id: string) => setState((s) => ({ ...s, listings: s.listings.map((l) => l.id === id ? { ...l, status: 'ARCHIVED' } : l) })), []);
  const addListing = useCallback((listing: Omit<Listing, 'id' | 'ownerId' | 'status'>) => { const id = uid('listing'); setState((s) => ({ ...s, listings: [{ ...listing, id, ownerId: s.currentUserId, status: 'ACTIVE' }, ...s.listings] })); return id; }, []);

  const createRequest = useCallback((listingId: string, startAt: string, endAt: string) => {
    const id = uid('request');
    setState((s) => {
      const listing = s.listings.find((l) => l.id === listingId);
      if (!listing) return s;
      const snap: TermsSnapshot = { dailyRate: listing.dailyRate, guaranteeAmount: listing.guaranteeAmount, startAt, endAt, originalEndAt: endAt, exchangePlace: listing.exchangePlace, ...listing.terms };
      return { ...s, requests: [{ id, listingId, borrowerId: s.currentUserId, lenderId: listing.ownerId, startAt, endAt, createdAt: new Date().toISOString(), status: 'PENDING', snapshot: snap }, ...s.requests], notifications: [{ id: uid('notification'), userId: listing.ownerId, title: 'Nueva solicitud', message: `Recibiste una solicitud por ${listing.title}.`, createdAt: 'Ahora', read: false, href: '/requests' }, ...s.notifications] };
    });
    return id;
  }, []);

  const respondRequest = useCallback((id: string, accepted: boolean) => setState((s) => {
    const request = s.requests.find((r) => r.id === id);
    if (!request || request.status !== 'PENDING') return s;
    const status = accepted ? 'ACCEPTED' : 'REJECTED';
    const reservations = accepted ? [{ id: uid('reservation'), requestId: id, listingId: request.listingId, borrowerId: request.borrowerId, lenderId: request.lenderId, status: 'CONFIRMED' as const, paymentStatus: 'PENDING' as const, guaranteeStatus: 'PENDING' as const, deliveryRecorded: false, snapshot: request.snapshot }, ...s.reservations] : s.reservations;
    return { ...s, requests: s.requests.map((r) => r.id === id ? { ...r, status } : r), reservations, notifications: [{ id: uid('notification'), userId: request.borrowerId, title: accepted ? 'Solicitud aceptada' : 'Solicitud rechazada', message: accepted ? 'Tu reserva fue confirmada. Ya puedes completar el pago.' : 'El prestamista no pudo aceptar las fechas solicitadas.', createdAt: 'Ahora', read: false, href: accepted ? '/reservations' : '/requests' }, ...s.notifications] };
  }), []);

  const cancelReservation = useCallback((id: string) => {
    let result = { ok: false, message: 'Este préstamo ya está activo y no puede cancelarse.' };
    setState((s) => {
      const reservation = s.reservations.find((r) => r.id === id);
      const loan = s.loans.find((l) => l.reservationId === id);
      if (!reservation || loan?.status === 'ACTIVE' || reservation.status === 'ACTIVATED') return s;
      result = { ok: true, message: 'La reserva fue cancelada.' };
      return { ...s, reservations: s.reservations.map((r) => r.id === id ? { ...r, status: 'CANCELLED' } : r) };
    });
    return result;
  }, []);

  const payReservation = useCallback((id: string) => setState((s) => ({ ...s, reservations: s.reservations.map((r) => r.id === id ? { ...r, paymentStatus: 'PENDING_RELEASE' } : r), transactions: [{ id: uid('tx'), userId: s.currentUserId, loanId: id, date: 'Hoy', type: 'Tarifa', amount: s.reservations.find((r) => r.id === id)?.snapshot.dailyRate ?? 0, method: 'Yape ••• 728', status: 'Pendiente de liberación' }, ...s.transactions] })), []);
  const holdGuarantee = useCallback((id: string) => setState((s) => ({ ...s, reservations: s.reservations.map((r) => r.id === id ? { ...r, guaranteeStatus: 'HELD' } : r) })), []);

  const recordDelivery = useCallback((id: string) => setState((s) => {
    const reservation = s.reservations.find((r) => r.id === id);
    if (!reservation || reservation.paymentStatus === 'PENDING') return s;
    const existing = s.loans.find((l) => l.reservationId === id);
    const loans = existing ? s.loans.map((l) => l.id === existing.id ? { ...l, status: 'PENDING_RECEIPT' as const } : l) : [{ id: uid('loan'), reservationId: id, listingId: reservation.listingId, borrowerId: reservation.borrowerId, lenderId: reservation.lenderId, status: 'PENDING_RECEIPT' as const, paymentStatus: reservation.paymentStatus, guaranteeStatus: reservation.guaranteeStatus, snapshot: reservation.snapshot, evidence: [{ id: uid('evidence'), stage: 'BEFORE' as const, type: 'PHOTO' as const, label: 'Estado inicial registrado por el prestamista', author: s.users.find((u) => u.id === reservation.lenderId)?.name ?? '', date: 'Ahora' }], timeline: [{ id: uid('timeline'), label: 'Entrega registrada', date: 'Ahora', complete: true }, { id: uid('timeline'), label: 'Confirmación de recepción', date: 'Pendiente', complete: false }], ratedBy: [] }, ...s.loans];
    return { ...s, reservations: s.reservations.map((r) => r.id === id ? { ...r, deliveryRecorded: true } : r), loans, notifications: [{ id: uid('notification'), userId: reservation.borrowerId, title: 'Entrega registrada', message: 'Revisa las evidencias y confirma que recibiste el objeto.', createdAt: 'Ahora', read: false, href: `/loans/${existing?.id ?? loans[0].id}` }, ...s.notifications] };
  }), []);

  const confirmReceipt = useCallback((loanId: string) => setState((s) => {
    const loan = s.loans.find((l) => l.id === loanId);
    if (!loan || loan.status !== 'PENDING_RECEIPT') return s;
    return { ...s, loans: s.loans.map((l) => l.id === loanId ? { ...l, status: 'ACTIVE', paymentStatus: 'RELEASED', timeline: [...l.timeline.map((t) => ({ ...t, complete: true })), { id: uid('timeline'), label: 'Préstamo activo · tarifa liberada', date: 'Ahora', complete: true }] } : l), reservations: s.reservations.map((r) => r.id === loan.reservationId ? { ...r, status: 'ACTIVATED', paymentStatus: 'RELEASED' } : r), notifications: [{ id: uid('notification'), userId: loan.lenderId, title: 'Recepción confirmada', message: 'El préstamo está activo y la tarifa fue liberada.', createdAt: 'Ahora', read: false, href: `/loans/${loanId}` }, ...s.notifications] };
  }), []);

  const requestExtension = useCallback((loanId: string, endAt: string) => setState((s) => ({ ...s, loans: s.loans.map((l) => l.id === loanId && l.status === 'ACTIVE' ? { ...l, extensionStatus: 'PENDING', extensionEndAt: endAt } : l) })), []);
  const respondExtension = useCallback((loanId: string, accepted: boolean) => setState((s) => ({ ...s, loans: s.loans.map((l) => l.id === loanId ? { ...l, extensionStatus: accepted ? 'ACCEPTED' : 'REJECTED', snapshot: accepted && l.extensionEndAt ? { ...l.snapshot, endAt: l.extensionEndAt } : l.snapshot } : l) })), []);
  const recordReturn = useCallback((loanId: string, early: boolean, notes: string) => setState((s) => ({ ...s, loans: s.loans.map((l) => l.id === loanId && ['ACTIVE', 'OVERDUE'].includes(l.status) ? { ...l, status: 'RETURN_RECORDED', earlyReturn: early, actualReturnAt: new Date().toISOString(), evidence: [...l.evidence, { id: uid('evidence'), stage: 'AFTER', type: 'PHOTO', label: notes || 'Evidencias finales registradas', author: s.users.find((u) => u.id === s.currentUserId)?.name ?? '', date: 'Ahora' }], timeline: [...l.timeline, { id: uid('timeline'), label: early ? 'Devolución anticipada registrada' : 'Devolución registrada', date: 'Ahora', complete: true }, { id: uid('timeline'), label: 'Confirmación del prestamista', date: 'Pendiente', complete: false }] } : l) })), []);
  const confirmReturn = useCallback((loanId: string) => setState((s) => ({ ...s, loans: s.loans.map((l) => l.id === loanId && l.status === 'RETURN_RECORDED' ? { ...l, status: 'COMPLETED', guaranteeStatus: 'RELEASED', timeline: [...l.timeline.map((t) => ({ ...t, complete: true })), { id: uid('timeline'), label: 'Préstamo finalizado · garantía liberada', date: 'Ahora', complete: true }] } : l), reservations: s.reservations.map((r) => s.loans.find((l) => l.id === loanId)?.reservationId === r.id ? { ...r, status: 'COMPLETED', guaranteeStatus: 'RELEASED' } : r) })), []);

  const reportIncident = useCallback((loanId: string, type: Incident['type'], description: string) => { const id = `INC-${Math.floor(1000 + Math.random() * 8999)}`; setState((s) => { const loan = s.loans.find((l) => l.id === loanId); if (!loan) return s; return { ...s, incidents: [{ id, loanId, type, description, reportedBy: s.currentUserId, status: 'OPEN', createdAt: new Date().toISOString(), guaranteeAmount: loan.snapshot.guaranteeAmount }, ...s.incidents], loans: s.loans.map((l) => l.id === loanId ? { ...l, guaranteeStatus: 'HELD' } : l) }; }); return id; }, []);
  const resolveIncident = useCallback((id: string, decision: IncidentDecision, amount: number, justification: string) => setState((s) => { const incident = s.incidents.find((i) => i.id === id); if (!incident) return s; const guaranteeStatus = decision === 'NONE' ? 'RELEASED' : decision === 'PARTIAL' ? 'PARTIAL' : 'TOTAL'; return { ...s, incidents: s.incidents.map((i) => i.id === id ? { ...i, status: 'RESOLVED', resolution: { decision, amount, justification } } : i), loans: s.loans.map((l) => l.id === incident.loanId ? { ...l, guaranteeStatus } : l) }; }), []);
  const rateLoan = useCallback((loanId: string, rating: number) => setState((s) => { const loan = s.loans.find((l) => l.id === loanId); if (!loan || loan.ratedBy.includes(s.currentUserId)) return s; const targetId = loan.borrowerId === s.currentUserId ? loan.lenderId : loan.borrowerId; return { ...s, loans: s.loans.map((l) => l.id === loanId ? { ...l, ratedBy: [...l.ratedBy, s.currentUserId] } : l), users: s.users.map((u) => u.id === targetId ? { ...u, rating: Number(((u.rating + rating) / 2).toFixed(1)) } : u) }; }), []);
  const markNotification = useCallback((id?: string) => setState((s) => ({ ...s, notifications: s.notifications.map((n) => !id || n.id === id ? { ...n, read: true } : n) })), []);

  const value = useMemo<DemoContextValue>(() => ({ state, switchUser, login, logout, acceptTerms, resetDemo, toggleListing, archiveListing, addListing, createRequest, respondRequest, cancelReservation, payReservation, holdGuarantee, recordDelivery, confirmReceipt, requestExtension, respondExtension, recordReturn, confirmReturn, reportIncident, resolveIncident, rateLoan, markNotification }), [state, switchUser, login, logout, acceptTerms, resetDemo, toggleListing, archiveListing, addListing, createRequest, respondRequest, cancelReservation, payReservation, holdGuarantee, recordDelivery, confirmReceipt, requestExtension, respondExtension, recordReturn, confirmReturn, reportIncident, resolveIncident, rateLoan, markNotification]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() { const value = useContext(DemoContext); if (!value) throw new Error('useDemo debe utilizarse dentro de DemoProvider'); return value; }
