import { economicBreakdown } from '@/lib/business-rules';
import { addDays, atZonedTime, today } from '@/lib/dates';
import { commissionPolicy, costPolicy } from '@/services/payments.service';
import type {
  AppNotification,
  DemoState,
  Evidence,
  Listing,
  ListingTerms,
  Loan,
  PaymentTransaction,
  Reservation,
  TermsSnapshot,
  TimelineEvent,
  User,
} from '@/types/domain';

const at = (dayOffset: number, hours = 10, minutes = 0) =>
  atZonedTime(addDays(today(), dayOffset), hours, minutes);

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3_600_000).toISOString();

const defaultTerms: ListingTerms = {
  usage: 'Uso académico responsable. No desarmar ni modificar el objeto.',
  delivery:
    'Presentar el carné universitario y revisar el estado del objeto junto a la contraparte.',
  returnPolicy:
    'Devolver limpio, con todos sus accesorios y en el mismo estado de funcionamiento.',
  cancellation:
    'Cancelación sin penalidad antes de la entrega; se reembolsan los importes confirmados.',
};

const users: User[] = [
  {
    id: 'carlos',
    name: 'Carlos Mendoza',
    firstName: 'Carlos',
    email: 'carlos.mendoza@upc.edu.pe',
    phone: '987 654 321',
    initials: 'CM',
    universityId: 'UPC',
    campus: 'Monterrico',
    career: 'Ingeniería Mecatrónica',
    cycle: '8',
    verified: true,
    verificationStatus: 'VERIFIED',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    password: 'lendup123',
  },
  {
    id: 'alexandra',
    name: 'Alexandra Ruiz',
    firstName: 'Alexandra',
    email: 'alexandra.ruiz@pucp.edu.pe',
    phone: '956 123 480',
    initials: 'AR',
    universityId: 'PUCP',
    campus: 'San Miguel',
    career: 'Diseño Industrial',
    cycle: '6',
    verified: true,
    verificationStatus: 'VERIFIED',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    password: 'lendup123',
  },
  {
    id: 'lucia',
    name: 'Lucía Paredes',
    firstName: 'Lucía',
    email: 'lucia.paredes@uni.pe',
    phone: '945 210 677',
    initials: 'LP',
    universityId: 'UNI',
    campus: 'Campus central',
    career: 'Ingeniería Electrónica',
    cycle: '9',
    verified: true,
    verificationStatus: 'VERIFIED',
    role: 'STUDENT',
    accountStatus: 'ACTIVE',
    password: 'lendup123',
  },
  {
    id: 'admin',
    name: 'Equipo LendUp',
    firstName: 'Equipo',
    email: 'admin@lendup.pe',
    phone: '',
    initials: 'LU',
    universityId: '',
    campus: '',
    career: '',
    cycle: '',
    verified: true,
    verificationStatus: 'VERIFIED',
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
    password: 'lendup123',
  },
  {
    id: 'suspended',
    name: 'Mateo Quispe',
    firstName: 'Mateo',
    email: 'mateo.quispe@upc.edu.pe',
    phone: '900 000 000',
    initials: 'MQ',
    universityId: 'UPC',
    campus: 'Villa',
    career: 'Administración',
    cycle: '4',
    verified: true,
    verificationStatus: 'VERIFIED',
    role: 'STUDENT',
    accountStatus: 'SUSPENDED',
    password: 'lendup123',
  },
];

const openSlot = (listingId: string) => ({
  id: `slot-${listingId}`,
  startAt: at(-30, 0),
  endAt: at(90, 23, 59),
  status: 'AVAILABLE' as const,
});
const reservedSlot = (
  reservationId: string,
  startAt: string,
  endAt: string,
) => ({
  id: `slot-reserved-${reservationId}`,
  startAt,
  endAt,
  status: 'RESERVED' as const,
  reservationId,
});

const listingBase = (
  value: Omit<Listing, 'media' | 'terms' | 'createdAt'> &
    Partial<Pick<Listing, 'terms'>>,
): Listing => ({
  ...value,
  terms: value.terms ?? defaultTerms,
  media: [
    {
      id: `media-${value.id}`,
      type: 'PHOTO',
      url: value.image,
      name: value.title,
    },
  ],
  createdAt: at(-40),
});

