export const es = {
  meta: {
    title: 'LendUp — Préstamos entre estudiantes',
    tagline: 'Presta lo que no usas. Consigue lo que necesitas.',
  },
  common: {
    language: 'Idioma',
    locales: { es: 'Español', en: 'Inglés' },
    close: 'Cerrar',
    cancel: 'Cancelar',
    continue: 'Continuar',
    retry: 'Reintentar',
    processing: 'Procesando…',
    loading: 'Cargando información',
    pending: 'Pendiente',
    requestFailed:
      'La operación no pudo completarse con el backend. Revisa los datos e inténtalo nuevamente.',
    backendGap:
      'Esta capacidad todavía no está disponible en la API de LendUp.',
    selectOption: 'Selecciona una opción',
    saveChanges: 'Guardar cambios',
    viewDetail: 'Ver detalle',
    showDetails: 'Ver detalles',
    hideDetails: 'Ocultar detalles',
    backHome: 'Volver al inicio',
    skipToContent: 'Saltar al contenido principal',
    verifiedUser: 'Estudiante verificado',
    avatarOf: 'Foto de perfil de {name}',
    loadError: {
      title: 'No pudimos cargar la información',
      description:
        'Revisa tu conexión e inténtalo nuevamente en unos segundos.',
    },
  },
  roles: {
    STUDENT: 'Estudiante',
    ADMIN: 'Administrador',
    LENDER: 'Prestamista',
    BORROWER: 'Prestatario',
  },
  nav: {
    main: 'Navegación principal',
    public: 'Navegación pública',
    mobile: 'Navegación móvil',
    mobileSecondary: 'Todas las secciones',
    brandHome: 'LendUp, ir al inicio',
    goToApp: 'Ir a mi panel',
    groups: {
      main: 'Principal',
      operations: 'Operaciones',
      account: 'Mi cuenta',
      admin: 'Administración',
    },
    home: 'Inicio',
    explore: 'Explorar',
    myItems: 'Mis objetos',
    requests: 'Solicitudes',
    reservations: 'Reservas',
    loans: 'Préstamos',
    calendar: 'Calendario',
    transactions: 'Transacciones',
    incidents: 'Incidencias',
    notifications: 'Notificaciones',
    profile: 'Perfil',
    adminIncidents: 'Bandeja de incidencias',
    unreadCount: '{count} sin leer',
    notificationsWithCount: 'Notificaciones, {count} sin leer',
    searchLabel: 'Buscar objetos en LendUp',
    searchPlaceholder: 'Buscar cámaras, calculadoras, libros…',
    signOut: 'Cerrar sesión',
    menu: 'Menú',
    menuTitle: 'Menú de LendUp',
    menuDescription:
      'Accede a todas tus operaciones y a la configuración de tu cuenta.',
  },
  banners: {
    verification:
      'Solicita la verificación de tu condición de estudiante para publicar objetos y solicitar préstamos.',
    verificationAction: 'Solicitar verificación',
    terms:
      'Antes de tu primera operación debes revisar y aceptar los términos y condiciones.',
    termsAction: 'Revisar términos',
  },
  auth: {
    hero: {
      title:
        'Préstamos entre estudiantes, con reglas claras y garantía protegida.',
      point1: 'Acceso con correo institucional y verificación estudiantil.',
      point2: 'Condiciones, tarifa y garantía congeladas en cada reserva.',
      point3: 'Evidencias del estado del objeto antes y después del préstamo.',
    },
    login: {
      title: 'Te damos la bienvenida',
      description:
        'Ingresa para continuar con tus reservas, préstamos y objetos.',
      submit: 'Iniciar sesión',
      submitting: 'Ingresando…',
      noAccount: '¿Aún no tienes cuenta?',
    },
    register: {
      completeTitle: 'Completa tu perfil universitario',
      completeDescription:
        'Tu cuenta ya existe. Guarda los datos que faltan para acceder a LendUp.',
      recoveryNotice:
        'No se completó el registro de tu perfil. Puedes reintentar sin crear otra cuenta ni cambiar tu contraseña.',
      completeSubmit: 'Guardar mi perfil',
      changeAccount: 'Usar otra cuenta',
      title: 'Crea tu cuenta universitaria',
      description:
        'Tu correo institucional será la identidad de acceso asociada a tu perfil universitario.',
      cta: 'Crear cuenta',
      submit: 'Crear mi cuenta',
      submitting: 'Creando cuenta…',
      detectedHint: 'La universidad se identifica por el dominio de tu correo.',
      detectedPlaceholder: 'Introduce tu correo institucional',
      unknownDomain:
        'Todavía no reconocemos el dominio de tu universidad. Solicita que lo añadamos.',
      catalogFailed:
        'No pudimos cargar las universidades. Reintenta para continuar.',
      campusOptional: 'Opcional. Escribe tu sede o campus si deseas indicarlo.',
      campusLength: 'La sede admite hasta 150 caracteres.',
      domainHint: 'Usa tu correo institucional ({domains}).',
      phoneHint:
        'Solo se comparte con tu contraparte durante una reserva vigente.',
      passwordHint: 'Mínimo 8 caracteres, con letras y números.',
      termsNotice: 'Antes de tu primera operación te pediremos aceptar los',
      termsLink: 'términos y condiciones',
      haveAccount: '¿Ya tienes cuenta?',
      successTitle: '¡Tu cuenta fue creada!',
      successNext:
        'El siguiente paso es solicitar la verificación de tu condición de estudiante para poder publicar y solicitar objetos.',
    },
    verify: {
      linkTitle: 'Verifica tu correo para ingresar',
      linkDescription: 'Verifica el correo {email} para acceder a LendUp.',
      linkInstructions:
        'Abre el enlace en tu correo y luego pulsa «Ya verifiqué mi correo». Revisa también la carpeta de spam. Si no recibiste el mensaje, puedes reenviarlo.',
      linkCheck: 'Ya verifiqué mi correo',
      linkSent: 'Enlace enviado. Revisa tu correo.',
      linkPending:
        'Tu correo todavía no está verificado. Abre el enlace recibido e inténtalo nuevamente.',
      linkError:
        'No pudimos completar la solicitud. Espera un momento y vuelve a intentarlo.',
      title: 'Solicita la verificación estudiantil',
      description:
        'Tu cuenta usa el correo institucional {email}. Registra una referencia válida para que el backend procese la verificación.',
      referenceLabel: 'Referencia de verificación',
      referenceHint:
        'Usa la referencia solicitada por tu institución, por ejemplo el código de tu carnet universitario.',
      referencePlaceholder: 'Código o referencia institucional',
      send: 'Solicitar verificación',
      resend: 'Actualizar solicitud',
      continue: 'Continuar',
      later: 'Hacerlo más tarde',
      messages: {
        UNVERIFIED:
          'Tu condición de estudiante aún no está verificada. Registra la referencia requerida para solicitar la validación.',
        PENDING:
          'Tu solicitud está registrada y el backend la mantiene pendiente de revisión.',
        VERIFIED:
          'Tu condición de estudiante está verificada. Ya puedes operar en LendUp.',
      },
    },
    errors: {
      USER_NOT_FOUND: 'No existe una cuenta con ese correo.',
      INVALID_CREDENTIALS: 'El correo o la contraseña no son válidos.',
      SESSION_EMAIL_MISMATCH:
        'La sesión de Firebase abierta pertenece a otro correo. Cierra sesión antes de registrar esta cuenta.',
      ACCOUNT_SUSPENDED:
        'Esta cuenta está suspendida. Comunícate con el equipo de LendUp.',
      EMAIL_TAKEN: 'Ya existe una cuenta registrada con ese correo.',
      EMAIL_NOT_INSTITUTIONAL:
        'El correo no pertenece al dominio institucional de la universidad seleccionada.',
    },
  },
  fields: {
    fullName: 'Nombres y apellidos',
    university: 'Universidad',
    campus: 'Sede o campus',
    career: 'Carrera',
    cycle: 'Ciclo',
    institutionalEmail: 'Correo institucional',
    phone: 'Teléfono',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    title: 'Título',
    category: 'Categoría',
    description: 'Descripción',
    condition: 'Condición',
    district: 'Distrito',
    exchangePlace: 'Lugar de intercambio',
    usage: 'Condiciones de uso',
    delivery: 'Condiciones de entrega',
    returnPolicy: 'Condiciones de devolución',
    cancellation: 'Condiciones de cancelación',
    dailyRate: 'Tarifa diaria',
    dailyRateCurrency: 'Tarifa diaria (S/)',
    guarantee: 'Garantía',
    guaranteeCurrency: 'Garantía monetaria (S/)',
    from: 'Desde',
    to: 'Hasta',
  },
  validation: {
    required: 'Este campo es obligatorio.',
    select: 'Selecciona una opción.',
    email: 'Ingresa un correo válido.',
    institutionalEmail:
      'Usa el correo institucional de la universidad seleccionada.',
    fullName: 'Ingresa tus nombres y apellidos.',
    min: 'Ingresa al menos {count} caracteres.',
    max: 'Usa como máximo {count} caracteres.',
    cycle: 'Ingresa un ciclo entre 1 y 14.',
    phone: 'Ingresa un teléfono válido de 9 a 15 dígitos.',
    passwordLength: 'La contraseña debe tener al menos 8 caracteres.',
    passwordLetter: 'La contraseña debe incluir al menos una letra.',
    passwordNumber: 'La contraseña debe incluir al menos un número.',
    passwordMatch: 'Las contraseñas no coinciden.',
    number: 'Ingresa un número válido.',
    dailyRate: 'La tarifa diaria debe ser mayor que cero.',
    nonNegative: 'El monto no puede ser negativo.',
    endAfterStart: 'La fecha final debe ser posterior a la inicial.',
    photoRequired: 'Agrega al menos una fotografía del objeto.',
    reviewFields: 'Revisa los campos marcados antes de continuar.',
  },
  categories: {
    CALCULATORS: 'Calculadoras',
    CAMERAS: 'Cámaras',
    BOOKS: 'Libros',
    TOOLS: 'Herramientas',
    ELECTRONICS: 'Electrónica',
    OTHER: 'Otros',
  },
  conditions: {
    NEW: 'Nuevo',
    EXCELLENT: 'Excelente',
    VERY_GOOD: 'Muy bueno',
    GOOD: 'Bueno',
    FAIR: 'Aceptable',
  },
  status: {
    request: {
      PENDING: 'Pendiente',
      ACCEPTED: 'Aceptada',
      REJECTED: 'Rechazada',
      CANCELLED: 'Cancelada',
    },
    reservation: {
      CONFIRMED: 'Confirmada',
      ACTIVATED: 'En préstamo',
      COMPLETED: 'Finalizada',
      CANCELLED: 'Cancelada',
    },
    loan: {
      PENDING_RECEIPT: 'Entregado · por confirmar',
      ACTIVE: 'Activo',
      OVERDUE: 'Vencido',
      RETURN_RECORDED: 'Devuelto · por confirmar',
      RETURN_CONFIRMED_PENDING_INCIDENT: 'En incidencia',
      COMPLETED: 'Finalizado',
    },
    payment: {
      PENDING: 'Pendiente de pago',
      PROCESSING: 'Procesando',
      PENDING_RELEASE: 'Pagado · pendiente de liberación',
      RELEASED: 'Liberado al prestamista',
      REFUNDED: 'Reembolsado',
      FAILED: 'Rechazado',
      CANCELLED: 'Cancelado',
    },
    guarantee: {
      NOT_REQUIRED: 'No requerida',
      PENDING: 'Pendiente',
      PROCESSING: 'Procesando',
      HELD: 'Constituida',
      FAILED: 'Rechazada',
      CANCELLED: 'Cancelada',
      RELEASED: 'Devuelta',
      PARTIALLY_CAPTURED: 'Afectada parcialmente',
      CAPTURED: 'Afectada totalmente',
    },
    transaction: {
      PENDING: 'Pendiente',
      PROCESSING: 'Procesando',
      PENDING_RELEASE: 'Pendiente de liberación',
      RELEASED: 'Completado',
      REFUNDED: 'Reembolsado',
      FAILED: 'Rechazado',
      CANCELLED: 'Cancelado',
      NOT_REQUIRED: 'No requerido',
      HELD: 'Retenido',
      PARTIALLY_CAPTURED: 'Afectado parcialmente',
      CAPTURED: 'Afectado',
    },
    incident: {
      OPEN: 'Pendiente',
      UNDER_REVIEW: 'En revisión',
      RESOLVED: 'Resuelta',
    },
    extension: {
      PENDING: 'Pendiente',
      PAYMENT_PENDING: 'Aceptada · pago pendiente',
      ACCEPTED: 'Aceptada',
      REJECTED: 'Rechazada',
    },
    reschedule: {
      PENDING: 'Pendiente',
      ACCEPTED: 'Aceptada',
      REJECTED: 'Rechazada',
    },
    analysis: {
      IDLE: 'Sin ejecutar',
      ANALYZING: 'Analizando',
      SUCCESS: 'Completado',
      TIMEOUT: 'Tiempo agotado',
      ERROR: 'No disponible',
    },
    listing: {
      ACTIVE: 'Publicado',
      PAUSED: 'Pausado',
      ARCHIVED: 'Dado de baja',
    },
    verification: {
      UNVERIFIED: 'Sin verificar',
      PENDING: 'Verificación pendiente',
      VERIFIED: 'Verificado',
    },
  },
  reputation: {
    aria: '{value} de 5 estrellas',
    ariaWithCount: '{value} de 5 estrellas, {count} calificaciones',
    none: 'Sin calificaciones',
  },
  listing: {
    perDay: '/ día',
    card: {
      open: 'Ver {title}',
      available: 'Disponible',
      yours: 'Tu publicación',
      distance: 'a {km} km',
    },
    notFound: {
      title: 'Objeto no encontrado',
      description: 'La publicación no existe o ya no está disponible.',
    },
    backToExplore: 'Volver a explorar',
    gallery: 'Fotografías del objeto',
    showImage: 'Mostrar fotografía {index}',
    guaranteeRequired: 'Garantía monetaria reembolsable: {amount}',
    noGuarantee: 'Sin garantía monetaria',
    noGuaranteeShort: 'No requiere',
    ownNotice: 'Este objeto te pertenece. Adminístralo desde Mis objetos.',
    request: 'Solicitar préstamo',
    notRequestable: 'Esta publicación no recibe nuevas solicitudes por ahora.',
    availability: 'Disponibilidad',
    availableWindows: 'Periodos disponibles',
    noAvailability: 'El prestamista aún no registró periodos disponibles.',
    blockedWindows: 'Periodos ya reservados',
    exchangePoint: 'Punto de intercambio',
    phonePrivacy:
      'El teléfono de la contraparte solo se comparte durante una reserva confirmada o un préstamo vigente.',
    conditions: 'Condiciones vigentes',
    conditionsTitle: 'Acuerdos claros antes de solicitar',
    viewProfile: 'Ver perfil y comentarios',
  },
  explore: {
    eyebrow: 'Comunidad LendUp',
    title: 'Encuentra lo que necesitas',
    description:
      'Objetos publicados por estudiantes verificados de tu comunidad universitaria.',
    searchLabel: 'Buscar objetos por nombre o descripción',
    searchPlaceholder: 'Busca calculadoras, cámaras, libros…',
    filters: 'Filtros',
    allCategories: 'Todas las categorías',
    allUniversities: 'Todas las universidades',
    allCampuses: 'Todas las sedes',
    districtPlaceholder: 'Ej. Santiago de Surco',
    clear: 'Limpiar filtros',
    nearMe: 'Ordenar por cercanía',
    sortedByDistance: 'Ordenado por cercanía',
    locationDenied:
      'No pudimos acceder a tu ubicación. Revisa los permisos del navegador.',
    locationPrivacy:
      'Tu ubicación solo se usa en este momento para ordenar resultados; no se guarda.',
    results: '{count} resultados',
    emptyTitle: 'No encontramos coincidencias',
    emptyDescription:
      'Prueba con otra palabra, sede o periodo de disponibilidad.',
  },
  request: {
    dialogTitle: 'Revisa antes de solicitar',
    dialogDescription: 'Solicitud de préstamo para {title}',
    periodAvailable: 'El periodo seleccionado está disponible.',
    periodUnavailable:
      'El periodo seleccionado no está disponible. Elige un intervalo publicado que no tenga una reserva confirmada.',
    reviewTitle: 'Condiciones definidas por el prestamista',
    paymentLater:
      'No se realizará ningún cobro ahora. El monto mostrado es preliminar; el backend aún no ofrece una cotización total autoritativa ni confirmación real del proveedor.',
    messageLabel: 'Mensaje para el prestamista (opcional)',
    messageHint: 'Cuéntale para qué lo necesitas. Máximo 280 caracteres.',
    acceptConditions:
      'Leí y acepto la tarifa, la garantía, las condiciones de uso, entrega, devolución y cancelación, y el lugar de intercambio.',
    submit: 'Enviar solicitud',
  },
  myItems: {
    eyebrow: 'Como prestamista',
    title: 'Mis objetos',
    description:
      'Administra tus publicaciones, su disponibilidad y las solicitudes que recibes.',
    activeOnly:
      'El backend solo permite consultar publicaciones activas. Las publicaciones pausadas o dadas de baja no pueden recuperarse en esta vista.',
    noActiveTitle: 'No hay publicaciones activas visibles',
    publish: 'Publicar objeto',
    publishFirst: 'Publicar mi primer objeto',
    edit: 'Editar',
    availability: 'Disponibilidad',
    pause: 'Pausar',
    reactivate: 'Reactivar',
    archive: 'Dar de baja',
    reviewRequests: 'Revisar solicitudes',
    pendingRequests: 'Solicitudes',
    upcomingReservations: 'Reservas',
    archiveTitle: 'Dar de baja la publicación',
    archiveDescription:
      '“{title}” dejará de recibir solicitudes y no podrá reactivarse. Las reservas confirmadas y el historial se conservan.',
    archiveConfirm: 'Dar de baja',
  },
  listingForm: {
    newEyebrow: 'Nueva publicación',
    editEyebrow: 'Editar publicación',
    newTitle: 'Publicar un objeto',
    editTitle: 'Editar “{title}”',
    description:
      'Completa la información, las fotos, las condiciones y la parte económica. Todos los campos marcados con * son obligatorios.',
    snapshotNotice:
      'Los cambios solo aplican a nuevas solicitudes. Las reservas ya confirmadas conservan las condiciones, tarifa y garantía con las que se aceptaron.',
    sections: {
      info: 'Información del objeto',
      location: 'Ubicación e intercambio',
      photos: 'Fotografías',
      conditions: 'Condiciones del préstamo',
      economy: 'Tarifa y garantía',
    },
    descriptionHint:
      'Incluye accesorios, estado de funcionamiento y cualquier detalle relevante.',
    exchangeHint:
      'Un punto público y fácil de encontrar dentro o cerca del campus.',
    photosTitle: 'Carga de fotografías no disponible',
    conditionsHint:
      'Estas condiciones se mostrarán antes de que un estudiante envíe su solicitud.',
    rateHint: 'Se cobra por cada bloque iniciado de 24 horas.',
    guaranteeHint:
      'Déjalo en 0 si no requieres garantía. Se devuelve al finalizar sin incidencias.',
    publish: 'Publicar objeto',
    save: 'Guardar cambios',
  },
  availability: {
    eyebrow: 'Disponibilidad',
    back: 'Volver a mis objetos',
    description:
      'Administra los periodos en los que puedes prestar este objeto. Las reservas confirmadas se conservan y no pueden editarse desde aquí.',
    manage: 'Gestionar disponibilidad',
    addTitle: 'Agregar un intervalo',
    editTitle: 'Editar intervalo',
    formDescription:
      'Indica una fecha de inicio y una fecha de fin. Los intervalos disponibles no pueden superponerse.',
    registered: 'Calendario del objeto',
    availableTitle: 'Periodos disponibles',
    reservedTitle: 'Periodos reservados',
    noAvailable: 'Todavía no registraste periodos disponibles.',
    noReserved: 'No hay reservas confirmadas para este objeto.',
    reservedNote:
      'Las reservas confirmadas son informativas y no pueden modificarse desde esta pantalla.',
    reserved: 'Reservado',
    add: 'Agregar intervalo',
    save: 'Guardar cambios',
    cancelEdit: 'Cancelar edición',
    edit: 'Editar intervalo',
    delete: 'Eliminar intervalo',
    deleteTitle: 'Eliminar disponibilidad',
    deleteDescription:
      'Se eliminará el intervalo {period}. Las reservas confirmadas no se eliminarán.',
    deleteConfirm: 'Eliminar',
    invalidRange: 'La fecha final debe ser posterior a la inicial.',
    pastStart: 'El periodo debe comenzar en el futuro.',
    overlap: 'El intervalo se superpone con otra disponibilidad registrada.',
  },
  requests: {
    eyebrow: 'Solicitudes',
    title: 'Solicitudes de préstamo',
    description:
      'Una solicitud se convierte en reserva solo cuando el prestamista la acepta.',
    received: 'Recibidas',
    sent: 'Enviadas',
    createdAgo: 'Enviada {time}',
    totalRental: 'Tarifa total {amount}',
    guarantee: 'Garantía {amount}',
    snapshotNotice:
      'Condiciones vigentes al {date}. Si se acepta, quedarán registradas en la reserva.',
    accept: 'Aceptar',
    reject: 'Rechazar',
    cancel: 'Cancelar solicitud',
    viewReservation: 'Ver reserva',
    emptySentTitle: 'No enviaste solicitudes',
    emptySentDescription:
      'Explora objetos disponibles y envía tu primera solicitud.',
    emptyReceivedTitle: 'No recibiste solicitudes',
    emptyReceivedDescription:
      'Cuando alguien solicite uno de tus objetos, aparecerá aquí.',
    confirm: {
      accept: {
        title: 'Aceptar solicitud',
        description:
          'Se creará la reserva de “{title}” para {period} y ese periodo quedará bloqueado.',
        action: 'Aceptar y reservar',
      },
      reject: {
        title: 'Rechazar solicitud',
        description:
          'Se notificará al estudiante que no podrás prestar “{title}” para {period}.',
        action: 'Rechazar',
      },
      cancel: {
        title: 'Cancelar solicitud',
        description:
          'Tu solicitud de “{title}” para {period} dejará de estar pendiente.',
        action: 'Cancelar solicitud',
      },
    },
  },
  reservations: {
    eyebrow: 'Operaciones confirmadas',
    eyebrowDetail: 'Reserva',
    title: 'Reservas',
    description:
      'Solicitudes aceptadas con sus condiciones, tarifa y garantía registradas.',
    current: 'Vigentes',
    history: 'Historial',
    back: 'Volver a reservas',
    notFound: 'Reserva no encontrada',
    emptyTitle: 'No tienes reservas vigentes',
    emptyHistoryTitle: 'Aún no tienes reservas finalizadas o canceladas',
    emptyDescription:
      'Cuando una solicitud sea aceptada, la reserva aparecerá aquí.',
    snapshotNotice:
      'Estas condiciones corresponden al momento en que se confirmó la reserva y no cambian aunque se edite la publicación.',
    borrowerSteps:
      'Constituye la garantía y paga la tarifa antes de la entrega. Luego confirma la recepción del objeto.',
    lenderSteps:
      'Cuando el pago y la garantía estén confirmados, registra la entrega del objeto con sus evidencias iniciales.',
    pay: 'Pagar tarifa y garantía',
    recordDelivery: 'Registrar entrega',
    waitingPayment: 'Esperando el pago y la garantía del prestatario.',
    readyForDelivery: 'Pago y garantía confirmados. Coordina la entrega.',
    openLoan: 'Ver préstamo',
    cancel: 'Cancelar reserva',
    cancelTitle: 'Cancelar esta reserva',
    cancelDescriptionBorrower:
      'Se liberará el periodo reservado, se notificará al prestamista y se reembolsarán los importes confirmados según las condiciones aceptadas.',
    cancelDescriptionLender:
      'Se liberará el periodo, se notificará al prestatario y se le reembolsará el total de la tarifa y la garantía confirmadas.',
    cancelConfirm: 'Confirmar cancelación',
    refundRental: 'Reembolso de tarifa y comisión',
    refundGuarantee: 'Devolución de garantía',
    reason: 'Motivo de la cancelación',
    reasonHint: 'Se compartirá con tu contraparte. Mínimo 5 caracteres.',
    cancelledBy: 'Cancelada por {name} el {date}. Motivo: {reason}',
  },
  operations: {
    asBorrower: 'Como prestatario',
    asLender: 'Como prestamista',
    nextStep: 'Siguiente paso',
    periodAndPlace: 'Periodo y lugar',
    contactTitle: 'Contacto para coordinar',
    phoneHidden:
      'El teléfono se muestra solo mientras la reserva o el préstamo estén vigentes.',
    frozenConditions: 'Condiciones registradas',
  },
  finance: {
    breakdown: 'Resumen económico',
    rentalFee: 'Tarifa por {days} día(s)',
    lendupCommission: 'Comisión de LendUp',
    providerFee: 'Comisión del proveedor de pagos',
    guaranteeRefundable: 'Garantía monetaria (reembolsable)',
    total: 'Total',
    payment: 'Pago',
    guarantee: 'Garantía',
    rentalCharge: 'Tarifa y comisión',
    lenderPayout:
      'Recibirás {amount} cuando el prestatario confirme la recepción.',
    lenderReleased: 'Se te liberaron {amount} por este préstamo.',
    lenderPending: 'Recibirás {amount} al confirmarse la recepción.',
    paymentNotes: {
      PENDING: 'Aún no se registra el pago de la tarifa.',
      PROCESSING: 'El proveedor está procesando el pago.',
      PENDING_RELEASE:
        'Pago aprobado. Se liberará al prestamista cuando se confirme la recepción.',
      RELEASED: 'La tarifa fue liberada al prestamista.',
      REFUNDED: 'La tarifa fue reembolsada.',
      FAILED: 'El proveedor rechazó el pago. Puedes intentarlo de nuevo.',
      CANCELLED: 'El pago fue cancelado. Puedes intentarlo de nuevo.',
    },
    guaranteeNotes: {
      NOT_REQUIRED: 'Este préstamo no requiere garantía.',
      PENDING: 'Debe constituirse antes de la entrega.',
      PROCESSING: 'El proveedor está procesando la garantía.',
      HELD: 'Retenida por el proveedor hasta el cierre del préstamo.',
      FAILED: 'El proveedor rechazó la garantía. Intenta con otro medio.',
      CANCELLED: 'La operación de garantía fue cancelada.',
      RELEASED: 'La garantía fue devuelta al prestatario.',
      PARTIALLY_CAPTURED:
        'Se aplicó una parte por una incidencia y el saldo fue devuelto.',
      CAPTURED: 'Se aplicó la totalidad por una incidencia resuelta.',
    },
  },
  payments: {
    chooseMethod: 'Medio de pago',
    noMethods:
      'No hay medios de pago habilitados. La integración con el proveedor sigue pendiente en el backend.',
    methods: {
      CARD: 'Tarjeta de crédito o débito',
      WALLET: 'Billetera digital',
      ACCOUNT_MONEY: 'Dinero en cuenta Mercado Pago',
      CASH: 'Pago en efectivo',
    },
    methodHints: {
      CARD: 'Visa, Mastercard o American Express',
      WALLET: 'Operación gestionada por el proveedor externo',
      ACCOUNT_MONEY: 'Saldo disponible en tu cuenta',
      CASH: 'Código para pagar en agentes o banca',
    },
  },
  checkout: {
    eyebrow: 'Pago con Mercado Pago',
    title: 'Completa tu reserva · {title}',
    description:
      'La garantía y la tarifa se procesan por separado con el proveedor externo. LendUp no guarda datos completos de tus tarjetas.',
    back: 'Volver a la reserva',
    backToReservation: 'Volver a la reserva',
    step: 'Paso {number}',
    guaranteeStep: 'Garantía monetaria',
    rentalStep: 'Tarifa y comisión',
    rentalLocked: 'Disponible cuando la garantía esté constituida.',
    guaranteeDone: 'Garantía constituida correctamente.',
    rentalDone: 'Pago de la tarifa aprobado.',
    payWithProvider: 'Pagar {amount} con Mercado Pago',
    processing: 'Procesando con el proveedor…',
    providerPending:
      'La operación fue registrada y permanece pendiente de confirmación del proveedor.',
    allDone:
      'Listo: el pago y la garantía están confirmados. El prestamista ya puede registrar la entrega.',
    security:
      'Serás atendido por el flujo seguro de Mercado Pago. LendUp solo registra el medio elegido y el estado de la operación.',
    guaranteeNote:
      'La garantía se devuelve al finalizar el préstamo sin incidencias pendientes.',
    closedTitle: 'Esta reserva ya no admite pagos',
    closedDescription: 'La reserva fue cancelada o el préstamo ya inició.',
  },
  delivery: {
    eyebrow: 'Entrega del objeto',
    title: 'Registrar entrega · {title}',
    description:
      'Documenta el estado del objeto antes de entregarlo. Luego el prestatario confirmará la recepción.',
    checksTitle: 'Requisitos previos',
    checks: {
      reservation: 'Reserva confirmada y sin entrega registrada',
      payment: 'Pago de la tarifa aprobado',
      guarantee: 'Garantía constituida o no requerida',
    },
    notReady:
      'Aún no se cumplen todos los requisitos para registrar la entrega.',
    evidenceTitle: 'Evidencias iniciales',
    evidenceHint:
      'Recomendamos fotos generales, accesorios y una nota sobre el funcionamiento.',
    evidenceLabel: 'Fotos, videos y notas del estado inicial',
    confirm: 'Confirmar entrega',
    confirmTitle: 'Confirmar la entrega',
    confirmDescription:
      'Se registrará la fecha y hora de entrega con {count} evidencia(s) inicial(es) y se avisará al prestatario.',
    confirmNoEvidence:
      'No adjuntaste evidencias iniciales. Sin ellas será más difícil respaldar el estado del objeto. ¿Deseas continuar?',
  },
  loans: {
    eyebrow: 'Operaciones',
    title: 'Préstamos',
    description:
      'Da seguimiento a tus préstamos como prestamista o prestatario.',
    back: 'Volver a préstamos',
    notFound: 'Préstamo no encontrado',
    open: 'Abrir préstamo',
    returnAt: 'Devolución: {date}',
    emptyDescription:
      'Cuando exista un préstamo en este estado, aparecerá aquí.',
    tabs: {
      upcoming: 'Por iniciar',
      active: 'En curso',
      overdue: 'Vencidos',
      history: 'Historial',
    },
    empty: {
      upcoming: 'No tienes préstamos por iniciar',
      active: 'No tienes préstamos en curso',
      overdue: 'No tienes préstamos vencidos',
      history: 'Aún no tienes préstamos finalizados',
    },
    next: {
      CONFIRM_RECEIPT: 'Confirma que recibiste el objeto',
      WAIT_RECEIPT: 'Esperando que el prestatario confirme la recepción',
      RECORD_RETURN: 'Registra la devolución del objeto',
      WAIT_RETURN: 'Esperando la devolución del objeto',
      CONFIRM_RETURN: 'Revisa y confirma la devolución',
      WAIT_RETURN_CONFIRMATION:
        'Esperando que el prestamista confirme la devolución',
      WAIT_INCIDENT: 'Esperando la resolución de la incidencia',
      RATE: 'Califica tu experiencia',
      NONE: 'Préstamo cerrado. ¡Gracias por usar LendUp!',
    },
  },
  loanDetail: {
    eyebrow: 'Préstamo',
    with: 'Con {name}',
    overdueBorrower:
      'La devolución debía realizarse el {date}. Registra la devolución lo antes posible.',
    overdueLender:
      'La devolución vencía el {date}. Puedes coordinar con el prestatario o reportar una incidencia.',
    incidentHold:
      'Hay una incidencia abierta: la garantía permanece retenida hasta su resolución.',
    noCancel: 'Un préstamo activo ya no puede cancelarse.',
    period: 'Fechas del préstamo',
    start: 'Inicio',
    currentReturn: 'Devolución vigente',
    originalReturn: 'Devolución original',
    deliveredAt: 'Entrega registrada',
    receivedAt: 'Recepción confirmada',
    returnedAt: 'Devolución registrada',
    returnConfirmedAt: 'Devolución confirmada',
    traceability: 'Trazabilidad',
    returnNotes: 'Observaciones de la devolución',
    earlyReturnNotes: 'Observaciones de la devolución anticipada',
    history: 'Historial',
    historyTitle: 'Extensiones y reprogramaciones',
    extensionBy: 'Extensión solicitada por {name}',
    rescheduleBy: 'Reprogramación propuesta por {name}',
    requestedAt: 'Solicitada',
    previousDate: 'Fecha anterior',
    proposedDate: 'Fecha propuesta',
    additionalCost: 'Costo adicional',
    respondedAt: 'Respondida',
    resultingDate: 'Fecha vigente resultante',
    noExtensions: 'Este préstamo no registra extensiones ni reprogramaciones.',
    incidents: 'Incidencias del préstamo',
    noIncidents: 'Este préstamo no tiene incidencias registradas.',
    rating: 'Calificación',
    yourRating: 'Calificaste con {stars} estrella(s)',
    ratingPending: 'Aún no calificaste a tu contraparte.',
    actions: {
      confirmReceipt: 'Confirmar recepción',
      recordReturn: 'Registrar devolución',
      earlyReturn: 'Devolver antes de tiempo',
      requestExtension: 'Solicitar extensión',
      payExtension: 'Pagar extensión · {amount}',
      reviewReschedule: 'Revisar nueva fecha',
      reviewExtension: 'Revisar extensión',
      proposeReschedule: 'Proponer nueva fecha',
      confirmReturn: 'Confirmar devolución',
      rate: 'Calificar experiencia',
      reportIncident: 'Reportar incidencia',
    },
  },
  loanDialogs: {
    newDate: 'Nueva fecha y hora de devolución',
    accept: 'Aceptar',
    reject: 'Rechazar',
    receipt: {
      title: 'Confirmar recepción',
      description:
        'Revisa las evidencias iniciales. Al confirmar, el préstamo quedará activo y la tarifa se liberará al prestamista.',
      warning:
        'Después de confirmar la recepción, esta operación ya no podrá cancelarse.',
      confirm: 'Confirmar recepción',
    },
    extension: {
      title: 'Solicitar extensión',
      description:
        'La devolución vigente es el {date}. Propón una nueva fecha posterior.',
      note: 'El costo adicional se calcula con la tarifa registrada en la reserva. La fecha vigente no cambia hasta que la extensión sea aceptada y pagada.',
      confirm: 'Enviar solicitud',
    },
    reschedule: {
      title: 'Proponer nueva fecha de devolución',
      description:
        'La devolución vigente es el {date}. Propón una fecha en la que sí puedas recibir el objeto.',
      note: 'La reprogramación propuesta por el prestamista no genera ningún cobro adicional al prestatario.',
      confirm: 'Enviar propuesta',
    },
    respondExtension: {
      title: 'Solicitud de extensión',
      description: 'El prestatario pidió conservar el objeto por más tiempo.',
      paymentNote:
        'Si aceptas, la nueva fecha se aplicará cuando el prestatario pague el costo adicional.',
    },
    respondReschedule: {
      title: 'Propuesta de nueva fecha',
      description:
        'El prestamista propone reprogramar la devolución sin costo adicional.',
    },
    payExtension: {
      title: 'Pagar extensión',
      description:
        'Al aprobarse el pago, la devolución vigente cambiará al {date}.',
    },
    return: {
      title: 'Registrar devolución',
      description:
        'Adjunta las evidencias finales y describe el estado y funcionamiento del objeto.',
      evidenceLabel: 'Evidencias finales del objeto',
      notes: 'Estado, funcionamiento y observaciones',
      confirm: 'Registrar devolución',
    },
    early: {
      title: 'Devolver antes de tiempo',
      warning:
        'Devolver el objeto antes de la fecha acordada no genera un reembolso proporcional de la tarifa pagada.',
    },
    confirmReturn: {
      title: 'Confirmar devolución',
      description:
        'Revisa las evidencias finales antes de confirmar que recibiste el objeto.',
      guaranteeNote:
        'Si no hay incidencias pendientes, el préstamo finalizará y la garantía se devolverá al prestatario.',
      incidentHint:
        'Si detectas un problema, cierra este diálogo y reporta una incidencia antes de confirmar.',
      confirm: 'Confirmar devolución',
    },
    rating: {
      title: 'Califica tu experiencia',
      description:
        'Tu calificación se suma a la reputación de tu contraparte y queda vinculada a este préstamo.',
      stars: 'Calificación',
      starAria: '{count} estrella(s)',
      comment: 'Comentario (opcional)',
      commentHint: 'Se mostrará en el perfil público junto a tu nombre.',
      confirm: 'Enviar calificación',
    },
  },
  evidence: {
    title: 'Evidencias',
    comparison: 'Comparación antes y después',
    initial: 'Estado inicial (entrega)',
    final: 'Estado final (devolución)',
    none: 'Sin evidencias registradas.',
    noteLabel: 'Nota de evidencia',
    notePlaceholder: 'Describe el estado o el funcionamiento del objeto.',
    addNote: 'Agregar nota',
    attached: 'Evidencias adjuntas',
    remove: 'Quitar {name}',
    noCaptions: 'Sin subtítulos',
    types: { PHOTO: 'Foto', VIDEO: 'Video', NOTE: 'Nota' },
  },
  photos: {
    select: 'Seleccionar fotos',
    hint: 'Hasta 6 fotos JPG, PNG o WebP, de 5 MB cada una. La primera será la portada. Los cambios se aplican al guardar.',
    limit: 'Puedes añadir hasta 6 fotos.',
    format: 'Usa fotos JPG, PNG o WebP.',
    size: 'Cada foto debe pesar hasta 5 MB y no estar vacía.',
    saveFailed:
      'El objeto se guardó, pero no pudimos completar los cambios de fotos. Reintenta guardar; las fotos completadas se conservarán.',
    preview: 'Foto {index}',
    remove: 'Quitar foto {index}',
    removeButton: 'Quitar',
  },
  uploads: {
    errors: {
      NOT_CONFIGURED:
        'La carga de archivos aún no está disponible porque Cloudinary no forma parte del contrato backend vigente.',
    },
  },
  analysis: {
    title: 'Análisis asistido con IA',
    run: 'Analizar evidencias',
    rerun: 'Volver a analizar',
    running: 'Analizando…',
    needsPhotos:
      'Se necesitan fotografías iniciales y finales para ejecutar la comparación.',
    disclaimer:
      'Resultado solo de apoyo: no determina responsabilidades, no crea incidencias ni afecta la garantía.',
    confidence: 'Confianza del análisis: {level}',
    confidenceLevels: { LOW: 'baja', MODERATE: 'moderada', HIGH: 'alta' },
    findings: {
      NO_VISIBLE_CHANGES:
        'No se detectan cambios visibles entre el estado inicial y el final.',
      MINOR_SURFACE_MARKS:
        'Posibles marcas superficiales menores; requiere revisión humana.',
      MISSING_ACCESSORY:
        'Podría faltar un accesorio visible en las fotos iniciales.',
      VISIBLE_DAMAGE: 'Se observa un posible daño visible.',
    },
    messages: {
      IDLE: 'Compara las fotos de entrega y devolución para detectar posibles cambios.',
      ANALYZING: 'El servicio de IA está comparando las evidencias…',
      SUCCESS: 'Análisis completado.',
      TIMEOUT:
        'El servicio de IA no respondió a tiempo. El préstamo continúa con normalidad; puedes reintentar.',
      ERROR:
        'El análisis no está disponible por ahora. Esto no bloquea la devolución ni la resolución.',
    },
    outcomes: {
      SUCCESS: 'Análisis exitoso',
      TIMEOUT: 'Tiempo agotado',
      ERROR: 'Error del servicio',
    },
  },
  incidentTypes: {
    DAMAGE: 'Daño',
    LOSS: 'Pérdida',
    LATE_RETURN: 'Retraso en la devolución',
    NON_RETURN: 'No devolución',
    OTHER: 'Otro problema',
  },
  incidentDecisions: {
    NO_IMPACT: {
      title: 'Sin afectación',
      detail: 'Devolver la garantía completa',
    },
    PARTIAL: {
      title: 'Afectación parcial',
      detail: 'Aplicar un monto y devolver el saldo',
    },
    TOTAL: {
      title: 'Afectación total',
      detail: 'Aplicar toda la garantía disponible',
    },
  },
  incidents: {
    listGap:
      'El backend no ofrece una lista de incidencias para estudiantes. Puedes reportar una incidencia y abrir su detalle inmediato, pero no se mostrará un historial inventado.',
    eyebrow: 'Confianza y seguridad',
    title: 'Incidencias',
    description:
      'Reporta daños, pérdidas, retrasos u otros problemas y sigue su estado hasta la resolución.',
    report: 'Reportar incidencia',
    newTitle: 'Nueva incidencia',
    newHint:
      'Puedes reportar problemas aunque no se vean en las fotos, como fallas de funcionamiento.',
    noEligibleLoans:
      'No tienes préstamos en curso sobre los cuales reportar una incidencia.',
    loan: 'Préstamo relacionado',
    type: 'Tipo de incidencia',
    descriptionLabel: 'Describe lo ocurrido',
    descriptionHint:
      'Incluye fechas, coordinaciones previas y cualquier detalle útil. Mínimo 20 caracteres.',
    evidenceLabel: 'Evidencias de la incidencia (opcional)',
    guaranteeHoldNotice:
      'Al registrarla, la garantía quedará retenida hasta la resolución del equipo de LendUp.',
    submit: 'Registrar incidencia',
    emptyTitle: 'No tienes incidencias',
    emptyDescription: 'Tus préstamos no registran situaciones pendientes.',
    reportedBy: 'Reportada por {name} · {date}',
    back: 'Volver a incidencias',
    notFound: 'Incidencia no encontrada',
    linkedLoan: 'Incidencia asociada a un préstamo',
    holdBanner:
      'La garantía permanece retenida mientras se revisa esta incidencia.',
    reporterStatement: 'Declaración de quien reporta',
    counterpartyStatement: 'Declaración de la contraparte',
    noStatement: 'La contraparte aún no registró su declaración.',
    progress: 'Seguimiento',
    openLoan: 'Ver préstamo',
    evidence: 'Evidencias de la incidencia',
    resolution: 'Resolución administrativa',
    capturedAmount: 'Monto aplicado de la garantía',
    refundedAmount: 'Saldo devuelto al prestatario',
    resolvedAt: 'Fecha de resolución',
    resolvedBy: 'Resuelta por',
    yourStatement: 'Tu declaración',
    yourStatementTitle: 'Cuenta tu versión de los hechos',
    statementLabel: 'Declaración',
    saveStatement: 'Guardar declaración',
  },
  admin: {
    loanDataGap:
      'El backend permite listar esta incidencia, pero no entrega al administrador el préstamo ni el saldo de garantía asociado. La resolución permanece bloqueada hasta contar con esos datos autoritativos.',
    eyebrow: 'Administración',
    title: 'Bandeja de incidencias',
    description:
      'Revisa evidencias, condiciones y declaraciones para resolver cada incidencia.',
    statusFilter: 'Filtrar por estado',
    all: 'Todas',
    allTypes: 'Todos los tipos',
    date: 'Fecha de reporte',
    search: 'Buscar',
    searchPlaceholder: 'ID, préstamo u objeto',
    order: 'Orden',
    newest: 'Más recientes primero',
    oldest: 'Más antiguas primero',
    results: '{count} incidencias',
    columns: {
      id: 'ID',
      object: 'Objeto',
      type: 'Tipo',
      reporter: 'Reportada por',
      date: 'Fecha',
      guarantee: 'Garantía',
      status: 'Estado',
      actions: 'Acciones',
    },
    review: 'Revisar',
    emptyTitle: 'No hay incidencias con estos filtros',
    emptyDescription: 'Cambia o limpia los filtros para ver otros registros.',
    back: 'Volver a la bandeja',
    startReview: 'Iniciar revisión',
    availableGuarantee: 'Disponible para una posible afectación: {amount}',
    agreement: 'Acuerdo confirmado',
    agreedPeriod: 'Periodo acordado',
    loanStatus: 'Estado del préstamo',
    loanTimeline: 'Trazabilidad del préstamo',
    notes: 'Notas de revisión',
    noNotes: 'Aún no hay notas de revisión.',
    newNote: 'Nueva nota',
    addNote: 'Agregar nota',
    startToNote: 'Inicia la revisión para registrar notas.',
    resolution: 'Resolución',
    resolutionTitle: 'Decisión sobre la garantía',
    amount: 'Monto a aplicar (máximo {max})',
    justification: 'Justificación de la decisión',
    justificationHint:
      'Explica la decisión con base en las evidencias y condiciones. Mínimo 20 caracteres.',
    aiReminder:
      'El análisis de IA es solo información de apoyo: la decisión final es tuya.',
    resolve: 'Resolver incidencia',
    confirmTitle: 'Confirmar resolución',
    confirmDescription:
      '{decision}: se aplicarán {captured} de la garantía y se devolverán {refunded} al prestatario. Ambas partes serán notificadas.',
  },
  calendar: {
    eyebrow: 'Tu agenda',
    title: 'Calendario',
    description:
      'Entregas, devoluciones y pagos pendientes de tus reservas y préstamos.',
    previous: 'Periodo anterior',
    next: 'Periodo siguiente',
    today: 'Hoy',
    view: 'Vista del calendario',
    views: { month: 'Mes', week: 'Semana', day: 'Día' },
    legend: {
      delivery: 'Entrega',
      return: 'Devolución',
      reminder: 'Pendiente',
    },
    events: { delivery: 'Entrega programada', return: 'Devolución programada' },
    eventsCount: '{count} operaciones',
    selectedDay: 'Día seleccionado',
    noEventsDay: 'No hay operaciones programadas para este día.',
    emptyTitle: 'No tienes operaciones programadas',
    emptyDescription:
      'Cuando tengas reservas confirmadas o préstamos, verás aquí sus fechas de entrega y devolución.',
  },
  reminders: {
    eyebrow: 'Próximas obligaciones',
    title: 'Recordatorios',
    empty: 'No tienes recordatorios próximos.',
    emptyTitle: 'Sin recordatorios',
    PAYMENT_DUE: {
      title: 'Paga la tarifa y la garantía',
      message: 'Completa el pago de {item} antes de la entrega.',
    },
    DELIVERY: {
      title: 'Entrega programada',
      message: 'Prepara {item} para entregarlo en el punto acordado.',
    },
    RECEIPT: {
      title: 'Confirma la recepción',
      message: 'Confirma que recibiste {item} para activar el préstamo.',
    },
    RETURN: {
      title: 'Devolución próxima',
      message: 'Devuelve {item} en la fecha y lugar acordados.',
    },
    RETURN_RECEIPT: {
      title: 'Recibe la devolución',
      message: 'Revisa y confirma la devolución de {item}.',
    },
  },
  notifications: {
    eyebrow: 'Actividad',
    title: 'Notificaciones y recordatorios',
    description:
      'Los eventos que ya ocurrieron y tus próximas obligaciones se muestran por separado.',
    happened: 'Lo que ocurrió',
    listTitle: 'Notificaciones',
    markAll: 'Marcar todas como leídas',
    onlyUnread: 'Solo sin leer ({count})',
    unread: 'Sin leer',
    empty: 'No tienes notificaciones.',
    emptyTitle: 'Estás al día',
    emptyDescription: 'No tienes notificaciones para mostrar.',
    events: {
      REQUEST_CREATED: {
        title: 'Nueva solicitud',
        message: 'Recibiste una solicitud para {item}.',
      },
      REQUEST_CANCELLED: {
        title: 'Solicitud cancelada',
        message: 'El prestatario canceló su solicitud para {item}.',
      },
      REQUEST_ACCEPTED: {
        title: 'Solicitud aceptada',
        message:
          'Tu reserva de {item} fue confirmada. Completa el pago y la garantía.',
      },
      REQUEST_REJECTED: {
        title: 'Solicitud rechazada',
        message: 'El prestamista no pudo aceptar tu solicitud para {item}.',
      },
      RESERVATION_CANCELLED: {
        title: 'Reserva cancelada',
        message: 'La reserva de {item} fue cancelada. Motivo: {reason}',
      },
      PAYMENT_CONFIRMED: {
        title: 'Pago confirmado',
        message: 'El pago de la tarifa de {item} fue aprobado.',
      },
      PAYMENT_FAILED: {
        title: 'Pago no confirmado',
        message: 'El pago de {item} no se completó. Vuelve a intentarlo.',
      },
      GUARANTEE_HELD: {
        title: 'Garantía constituida',
        message: 'La garantía de {item} quedó constituida.',
      },
      GUARANTEE_FAILED: {
        title: 'Garantía no confirmada',
        message: 'La garantía de {item} no se completó. Vuelve a intentarlo.',
      },
      DELIVERY_REGISTERED: {
        title: 'Entrega registrada',
        message: 'Se registró la entrega de {item}. Confirma que lo recibiste.',
      },
      RECEIPT_CONFIRMED: {
        title: 'Recepción confirmada',
        message: 'El préstamo de {item} ya está activo.',
      },
      RENTAL_RELEASED: {
        title: 'Tarifa liberada',
        message: 'Se liberó a tu favor la tarifa de {item}.',
      },
      EXTENSION_REQUESTED: {
        title: 'Solicitud de extensión',
        message: 'El prestatario pidió extender el préstamo de {item}.',
      },
      EXTENSION_ACCEPTED_PAYMENT_PENDING: {
        title: 'Extensión aceptada',
        message:
          'Paga el costo adicional de {item} para aplicar la nueva fecha.',
      },
      EXTENSION_ACCEPTED: {
        title: 'Extensión aceptada',
        message: 'La nueva fecha de devolución de {item} ya está vigente.',
      },
      EXTENSION_REJECTED: {
        title: 'Extensión rechazada',
        message: 'Se mantiene la fecha de devolución de {item}.',
      },
      EXTENSION_PAYMENT_CONFIRMED: {
        title: 'Extensión pagada',
        message: 'La nueva fecha de devolución de {item} ya está vigente.',
      },
      RESCHEDULE_PROPOSED: {
        title: 'Nueva fecha propuesta',
        message:
          'El prestamista propone reprogramar la devolución de {item} sin costo.',
      },
      RESCHEDULE_ACCEPTED: {
        title: 'Reprogramación aceptada',
        message: 'La nueva fecha de devolución de {item} ya está vigente.',
      },
      RESCHEDULE_REJECTED: {
        title: 'Reprogramación rechazada',
        message: 'Se mantiene la fecha de devolución de {item}.',
      },
      RETURN_REGISTERED: {
        title: 'Devolución registrada',
        message: 'Revisa las evidencias y confirma la devolución de {item}.',
      },
      EARLY_RETURN_REGISTERED: {
        title: 'Devolución anticipada',
        message:
          'Se devolvió {item} antes de la fecha acordada. Revisa y confirma.',
      },
      RETURN_CONFIRMED_PENDING_INCIDENT: {
        title: 'Devolución confirmada',
        message: 'La garantía de {item} espera la resolución de la incidencia.',
      },
      LOAN_COMPLETED: {
        title: 'Préstamo finalizado',
        message: 'El préstamo de {item} terminó. ¡Califica tu experiencia!',
      },
      LOAN_OVERDUE: {
        title: 'Préstamo vencido',
        message: 'La devolución de {item} está vencida.',
      },
      INCIDENT_CREATED: {
        title: 'Incidencia reportada',
        message: 'Se reportó la incidencia {incidentId} sobre {item}.',
      },
      INCIDENT_ADMIN_NEW: {
        title: 'Nueva incidencia',
        message: 'La incidencia {incidentId} espera revisión.',
      },
      INCIDENT_UNDER_REVIEW: {
        title: 'Incidencia en revisión',
        message:
          'El equipo de LendUp comenzó a revisar la incidencia {incidentId}.',
      },
      INCIDENT_RESOLVED: {
        title: 'Incidencia resuelta',
        message:
          'Ya está disponible la resolución de la incidencia {incidentId}.',
      },
      RATING_RECEIVED: {
        title: 'Nueva calificación',
        message: 'Recibiste una calificación por el préstamo de {item}.',
      },
    },
  },
  timeline: {
    DELIVERY_RECORDED: 'Entrega registrada por el prestamista',
    RECEIPT_PENDING: 'Confirmación de recepción',
    RECEIPT_CONFIRMED: 'Recepción confirmada · préstamo activo',
    RETURN_RECORDED: 'Devolución registrada',
    EARLY_RETURN_RECORDED: 'Devolución anticipada registrada',
    RETURN_CONFIRMATION_PENDING: 'Confirmación de la devolución',
    RETURN_CONFIRMED_PENDING_INCIDENT:
      'Devolución confirmada · incidencia pendiente',
    LOAN_COMPLETED: 'Préstamo finalizado',
    LOAN_OVERDUE: 'Fecha de devolución vencida',
    INCIDENT_REPORTED: 'Incidencia registrada',
    INCIDENT_REVIEW: 'Revisión administrativa',
    INCIDENT_RESOLVED: 'Resolución registrada',
  },
  transactionTypes: {
    RENTAL_PAYMENT: 'Pago de tarifa',
    RENTAL_RELEASE: 'Tarifa transferida al prestamista',
    GUARANTEE_HOLD: 'Garantía constituida',
    GUARANTEE_RELEASE: 'Devolución de garantía',
    GUARANTEE_PARTIAL_CAPTURE: 'Afectación parcial por incidencia',
    GUARANTEE_CAPTURE: 'Afectación total por incidencia',
    REFUND: 'Reembolso por cancelación',
    EXTENSION_PAYMENT: 'Pago de extensión',
  },
  transactions: {
    eyebrow: 'Actividad económica',
    title: 'Transacciones',
    description:
      'Pagos, garantías, liberaciones, devoluciones y reembolsos asociados a tus operaciones.',
    export: 'Descargar CSV',
    filterType: 'Tipo de operación',
    allTypes: 'Todos los tipos',
    totals: {
      paid: 'Pagado en tarifas',
      received: 'Recibido como prestamista',
      held: 'Garantías retenidas',
    },
    columns: {
      date: 'Fecha',
      type: 'Operación',
      item: 'Objeto',
      amount: 'Monto',
      status: 'Estado',
      method: 'Medio',
      reference: 'Referencia del proveedor',
      actions: 'Acciones',
    },
    related: {
      reservation: 'Ver reserva',
      loan: 'Ver préstamo',
      incident: 'Ver incidencia {id}',
    },
    openOperation: 'Abrir operación relacionada',
    emptyTitle: 'No tienes transacciones',
    emptyDescription:
      'Tus pagos, garantías y reembolsos aparecerán aquí cuando realices operaciones.',
    csv: {
      date: 'Fecha',
      type: 'Operación',
      item: 'Objeto',
      amount: 'Monto (PEN)',
      method: 'Medio',
      status: 'Estado',
      reference: 'Referencia',
      reservation: 'Reserva',
      loan: 'Préstamo',
      incident: 'Incidencia',
    },
  },
  dashboard: {
    eyebrow: 'Panel personal',
    adminEyebrow: 'Panel de administración',
    greeting: 'Hola, {name}',
    description: 'Esto es lo más importante de tus operaciones hoy.',
    adminDescription: 'Supervisa las incidencias que requieren revisión.',
    explore: 'Explorar objetos',
    openInbox: 'Abrir bandeja',
    nextAction: 'Tu próxima acción',
    nextPay: 'Completa el pago de tu reserva',
    nextRequests: 'Tienes {count} solicitud(es) por responder',
    reviewNow: 'Revisar ahora',
    allClear: 'Estás al día. No tienes acciones pendientes.',
    summary: 'Resumen de tu actividad',
    metrics: {
      activeLoans: 'Préstamos en curso',
      pendingRequests: 'Solicitudes por responder',
      reservations: 'Reservas confirmadas',
      listings: 'Objetos publicados',
      incidents: 'Incidencias abiertas',
    },
    agenda: 'Agenda',
    upcomingReminders: 'Próximos recordatorios',
    viewCalendar: 'Ver calendario',
    activity: 'Actividad',
    recentNotifications: 'Notificaciones recientes',
    viewAll: 'Ver todas',
  },
  profile: {
    eyebrow: 'Cuenta',
    title: 'Mi perfil',
    description:
      'Tu identidad universitaria y tu reputación en la comunidad LendUp.',
    edit: 'Editar perfil',
    editTitle: 'Editar perfil',
    editDescription:
      'Actualiza tu foto, datos académicos y teléfono de contacto.',
    avatar: 'Foto de perfil',
    avatarPreview: 'Vista previa de la foto de perfil',
    phoneHint:
      'Solo se comparte con tu contraparte durante una reserva o préstamo vigente.',
    readonlyNote:
      'Tu nombre, universidad y correo institucional no se pueden modificar desde este formulario porque identifican tu perfil en el backend.',
    cycle: 'ciclo {cycle}',
    verified: 'Estudiante verificado',
    notVerified: 'Verificación pendiente',
    verification: 'Estado de verificación',
    privacyNote: 'Tu correo y teléfono no aparecen en tu perfil público.',
    reputation: 'Reputación',
    ratingsSummary:
      '{count} calificación(es) · {loans} préstamo(s) finalizado(s)',
    distribution: 'Distribución de calificaciones',
    ratingsOrigin:
      'Las calificaciones provienen únicamente de préstamos finalizados en LendUp.',
    completedLoans: 'Préstamos finalizados',
    comments: 'Comentarios',
    commentsTitle: 'Experiencias de la comunidad',
    noComment: 'Calificación sin comentario.',
    noReviews:
      'Aún no hay comentarios. Aparecerán después de préstamos finalizados.',
    viewPublic: 'Ver mi perfil público',
    terms: 'Términos y condiciones',
    publicEyebrow: 'Perfil público',
    publicDescription:
      'Verificación y reputación dentro de la comunidad LendUp.',
    notFound: 'Perfil no encontrado',
  },
  terms: {
    loadFailed:
      'No pudimos cargar los términos. Reintenta para leerlos y aceptarlos.',
    versionLabel: 'Versión vigente: {version}',
    verifyFirst: 'Verifica tu correo antes de aceptar los términos.',
    eyebrow: 'Términos y condiciones',
    title: 'Términos y condiciones de LendUp',
    description:
      'Reglas para prestar y solicitar objetos dentro de la comunidad universitaria.',
    disclaimer: {
      body: 'LendUp facilita el acuerdo entre estudiantes, pero no garantiza el estado ni el funcionamiento de los objetos. Revisa el objeto al recibirlo y documenta su estado con evidencias.',
    },
    acceptLabel:
      'Leí y acepto los términos y condiciones y el descargo de responsabilidad de LendUp.',
    accept: 'Aceptar y continuar',
    alreadyAccepted: 'Ya aceptaste la versión vigente de los términos.',
    loginToAccept:
      'Puedes leer los términos sin iniciar sesión. Para aceptarlos necesitas ingresar a tu cuenta.',
    adminNotice:
      'Las cuentas administrativas no requieren aceptar los términos de estudiantes.',
    gate: {
      title: 'Antes de tu primera operación',
      description: 'Revisa y acepta los términos y condiciones para continuar.',
    },
  },
  maps: {
    open: 'Abrir en Google Maps',
    embedTitle: 'Mapa de {place}',
  },
  httpErrors: {
    BAD_REQUEST: 'La solicitud no es válida.',
    UNAUTHENTICATED: 'La sesión expiró. Vuelve a iniciar sesión.',
    FORBIDDEN: 'No tienes autorización para realizar esta operación.',
    NOT_FOUND: 'El recurso solicitado no existe.',
    CONFLICT: 'La operación entra en conflicto con el estado actual.',
    VALIDATION_ERROR: 'Revisa los datos enviados.',
    SERVER_ERROR: 'El backend no pudo completar la operación.',
    NETWORK_ERROR: 'No fue posible conectar con el backend.',
    UNKNOWN: 'Ocurrió un error inesperado en la solicitud.',
  },
  errors: {
    notFound: {
      title: 'Página no encontrada',
      description:
        'El enlace que abriste no existe o no tienes acceso a este contenido.',
    },
  },
  results: {
    auth: {
      signedIn: 'Sesión iniciada.',
      registered: 'Cuenta creada correctamente.',
    },
    verification: {
      sent: 'La solicitud de verificación quedó registrada y está pendiente.',
      notAllowed: 'No es posible verificar esta cuenta.',
    },
    profile: { saved: 'Perfil actualizado correctamente.' },
    terms: {
      accepted: 'Aceptaste los términos y condiciones.',
      loginRequired: 'Inicia sesión para aceptar los términos.',
    },
    gate: {
      verificationRequired:
        'Completa la verificación de estudiante antes de realizar esta operación.',
      termsRequired:
        'Acepta los términos y condiciones antes de realizar esta operación.',
      forbidden: 'No tienes permiso para realizar esta acción.',
    },
    listing: {
      published: 'Objeto publicado.',
      updated:
        'Publicación actualizada. Los cambios aplican a nuevas solicitudes.',
    },
    availability: {
      created: 'Intervalo de disponibilidad agregado.',
      updated: 'Intervalo de disponibilidad actualizado.',
      deleted: 'Intervalo de disponibilidad eliminado.',
    },
    request: {
      created:
        'Solicitud enviada. Te avisaremos cuando el prestamista responda.',
      cancelled: 'Solicitud cancelada.',
      accepted:
        'Solicitud aceptada: se creó la reserva y se bloqueó el periodo.',
      rejected: 'Solicitud rechazada.',
      listingUnavailable:
        'La publicación no está disponible para nuevas solicitudes.',
      ownListing: 'No puedes solicitar tu propio objeto.',
      invalidRange: 'La fecha final debe ser posterior a la inicial.',
      pastStart: 'El periodo debe comenzar en el futuro.',
      periodTaken: 'Ese periodo ya fue reservado por otra solicitud.',
    },
    reservation: {
      cancelled:
        'Reserva cancelada. Se liberó el periodo y se procesaron los reembolsos que correspondían.',
      cancelNotAllowed:
        'La reserva ya no puede cancelarse porque el objeto fue entregado.',
      reasonRequired: 'Indica el motivo de la cancelación.',
    },
    payment: {
      guaranteePending:
        'La solicitud de garantía fue registrada y permanece pendiente de confirmación.',
    },
    delivery: {
      recorded:
        'Entrega registrada. Avisamos al prestatario para que confirme la recepción.',
      notAllowed: 'Esta reserva no admite un nuevo registro de entrega.',
      paymentRequired:
        'El pago de la tarifa debe estar aprobado antes de la entrega.',
      guaranteeRequired:
        'La garantía debe estar constituida antes de la entrega.',
    },
    loan: {
      receiptConfirmed: 'Recepción confirmada: el préstamo está activo.',
    },
    extension: {
      requested:
        'Extensión solicitada. La fecha vigente no cambia hasta que se acepte.',
      accepted: 'Extensión aceptada y fecha actualizada.',
      acceptedPaymentPending:
        'Extensión aceptada. Se aplicará cuando el prestatario pague el costo adicional.',
      rejected: 'Extensión rechazada.',
      paid: 'Extensión pagada. La nueva fecha de devolución está vigente.',
      notActive:
        'Solo puedes extender un préstamo activo y que no esté vencido.',
      alreadyPending: 'Ya existe una extensión pendiente para este préstamo.',
      mustBeLater: 'La nueva fecha debe ser posterior a la devolución vigente.',
      overlaps:
        'La nueva fecha se superpone con otra reserva confirmada del objeto.',
      nothingToPay: 'No hay una extensión pendiente de pago.',
    },
    reschedule: {
      proposed: 'Propuesta enviada al prestatario.',
      accepted: 'Reprogramación aceptada. La nueva fecha está vigente.',
      rejected: 'Reprogramación rechazada. Se mantiene la fecha vigente.',
      notActive:
        'Solo puedes reprogramar un préstamo activo y que no esté vencido.',
      alreadyPending: 'Ya existe una propuesta pendiente.',
      mustBeFuture: 'Selecciona una fecha futura.',
      sameDate: 'La fecha propuesta es igual a la vigente.',
      overlaps: 'La fecha propuesta se superpone con otra reserva confirmada.',
    },
    return: {
      recorded:
        'Devolución registrada. Avisamos al prestamista para que la confirme.',
      confirmedCompleted:
        'Devolución confirmada. El préstamo finalizó y la garantía fue devuelta.',
      confirmedPendingIncident:
        'Devolución confirmada. La garantía espera la resolución de la incidencia.',
      notAllowed:
        'El préstamo no admite registrar la devolución en su estado actual.',
      notesRequired:
        'Describe el estado del objeto con al menos 10 caracteres.',
      evidenceRequired: 'Adjunta al menos una evidencia final.',
    },
    incident: {
      reported:
        'Incidencia registrada. La garantía quedó retenida hasta su resolución.',
      statementSaved: 'Declaración guardada.',
      reviewStarted: 'Revisión iniciada. Se notificó a ambas partes.',
      noteSaved: 'Nota guardada.',
      resolved: 'Incidencia resuelta. Se notificó a ambas partes.',
      loanClosed:
        'No se pueden reportar incidencias sobre un préstamo finalizado.',
      descriptionRequired: 'Describe la incidencia con al menos 20 caracteres.',
      statementRequired: 'La declaración debe tener al menos 20 caracteres.',
      noteRequired: 'La nota debe tener al menos 5 caracteres.',
      reviewRequired: 'La incidencia debe estar en revisión para resolverla.',
      justificationRequired:
        'La justificación debe tener al menos 20 caracteres.',
      invalidAmount:
        'El monto debe ser mayor que cero y no superar la garantía disponible.',
      invalidAmountDetail: 'Ingresa un monto mayor que cero y hasta {max}.',
    },
    rating: {
      saved: '¡Gracias! Tu calificación fue registrada.',
      alreadyRated: 'Ya calificaste este préstamo.',
      notAllowed:
        'Solo los participantes de un préstamo finalizado pueden calificar.',
      invalidStars: 'Selecciona entre 1 y 5 estrellas.',
    },
  },
};
