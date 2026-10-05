import type { BackendRow, CurrentStudentDto } from '@/services/api/dto/backend';
import {
  fromApiLocalDateTime,
  fromApiUtcDateTime,
} from '../../../lib/dates.ts';
import { categoryCodeForId } from '../../../config/reference-data.ts';
import type {
  Evidence,
  AppNotification,
  Incident,
  Listing,
  Loan,
  LoanRequest,
  PaymentTransaction,
  Rating,
  Reservation,
  TimelineEventCode,
  TermsSnapshot,
  User,
} from '@/types/domain';

const text = (row: BackendRow, key: string) => {
  const value = row[key];
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
};
const number = (row: BackendRow, key: string) => Number(row[key] ?? 0);
const instant = (row: BackendRow, key: string) => {
  const value = text(row, key);
  return value ? fromApiUtcDateTime(value) : new Date(0).toISOString();
};
const optionalInstant = (row: BackendRow, key: string) => {
  const value = text(row, key);
  return value ? fromApiUtcDateTime(value) : undefined;
};
const localInstant = (row: BackendRow, key: string) => {
  const value = text(row, key);
  return value ? fromApiLocalDateTime(value) : new Date(0).toISOString();
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const roleIds = {
  student: '00000000-0000-4000-8000-000000000001',
  admin: '00000000-0000-4000-8000-000000000002',
} as const;

export function mapCurrentStudent(dto: CurrentStudentDto): User {
  const name =
    text(dto.perfil, 'nombre') || text(dto.usuario, 'correo_institucional');
  return {
    id: text(dto.usuario, 'id'),
    name,
    firstName: name.split(/\s+/)[0] ?? name,
    email: text(dto.usuario, 'correo_institucional'),
    phone: text(dto.perfil, 'telefono'),
    initials: initials(name),
    avatar: text(dto.perfil, 'foto_url') || undefined,
    universityId: text(dto.perfil, 'universidad'),
    campus: text(dto.perfil, 'campus'),
    career: text(dto.perfil, 'carrera'),
    cycle: text(dto.perfil, 'ciclo'),
    verified: text(dto.usuario, 'estado_verificacion') === 'VERIFICADO',
    verificationStatus:
      text(dto.usuario, 'estado_verificacion') === 'VERIFICADO'
        ? 'VERIFIED'
        : text(dto.usuario, 'estado_verificacion') === 'PENDIENTE'
          ? 'PENDING'
          : 'UNVERIFIED',
    role: text(dto.usuario, 'rol_id') === roleIds.admin ? 'ADMIN' : 'STUDENT',
    accountStatus: 'ACTIVE',
  };
}

export function mapPublicStudent(row: BackendRow): User {
  const name = text(row, 'nombre') || text(row, 'id');
  return {
    id: text(row, 'id'),
    name,
    firstName: name.split(/\s+/)[0] ?? name,
    email: '',
    phone: '',
    initials: initials(name),
    avatar: text(row, 'foto_url') || undefined,
    universityId: text(row, 'universidad'),
    campus: text(row, 'campus'),
    career: text(row, 'carrera'),
    cycle: text(row, 'ciclo'),
    verified: text(row, 'estado_verificacion') === 'VERIFICADO',
    verificationStatus:
      text(row, 'estado_verificacion') === 'VERIFICADO'
        ? 'VERIFIED'
        : text(row, 'estado_verificacion') === 'PENDIENTE'
          ? 'PENDING'
          : 'UNVERIFIED',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
  };
}

const condition = (value: string): Listing['condition'] => {
  const normalized = value.toUpperCase().replaceAll(' ', '_');
  return ['NEW', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR'].includes(normalized)
    ? (normalized as Listing['condition'])
    : 'GOOD';
};

function availabilitySlots(row: BackendRow): Listing['availabilitySlots'] {
  if (!Array.isArray(row.disponibilidades)) return [];
  return row.disponibilidades.flatMap((value, index) => {
    if (!value || typeof value !== 'object') return [];
    const slot = value as BackendRow;
    const rawStartAt = text(slot, 'desde');
    const rawEndAt = text(slot, 'hasta');
    if (!rawStartAt || !rawEndAt) return [];
    const startAt = fromApiLocalDateTime(rawStartAt);
    const endAt = fromApiLocalDateTime(rawEndAt);
    const reserved = text(slot, 'estado') === 'RESERVADA';
    return [
      {
        id: text(slot, 'id') || `availability-${index}`,
        startAt,
        endAt,
        status: reserved ? ('RESERVED' as const) : ('AVAILABLE' as const),
      },
    ];
  });
}

export function mapListing(row: BackendRow): Listing {
  const images = (
    Array.isArray(row.imagenes) ? row.imagenes : []
  ) as BackendRow[];
  const media = [...images]
    .sort((a, b) => number(a, 'orden') - number(b, 'orden'))
    .filter((image) => text(image, 'url').startsWith('https://'))
    .map((image) => ({
      id: text(image, 'id'),
      type: 'PHOTO' as const,
      url: text(image, 'url'),
      name: text(row, 'titulo'),
    }));
  return {
    id: text(row, 'id'),
    ownerId: text(row, 'propietario_usuario_id'),
    title: text(row, 'titulo'),
    category: categoryCodeForId(text(row, 'categoria_id')),
    description: text(row, 'descripcion'),
    condition: condition(text(row, 'condicion_objeto')),
    universityId: text(row, 'universidad'),
    campus: text(row, 'campus'),
    location: text(row, 'ubicacion'),
    exchangePlace: text(row, 'lugar_intercambio'),
    dailyRate: number(row, 'tarifa_diaria'),
    guaranteeAmount: number(row, 'garantia_monetaria'),
    status:
      text(row, 'estado') === 'PAUSADA'
        ? 'PAUSED'
        : text(row, 'estado') === 'DADA_DE_BAJA'
          ? 'ARCHIVED'
          : 'ACTIVE',
    image: media[0]?.url ?? '/brand/logo-mark-on-light.webp',
    media,
    availabilitySlots: availabilitySlots(row),
    terms: {
      usage: text(row, 'condiciones_uso'),
      delivery: text(row, 'condiciones_entrega'),
      returnPolicy: text(row, 'condiciones_devolucion'),
      cancellation: text(row, 'condiciones_cancelacion'),
    },
    createdAt: instant(row, 'creado_en'),
  };
}

function requestSnapshot(row: BackendRow): TermsSnapshot {
  return {
    dailyRate: number(row, 'tarifa_diaria_aceptada'),
    guaranteeAmount: number(row, 'garantia_monetaria_aceptada'),
    commissionRate: 0,
    providerFeeRate: 0,
    exchangePlace: text(row, 'lugar_intercambio_aceptado'),
    startAt: localInstant(row, 'desde'),
    endAt: localInstant(row, 'hasta'),
    originalEndAt: localInstant(row, 'hasta'),
    usage: text(row, 'condiciones_uso_aceptadas'),
    delivery: text(row, 'condiciones_entrega_aceptadas'),
    returnPolicy: text(row, 'condiciones_devolucion_aceptadas'),
    cancellation: text(row, 'condiciones_cancelacion_aceptadas'),
    cancellationPolicy: { borrowerRefundRate: 0, lenderRefundRate: 0 },
    acceptedAt: instant(row, 'condiciones_aceptadas_en'),
  };
}

export function mapRequest(row: BackendRow): LoanRequest {
  const states: Record<string, LoanRequest['status']> = {
    PENDIENTE: 'PENDING',
    ACEPTADA: 'ACCEPTED',
    RECHAZADA: 'REJECTED',
    CANCELADA: 'CANCELLED',
  };
  return {
    id: text(row, 'id'),
    listingId: text(row, 'publicacion_id'),
    borrowerId: text(row, 'prestatario_usuario_id'),
    lenderId: text(row, 'prestamista_usuario_id'),
    startAt: localInstant(row, 'desde'),
    endAt: localInstant(row, 'hasta'),
    status: states[text(row, 'estado')] ?? 'PENDING',
    createdAt: instant(row, 'creada_en'),
    respondedAt: optionalInstant(row, 'respondida_en'),
    snapshot: requestSnapshot(row),
  };
}

export function mapReservation(
  row: BackendRow,
  request?: LoanRequest,
): Reservation {
  const startAt = localInstant(row, 'desde');
  const endAt = localInstant(row, 'hasta');
  return {
    id: text(row, 'id'),
    requestId: text(row, 'solicitud_id'),
    listingId: request?.listingId ?? '',
    borrowerId: request?.borrowerId ?? '',
    lenderId: request?.lenderId ?? '',
    status: text(row, 'estado') === 'CANCELADA' ? 'CANCELLED' : 'CONFIRMED',
    paymentStatus: 'PENDING',
    guaranteeStatus:
      number(row, 'garantia_monetaria_acordada') > 0
        ? 'PENDING'
        : 'NOT_REQUIRED',
    deliveryRecorded: false,
    cancelledAt: optionalInstant(row, 'cancelada_en'),
    cancelledBy: text(row, 'cancelada_por_usuario_id') || undefined,
    cancellationReason: text(row, 'motivo_cancelacion') || undefined,
    createdAt: instant(row, 'confirmada_en'),
    snapshot: {
      dailyRate: number(row, 'tarifa_diaria_acordada'),
      guaranteeAmount: number(row, 'garantia_monetaria_acordada'),
      commissionRate: 0,
      providerFeeRate: 0,
      exchangePlace: text(row, 'lugar_intercambio_acordado'),
      startAt,
      endAt,
      originalEndAt: endAt,
      usage: text(row, 'condiciones_uso_acordadas'),
      delivery: text(row, 'condiciones_entrega_acordadas'),
      returnPolicy: text(row, 'condiciones_devolucion_acordadas'),
      cancellation: text(row, 'condiciones_cancelacion_acordadas'),
      cancellationPolicy: { borrowerRefundRate: 0, lenderRefundRate: 0 },
      acceptedAt: instant(row, 'confirmada_en'),
    },
  };
}

const childRows = (row: BackendRow, key: string): BackendRow[] =>
  Array.isArray(row[key]) ? (row[key] as BackendRow[]) : [];
export function mapEvidence(row: BackendRow): Evidence {
  const note = text(row, 'observacion');
  return {
    id: text(row, 'id'),
    phase:
      text(row, 'etapa') === 'ENTREGA'
        ? 'INITIAL'
        : text(row, 'etapa') === 'DEVOLUCION'
          ? 'FINAL'
          : 'INCIDENT',
    type:
      text(row, 'tipo') === 'FOTO'
        ? 'PHOTO'
        : text(row, 'tipo') === 'VIDEO'
          ? 'VIDEO'
          : 'NOTE',
    label: note || text(row, 'tipo'),
    description: note,
    url: text(row, 'url') || undefined,
    author: text(row, 'registrada_por_usuario_id'),
    authorId: text(row, 'registrada_por_usuario_id'),
    createdAt: instant(row, 'registrada_en'),
  };
}

export function mapLoan(row: BackendRow, reservation?: Reservation): Loan {
  const statusMap: Record<string, Loan['status']> = {
    RESERVADO: 'AWAITING_DELIVERY',
    ENTREGA_REGISTRADA: 'PENDING_RECEIPT',
    ACTIVO: 'ACTIVE',
    VENCIDO: 'OVERDUE',
    DEVOLUCION_REGISTRADA: 'RETURN_RECORDED',
    FINALIZADO: 'COMPLETED',
    CANCELADO: 'COMPLETED',
  };
  const startAt = localInstant(row, 'entrega_programada_en');
  const originalEndAt = localInstant(row, 'devolucion_original_en');
  return {
    id: text(row, 'id'),
    reservationId: text(row, 'reserva_id'),
    listingId: text(row, 'publicacion_id'),
    borrowerId: text(row, 'prestatario_usuario_id'),
    lenderId: text(row, 'prestamista_usuario_id'),
    status: statusMap[text(row, 'estado')] ?? 'AWAITING_DELIVERY',
    paymentStatus: text(row, 'pago_tarifa_confirmado_en')
      ? 'PENDING_RELEASE'
      : 'PENDING',
    guaranteeStatus: !row.garantia_requerida
      ? 'NOT_REQUIRED'
      : text(row, 'garantia_constituida_en')
        ? 'HELD'
        : 'PENDING',
    snapshot: reservation?.snapshot ?? {
      dailyRate: number(row, 'tarifa_diaria_acordada'),
      guaranteeAmount: 0,
      commissionRate: 0,
      providerFeeRate: 0,
      exchangePlace: '',
      startAt,
      endAt: originalEndAt,
      originalEndAt,
      usage: '',
      delivery: '',
      returnPolicy: '',
      cancellation: '',
      cancellationPolicy: { borrowerRefundRate: 0, lenderRefundRate: 0 },
      acceptedAt: instant(row, 'creado_en'),
    },
    deliveredAt: optionalInstant(row, 'entrega_registrada_en'),
    currentReturnAt: localInstant(row, 'devolucion_vigente_en'),
    originalReturnAt: originalEndAt,
    actualReturnAt: optionalInstant(row, 'devolucion_registrada_en'),
    receiptConfirmedAt: optionalInstant(row, 'recepcion_confirmada_en'),
    completedAt: optionalInstant(row, 'finalizado_en'),
    extensions: [],
    reschedules: [],
    evidence: childRows(row, 'evidencias').map(mapEvidence),
    timeline: (
      [
        ['entrega_registrada_en', 'DELIVERY_RECORDED'],
        ['recepcion_confirmada_en', 'RECEIPT_CONFIRMED'],
        ['devolucion_registrada_en', 'RETURN_RECORDED'],
        ['vencido_en', 'LOAN_OVERDUE'],
        ['finalizado_en', 'LOAN_COMPLETED'],
      ] as [string, TimelineEventCode][]
    ).flatMap(([key, event]) =>
      text(row, key)
        ? [{ id: key, event, at: instant(row, key), complete: true }]
        : [],
    ),
    ratedBy: [],
  };
}

export function mapIncident(row: BackendRow): Incident {
  const decisionMap: Record<
    string,
    NonNullable<Incident['resolution']>['decision']
  > = {
    SIN_AFECTACION: 'NO_IMPACT',
    AFECTACION_PARCIAL: 'PARTIAL',
    AFECTACION_TOTAL: 'TOTAL',
  };
  const typeMap: Record<string, Incident['type']> = {
    DANIO: 'DAMAGE',
    PERDIDA: 'LOSS',
    RETRASO: 'LATE_RETURN',
    NO_DEVOLUCION: 'NON_RETURN',
    OTRO: 'OTHER',
  };
  const resolved = text(row, 'estado') === 'RESUELTA';
  return {
    id: text(row, 'id'),
    loanId: text(row, 'prestamo_id'),
    type: typeMap[text(row, 'tipo')] ?? 'OTHER',
    reportedBy: text(row, 'reportada_por_usuario_id'),
    description: text(row, 'descripcion'),
    evidence: childRows(row, 'evidencias').map(mapEvidence),
    status: resolved
      ? 'RESOLVED'
      : text(row, 'revision_iniciada_en')
        ? 'UNDER_REVIEW'
        : 'OPEN',
    createdAt: instant(row, 'reportada_en'),
    reviewStartedAt: optionalInstant(row, 'revision_iniciada_en'),
    reviewedBy: text(row, 'resuelta_por_usuario_id') || undefined,
    counterpartyStatement: text(row, 'descargo') || undefined,
    counterpartyStatementAt: optionalInstant(row, 'descargo_en'),
    adminNotes: childRows(row, 'observaciones').map((note) => ({
      id: text(note, 'id'),
      adminId: text(note, 'administrador_usuario_id'),
      text: text(note, 'contenido'),
      createdAt: instant(note, 'registrada_en'),
    })),
    guaranteeAmount: number(row, 'garantia_monetaria_acordada'),
    resolution: resolved
      ? {
          decision: decisionMap[text(row, 'decision_garantia')] ?? 'NO_IMPACT',
          amount: number(row, 'monto_garantia_afectado'),
          refundedAmount: number(row, 'saldo_garantia_previsto'),
          justification: text(row, 'justificacion_resolucion'),
          resolvedAt: instant(row, 'resuelta_en'),
          resolvedBy: text(row, 'resuelta_por_usuario_id'),
        }
      : undefined,
  };
}

export function mapNotification(row: BackendRow): AppNotification {
  const origin = text(row, 'origen_tipo');
  const originId = text(row, 'origen_id');
  const href =
    origin === 'RESERVA'
      ? `/reservations/${originId}`
      : origin === 'PRESTAMO'
        ? `/loans/${originId}`
        : origin === 'INCIDENCIA'
          ? `/incidents/${originId}`
          : '/notifications';
  return {
    id: text(row, 'id'),
    userId: text(row, 'destinatario_usuario_id'),
    event: 'REQUEST_CREATED',
    title: text(row, 'titulo') || undefined,
    message: text(row, 'mensaje') || undefined,
    params: { item: text(row, 'titulo'), reason: text(row, 'mensaje') },
    createdAt: instant(row, 'creada_en'),
    read: text(row, 'estado') === 'LEIDA',
    href,
  };
}

export function mapTransaction(
  row: BackendRow,
  userId: string,
): PaymentTransaction {
  const types: Record<string, PaymentTransaction['type']> = {
    PAGO_TARIFA: 'RENTAL_PAYMENT',
    PAGO_EXTENSION: 'EXTENSION_PAYMENT',
    CONSTITUCION_GARANTIA: 'GUARANTEE_HOLD',
  };
  const statuses: Record<string, PaymentTransaction['status']> = {
    PENDIENTE: 'PENDING',
    PROCESANDO: 'PROCESSING',
    PENDIENTE_LIBERACION: 'PENDING_RELEASE',
    LIBERADA: 'RELEASED',
    REEMBOLSADA: 'REFUNDED',
    FALLIDA: 'FAILED',
    CANCELADA: 'CANCELLED',
    CONSTITUIDA: 'HELD',
    AFECTADA_PARCIALMENTE: 'PARTIALLY_CAPTURED',
    AFECTADA: 'CAPTURED',
  };
  return {
    id: text(row, 'id'),
    userId,
    loanId: text(row, 'prestamo_id') || undefined,
    incidentId: text(row, 'incidencia_id') || undefined,
    createdAt: instant(row, 'solicitada_en'),
    updatedAt: instant(row, 'actualizada_en'),
    type: types[text(row, 'tipo')] ?? 'RENTAL_PAYMENT',
    amount: number(row, 'monto'),
    currency: 'PEN',
    method: text(row, 'medio_pago_seleccionado'),
    providerReference: text(row, 'referencia_proveedor'),
    status: statuses[text(row, 'estado')] ?? 'PENDING',
  };
}

export function mapRating(row: BackendRow): Rating {
  return {
    id: text(row, 'id'),
    stars: number(row, 'puntaje'),
    comment: text(row, 'comentario'),
    authorId: text(row, 'evaluador_usuario_id'),
    targetUserId: text(row, 'evaluado_usuario_id'),
    loanId: text(row, 'prestamo_id'),
    createdAt: instant(row, 'registrada_en'),
  };
}