const period = {
  rs1: { startAt: at(3, 14), endAt: at(6, 18) },
  rs2: { startAt: hoursAgo(3), endAt: at(2, 17) },
  rs3: { startAt: at(-5, 9), endAt: at(7, 18) },
  rs4: { startAt: at(-10, 8), endAt: at(-2, 16) },
  rs5: { startAt: at(-8, 9), endAt: at(4, 17) },
  rs6: { startAt: at(-25, 10), endAt: at(-22, 17) },
  rs7: { startAt: at(-42, 10), endAt: at(-40, 17) },
  rq1: { startAt: at(10, 9), endAt: at(12, 18) },
};
const extendedReturn = at(9, 18);

const listings: Listing[] = [
  listingBase({
    id: 'l1',
    ownerId: 'carlos',
    title: 'Cámara Sony Alpha a6400',
    category: 'CAMERAS',
    description:
      'Cámara mirrorless para proyectos audiovisuales. Incluye lente 16–50 mm, batería, cargador y estuche.',
    condition: 'EXCELLENT',
    universityId: 'UPC',
    campus: 'Monterrico',
    location: 'Santiago de Surco',
    exchangePlace: 'Hall del pabellón H, UPC Monterrico',
    dailyRate: 38,
    guaranteeAmount: 450,
    status: 'ACTIVE',
    image: '/images/camera.png',
    availabilitySlots: [
      openSlot('l1'),
      reservedSlot('rs1', period.rs1.startAt, period.rs1.endAt),
    ],
  }),
  listingBase({
    id: 'l2',
    ownerId: 'carlos',
    title: 'Calculadora Casio ClassWiz fx-991LA',
    category: 'CALCULATORS',
    description:
      'Calculadora científica de 552 funciones, permitida en exámenes de ciencias e ingeniería.',
    condition: 'VERY_GOOD',
    universityId: 'UPC',
    campus: 'San Miguel',
    location: 'San Miguel',
    exchangePlace: 'Biblioteca del campus San Miguel',
    dailyRate: 8,
    guaranteeAmount: 60,
    status: 'ACTIVE',
    image: '/images/calculator.webp',
    availabilitySlots: [
      openSlot('l2'),
      reservedSlot('rs4', period.rs4.startAt, period.rs4.endAt),
    ],
  }),
  listingBase({
    id: 'l3',
    ownerId: 'alexandra',
    title: 'Pack de libros de Cálculo II',
    category: 'BOOKS',
    description:
      'Libro de Stewart y colección de problemas resueltos para preparar parciales y finales.',
    condition: 'GOOD',
    universityId: 'PUCP',
    campus: 'San Miguel',
    location: 'San Miguel',
    exchangePlace: 'Puerta principal de la PUCP (Av. Universitaria)',
    dailyRate: 6,
    guaranteeAmount: 40,
    status: 'ACTIVE',
    image: '/images/books.webp',
    availabilitySlots: [
      openSlot('l3'),
      reservedSlot('rs5', period.rs5.startAt, period.rs5.endAt),
    ],
  }),
  listingBase({
    id: 'l4',
    ownerId: 'lucia',
    title: 'Kit de herramientas de precisión (42 piezas)',
    category: 'TOOLS',
    description:
      'Set de destornilladores y pinzas para electrónica, prototipos y mantenimiento de equipos.',
    condition: 'EXCELLENT',
    universityId: 'UNI',
    campus: 'Campus central',
    location: 'Rímac',
    exchangePlace: 'Puerta 3 de la UNI',
    dailyRate: 12,
    guaranteeAmount: 90,
    status: 'ACTIVE',
    image: '/images/tools.png',
    availabilitySlots: [
      openSlot('l4'),
      reservedSlot('rs2', period.rs2.startAt, period.rs2.endAt),
    ],
  }),
  listingBase({
    id: 'l5',
    ownerId: 'carlos',
    title: 'Tablet de 10" con lápiz para apuntes',
    category: 'ELECTRONICS',
    description:
      'Tablet con lápiz óptico para leer y anotar PDF. Incluye funda y cargador.',
    condition: 'VERY_GOOD',
    universityId: 'UPC',
    campus: 'Monterrico',
    location: 'Santiago de Surco',
    exchangePlace: 'Biblioteca central, UPC Monterrico',
    dailyRate: 24,
    guaranteeAmount: 280,
    status: 'PAUSED',
    image: '/images/tablet.png',
    availabilitySlots: [
      openSlot('l5'),
      reservedSlot('rs3', period.rs3.startAt, extendedReturn),
    ],
  }),
];

const listingById = (id: string) =>
  listings.find((listing) => listing.id === id) as Listing;

const snapshotFor = (
  listingId: string,
  startAt: string,
  endAt: string,
): TermsSnapshot => {
  const source = listingById(listingId);
  return {
    ...source.terms,
    dailyRate: source.dailyRate,
    guaranteeAmount: source.guaranteeAmount,
    commissionRate: commissionPolicy.rate,
    providerFeeRate: costPolicy.providerFeeRate,
    exchangePlace: source.exchangePlace,
    startAt,
    endAt,
    originalEndAt: endAt,
    cancellationPolicy: { ...costPolicy.cancellation },
    acceptedAt: at(-1),
  };
};

const reservation = (
  value: Omit<Reservation, 'snapshot' | 'requestId' | 'createdAt'> & {
    startAt: string;
    endAt: string;
  },
): Reservation => {
  const { startAt, endAt, ...rest } = value;
  return {
    ...rest,
    requestId: `rq-${value.id}`,
    createdAt: new Date(
      new Date(startAt).getTime() - 3 * 86_400_000,
    ).toISOString(),
    snapshot: snapshotFor(value.listingId, startAt, endAt),
  };
};

const reservations: Reservation[] = [
  reservation({
    id: 'rs1',
    listingId: 'l1',
    borrowerId: 'alexandra',
    lenderId: 'carlos',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    guaranteeStatus: 'PENDING',
    deliveryRecorded: false,
    ...period.rs1,
  }),
  reservation({
    id: 'rs2',
    listingId: 'l4',
    borrowerId: 'alexandra',
    lenderId: 'lucia',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING_RELEASE',
    guaranteeStatus: 'HELD',
    paymentMethod: 'card',
    guaranteePaymentMethod: 'card',
    deliveryRecorded: true,
    deliveredAt: hoursAgo(2),
    ...period.rs2,
  }),
  reservation({
    id: 'rs3',
    listingId: 'l5',
    borrowerId: 'alexandra',
    lenderId: 'carlos',
    status: 'ACTIVATED',
    paymentStatus: 'RELEASED',
    guaranteeStatus: 'HELD',
    paymentMethod: 'yape',
    guaranteePaymentMethod: 'account_money',
    deliveryRecorded: true,
    deliveredAt: period.rs3.startAt,
    receiptConfirmedAt: period.rs3.startAt,
    ...period.rs3,
  }),
  reservation({
    id: 'rs4',
    listingId: 'l2',
    borrowerId: 'alexandra',
    lenderId: 'carlos',
    status: 'ACTIVATED',
    paymentStatus: 'RELEASED',
    guaranteeStatus: 'HELD',
    paymentMethod: 'yape',
    guaranteePaymentMethod: 'card',
    deliveryRecorded: true,
    deliveredAt: period.rs4.startAt,
    receiptConfirmedAt: period.rs4.startAt,
    ...period.rs4,
  }),
  reservation({
    id: 'rs5',
    listingId: 'l3',
    borrowerId: 'carlos',
    lenderId: 'alexandra',
    status: 'ACTIVATED',
    paymentStatus: 'RELEASED',
    guaranteeStatus: 'HELD',
    paymentMethod: 'card',
    guaranteePaymentMethod: 'card',
    deliveryRecorded: true,
    deliveredAt: period.rs5.startAt,
    receiptConfirmedAt: period.rs5.startAt,
    ...period.rs5,
  }),
  reservation({
    id: 'rs6',
    listingId: 'l4',
    borrowerId: 'alexandra',
    lenderId: 'lucia',
    status: 'COMPLETED',
    paymentStatus: 'RELEASED',
    guaranteeStatus: 'RELEASED',
    paymentMethod: 'yape',
    guaranteePaymentMethod: 'card',
    deliveryRecorded: true,
    deliveredAt: period.rs6.startAt,
    receiptConfirmedAt: period.rs6.startAt,
    ...period.rs6,
  }),
  reservation({
    id: 'rs7',
    listingId: 'l1',
    borrowerId: 'alexandra',
    lenderId: 'carlos',
    status: 'COMPLETED',
    paymentStatus: 'RELEASED',
    guaranteeStatus: 'RELEASED',
    paymentMethod: 'card',
    guaranteePaymentMethod: 'card',
    deliveryRecorded: true,
    deliveredAt: period.rs7.startAt,
    receiptConfirmedAt: period.rs7.startAt,
    ...period.rs7,
  }),
];

const reservationById = (id: string) =>
  reservations.find((item) => item.id === id) as Reservation;

const evidence = (
  id: string,
  phase: Evidence['phase'],
  authorId: string,
  label: string,
  createdAt: string,
  url?: string,
): Evidence => ({
  id,
  phase,
  type: url ? 'PHOTO' : 'NOTE',
  label,
  description: label,
  author: users.find((user) => user.id === authorId)?.name ?? '',
  authorId,
  createdAt,
  url,
});

const timeline = (
  ...events: [TimelineEvent['event'], string | undefined, boolean][]
): TimelineEvent[] =>
  events.map(([event, eventAt, complete], index) => ({
    id: `timeline-${index}-${event}`,
    event,
    at: eventAt,
    complete,
  }));

const loanFrom = (
  id: string,
  reservationId: string,
  value: Partial<Loan> & Pick<Loan, 'status' | 'evidence' | 'timeline'>,
): Loan => {
  const source = reservationById(reservationId);
  return {
    id,
    reservationId,
    listingId: source.listingId,
    borrowerId: source.borrowerId,
    lenderId: source.lenderId,
    paymentStatus: source.paymentStatus,
    guaranteeStatus: source.guaranteeStatus,
    snapshot: source.snapshot,
    deliveredAt: source.deliveredAt ?? source.snapshot.startAt,
    receiptConfirmedAt: source.receiptConfirmedAt,
    currentReturnAt: source.snapshot.endAt,
    originalReturnAt: source.snapshot.originalEndAt,
    extensions: [],
    reschedules: [],
    ratedBy: [],
    ...value,
  };
};

const loans: Loan[] = [
  loanFrom('ln1', 'rs2', {
    status: 'PENDING_RECEIPT',
    evidence: [
      evidence(
        'ev1',
        'INITIAL',
        'lucia',
        'Kit completo: 42 piezas en su estuche',
        hoursAgo(2),
        '/images/tools.png',
      ),
    ],
    timeline: timeline(
      ['DELIVERY_RECORDED', hoursAgo(2), true],
      ['RECEIPT_PENDING', undefined, false],
    ),
  }),
  loanFrom('ln2', 'rs3', {
    status: 'ACTIVE',
    currentReturnAt: extendedReturn,
    extensions: [
      {
        id: 'ext1',
        requesterId: 'alexandra',
        requestedAt: at(-2, 12),
        originalReturnAt: period.rs3.endAt,
        proposedReturnAt: extendedReturn,
        additionalCost: 48,
        status: 'ACCEPTED',
        paymentStatus: 'RELEASED',
        paymentMethod: 'yape',
        resultingReturnAt: extendedReturn,
        respondedAt: at(-2, 15),
      },
    ],
    evidence: [
      evidence(
        'ev2',
        'INITIAL',
        'carlos',
        'Pantalla y lápiz sin rayones',
        period.rs3.startAt,
        '/images/tablet.png',
      ),
    ],
    timeline: timeline(
      ['DELIVERY_RECORDED', period.rs3.startAt, true],
      ['RECEIPT_CONFIRMED', period.rs3.startAt, true],
    ),
  }),
  loanFrom('ln3', 'rs4', {
    status: 'OVERDUE',
    evidence: [
      evidence(
        'ev3',
        'INITIAL',
        'carlos',
        'Calculadora con tapa protectora',
        period.rs4.startAt,
        '/images/calculator.webp',
      ),
    ],
    timeline: timeline(
      ['DELIVERY_RECORDED', period.rs4.startAt, true],
      ['RECEIPT_CONFIRMED', period.rs4.startAt, true],
      ['LOAN_OVERDUE', period.rs4.endAt, true],
    ),
  }),
  loanFrom('ln4', 'rs5', {
    status: 'RETURN_RECORDED',
    earlyReturn: true,
    actualReturnAt: at(-1, 11),
    returnRecord: {
      registeredAt: at(-1, 11),
      early: true,
      notes: 'Libros devueltos completos y sin anotaciones.',
    },
    evidence: [
      evidence(
        'ev4',
        'INITIAL',
        'alexandra',
        'Tapas y páginas revisadas',
        period.rs5.startAt,
        '/images/books.webp',
      ),
      evidence(
        'ev5',
        'FINAL',
        'carlos',
        'Libros devueltos sin anotaciones',
        at(-1, 11),
        '/images/books.webp',
      ),
    ],
    timeline: timeline(
      ['DELIVERY_RECORDED', period.rs5.startAt, true],
      ['RECEIPT_CONFIRMED', period.rs5.startAt, true],
      ['EARLY_RETURN_RECORDED', at(-1, 11), true],
      ['RETURN_CONFIRMATION_PENDING', undefined, false],
    ),
  }),
  loanFrom('ln5', 'rs6', {
    status: 'COMPLETED',
    actualReturnAt: period.rs6.endAt,
    completedAt: at(-20, 12),
    returnRecord: {
      registeredAt: period.rs6.endAt,
      confirmedAt: period.rs6.endAt,
      early: false,
      notes: 'Kit devuelto completo.',
    },
    evidence: [
      evidence(
        'ev6',
        'INITIAL',
        'lucia',
        'Estuche cerrado con 42 piezas',
        period.rs6.startAt,
        '/images/tools.png',
      ),
      evidence(
        'ev7',
        'FINAL',
        'alexandra',
        'Kit devuelto completo',
        period.rs6.endAt,
        '/images/tools.png',
      ),
    ],
    timeline: timeline(
      ['DELIVERY_RECORDED', period.rs6.startAt, true],
      ['RECEIPT_CONFIRMED', period.rs6.startAt, true],
      ['RETURN_RECORDED', period.rs6.endAt, true],
      ['RETURN_CONFIRMED_PENDING_INCIDENT', period.rs6.endAt, true],
      ['LOAN_COMPLETED', at(-20, 12), true],
    ),
    ratedBy: ['alexandra', 'lucia'],
  }),
  loanFrom('ln6', 'rs7', {
    status: 'COMPLETED',
    actualReturnAt: period.rs7.endAt,
    completedAt: period.rs7.endAt,
    returnRecord: {
      registeredAt: period.rs7.endAt,
      confirmedAt: period.rs7.endAt,
      early: false,
      notes: 'Cámara devuelta con todos sus accesorios.',
    },
    evidence: [
      evidence(
        'ev8',
        'INITIAL',
        'carlos',
        'Cámara, lente y batería',
        period.rs7.startAt,
        '/images/camera.png',
      ),
      evidence(
        'ev9',
        'FINAL',
        'alexandra',
        'Cámara devuelta en su estuche',
        period.rs7.endAt,
        '/images/camera.png',
      ),
    ],
    timeline: timeline(
      ['DELIVERY_RECORDED', period.rs7.startAt, true],
      ['RECEIPT_CONFIRMED', period.rs7.startAt, true],
      ['RETURN_RECORDED', period.rs7.endAt, true],
      ['LOAN_COMPLETED', period.rs7.endAt, true],
    ),
    ratedBy: ['alexandra', 'carlos'],
  }),
];

const charge = (reservationId: string) =>
  economicBreakdown(reservationById(reservationId).snapshot);

const transaction = (
  id: string,
  value: Omit<
    PaymentTransaction,
    'id' | 'currency' | 'providerReference' | 'updatedAt'
  >,
): PaymentTransaction => ({
  ...value,
  id,
  currency: 'PEN',
  updatedAt: value.createdAt,
  providerReference: `MP-${id.toUpperCase()}-${value.type.slice(0, 4)}`,
});

const transactions: PaymentTransaction[] = [
  transaction('tx01', {
    userId: 'alexandra',
    reservationId: 'rs2',
    loanId: 'ln1',
    createdAt: at(-1, 9),
    type: 'GUARANTEE_HOLD',
    amount: charge('rs2').guarantee,
    method: 'card',
    status: 'HELD',
  }),
  transaction('tx02', {
    userId: 'alexandra',
    reservationId: 'rs2',
    loanId: 'ln1',
    createdAt: at(-1, 9, 5),
    type: 'RENTAL_PAYMENT',
    amount: charge('rs2').rentalCharge,
    method: 'card',
    status: 'PENDING_RELEASE',
  }),
  transaction('tx03', {
    userId: 'alexandra',
    reservationId: 'rs3',
    loanId: 'ln2',
    createdAt: at(-7, 11),
    type: 'GUARANTEE_HOLD',
    amount: charge('rs3').guarantee,
    method: 'account_money',
    status: 'HELD',
  }),
  transaction('tx04', {
    userId: 'alexandra',
    reservationId: 'rs3',
    loanId: 'ln2',
    createdAt: at(-7, 11, 3),
    type: 'RENTAL_PAYMENT',
    amount: charge('rs3').rentalCharge,
    method: 'yape',
    status: 'RELEASED',
  }),
  transaction('tx05', {
    userId: 'carlos',
    reservationId: 'rs3',
    loanId: 'ln2',
    createdAt: period.rs3.startAt,
    type: 'RENTAL_RELEASE',
    amount: charge('rs3').lenderPayout,
    method: 'account_money',
    status: 'RELEASED',
  }),
  transaction('tx06', {
    userId: 'alexandra',
    reservationId: 'rs3',
    loanId: 'ln2',
    createdAt: at(-2, 15, 10),
    type: 'EXTENSION_PAYMENT',
    amount: 48,
    method: 'yape',
    status: 'RELEASED',
  }),
  transaction('tx07', {
    userId: 'alexandra',
    reservationId: 'rs4',
    loanId: 'ln3',
    createdAt: at(-12, 10),
    type: 'RENTAL_PAYMENT',
    amount: charge('rs4').rentalCharge,
    method: 'yape',
    status: 'RELEASED',
  }),
  transaction('tx08', {
    userId: 'alexandra',
    reservationId: 'rs4',
    loanId: 'ln3',
    createdAt: at(-12, 10, 4),
    type: 'GUARANTEE_HOLD',
    amount: charge('rs4').guarantee,
    method: 'card',
    status: 'HELD',
  }),
  transaction('tx09', {
    userId: 'carlos',
    reservationId: 'rs5',
    loanId: 'ln4',
    createdAt: at(-9, 18),
    type: 'RENTAL_PAYMENT',
    amount: charge('rs5').rentalCharge,
    method: 'card',
    status: 'RELEASED',
  }),
  transaction('tx10', {
    userId: 'carlos',
    reservationId: 'rs5',
    loanId: 'ln4',
    createdAt: at(-9, 18, 2),
    type: 'GUARANTEE_HOLD',
    amount: charge('rs5').guarantee,
    method: 'card',
    status: 'HELD',
  }),
  transaction('tx11', {
    userId: 'alexandra',
    reservationId: 'rs5',
    loanId: 'ln4',
    createdAt: period.rs5.startAt,
    type: 'RENTAL_RELEASE',
    amount: charge('rs5').lenderPayout,
    method: 'account_money',
    status: 'RELEASED',
  }),
  transaction('tx12', {
    userId: 'alexandra',
    reservationId: 'rs6',
    loanId: 'ln5',
    createdAt: at(-27, 10),
    type: 'RENTAL_PAYMENT',
    amount: charge('rs6').rentalCharge,
    method: 'yape',
    status: 'RELEASED',
  }),
  transaction('tx13', {
    userId: 'alexandra',
    reservationId: 'rs6',
    loanId: 'ln5',
    createdAt: at(-27, 10, 2),
    type: 'GUARANTEE_HOLD',
    amount: charge('rs6').guarantee,
    method: 'card',
    status: 'RELEASED',
  }),
  transaction('tx15', {
    userId: 'alexandra',
    reservationId: 'rs7',
    loanId: 'ln6',
    createdAt: at(-44, 10),
    type: 'RENTAL_PAYMENT',
    amount: charge('rs7').rentalCharge,
    method: 'card',
    status: 'RELEASED',
  }),
  transaction('tx16', {
    userId: 'carlos',
    reservationId: 'rs7',
    loanId: 'ln6',
    createdAt: period.rs7.startAt,
    type: 'RENTAL_RELEASE',
    amount: charge('rs7').lenderPayout,
    method: 'account_money',
    status: 'RELEASED',
  }),
  transaction('tx17', {
    userId: 'alexandra',
    reservationId: 'rs7',
    loanId: 'ln6',
    createdAt: period.rs7.endAt,
    type: 'GUARANTEE_RELEASE',
    amount: charge('rs7').guarantee,
    method: 'card',
    status: 'RELEASED',
  }),
  transaction('tx14', {
    userId: 'alexandra',
    reservationId: 'rs6',
    loanId: 'ln5',
    incidentId: 'INC-1031',
    createdAt: at(-20, 12),
    type: 'GUARANTEE_RELEASE',
    amount: charge('rs6').guarantee,
    method: 'card',
    status: 'RELEASED',
  }),
];

const notification = (
  id: string,
  value: Omit<AppNotification, 'id'>,
): AppNotification => ({ id, ...value });

export const createSeed = (): DemoState => ({
  version: 4,
  currentUserId: 'alexandra',
  authenticated: false,
  termsAcceptances: ['alexandra', 'carlos', 'lucia'].map((userId) => ({
    userId,
    version: '1.0',
    acceptedAt: at(-60),
  })),
  users: users.map((user) => ({ ...user })),
  listings: structuredClone(listings),
  requests: [
    {
      id: 'rq1',
      listingId: 'l2',
      borrowerId: 'alexandra',
      lenderId: 'carlos',
      ...period.rq1,
      message: 'La necesito para el examen final de Física II.',
      status: 'PENDING',
      createdAt: hoursAgo(20),
      snapshot: snapshotFor('l2', period.rq1.startAt, period.rq1.endAt),
    },
    {
      id: 'rq-rs1',
      listingId: 'l1',
      borrowerId: 'alexandra',
      lenderId: 'carlos',
      ...period.rs1,
      status: 'ACCEPTED',
      createdAt: at(-2, 9),
      respondedAt: at(-1, 18),
      snapshot: reservationById('rs1').snapshot,
    },
  ],
  reservations: structuredClone(reservations),
  loans: structuredClone(loans),
  incidents: [
    {
      id: 'INC-1042',
      loanId: 'ln3',
      type: 'LATE_RETURN',
      reportedBy: 'carlos',
      description:
        'La fecha de devolución venció hace dos días y todavía no coordinamos la entrega de la calculadora.',
      counterpartyStatement:
        'Tuve un viaje imprevisto; puedo devolverla mañana en la biblioteca del campus.',
      counterpartyStatementAt: at(-1, 9),
      evidence: [],
      status: 'UNDER_REVIEW',
      createdAt: at(-1, 8),
      reviewStartedAt: at(-1, 10),
      reviewedBy: 'admin',
      adminNotes: [
        {
          id: 'note-1',
          adminId: 'admin',
          text: 'Se contactó a ambas partes; la prestataria propone devolver mañana.',
          createdAt: at(-1, 10, 30),
        },
      ],
      guaranteeAmount: 60,
    },
    {
      id: 'INC-1031',
      loanId: 'ln5',
      type: 'DAMAGE',
      reportedBy: 'lucia',
      description: 'Una de las puntas del destornillador parecía desgastada.',
      counterpartyStatement:
        'La punta ya tenía ese desgaste al recibir el kit.',
      counterpartyStatementAt: at(-21, 9),
      evidence: [],
      status: 'RESOLVED',
      createdAt: at(-22, 18),
      reviewStartedAt: at(-21, 10),
      reviewedBy: 'admin',
      adminNotes: [],
      guaranteeAmount: 90,
      resolution: {
        decision: 'NO_IMPACT',
        amount: 0,
        refundedAmount: 90,
        justification:
          'Las evidencias iniciales muestran el mismo desgaste; no corresponde afectar la garantía.',
        resolvedAt: at(-20, 12),
        resolvedBy: 'admin',
      },
    },
  ],
  analyses: [],
  ratings: [
    {
      id: 'rating-1',
      stars: 5,
      comment: 'Muy puntual y el kit estaba impecable.',
      authorId: 'alexandra',
      targetUserId: 'lucia',
      loanId: 'ln5',
      createdAt: at(-20, 13),
    },
    {
      id: 'rating-2',
      stars: 4,
      comment: 'Cuidó bien el kit, aunque respondió un poco tarde.',
      authorId: 'lucia',
      targetUserId: 'alexandra',
      loanId: 'ln5',
      createdAt: at(-20, 14),
    },
    {
      id: 'rating-3',
      stars: 5,
      comment: 'Todo coordinado y el equipo tal como se describía.',
      authorId: 'alexandra',
      targetUserId: 'carlos',
      loanId: 'ln6',
      createdAt: at(-40, 19),
    },
    {
      id: 'rating-4',
      stars: 5,
      comment: 'Devolvió la cámara puntual y en perfecto estado.',
      authorId: 'carlos',
      targetUserId: 'alexandra',
      loanId: 'ln6',
      createdAt: at(-40, 20),
    },
  ],
  notifications: [
    notification('n1', {
      userId: 'alexandra',
      event: 'DELIVERY_REGISTERED',
      params: { item: listingById('l4').title },
      createdAt: hoursAgo(2),
      read: false,
      href: '/loans/ln1',
    }),
    notification('n2', {
      userId: 'alexandra',
      event: 'REQUEST_ACCEPTED',
      params: { item: listingById('l1').title },
      createdAt: at(-1, 18),
      read: false,
      href: '/reservations/rs1',
    }),
    notification('n3', {
      userId: 'alexandra',
      event: 'INCIDENT_UNDER_REVIEW',
      params: { incidentId: 'INC-1042' },
      createdAt: at(-1, 10),
      read: true,
      href: '/incidents/INC-1042',
    }),
    notification('n4', {
      userId: 'carlos',
      event: 'REQUEST_CREATED',
      params: { item: listingById('l2').title },
      createdAt: hoursAgo(20),
      read: false,
      href: '/requests',
    }),
    notification('n5', {
      userId: 'alexandra',
      event: 'EARLY_RETURN_REGISTERED',
      params: { item: listingById('l3').title },
      createdAt: at(-1, 11),
      read: false,
      href: '/loans/ln4',
    }),
    notification('n6', {
      userId: 'lucia',
      event: 'DELIVERY_REGISTERED',
      params: { item: listingById('l4').title },
      createdAt: hoursAgo(2),
      read: true,
      href: '/loans/ln1',
    }),
    notification('n7', {
      userId: 'admin',
      event: 'INCIDENT_ADMIN_NEW',
      params: { incidentId: 'INC-1042' },
      createdAt: at(-1, 8),
      read: false,
      href: '/admin/incidents/INC-1042',
    }),
  ],
  reminders: [
    {
      id: 'r1',
      userId: 'alexandra',
      operationId: 'ln1',
      listingId: 'l4',
      kind: 'RECEIPT',
      dueAt: hoursAgo(-1),
      href: '/loans/ln1',
    },
    {
      id: 'r2',
      userId: 'alexandra',
      operationId: 'rs1',
      listingId: 'l1',
      kind: 'PAYMENT_DUE',
      dueAt: period.rs1.startAt,
      href: '/reservations/rs1',
    },
    {
      id: 'r3',
      userId: 'carlos',
      operationId: 'rs1',
      listingId: 'l1',
      kind: 'DELIVERY',
      dueAt: period.rs1.startAt,
      href: '/reservations/rs1',
    },
    {
      id: 'r4',
      userId: 'alexandra',
      operationId: 'ln2',
      listingId: 'l5',
      kind: 'RETURN',
      dueAt: extendedReturn,
      href: '/loans/ln2',
    },
    {
      id: 'r5',
      userId: 'carlos',
      operationId: 'ln2',
      listingId: 'l5',
      kind: 'RETURN_RECEIPT',
      dueAt: extendedReturn,
      href: '/loans/ln2',
    },
    {
      id: 'r6',
      userId: 'alexandra',
      operationId: 'ln4',
      listingId: 'l3',
      kind: 'RETURN_RECEIPT',
      dueAt: at(0, 18),
      href: '/loans/ln4',
    },
  ],
  transactions: structuredClone(transactions),
});

export const demoAccounts = users
  .filter((user) => user.accountStatus === 'ACTIVE')
  .map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }));

export const demoPassword = users[0].password;
